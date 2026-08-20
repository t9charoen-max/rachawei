/**
 * ราชาหวายสุรินทร์ — ระบบเมนู / ตะกร้า / ชำระเงิน / แอดมิน
 */
(function () {
  const { SHOP, CATEGORIES, DEFAULT_PRODUCTS, DELIVERY_ZONES, STORAGE_KEYS } =
    window.RachaweiConfig;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const state = {
    view: 'menu',
    category: 'ทั้งหมด',
    products: loadProducts(),
    cart: loadCart(),
    orders: loadOrders(),
    adminUnlocked: localStorage.getItem(STORAGE_KEYS.admin) === '1',
    selectedId: null,
    lastOrder: null,
  };

  /* —— Storage —— */
  function loadProducts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.products);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch (_) {}
    return structuredClone(DEFAULT_PRODUCTS);
  }

  function saveProducts() {
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(state.products));
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.cart);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return {};
  }

  function saveCart() {
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(state.cart));
  }

  function loadOrders() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.orders);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return [];
  }

  function saveOrders() {
    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(state.orders));
  }

  /* —— Helpers —— */
  function formatPrice(n) {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      maximumFractionDigits: 0,
    }).format(n);
  }

  function phoneDigits() {
    return SHOP.phone.replace(/\D/g, '');
  }

  function lineUrl() {
    return `https://line.me/ti/p/~${SHOP.lineId}`;
  }

  function cartCount() {
    return Object.values(state.cart).reduce((s, q) => s + q, 0);
  }

  function cartLines() {
    return Object.entries(state.cart)
      .map(([id, qty]) => {
        const product = state.products.find((p) => p.id === id && p.active !== false);
        if (!product || qty <= 0) return null;
        return {
          product,
          quantity: qty,
          lineTotal: product.price * qty,
        };
      })
      .filter(Boolean);
  }

  function cartSubtotal() {
    return cartLines().reduce((s, l) => s + l.lineTotal, 0);
  }

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('is-show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('is-show'), 2200);
  }

  function setCartQty(productId, qty) {
    const product = state.products.find((p) => p.id === productId);
    if (!product) return;
    const next = Math.max(0, Math.min(qty, product.stock));
    if (next <= 0) delete state.cart[productId];
    else state.cart[productId] = next;
    saveCart();
    renderChrome();
    if (state.view === 'menu') renderMenu();
    if (state.view === 'cart' || state.view === 'pay') {
      renderCart();
      renderPay();
    }
  }

  function addToCart(productId, delta = 1) {
    const current = state.cart[productId] || 0;
    setCartQty(productId, current + delta);
    if (delta > 0) toast('เพิ่มลงตะกร้าแล้ว');
  }

  /* —— PromptPay payload (EMVCo) —— */
  function tlv(id, value) {
    const len = String(value.length).padStart(2, '0');
    return id + len + value;
  }

  function crc16(payload) {
    let crc = 0xffff;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
        crc &= 0xffff;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  function toPromptPayTarget(id) {
    const digits = String(id).replace(/\D/g, '');
    if (digits.length >= 13 && digits.length <= 15) {
      return { tag: '02', value: digits };
    }
    let mobile = digits;
    if (mobile.startsWith('0')) mobile = '66' + mobile.slice(1);
    mobile = mobile.padStart(13, '0');
    return { tag: '01', value: mobile };
  }

  function buildPromptPayPayload(promptPayId, amount) {
    const target = toPromptPayTarget(promptPayId);
    const merchant = tlv('00', 'A000000677010111') + tlv(target.tag, target.value);
    let data =
      tlv('00', '01') +
      tlv('01', amount != null ? '12' : '11') +
      tlv('29', merchant) +
      tlv('53', '764') +
      tlv('58', 'TH');
    if (amount != null && amount > 0) {
      data += tlv('54', Number(amount).toFixed(2));
    }
    data += '6304';
    return data + crc16(data);
  }

  function qrImageUrl(payload) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encodeURIComponent(payload)}`;
  }

  /* —— Views —— */
  function setView(view) {
    state.view = view;
    $$('.view').forEach((el) => el.classList.toggle('is-active', el.dataset.view === view));
    $$('.nav-item').forEach((el) => el.classList.toggle('is-active', el.dataset.view === view));
    if (view === 'menu') renderMenu();
    if (view === 'cart') renderCart();
    if (view === 'pay') renderPay();
    if (view === 'admin') renderAdmin();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderChrome() {
    const count = cartCount();
    const badge = $('#cart-badge');
    if (badge) {
      badge.hidden = count === 0;
      badge.textContent = String(count);
    }
    $$('.nav-item[data-view="cart"]').forEach((el) => {
      el.classList.toggle('has-items', count > 0);
    });
  }

  function renderMenu() {
    const chips = $('#category-chips');
    chips.innerHTML = CATEGORIES.map(
      (c) =>
        `<button type="button" class="chip${c === state.category ? ' is-active' : ''}" data-cat="${c}">${c}</button>`,
    ).join('');

    const list = state.products.filter((p) => {
      if (p.active === false) return false;
      if (state.category === 'ทั้งหมด') return true;
      if (state.category === 'พิเศษ') return Boolean(p.special);
      return p.category === state.category;
    });

    const grid = $('#product-grid');
    if (!list.length) {
      grid.innerHTML =
        '<div class="empty-state" style="grid-column:1/-1"><strong>ไม่พบสินค้า</strong>ลองเปลี่ยนหมวดหมู่</div>';
      return;
    }

    grid.innerHTML = list
      .map((p) => {
        const qty = state.cart[p.id] || 0;
        return `
        <article class="product-card" data-id="${p.id}">
          <div class="product-media" data-open="${p.id}">
            <img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy" />
            ${p.special ? '<span class="product-badge">พิเศษ</span>' : ''}
          </div>
          <div class="product-body">
            <h3 class="product-name">${escapeHtml(p.name)}</h3>
            <div class="product-meta">
              <span class="product-price">${formatPrice(p.price)}</span>
              <span class="product-unit">/ ${escapeHtml(p.unit)}</span>
            </div>
            <div class="product-actions">
              ${
                qty === 0
                  ? `<button type="button" class="btn btn-primary btn-sm btn-block" data-add="${p.id}">ใส่ตะกร้า</button>`
                  : `<div class="qty-control" style="width:100%;justify-content:space-between">
                      <button type="button" data-dec="${p.id}" aria-label="ลด">−</button>
                      <span>${qty}</span>
                      <button type="button" data-inc="${p.id}" aria-label="เพิ่ม">+</button>
                    </div>`
              }
            </div>
          </div>
        </article>`;
      })
      .join('');
  }

  function renderCart() {
    const lines = cartLines();
    const box = $('#cart-lines');
    const summary = $('#cart-summary');

    if (!lines.length) {
      box.innerHTML =
        '<div class="empty-state"><strong>ตะกร้าว่าง</strong>เลือกสินค้าจากเมนูเพื่อเริ่มสั่งซื้อ</div>';
      summary.hidden = true;
      return;
    }

    summary.hidden = false;
    box.innerHTML = lines
      .map(
        ({ product: p, quantity, lineTotal }) => `
      <div class="cart-line">
        <img class="cart-thumb" src="${p.image}" alt="" />
        <div class="cart-line-info">
          <h4>${escapeHtml(p.name)}</h4>
          <p>${formatPrice(p.price)} / ${escapeHtml(p.unit)}</p>
          <div class="qty-control" style="margin-top:8px">
            <button type="button" data-dec="${p.id}">−</button>
            <span>${quantity}</span>
            <button type="button" data-inc="${p.id}">+</button>
          </div>
        </div>
        <div class="cart-line-total">${formatPrice(lineTotal)}</div>
      </div>`,
      )
      .join('');

    $('#cart-subtotal').textContent = formatPrice(cartSubtotal());
    $('#cart-count-label').textContent = `${lines.length} รายการ`;
  }

  function renderPay() {
    const lines = cartLines();
    const empty = $('#pay-empty');
    const form = $('#pay-form');
    const done = $('#pay-done');

    if (state.lastOrder) {
      empty.hidden = true;
      form.hidden = true;
      done.hidden = false;
      const order = state.lastOrder;
      $('#pay-done-detail').innerHTML = `
        <div class="success-banner">บันทึกคำสั่งซื้อแล้ว — แจ้งร้านผ่าน LINE หรือโทรยืนยันหลังโอน</div>
        <p><strong>เลขที่</strong> ${escapeHtml(order.id)}</p>
        <p><strong>ยอดรวม</strong> ${formatPrice(order.total)}</p>
        <div class="pay-qr">
          <img src="${qrImageUrl(buildPromptPayPayload(SHOP.promptPayId, order.total))}" alt="PromptPay QR" />
          <div class="amount">${formatPrice(order.total)}</div>
          <div class="hint">PromptPay · ${SHOP.promptPayId}<br/>${escapeHtml(SHOP.promptPayName)}</div>
        </div>
        <div class="contact-links" style="margin-top:14px">
          <a class="btn btn-primary" href="${lineOrderUrl(order)}" target="_blank" rel="noopener">ส่งออเดอร์เข้า LINE</a>
          <a class="btn btn-ghost" href="tel:${phoneDigits()}">โทร ${SHOP.phone}</a>
          <button type="button" class="btn btn-ghost" id="pay-new-order">สั่งซื้อใหม่</button>
        </div>`;
      return;
    }

    done.hidden = true;
    if (!lines.length) {
      empty.hidden = false;
      form.hidden = true;
      return;
    }

    empty.hidden = true;
    form.hidden = false;

    const zoneSel = $('#delivery-zone');
    zoneSel.innerHTML =
      '<option value="">เลือกโซนจัดส่ง</option>' +
      DELIVERY_ZONES.map((z) => `<option value="${z.id}">${z.name} (+${formatPrice(z.fee)})</option>`).join(
        '',
      );

    const zoneId = zoneSel.dataset.selected || '';
    if (zoneId) zoneSel.value = zoneId;

    updatePaySummary();
  }

  function updatePaySummary() {
    const zoneId = $('#delivery-zone').value;
    $('#delivery-zone').dataset.selected = zoneId;
    const zone = DELIVERY_ZONES.find((z) => z.id === zoneId);
    const sub = cartSubtotal();
    const fee = zone ? zone.fee : 0;
    const total = sub + fee;

    $('#pay-subtotal').textContent = formatPrice(sub);
    $('#pay-fee').textContent = zone ? formatPrice(fee) : '—';
    $('#pay-total').textContent = formatPrice(total);

    const qrWrap = $('#pay-preview-qr');
    if (zone && total > 0) {
      qrWrap.hidden = false;
      qrWrap.innerHTML = `
        <img src="${qrImageUrl(buildPromptPayPayload(SHOP.promptPayId, total))}" alt="PromptPay QR" />
        <div class="amount">${formatPrice(total)}</div>
        <div class="hint">สแกนจ่าย PromptPay · ${SHOP.promptPayId}</div>`;
    } else {
      qrWrap.hidden = true;
      qrWrap.innerHTML = '';
    }
  }

  function lineOrderUrl(order) {
    const lines = order.items
      .map((i, idx) => `${idx + 1}. ${i.name} × ${i.quantity} = ${formatPrice(i.lineTotal)}`)
      .join('\n');
    const text = [
      `สวัสดีครับ/ค่า สั่งซื้อจาก${SHOP.name}`,
      `เลขที่: ${order.id}`,
      '',
      lines,
      '',
      `ยอดสินค้า: ${formatPrice(order.subtotal)}`,
      `ค่าส่ง (${order.zoneName}): ${formatPrice(order.fee)}`,
      `รวม: ${formatPrice(order.total)}`,
      '',
      `ชื่อ: ${order.customerName}`,
      `โทร: ${order.customerPhone}`,
      `ที่อยู่: ${order.customerAddress}`,
      order.note ? `หมายเหตุ: ${order.note}` : '',
      '',
      'โอน PromptPay แล้ว จะแจ้งสลิปให้ครับ/ค่า',
    ]
      .filter(Boolean)
      .join('\n');
    return `https://line.me/ti/p/~${SHOP.lineId}?text=${encodeURIComponent(text)}`;
  }

  function submitOrder(e) {
    e.preventDefault();
    const lines = cartLines();
    if (!lines.length) {
      toast('ตะกร้าว่าง');
      return;
    }

    const customerName = $('#customer-name').value.trim();
    const customerPhone = $('#customer-phone').value.trim();
    const customerAddress = $('#customer-address').value.trim();
    const note = $('#customer-note').value.trim();
    const zoneId = $('#delivery-zone').value;
    const zone = DELIVERY_ZONES.find((z) => z.id === zoneId);

    if (!customerName || !customerPhone || !customerAddress || !zone) {
      toast('กรอกข้อมูลให้ครบ');
      return;
    }

    const subtotal = cartSubtotal();
    const order = {
      id: 'RW-' + Date.now().toString(36).toUpperCase(),
      createdAt: new Date().toISOString(),
      customerName,
      customerPhone,
      customerAddress,
      note,
      zoneId: zone.id,
      zoneName: zone.name,
      fee: zone.fee,
      subtotal,
      total: subtotal + zone.fee,
      status: 'pending',
      items: lines.map(({ product, quantity, lineTotal }) => ({
        id: product.id,
        name: product.name,
        quantity,
        unitPrice: product.price,
        lineTotal,
      })),
    };

    state.orders.unshift(order);
    saveOrders();

    // ลดสต็อก
    order.items.forEach((item) => {
      const p = state.products.find((x) => x.id === item.id);
      if (p) p.stock = Math.max(0, p.stock - item.quantity);
    });
    saveProducts();

    state.cart = {};
    saveCart();
    state.lastOrder = order;
    renderChrome();
    renderPay();
    toast('สร้างคำสั่งซื้อแล้ว');
  }

  /* —— Admin —— */
  function renderAdmin() {
    const gate = $('#admin-gate');
    const panel = $('#admin-panel');

    if (!state.adminUnlocked) {
      gate.hidden = false;
      panel.hidden = true;
      return;
    }

    gate.hidden = true;
    panel.hidden = false;

    const list = $('#admin-products');
    list.innerHTML = state.products
      .map(
        (p) => `
      <div class="admin-product" data-admin-id="${p.id}">
        <div class="admin-product-row">
          <img src="${p.image}" alt="" />
          <div>
            <strong>${escapeHtml(p.name)}</strong>
            <div style="font-size:0.8rem;color:var(--ink-faint)">${escapeHtml(p.category)}${p.special ? ' · พิเศษ' : ''}</div>
          </div>
        </div>
        <div class="admin-fields">
          <div class="field">
            <label>ราคา</label>
            <input type="number" min="0" data-field="price" value="${p.price}" />
          </div>
          <div class="field">
            <label>สต็อก</label>
            <input type="number" min="0" data-field="stock" value="${p.stock}" />
          </div>
        </div>
        <div class="admin-toolbar">
          <button type="button" class="btn btn-sm btn-primary" data-save-product="${p.id}">บันทึก</button>
          <button type="button" class="btn btn-sm btn-ghost" data-toggle-active="${p.id}">
            ${p.active === false ? 'เปิดขาย' : 'ซ่อน'}
          </button>
          <button type="button" class="btn btn-sm btn-danger" data-delete-product="${p.id}">ลบ</button>
        </div>
      </div>`,
      )
      .join('');

    const ordersBox = $('#admin-orders');
    if (!state.orders.length) {
      ordersBox.innerHTML = '<p class="empty-state" style="padding:16px 0">ยังไม่มีออเดอร์</p>';
    } else {
      ordersBox.innerHTML = state.orders
        .slice(0, 20)
        .map(
          (o) => `
        <div class="order-card">
          <h4>${escapeHtml(o.id)} · ${formatPrice(o.total)}</h4>
          <p>${escapeHtml(o.customerName)} · ${escapeHtml(o.customerPhone)}</p>
          <p>${new Date(o.createdAt).toLocaleString('th-TH')} · ${escapeHtml(o.zoneName)}</p>
          <span class="order-status">${escapeHtml(o.status)}</span>
        </div>`,
        )
        .join('');
    }
  }

  function tryUnlockAdmin(e) {
    e.preventDefault();
    const pin = $('#admin-pin').value.trim();
    if (pin === SHOP.adminPin) {
      state.adminUnlocked = true;
      localStorage.setItem(STORAGE_KEYS.admin, '1');
      toast('เข้าสู่โหมดแอดมิน');
      renderAdmin();
    } else {
      toast('PIN ไม่ถูกต้อง');
    }
  }

  function lockAdmin() {
    state.adminUnlocked = false;
    localStorage.removeItem(STORAGE_KEYS.admin);
    $('#admin-pin').value = '';
    renderAdmin();
    toast('ออกจากโหมดแอดมินแล้ว');
  }

  function resetCatalog() {
    if (!confirm('รีเซ็ตสินค้ากลับค่าเริ่มต้น?')) return;
    state.products = structuredClone(DEFAULT_PRODUCTS);
    saveProducts();
    renderAdmin();
    toast('รีเซ็ตสินค้าแล้ว');
  }

  function addProduct() {
    const id = 'p-' + Date.now().toString(36);
    state.products.unshift({
      id,
      name: 'สินค้าใหม่',
      description: 'รายละเอียดสินค้า',
      category: 'ทรงกลม',
      special: false,
      price: 0,
      unit: 'ชิ้น',
      stock: 0,
      image: `${window.RachaweiConfig.IMAGE_BASE}/basket-05-collection.jpg`,
      active: true,
    });
    saveProducts();
    renderAdmin();
    toast('เพิ่มสินค้าแล้ว — แก้ราคา/ชื่อได้');
  }

  /* —— Detail modal —— */
  function openDetail(id) {
    const p = state.products.find((x) => x.id === id);
    if (!p) return;
    state.selectedId = id;
    const modal = $('#product-modal');
    modal.classList.add('is-open');
    $('#modal-img').src = p.image;
    $('#modal-img').alt = p.name;
    $('#modal-title').textContent = p.name;
    $('#modal-desc').textContent = p.description;
    $('#modal-price').textContent = `${formatPrice(p.price)} / ${p.unit}`;
    $('#modal-add').dataset.add = p.id;
  }

  function closeDetail() {
    $('#product-modal').classList.remove('is-open');
    state.selectedId = null;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* —— Events —— */
  function onClick(e) {
    if (e.target.id === 'product-modal') {
      closeDetail();
      return;
    }

    const t = e.target.closest('[data-view], [data-cat], [data-add], [data-inc], [data-dec], [data-open], [data-save-product], [data-toggle-active], [data-delete-product], #pay-new-order, #admin-lock, #admin-reset, #admin-add, #modal-close, #hero-shop, #hero-contact');
    if (!t) return;

    if (t.id === 'hero-shop') {
      document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (t.id === 'hero-contact') {
      setView('pay');
      return;
    }
    if (t.id === 'modal-close') {
      closeDetail();
      return;
    }
    if (t.dataset.view) {
      setView(t.dataset.view);
      return;
    }
    if (t.dataset.cat) {
      state.category = t.dataset.cat;
      renderMenu();
      return;
    }
    if (t.dataset.open) {
      openDetail(t.dataset.open);
      return;
    }
    if (t.dataset.add) {
      addToCart(t.dataset.add, 1);
      return;
    }
    if (t.dataset.inc) {
      addToCart(t.dataset.inc, 1);
      return;
    }
    if (t.dataset.dec) {
      addToCart(t.dataset.dec, -1);
      return;
    }
    if (t.id === 'pay-new-order') {
      state.lastOrder = null;
      $('#pay-form-el')?.reset();
      renderPay();
      setView('menu');
      return;
    }
    if (t.id === 'admin-lock') {
      lockAdmin();
      return;
    }
    if (t.id === 'admin-reset') {
      resetCatalog();
      return;
    }
    if (t.id === 'admin-add') {
      addProduct();
      return;
    }
    if (t.dataset.saveProduct) {
      const id = t.dataset.saveProduct;
      const row = t.closest('[data-admin-id]');
      const price = Number($('[data-field="price"]', row).value);
      const stock = Number($('[data-field="stock"]', row).value);
      const p = state.products.find((x) => x.id === id);
      if (p) {
        p.price = Math.max(0, price);
        p.stock = Math.max(0, Math.floor(stock));
        saveProducts();
        toast('บันทึกแล้ว');
      }
      return;
    }
    if (t.dataset.toggleActive) {
      const p = state.products.find((x) => x.id === t.dataset.toggleActive);
      if (p) {
        p.active = p.active === false;
        saveProducts();
        renderAdmin();
      }
      return;
    }
    if (t.dataset.deleteProduct) {
      if (!confirm('ลบสินค้านี้?')) return;
      state.products = state.products.filter((x) => x.id !== t.dataset.deleteProduct);
      delete state.cart[t.dataset.deleteProduct];
      saveProducts();
      saveCart();
      renderChrome();
      renderAdmin();
      toast('ลบแล้ว');
    }
  }

  function initHero() {
    const bg = $('#hero-bg');
    if (bg) bg.style.backgroundImage = `url("${SHOP.heroImage}")`;
    $('#shop-phone-link').href = `tel:${phoneDigits()}`;
    $('#shop-phone-link').textContent = SHOP.phone;
    $('#shop-line-link').href = lineUrl();
    $('#shop-map-link').href = SHOP.mapUrl;
    $('#shop-hours').textContent = SHOP.hours;
    $('#shop-location').textContent = SHOP.location;
    $$('.brand-name').forEach((el) => {
      el.textContent = SHOP.shortName;
    });
  }

  function init() {
    initHero();
    renderChrome();
    setView('menu');

    document.addEventListener('click', onClick);
    $('#pay-form-el')?.addEventListener('submit', submitOrder);
    $('#delivery-zone')?.addEventListener('change', updatePaySummary);
    $('#admin-gate-form')?.addEventListener('submit', tryUnlockAdmin);

    // Deep link ?admin=1
    const params = new URLSearchParams(location.search);
    if (params.get('admin') === '1' || location.hash === '#admin') {
      setView('admin');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
