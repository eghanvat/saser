import { SB, SUPA } from './saser.js';

const ESTIMATED_MINUTES = 20;

const params = new URLSearchParams(window.location.search);
const orderId = params.get('order');
let secondsLeft = ESTIMATED_MINUTES * 60;
let countdownTimer = null;
let pollTimer = null;

const el = id => document.getElementById(id);

if (!orderId) {
  el('status-label').textContent = "No order found";
  el('status-sub').textContent = "Go back to the menu and place an order first.";
  el('spinner').style.display = 'none';
  el('cancel-btn').style.display = 'none';
  el('items-list').textContent = '';
} else {
  loadOrder();
  pollTimer = setInterval(loadOrder, 15000);
  startCountdown();
  el('cancel-btn').onclick = cancelOrder;
  el('bring-btn').onclick = async () => {
    el('bring-btn').disabled = true;
    try {
      await fetch(`${SUPA.URL}/rest/v1/orders?id=eq.${orderId}`, {
        method: 'PATCH',
        headers: {
          apikey: SUPA.ANON_KEY,
          Authorization: `Bearer ${SUPA.ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ delivery_requested: true })
      });
      el('status-sub').textContent = "Staff have been notified";
      el('bring-btn').textContent = "Notified ✓";
    } catch (err) {
      console.error(err);
      el('bring-btn').disabled = false;
      alert("Couldn't notify staff — try again.");
    }
  };

}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function startCountdown() {
  el('countdown').textContent = formatTime(secondsLeft);
  countdownTimer = setInterval(() => {
    if (secondsLeft <= 0) {
      clearInterval(countdownTimer);
      el('status-sub').textContent = "Should be ready any moment";
      return;
    }
    secondsLeft--;
    el('countdown').textContent = formatTime(secondsLeft);
  }, 1000);
}

async function loadOrder() {
  try {
    const res = await fetch(
      `${SUPA.URL}/rest/v1/orders?id=eq.${orderId}&select=*,order_items(*)`,
      { headers: { apikey: SUPA.ANON_KEY, Authorization: `Bearer ${SUPA.ANON_KEY}` } }
    );
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    const data = await res.json();
    const order = data[0];
    if (!order) throw new Error("No order found for id " + orderId);
    renderOrder(order);
  } catch (err) {
    console.error(err);
    el('items-list').textContent = "Couldn't load this order.";
    el('status-label').textContent = "Something went wrong";
    el('status-sub').textContent = err.message;
    el('spinner').style.display = 'none';
    clearInterval(pollTimer);
  }
}

function renderOrder(order) {
  el('order-meta').textContent = order.table_number
    ? `Table ${order.table_number}` : order.room_number
      ? `Room ${order.room_number}` : `Order #${order.id.slice(0, 8)}`;

  const items = order.order_items || [];
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const canCancelItems = order.status === 'placed';
  const activeItems = items.filter(i => !i.cancelled);

  el('items-list').innerHTML = items.map(i => `
    <div class="order-item${i.cancelled ? ' item-cancelled' : ''}">
      <span>${i.item_name} × ${i.quantity}</span>
      <div style="display:flex; align-items:center; gap:10px;">
        <span>₹${i.price * i.quantity}</span>
        ${i.cancelled
      ? `<span class="item-cancelled-tag">Cancelled</span>`
      : canCancelItems
        ? `<button class="item-cancel-btn" onclick="cancelItem('${i.id}')">✕</button>`
        : ``
    }
      </div>
    </div>
  `).join('');

  el('order-total').style.display = 'flex';
  el('order-total').innerHTML = `<span>Total</span><span>₹${total}</span>`;
  const card = el('status-card');
  card.classList.remove('cancelled');

  if (order.status === 'cancelled') {
    clearInterval(countdownTimer); clearInterval(pollTimer);
    card.classList.add('cancelled');
    el('spinner').style.display = 'none';
    el('status-label').textContent = "Order cancelled";
    el('status-sub').textContent = "This order was cancelled.";
    el('countdown').style.display = 'none';
    el('cancel-btn').style.display = 'none';
    el('bring-btn').style.display = 'none';

  } else if (order.status === 'ready') {
    clearInterval(countdownTimer); clearInterval(pollTimer);
    el('spinner').style.display = 'none';
    el('status-label').textContent = "Order ready";
    el('status-sub').textContent = "Your food is ready to go";
    el('countdown').style.display = 'none';
    el('cancel-btn').style.display = 'none';
    el('bring-btn').style.display = 'inline-block';

  } else if (order.status === 'preparing') {
    el('spinner').style.display = 'block';
    el('status-label').textContent = "Preparing your order";
    el('status-sub').textContent = "The kitchen is on it";
    el('cancel-btn').style.display = 'none';
    el('bring-btn').style.display = 'none';
    el('countdown').style.display = 'block';

    if (!countdownTimer) {
      const startedAt = order.started_at ? new Date(order.started_at).getTime() : Date.now();
      secondsLeft = Math.max(0, ESTIMATED_MINUTES * 60 - Math.floor((Date.now() - startedAt) / 1000));
      startCountdown();
    }

  } else {
    el('spinner').style.display = 'block';
    el('status-label').textContent = "Waiting for kitchen";
    el('status-sub').textContent = "Your order has been sent through";
    el('countdown').style.display = 'none';
    el('cancel-btn').style.display = 'inline-block';
    el('bring-btn').style.display = 'none';
  }
}

async function cancelOrder() {
  if (!confirm("Cancel this order?")) return;
  el('cancel-btn').disabled = true;
  try {
    await fetch(`${SUPA.URL}/rest/v1/orders?id=eq.${orderId}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPA.ANON_KEY,
        Authorization: `Bearer ${SUPA.ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({ status: 'cancelled' })
    });
    loadOrder();
  } catch (err) {
    console.error(err);
    el('cancel-btn').disabled = false;
    alert("Couldn't cancel — try again.");
  }
}

async function cancelItem(itemId) {
  if (!confirm("Cancel this item?")) return;
  try {
    await fetch(`${SUPA.URL}/rest/v1/order_items?id=eq.${itemId}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPA.ANON_KEY,
        Authorization: `Bearer ${SUPA.ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cancelled: true })
    });
    loadOrder();
  } catch (err) {
    console.error(err);
    alert("Couldn't cancel item — try again.");
  }
}
