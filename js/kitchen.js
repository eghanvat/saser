import { SB, SUPA } from './saser.js'
let currentFilter = 'active';
const root = $('#orders-root');

document.querySelectorAll('#tabs button').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('#tabs button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    loadOrders();
  };
});


async function init() {
  const session = loggedIn;
  if (!session) return;
  showStartButton();
  //el('staff-email').textContent = session.user.email;
  loadOrders();
  setInterval(loadOrders, 8000);
}


async function loadOrders() {
  try {
    const token = window.session?.access_token || SUPA.ANON_KEY;
    const res = await fetch(
      `${SUPA.URL}/rest/v1/orders?vendor_id=eq.${SUPA.VENDOR_ID}&select=*,order_items(*),order_customers(email,full_name)&order=created_at.desc`,
      { headers: { apikey: SUPA.ANON_KEY, Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error(await res.text());
    let orders = await res.json();
    const placed = orders.filter(o => o.status === 'placed');
    placed.forEach(o => ring(o));                       // catches anything Realtime missed
    for (const id of [...pending.keys()])               // order handled elsewhere (list button, other phone)
      if (!placed.some(o => o.id === id)) pending.delete(id);
    if (started) { if (pending.size) rendera(); else clearAlert(); }

    if (currentFilter === 'active') {
      orders = orders.filter(o => o.status !== 'ready' && o.status !== 'cancelled');
    } else {
      orders = orders.filter(o => o.status === currentFilter);
    }

    render(orders);
  } catch (err) {
    console.error(err);
    root.html(`<div class="empty">Couldn't load orders.</div>`);
  }
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function render(orders) {
  if (!orders.length) {
    root.html(`<div class="empty">No orders here.</div>`);
    return;
  }
  root.html(orders.map(o => {
    const c = [].concat(o.order_customers || [])[0];
    const who = c ? esc(c.full_name ? `${c.full_name} (${c.email})` : c.email) : 'not logged in';
    const loc = o.table_number ? `Table ${o.table_number}` : o.room_number ? `Room ${o.room_number}` : `Order #${o.id.slice(0, 8)}`;
    const time = new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const items = o.order_items || [];
    const itemsHtml = items.map(i => `
        <div class="${i.cancelled ? 'cancelled-item' : ''}">
          <span>${i.item_name} × ${i.quantity}</span>
          <span>${i.cancelled ? 'cancelled' : '₹' + i.price * i.quantity}</span>
        </div>
      `).join('');

    let actions = '';
    if (o.status === 'placed') {
      actions = `
          <button class="btn-prepare" onclick="setStatus('${o.id}','preparing')">Start preparing</button>
          <button class="btn-cancel" onclick="setStatus('${o.id}','cancelled')">Cancel</button>
        `;
    } else if (o.status === 'preparing') {
      actions = `<button class="btn-ready" onclick="setStatus('${o.id}','ready')">Mark ready</button>`;
    }

    return `
        <div class="order-card ${o.status}">
          <div class="order-head">
          <div class="order-who">Ordered by: ${who}</div>
            <span class="order-loc">${loc}</span>
            <span class="order-time">${time}</span>
          </div>
          <span class="badge ${o.status}">${o.status}</span>
          ${o.delivery_requested ? `<span class="badge deliver">Bring now</span>` : ''}
          <div class="order-items">${itemsHtml}</div>
          <div class="order-actions">${actions}</div>
        </div>
      `;
  }).join(''));
}

async function setStatus(orderId, status) {
  const body = { status };
  if (status === 'preparing') body.started_at = new Date().toISOString();
  try {
    const res = await fetch(`${SUPA.URL}/rest/v1/orders?id=eq.${orderId}`, {
      method: 'PATCH',
      headers: { apikey: SUPA.ANON_KEY, Authorization: `Bearer ${SUPA.ANON_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await res.text());
    loadOrders();
  } catch (err) {
    console.error(err);
    alert("Couldn't update order — try again.");
  }
}

window.setStatus = setStatus;
let ctx, siren, wakeLock, chan, started = false;
const pending = new Map();   // id -> order
const handled = new Set();   // accepted ids, never re-ring

function showStartButton() {
  const b = document.createElement('button');
  b.textContent = 'START SHIFT\n(tap to turn on sound + alerts)';
  b.style.cssText = 'position:fixed;inset:0;z-index:10000;width:100%;border:0;background:#111;color:#fff;font:700 24px sans-serif;white-space:pre';
  b.onclick = async () => { b.remove(); await startShift(SB); };
  document.body.appendChild(b);
}

export async function startShift(SB) {
  if (started) return;
  started = true;
  ctx = new (window.AudioContext || window.webkitAudioContext)();   // inside the tap
  await ctx.resume();
  try { wakeLock = await navigator.wakeLock.request('screen'); } catch (e) { console.warn('wakeLock', e.message); }

  // inaudible tone helps keep the tab alive in background
  const keep = ctx.createOscillator(), g = ctx.createGain();
  keep.frequency.value = 20; g.gain.value = 0.001;
  keep.connect(g).connect(ctx.destination); keep.start();

  const subscribe = () => {
    chan = SB.channel('orders-alert')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `vendor_id=eq.${SUPA.VENDOR_ID}` },
        (p) => ring(p.new))
      .subscribe((s) => {
        console.log('realtime:', s);
        if (s === 'CHANNEL_ERROR' || s === 'CLOSED' || s === 'TIMED_OUT') {
          SB.removeChannel(chan); setTimeout(subscribe, 2000);
        }
      });
  };
  subscribe();

  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible') return;
    try { wakeLock = await navigator.wakeLock.request('screen'); } catch { }
    await ctx.resume();
    loadOrders();                 // polling path rings anything missed
  });

  try { await enableAlerts(SB); } catch (e) { console.error('push', e); }
}

function ring(order) {
  if (!started || pending.has(order.id) || handled.has(order.id)) return;
  pending.set(order.id, order);
  rendera();
  startSiren();
}

function clearAlert() {
  stopSiren();
  document.getElementById('order-alert')?.remove();
}

function startSiren() {
  if (siren) return;
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = 'square'; gain.gain.value = 1;
  osc.connect(gain).connect(ctx.destination); osc.start();
  let hi = false;
  const t = setInterval(() => {
    osc.frequency.value = (hi = !hi) ? 960 : 660;
    navigator.vibrate?.([300, 100, 300]);
  }, 450);
  siren = { osc, t };
}
function stopSiren() {
  if (!siren) return;
  clearInterval(siren.t); siren.osc.stop(); siren = null;
}

function rendera() {
  let box = document.getElementById('order-alert');
  if (!box) {
    box = document.createElement('div');
    box.id = 'order-alert';
    box.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#c00;color:#fff;' +
      'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font:700 28px sans-serif';
    document.body.appendChild(box);
  }
  box.innerHTML = '';
  pending.forEach((o) => {
    const b = document.createElement('button');
    b.textContent = `NEW ORDER: ${o.source_type === 'room' ? 'Room ' + o.room_number : 'Table ' + o.table_number} - TAP TO ACCEPT`;
    b.style.cssText = 'padding:24px;font-size:24px;border-radius:12px;border:0;width:90%';
    b.onclick = async () => {
      handled.add(o.id);
      pending.delete(o.id);
      if (pending.size) rendera(); else clearAlert();
      await setStatus(o.id, 'preparing');
    };
    box.appendChild(b);
  });
}
const VAPID_PUBLIC = 'BPmn7LIS4UxbO42npEQicdwLMNtEETW7JRpVu-NiUVPz2suW-cztEtBy8L1tLW4WtZkEPHLG8C0sbpmAXglrpL0';

const toUint8 = (b64) => {
  const p = '='.repeat((4 - (b64.length % 4)) % 4);
  const s = atob((b64 + p).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...s].map((c) => c.charCodeAt(0)));
};

export async function enableAlertss(supabase) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return alert('Push not supported');
  if ((await Notification.requestPermission()) !== 'granted') return alert('Allow notifications');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return console.warn('not logged in, push not saved');

  const reg = await navigator.serviceWorker.register('./sw.js');   // was '/sw.js'
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ||
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toUint8(VAPID_PUBLIC) }));

  const j = sub.toJSON();
  const { error } = await supabase.from('push_subscriptions').upsert(
    { user_id: user.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth },
    { onConflict: 'endpoint' },
  );
  if (error) console.error(error);
}

export async function enableAlerts(supabase) {
  const say = (m) => { console.log(m); alert(m); };
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return say('1: push not supported');

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return say('2: permission = ' + perm);

  const { data: { user }, error: ue } = await supabase.auth.getUser();
  if (!user) return say('3: NOT LOGGED IN on SB: ' + (ue?.message || 'no session'));

  let reg;
  try { reg = await navigator.serviceWorker.register('./sw.js'); }
  catch (e) { return say('4: sw.js failed: ' + e.message); }
  await navigator.serviceWorker.ready;

  let sub;
  try {
    sub = (await reg.pushManager.getSubscription()) ||
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toUint8(VAPID_PUBLIC) }));
  } catch (e) { return say('5: subscribe failed: ' + e.message); }

  const j = sub.toJSON();
  const { error } = await supabase.from('push_subscriptions').upsert(
    { user_id: user.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth },
    { onConflict: 'endpoint' },
  );
  say(error ? '6: save failed: ' + error.message : 'OK: push enabled');
}
init();