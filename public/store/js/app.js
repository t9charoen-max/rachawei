/**
 * ราชาหวายสุรินทร์ — แอปหลัก (ตะกร้า, ชำระเงิน, แอดมิน, หน้าเพจ)
 * ต้องโหลดหลัง js/config.js
 */
/* SHOP_CONFIG → js/config.js */

    // ========== THEME (Dark Mode) ==========
    (function initThemeEarly() {
      let theme = 'light';
      try {
        theme = localStorage.getItem('rachawei_theme') || theme;
      } catch (e) { /* sandbox */ }
      if (!theme || (theme !== 'dark' && theme !== 'light')) {
        try {
          if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            theme = 'dark';
          }
        } catch (e) {}
      }
      document.documentElement.setAttribute('data-theme', theme);
    })();

    function getTheme() {
      return document.documentElement.getAttribute('data-theme') || 'light';
    }

    function setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      try {
        localStorage.setItem('rachawei_theme', theme);
      } catch (e) { /* ignore sandbox */ }
      // Also persist via IndexedDB when ready
      try {
        if (typeof idbSet === 'function' && typeof dbReady !== 'undefined' && dbReady) {
          idbSet('theme', theme);
        }
      } catch (e) {}
      const btn = document.getElementById('themeBtn');
      if (btn) {
        btn.textContent = theme === 'dark' ? '☀️' : '🌙';
        btn.title = theme === 'dark' ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด';
      }
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.content = theme === 'dark' ? '#1a1612' : '#5c4033';
    }

    function toggleTheme() {
      setTheme(getTheme() === 'dark' ? 'light' : 'dark');
      if (typeof showToast === 'function') {
        showToast(getTheme() === 'dark' ? 'โหมดมืด 🌙' : 'โหมดสว่าง ☀️');
      }
    }

    // ========== DATA ==========
    // รายการสินค้าเริ่มต้น (แก้แล้ว deploy = ทุกคนเห็นถาวร)
    /* DEFAULT_PRODUCTS → js/config.js */

    // ========== PERSISTENT STORAGE (IndexedDB — รูปและข้อมูลถาวร) ==========
    let products = DEFAULT_PRODUCTS.map(p => ({ ...p }));
    let shopVideos = (typeof DEFAULT_SHOP_VIDEOS !== 'undefined' ? DEFAULT_SHOP_VIDEOS : []).map((v) => ({ ...v }));
    let cart = [];
    let orders = [];
    let orderSeq = 1;
    let db = null;
    let dbReady = false;

    const DB_NAME = 'rachawei_surin_db';
    const DB_VER = 1;
    const STORE = 'app';
    const CART_LS_KEY = 'rachawei_cart';
    function hashAdminPin(pin) {
      let h = 5381;
      const s = String(pin || '');
      for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
      return String(h >>> 0);
    }

    function getAdminPinHash() {
      return SHOP_CONFIG.adminPinHash || null;
    }

    function hasAdminPinConfigured() {
      return Boolean(getAdminPinHash());
    }

    function verifyAdminPin(pin) {
      const hash = getAdminPinHash();
      if (!hash) return false;
      return hashAdminPin(pin) === hash;
    }

    function migratePaymentFields() {
      if (SHOP_CONFIG.promptPayNo) return;
      const legacy = String(SHOP_CONFIG.bankAccountNo || '').trim();
      const digits = legacy.replace(/\D/g, '');
      const looksLikePhone = digits.length >= 9 && digits.length <= 10;
      if (legacy && looksLikePhone) {
        SHOP_CONFIG.promptPayNo = legacy;
        SHOP_CONFIG.bankAccountNo = '';
      } else {
        SHOP_CONFIG.promptPayNo = SHOP_CONFIG.phoneDisplay || '';
      }
    }

    function openDB() {
      return new Promise((resolve, reject) => {
        try {
          if (!window.indexedDB) {
            reject(new Error('no indexedDB'));
            return;
          }
          const req = indexedDB.open(DB_NAME, DB_VER);
          req.onupgradeneeded = (e) => {
            const database = e.target.result;
            if (!database.objectStoreNames.contains(STORE)) {
              database.createObjectStore(STORE);
            }
          };
          req.onsuccess = (e) => resolve(e.target.result);
          req.onerror = () => reject(req.error || new Error('idb open failed'));
        } catch (err) {
          reject(err);
        }
      });
    }

    function idbGet(key) {
      return new Promise((resolve, reject) => {
        if (!db) { resolve(null); return; }
        try {
          const tx = db.transaction(STORE, 'readonly');
          const req = tx.objectStore(STORE).get(key);
          req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
          req.onerror = () => reject(req.error);
        } catch (e) {
          reject(e);
        }
      });
    }

    function idbSet(key, value) {
      return new Promise((resolve, reject) => {
        if (!db) { resolve(false); return; }
        try {
          const tx = db.transaction(STORE, 'readwrite');
          const req = tx.objectStore(STORE).put(value, key);
          req.onsuccess = () => resolve(true);
          req.onerror = () => reject(req.error);
        } catch (e) {
          reject(e);
        }
      });
    }

    const PRODUCT_OVERLAY_KEYS = ['price', 'stock', 'size', 'badge', 'desc', 'detail', 'emoji'];

    function mapStoreCatFromCategory(category, storeCat) {
      if (storeCat) return storeCat;
      if (category === 'เก้าอี้') return 'chair';
      return 'basket';
    }

    function catalogItemToStoreProduct(item) {
      const id = Number(item.id);
      if (!Number.isFinite(id)) return null;
      const images = (item.images || []).map((file) =>
        String(file).startsWith('/') ? file : `/products/${file}`,
      );
      const badge = item.badge || (item.special ? 'พิเศษ' : null);
      return {
        id,
        name: item.name,
        cat: mapStoreCatFromCategory(item.category, item.storeCat),
        category: item.category,
        desc: String(item.description || item.desc || '').slice(0, 160),
        detail: item.detail || item.description || item.desc || '',
        price: Number(item.price) || 0,
        stock: item.stock != null ? Number(item.stock) : null,
        size: item.size || '',
        emoji: item.emoji || (item.category === 'เก้าอี้' ? '🪑' : '🧺'),
        badge,
        images,
        image: images[0] || '',
      };
    }

    async function fetchLiveCatalogProducts() {
      const ver = typeof CATALOG_SYNC_VERSION !== 'undefined' ? CATALOG_SYNC_VERSION : 'rachawei-catalog-v2';
      try {
        const res = await fetch(`/catalog/products.json?v=${ver}`, { cache: 'no-cache' });
        if (!res.ok) return null;
        const data = await res.json();
        if (!Array.isArray(data) || !data.length) return null;
        return data
          .map(catalogItemToStoreProduct)
          .filter(Boolean)
          .sort((a, b) => a.id - b.id);
      } catch (e) {
        return null;
      }
    }

    function mergeCatalogWithSaved(catalogList, savedList) {
      const savedById = new Map((savedList || []).map((p) => [Number(p.id), p]));
      return catalogList.map((base) => {
        const saved = savedById.get(Number(base.id));
        if (!saved) return { ...base };
        const overlay = {};
        PRODUCT_OVERLAY_KEYS.forEach((key) => {
          if (saved[key] != null && saved[key] !== '') overlay[key] = saved[key];
        });
        return { ...base, ...overlay };
      });
    }

    function sanitizeCartForProducts() {
      const ids = new Set(products.map((p) => p.id));
      cart = cart.filter((item) => ids.has(Number(item.id)));
    }

    function normalizeCart(raw) {
      if (!Array.isArray(raw)) return [];
      return raw
        .map((item) => ({
          id: Number(item.id),
          qty: Math.max(1, Math.floor(Number(item.qty) || 1)),
        }))
        .filter((item) => Number.isFinite(item.id) && item.qty > 0);
    }

    function loadCartFromLocalStorage() {
      try {
        const raw = localStorage.getItem(CART_LS_KEY);
        if (!raw) return null;
        return normalizeCart(JSON.parse(raw));
      } catch (e) {
        return null;
      }
    }

    function saveCartToLocalStorage() {
      try {
        localStorage.setItem(CART_LS_KEY, JSON.stringify(cart));
      } catch (e) { /* quota / sandbox */ }
    }

    async function loadPersisted() {
      try {
        db = await openDB();
        dbReady = true;
        const savedProducts = await idbGet('products');
        const savedCart = await idbGet('cart');
        const savedOrders = await idbGet('orders');
        const savedSeq = await idbGet('orderSeq');
        const savedTheme = await idbGet('theme');
        const savedShop = await idbGet('shopSettings');
        const savedVideos = await idbGet('shopVideos');
        const savedCatalogVer = await idbGet('catalogSyncVersion');
        const savedVideoVer = await idbGet('videoSyncVersion');

        const catalogBase = await fetchLiveCatalogProducts();
        const baseProducts = (catalogBase && catalogBase.length)
          ? catalogBase
          : DEFAULT_PRODUCTS.map(p => ({ ...p }));
        const needsCatalogResync = savedCatalogVer !== CATALOG_SYNC_VERSION;
        const videoSyncVersion = (typeof VIDEO_SYNC_VERSION !== 'undefined')
          ? VIDEO_SYNC_VERSION
          : 'rachawei-videos-v1';
        const needsVideoResync = savedVideoVer !== videoSyncVersion;

        if (needsCatalogResync || !Array.isArray(savedProducts) || !savedProducts.length) {
          products = baseProducts.map(p => ({ ...p }));
        } else {
          products = mergeCatalogWithSaved(baseProducts, savedProducts);
        }

        if (needsCatalogResync) {
          sanitizeCartForProducts();
          await idbSet('catalogSyncVersion', CATALOG_SYNC_VERSION);
          await idbSet('products', products);
        }
        if (needsVideoResync) {
          shopVideos = (typeof DEFAULT_SHOP_VIDEOS !== 'undefined' ? DEFAULT_SHOP_VIDEOS : []).map((v) => ({ ...v }));
          await idbSet('shopVideos', shopVideos);
          await idbSet('videoSyncVersion', videoSyncVersion);
        } else if (Array.isArray(savedVideos)) {
          shopVideos = savedVideos;
        }
        if (Array.isArray(savedCart)) {
          cart = normalizeCart(savedCart);
        } else {
          const lsCart = loadCartFromLocalStorage();
          if (lsCart) cart = lsCart;
        }
        sanitizeCartForProducts();
        saveCartToLocalStorage();
        if (Array.isArray(savedOrders)) orders = savedOrders;
        if (typeof savedSeq === 'number' && savedSeq > 0) orderSeq = savedSeq;
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setTheme(savedTheme);
        }
        if (savedShop && typeof savedShop === 'object') {
          Object.assign(SHOP_CONFIG, savedShop);
          if (savedShop.adminPin && !savedShop.adminPinHash) {
            SHOP_CONFIG.adminPinHash = hashAdminPin(String(savedShop.adminPin));
            delete SHOP_CONFIG.adminPin;
          }
          migratePaymentFields();
          // Migrate older subtitle variants to the single-line brand line
          const legacySubs = [
            'งานหัตถกรรมหวาย · บ้านบุทม',
            'งานหัตถกรรมหวายบ้านบุทม',
            'งานหัตถกรรม หวาย • บ้านบุทม'
          ];
          if (!SHOP_CONFIG.shopSub || legacySubs.includes(SHOP_CONFIG.shopSub)) {
            SHOP_CONFIG.shopSub = 'งานหัตถกรรมจักสานหวายบ้านบุทม';
          }
        }
        return true;
      } catch (e) {
        db = null;
        dbReady = false;
        const lsCart = loadCartFromLocalStorage();
        if (lsCart) {
          cart = lsCart;
          sanitizeCartForProducts();
        }
        console.warn('IndexedDB ไม่พร้อม — ใช้ localStorage สำหรับตะกร้า', e);
        return false;
      }
    }

    async function persistAll() {
      if (!dbReady || !db) return;
      try {
        await idbSet('products', products);
        await idbSet('shopVideos', shopVideos);
        await idbSet('cart', cart);
        await idbSet('orders', orders);
        await idbSet('orderSeq', orderSeq);
      } catch (e) {
        console.warn('บันทึกไม่สำเร็จ', e);
      }
    }

    function saveCart() {
      saveCartToLocalStorage();
      if (dbReady && db) {
        idbSet('cart', cart).catch((e) => console.warn('บันทึกตะกร้า IndexedDB ไม่สำเร็จ', e));
      }
    }

    function saveProducts() {
      return persistAll();
    }

    function saveShopVideos() {
      return persistAll();
    }

    function saveOrders() {
      return persistAll();
    }

    function formatPrice(n) {
      return '฿' + n.toLocaleString('th-TH');
    }

    function productCertInner() {
      return `
        <span class="product-cert__seal" title="OTOP หนึ่งตำบล หนึ่งผลิตภัณฑ์">
          <svg viewBox="0 0 64 64" width="32" height="32" aria-hidden="true" focusable="false">
            <circle cx="32" cy="32" r="31" fill="#5b2a12"/>
            <circle cx="32" cy="32" r="26" fill="none" stroke="#e8c56a" stroke-width="2.2"/>
            <circle cx="32" cy="32" r="22.5" fill="none" stroke="#fff8ef" stroke-width="0.6" opacity="0.35"/>
            <text x="32" y="37" text-anchor="middle" fill="#fff8ef" font-size="13" font-weight="800" font-family="Sarabun, Arial, sans-serif" letter-spacing="0.8">OTOP</text>
          </svg>
        </span>
        <span class="product-cert__seal" title="มาตรฐานผลิตภัณฑ์ชุมชน มผช">
          <svg viewBox="0 0 64 64" width="32" height="32" aria-hidden="true" focusable="false">
            <circle cx="32" cy="32" r="31" fill="#e4c56a"/>
            <circle cx="32" cy="32" r="26" fill="none" stroke="#5b2a12" stroke-width="2"/>
            <text x="32" y="38" text-anchor="middle" fill="#3a1f10" font-size="15" font-weight="800" font-family="Sarabun, Tahoma, sans-serif">มผช</text>
          </svg>
        </span>`;
    }

    function productCertHtml() {
      return `<div class="product-cert" aria-label="สินค้า OTOP มาตรฐานผลิตภัณฑ์ชุมชน">${productCertInner()}</div>`;
    }

    const pdCert = document.getElementById('pdCert');
    if (pdCert) {
      pdCert.innerHTML = `${productCertInner()}<span class="product-cert__caption">OTOP · มาตรฐานชุมชน</span>`;
    }

    function getProductStock(p) {
      const n = Number(p?.stock);
      return Number.isFinite(n) ? n : null;
    }

    function getStockLabel(p) {
      const stock = getProductStock(p);
      if (stock === null) return { text: 'พร้อมส่ง', className: 'in-stock' };
      if (stock <= 0) return { text: 'หมดชั่วคราว', className: 'out-of-stock' };
      return { text: `คงเหลือ ${stock} ชิ้น`, className: 'in-stock' };
    }

    function isProductAvailable(p) {
      const stock = getProductStock(p);
      return stock === null || stock > 0;
    }

    function getCartCount() {
      return cart.reduce((sum, item) => sum + item.qty, 0);
    }

    function getCartSubtotal() {
      return cart.reduce((sum, item) => {
        const p = products.find(x => x.id === item.id);
        return sum + (p ? p.price * item.qty : 0);
      }, 0);
    }

    function getPromoDiscount() {
      const min = Number(SHOP_CONFIG.promoMin) || 0;
      const discount = Number(SHOP_CONFIG.promoDiscount) || 0;
      if (min <= 0 || discount <= 0) return 0;
      return getCartSubtotal() >= min ? discount : 0;
    }

    function getShippingFee() {
      const subtotal = getCartSubtotal() - getPromoDiscount();
      const freeMin = Number(SHOP_CONFIG.freeShippingMin) || 0;
      if (freeMin > 0 && subtotal >= freeMin) return 0;
      const fee = Number(SHOP_CONFIG.shippingFee);
      return Number.isFinite(fee) ? Math.max(0, fee) : 80;
    }

    function getCartTotal() {
      return getCartSubtotal() - getPromoDiscount() + getShippingFee();
    }

    function isValidThaiPhone(raw) {
      const digits = String(raw || '').replace(/\D/g, '');
      if (digits.length === 10 && digits.startsWith('0')) {
        return /^0[689]\d{8}$/.test(digits);
      }
      if (digits.length === 9) {
        return /^[689]\d{8}$/.test(digits);
      }
      return false;
    }

    function formatPhoneDisplay(raw) {
      const digits = String(raw || '').replace(/\D/g, '');
      if (digits.length === 10 && digits.startsWith('0')) {
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
      return raw.trim();
    }

    function getCustomerAddress() {
      const street = document.getElementById('custStreet')?.value.trim() || '';
      const sub = document.getElementById('custSubdistrict')?.value.trim() || '';
      const district = document.getElementById('custDistrict')?.value.trim() || '';
      const province = document.getElementById('custProvince')?.value.trim() || '';
      const zip = document.getElementById('custZip')?.value.trim() || '';
      return [street, sub, district, province, zip].filter(Boolean).join('\n');
    }

    function validateCustomerAddress() {
      const street = document.getElementById('custStreet')?.value.trim() || '';
      const sub = document.getElementById('custSubdistrict')?.value.trim() || '';
      const district = document.getElementById('custDistrict')?.value.trim() || '';
      const province = document.getElementById('custProvince')?.value.trim() || '';
      const zip = document.getElementById('custZip')?.value.trim() || '';
      const zipOk = /^\d{5}$/.test(zip);
      document.getElementById('errStreet')?.classList.toggle('show', !street);
      document.getElementById('errSubdistrict')?.classList.toggle('show', !sub);
      document.getElementById('errDistrict')?.classList.toggle('show', !district);
      document.getElementById('errProvince')?.classList.toggle('show', !province);
      document.getElementById('errZip')?.classList.toggle('show', !zipOk);
      return street && sub && district && province && zipOk;
    }

    // ========== RENDER PRODUCTS ==========
    const grid = document.getElementById('productGrid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const MAX_PRODUCT_IMAGES = 10;

    function getProductImages(p) {
      if (!p) return [];
      if (Array.isArray(p.images) && p.images.length) return p.images.filter(Boolean).slice(0, MAX_PRODUCT_IMAGES);
      if (p.image) return [p.image];
      return [];
    }

    function getCoverImage(p) {
      const imgs = getProductImages(p);
      return imgs[0] || null;
    }

    function renderProductCardMedia(p) {
      const imgs = getProductImages(p);
      if (!imgs.length) {
        return { html: '', emojiShow: '' };
      }
      if (imgs.length === 1) {
        return {
          html: `<img class="product-card-img" src="${imgs[0]}" alt="${p.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">`,
          emojiShow: 'display:none',
        };
      }
      const slides = imgs.map((src, i) =>
        `<div class="product-card-gallery__slide"><img src="${src}" alt="${p.name}" loading="${i === 0 ? 'eager' : 'lazy'}" draggable="false"></div>`
      ).join('');
      const dots = imgs.map((_, i) =>
        `<button type="button" class="product-card-gallery__dot${i === 0 ? ' is-active' : ''}" aria-label="รูปที่ ${i + 1}" data-index="${i}"></button>`
      ).join('');
      return {
        html: `<div class="product-card-gallery" data-pid="${p.id}">
          <div class="product-card-gallery__track">${slides}</div>
          <div class="product-card-gallery__dots">${dots}</div>
        </div>`,
        emojiShow: 'display:none',
      };
    }

    function bindProductCardGalleries() {
      document.querySelectorAll('.product-card-gallery').forEach((gallery) => {
        if (gallery.dataset.bound) return;
        gallery.dataset.bound = '1';
        const track = gallery.querySelector('.product-card-gallery__track');
        const dots = gallery.querySelectorAll('.product-card-gallery__dot');
        if (!track || !dots.length) return;

        const syncDots = () => {
          const slideW = track.clientWidth || 1;
          const idx = Math.min(dots.length - 1, Math.max(0, Math.round(track.scrollLeft / slideW)));
          dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
        };

        track.addEventListener('scroll', syncDots, { passive: true });

        dots.forEach((dot) => {
          dot.addEventListener('click', (e) => {
            e.stopPropagation();
            const i = Number(dot.dataset.index || 0);
            track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
          });
        });

        let startX = null;
        gallery._swiped = false;
        track.addEventListener('touchstart', (e) => {
          startX = e.touches[0]?.clientX ?? null;
          gallery._swiped = false;
        }, { passive: true });
        track.addEventListener('touchmove', (e) => {
          if (startX == null) return;
          if (Math.abs((e.touches[0]?.clientX ?? startX) - startX) > 10) gallery._swiped = true;
        }, { passive: true });
        track.addEventListener('touchend', () => { startX = null; });
      });
    }

    let catalogFilter = 'all';
    let catalogQuery = '';
    let wishlist = [];
    try {
      wishlist = JSON.parse(localStorage.getItem('rachawei_wishlist') || '[]');
      if (!Array.isArray(wishlist)) wishlist = [];
    } catch (e) { wishlist = []; }

    function saveWishlist() {
      try { localStorage.setItem('rachawei_wishlist', JSON.stringify(wishlist)); } catch (e) {}
    }

    function isWished(id) { return wishlist.includes(id); }

    function toggleWish(id) {
      if (isWished(id)) wishlist = wishlist.filter(x => x !== id);
      else wishlist.push(id);
      saveWishlist();
      renderProducts(catalogFilter);
    }
    window.toggleWish = toggleWish;

    function productRating(p) {
      if (p.badge === 'ยอดนิยม') return { score: 4.9, count: 28 };
      if (p.badge === 'ใหม่') return { score: 4.8, count: 12 };
      if (p.badge === 'ของขวัญ') return { score: 4.8, count: 16 };
      return { score: 4.7, count: 9 };
    }

    function matchesCatalog(p, filter, query) {
      const q = (query || '').trim().toLowerCase();
      if (q) {
        const hay = [p.name, p.desc, p.category, p.badge].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filter === 'all' || !filter) return true;
      if (filter === 'basket' || filter === 'chair' || filter === 'home') return p.cat === filter;
      if (filter === 'new') return p.badge === 'ใหม่';
      if (filter === 'best') return p.badge === 'ยอดนิยม' || p.badge === 'สานมือ';
      if (filter === 'promo') return p.badge === 'ยอดนิยม' || p.badge === 'ของขวัญ';
      if (filter === 'gift') return p.badge === 'ของขวัญ' || /ขวัญ|กระเช้า/.test(p.name + p.category);
      if (filter === 'fav') return isWished(p.id);
      return true;
    }

    function renderPopularCats() {
      const el = document.getElementById('popularCatGrid');
      if (!el) return;
      const groups = [
        { filter: 'basket', name: 'ตะกร้าหวาย', emoji: '🧺' },
        { filter: 'chair', name: 'เก้าอี้หวาย', emoji: '🪑' },
        { filter: 'home', name: 'ของใช้ในบ้าน', emoji: '🏡' },
        { filter: 'gift', name: 'ของขวัญ/ของฝาก', emoji: '🎁' },
      ];
      el.innerHTML = groups.map((g) => {
        const count = products.filter((p) => matchesCatalog(p, g.filter, '')).length;
        const sample = products.find((p) => matchesCatalog(p, g.filter, ''));
        const cover = sample ? getCoverImage(sample) : null;
        const media = cover
          ? `<img src="${cover}" alt="">`
          : `<span class="shop-cat__emoji">${g.emoji}</span>`;
        return `<button type="button" class="shop-cat" data-filter="${g.filter}">
          ${media}
          <span class="shop-cat__label"><strong>${g.name}</strong><small>${count} รายการ</small></span>
        </button>`;
      }).join('');
      el.querySelectorAll('.shop-cat').forEach((btn) => {
        btn.addEventListener('click', () => applyCatalogFilter(btn.dataset.filter, true));
      });
    }

    function applyCatalogFilter(filter, scrollToProducts) {
      catalogFilter = filter || 'all';
      document.querySelectorAll('.shop-quick__item').forEach((b) => {
        b.classList.toggle('is-active', b.dataset.filter === catalogFilter);
      });
      renderProducts(catalogFilter);
      if (scrollToProducts) {
        const el = document.getElementById('products');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    function renderProducts(filter = catalogFilter) {
      catalogFilter = filter || 'all';
      const filtered = products.filter((p) => matchesCatalog(p, catalogFilter, catalogQuery));

      if (!filtered.length) {
        grid.innerHTML = `<div class="product-card" style="grid-column:1/-1;min-height:120px;align-items:center;justify-content:center;padding:1.25rem;text-align:center;">ไม่พบสินค้าที่ตรงกับรายการนี้</div>`;
        renderPopularCats();
        refreshHeroSlides();
        return;
      }

      grid.innerHTML = filtered.map((p, idx) => {
        const cardMedia = renderProductCardMedia(p);
        const delay = Math.min(idx * 0.05, 0.4);
        const wish = isWished(p.id) ? '♥' : '♡';
        const badgeLabel = p.badge === 'ยอดนิยม' ? 'ขายดี' : p.badge;
        const stock = getStockLabel(p);
        const available = isProductAvailable(p);
        return `
        <article class="product-card product-card--buy stagger" data-cat="${p.cat}" data-pid="${p.id}" style="animation-delay:${delay}s">
          <div class="product-image">
            ${badgeLabel ? `<span class="product-badge">${badgeLabel}</span>` : ''}
            <button type="button" class="shop-wish" aria-label="ถูกใจ" onclick="event.stopPropagation();toggleWish(${p.id})">${wish}</button>
            ${cardMedia.html}
            <span class="emoji" style="${cardMedia.emojiShow}">${p.emoji || '🧺'}</span>
          </div>
          <div class="product-body">
            <h3 class="product-title">${p.name}</h3>
            <div class="product-card-buyrow">
              <div class="product-price">${formatPrice(p.price)}</div>
              <div class="product-stock product-stock--${stock.className}">${stock.text}</div>
            </div>
            ${productCertHtml()}
            <button type="button" class="btn btn-primary btn-add-full" ${available ? '' : 'disabled'} onclick="addToCart(${p.id})" aria-label="ใส่ ${p.name} ลงตะกร้า">
              🛒 ใส่ตะกร้า
            </button>
            <button type="button" class="product-detail-link" onclick="navigateToProduct(${p.id})">ดูรายละเอียด</button>
          </div>
        </article>
      `;
      }).join('');

      renderPopularCats();
      refreshHeroSlides();
      bindProductCardGalleries();
      renderShopVideos();
    }

    document.getElementById('productGrid').addEventListener('click', (e) => {
      const gallery = e.target.closest('.product-card-gallery');
      if (gallery && gallery._swiped) {
        e.preventDefault();
        e.stopPropagation();
        gallery._swiped = false;
      }
    }, true);

    // ========== SHOP VIDEOS (ราชาหวาย VIDEO) ==========
    let nextVideoId = Math.max(...shopVideos.map((v) => v.id), 0) + 1;
    let editingVideoId = null;

    function extractYoutubeId(url) {
      if (!url) return null;
      const s = String(url).trim();
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/i,
        /^([\w-]{11})$/,
      ];
      for (const pattern of patterns) {
        const match = s.match(pattern);
        if (match) return match[1];
      }
      return null;
    }

    function formatViewCount(n) {
      const v = Number(n) || 0;
      if (v >= 1000000) return `${(v / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
      if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, '')}k`;
      return String(v);
    }

    function getShopVideoThumbnail(video) {
      if (video.thumbnail) return video.thumbnail;
      const yt = extractYoutubeId(video.videoUrl);
      if (yt) return `https://img.youtube.com/vi/${yt}/hqdefault.jpg`;
      const product = video.productId ? products.find((p) => p.id === video.productId) : null;
      return product ? getCoverImage(product) : '';
    }

    function bumpShopVideoViews(id) {
      const video = shopVideos.find((v) => v.id === id);
      if (!video) return;
      video.views = (Number(video.views) || 0) + 1;
      saveShopVideos();
      renderShopVideos();
    }

    function renderShopVideos() {
      const block = document.getElementById('shopVideosBlock');
      const track = document.getElementById('shopVideosTrack');
      if (!block || !track) return;

      const items = shopVideos.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id);
      if (!items.length) {
        block.hidden = true;
        track.innerHTML = '';
        return;
      }

      block.hidden = false;
      track.innerHTML = items.map((video) => {
        const product = video.productId ? products.find((p) => p.id === video.productId) : null;
        const thumb = getShopVideoThumbnail(video);
        const title = video.title || product?.name || 'วิดีโอแนะนำสินค้า';
        const views = formatViewCount(video.views);
        const thumbHtml = thumb
          ? `<img src="${thumb}" alt="" loading="lazy" draggable="false">`
          : `<span class="shop-video-card__placeholder">🎬</span>`;
        const priceHtml = product
          ? `<div class="shop-video-card__price">${formatPrice(product.price)}</div>`
          : '';
        const buyHtml = product
          ? `<button type="button" class="shop-video-card__buy" onclick="event.stopPropagation();buyFromShopVideo(${video.id})">ซื้อเลย</button>`
          : '';

        return `
          <article class="shop-video-card" data-video-id="${video.id}">
            <button type="button" class="shop-video-card__media" onclick="playShopVideo(${video.id})" aria-label="เล่นวิดีโอ ${title.replace(/"/g, '&quot;')}">
              ${thumbHtml}
              <span class="shop-video-card__overlay">
                <span class="shop-video-card__play" aria-hidden="true">▶</span>
                <span class="shop-video-card__views">${views}</span>
              </span>
            </button>
            <div class="shop-video-card__body">
              <div class="shop-video-card__title">${title}</div>
              ${priceHtml}
              ${buyHtml}
            </div>
          </article>
        `;
      }).join('');
    }

    function playShopVideo(id) {
      const video = shopVideos.find((v) => v.id === id);
      if (!video || !video.videoUrl) return;
      bumpShopVideoViews(id);
      const title = video.title || 'ราชาหวาย VIDEO';
      if (typeof window.openShopVideo === 'function') {
        window.openShopVideo(video.videoUrl, title);
        return;
      }
      window.open(video.videoUrl, '_blank', 'noopener,noreferrer');
    }

    function buyFromShopVideo(id) {
      const video = shopVideos.find((v) => v.id === id);
      if (!video || !video.productId) {
        showToast('ยังไม่ได้เชื่อมสินค้ากับวิดีโอนี้');
        return;
      }
      addToCart(video.productId);
    }

    window.playShopVideo = playShopVideo;
    window.buyFromShopVideo = buyFromShopVideo;

    // ========== HERO BACKGROUND SLIDES ==========
    let heroIndex = 0;
    let heroTimer = null;
    let heroPausedUntil = 0;
    const HERO_AUTO_MS = 4200;

    function collectHeroImages() {
      const configured = Array.isArray(SHOP_CONFIG.heroImages)
        ? SHOP_CONFIG.heroImages.filter(Boolean)
        : [];
      if (configured.length) return configured.slice(0, 10);

      const urls = [];
      products.forEach((p) => {
        getProductImages(p).forEach((src) => {
          if (src && !urls.includes(src)) urls.push(src);
        });
      });
      if (!urls.length) {
        [
          '/images/promo/usage-shopping.png',
          '/images/promo/usage-market.png',
          '/images/promo/usage-community.png',
          '/images/promo/usage-decor.png',
          '/images/promo/usage-temple.png',
        ].forEach((src) => urls.push(src));
      }
      return urls.slice(0, 8);
    }

    function setHeroSlide(index) {
      const slides = document.querySelectorAll('#heroSlides .hero-slide');
      const dots = document.querySelectorAll('#heroDots .hero-dot');
      if (!slides.length) return;
      heroIndex = ((index % slides.length) + slides.length) % slides.length;
      slides.forEach((el, i) => el.classList.toggle('is-active', i === heroIndex));
      dots.forEach((el, i) => el.classList.toggle('is-active', i === heroIndex));
    }

    function startHeroAutoplay() {
      if (heroTimer) clearInterval(heroTimer);
      const slides = document.querySelectorAll('#heroSlides .hero-slide');
      if (slides.length < 2) return;
      heroTimer = setInterval(() => {
        if (Date.now() < heroPausedUntil) return;
        setHeroSlide(heroIndex + 1);
      }, HERO_AUTO_MS);
    }

    function refreshHeroSlides() {
      const stage = document.getElementById('heroSlides');
      const dots = document.getElementById('heroDots');
      if (!stage || !dots) return;
      const images = collectHeroImages();
      if (!images.length) {
        stage.innerHTML = '';
        dots.innerHTML = '';
        return;
      }
      stage.innerHTML = images.map((src, i) =>
        `<div class="hero-slide${i === 0 ? ' is-active' : ''}"><img src="${src}" alt="" loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async" draggable="false" /></div>`
      ).join('');
      dots.innerHTML = images.map((_, i) =>
        `<button type="button" class="hero-dot${i === 0 ? ' is-active' : ''}" aria-label="ภาพที่ ${i + 1}" data-index="${i}"></button>`
      ).join('');
      dots.querySelectorAll('.hero-dot').forEach((dot) => {
        dot.addEventListener('click', () => {
          setHeroSlide(Number(dot.dataset.index || 0));
          heroPausedUntil = Date.now() + 2500;
        });
      });

      const heroStage = document.getElementById('heroStage');
      if (heroStage && !heroStage.dataset.swipeBound) {
        heroStage.dataset.swipeBound = '1';
        let startX = null;
        heroStage.addEventListener('touchstart', (e) => {
          startX = e.changedTouches[0]?.clientX ?? null;
        }, { passive: true });
        heroStage.addEventListener('touchend', (e) => {
          if (startX == null) return;
          const endX = e.changedTouches[0]?.clientX ?? startX;
          const delta = endX - startX;
          startX = null;
          if (Math.abs(delta) < 40) return;
          setHeroSlide(heroIndex + (delta < 0 ? 1 : -1));
          heroPausedUntil = Date.now() + 2500;
        }, { passive: true });
      }

      heroIndex = 0;
      startHeroAutoplay();
    }

    // ========== INSTALL BANNER ==========
    function initInstallBanner() {
      const banner = document.getElementById('installBanner');
      const installBtn = document.getElementById('installBtn');
      const closeBtn = document.getElementById('installClose');
      const desc = document.getElementById('installDesc');
      if (!banner) return;

      const INSTALL_DELAY_MS = 8000;

      const standalone = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
      if (standalone) return;
      try {
        if (localStorage.getItem('rachawei-store-install-dismissed')) return;
      } catch (_) {}

      const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
      let deferredPrompt = null;
      let revealTimer = null;

      const schedulePromoIfReady = () => {
        if (typeof schedulePromoAfterInstall === 'function') schedulePromoAfterInstall();
      };

      const revealBanner = (message, showInstall) => {
        if (revealTimer) clearTimeout(revealTimer);
        revealTimer = setTimeout(() => {
          try {
            if (localStorage.getItem('rachawei-store-install-dismissed')) return;
          } catch (_) {}
          if (desc && message) desc.textContent = message;
          banner.hidden = false;
          if (installBtn) installBtn.hidden = !showInstall;
        }, INSTALL_DELAY_MS);
      };

      window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredPrompt = event;
        revealBanner('ติดตั้งแอป — เปิดร้านได้เร็วขึ้น', true);
      });

      if (isIos) {
        revealBanner('ติดตั้ง: แชร์ ⎋ → เพิ่มลงหน้าจอโฮม', false);
      }

      if (installBtn) {
        installBtn.addEventListener('click', async () => {
          if (!deferredPrompt) return;
          await deferredPrompt.prompt();
          const choice = await deferredPrompt.userChoice;
          deferredPrompt = null;
          if (choice.outcome === 'accepted') {
            banner.hidden = true;
            try { localStorage.setItem('rachawei-store-install-dismissed', '1'); } catch (_) {}
            schedulePromoIfReady();
          }
        });
      }

      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          banner.hidden = true;
          if (revealTimer) clearTimeout(revealTimer);
          try { localStorage.setItem('rachawei-store-install-dismissed', '1'); } catch (_) {}
          schedulePromoIfReady();
        });
      }
    }

    initInstallBanner();

    // Register SW so installed app / icons refresh with cache version bumps
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }


    // ========== PRODUCT DETAIL ==========
    let pdImages = [];
    let pdIndex = 0;
    let pdProductId = null;
    const PAGE_HASHES = ['home', 'story', 'process', 'care', 'media'];

    function parseProductHash() {
      const h = (location.hash || '').replace('#', '');
      const m = h.match(/^product\/(\d+)$/);
      return m ? Number(m[1]) : null;
    }

    function productShareUrl(id) {
      const base = `${location.origin}${location.pathname}`;
      return `${base}#product/${id}`;
    }

    function openProductDetail(id, opts = {}) {
      const p = products.find(x => x.id === id);
      if (!p) return;
      pdProductId = id;
      pdImages = getProductImages(p);
      pdIndex = 0;

      document.getElementById('pdCat').textContent = p.category || '';
      document.getElementById('pdName').textContent = p.name;
      const priceBits = [formatPrice(p.price)];
      if (p.size) priceBits.push(`<small>${p.size}</small>`);
      if (p.stock != null) {
        priceBits.push(`<small>${p.stock > 0 ? `คงเหลือ ${p.stock} ชิ้น` : 'หมดชั่วคราว'}</small>`);
      }
      document.getElementById('pdPrice').innerHTML = priceBits.join(' ');

      const meta = document.getElementById('pdMeta');
      let chips = '';
      if (p.badge) chips += `<span class="pd-chip">${p.badge}</span>`;
      chips += `<span class="pd-chip">สานมือ</span>`;
      chips += `<span class="pd-chip">หวายธรรมชาติ</span>`;
      chips += `<span class="pd-chip">${p.category || 'สินค้า'}</span>`;
      if (pdImages.length > 1) chips += `<span class="pd-chip">${pdImages.length} รูป</span>`;
      meta.innerHTML = chips;

      let descText = p.detail || p.desc || '';
      if (!String(descText).includes('ดูแล')) {
        descText += (descText ? '\n\n' : '') +
          'การดูแลเบื้องต้น: เช็ดด้วยผ้าแห้งหรือหมาดเล็กน้อย ผึ่งลมในที่ร่ม หลีกเลี่ยงแช่น้ำและแดดจัด — ดูคู่มือเต็มด้านล่างหน้าเว็บ';
      }
      document.getElementById('pdDesc').textContent = descText;

      renderPdGallery();
      document.getElementById('productDetailModal').classList.add('open');
      document.title = `${p.name} — ${SHOP_CONFIG.shopName || 'ราชาหวายสุรินทร์'}`;

      if (!opts.skipHash) {
        const hash = `product/${id}`;
        const state = { product: id };
        if (opts.pushState !== false) history.pushState(state, '', `#${hash}`);
        else history.replaceState(state, '', `#${hash}`);
      }
    }

    function closeProductDetail(fromPopState = false) {
      document.getElementById('productDetailModal').classList.remove('open');
      pdProductId = null;
      document.title = `${SHOP_CONFIG.shopName || 'ราชาหวายสุรินทร์'} — งานหัตถกรรมหวาย`;
      if (fromPopState) return;
      if (parseProductHash()) {
        if (history.state && history.state.product) history.back();
        else history.replaceState(null, '', `${location.pathname}${location.search}`);
      }
    }

    function navigateToProduct(id) {
      openProductDetail(id);
    }

    function renderPdGallery() {
      const main = document.getElementById('pdMainImg');
      const thumbs = document.getElementById('pdThumbs');
      const p = products.find(x => x.id === pdProductId);

      if (pdImages.length === 0) {
        main.innerHTML = `<span class="emoji-lg">${(p && p.emoji) || '🧺'}</span>`;
        thumbs.innerHTML = '';
        return;
      }

      const src = pdImages[pdIndex];
      const showNav = pdImages.length > 1;
      main.innerHTML = `
        ${showNav ? `<button class="pd-nav prev" onclick="pdPrev(event)">‹</button>` : ''}
        <img src="${src}" alt="" onerror="this.style.display='none'">
        ${showNav ? `<button class="pd-nav next" onclick="pdNext(event)">›</button>` : ''}
      `;

      thumbs.innerHTML = pdImages.map((img, i) => `
        <button type="button" class="pd-thumb ${i === pdIndex ? 'active' : ''}" onclick="pdGo(${i})">
          <img src="${img}" alt="" onerror="this.parentNode.textContent='🖼️'">
        </button>
      `).join('');
    }

    function pdGo(i) {
      pdIndex = i;
      renderPdGallery();
    }

    function pdPrev(e) {
      if (e) e.stopPropagation();
      pdIndex = (pdIndex - 1 + pdImages.length) % pdImages.length;
      renderPdGallery();
    }

    function pdNext(e) {
      if (e) e.stopPropagation();
      pdIndex = (pdIndex + 1) % pdImages.length;
      renderPdGallery();
    }

    document.getElementById('pdClose').addEventListener('click', () => closeProductDetail());
    document.getElementById('pdCloseBtn').addEventListener('click', () => closeProductDetail());
    document.getElementById('productDetailModal').addEventListener('click', (e) => {
      if (e.target.id === 'productDetailModal') closeProductDetail();
    });
    document.getElementById('pdAddCart').addEventListener('click', () => {
      if (pdProductId != null) {
        addToCart(pdProductId);
        closeProductDetail();
      }
    });

    window.openProductDetail = openProductDetail;
    window.navigateToProduct = navigateToProduct;
    window.productShareUrl = productShareUrl;
    window.pdGo = pdGo;
    window.pdPrev = pdPrev;
    window.pdNext = pdNext;

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        applyCatalogFilter(btn.dataset.filter, true);
      });
    });

    document.querySelectorAll('.shop-quick__item').forEach((btn) => {
      btn.addEventListener('click', () => applyCatalogFilter(btn.dataset.filter, true));
    });

    const searchForm = document.getElementById('productSearchForm');
    const searchInput = document.getElementById('productSearch');
    if (searchForm && searchInput) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        catalogQuery = searchInput.value || '';
        showPage('home');
        applyCatalogFilter(catalogQuery ? catalogFilter : 'all', true);
      });
    }
    document.getElementById('viewAllProducts')?.addEventListener('click', () => {
      catalogQuery = '';
      if (searchInput) searchInput.value = '';
      applyCatalogFilter('all', true);
    });

    document.getElementById('shopTabbar')?.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#shopTabbar button').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const tab = btn.dataset.tab;
        if (tab === 'home') {
          catalogQuery = '';
          if (searchInput) searchInput.value = '';
          document.body.classList.remove('show-contact');
          showPage('home');
          applyCatalogFilter('all');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (tab === 'cats') {
          document.body.classList.remove('show-contact');
          showPage('home');
          document.getElementById('popularCats')?.scrollIntoView({ behavior: 'smooth' });
        } else if (tab === 'fav') {
          document.body.classList.remove('show-contact');
          showPage('home');
          applyCatalogFilter('fav', true);
        } else if (tab === 'orders') {
          document.getElementById('statusBtn')?.click();
        } else if (tab === 'account') {
          document.body.classList.add('show-contact');
          showPage('home');
          setTimeout(() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
      });
    });

    // ========== CART UI ==========
    const cartBtn = document.getElementById('cartBtn');
    const cartBadge = document.getElementById('cartBadge');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartDrawer = document.getElementById('cartDrawer');
    const cartClose = document.getElementById('cartClose');
    const cartBody = document.getElementById('cartBody');
    const cartFooter = document.getElementById('cartFooter');
    const cartCountText = document.getElementById('cartCountText');
    const cartTotalText = document.getElementById('cartTotalText');
    const toast = document.getElementById('toast');

    function updateBadge() {
      const count = getCartCount();
      const prev = parseInt(cartBadge.dataset.count || '0', 10);
      cartBadge.textContent = count;
      cartBadge.dataset.count = count;
      if (count !== prev) {
        cartBadge.classList.remove('pop');
        void cartBadge.offsetWidth;
        cartBadge.classList.add('pop');
      }
    }

    function renderCart() {
      updateBadge();
      const count = getCartCount();
      const subtotal = getCartSubtotal();
      const promo = getPromoDiscount();
      const shipping = getShippingFee();
      const total = getCartTotal();

      cartCountText.textContent = count + ' ชิ้น';
      cartTotalText.textContent = formatPrice(total);

      const breakdown = document.getElementById('cartBreakdown');
      if (breakdown) {
        let lines = `<div class="cart-total-row"><span>ยอดสินค้า</span><span>${formatPrice(subtotal)}</span></div>`;
        if (promo > 0) {
          lines += `<div class="cart-total-row cart-total-row--promo"><span>ส่วนลดโปรโมชั่น</span><span>-${formatPrice(promo)}</span></div>`;
        }
        lines += `<div class="cart-total-row"><span>ค่าจัดส่ง</span><span>${shipping > 0 ? formatPrice(shipping) : 'ฟรี'}</span></div>`;
        breakdown.innerHTML = lines;
      }

      if (cart.length === 0) {
        cartBody.innerHTML = `
          <div class="cart-empty">
            <div class="empty-icon">🛒</div>
            <p>ยังไม่มีสินค้าในตะกร้า</p>
            <p style="font-size:0.85rem;margin-top:0.4rem;">เลือกสินค้าที่ชอบแล้วกด “ใส่ตะกร้า”</p>
          </div>
        `;
        cartFooter.style.display = 'none';
        return;
      }

      cartFooter.style.display = 'block';

      cartBody.innerHTML = cart.map(item => {
        const p = products.find(x => Number(x.id) === Number(item.id));
        if (!p) return '';
        const stock = getProductStock(p);
        const maxAttr = stock !== null ? ` max="${stock}"` : '';
        const stockHint = stock !== null ? `<div class="cart-item-stock">คงเหลือ ${stock} ชิ้น</div>` : '';
        return `
          <div class="cart-item" data-cart-id="${p.id}">
            <div class="cart-item-emoji">${p.emoji}</div>
            <div class="cart-item-info">
              <div class="cart-item-name">${p.name}</div>
              <div class="cart-item-price">${formatPrice(p.price)} / ชิ้น</div>
              ${stockHint}
              <div class="cart-item-row">
                <div class="qty-stepper">
                  <button type="button" class="qty-btn" data-qty-action="dec" data-id="${p.id}" aria-label="ลดจำนวน ${p.name}">−</button>
                  <input type="number" class="qty-input" min="1"${maxAttr} value="${item.qty}" data-id="${p.id}" inputmode="numeric" pattern="[0-9]*" aria-label="จำนวน ${p.name}" />
                  <button type="button" class="qty-btn" data-qty-action="inc" data-id="${p.id}" aria-label="เพิ่มจำนวน ${p.name}">+</button>
                </div>
                <div class="cart-item-subtotal">${formatPrice(p.price * item.qty)}</div>
              </div>
              <button type="button" class="cart-item-remove" data-remove-id="${p.id}">ลบรายการ</button>
            </div>
          </div>
        `;
      }).join('');
    }

    function openCart() {
      cartOverlay.classList.add('open');
      cartDrawer.classList.add('open');
      renderCart();
    }

    function closeCart() {
      cartOverlay.classList.remove('open');
      cartDrawer.classList.remove('open');
    }

    cartBtn.addEventListener('click', openCart);
    cartClose.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    cartBody.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-qty-action]');
      if (btn) {
        const id = Number(btn.dataset.id);
        if (btn.dataset.qtyAction === 'inc') changeQty(id, 1);
        else if (btn.dataset.qtyAction === 'dec') changeQty(id, -1);
        return;
      }
      const removeBtn = e.target.closest('[data-remove-id]');
      if (removeBtn) removeFromCart(Number(removeBtn.dataset.removeId));
    });

    cartBody.addEventListener('change', (e) => {
      const input = e.target.closest('.qty-input');
      if (!input) return;
      setCartQty(Number(input.dataset.id), input.value);
    });

    cartBody.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const input = e.target.closest('.qty-input');
      if (!input) return;
      e.preventDefault();
      input.blur();
    });

    // ========== CART ACTIONS ==========
    function findCartItem(id) {
      return cart.find(x => Number(x.id) === Number(id));
    }

    function getMaxQtyForProduct(p) {
      const stock = p ? getProductStock(p) : null;
      return stock !== null ? stock : 999;
    }

    function setCartQty(id, qty) {
      const item = findCartItem(id);
      if (!item) return;
      const p = products.find(x => Number(x.id) === Number(id));
      const maxQty = getMaxQtyForProduct(p);
      let n = Math.floor(Number(qty));
      if (!Number.isFinite(n) || n < 1) n = 1;
      if (n > maxQty) {
        n = maxQty;
        if (maxQty < 999) showToast(`มีในสต็อก ${maxQty} ชิ้น`);
      }
      if (item.qty === n) {
        renderCart();
        return;
      }
      item.qty = n;
      saveCart();
      renderCart();
    }

    function addToCart(id) {
      const numId = Number(id);
      const p = products.find(item => Number(item.id) === numId);
      if (p && !isProductAvailable(p)) {
        showToast('สินค้าหมดชั่วคราว');
        return;
      }
      const maxQty = getMaxQtyForProduct(p);
      const existing = findCartItem(numId);
      const nextQty = (existing?.qty || 0) + 1;
      if (nextQty > maxQty) {
        showToast(maxQty < 999 ? `มีในสต็อก ${maxQty} ชิ้น` : 'ไม่สามารถเพิ่มได้');
        return;
      }
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ id: numId, qty: 1 });
      }
      saveCart();
      updateBadge();
      showToast('เพิ่มลงตะกร้าแล้ว ✓ — แตะ 🛒 ด้านบนเพื่อชำระเงิน');
    }

    function changeQty(id, delta) {
      const item = findCartItem(id);
      if (!item) return;
      const next = item.qty + delta;
      if (next <= 0) {
        removeFromCart(id);
        return;
      }
      if (delta > 0) {
        const p = products.find(x => Number(x.id) === Number(id));
        const maxQty = getMaxQtyForProduct(p);
        if (item.qty >= maxQty) {
          if (maxQty < 999) showToast(`มีในสต็อก ${maxQty} ชิ้น`);
          return;
        }
      }
      setCartQty(id, next);
    }

    function removeFromCart(id) {
      cart = cart.filter(x => Number(x.id) !== Number(id));
      saveCart();
      renderCart();
      showToast('ลบสินค้าออกแล้ว');
    }

    document.getElementById('clearCartBtn').addEventListener('click', () => {
      if (cart.length === 0) return;
      if (confirm('ล้างสินค้าทั้งหมดในตะกร้า?')) {
        cart = [];
        saveCart();
        renderCart();
        showToast('ล้างตะกร้าแล้ว');
      }
    });

    // ========== TOAST ==========
    let toastTimer;
    function showToast(msg) {
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
    }

    // ========== PAYMENT INFO (ดึงจาก SHOP_CONFIG — แก้ที่หัวสคริปต์) ==========
    function getPaymentInfo() {
      migratePaymentFields();
      const promptPayNo = SHOP_CONFIG.promptPayNo || SHOP_CONFIG.phoneDisplay;
      const bankAccountNo = String(SHOP_CONFIG.bankAccountNo || '').trim();
      return {
        promptpay: {
          id: promptPayNo,
          name: SHOP_CONFIG.bankAccountName || SHOP_CONFIG.shopName
        },
        bank: {
          bank: SHOP_CONFIG.bankName || 'ธนาคาร',
          account: bankAccountNo,
          name: SHOP_CONFIG.bankAccountName || SHOP_CONFIG.shopName
        }
      };
    }

    // ========== CHECKOUT / PAYMENT ==========
    const checkoutModal = document.getElementById('checkoutModal');
    const orderSummary = document.getElementById('orderSummary');
    const checkoutClose = document.getElementById('checkoutClose');
    const copyOrderBtn = document.getElementById('copyOrderBtn');
    let payStep = 1;
    let selectedMethod = 'promptpay';
    let pendingSlip = null;
    let successPendingSlip = null;

    function resetPendingSlip() {
      pendingSlip = null;
      const preview = document.getElementById('slipPreview');
      const placeholder = document.getElementById('slipUploadPlaceholder');
      const removeBtn = document.getElementById('slipRemoveBtn');
      const input = document.getElementById('slipFileInput');
      if (preview) {
        preview.hidden = true;
        preview.removeAttribute('src');
      }
      if (placeholder) placeholder.style.display = '';
      if (removeBtn) removeBtn.style.display = 'none';
      if (input) input.value = '';
    }

    function resetSuccessSlipUI() {
      successPendingSlip = null;
      const preview = document.getElementById('successSlipPreview');
      const placeholder = document.getElementById('successSlipPlaceholder');
      const submitBtn = document.getElementById('successSlipSubmitBtn');
      const input = document.getElementById('successSlipFileInput');
      if (preview) {
        preview.hidden = true;
        preview.removeAttribute('src');
      }
      if (placeholder) placeholder.style.display = '';
      if (submitBtn) submitBtn.style.display = 'none';
      if (input) input.value = '';
    }

    function updateSlipPreview(dataUrl) {
      pendingSlip = dataUrl;
      const preview = document.getElementById('slipPreview');
      const placeholder = document.getElementById('slipUploadPlaceholder');
      const removeBtn = document.getElementById('slipRemoveBtn');
      if (preview) {
        preview.src = dataUrl;
        preview.hidden = false;
      }
      if (placeholder) placeholder.style.display = 'none';
      if (removeBtn) removeBtn.style.display = 'inline-flex';
    }

    function toggleSlipUploadUI(show) {
      const section = document.getElementById('slipUploadSection');
      const alt = document.getElementById('slipAltLinks');
      if (section) section.style.display = show ? 'block' : 'none';
      if (alt) alt.style.display = show ? 'block' : 'none';
    }

    function paymentNeedsSlip(method) {
      return method === 'promptpay' || method === 'bank';
    }

    function renderSuccessSlipSection(order) {
      const section = document.getElementById('successSlipSection');
      const attached = document.getElementById('successSlipAttached');
      if (!section || !attached) return;
      resetSuccessSlipUI();
      const needsSlip = paymentNeedsSlip(order.method);
      if (order.paymentSlip) {
        section.style.display = 'none';
        attached.style.display = needsSlip ? 'block' : 'none';
        return;
      }
      attached.style.display = 'none';
      section.style.display = needsSlip ? 'block' : 'none';
    }

    function setPayStep(n) {
      payStep = n;
      const panels = [
        document.getElementById('payPanel1'),
        document.getElementById('payPanel2'),
        document.getElementById('payPanel3'),
        document.getElementById('payPanel4'),
      ];
      panels.forEach((panel, idx) => {
        if (!panel) return;
        const active = idx + 1 === n;
        panel.style.display = active ? 'block' : 'none';
        panel.style.pointerEvents = active ? 'auto' : 'none';
        panel.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      [1, 2, 3].forEach(i => {
        const el = document.getElementById('step' + i);
        if (!el) return;
        el.classList.remove('active', 'done');
        if (n === 4 || i < n) el.classList.add('done');
        if (i === n) el.classList.add('active');
      });
      const titles = {
        1: '💳 ข้อมูลผู้สั่งซื้อ',
        2: '💳 เลือกวิธีชำระเงิน',
        3: '💳 ยืนยันและชำระเงิน',
        4: '✅ สั่งซื้อสำเร็จ'
      };
      document.getElementById('payTitle').textContent = titles[n] || titles[1];
    }

    function openCheckout() {
      if (cart.length === 0) return;
      resetPendingSlip();
      resetSuccessSlipUI();
      setPayStep(1);
      checkoutModal.classList.add('open');
      closeCart();
    }

    document.getElementById('checkoutBtn').addEventListener('click', openCheckout);

    checkoutClose.addEventListener('click', () => checkoutModal.classList.remove('open'));
    checkoutModal.addEventListener('click', (e) => {
      if (e.target === checkoutModal) checkoutModal.classList.remove('open');
    });

    // Step 1 → 2
    document.getElementById('toStep2').addEventListener('click', () => {
      const name = document.getElementById('custName').value.trim();
      const phone = document.getElementById('custPhone').value.trim();
      const phoneOk = isValidThaiPhone(phone);
      let ok = true;
      document.getElementById('errName').classList.toggle('show', !name);
      document.getElementById('errPhone').classList.toggle('show', !phoneOk);
      if (!validateCustomerAddress()) ok = false;
      if (!name || !phoneOk) ok = false;
      if (ok) setPayStep(2);
    });

    document.getElementById('backTo1').addEventListener('click', () => setPayStep(1));
    document.getElementById('backTo2').addEventListener('click', () => setPayStep(2));

    // Payment method selection — use native radio hit areas (avoid misaligned label clicks)
    document.querySelectorAll('.pay-method input[name="payMethod"]').forEach((input) => {
      input.addEventListener('change', () => {
        selectedMethod = input.value;
        document.querySelectorAll('.pay-method').forEach((m) => {
          m.classList.toggle('selected', m.dataset.method === selectedMethod);
        });
      });
    });

    // Step 2 → 3
    document.getElementById('toStep3').addEventListener('click', () => {
      renderPayConfirm();
      setPayStep(3);
    });

    function methodLabel(m) {
      if (m === 'promptpay') return 'พร้อมเพย์ (PromptPay)';
      if (m === 'bank') return 'โอนเงินผ่านธนาคาร';
      return 'ชำระเมื่อรับสินค้า (COD)';
    }

    function renderPayConfirm() {
      const subtotal = getCartSubtotal();
      const promo = getPromoDiscount();
      const shipping = getShippingFee();
      const total = getCartTotal();
      const lines = document.getElementById('payOrderLines');
      let html = '';
      cart.forEach(item => {
        const p = products.find(x => x.id === item.id);
        if (p) {
          html += `<div><span>${p.emoji} ${p.name} × ${item.qty}</span><span>${formatPrice(p.price * item.qty)}</span></div>`;
        }
      });
      html += `<div><span>ยอดสินค้า</span><span>${formatPrice(subtotal)}</span></div>`;
      if (promo > 0) html += `<div><span>ส่วนลดโปรโมชั่น</span><span>-${formatPrice(promo)}</span></div>`;
      html += `<div><span>ค่าจัดส่ง</span><span>${shipping > 0 ? formatPrice(shipping) : 'ฟรี'}</span></div>`;
      html += `<div style="font-weight:700;border:none;padding-top:0.5rem;"><span>รวมทั้งสิ้น</span><span>${formatPrice(total)}</span></div>`;
      lines.innerHTML = html;

      const box = document.getElementById('payDetailBox');
      const payment = getPaymentInfo();
      if (selectedMethod === 'promptpay') {
        box.innerHTML = `
          <div style="font-size:0.85rem;color:var(--text-soft);">สแกน QR พร้อมเพย์ หรือโอนตามหมายเลขด้านล่าง</div>
          <div class="pay-qr" title="QR พร้อมเพย์ (ตัวอย่าง)"></div>
          <div class="pay-amount">${formatPrice(total)}</div>
          <div class="pay-account">
            <strong>พร้อมเพย์:</strong> ${payment.promptpay.id}<br>
            <strong>ชื่อรับเงิน:</strong> ${payment.promptpay.name}<br>
            <span style="font-size:0.78rem;color:var(--text-soft);">* โอนแล้วแนบสลิปด้านล่างได้เลย หรือส่งทาง Facebook/LINE (ไม่บังคับ)</span>
          </div>
        `;
      } else if (selectedMethod === 'bank') {
        const accountLine = payment.bank.account
          ? `<strong>เลขบัญชี:</strong> ${payment.bank.account}<br>`
          : `<span style="font-size:0.82rem;color:var(--text-soft);">ยังไม่ได้ตั้งเลขบัญชี — โทร ${SHOP_CONFIG.phoneDisplay} เพื่อขอเลขบัญชี</span><br>`;
        box.innerHTML = `
          <div style="font-size:0.85rem;color:var(--text-soft);">โอนเงินเข้าบัญชีธนาคาร</div>
          <div class="pay-amount">${formatPrice(total)}</div>
          <div class="pay-account">
            <strong>ธนาคาร:</strong> ${payment.bank.bank}<br>
            ${accountLine}
            <strong>ชื่อบัญชี:</strong> ${payment.bank.name}<br>
            <span style="font-size:0.78rem;color:var(--text-soft);">* โอนแล้วแนบสลิปด้านล่างได้เลย หรือส่งทาง Facebook/LINE (ไม่บังคับ)</span>
          </div>
        `;
      } else {
        box.innerHTML = `
          <div style="font-size:1.5rem;margin-bottom:0.4rem;">🏠</div>
          <div style="font-weight:600;color:var(--rattan-deep);">ชำระเมื่อรับสินค้า</div>
          <div class="pay-amount">${formatPrice(total)}</div>
          <div class="pay-account" style="text-align:center;">
            จ่ายเงินสดตอนรับของ<br>
            <span style="font-size:0.78rem;color:var(--text-soft);">ร้านจะติดต่อยืนยันที่อยู่และเวลานัดรับ</span>
          </div>
        `;
      }

      toggleSlipUploadUI(paymentNeedsSlip(selectedMethod));
      if (!paymentNeedsSlip(selectedMethod)) resetPendingSlip();

      // Build full order text for copy
      const name = document.getElementById('custName').value.trim();
      const phone = document.getElementById('custPhone').value.trim();
      const address = getCustomerAddress();
      const note = document.getElementById('custNote').value.trim();

      let text = '🛒 สั่งซื้อจากร้านราชาหวายสุรินทร์\n';
      text += '─────────────────\n';
      text += `ชื่อ: ${name}\n`;
      text += `โทร: ${phone}\n`;
      if (address) text += `ที่อยู่: ${address}\n`;
      if (note) text += `หมายเหตุ: ${note}\n`;
      text += `วิธีชำระ: ${methodLabel(selectedMethod)}\n`;
      text += '─────────────────\n';
      cart.forEach(item => {
        const p = products.find(x => x.id === item.id);
        if (p) {
          text += `• ${p.name}\n  ${item.qty} ชิ้น × ${formatPrice(p.price)} = ${formatPrice(p.price * item.qty)}\n`;
        }
      });
      text += '─────────────────\n';
      text += `ยอดสินค้า: ${formatPrice(getCartSubtotal())}\n`;
      if (getPromoDiscount() > 0) text += `ส่วนลด: -${formatPrice(getPromoDiscount())}\n`;
      text += `ค่าจัดส่ง: ${getShippingFee() > 0 ? formatPrice(getShippingFee()) : 'ฟรี'}\n`;
      text += `รวมทั้งสิ้น: ${formatPrice(total)}\n`;
      text += `จำนวน: ${getCartCount()} ชิ้น\n\n`;
      if (selectedMethod === 'promptpay') {
        text += `พร้อมเพย์: ${getPaymentInfo().promptpay.id}\nชื่อรับเงิน: ${getPaymentInfo().promptpay.name}\n`;
      } else if (selectedMethod === 'bank') {
        const bank = getPaymentInfo().bank;
        text += `โอน ${bank.bank}\nบัญชี: ${bank.account || '(ติดต่อร้าน)'}\nชื่อ: ${bank.name}\n`;
      } else {
        text += 'ชำระเงินสดตอนรับสินค้า\n';
      }
      text += '\n* ราคาเป็นราคาประมาณ รบกวนยืนยันกับร้านอีกครั้ง\nขอบคุณครับ/ค่ะ';
      orderSummary.textContent = text;
    }

    function copyText(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
      }
      return Promise.resolve(fallbackCopy(text));
    }

    function fallbackCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
    }

    copyOrderBtn.addEventListener('click', () => {
      const text = orderSummary.textContent;
      copyText(text).then(() => {
        showToast('คัดลอกสรุปคำสั่งซื้อแล้ว ✓');
        copyOrderBtn.textContent = '✓ คัดลอกแล้ว';
        setTimeout(() => { copyOrderBtn.textContent = '📋 คัดลอกสรุปคำสั่งซื้อ'; }, 2000);
      });
    });

    // ========== ORDER STATUS SYSTEM ==========
    const STATUS_FLOW = [
      { key: 'pending', label: 'รอชำระเงิน / รอแจ้งสลิป', badge: 'pending' },
      { key: 'confirmed', label: 'ร้านรับออเดอร์แล้ว', badge: 'paid' },
      { key: 'preparing', label: 'กำลังจัดเตรียมสินค้า', badge: 'preparing' },
      { key: 'shipping', label: 'จัดส่งแล้ว', badge: 'shipping' },
      { key: 'completed', label: 'เสร็จสิ้น', badge: 'done' }
    ];

    const COD_FLOW = [
      { key: 'pending', label: 'รอร้านยืนยันออเดอร์', badge: 'cod' },
      { key: 'confirmed', label: 'ร้านรับออเดอร์แล้ว', badge: 'paid' },
      { key: 'preparing', label: 'กำลังจัดเตรียมสินค้า', badge: 'preparing' },
      { key: 'shipping', label: 'ออกจัดส่ง / นัดรับ', badge: 'shipping' },
      { key: 'completed', label: 'รับสินค้าและชำระแล้ว', badge: 'done' }
    ];

    let lastOrderId = null;
    let currentTrackOrder = null;

    function genOrderId() {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const seq = String(orderSeq++).padStart(3, '0');
      return `RW${y}${m}${day}-${seq}`;
    }

    function formatDateTime(ts) {
      const d = new Date(ts);
      return d.toLocaleString('th-TH', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    }

    function createOrder() {
      const name = document.getElementById('custName').value.trim();
      const phoneRaw = document.getElementById('custPhone').value.trim();
      const phoneDisplay = formatPhoneDisplay(phoneRaw);
      const address = getCustomerAddress();
      const note = document.getElementById('custNote').value.trim();
      const subtotal = getCartSubtotal();
      const promo = getPromoDiscount();
      const shipping = getShippingFee();
      const total = getCartTotal();
      const items = cart.map(item => {
        const p = products.find(x => x.id === item.id);
        return p ? { id: p.id, name: p.name, emoji: p.emoji, qty: item.qty, price: p.price } : null;
      }).filter(Boolean);

      const id = genOrderId();
      const now = Date.now();
      const flow = selectedMethod === 'cod' ? COD_FLOW : STATUS_FLOW;
      const order = {
        id,
        name,
        phone: phoneDisplay.replace(/\D/g, ''),
        phoneDisplay,
        address,
        note,
        method: selectedMethod,
        items,
        subtotal,
        promoDiscount: promo,
        shippingFee: shipping,
        total,
        statusIndex: 0,
        history: [{ index: 0, at: now }],
        createdAt: now,
        paymentSlip: pendingSlip || null,
        slipUploadedAt: pendingSlip ? now : null
      };
      orders.unshift(order);
      lastOrderId = id;

      // clear cart after order
      cart = [];
      saveOrders();
      saveCart();
      updateBadge();

      return order;
    }

    document.getElementById('confirmOrderBtn').addEventListener('click', () => {
      const order = createOrder();
      resetPendingSlip();
      document.getElementById('successOrderBox').innerHTML = `
        <div>เลขที่ออเดอร์</div>
        <strong id="successOrderId">${order.id}</strong>
        <div style="margin-top:0.5rem;font-size:0.85rem;">
          ลูกค้า: ${order.name}<br>
          โทร: ${order.phoneDisplay}<br>
          ยอดรวม: ${formatPrice(order.total)}<br>
          วิธีชำระ: ${methodLabel(order.method)}
        </div>
      `;
      renderSuccessSlipSection(order);
      setPayStep(4);
      if (order.paymentSlip) {
        showToast('บันทึกคำสั่งซื้อและสลิปแล้ว ✓');
      } else {
        showToast('บันทึกคำสั่งซื้อแล้ว ✓');
      }
    });

    async function processSlipFile(file, target) {
      if (!file || !file.type.startsWith('image/')) {
        showToast('กรุณาเลือกไฟล์รูปภาพ (JPG, PNG)');
        return null;
      }
      if (file.size > 8 * 1024 * 1024) {
        showToast('ไฟล์ใหญ่เกินไป กรุณาเลือกรูปไม่เกิน 8 MB');
        return null;
      }
      try {
        const dataUrl = await readFileAsDataURL(file);
        return await compressSlipImage(dataUrl);
      } catch (e) {
        showToast('อ่านไฟล์ไม่สำเร็จ ลองใหม่อีกครั้ง');
        return null;
      }
    }

    document.getElementById('slipFileInput')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const compressed = await processSlipFile(file, 'checkout');
      if (compressed) {
        updateSlipPreview(compressed);
        showToast('แนบสลิปแล้ว ✓');
      }
    });

    document.getElementById('slipRemoveBtn')?.addEventListener('click', () => {
      resetPendingSlip();
      showToast('ลบรูปสลิปแล้ว');
    });

    document.getElementById('successSlipFileInput')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const compressed = await processSlipFile(file, 'success');
      if (!compressed) return;
      successPendingSlip = compressed;
      const preview = document.getElementById('successSlipPreview');
      const placeholder = document.getElementById('successSlipPlaceholder');
      const submitBtn = document.getElementById('successSlipSubmitBtn');
      if (preview) {
        preview.src = compressed;
        preview.hidden = false;
      }
      if (placeholder) placeholder.style.display = 'none';
      if (submitBtn) submitBtn.style.display = 'inline-flex';
    });

    document.getElementById('successSlipSubmitBtn')?.addEventListener('click', () => {
      if (!lastOrderId || !successPendingSlip) return;
      const order = orders.find(x => x.id === lastOrderId);
      if (!order) return;
      order.paymentSlip = successPendingSlip;
      order.slipUploadedAt = Date.now();
      saveOrders();
      renderSuccessSlipSection(order);
      showToast('ส่งสลิปให้ร้านแล้ว ✓');
    });

    document.getElementById('copyOrderIdBtn').addEventListener('click', () => {
      if (!lastOrderId) return;
      copyText(lastOrderId).then(() => {
        showToast('คัดลอกเลขที่ออเดอร์แล้ว ✓');
      });
    });

    document.getElementById('closeSuccessBtn').addEventListener('click', () => {
      checkoutModal.classList.remove('open');
    });

    document.getElementById('viewStatusBtn').addEventListener('click', () => {
      checkoutModal.classList.remove('open');
      openStatusModal(lastOrderId);
    });

    // Status modal
    const statusModal = document.getElementById('statusModal');
    const statusClose = document.getElementById('statusClose');
    const trackInput = document.getElementById('trackInput');
    const trackBtn = document.getElementById('trackBtn');
    const statusResult = document.getElementById('statusResult');
    const statusNotFound = document.getElementById('statusNotFound');
    const statusOrderInfo = document.getElementById('statusOrderInfo');
    const statusTimeline = document.getElementById('statusTimeline');

    function openStatusModal(prefill) {
      statusResult.classList.remove('show');
      statusNotFound.classList.remove('show');
      trackInput.value = prefill || '';
      document.getElementById('errTrack').classList.remove('show');
      statusModal.classList.add('open');
      if (prefill) {
        setTimeout(() => doTrack(), 100);
      }
    }

    document.getElementById('statusBtn').addEventListener('click', () => openStatusModal());
    statusClose.addEventListener('click', () => statusModal.classList.remove('open'));
    statusModal.addEventListener('click', (e) => {
      if (e.target === statusModal) statusModal.classList.remove('open');
    });

    function findOrders(query) {
      const q = query.trim().toLowerCase().replace(/[-\s]/g, '');
      if (!q) return [];
      return orders.filter(o => {
        const idNorm = o.id.toLowerCase().replace(/-/g, '');
        const phoneNorm = o.phone.replace(/[-\s]/g, '');
        return idNorm.includes(q) || phoneNorm.includes(q) || o.id.toLowerCase() === query.trim().toLowerCase();
      });
    }

    function getFlow(order) {
      return order.method === 'cod' ? COD_FLOW : STATUS_FLOW;
    }

    function renderStatus(order) {
      currentTrackOrder = order;
      const flow = getFlow(order);
      const cur = flow[order.statusIndex];
      const itemsText = order.items.map(i => `${i.emoji} ${i.name} × ${i.qty}`).join('<br>');

      statusOrderInfo.innerHTML = `
        <div>เลขที่ออเดอร์ <strong>${order.id}</strong></div>
        <div style="margin-top:0.35rem;font-size:0.85rem;">
          ${order.name} · ${order.phoneDisplay}<br>
          ยอดประมาณ ${formatPrice(order.total)} · ${methodLabel(order.method)}
        </div>
        <span class="status-badge-tag ${cur.badge}">${cur.label}</span>
        <div style="margin-top:0.6rem;font-size:0.82rem;color:var(--text-soft);">${itemsText}</div>
      `;

      statusTimeline.innerHTML = flow.map((s, i) => {
        let cls = '';
        if (i < order.statusIndex) cls = 'done';
        else if (i === order.statusIndex) cls = 'current';
        const hist = order.history.find(h => h.index === i);
        const time = hist ? formatDateTime(hist.at) : '';
        return `
          <div class="timeline-item ${cls}">
            <div class="timeline-dot"></div>
            <div class="timeline-label">${s.label}</div>
            ${time ? `<div class="timeline-time">${time}</div>` : ''}
          </div>
        `;
      }).join('');

      statusNotFound.classList.remove('show');
      statusResult.classList.add('show');

      const advBtn = document.getElementById('advanceStatusBtn');
      if (order.statusIndex >= flow.length - 1) {
        advBtn.style.display = 'none';
      } else {
        advBtn.style.display = 'inline-flex';
      }
    }

    function doTrack() {
      const q = trackInput.value.trim();
      document.getElementById('errTrack').classList.toggle('show', !q);
      if (!q) return;

      const found = findOrders(q);
      if (found.length === 0) {
        statusResult.classList.remove('show');
        statusNotFound.classList.add('show');
        currentTrackOrder = null;
        return;
      }
      renderStatus(found[0]);
    }

    trackBtn.addEventListener('click', doTrack);
    trackInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doTrack();
    });

    document.getElementById('advanceStatusBtn').addEventListener('click', () => {
      if (!currentTrackOrder) return;
      const flow = getFlow(currentTrackOrder);
      if (currentTrackOrder.statusIndex >= flow.length - 1) return;
      currentTrackOrder.statusIndex += 1;
      currentTrackOrder.history.push({
        index: currentTrackOrder.statusIndex,
        at: Date.now()
      });
      renderStatus(currentTrackOrder);
      showToast('อัปเดตสถานะแล้ว ✓');
    });

    // ========== PRINT SHIPPING LABEL ==========
    const SENDER = {
      name: 'ร้านราชาหวายสุรินทร์',
      address: '126 หมู่ 4 บ้านบุทม\nตำบลเมืองที อำเภอเมือง\nจังหวัดสุรินทร์ 32000',
      phone: '081-470-7089'
    };

    function escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/\n/g, '<br>');
    }

    function printShippingLabel(order) {
      if (!order) {
        showToast('ไม่พบข้อมูลออเดอร์');
        return;
      }
      if (!order.address) {
        showToast('ไม่มีที่อยู่จัดส่ง');
        return;
      }

      const itemsList = (order.items || [])
        .map(i => `${i.name} × ${i.qty}`)
        .join(', ');

      const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <title>ใบปะหน้า ${order.id}</title>
  <style>
    @page { size: A5 portrait; margin: 8mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Sarabun', 'Tahoma', 'Segoe UI', sans-serif;
      color: #1a1a1a;
      padding: 0;
      background: #fff;
    }
    .sheet {
      width: 100%;
      max-width: 148mm;
      margin: 0 auto;
      border: 2px solid #222;
      padding: 10mm 8mm;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #222;
      padding-bottom: 6px;
      margin-bottom: 10px;
    }
    .header h1 {
      font-size: 16pt;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    .header .sub {
      font-size: 9pt;
      margin-top: 2px;
    }
    .meta {
      display: flex;
      justify-content: space-between;
      font-size: 9pt;
      margin-bottom: 10px;
      gap: 8px;
    }
    .box {
      border: 1.5px solid #333;
      border-radius: 4px;
      padding: 8px 10px;
      margin-bottom: 10px;
      page-break-inside: avoid;
    }
    .box-title {
      font-size: 9pt;
      font-weight: 700;
      background: #222;
      color: #fff;
      display: inline-block;
      padding: 2px 8px;
      margin: -8px 0 8px -10px;
      border-radius: 4px 0 4px 0;
    }
    .role {
      font-size: 8pt;
      color: #555;
      margin-bottom: 2px;
    }
    .name {
      font-size: 13pt;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .addr {
      font-size: 11pt;
      line-height: 1.45;
      margin-bottom: 4px;
      white-space: pre-line;
    }
    .phone {
      font-size: 10pt;
      margin-top: 4px;
    }
    .items {
      font-size: 9pt;
      border-top: 1px dashed #999;
      margin-top: 8px;
      padding-top: 6px;
    }
    .footer {
      margin-top: 12px;
      font-size: 8pt;
      color: #555;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #ccc;
      padding-top: 6px;
    }
    .barcode {
      text-align: center;
      font-family: 'Courier New', monospace;
      font-size: 12pt;
      letter-spacing: 0.15em;
      font-weight: 700;
      margin: 8px 0 4px;
      padding: 6px;
      border: 1px dashed #666;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    .no-print {
      text-align: center;
      margin: 12px;
    }
    .no-print button {
      font-family: inherit;
      font-size: 14px;
      padding: 10px 20px;
      margin: 0 6px;
      cursor: pointer;
      border-radius: 8px;
      border: 1px solid #5c4033;
      background: #5c4033;
      color: #fff;
    }
    .no-print button.secondary {
      background: #fff;
      color: #5c4033;
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()">🖨️ พิมพ์ใบปะหน้า</button>
    <button class="secondary" onclick="window.close()">ปิดหน้าต่าง</button>
  </div>
  <div class="sheet">
    <div class="header">
      <h1>ใบปะหน้าพัสดุ</h1>
      <div class="sub">ร้านราชาหวายสุรินทร์ · งานหัตถกรรมหวายบ้านบุทม</div>
    </div>
    <div class="meta">
      <div>เลขที่ออเดอร์: <strong>${escapeHtml(order.id)}</strong></div>
      <div>วันที่: ${formatDateTime(order.createdAt)}</div>
    </div>
    <div class="barcode">${escapeHtml(order.id)}</div>

    <div class="box">
      <div class="box-title">ผู้ส่ง (FROM)</div>
      <div class="role">ต้นทาง</div>
      <div class="name">${escapeHtml(SENDER.name)}</div>
      <div class="addr">${escapeHtml(SENDER.address)}</div>
      <div class="phone">โทร. ${escapeHtml(SENDER.phone)}</div>
    </div>

    <div class="box">
      <div class="box-title">ผู้รับ (TO)</div>
      <div class="role">ปลายทาง</div>
      <div class="name">${escapeHtml(order.name)}</div>
      <div class="addr">${escapeHtml(order.address)}</div>
      <div class="phone">โทร. ${escapeHtml(order.phoneDisplay || order.phone)}</div>
      ${order.note ? `<div class="items">หมายเหตุ: ${escapeHtml(order.note)}</div>` : ''}
    </div>

    <div class="items">
      <strong>รายการ:</strong> ${escapeHtml(itemsList || '-')}<br>
      <strong>ยอดประมาณ:</strong> ฿${(order.total || 0).toLocaleString('th-TH')} · ${escapeHtml(methodLabel(order.method))}
    </div>
    <div class="footer">
      <span>กรุณาจัดการด้วยความระมัดระวัง</span>
      <span>www · ราชาหวายสุรินทร์</span>
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 300);
    };
  <\/script>
</body>
</html>`;

      const w = window.open('', '_blank', 'width=700,height=900');
      if (!w) {
        showToast('กรุณาอนุญาตป๊อปอัปเพื่อพิมพ์ใบปะหน้า');
        return;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
    }

    document.getElementById('printLabelBtn').addEventListener('click', () => {
      const order = orders.find(o => o.id === lastOrderId);
      if (!order) {
        showToast('ไม่พบข้อมูลออเดอร์ล่าสุด');
        return;
      }
      printShippingLabel(order);
    });

    document.getElementById('printLabelFromStatusBtn').addEventListener('click', () => {
      printShippingLabel(currentTrackOrder);
    });

    // ========== ADMIN PANEL ==========
    let adminLoggedIn = false;
    let adminTab = 'dash';
    let editingProductId = null;
    let nextProductId = Math.max(...products.map(p => p.id), 0) + 1;

    const categoryMap = {
      basket: 'ตะกร้าหวาย',
      chair: 'เก้าอี้หวาย',
      home: 'ของใช้ในบ้าน'
    };

    const categoryReverseMap = {
      basket: 'basket',
      chair: 'chair',
      home: 'home',
      'ตะกร้าหวาย': 'basket',
      'เก้าอี้หวาย': 'chair',
      'ของใช้ในบ้าน': 'home',
    };

    const PRODUCT_IMPORT_HEADERS = [
      'ชื่อสินค้า',
      'ราคา',
      'หมวดหมู่',
      'รายละเอียดสั้น',
      'รายละเอียดเต็ม',
      'ป้าย',
      'อีโมจิ',
      'ลิงก์รูป',
    ];

    function normalizeImportHeader(value) {
      return String(value || '')
        .replace(/^\uFEFF/, '')
        .replace(/\*$/, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '');
    }

    const PRODUCT_IMPORT_ALIASES = {
      'ชื่อสินค้า': 'name',
      name: 'name',
      'ราคา': 'price',
      price: 'price',
      'หมวดหมู่': 'cat',
      cat: 'cat',
      category: 'cat',
      'รายละเอียดสั้น': 'desc',
      desc: 'desc',
      'รายละเอียดเต็ม': 'detail',
      detail: 'detail',
      'ป้าย': 'badge',
      badge: 'badge',
      'อีโมจิ': 'emoji',
      emoji: 'emoji',
      'ลิงก์รูป': 'images',
      images: 'images',
      'ลิงก์รูปภาพ': 'images',
      imageurls: 'images',
    };

    function parseCsvText(text) {
      const rows = [];
      let row = [];
      let cell = '';
      let inQuotes = false;
      const src = String(text || '').replace(/^\uFEFF/, '');
      for (let i = 0; i < src.length; i++) {
        const c = src[i];
        const next = src[i + 1];
        if (inQuotes) {
          if (c === '"' && next === '"') {
            cell += '"';
            i++;
          } else if (c === '"') {
            inQuotes = false;
          } else {
            cell += c;
          }
        } else if (c === '"') {
          inQuotes = true;
        } else if (c === ',') {
          row.push(cell);
          cell = '';
        } else if (c === '\r' && next === '\n') {
          row.push(cell);
          rows.push(row);
          row = [];
          cell = '';
          i++;
        } else if (c === '\n' || c === '\r') {
          row.push(cell);
          rows.push(row);
          row = [];
          cell = '';
        } else {
          cell += c;
        }
      }
      if (cell.length || row.length) {
        row.push(cell);
        rows.push(row);
      }
      return rows.filter((r) => r.some((v) => String(v || '').trim()));
    }

    function csvEscape(value) {
      const s = String(value ?? '');
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    }

    function buildProductImportTemplateRows() {
      return [
        PRODUCT_IMPORT_HEADERS.map((h, i) => (i < 2 ? `${h}*` : h)),
        [
          'ตะกร้าหวายทรงกลม 2 ชั้น',
          '550',
          'ตะกร้าหวาย',
          'กลม 2 ชั้น พิเศษ สานมือ',
          'เหมาะใส่ของใช้ในบ้าน ของฝาก หรือตั้งโชว์',
          'ขายดี',
          '🧺',
          '',
        ],
        [
          'เก้าอี้หวายพักผ่อน',
          '1290',
          'เก้าอี้หวาย',
          'นั่งสบาย โครงแข็ง',
          'รายละเอียดเพิ่มเติม ขนาด วัสดุ วิธีดูแล',
          '',
          '🪑',
          'https://example.com/photo1.jpg|https://example.com/photo2.jpg',
        ],
        [
          'ที่รองจานหวาย',
          '180',
          'ของใช้ในบ้าน',
          'ลายสานสวย ใช้บนโต๊ะอาหาร',
          '',
          'ใหม่',
          '🏡',
          '',
        ],
      ];
    }

    function rowsToCsv(rows) {
      return rows.map((row) => row.map(csvEscape).join(',')).join('\r\n');
    }

    function downloadProductImportTemplate() {
      const rows = buildProductImportTemplateRows();
      const csv = '\uFEFF' + rowsToCsv(rows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'rachawei-sanpham-template.csv';
      a.click();
      URL.revokeObjectURL(a.href);
      showToast('ดาวน์โหลดเทมเพลตแล้ว — เปิดด้วย Excel แล้วกรอกข้อมูล');
    }

    function exportProductsToCsv() {
      const rows = [
        PRODUCT_IMPORT_HEADERS,
        ...products.map((p) => [
          p.name || '',
          p.price ?? '',
          categoryMap[p.cat] || p.cat || '',
          p.desc || '',
          p.detail || '',
          p.badge || '',
          p.emoji || '',
          getProductImages(p).join('|'),
        ]),
      ];
      const csv = '\uFEFF' + rowsToCsv(rows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'rachawei-sanpham-export.csv';
      a.click();
      URL.revokeObjectURL(a.href);
      showToast('ส่งออกรายการสินค้าเป็น CSV แล้ว');
    }

    let sheetJsPromise = null;
    function loadSheetJs() {
      if (window.XLSX) return Promise.resolve(window.XLSX);
      if (sheetJsPromise) return sheetJsPromise;
      sheetJsPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
        script.async = true;
        script.onload = () => resolve(window.XLSX);
        script.onerror = () => reject(new Error('โหลดตัวอ่าน Excel ไม่สำเร็จ'));
        document.head.appendChild(script);
      });
      return sheetJsPromise;
    }

    async function readSpreadsheetRows(file) {
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      if (ext === 'csv' || ext === 'txt') {
        const text = await file.text();
        return parseCsvText(text);
      }
      if (ext === 'xlsx' || ext === 'xls') {
        const XLSX = await loadSheetJs();
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const sheetName = wb.SheetNames[0];
        if (!sheetName) return [];
        const sheet = wb.Sheets[sheetName];
        return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
      }
      throw new Error('รองรับไฟล์ CSV หรือ Excel (.xlsx, .xls) เท่านั้น');
    }

    function mapImportRow(row, headerMap) {
      const data = {};
      row.forEach((value, index) => {
        const key = headerMap[index];
        if (!key) return;
        data[key] = String(value ?? '').trim();
      });
      return data;
    }

    function parseImportImageUrls(raw) {
      if (!raw) return [];
      return raw
        .split(/[|;,]/)
        .map((s) => s.trim())
        .filter((s) => s.startsWith('http'))
        .slice(0, MAX_PRODUCT_IMAGES);
    }

    function resolveImportCategory(raw) {
      const key = String(raw || '').trim();
      if (!key) return 'basket';
      return categoryReverseMap[key] || categoryReverseMap[key.toLowerCase()] || 'basket';
    }

    function parseProductImportRows(rows) {
      if (!rows.length) {
        return { items: [], errors: ['ไฟล์ว่างหรือไม่มีข้อมูล'] };
      }

      const headerRowIndex = rows.findIndex((row) =>
        row.some((cell) => {
          const norm = normalizeImportHeader(cell);
          return norm.includes('ชื่อสินค้า') || norm === 'name';
        })
      );
      if (headerRowIndex < 0) {
        return { items: [], errors: ['ไม่พบหัวคอลัมน์ "ชื่อสินค้า" ในไฟล์'] };
      }

      const headerMap = rows[headerRowIndex].map((cell) => {
        const norm = normalizeImportHeader(cell);
        return PRODUCT_IMPORT_ALIASES[norm] || PRODUCT_IMPORT_ALIASES[cell.trim()] || null;
      });

      const items = [];
      const errors = [];

      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row.some((v) => String(v || '').trim())) continue;

        const data = mapImportRow(row, headerMap);
        const name = data.name || '';
        const priceRaw = (data.price || '').replace(/[^\d.]/g, '');
        const price = parseFloat(priceRaw);

        if (!name) {
          errors.push(`แถว ${i + 1}: ไม่มีชื่อสินค้า — ข้าม`);
          continue;
        }
        if (!priceRaw || isNaN(price) || price < 0) {
          errors.push(`แถว ${i + 1}: ราคา "${data.price || ''}" ไม่ถูกต้อง — ข้าม`);
          continue;
        }

        const cat = resolveImportCategory(data.cat);
        const images = parseImportImageUrls(data.images);
        items.push({
          name,
          price,
          cat,
          category: categoryMap[cat] || cat,
          desc: data.desc || '',
          detail: data.detail || '',
          badge: data.badge || null,
          emoji: data.emoji || '🧺',
          images,
          image: images[0] || null,
        });
      }

      return { items, errors };
    }

    async function previewProductImport(file) {
      const rows = await readSpreadsheetRows(file);
      return parseProductImportRows(rows);
    }

    function applyProductImport(items, mode) {
      if (!items.length) return { added: 0, updated: 0 };

      if (mode === 'replace') {
        products.length = 0;
      }

      let added = 0;
      items.forEach((item) => {
        products.push({
          id: nextProductId++,
          name: item.name,
          price: item.price,
          cat: item.cat,
          category: item.category,
          desc: item.desc,
          detail: item.detail,
          badge: item.badge,
          emoji: item.emoji,
          images: item.images,
          image: item.image,
        });
        added++;
      });

      nextProductId = Math.max(...products.map((p) => p.id), 0) + 1;
      const validIds = new Set(products.map((p) => p.id));
      cart = cart.filter((c) => validIds.has(c.id));
      saveProducts();
      saveCart();
      updateBadge();
      renderProducts(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
      return { added, updated: 0 };
    }

    const adminOverlay = document.getElementById('adminOverlay');
    const adminContent = document.getElementById('adminContent');
    const adminLoginView = document.getElementById('adminLoginView');
    const adminMainView = document.getElementById('adminMainView');

    function refreshAdminLoginView() {
      const title = document.getElementById('adminLoginTitle');
      const hint = document.getElementById('adminLoginHint');
      const btn = document.getElementById('adminLoginBtn');
      const err = document.getElementById('errAdminPin');
      const setup = hasAdminPinConfigured();
      if (title) title.textContent = setup ? 'เข้าสู่ระบบหลังร้าน' : 'ตั้งรหัสหลังร้านครั้งแรก';
      if (hint) {
        hint.innerHTML = setup
          ? 'รหัสผ่านสำหรับเจ้าของร้าน<br><small>เข้าผ่านลิงก์ #admin หรือเปลี่ยน PIN ในแท็บตั้งค่า</small>'
          : 'ยังไม่มีรหัสในเครื่องนี้ — ตั้งรหัส 4 หลักขึ้นไป (เก็บเฉพาะเบราว์เซอร์นี้)';
      }
      if (btn) btn.textContent = setup ? 'เข้าสู่ระบบ' : 'บันทึกรหัสและเข้าใช้งาน';
      if (err) err.textContent = setup ? 'รหัสผ่านไม่ถูกต้อง' : 'กรุณาตั้งรหัสอย่างน้อย 4 หลัก';
    }

    function openAdminPanel() {
      adminOverlay.classList.add('open');
      if (adminLoggedIn) {
        showAdminMain();
      } else {
        adminLoginView.style.display = 'block';
        adminMainView.style.display = 'none';
        document.getElementById('adminPin').value = '';
        document.getElementById('errAdminPin').classList.remove('show');
        refreshAdminLoginView();
      }
    }

    document.getElementById('adminOpenBtn')?.addEventListener('click', openAdminPanel);

    document.getElementById('adminCloseBtn').addEventListener('click', () => {
      adminOverlay.classList.remove('open');
    });
    adminOverlay.addEventListener('click', (e) => {
      if (e.target === adminOverlay) adminOverlay.classList.remove('open');
    });

    document.getElementById('adminLoginBtn').addEventListener('click', doAdminLogin);
    document.getElementById('adminPin').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doAdminLogin();
    });

    function doAdminLogin() {
      const pin = document.getElementById('adminPin').value.trim();
      if (!hasAdminPinConfigured()) {
        if (pin.length < 4) {
          document.getElementById('errAdminPin').classList.add('show');
          return;
        }
        SHOP_CONFIG.adminPinHash = hashAdminPin(pin);
        saveShopSettings({});
        adminLoggedIn = true;
        document.getElementById('errAdminPin').classList.remove('show');
        showAdminMain();
        showToast('ตั้งรหัสหลังร้านแล้ว ✓');
        return;
      }
      if (verifyAdminPin(pin)) {
        adminLoggedIn = true;
        document.getElementById('errAdminPin').classList.remove('show');
        showAdminMain();
        showToast('เข้าสู่ระบบหลังร้านแล้ว ✓');
      } else {
        document.getElementById('errAdminPin').classList.add('show');
      }
    }

    function showAdminMain() {
      adminLoginView.style.display = 'none';
      adminMainView.style.display = 'flex';
      renderAdminTab(adminTab);
    }

    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        adminTab = tab.dataset.tab;
        editingProductId = null;
        editingVideoId = null;
        renderAdminTab(adminTab);
      });
    });

    function renderAdminTab(tab) {
      if (tab === 'dash') renderAdminDash();
      else if (tab === 'products') renderAdminProducts();
      else if (tab === 'videos') renderAdminVideos();
      else if (tab === 'orders') renderAdminOrders();
      else if (tab === 'settings') renderAdminSettings();
    }

    async function saveShopSettings(partial) {
      // exposed for tests
      Object.assign(SHOP_CONFIG, partial);
      applyShopConfig();
      if (dbReady) {
        try {
          const toSave = {
            shopName: SHOP_CONFIG.shopName,
            shopSub: SHOP_CONFIG.shopSub,
            phoneDisplay: SHOP_CONFIG.phoneDisplay,
            phoneTel: SHOP_CONFIG.phoneTel,
            lineUrl: SHOP_CONFIG.lineUrl,
            facebookUrl: SHOP_CONFIG.facebookUrl,
            addressHtml: SHOP_CONFIG.addressHtml,
            mapUrl: SHOP_CONFIG.mapUrl,
            adminPinHash: getAdminPinHash(),
            promoMin: SHOP_CONFIG.promoMin,
            promoDiscount: SHOP_CONFIG.promoDiscount,
            shippingFee: SHOP_CONFIG.shippingFee,
            freeShippingMin: SHOP_CONFIG.freeShippingMin,
            bankName: SHOP_CONFIG.bankName,
            bankAccountName: SHOP_CONFIG.bankAccountName,
            promptPayNo: SHOP_CONFIG.promptPayNo,
            bankAccountNo: SHOP_CONFIG.bankAccountNo,
            bankNote: SHOP_CONFIG.bankNote,
            heroImages: Array.isArray(SHOP_CONFIG.heroImages) ? SHOP_CONFIG.heroImages : []
          };
          await idbSet('shopSettings', toSave);
        } catch (e) { console.warn(e); }
      }
      showToast('บันทึกตั้งค่าร้านแล้ว');
    }

    function renderAdminSettings() {
      const c = SHOP_CONFIG;
      const el = document.getElementById('adminContent');
      const heroImages = Array.isArray(c.heroImages) ? c.heroImages.filter(Boolean) : [];
      window._heroImagesDraft = heroImages.slice();

      el.innerHTML = `
        <div class="admin-section-title">ตั้งค่าร้าน (แก้ไขได้ตลอด)</div>
        <p style="font-size:0.85rem;color:var(--text-soft);margin-bottom:1rem;line-height:1.55;">
          ค่าเหล่านี้บันทึกในเบราว์เซอร์เครื่องนี้ และแสดงบนหน้าร้านทันที
          หากต้องการให้ผู้เข้าชมทุกคนเห็นค่าเดียวกันถาวร ให้แก้ในไฟล์ <code>SHOP_CONFIG</code> แล้ว deploy ใหม่
        </p>
        <div style="display:grid;gap:0.75rem;max-width:560px;">
          <label style="font-size:0.82rem;font-weight:600;">ชื่อร้าน
            <input class="admin-input" id="setShopName" value="${escapeHtml(c.shopName||'')}" style="width:100%;margin-top:0.25rem;"></label>
          <label style="font-size:0.82rem;font-weight:600;">เบอร์แสดงผล
            <input class="admin-input" id="setPhoneDisplay" value="${escapeHtml(c.phoneDisplay||'')}" style="width:100%;margin-top:0.25rem;"></label>
          <label style="font-size:0.82rem;font-weight:600;">เบอร์โทร (รูปแบบ +66…)
            <input class="admin-input" id="setPhoneTel" value="${escapeHtml(c.phoneTel||'')}" style="width:100%;margin-top:0.25rem;"></label>
          <label style="font-size:0.82rem;font-weight:600;">ลิงก์ LINE
            <input class="admin-input" id="setLine" value="${escapeHtml(c.lineUrl||'')}" style="width:100%;margin-top:0.25rem;"></label>
          <label style="font-size:0.82rem;font-weight:600;">ลิงก์ Facebook
            <input class="admin-input" id="setFb" value="${escapeHtml(c.facebookUrl||'')}" style="width:100%;margin-top:0.25rem;"></label>
          <label style="font-size:0.82rem;font-weight:600;">ที่อยู่ (รองรับ HTML ขึ้นบรรทัดใหม่ด้วย &lt;br&gt;)
            <textarea class="admin-input" id="setAddress" rows="3" style="width:100%;margin-top:0.25rem;">${escapeHtml(c.addressHtml||'')}</textarea></label>
          <label style="font-size:0.82rem;font-weight:600;">ลิงก์ Google Maps
            <input class="admin-input" id="setMapUrl" value="${escapeHtml(c.mapUrl||'')}" placeholder="https://maps.app.goo.gl/..." style="width:100%;margin-top:0.25rem;"></label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;">
            <label style="font-size:0.82rem;font-weight:600;">โปร ยอดขั้นต่ำ (บาท)
              <input class="admin-input" type="number" id="setPromoMin" value="${c.promoMin||0}" style="width:100%;margin-top:0.25rem;"></label>
            <label style="font-size:0.82rem;font-weight:600;">ส่วนลด (บาท)
              <input class="admin-input" type="number" id="setPromoDisc" value="${c.promoDiscount||0}" style="width:100%;margin-top:0.25rem;"></label>
          </div>
          <label style="font-size:0.82rem;font-weight:600;">ธนาคาร
            <input class="admin-input" id="setBankName" value="${escapeHtml(c.bankName||'')}" style="width:100%;margin-top:0.25rem;"></label>
          <label style="font-size:0.82rem;font-weight:600;">ชื่อบัญชี
            <input class="admin-input" id="setBankAccName" value="${escapeHtml(c.bankAccountName||'')}" style="width:100%;margin-top:0.25rem;"></label>
          <label style="font-size:0.82rem;font-weight:600;">พร้อมเพย์ (เบอร์/เลข)
            <input class="admin-input" id="setPromptPayNo" value="${escapeHtml(c.promptPayNo || c.phoneDisplay || '')}" style="width:100%;margin-top:0.25rem;"></label>
          <label style="font-size:0.82rem;font-weight:600;">เลขบัญชีธนาคาร
            <input class="admin-input" id="setBankAccNo" value="${escapeHtml(c.bankAccountNo || '')}" placeholder="แยกจากพร้อมเพย์" style="width:100%;margin-top:0.25rem;"></label>
          <label style="font-size:0.82rem;font-weight:600;">หมายเหตุการโอน
            <input class="admin-input" id="setBankNote" value="${escapeHtml(c.bankNote||'')}" style="width:100%;margin-top:0.25rem;"></label>
          <label style="font-size:0.82rem;font-weight:600;">รหัสหลังร้าน (PIN ใหม่)
            <input class="admin-input" type="password" id="setAdminPin" placeholder="เว้นว่าง = ไม่เปลี่ยน" autocomplete="new-password" style="width:100%;margin-top:0.25rem;"></label>

          <div class="admin-section-title" style="margin-top:0.5rem;">ภาพพื้นหลังหน้าแรก</div>
          <p style="font-size:0.82rem;color:var(--text-soft);margin:0;line-height:1.5;">
            อัปโหลดรูปเพื่อสไลด์พื้นหลังฮีโร่ (แนะนำแนวนอน 1–8 รูป) เรียงลำดับ/ลบได้ แล้วกดบันทึกตั้งค่า
          </p>
          <div id="heroImageList" class="hero-admin-list"></div>
          <label class="btn btn-outline btn-sm" style="justify-content:center;cursor:pointer;">
            ➕ เพิ่มภาพพื้นหลัง
            <input type="file" id="heroImageUpload" accept="image/*" multiple hidden />
          </label>
          <button type="button" class="btn btn-outline btn-sm" id="btnResetHeroImages" style="justify-content:center;">รีเซ็ตภาพพื้นหลังเป็นค่าเริ่มต้น</button>

          <button type="button" class="btn btn-primary" id="btnSaveShopSettings" style="justify-content:center;">💾 บันทึกตั้งค่า</button>
        </div>
        <hr style="margin:1.4rem 0;border:none;border-top:1px solid rgba(196,164,132,0.35);">
        <div class="admin-section-title">ทำให้สินค้าถาวรบนเซิร์ฟเวอร์</div>
        <p style="font-size:0.85rem;color:var(--text-soft);margin-bottom:0.75rem;line-height:1.55;">
          สินค้าที่แก้ในหลังร้านเห็นเฉพาะเครื่องนี้ หากต้องการให้ลูกค้าทุกคนเห็นรายการเดียวกัน
          ให้กดส่งออก แล้วนำไฟล์ไปใส่ในโค้ดตอน deploy รอบถัดไป หรือเก็บเป็นสำรอง
        </p>
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
          <button type="button" class="btn btn-outline btn-sm" id="btnExportProductsJson">⬇️ ส่งออกสินค้า (JSON)</button>
          <button type="button" class="btn btn-outline btn-sm" id="btnResetProductsDefault">รีเซ็ตสินค้าเป็นค่าเริ่มต้น</button>
        </div>
      `;

      function paintHeroList() {
        const list = document.getElementById('heroImageList');
        if (!list) return;
        const imgs = window._heroImagesDraft || [];
        if (!imgs.length) {
          list.innerHTML = '<p style="font-size:0.82rem;color:var(--text-soft);margin:0;">ยังไม่มีภาพ — จะใช้ภาพโปรโมชันเริ่มต้น</p>';
          return;
        }
        list.innerHTML = imgs.map((src, i) => `
          <div class="hero-admin-item" data-index="${i}">
            <img src="${src}" alt="พื้นหลัง ${i + 1}" />
            <div class="hero-admin-item__actions">
              <button type="button" class="btn btn-outline btn-sm" data-hero-up ${i === 0 ? 'disabled' : ''}>↑</button>
              <button type="button" class="btn btn-outline btn-sm" data-hero-down ${i === imgs.length - 1 ? 'disabled' : ''}>↓</button>
              <button type="button" class="btn btn-outline btn-sm" data-hero-del>ลบ</button>
            </div>
          </div>
        `).join('');

        list.querySelectorAll('.hero-admin-item').forEach((row) => {
          const idx = Number(row.dataset.index);
          row.querySelector('[data-hero-up]')?.addEventListener('click', () => {
            if (idx <= 0) return;
            const arr = window._heroImagesDraft;
            [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
            paintHeroList();
          });
          row.querySelector('[data-hero-down]')?.addEventListener('click', () => {
            const arr = window._heroImagesDraft;
            if (idx >= arr.length - 1) return;
            [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
            paintHeroList();
          });
          row.querySelector('[data-hero-del]')?.addEventListener('click', () => {
            window._heroImagesDraft.splice(idx, 1);
            paintHeroList();
          });
        });
      }

      paintHeroList();

      document.getElementById('heroImageUpload').onchange = async (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = '';
        for (const file of files) {
          if (window._heroImagesDraft.length >= 10) {
            showToast('ใส่ได้สูงสุด 10 รูป');
            break;
          }
          try {
            const dataUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            const compressed = await compressImage(dataUrl, 1400, 0.78);
            window._heroImagesDraft.push(compressed);
          } catch (err) {
            console.warn(err);
            showToast('อัปโหลดรูปไม่สำเร็จ');
          }
        }
        paintHeroList();
      };

      document.getElementById('btnResetHeroImages').onclick = () => {
        window._heroImagesDraft = [
          '/images/promo/usage-shopping.png',
          '/images/promo/usage-market.png',
          '/images/promo/usage-community.png',
          '/images/promo/usage-decor.png',
          '/images/promo/usage-temple.png'
        ];
        paintHeroList();
        showToast('ตั้งภาพพื้นหลังกลับเป็นค่าเริ่มต้นแล้ว (อย่าลืมกดบันทึก)');
      };

      document.getElementById('btnSaveShopSettings').onclick = () => {
        const phoneDisplay = document.getElementById('setPhoneDisplay').value.trim();
        let phoneTel = document.getElementById('setPhoneTel').value.trim();
        if (!phoneTel && phoneDisplay) {
          const digits = phoneDisplay.replace(/\D/g, '');
          phoneTel = digits.startsWith('0') ? '+66' + digits.slice(1) : (digits ? '+' + digits : SHOP_CONFIG.phoneTel);
        }
        const nextPin = document.getElementById('setAdminPin').value.trim();
        const settingsPatch = {
          shopName: document.getElementById('setShopName').value.trim() || SHOP_CONFIG.shopName,
          phoneDisplay: phoneDisplay || SHOP_CONFIG.phoneDisplay,
          phoneTel: phoneTel || SHOP_CONFIG.phoneTel,
          lineUrl: document.getElementById('setLine').value.trim() || SHOP_CONFIG.lineUrl,
          facebookUrl: document.getElementById('setFb').value.trim() || SHOP_CONFIG.facebookUrl,
          addressHtml: document.getElementById('setAddress').value.trim() || SHOP_CONFIG.addressHtml,
          mapUrl: document.getElementById('setMapUrl').value.trim() || SHOP_CONFIG.mapUrl,
          promoMin: Number(document.getElementById('setPromoMin').value) || 0,
          promoDiscount: Number(document.getElementById('setPromoDisc').value) || 0,
          bankName: document.getElementById('setBankName').value.trim(),
          bankAccountName: document.getElementById('setBankAccName').value.trim(),
          promptPayNo: document.getElementById('setPromptPayNo').value.trim(),
          bankAccountNo: document.getElementById('setBankAccNo').value.trim(),
          bankNote: document.getElementById('setBankNote').value.trim(),
          heroImages: (window._heroImagesDraft || []).slice(0, 10)
        };
        if (nextPin) settingsPatch.adminPinHash = hashAdminPin(nextPin);
        saveShopSettings(settingsPatch);
        refreshHeroSlides();
      };

      document.getElementById('btnExportProductsJson').onclick = () => {
        const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'rachawei-products.json';
        a.click();
        URL.revokeObjectURL(a.href);
        showToast('ดาวน์โหลดไฟล์สินค้าแล้ว');
      };

      document.getElementById('btnResetProductsDefault').onclick = async () => {
        if (!confirm('รีเซ็ตสินค้ากลับเป็นรายการเริ่มต้นในไฟล์เว็บ?')) return;
        products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
        await saveProducts();
        renderProducts();
        showToast('รีเซ็ตสินค้าแล้ว');
      };
    }

    // ========== BACKUP ENCRYPTION (AES-GCM + PBKDF2) ==========
    function bufToB64(buf) {
      const bytes = new Uint8Array(buf);
      let s = '';
      for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
      return btoa(s);
    }

    function b64ToBuf(b64) {
      const s = atob(b64);
      const bytes = new Uint8Array(s.length);
      for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
      return bytes.buffer;
    }

    async function deriveKey(password, salt) {
      const enc = new TextEncoder();
      const baseKey = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
      );
      return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    }

    async function encryptBackupPayload(payload, password) {
      if (!window.crypto || !crypto.subtle) {
        throw new Error('เบราว์เซอร์ไม่รองรับการเข้ารหัส');
      }
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(password, salt);
      const plain = new TextEncoder().encode(JSON.stringify(payload));
      const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain);
      return {
        app: 'rachawei-surin',
        encrypted: true,
        version: 2,
        algo: 'AES-GCM-256',
        kdf: 'PBKDF2-SHA256-120000',
        exportedAt: new Date().toISOString(),
        salt: bufToB64(salt),
        iv: bufToB64(iv),
        data: bufToB64(cipher)
      };
    }

    async function decryptBackupFile(obj, password) {
      if (!obj || !obj.encrypted || !obj.data || !obj.salt || !obj.iv) {
        throw new Error('ไม่ใช่ไฟล์สำรองที่เข้ารหัส');
      }
      if (!window.crypto || !crypto.subtle) {
        throw new Error('เบราว์เซอร์ไม่รองรับการถอดรหัส');
      }
      const salt = new Uint8Array(b64ToBuf(obj.salt));
      const iv = new Uint8Array(b64ToBuf(obj.iv));
      const key = await deriveKey(password, salt);
      try {
        const plainBuf = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          key,
          b64ToBuf(obj.data)
        );
        return JSON.parse(new TextDecoder().decode(plainBuf));
      } catch (e) {
        throw new Error('รหัสผ่านไม่ถูกต้อง หรือไฟล์เสียหาย');
      }
    }

    function buildBackupPayload() {
      return {
        app: 'rachawei-surin',
        version: 1,
        exportedAt: new Date().toISOString(),
        products,
        shopVideos,
        orders,
        cart,
        orderSeq
      };
    }

    function askBackupPassword(mode) {
      // mode: 'export' | 'import'
      const title = mode === 'export' ? 'ตั้งรหัสผ่านไฟล์สำรอง' : 'ใส่รหัสผ่านไฟล์สำรอง';
      const hint = mode === 'export'
        ? 'รหัสนี้ใช้เปิดไฟล์สำรองในภายหลัง อย่าลืมรหัสผ่าน'
        : 'ใส่รหัสผ่านที่ใช้ตอนดาวน์โหลดไฟล์สำรอง';
      const p1 = prompt(`${title}\n\n${hint}`);
      if (p1 === null) return null;
      if (!p1 || p1.length < 4) {
        alert('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร');
        return null;
      }
      if (mode === 'export') {
        const p2 = prompt('ยืนยันรหัสผ่านอีกครั้ง');
        if (p2 === null) return null;
        if (p1 !== p2) {
          alert('รหัสผ่านไม่ตรงกัน');
          return null;
        }
      }
      return p1;
    }

    async function downloadBackup() {
      try {
        if (!window.crypto || !crypto.subtle) {
          showToast('เบราว์เซอร์นี้ไม่รองรับการเข้ารหัส');
          return;
        }
        const password = askBackupPassword('export');
        if (!password) return;

        showToast('กำลังเข้ารหัสข้อมูล...');
        const payload = buildBackupPayload();
        const encrypted = await encryptBackupPayload(payload, password);
        const json = JSON.stringify(encrypted, null, 2);
        const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const d = new Date();
        const stamp = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}`;
        a.href = url;
        a.download = `rachawei-backup-${stamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        const sizeKB = Math.round(json.length / 1024);
        showToast(`ดาวน์โหลดไฟล์เข้ารหัสแล้ว (~${sizeKB} KB) 🔒`);
      } catch (e) {
        showToast('สำรองข้อมูลไม่สำเร็จ');
        console.warn(e);
      }
    }

    function applyBackupData(data) {
      if (!data || data.app !== 'rachawei-surin') {
        throw new Error('ไฟล์ไม่ใช่ไฟล์สำรองของราชาหวายสุรินทร์');
      }
      if (!Array.isArray(data.products)) {
        throw new Error('ไฟล์สำรองไม่มีข้อมูลสินค้า');
      }
      products = data.products;
      shopVideos = Array.isArray(data.shopVideos) ? data.shopVideos : shopVideos;
      orders = Array.isArray(data.orders) ? data.orders : [];
      cart = Array.isArray(data.cart) ? data.cart : [];
      orderSeq = typeof data.orderSeq === 'number' ? data.orderSeq : 1;
      nextProductId = Math.max(...products.map(p => p.id), 0) + 1;
      nextVideoId = Math.max(...shopVideos.map((v) => v.id), 0) + 1;
      persistAll();
      renderProducts(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
      renderShopVideos();
      updateBadge();
    }

    function importBackupFile(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const obj = JSON.parse(reader.result);

          // Encrypted backup (v2)
          if (obj.encrypted) {
            const password = askBackupPassword('import');
            if (!password) return;
            showToast('กำลังถอดรหัส...');
            const data = await decryptBackupFile(obj, password);
            applyBackupData(data);
            showToast('กู้คืนข้อมูลสำเร็จ ✓ 🔓');
            renderAdminDash();
            return;
          }

          // Legacy plain backup (v1) — still accepted
          if (obj.app === 'rachawei-surin' && Array.isArray(obj.products)) {
            if (!confirm('ไฟล์นี้ไม่ได้เข้ารหัส ต้องการนำเข้าหรือไม่?')) return;
            applyBackupData(obj);
            showToast('กู้คืนข้อมูลสำเร็จ ✓');
            renderAdminDash();
            return;
          }

          throw new Error('รูปแบบไฟล์ไม่ถูกต้อง');
        } catch (e) {
          showToast(e.message || 'ไฟล์สำรองไม่ถูกต้อง');
          console.warn(e);
        }
      };
      reader.onerror = () => showToast('อ่านไฟล์ไม่สำเร็จ');
      reader.readAsText(file, 'UTF-8');
    }

    function resetToDefault() {
      if (!confirm('ล้างข้อมูลทั้งหมดแล้วกลับเป็นสินค้าเริ่มต้น?\n(แนะนำให้สำรองข้อมูลก่อน)')) return;
      products = DEFAULT_PRODUCTS.map(p => ({ ...p }));
      shopVideos = (typeof DEFAULT_SHOP_VIDEOS !== 'undefined' ? DEFAULT_SHOP_VIDEOS : []).map((v) => ({ ...v }));
      orders = [];
      cart = [];
      orderSeq = 1;
      nextProductId = Math.max(...products.map(p => p.id), 0) + 1;
      nextVideoId = Math.max(...shopVideos.map((v) => v.id), 0) + 1;
      persistAll();
      renderProducts();
      renderShopVideos();
      updateBadge();
      showToast('รีเซ็ตข้อมูลแล้ว');
      renderAdminDash();
    }

    function renderAdminDash() {
      const totalSales = orders.reduce((s, o) => s + o.total, 0);
      const pending = orders.filter(o => o.statusIndex < 2).length;
      const withImages = products.filter(p => getProductImages(p).length > 0).length;
      const storageLabel = dbReady ? 'IndexedDB พร้อม' : 'หน่วยความจำชั่วคราว';

      adminContent.innerHTML = `
        <div class="admin-stats">
          <div class="stat-card"><div class="num">${products.length}</div><div class="lbl">สินค้าทั้งหมด</div></div>
          <div class="stat-card"><div class="num">${shopVideos.length}</div><div class="lbl">วิดีโอแนะนำ</div></div>
          <div class="stat-card"><div class="num">${orders.length}</div><div class="lbl">ออเดอร์ทั้งหมด</div></div>
          <div class="stat-card"><div class="num">${pending}</div><div class="lbl">รอดำเนินการ</div></div>
          <div class="stat-card"><div class="num">${formatPrice(totalSales)}</div><div class="lbl">ยอดรวมโดยประมาณ</div></div>
        </div>

        <div class="admin-form-card">
          <h3>💾 สำรองและกู้คืนข้อมูล 🔒</h3>
          <p style="font-size:0.88rem;color:var(--text-soft);margin-bottom:0.9rem;line-height:1.5;">
            ไฟล์สำรองถูก<strong>เข้ารหัสด้วยรหัสผ่าน</strong> (AES-256) ก่อนดาวน์โหลด<br>
            เก็บสินค้า รูป ออเดอร์ ตะกร้า อย่างปลอดภัย · สถานะ: <strong>${storageLabel}</strong>
            ${withImages ? ` · มีรูป ${withImages} รายการ` : ''}
          </p>
          <div class="admin-actions" style="flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" id="backupExportBtn">⬇️ ดาวน์โหลดไฟล์เข้ารหัส</button>
            <button class="btn btn-outline btn-sm" id="backupImportBtn">⬆️ นำเข้าไฟล์สำรอง</button>
            <button class="btn btn-outline btn-sm" id="backupResetBtn" style="color:#c0392b;border-color:#e8b4b4;">🗑️ รีเซ็ตข้อมูล</button>
          </div>
          <input type="file" id="backupFileInput" accept=".json,application/json" style="display:none;" />
          <div class="demo-hint" style="margin-top:0.9rem;">
            🔒 ใช้ <strong>AES-GCM 256-bit</strong> + PBKDF2 · จำรหัสผ่านให้ดี หากลืมจะเปิดไฟล์ไม่ได้<br>
            รองรับไฟล์เก่าที่ไม่ได้เข้ารหัส (จะถามก่อนนำเข้า)
          </div>
        </div>

        <div class="admin-section-title">ออเดอร์ล่าสุด</div>
        ${orders.length === 0 ? '<div class="empty-admin">ยังไม่มีออเดอร์</div>' : `
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr><th>เลขที่</th><th>ลูกค้า</th><th>ยอด</th><th>สถานะ</th></tr>
              </thead>
              <tbody>
                ${orders.slice(0, 8).map(o => {
                  const flow = o.method === 'cod' ? COD_FLOW : STATUS_FLOW;
                  const st = flow[o.statusIndex] || flow[0];
                  return `<tr>
                    <td><strong>${o.id}</strong></td>
                    <td>${o.name}<br><small>${o.phoneDisplay}</small></td>
                    <td>${formatPrice(o.total)}</td>
                    <td><span class="status-badge-tag ${st.badge}">${st.label}</span></td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
        <div class="demo-hint" style="margin-top:1.2rem;">
          💡 แท็บ <strong>สินค้า</strong> = เพิ่ม/แก้ไขสินค้าและรูปภาพ · แท็บ <strong>ออเดอร์</strong> = ติดตามและอัปเดตสถานะ
        </div>
      `;

      document.getElementById('backupExportBtn').addEventListener('click', () => downloadBackup());
      document.getElementById('backupImportBtn').addEventListener('click', () => {
        document.getElementById('backupFileInput').click();
      });
      document.getElementById('backupFileInput').addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) importBackupFile(file);
        e.target.value = '';
      });
      document.getElementById('backupResetBtn').addEventListener('click', resetToDefault);
    }

    function productThumb(p) {
      const cover = getCoverImage(p);
      if (cover) {
        return `<div class="admin-thumb"><img src="${cover}" alt="" onerror="this.parentNode.innerHTML='${p.emoji || '🧺'}'"></div>`;
      }
      return `<div class="admin-thumb">${p.emoji || '🧺'}</div>`;
    }

    function renderAdminProducts() {
      const formTitle = editingProductId ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่';
      const editP = editingProductId ? products.find(p => p.id === editingProductId) : null;

      adminContent.innerHTML = `
        <div class="admin-import-card">
          <div class="admin-import-card__head">
            <h3>📥 นำเข้าจาก Excel</h3>
            <p>ดาวน์โหลดเทมเพลต → กรอกใน Excel / Google Sheets → นำเข้า · รูปและรายละเอียดอื่นแก้ไขทีหลังได้</p>
          </div>
          <div class="admin-import-steps">
            <span>1. ดาวน์โหลดเทมเพลต</span>
            <span>2. กรอกชื่อ ราคา หมวด (รูปว่างไว้ได้)</span>
            <span>3. บันทึกแล้วนำเข้า</span>
          </div>
          <div class="admin-import-actions">
            <button type="button" class="btn btn-primary btn-sm" id="apDownloadTemplateBtn">⬇️ ดาวน์โหลดเทมเพลต</button>
            <button type="button" class="btn btn-outline btn-sm" id="apExportCsvBtn">📤 ส่งออก CSV ปัจจุบัน</button>
            <label class="btn btn-outline btn-sm admin-import-file-btn">
              📂 เลือกไฟล์
              <input type="file" id="apImportFile" accept=".csv,.xlsx,.xls,text/csv" hidden />
            </label>
          </div>
          <div class="admin-import-meta">
            รองรับ CSV และ Excel (.xlsx) · คอลัมน์ <strong>ชื่อสินค้า</strong> และ <strong>ราคา</strong> จำเป็น ·
            หมวดหมู่: ตะกร้าหวาย / เก้าอี้หวาย / ของใช้ในบ้าน · ลิงก์รูปคั่นด้วย <code>|</code> (ไม่บังคับ)
          </div>
          <div class="admin-import-preview" id="apImportPreview" hidden></div>
        </div>

        <div class="admin-form-card">
          <h3>${editP ? '✏️ ' : '➕ '}${formTitle}</h3>
          <p class="admin-form-sub">เพิ่มทีละรายการ หรือแก้ไขรูป/รายละเอียดหลังนำเข้า Excel</p>
          <div class="form-row">
            <div class="form-group">
              <label>ชื่อสินค้า *</label>
              <input type="text" id="apName" value="${editP ? editP.name.replace(/"/g, '&quot;') : ''}" placeholder="ชื่อสินค้า" />
            </div>
            <div class="form-group">
              <label>ราคา (บาท) *</label>
              <input type="number" id="apPrice" value="${editP ? editP.price : ''}" min="0" step="10" placeholder="0" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>หมวดหมู่</label>
              <select id="apCat">
                <option value="basket" ${!editP || editP.cat === 'basket' ? 'selected' : ''}>ตะกร้าหวาย</option>
                <option value="chair" ${editP && editP.cat === 'chair' ? 'selected' : ''}>เก้าอี้หวาย</option>
                <option value="home" ${editP && editP.cat === 'home' ? 'selected' : ''}>ของใช้ในบ้าน</option>
              </select>
            </div>
            <div class="form-group">
              <label>อีโมจิ (ถ้าไม่มีรูป)</label>
              <input type="text" id="apEmoji" value="${editP ? (editP.emoji || '') : '🧺'}" placeholder="🧺" maxlength="4" />
            </div>
          </div>
          <div class="form-group">
            <label>รายละเอียดสั้น (บนการ์ด)</label>
            <textarea id="apDesc" placeholder="คำอธิบายสั้น ๆ แสดงบนการ์ดสินค้า">${editP ? editP.desc : ''}</textarea>
          </div>
          <div class="form-group">
            <label>รายละเอียดเต็ม (หน้ารายละเอียด)</label>
            <textarea id="apDetail" placeholder="รายละเอียดเพิ่มเติม เช่น ขนาด วัสดุ วิธีดูแล เหมาะกับ...">${editP ? (editP.detail || '') : ''}</textarea>
          </div>
          <div class="form-group">
            <label>รูปสินค้า (หลายรูปได้)</label>
            <input type="file" id="apFile" accept="image/jpeg,image/png,image/webp,image/gif" multiple style="font-size:0.85rem;margin-bottom:0.5rem;" />
            <div style="font-size:0.75rem;color:var(--text-soft);line-height:1.4;margin-bottom:0.5rem;">
              ใส่ได้สูงสุด ${MAX_PRODUCT_IMAGES} รูปต่อสินค้า · JPG/PNG/WebP · ระบบจะปรับให้พอดีกรอบอัตโนมัติ
            </div>
            <div style="display:flex;gap:0.5rem;margin-bottom:0.5rem;">
              <input type="url" id="apImageUrl" placeholder="หรือวางลิงก์รูป แล้วกดเพิ่ม" style="font-size:0.85rem;flex:1;" />
              <button type="button" class="btn btn-outline btn-xs" id="apAddUrlBtn">เพิ่มลิงก์</button>
            </div>
            <div class="admin-gallery-list" id="apGalleryList"></div>
          </div>
          <div class="form-group">
            <label>ป้ายสินค้า (เช่น ยอดนิยม, ใหม่)</label>
            <input type="text" id="apBadge" value="${editP && editP.badge ? editP.badge : ''}" placeholder="ว่างไว้ถ้าไม่มี" />
          </div>
          <div class="admin-actions" style="margin-top:0.5rem;">
            <button class="btn btn-primary btn-sm" id="apSaveBtn">${editP ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}</button>
            ${editP ? '<button class="btn btn-outline btn-sm" id="apCancelBtn">ยกเลิก</button>' : ''}
          </div>
        </div>

        <div class="admin-section-title">
          <span>รายการสินค้า (${products.length})</span>
        </div>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr><th>รูป</th><th>ชื่อ</th><th>ราคา</th><th>หมวด</th><th>จัดการ</th></tr>
            </thead>
            <tbody>
              ${products.map(p => `
                <tr>
                  <td>${productThumb(p)}</td>
                  <td><strong>${p.name}</strong><br><small style="color:var(--text-soft)">${(p.desc || '').slice(0, 40)}${(p.desc || '').length > 40 ? '…' : ''}</small></td>
                  <td>${formatPrice(p.price)}</td>
                  <td>${categoryMap[p.cat] || p.cat}</td>
                  <td>
                    <div class="admin-actions">
                      <button class="btn btn-outline btn-xs" onclick="adminEditProduct(${p.id})">แก้ไข</button>
                      <button class="btn btn-outline btn-xs" style="color:#c0392b;border-color:#e8b4b4;" onclick="adminDeleteProduct(${p.id})">ลบ</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      // Multi-image gallery state for form
      window._apImages = editP ? getProductImages(editP).slice() : [];
      renderApGalleryList();

      document.getElementById('apDownloadTemplateBtn').addEventListener('click', downloadProductImportTemplate);
      document.getElementById('apExportCsvBtn').addEventListener('click', exportProductsToCsv);

      const importPreview = document.getElementById('apImportPreview');
      document.getElementById('apImportFile').addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        e.target.value = '';
        if (!file) return;

        importPreview.hidden = false;
        importPreview.innerHTML = '<div class="admin-import-preview__loading">กำลังอ่านไฟล์...</div>';

        try {
          const { items, errors } = await previewProductImport(file);
          if (!items.length) {
            importPreview.innerHTML = `
              <div class="admin-import-preview__empty">
                <strong>ไม่พบรายการที่นำเข้าได้</strong>
                ${errors.length ? `<ul>${errors.slice(0, 5).map((err) => `<li>${err}</li>`).join('')}</ul>` : ''}
              </div>`;
            return;
          }

          const sample = items.slice(0, 5).map((item) =>
            `<li><strong>${item.name}</strong> · ${formatPrice(item.price)} · ${item.category}${item.images.length ? ` · ${item.images.length} รูป` : ''}</li>`
          ).join('');

          importPreview.innerHTML = `
            <div class="admin-import-preview__summary">
              <strong>พร้อมนำเข้า ${items.length} รายการ</strong> จากไฟล์ ${file.name}
              ${errors.length ? `<div class="admin-import-preview__warn">ข้าม/เตือน ${errors.length} แถว</div>` : ''}
            </div>
            <ul class="admin-import-preview__list">${sample}${items.length > 5 ? `<li>… และอีก ${items.length - 5} รายการ</li>` : ''}</ul>
            ${errors.length ? `<details class="admin-import-preview__errors"><summary>ดูข้อความเตือน</summary><ul>${errors.slice(0, 8).map((err) => `<li>${err}</li>`).join('')}</ul></details>` : ''}
            <div class="admin-import-preview__actions">
              <label class="admin-import-mode">
                <input type="radio" name="apImportMode" value="append" checked />
                เพิ่มต่อจากรายการเดิม
              </label>
              <label class="admin-import-mode admin-import-mode--danger">
                <input type="radio" name="apImportMode" value="replace" />
                แทนที่สินค้าทั้งหมด
              </label>
              <button type="button" class="btn btn-primary btn-sm" id="apConfirmImportBtn">✓ ยืนยันนำเข้า</button>
              <button type="button" class="btn btn-outline btn-sm" id="apCancelImportBtn">ยกเลิก</button>
            </div>
          `;

          document.getElementById('apCancelImportBtn').addEventListener('click', () => {
            importPreview.hidden = true;
            importPreview.innerHTML = '';
          });

          document.getElementById('apConfirmImportBtn').addEventListener('click', () => {
            const mode = document.querySelector('input[name="apImportMode"]:checked')?.value || 'append';
            if (mode === 'replace' && !confirm(`แทนที่สินค้าทั้งหมด (${products.length} รายการ) ด้วย ${items.length} รายการจากไฟล์?`)) {
              return;
            }
            const result = applyProductImport(items, mode);
            importPreview.hidden = true;
            importPreview.innerHTML = '';
            showToast(`นำเข้า ${result.added} รายการแล้ว ✓`);
            renderAdminProducts();
          });
        } catch (err) {
          importPreview.innerHTML = `<div class="admin-import-preview__empty"><strong>อ่านไฟล์ไม่สำเร็จ</strong><br>${err.message || err}</div>`;
        }
      });

      document.getElementById('apSaveBtn').addEventListener('click', saveAdminProduct);
      const cancelBtn = document.getElementById('apCancelBtn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          editingProductId = null;
          renderAdminProducts();
        });
      }

      // Multi file upload
      const fileInput = document.getElementById('apFile');
      fileInput.addEventListener('change', async () => {
        const files = Array.from(fileInput.files || []);
        if (!files.length) return;
        let added = 0;
        for (const file of files) {
          if (!file.type.startsWith('image/')) continue;
          if ((window._apImages || []).length >= MAX_PRODUCT_IMAGES) {
            showToast(`ใส่ได้สูงสุด ${MAX_PRODUCT_IMAGES} รูปต่อสินค้า`);
            break;
          }
          try {
            const dataUrl = await readFileAsDataURL(file);
            const compressed = await compressImage(dataUrl, { purpose: 'product' });
            window._apImages.push(compressed);
            added++;
          } catch (e) {
            console.warn(e);
            showToast(`${file.name} อ่านไม่ได้`);
          }
        }
        fileInput.value = '';
        renderApGalleryList();
        if (added) showToast(`เพิ่ม ${added} รูปแล้ว ✓`);
      });

      document.getElementById('apAddUrlBtn').addEventListener('click', () => {
        const url = document.getElementById('apImageUrl').value.trim();
        if (!url.startsWith('http')) {
          showToast('กรุณาใส่ลิงก์รูปที่ถูกต้อง');
          return;
        }
        if ((window._apImages || []).length >= MAX_PRODUCT_IMAGES) {
          showToast(`ใส่ได้สูงสุด ${MAX_PRODUCT_IMAGES} รูปต่อสินค้า`);
          return;
        }
        window._apImages.push(url);
        document.getElementById('apImageUrl').value = '';
        renderApGalleryList();
        showToast('เพิ่มลิงก์รูปแล้ว ✓');
      });
    }

    function renderApGalleryList() {
      const box = document.getElementById('apGalleryList');
      if (!box) return;
      const imgs = window._apImages || [];
      if (!imgs.length) {
        box.innerHTML = '<span style="font-size:0.8rem;color:var(--text-soft);">ยังไม่มีรูป — อัปโหลดหรือวางลิงก์ได้</span>';
        return;
      }
      box.innerHTML = imgs.map((src, i) => `
        <div class="admin-gallery-item">
          <img src="${src}" alt="" onerror="this.style.opacity=0.3">
          <button type="button" title="ลบรูป" onclick="removeApImage(${i})">×</button>
        </div>
      `).join('') + `<span style="font-size:0.75rem;color:var(--text-soft);align-self:center;">${imgs.length} รูป</span>`;
    }

    window.removeApImage = function(i) {
      if (!window._apImages) return;
      window._apImages.splice(i, 1);
      renderApGalleryList();
    };

    function readFileAsDataURL(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    function compressSlipImage(dataUrl, maxEdge = 1400, quality = 0.85) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (Math.max(w, h) > maxEdge) {
            const scale = maxEdge / Math.max(w, h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          try {
            resolve(canvas.toDataURL('image/jpeg', quality));
          } catch (e) {
            resolve(dataUrl);
          }
        };
        img.onerror = reject;
        img.src = dataUrl;
      });
    }

    function compressImage(dataUrl, optionsOrMaxWidth, legacyQuality) {
      const defaults = {
        product: { aspectRatio: 1, mode: 'contain', maxEdge: 1200, background: '#efe6d6', quality: 0.82 },
        hero: { aspectRatio: 16 / 10, mode: 'contain', maxEdge: 1400, background: '#1a120c', quality: 0.78 },
      };

      let opts;
      if (typeof optionsOrMaxWidth === 'number') {
        opts = { ...defaults.hero, maxEdge: optionsOrMaxWidth, quality: legacyQuality ?? defaults.hero.quality };
      } else {
        const purpose = optionsOrMaxWidth?.purpose === 'hero' ? 'hero' : 'product';
        opts = { ...defaults[purpose], ...optionsOrMaxWidth };
      }

      const { aspectRatio, mode, maxEdge, background, quality } = opts;

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          let canvasW;
          let canvasH;
          if (aspectRatio >= 1) {
            canvasW = maxEdge;
            canvasH = Math.max(1, Math.round(maxEdge / aspectRatio));
          } else {
            canvasH = maxEdge;
            canvasW = Math.max(1, Math.round(maxEdge * aspectRatio));
          }

          const sourceEdge = Math.max(img.width, img.height);
          if (sourceEdge < maxEdge) {
            const shrink = sourceEdge / maxEdge;
            canvasW = Math.max(1, Math.round(canvasW * shrink));
            canvasH = Math.max(1, Math.round(canvasH * shrink));
            if (aspectRatio >= 1) {
              canvasH = Math.max(1, Math.round(canvasW / aspectRatio));
            } else {
              canvasW = Math.max(1, Math.round(canvasH * aspectRatio));
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = canvasW;
          canvas.height = canvasH;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          ctx.fillStyle = background;
          ctx.fillRect(0, 0, canvasW, canvasH);

          const scale = mode === 'cover'
            ? Math.max(canvasW / img.width, canvasH / img.height)
            : Math.min(canvasW / img.width, canvasH / img.height);
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          const x = (canvasW - drawW) / 2;
          const y = (canvasH - drawH) / 2;
          ctx.drawImage(img, x, y, drawW, drawH);

          try {
            resolve(canvas.toDataURL('image/jpeg', quality));
          } catch (e) {
            resolve(dataUrl);
          }
        };
        img.onerror = reject;
        img.src = dataUrl;
      });
    }

    function saveAdminProduct() {
      const name = document.getElementById('apName').value.trim();
      const price = parseFloat(document.getElementById('apPrice').value);
      const cat = document.getElementById('apCat').value;
      const emoji = document.getElementById('apEmoji').value.trim() || '🧺';
      const desc = document.getElementById('apDesc').value.trim();
      const detail = document.getElementById('apDetail').value.trim();
      const badge = document.getElementById('apBadge').value.trim() || null;
      const images = (window._apImages || []).slice(0, MAX_PRODUCT_IMAGES);
      const image = images[0] || null;

      if (!name || isNaN(price) || price < 0) {
        showToast('กรุณากรอกชื่อและราคาให้ถูกต้อง');
        return;
      }

      if (editingProductId) {
        const p = products.find(x => x.id === editingProductId);
        if (p) {
          p.name = name;
          p.price = price;
          p.cat = cat;
          p.category = categoryMap[cat];
          p.emoji = emoji;
          p.desc = desc;
          p.detail = detail;
          p.images = images;
          p.image = image;
          p.badge = badge;
        }
        showToast('บันทึกสินค้าแล้ว ✓');
      } else {
        products.push({
          id: nextProductId++,
          name,
          price,
          cat,
          category: categoryMap[cat],
          emoji,
          desc,
          detail,
          images,
          image,
          badge
        });
        showToast('เพิ่มสินค้าแล้ว ✓');
      }
      editingProductId = null;
      window._apImages = [];
      saveProducts();
      renderProducts(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
      renderAdminProducts();
    }

    window.adminEditProduct = function(id) {
      editingProductId = id;
      renderAdminProducts();
      adminContent.scrollTop = 0;
    };

    window.adminDeleteProduct = function(id) {
      if (!confirm('ลบสินค้านี้?')) return;
      const idx = products.findIndex(p => p.id === id);
      if (idx >= 0) products.splice(idx, 1);
      cart = cart.filter(c => c.id !== id);
      shopVideos.forEach((v) => {
        if (v.productId === id) v.productId = null;
      });
      saveProducts();
      saveShopVideos();
      saveCart();
      updateBadge();
      renderProducts(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
      renderAdminProducts();
      showToast('ลบสินค้าแล้ว');
    };

    function resolveAdminVideoTitle(rawTitle, productId, videoUrl) {
      const trimmed = (rawTitle || '').trim();
      if (trimmed) return trimmed;
      if (productId) {
        const product = products.find((p) => p.id === productId);
        if (product?.name) return product.name;
      }
      if (videoUrl) return 'วิดีโอแนะนำสินค้า';
      return '';
    }

    function showAdminVideoFormError(msg, fieldIds = []) {
      const errEl = document.getElementById('avFormError');
      if (errEl) {
        errEl.textContent = msg;
        errEl.classList.add('show');
      }
      document.querySelectorAll('#avTitle, #avUrl, #avProductId').forEach((el) => el.classList.remove('input-invalid'));
      fieldIds.forEach((id) => document.getElementById(id)?.classList.add('input-invalid'));
      showToast(msg);
      const focusId = fieldIds[0];
      const focusEl = focusId ? document.getElementById(focusId) : null;
      if (focusEl) {
        focusEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        focusEl.focus({ preventScroll: true });
      }
    }

    function clearAdminVideoFormError() {
      document.getElementById('avFormError')?.classList.remove('show');
      document.querySelectorAll('#avTitle, #avUrl, #avProductId').forEach((el) => el.classList.remove('input-invalid'));
    }

    function renderAdminVideos() {
      const editV = editingVideoId ? shopVideos.find((v) => v.id === editingVideoId) : null;
      const formTitle = editV ? 'แก้ไขวิดีโอ' : 'เพิ่มวิดีโอใหม่';
      const productOptions = products.map((p) =>
        `<option value="${p.id}" ${editV && editV.productId === p.id ? 'selected' : ''}>${p.name} (${formatPrice(p.price)})</option>`
      ).join('');

      adminContent.innerHTML = `
        <div class="admin-form-card">
          <h3>${editV ? '✏️ ' : '➕ '}${formTitle}</h3>
          <p class="admin-form-sub">วิดีโอจะแสดงใต้รายการสินค้าในหน้าร้าน · รองรับ YouTube / ลิงก์ MP4 / TikTok / Facebook Reels</p>
          <div class="admin-form-error" id="avFormError" role="alert"></div>
          <div class="form-group">
            <label>ลิงก์วิดีโอ *</label>
            <input type="url" id="avUrl" value="${editV ? (editV.videoUrl || '').replace(/"/g, '&quot;') : ''}" placeholder="https://www.youtube.com/watch?v=..." />
          </div>
          <div class="form-group">
            <label>หัวข้อวิดีโอ <small style="font-weight:400;color:var(--text-soft)">(ว่างไว้ใช้ชื่อสินค้าอัตโนมัติ)</small></label>
            <input type="text" id="avTitle" value="${editV ? editV.title.replace(/"/g, '&quot;') : ''}" placeholder="เช่น ตะกร้าหวายทรงกลม 2 ชั้น" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>เชื่อมกับสินค้า (กดซื้อเลย)</label>
              <select id="avProductId">
                <option value="">— ไม่เชื่อมสินค้า —</option>
                ${productOptions}
              </select>
            </div>
            <div class="form-group">
              <label>จำนวนวิว (แสดงบนการ์ด)</label>
              <input type="number" id="avViews" min="0" step="1" value="${editV ? (editV.views || 0) : 0}" />
            </div>
          </div>
          <div class="form-group">
            <label>รูปปก (ไม่บังคับ — ว่างไว้ใช้จาก YouTube/สินค้า)</label>
            <input type="url" id="avThumb" value="${editV ? (editV.thumbnail || '').replace(/"/g, '&quot;') : ''}" placeholder="https://..." />
          </div>
          <div class="admin-actions" style="margin-top:0.5rem;">
            <button type="button" class="btn btn-primary btn-sm" id="avSaveBtn">${editV ? 'บันทึกการแก้ไข' : 'เพิ่มวิดีโอ'}</button>
            ${editV ? '<button type="button" class="btn btn-outline btn-sm" id="avCancelBtn">ยกเลิก</button>' : ''}
          </div>
        </div>

        <div class="admin-section-title">
          <span>วิดีโอทั้งหมด (${shopVideos.length})</span>
        </div>
        ${shopVideos.length === 0 ? '<div class="empty-admin">ยังไม่มีวิดีโอ<br><small>เพิ่มวิดีโอแรกด้านบน — จะแสดงใต้รายการสินค้าเมื่อมีคลิป</small></div>' : `
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr><th>ปก</th><th>หัวข้อ</th><th>สินค้า</th><th>วิว</th><th>จัดการ</th></tr>
              </thead>
              <tbody>
                ${shopVideos.slice().sort((a, b) => a.id - b.id).map((v) => {
                  const product = v.productId ? products.find((p) => p.id === v.productId) : null;
                  const thumb = getShopVideoThumbnail(v);
                  const thumbCell = thumb
                    ? `<div class="admin-thumb"><img src="${thumb}" alt=""></div>`
                    : '<div class="admin-thumb">🎬</div>';
                  return `<tr>
                    <td>${thumbCell}</td>
                    <td><strong>${v.title || '—'}</strong><br><small style="color:var(--text-soft)">${(v.videoUrl || '').slice(0, 42)}${(v.videoUrl || '').length > 42 ? '…' : ''}</small></td>
                    <td>${product ? product.name : '<span style="color:var(--text-soft)">—</span>'}</td>
                    <td>${formatViewCount(v.views)}</td>
                    <td>
                      <div class="admin-actions">
                        <button class="btn btn-outline btn-xs" onclick="adminEditVideo(${v.id})">แก้ไข</button>
                        <button class="btn btn-outline btn-xs" style="color:#c0392b;border-color:#e8b4b4;" onclick="adminDeleteVideo(${v.id})">ลบ</button>
                      </div>
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      `;

      document.getElementById('avSaveBtn').addEventListener('click', saveAdminVideo);
      const productSelect = document.getElementById('avProductId');
      const titleInput = document.getElementById('avTitle');
      productSelect.addEventListener('change', () => {
        if (!titleInput.value.trim()) {
          const pid = productSelect.value ? Number(productSelect.value) : null;
          const autoTitle = resolveAdminVideoTitle('', pid, document.getElementById('avUrl').value.trim());
          if (autoTitle && autoTitle !== 'วิดีโอแนะนำสินค้า') titleInput.value = autoTitle;
        }
      });
      ['avUrl', 'avTitle', 'avProductId'].forEach((id) => {
        document.getElementById(id)?.addEventListener('input', clearAdminVideoFormError);
      });
      const cancelBtn = document.getElementById('avCancelBtn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          editingVideoId = null;
          renderAdminVideos();
        });
      }
    }

    function saveAdminVideo() {
      const rawTitle = document.getElementById('avTitle').value.trim();
      const videoUrl = document.getElementById('avUrl').value.trim();
      const productRaw = document.getElementById('avProductId').value;
      const productId = productRaw ? Number(productRaw) : null;
      const views = parseInt(document.getElementById('avViews').value, 10) || 0;
      const thumbnail = document.getElementById('avThumb').value.trim();

      clearAdminVideoFormError();

      if (!videoUrl) {
        showAdminVideoFormError('กรุณากรอกลิงก์วิดีโอ', ['avUrl']);
        return;
      }
      if (!/^https?:\/\//i.test(videoUrl)) {
        showAdminVideoFormError('ลิงก์วิดีโอต้องขึ้นต้นด้วย http:// หรือ https://', ['avUrl']);
        return;
      }

      const title = resolveAdminVideoTitle(rawTitle, productId, videoUrl);
      if (!title) {
        showAdminVideoFormError('กรุณากรอกหัวข้อวิดีโอ หรือเลือกสินค้าเพื่อใช้ชื่ออัตโนมัติ', ['avTitle', 'avProductId']);
        return;
      }

      if (editingVideoId) {
        const video = shopVideos.find((v) => v.id === editingVideoId);
        if (video) {
          video.title = title;
          video.videoUrl = videoUrl;
          video.productId = productId;
          video.views = views;
          video.thumbnail = thumbnail;
        }
        showToast('บันทึกวิดีโอแล้ว ✓');
      } else {
        shopVideos.push({
          id: nextVideoId++,
          title,
          videoUrl,
          productId,
          views,
          thumbnail,
        });
        showToast('เพิ่มวิดีโอแล้ว ✓');
      }

      editingVideoId = null;
      saveShopVideos();
      renderShopVideos();
      renderAdminVideos();
    }

    window.adminEditVideo = function(id) {
      editingVideoId = id;
      renderAdminVideos();
      adminContent.scrollTop = 0;
    };

    window.adminDeleteVideo = function(id) {
      if (!confirm('ลบวิดีโอนี้?')) return;
      const idx = shopVideos.findIndex((v) => v.id === id);
      if (idx >= 0) shopVideos.splice(idx, 1);
      if (editingVideoId === id) editingVideoId = null;
      saveShopVideos();
      renderShopVideos();
      renderAdminVideos();
      showToast('ลบวิดีโอแล้ว');
    };

    function renderAdminOrders() {
      adminContent.innerHTML = `
        <div class="admin-section-title">
          <span>ออเดอร์ทั้งหมด (${orders.length})</span>
        </div>
        ${orders.length === 0 ? '<div class="empty-admin">ยังไม่มีออเดอร์<br><small>เมื่อลูกค้าสั่งซื้อ จะแสดงที่นี่</small></div>' : `
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>เลขที่</th>
                  <th>ลูกค้า / ที่อยู่</th>
                  <th>รายการ</th>
                  <th>ยอด</th>
                  <th>สลิป</th>
                  <th>สถานะ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                ${orders.map(o => {
                  const flow = o.method === 'cod' ? COD_FLOW : STATUS_FLOW;
                  const st = flow[o.statusIndex] || flow[0];
                  const items = o.items.map(i => `${i.emoji || ''} ${i.name}×${i.qty}`).join('<br>');
                  const opts = flow.map((s, i) =>
                    `<option value="${i}" ${i === o.statusIndex ? 'selected' : ''}>${s.label}</option>`
                  ).join('');
                  return `<tr>
                    <td><strong>${o.id}</strong><br><small>${formatDateTime(o.createdAt)}</small></td>
                    <td>
                      <strong>${o.name}</strong><br>
                      <small>${o.phoneDisplay}</small><br>
                      <small style="color:var(--text-soft)">${(o.address || '').replace(/\n/g, ', ').slice(0, 50)}</small>
                    </td>
                    <td style="font-size:0.8rem;">${items}</td>
                    <td>${formatPrice(o.total)}<br><small>${methodLabel(o.method)}</small></td>
                    <td style="font-size:0.78rem;">
                      ${o.paymentSlip
                        ? `<button type="button" class="btn btn-outline btn-xs" onclick="adminViewSlip('${o.id}')">🧾 ดูสลิป</button>`
                        : (paymentNeedsSlip(o.method) ? '<span style="color:var(--text-soft);">รอสลิป</span>' : '—')}
                    </td>
                    <td><span class="status-badge-tag ${st.badge}">${st.label}</span></td>
                    <td>
                      <select class="status-select" onchange="adminSetOrderStatus('${o.id}', this.value)">
                        ${opts}
                      </select>
                      <div class="admin-actions" style="margin-top:0.4rem;">
                        <button class="btn btn-outline btn-xs" onclick="adminPrintOrder('${o.id}')">🖨️ ใบปะหน้า</button>
                      </div>
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      `;
    }

    window.adminSetOrderStatus = function(id, idxStr) {
      const o = orders.find(x => x.id === id);
      if (!o) return;
      const idx = parseInt(idxStr, 10);
      o.statusIndex = idx;
      if (!o.history.find(h => h.index === idx)) {
        o.history.push({ index: idx, at: Date.now() });
      }
      saveOrders();
      showToast('อัปเดตสถานะแล้ว ✓');
      renderAdminOrders();
    };

    window.adminPrintOrder = function(id) {
      const o = orders.find(x => x.id === id);
      printShippingLabel(o);
    };

    window.adminViewSlip = function(id) {
      const o = orders.find(x => x.id === id);
      if (!o?.paymentSlip) return;
      const w = window.open('', '_blank', 'noopener,noreferrer');
      if (!w) {
        showToast('เปิดหน้าต่างดูสลิปไม่ได้ — ลองปลดบล็อก popup');
        return;
      }
      w.document.write(`<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>สลิป ${o.id}</title></head><body style="margin:0;background:#1a1612;display:flex;justify-content:center;padding:1rem;"><img src="${o.paymentSlip}" alt="สลิป ${o.id}" style="max-width:100%;height:auto;border-radius:8px;" /></body></html>`);
      w.document.close();
    };

    // Also persist when customer advances status in track modal
    const _origAdvance = document.getElementById('advanceStatusBtn');
    // already updates currentTrackOrder which is in orders array — hook after advance
    document.getElementById('advanceStatusBtn').addEventListener('click', () => {
      saveOrders();
    });

    // Expose for inline onclick
    window.addToCart = addToCart;
    window.saveShopSettings = saveShopSettings;
    window.saveProducts = saveProducts;
    window.renderProducts = renderProducts;
    window.refreshHeroSlides = refreshHeroSlides;
    window.renderPopularCats = renderPopularCats;
    window.changeQty = changeQty;
    window.removeFromCart = removeFromCart;

    // Theme button
    document.getElementById('themeBtn').addEventListener('click', toggleTheme);
    // Sync icon with current theme
    setTheme(getTheme());

    // ========== PROMO BAR (thin strip — no modal) ==========
    const PROMO_KEY = 'rachawei_promo_dismissed';
    const promoBar = document.getElementById('promoBar');

    function isPromoDismissed() {
      try {
        const raw = sessionStorage.getItem(PROMO_KEY) || localStorage.getItem(PROMO_KEY);
        if (!raw) return false;
        if (raw === '1') return true;
        const t = parseInt(raw, 10);
        if (!isNaN(t) && Date.now() - t < 12 * 60 * 60 * 1000) return true;
      } catch (e) {}
      return false;
    }

    function dismissPromo(rememberHours) {
      if (promoBar) promoBar.hidden = true;
      try {
        const val = rememberHours ? String(Date.now()) : '1';
        sessionStorage.setItem(PROMO_KEY, val);
        if (rememberHours) localStorage.setItem(PROMO_KEY, val);
      } catch (e) {}
      if (typeof syncStickyNavOffset === 'function') syncStickyNavOffset();
    }
    window.dismissPromo = dismissPromo;

    function showPromo() {
      if (isPromoDismissed() || !promoBar) return;
      const install = document.getElementById('installBanner');
      if (install && !install.hidden) return;
      promoBar.hidden = false;
      if (typeof syncStickyNavOffset === 'function') syncStickyNavOffset();
    }

    let promoTimer = null;
    function schedulePromoAfterInstall(delayMs = 900) {
      if (promoTimer) clearTimeout(promoTimer);
      promoTimer = setTimeout(showPromo, delayMs);
    }
    window.schedulePromoAfterInstall = schedulePromoAfterInstall;

    document.getElementById('promoBarClose')?.addEventListener('click', () => dismissPromo(true));
    document.getElementById('promoBarShop')?.addEventListener('click', () => dismissPromo(true));


    // ========== PAGE NAV ==========
    function syncStickyNavOffset() {
      const header = document.querySelector('header');
      if (!header) return;
      const h = Math.ceil(header.getBoundingClientRect().height);
      if (h > 0) {
        document.documentElement.style.setProperty('--shop-sticky-top', `${h}px`);
      }
    }

    function showPage(name) {
      if (document.getElementById('productDetailModal')?.classList.contains('open')) {
        closeProductDetail(true);
      }
      document.querySelectorAll('.page-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('#mainNav button').forEach(b => b.classList.remove('active'));
      const panel = document.getElementById('page-' + name);
      if (panel) panel.classList.add('active');
      const btn = document.querySelector('#mainNav button[data-page="' + name + '"]');
      if (btn) btn.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      try { history.replaceState(null, '', '#' + name); } catch (e) {}
    }
    document.querySelectorAll('#mainNav button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(btn.getAttribute('data-page'));
      });
    });
    syncStickyNavOffset();
    window.addEventListener('resize', syncStickyNavOffset);
    window.addEventListener('orientationchange', () => setTimeout(syncStickyNavOffset, 120));
    if (typeof ResizeObserver !== 'undefined') {
      const headerEl = document.querySelector('header');
      if (headerEl) new ResizeObserver(syncStickyNavOffset).observe(headerEl);
    }
    document.querySelectorAll('a[href="#products"]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('home');
        setTimeout(() => {
          const el = document.getElementById('products');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      });
    });
    document.querySelectorAll('a[href="#contact"]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const el = document.getElementById('contact');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      });
    });
    const logoEl = document.querySelector('header .logo');
    if (logoEl) {
      logoEl.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('home');
      });
    }
    (function () {
      const h = (location.hash || '').replace('#', '');
      if (PAGE_HASHES.includes(h)) showPage(h);
    })();

    window.addEventListener('popstate', () => {
      const productId = parseProductHash();
      if (productId) {
        openProductDetail(productId, { skipHash: true });
        return;
      }
      if (document.getElementById('productDetailModal')?.classList.contains('open')) {
        closeProductDetail(true);
      }
      const h = (location.hash || '').replace('#', '');
      if (PAGE_HASHES.includes(h)) showPage(h);
    });

    window.addEventListener('hashchange', () => {
      if (location.hash === '#admin') openAdminPanel();
      const productId = parseProductHash();
      if (productId) openProductDetail(productId, { skipHash: true });
    });

    if (location.hash === '#admin') openAdminPanel();


    // ========== VIDEO MODAL ==========
    (function setupVideoModal() {
      const overlay = document.getElementById('videoModal');
      const player = document.getElementById('videoModalPlayer');
      const fallback = document.getElementById('videoModalFallback');
      const titleEl = document.getElementById('videoModalTitle');
      const ytLink = document.getElementById('videoModalYtLink');
      const openBtn = document.getElementById('videoModalOpenBtn');
      const copyBtn = document.getElementById('videoModalCopyBtn');
      if (!overlay || !player) return;

      function parseYoutubeId(url) {
        if (!url) return null;
        const s = String(url).trim();
        const patterns = [
          /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/i,
          /^([\w-]{11})$/,
        ];
        for (const pattern of patterns) {
          const match = s.match(pattern);
          if (match) return match[1];
        }
        return null;
      }

      function isDirectVideo(url) {
        return /\.(mp4|webm|mov)(\?|$)/i.test(String(url || ''));
      }

      function ytUrl(id) {
        return 'https://www.youtube.com/watch?v=' + id;
      }
      function embedUrl(id) {
        return 'https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1';
      }

      function clearPlayer() {
        player.querySelectorAll('iframe, video').forEach((n) => n.remove());
        if (fallback) fallback.classList.remove('show');
      }

      function closeVideo() {
        overlay.classList.remove('open');
        clearPlayer();
      }

      function openVideo(id, title) {
        if (!id) return;
        const url = ytUrl(id);
        titleEl.textContent = title || 'วิดีโออ้างอิง';
        ytLink.href = url;
        openBtn.href = url;
        clearPlayer();

        const iframe = document.createElement('iframe');
        iframe.src = embedUrl(id);
        iframe.title = title || 'YouTube video';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.setAttribute('allowfullscreen', '');
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        player.appendChild(iframe);
        overlay.classList.add('open');
      }

      window.openShopVideo = function openShopVideo(url, title) {
        const raw = String(url || '').trim();
        if (!raw) return;
        const yt = parseYoutubeId(raw);
        if (yt) {
          openVideo(yt, title || 'ราชาหวาย VIDEO');
          return;
        }
        if (isDirectVideo(raw)) {
          titleEl.textContent = title || 'ราชาหวาย VIDEO';
          ytLink.href = raw;
          openBtn.href = raw;
          clearPlayer();
          const video = document.createElement('video');
          video.src = raw;
          video.controls = true;
          video.autoplay = true;
          video.playsInline = true;
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.objectFit = 'contain';
          player.appendChild(video);
          overlay.classList.add('open');
          return;
        }
        titleEl.textContent = title || 'ราชาหวาย VIDEO';
        ytLink.href = raw;
        openBtn.href = raw;
        clearPlayer();
        if (fallback) fallback.classList.add('show');
        overlay.classList.add('open');
      };

      document.querySelectorAll('.video-frame[data-yt], .yt-open-btn[data-yt]').forEach(el => {
        const go = (e) => {
          e.preventDefault();
          openVideo(el.getAttribute('data-yt'), el.getAttribute('data-title'));
        };
        el.addEventListener('click', go);
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') go(e);
        });
      });

      document.getElementById('videoModalClose').addEventListener('click', closeVideo);
      document.getElementById('videoModalClose2').addEventListener('click', closeVideo);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeVideo();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('open')) closeVideo();
      });

      copyBtn.addEventListener('click', async () => {
        const href = openBtn.href;
        try {
          await navigator.clipboard.writeText(href);
          copyBtn.textContent = 'คัดลอกแล้ว ✓';
          setTimeout(() => { copyBtn.textContent = 'คัดลอกลิงก์'; }, 1500);
        } catch (e) {
          prompt('คัดลอกลิงก์นี้:', href);
        }
      });
    })();


    function renderStorefrontPhotos(photos) {
      const grid = document.getElementById('shopFrontPhotosGrid');
      const section = document.getElementById('shopFrontPhotos');
      if (!grid || !section) return;
      const items = Array.isArray(photos) ? photos.filter((p) => p && p.src) : [];
      if (items.length === 0) {
        section.hidden = true;
        return;
      }
      section.hidden = false;
      grid.classList.toggle('shop-front-photos__grid--solo', items.length === 1);
      grid.innerHTML = items.map((p) => `
        <figure class="shop-front-photo">
          <img src="${p.src}" alt="${(p.alt || 'ภาพหน้าร้าน').replace(/"/g, '&quot;')}" loading="lazy" />
          ${p.caption ? `<figcaption>${p.caption}</figcaption>` : ''}
        </figure>
      `).join('');
    }

    // ========== APPLY SHOP CONFIG TO PAGE ==========
    function applyShopConfig() {
      const c = SHOP_CONFIG;
      // phone links
      document.querySelectorAll('a[href^="tel:"]').forEach(a => {
        a.href = 'tel:' + c.phoneTel;
        if (a.textContent.includes('081') || a.textContent.includes('โทร')) {
          if (a.textContent.trim().match(/^0\d/)) a.textContent = c.phoneDisplay;
        }
      });
      // LINE links
      document.querySelectorAll('a[href*="line.me"]').forEach(a => {
        a.href = c.lineUrl;
      });
      const lineFab = document.getElementById('shopLineBtn');
      if (lineFab && c.lineUrl) lineFab.href = c.lineUrl;
      // Facebook
      document.querySelectorAll('a[href*="facebook.com"]').forEach(a => {
        a.href = c.facebookUrl;
      });
      // Google Maps
      const mapUrl = c.mapUrl || '';
      ['shopMapCard', 'shopMapBtn'].forEach((id) => {
        const el = document.getElementById(id);
        if (el && mapUrl) el.href = mapUrl;
      });
      // admin label
      const lbl = document.getElementById('adminUserLabel');
      if (lbl) lbl.textContent = c.shopName;
      const logoText = document.querySelector('.logo-text');
      if (logoText && c.shopName) logoText.textContent = c.shopName;
      const logoSub = document.querySelector('.logo-sub');
      if (logoSub && c.shopSub) logoSub.textContent = c.shopSub;
      // contact address card if present
      const mapCard = document.getElementById('shopMapCard');
      if (mapCard) {
        const p = mapCard.querySelector('p');
        if (p) p.innerHTML = c.addressHtml;
      }
      const contactCards = document.querySelectorAll('.contact-card:not(.contact-card--map)');
      contactCards.forEach(card => {
        const h = card.querySelector('h3');
        if (h && h.textContent.includes('โทร')) {
          const p = card.querySelector('p');
          if (p) p.innerHTML = '<a href="tel:' + c.phoneTel + '">' + c.phoneDisplay + '</a>';
        }
      });
      // promo values if elements exist
      document.querySelectorAll('.promo-deal .label').forEach(el => {
        el.textContent = 'เมื่อสั่งครบ ' + c.promoMin.toLocaleString('th-TH') + ' บาท';
      });
      document.querySelectorAll('.promo-deal .value').forEach(el => {
        el.textContent = 'ลดทันที ' + c.promoDiscount + ' บาท';
      });
      const promoBarText = document.getElementById('promoBarText');
      if (promoBarText && c.promoMin && c.promoDiscount) {
        promoBarText.textContent = `🎁 สั่งครบ ${c.promoMin.toLocaleString('th-TH')} บาท ลดทันที ${c.promoDiscount} บาท`;
      }
      renderStorefrontPhotos(c.storefrontPhotos);
      if (typeof refreshHeroSlides === 'function') refreshHeroSlides();
    }

    // Init — โหลดข้อมูลถาวรก่อนแสดงผล
    (async function initApp() {
      applyShopConfig();
      const ok = await loadPersisted();
      migratePaymentFields();
      if (!Array.isArray(products) || products.length === 0) {
        products = DEFAULT_PRODUCTS.map(p => ({ ...p }));
      }
      nextProductId = Math.max(...products.map(p => p.id), 0) + 1;
      nextVideoId = Math.max(...shopVideos.map((v) => v.id), 0) + 1;
      if (!ok && cart.length === 0) {
        const lsCart = loadCartFromLocalStorage();
        if (lsCart?.length) {
          cart = lsCart;
          sanitizeCartForProducts();
        }
      }
      renderProducts();
      updateBadge();
      setTheme(getTheme());
      if (ok) {
        console.log('โหลดข้อมูลถาวรจาก IndexedDB สำเร็จ');
      } else if (!products.length) {
        grid.innerHTML = `<div class="product-card" style="grid-column:1/-1;min-height:120px;align-items:center;justify-content:center;padding:1.25rem;text-align:center;color:#8a4b12;">โหลดรายการสินค้าไม่สำเร็จ — กรุณารีเฟรชหน้า</div>`;
      }

      const deepProductId = parseProductHash();
      if (deepProductId) openProductDetail(deepProductId, { skipHash: true, pushState: false });

      schedulePromoAfterInstall(900);

      // Scroll reveal
      try {
        const els = document.querySelectorAll('.reveal');
        if ('IntersectionObserver' in window) {
          const io = new IntersectionObserver((entries) => {
            entries.forEach((en) => {
              if (en.isIntersecting) {
                en.target.classList.add('visible');
                io.unobserve(en.target);
              }
            });
          }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
          els.forEach((el) => io.observe(el));
        } else {
          els.forEach((el) => el.classList.add('visible'));
        }
      } catch (e) {}

      // วิดีโอเปิดบน YouTube โดยตรง (ลิงก์ภายนอก) เพื่อหลีกเลี่ยงการบล็อก embed
    })();
