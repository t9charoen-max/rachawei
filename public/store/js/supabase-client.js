/**
 * Store-side Supabase helper (vanilla JS /store/)
 * Depends on: supabase-env.js + supabase.umd.js (global supabase)
 * Runtime config: GET /api/store-config (preferred over build-time inject)
 */
(function (global) {
  'use strict';

  const cfg = Object.assign(
    { url: '', anonKey: '', configured: false },
    global.__RACHAWEI_SUPABASE__ || {},
  );
  let client = null;
  let initPromise = null;

  function isConfigured() {
    const url = String(cfg.url || '');
    const key = String(cfg.anonKey || '');
    if (!url || !key || url === key) return false;
    if (/service_role/i.test(key)) return false;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') return false;
      return (
        parsed.hostname.endsWith('.supabase.co') ||
        parsed.hostname.endsWith('.supabase.in')
      );
    } catch {
      return false;
    }
  }

  function applyConfig(next) {
    if (!next || typeof next !== 'object') return false;
    const url = String(next.url || '').trim();
    const key = String(next.anonKey || '').trim();
    cfg.url = url;
    cfg.anonKey = key;
    cfg.configured = Boolean(next.configured);
    client = null;
    if (!isConfigured()) {
      cfg.url = '';
      cfg.anonKey = '';
      cfg.configured = false;
      return false;
    }
    cfg.configured = true;
    return true;
  }

  async function init() {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      try {
        const res = await fetch('/api/store-config', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.configured && data.url && data.anonKey) {
            applyConfig({
              url: data.url,
              anonKey: data.anonKey,
              configured: true,
            });
            return isConfigured();
          }
          if (data && data.configured === false) {
            console.warn('[rachawei] Supabase env not ready on server', {
              urlPresent: data.urlPresent,
              keyPresent: data.keyPresent,
              urlLooksValid: data.urlLooksValid,
              keyLooksValid: data.keyLooksValid,
              sameValue: data.sameValue,
            });
          }
        }
      } catch (e) {
        console.warn('[rachawei] store-config fetch failed, using build-time env', e);
      }
      if (global.__RACHAWEI_SUPABASE__) {
        applyConfig(global.__RACHAWEI_SUPABASE__);
      }
      return isConfigured();
    })();
    return initPromise;
  }

  function getClient() {
    if (!isConfigured()) return null;
    if (client) return client;
    if (!global.supabase || typeof global.supabase.createClient !== 'function') {
      console.error('[rachawei] supabase UMD ไม่พร้อม');
      return null;
    }
    client = global.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'rachawei-store-supabase-auth',
      },
    });
    return client;
  }

  function resolveProductImage(file) {
    const s = String(file || '');
    if (!s) return '';
    if (s.startsWith('http') || s.startsWith('data:') || s.startsWith('blob:') || s.startsWith('/')) {
      return s;
    }
    return `/products/${s}`;
  }

  function rowToStoreProduct(row) {
    const id = Number(row.id);
    if (!Number.isFinite(id)) return null;
    const images = (Array.isArray(row.images) ? row.images : [])
      .map(resolveProductImage)
      .filter(Boolean);
    const badge = row.badge || (row.featured ? 'พิเศษ' : null);
    return {
      id,
      name: row.name,
      cat: row.store_cat || (row.category === 'เก้าอี้' ? 'chair' : 'basket'),
      category: row.category || '',
      desc: String(row.description || '').slice(0, 160),
      detail: row.description || '',
      price: Number(row.price) || 0,
      stock: row.stock != null ? Number(row.stock) : null,
      size: row.size || '',
      emoji: row.emoji || (row.category === 'เก้าอี้' ? '🪑' : '🧺'),
      badge,
      images,
      image: images[0] || '',
      panorama360: row.panorama360 ? resolveProductImage(row.panorama360) : null,
      featured: Boolean(row.featured),
      status: row.status || 'active',
      sortOrder: row.sort_order != null ? Number(row.sort_order) : id,
    };
  }

  async function fetchActiveProducts() {
    const sb = getClient();
    if (!sb) return null;
    const { data, error } = await sb
      .from('store_products')
      .select(
        'id,name,description,price,images,category,store_cat,stock,emoji,badge,featured,size,panorama360,status,sort_order',
      )
      .eq('status', 'active')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });
    if (error) {
      console.error('[rachawei] fetch products:', error.message);
      return null;
    }
    if (!Array.isArray(data)) return [];
    return data.map(rowToStoreProduct).filter(Boolean);
  }

  async function fetchPublicShopSettings() {
    const sb = getClient();
    if (!sb) return null;
    const { data, error } = await sb
      .from('store_shop_settings_public')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();
    if (error) {
      console.error('[rachawei] shop settings:', error.message);
      return null;
    }
    return data;
  }

  async function createOrderRemote(payload) {
    const sb = getClient();
    if (!sb) return { ok: false, error: 'supabase_not_configured' };

    const { data, error } = await sb.rpc('store_create_order', {
      p_customer_name: payload.customerName,
      p_customer_phone: payload.customerPhone,
      p_phone_display: payload.phoneDisplay,
      p_customer_address: payload.customerAddress,
      p_note: payload.note,
      p_method: payload.method,
      p_subtotal: payload.subtotal,
      p_promo_discount: payload.promoDiscount,
      p_shipping_fee: payload.shippingFee,
      p_total: payload.total,
      p_payment_slip: payload.paymentSlip || null,
      p_items: payload.items,
    });

    if (error) {
      console.error('[rachawei] create order:', error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true, orderId: data };
  }

  async function fetchOrdersForAdmin() {
    const sb = getClient();
    if (!sb) return null;
    const { data: orderRows, error } = await sb
      .from('store_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) {
      console.error('[rachawei] admin orders:', error.message);
      return null;
    }
    const ids = (orderRows || []).map((o) => o.id);
    let itemsByOrder = {};
    if (ids.length) {
      const { data: itemRows, error: itemErr } = await sb
        .from('store_order_items')
        .select('*')
        .in('order_id', ids);
      if (itemErr) {
        console.error('[rachawei] admin order items:', itemErr.message);
      } else {
        itemsByOrder = (itemRows || []).reduce((acc, row) => {
          (acc[row.order_id] ||= []).push(row);
          return acc;
        }, {});
      }
    }
    return (orderRows || []).map((o) => ({
      id: o.id,
      name: o.customer_name,
      phone: o.customer_phone,
      phoneDisplay: o.phone_display || o.customer_phone,
      address: o.customer_address,
      note: o.note,
      method: o.method,
      subtotal: Number(o.subtotal) || 0,
      promoDiscount: Number(o.promo_discount) || 0,
      shippingFee: Number(o.shipping_fee) || 0,
      total: Number(o.total) || 0,
      statusIndex: Number(o.status_index) || 0,
      history: Array.isArray(o.history) ? o.history : [],
      createdAt: o.created_at ? Date.parse(o.created_at) || Date.now() : Date.now(),
      paymentSlip: o.payment_slip || null,
      slipUploadedAt: o.slip_uploaded_at ? Date.parse(o.slip_uploaded_at) : null,
      items: (itemsByOrder[o.id] || []).map((it) => ({
        id: it.product_id != null ? Number(it.product_id) : null,
        name: it.product_name,
        emoji: it.emoji || '🧺',
        qty: Number(it.qty) || 1,
        price: Number(it.unit_price) || 0,
      })),
    }));
  }

  async function updateOrderStatus(orderId, statusIndex, history) {
    const sb = getClient();
    if (!sb) return { ok: false, error: 'supabase_not_configured' };
    const { error } = await sb
      .from('store_orders')
      .update({
        status_index: statusIndex,
        history: history || [],
      })
      .eq('id', orderId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  async function upsertProduct(product) {
    const sb = getClient();
    if (!sb) return { ok: false, error: 'supabase_not_configured' };
    const images = (product.images || []).map((img) => {
      const s = String(img || '');
      return s.replace(/^\/products\//, '').split('?')[0];
    });
    const row = {
      id: String(product.id),
      name: product.name,
      description: product.detail || product.desc || '',
      price: Number(product.price) || 0,
      images,
      category: product.category || '',
      store_cat: product.cat || 'basket',
      stock: product.stock != null ? Number(product.stock) : 0,
      emoji: product.emoji || '🧺',
      badge: product.badge || null,
      featured: Boolean(product.featured) || product.badge === 'พิเศษ',
      size: product.size || null,
      panorama360: product.panorama360
        ? String(product.panorama360).replace(/^\/products\//, '').split('?')[0]
        : null,
      status: product.status || 'active',
      sort_order: product.sortOrder != null ? Number(product.sortOrder) : Number(product.id) || 0,
    };
    const { error } = await sb.from('store_products').upsert(row, { onConflict: 'id' });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  async function deleteProductRemote(id) {
    const sb = getClient();
    if (!sb) return { ok: false, error: 'supabase_not_configured' };
    const { error } = await sb.from('store_products').delete().eq('id', String(id));
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  async function saveShopSettingsRemote(settings) {
    const sb = getClient();
    if (!sb) return { ok: false, error: 'supabase_not_configured' };
    const row = {
      id: 'default',
      shop_name: settings.shopName,
      shop_sub: settings.shopSub,
      phone_display: settings.phoneDisplay,
      phone_tel: settings.phoneTel,
      line_url: settings.lineUrl,
      facebook_url: settings.facebookUrl,
      map_url: settings.mapUrl,
      address_html: settings.addressHtml,
      promo_min: settings.promoMin,
      promo_discount: settings.promoDiscount,
      shipping_fee: settings.shippingFee,
      free_shipping_min: settings.freeShippingMin,
      bank_name: settings.bankName,
      bank_account_name: settings.bankAccountName,
      promptpay_no: settings.promptPayNo,
      bank_account_no: settings.bankAccountNo,
      bank_note: settings.bankNote,
      hero_images: settings.heroImages || [],
      storefront_photos: settings.storefrontPhotos || [],
      content: settings.content || {},
    };
    if (settings.adminPinHash) row.admin_pin_hash = settings.adminPinHash;
    const { error } = await sb.from('store_shop_settings').upsert(row, { onConflict: 'id' });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  async function signIn(email, password) {
    const sb = getClient();
    if (!sb) return { ok: false, error: 'supabase_not_configured' };
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true, session: data.session, user: data.user };
  }

  async function signOut() {
    const sb = getClient();
    if (!sb) return { ok: true };
    const { error } = await sb.auth.signOut();
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  async function getSession() {
    const sb = getClient();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data.session || null;
  }

  async function isAdminUser() {
    const sb = getClient();
    if (!sb) return false;
    const { data: userData, error: userErr } = await sb.auth.getUser();
    if (userErr || !userData?.user) return false;
    const { data, error } = await sb.rpc('store_is_admin');
    if (error) {
      // ถ้ายังไม่มี RPC — อย่าเปิด admin ให้ user ทั่วไป
      console.warn('[rachawei] store_is_admin:', error.message);
      return false;
    }
    return Boolean(data);
  }

  global.RachaweiStoreApi = {
    init,
    isConfigured,
    getClient,
    fetchActiveProducts,
    fetchPublicShopSettings,
    createOrderRemote,
    fetchOrdersForAdmin,
    updateOrderStatus,
    upsertProduct,
    deleteProductRemote,
    saveShopSettingsRemote,
    signIn,
    signOut,
    getSession,
    isAdminUser,
  };
})(typeof window !== 'undefined' ? window : globalThis);
