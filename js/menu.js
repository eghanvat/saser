import { SB, SUPA } from './saser.js'

const params = new URLSearchParams(window.location.search);
const contextType = params.get('type'); // 'table' or 'room' or null
const contextNum = params.get('num');
let cart = [];

// Static fallback shown if Supabase isn't configured yet, or the fetch fails.


const root = document.getElementById('menu-root');
const loading = $('#status');

function slugify(text) {
  return text.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Menu Loading */
async function loadMenu() {

  const configured = SUPA.URL.startsWith("http") && SUPA.ANON_KEY.length > 10;

  if (contextType && contextNum) {
    const b = document.getElementById('context-banner');
    b.style.display = 'block';
    b.textContent = contextType === 'table' ? `Ordering for Table ${contextNum}` : `Room service — Room ${contextNum}`;
  }

  if (!configured) {
    statusEl.textContent = "Showing sample menu — connect Supabase to show live items.";
    render(FALLBACK_MENU);
    return;
  }

  try {
    const res = await fetch(
      `${SUPA.URL}/rest/v1/menu_items?vendor_id=eq.${SUPA.VENDOR_ID}&select=*,menu_categories(name,sort_order)&order=category_id`,
      {
        headers: {
          "apikey": SUPA.ANON_KEY,
          "Authorization": `Bearer ${SUPA.ANON_KEY}`
        }
      }
    );
    if (!res.ok) throw new Error("Fetch failed: " + res.status);

    const items = await res.json();

    if (!items.length) throw new Error("No items returned");

    // Group flat item list by category name
    const grouped = {};
    items.forEach(item => {
      const catName = item.menu_categories?.name || "Menu";
      if (!grouped[catName]) grouped[catName] = [];
      grouped[catName].push(item);
    });
    const categories = Object.keys(grouped).map(name => ({ category: name, items: grouped[name] }));

    loading.remove();
    render(categories);
  } catch (err) {
    loading.text("Live menu unavailable right now — showing sample menu.");
    render(FALLBACK_MENU);
    console.error(err);
  }
}

function render(categories) {
  root.innerHTML = "";

  // Build the category jump-nav
  const navBar = document.getElementById('category-nav');
  navBar.innerHTML = "";
  categories.forEach(cat => {
    const slug = slugify(cat.category);
    const btn = document.createElement('button');
    btn.textContent = cat.category;
    btn.onclick = () => document.getElementById(slug).scrollIntoView({ behavior: 'smooth', block: 'start' });
    navBar.appendChild(btn);
  });

  categories.forEach(cat => {
    const slug = slugify(cat.category);
    const section = document.createElement('div');
    section.className = 'category';
    section.id = slug;
    section.innerHTML = `
      <div class="category-header">
        <div>
          <h2>${cat.category}</h2>
          <p class="count">${cat.items.length} item${cat.items.length === 1 ? '' : 's'}</p>
        </div>
        <a class="back-to-top" onclick="document.getElementById('category-nav').scrollIntoView({behavior:'smooth', block:'start'})">↑ Back</a>
      </div>
    `;

    cat.items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'item' + (item.is_available === false ? ' unavailable' : '');

      const orderingOn = item.is_available !== false;
      const inCart = cart.find(c => c.item_id === item.id);
      const qty = inCart ? inCart.qty : 0;

      const priceBlock = orderingOn
        ? `<div class="item-price">
             ₹${item.price}
             <div class="qty-control" id="qty-${item.id}">
               ${qty > 0 ? `
                 <button onclick="changeQty('${item.id}', -1,'','', event)">−</button>
                 <span>${qty}</span>
                 <button onclick="changeQty('${item.id}', 1, '${item.name}', ${item.price}, event)">+</button>
               ` : `
                 <button onclick="changeQty('${item.id}', 1, '${item.name}', ${item.price}, event)">+</button>
               `}
             </div>
           </div>`
        : `<div class="item-price">₹${item.price}</div>`;

      row.innerHTML = `
        <div class="item-main">
          <div class="item-name-row">
            <span class="dot ${item.is_veg ? 'veg' : 'nonveg'}"></span>
            <span class="item-name">${item.name}</span>
          </div>
          ${item.description ? `<p class="item-desc">${item.description}</p>` : ""}
        </div>
        ${priceBlock}
      `;
      section.appendChild(row);
    })

    root.appendChild(section);
  });
}

function changeQty(id, delta, name, price, event) {
  let existing = cart.find(c => c.item_id === id);
  if (!existing && delta > 0) {
    cart.push({ item_id: id, name, price, qty: 1 });
  } else if (existing) {
    existing.qty += delta;
    if (existing.qty <= 0) cart = cart.filter(c => c.item_id !== id);
  }

  renderCartBar();
  animateOrder(id, delta, name, price, event);
  refreshQtyDisplay(id);
  renderCartDropdown();

}

function animateOrder(id, delta, name, price, event) {
  var el = event.target;
  var barB = $('#cart-bar').offset().top;

  var original = $(el).closest('div.item');
  var clone = original.clone().addClass('item-clone');
  clone.find('.item-price').remove();

  let offset = original.offset();
  let width = original.outerWidth();
  let height = original.outerHeight();
  let topD = offset.top;

  clone.css({
    'top': offset.top + 'px',
    'left': offset.left + 'px',
    'width': width + 'px',
  }).appendTo('body');

  if (delta <= 0) {
    shatter(clone, barB);
    return;
  }
  original.addClass('shake-element').on('animationend', function () {
    $(this).removeClass('shake-element');

    clone.css({
      'display': 'flex',
    });

    setTimeout(function () {
      clone.css({
        'transform': `translateY(-${topD - barB}px)`
      })
    }, 10);

    clone.one('transitionend', function () {
      this.remove();
    });
  });
}

function shatter(clone, barB) {

  clone.attr('id', 'shatter-target');

  clone.css({
    'top': barB + 'px',
  });

  clone.css({
    'display': 'block',
  });

  var h = $(window).height() / 2

  setTimeout(function () {
    clone.css({
      'transform': `translateY(${h}px)`
    })
  }, 10)

  clone.one('transitionend', function () {
    clone.trigger('click');
  })

  $('#shatter-target').on('click', function () {
    let target = $(this);
    let width = target.outerWidth();
    let height = target.outerHeight();
    let offset = target.offset();

    // Define grid layout (e.g., 5 rows, 5 columns = 25 shards)
    let rows = 5;
    let cols = 5;
    let shardW = width / cols;
    let shardH = height / rows;

    // 1. Generate the breaking pieces
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let shard = $('<div class="shard"></div>');

        // Position each piece exactly where it belongs inside the block
        shard.css({
          width: shardW + 'px',
          height: shardH + 'px',
          top: (offset.top + (r * shardH)) + 'px',
          left: (offset.left + (c * shardW)) + 'px',
        });

        $('body').append(shard);

        // 2. Explode the shard on the very next render frame
        setTimeout(function () {
          // Generate completely random explosion directions (X and Y trajectories)
          let randX = (Math.random() - 0.5) * 400; // Scatter left or right up to 200px
          let randY = (Math.random() - 0.5) * 400; // Scatter up or down up to 200px
          let randRot = (Math.random() - 0.5) * 720; // Spin up to 360 degrees

          shard.css({
            'transform': `translate(${randX}px, ${randY}px) rotate(${randRot}deg) scale(0)`,
            'opacity': '0'
          });
        }, 10);

        // 3. Clean up the DOM by deleting the shards when done
        shard.one('transitionend', function () {
          $(this).remove();
        });
      }
    }

    // 4. Hide the original box completely as it breaks
    target.remove();
  });
}
window.changeQty = changeQty;

function refreshQtyDisplay(id) {
  const el = document.getElementById(`qty-${id}`);
  if (!el) return;
  const item = cart.find(c => c.item_id === id);
  const qty = item ? item.qty : 0;
  // Re-fetch name/price from cart item if present, else leave button as +1 starter
  const name = item ? item.name : '';
  const price = item ? item.price : 0;
  el.innerHTML = qty > 0
    ? `<button onclick="changeQty('${id}', -1,'','',event)">−</button>
      <span>${qty}</span><button onclick="changeQty('${id}', 1, '${name}', ${price}, event)">+</button>`
    : `<button onclick="changeQty('${id}', 1, '${name}', ${price}, event)">+</button>`;
}


function renderCartBar() {
  const bar = $('#cart-bar');
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const count = cart.reduce((s, c) => s + c.qty, 0);

  if (!count) {
    bar.removeClass('visible');
    $('body').removeClass('has-cart');
    $('cart-dropdown').removeClass('open');
    return;
  }

  bar.addClass('visible');
  $('body').addClass('has-cart');
  bar.html(`
    <span>${count} item · ₹${total}</span>
    <div class="btn-group">
      <button class="view-btn" onclick="toggleCartDropdown()">My Orders</button>
    </div>
    <div class="btn-order">
      <button class="order-btn">Place order</button>
    </div>
    `);
  renderCartDropdown();
}

function renderCartDropdown() {
  const drop = $('#cart-dropdown');
  if (!cart.length) {
    drop.html(`<div class="drop-item" style="border:none; justify-content:center; color:#8a8570;">Cart is empty</div>`);
    return;
  }
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  drop.html(cart.map(c => `
    <div class="drop-item">
      <span>${c.name}</span>
      <div class="drop-qty">
        <button onclick="changeQty('${c.item_id}', -1)">−</button>
        <span>${c.qty}</span>
        <button onclick="changeQty('${c.item_id}', 1, '${c.name}', ${c.price})">+</button>
        <span class="drop-price">₹${c.price * c.qty}</span>
      </div>
    </div>
  `).join('') + `
    <div class="drop-total">
      <span>Total</span>
      <span>₹${total}</span>
    </div>
    <button class="order-btn"">Place order</button>
    <div class="drop-close"><button class="close-btn" onclick="toggleCartDropdown()">Close</button></div>
  `)
}

window.renderCartDropdown = renderCartDropdown;
window.toggleCartDropdown = toggleCartDropdown;

function toggleCartDropdown() {
  $('#cart-dropdown').toggleClass('open');
}

$(document).on("click", ".order-btn", placeOrder);

async function placeOrder() {
  let type = contextType;
  let num = contextNum;
  type = 'table';
  num = 1;
  /*if (!type) {
    const choice = prompt("Is this for a Table or a Room? Type 'table' or 'room':");
    if (!choice) return;
    type = choice.trim().toLowerCase();
    num = prompt(`Enter your ${type} number:`);
    if (!num) return;
  }*/


  try {
    const orderRes = await fetch(`${SUPA.URL}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        apikey: SUPA.ANON_KEY, Authorization: `Bearer ${SUPA.ANON_KEY}`,
        'Content-Type': 'application/json', Prefer: 'return=representation'
      },
      body: JSON.stringify({
        vendor_id: SUPA.VENDOR_ID,
        source_type: type,
        table_number: type === 'table' ? Number(num) : null,
        room_number: type === 'room' ? num : null
      })
    });

    if (!orderRes.ok) throw new Error(`Order insert failed: ${orderRes.status} ${await orderRes.text()}`);
    const [order] = await orderRes.json();
    if (!order) throw new Error("No order returned from Supabase");

    const items = cart.map(c => ({ order_id: order.id, item_id: c.item_id, item_name: c.name, price: c.price, quantity: c.qty }));
    const itemsRes = await fetch(`${SUPA.URL}/rest/v1/order_items`, {
      method: 'POST',
      headers: { apikey: SUPA.ANON_KEY, Authorization: `Bearer ${SUPA.ANON_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(items)
    });

    if (!itemsRes.ok) throw new Error(`Order items insert failed: ${itemsRes.status} ${await itemsRes.text()}`);

    cart = [];
    window.location.href = `order-status.html?order=${order.id}`;
  } catch (err) {
    console.error(err);
    alert("Couldn't place your order. Please try again — " + err.message);
  }
}

loadMenu();

