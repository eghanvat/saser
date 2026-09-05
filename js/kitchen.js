  let currentFilter = 'active';
  const root = document.getElementById('orders-root');

  document.querySelectorAll('#tabs button').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#tabs button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      loadOrders();
    };
  });

async function checkAuth(){
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    window.location.href = 'login.html?redirect=kitchen.html';
    return null;
  }
  return session;
}

async function init(){
  const session = await checkAuth();
  if (!session) return;
  document.getElementById('staff-email').textContent = session.user.email;
  loadOrders();
  setInterval(loadOrders, 8000);
}


  async function loadOrders(){
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/orders?vendor_id=eq.${VENDOR_ID}&select=*,order_items(*)&order=created_at.desc`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!res.ok) throw new Error(await res.text());
      let orders = await res.json();

      if (currentFilter === 'active') {
        orders = orders.filter(o => o.status !== 'ready' && o.status !== 'cancelled');
      } else {
        orders = orders.filter(o => o.status === currentFilter);
      }

      render(orders);
    } catch (err) {
      console.error(err);
      root.innerHTML = `<div class="empty">Couldn't load orders.</div>`;
    }
  }

  function render(orders){
    if (!orders.length) {
      root.innerHTML = `<div class="empty">No orders here.</div>`;
      return;
    }
    root.innerHTML = orders.map(o => {
      const loc = o.table_number ? `Table ${o.table_number}` : o.room_number ? `Room ${o.room_number}` : `Order #${o.id.slice(0,8)}`;
      const time = new Date(o.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
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
            <span class="order-loc">${loc}</span>
            <span class="order-time">${time}</span>
          </div>
          <span class="badge ${o.status}">${o.status}</span>
          ${o.delivery_requested ? `<span class="badge deliver">Bring now</span>` : ''}
          <div class="order-items">${itemsHtml}</div>
          <div class="order-actions">${actions}</div>
        </div>
      `;
    }).join('');
  }

  async function setStatus(orderId, status){
    const body = { status };
    if (status === 'preparing') body.started_at = new Date().toISOString();
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
        method:'PATCH',
        headers:{ apikey:SUPABASE_ANON_KEY, Authorization:`Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type':'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(await res.text());
      loadOrders();
    } catch (err) {
      console.error(err);
      alert("Couldn't update order — try again.");
    }
  }

init();
