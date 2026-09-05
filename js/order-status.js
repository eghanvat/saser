
  const SUPABASE_URL = "https://rysxztcnnfxtuikymvyd.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_9F7WBGfcVF9lYrEx9x7l_w_8hjhNNmq";
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
  }

  function formatTime(s){
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }

  function startCountdown(){
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

  async function loadOrder(){
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=*,order_items(*)`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const [order] = await res.json();
      if (!order) throw new Error("Order not found");
      renderOrder(order);
    } catch (err) {
      console.error(err);
    }
  }

  function renderOrder(order){
    el('order-meta').textContent = order.table_number
      ? `Table ${order.table_number}` : order.room_number
      ? `Room ${order.room_number}` : `Order #${order.id.slice(0,8)}`;

    const items = order.order_items || [];
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    el('items-list').innerHTML = items.map(i => `
      <div class="order-item">
        <span>${i.item_name} × ${i.quantity}</span>
        <span>₹${i.price * i.quantity}</span>
      </div>
    `).join('');
    el('order-total').style.display = 'flex';
    el('order-total').innerHTML = `<span>Total</span><span>₹${total}</span>`;

    if (order.status === 'cancelled') {
      clearInterval(countdownTimer);
      clearInterval(pollTimer);
      el('status-card').classList.add('cancelled');
      el('spinner').style.display = 'none';
      el('status-label').textContent = "Order cancelled";
      el('status-sub').textContent = "This order was cancelled.";
      el('countdown').style.display = 'none';
      el('cancel-btn').style.display = 'none';
    } else if (order.status === 'ready') {
      clearInterval(countdownTimer);
      clearInterval(pollTimer);
      el('spinner').style.display = 'none';
      el('status-label').textContent = "Order ready";
      el('status-sub').textContent = "Enjoy your meal!";
      el('countdown').style.display = 'none';
      el('cancel-btn').style.display = 'none';
    }
  }

  async function cancelOrder(){
    if (!confirm("Cancel this order?")) return;
    el('cancel-btn').disabled = true;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
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

