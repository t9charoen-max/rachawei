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
  /** Last /api/store-config payload (for diagnostics; never holds secrets in UI) */
  let lastServerConfig = null;

  function isProductionStoreHost() {
    try {
      const host = String(global.location?.hostname || '').toLowerCase();
      if (!host || host === 'localhost' || host === '127.0.0.1') return false;
      return (
        host === 'rachawei-gamma.vercel.app' ||
        host.endsWith('.rachawei-gamma.vercel.app') ||
        host === 'rachawei.vercel.app' ||
        host.endsWith('.rachawei.vercel.app') ||
        host === 'rachawei.com' ||
        host === 'www.rachawei.com' ||
        host.endsWith('.rachawei.com')
      );
    } catch {
      return false;
    }
  }

  function getConfigStatus() {
    return {
      configured: isConfigured(),
      productionHost: isProductionStoreHost(),
      serverReported:
        lastServerConfig && typeof lastServerConfig.configured === 'boolean'
          ? lastServerConfig.configured
          : null,
      sameValue: Boolean(lastServerConfig?.sameValue),
      hint: lastServerConfig?.hint || null,
      /** true = must use Supabase; local IndexedDB orders are not allowed */
      requiresCloudOrders:
        isProductionStoreHost() || lastServerConfig?.configured === false,
    };
  }

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

  /** Public anon config only — never service_role */
  function getPublicConfig() {
    if (!isConfigured()) return { url: '', anonKey: '', configured: false };
    return {
      url: String(cfg.url || ''),
      anonKey: String(cfg.anonKey || ''),
      configured: true,
    };
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
          lastServerConfig = data && typeof data === 'object' ? data : null;
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
    await init();
    const sb = getClient();
    if (!sb) {
      const status = getConfigStatus();
      return {
        ok: false,
        error: status.sameValue
          ? 'supabase_env_same_value: VITE_SUPABASE_URL ต้องเป็น https://xxx.supabase.co ไม่ใช่ค่าเดียวกับ ANON_KEY'
          : 'supabase_not_configured',
      };
    }

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
      return { ok: false, error: error.message, message: mapCreateOrderError(error) };
    }
    if (!data) {
      return { ok: false, error: 'store_create_order returned empty order id', message: 'สร้างออเดอร์ไม่สำเร็จ' };
    }
    return { ok: true, orderId: data };
  }

  function mapCreateOrderError(error) {
    const raw = String(error?.message || error || '');
    if (/insufficient_stock/i.test(raw)) {
      const parts = raw.split(':');
      const left = parts[2] != null ? parts[2].replace(/[^0-9].*$/, '') : '';
      return left
        ? `สินค้าในตะกร้ามีไม่พอ (เหลือ ${left} ชิ้น) — ปรับจำนวนแล้วลองใหม่`
        : 'สินค้าในตะกร้ามีไม่พอสต็อก — ปรับจำนวนแล้วลองใหม่';
    }
    if (/product_not_found/i.test(raw)) {
      return 'ไม่พบสินค้าบางรายการในระบบ — รีเฟรชหน้าแล้วเลือกใหม่';
    }
    if (/product_id_required|items_required/i.test(raw)) {
      return 'ตะกร้าว่างหรือข้อมูลสินค้าไม่ครบ';
    }
    if (/customer_name_required/i.test(raw)) {
      return 'กรุณากรอกชื่อผู้สั่งซื้อ';
    }
    if (/pgrst202|could not find the function/i.test(raw)) {
      return 'ระบบสร้างออเดอร์ยังไม่พร้อมบนเซิร์ฟเวอร์ — ต้องรัน SQL 009';
    }
    return raw || 'สร้างออเดอร์ไม่สำเร็จ';
  }

  async function attachPaymentSlipRemote(orderId, customerPhone, paymentSlip) {
    await init();
    const sb = getClient();
    if (!sb) return { ok: false, error: 'supabase_not_configured', message: 'ยังไม่ได้เชื่อมต่อ Supabase' };

    const { data, error } = await sb.rpc('store_attach_payment_slip', {
      p_order_id: String(orderId || '').trim(),
      p_customer_phone: String(customerPhone || '').trim(),
      p_payment_slip: paymentSlip || null,
    });

    if (error) {
      const raw = String(error.message || '');
      let message = raw || 'แนบสลิปไม่สำเร็จ';
      if (/order_not_found/i.test(raw)) message = 'ไม่พบออเดอร์นี้';
      else if (/phone_mismatch|phone_required/i.test(raw)) message = 'เบอร์โทรไม่ตรงกับออเดอร์ — ใช้เบอร์ตอนสั่งซื้อ';
      else if (/payment_slip_required|payment_slip_too_large/i.test(raw)) message = 'ไฟล์สลิปไม่ถูกต้องหรือใหญ่เกินไป';
      else if (/pgrst202|could not find the function/i.test(raw)) {
        message = 'ยังไม่มีฟังก์ชันแนบสลิปบนเซิร์ฟเวอร์ — ต้องรัน SQL 009';
      }
      return { ok: false, error: raw, message };
    }
    return { ok: Boolean(data), data };
  }

  async function lookupOrdersRemote(query) {
    await init();
    const sb = getClient();
    if (!sb) return { ok: false, orders: [], error: 'supabase_not_configured' };

    const { data, error } = await sb.rpc('store_lookup_orders', {
      p_query: String(query || '').trim(),
    });

    if (error) {
      const raw = String(error.message || '');
      if (/pgrst202|could not find the function/i.test(raw)) {
        return {
          ok: false,
          orders: [],
          error: raw,
          message: 'ยังไม่มีฟังก์ชันตรวจสถานะบนเซิร์ฟเวอร์ — ต้องรัน SQL 009',
        };
      }
      return { ok: false, orders: [], error: raw, message: raw };
    }

    const rows = Array.isArray(data) ? data : [];
    const orders = rows.map((o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      return normalizeAdminOrder(
        {
          ...o,
          payment_slip: null,
          slip_uploaded_at: o.slip_uploaded_at || null,
        },
        items.map((it) => ({
          product_id: it.product_id,
          product_name: it.product_name,
          emoji: it.emoji,
          qty: it.qty,
          unit_price: it.unit_price,
        })),
      );
    }).map((o, idx) => ({
      ...o,
      paymentSlip: rows[idx]?.has_payment_slip ? '__remote__' : null,
    }));

    return { ok: true, orders };
  }

  function mapRemoteMethod(method) {
    const m = String(method || '');
    if (m === 'transfer') return 'bank';
    return m || 'cod';
  }

  function normalizeAdminOrder(o, items) {
    const itemRows = Array.isArray(items) ? items : [];
    return {
      id: o.id,
      name: o.customer_name || o.name || '',
      phone: o.customer_phone || o.phone || '',
      phoneDisplay: o.phone_display || o.phoneDisplay || o.customer_phone || o.phone || '',
      address: o.customer_address || o.address || '',
      note: o.note || '',
      method: mapRemoteMethod(o.method),
      subtotal: Number(o.subtotal) || 0,
      promoDiscount: Number(o.promo_discount != null ? o.promo_discount : o.promoDiscount) || 0,
      shippingFee: Number(o.shipping_fee != null ? o.shipping_fee : o.shippingFee) || 0,
      total: Number(o.total) || 0,
      statusIndex: Number(o.status_index != null ? o.status_index : o.statusIndex) || 0,
      history: Array.isArray(o.history) ? o.history : [],
      createdAt: o.created_at
        ? Date.parse(o.created_at) || Date.now()
        : o.createdAt
          ? Number(o.createdAt) || Date.now()
          : Date.now(),
      paymentSlip: o.payment_slip || o.paymentSlip || null,
      slipUploadedAt: o.slip_uploaded_at
        ? Date.parse(o.slip_uploaded_at)
        : o.slipUploadedAt
          ? Number(o.slipUploadedAt)
          : null,
      items: itemRows.map((it) => ({
        id: it.product_id != null ? Number(it.product_id) : it.id != null ? Number(it.id) : null,
        name: it.product_name || it.name || '',
        emoji: it.emoji || '🧺',
        qty: Number(it.qty) || 1,
        price: Number(it.unit_price != null ? it.unit_price : it.price) || 0,
      })),
    };
  }

  /**
   * Load admin orders from Supabase (RPC preferred, then direct SELECT).
   * Returns { ok, orders, error, source } — never silent null for auth/RLS failures.
   */
  async function fetchOrdersForAdmin() {
    const ready = await init();
    const sb = getClient();
    if (!ready || !sb) {
      return {
        ok: false,
        orders: [],
        error:
          'ยังไม่ได้ตั้งค่า Supabase — ตรวจ VITE_SUPABASE_URL (https://xxx.supabase.co) และ VITE_SUPABASE_ANON_KEY บน Vercel แล้ว Redeploy',
        source: 'unconfigured',
      };
    }

    const session = await getSession();
    if (!session) {
      return {
        ok: false,
        orders: [],
        error: 'ยังไม่ได้เข้าสู่ระบบ admin — กรุณา login ด้วยบัญชีเจ้าของร้าน',
        source: 'no_session',
      };
    }

    // 1) Preferred: security-definer RPC with items embedded
    try {
      const { data: rpcData, error: rpcErr } = await sb.rpc('store_admin_list_orders', {
        p_limit: 200,
      });
      if (!rpcErr && Array.isArray(rpcData)) {
        return {
          ok: true,
          orders: rpcData.map((row) => normalizeAdminOrder(row, row.items || [])),
          error: null,
          source: 'rpc',
        };
      }
      if (rpcErr && !/store_admin_list_orders|PGRST202|404|function/i.test(rpcErr.message || '')) {
        console.error('[rachawei] store_admin_list_orders:', rpcErr.message);
        return {
          ok: false,
          orders: [],
          error: `อ่านออเดอร์ไม่สำเร็จ: ${rpcErr.message}`,
          source: 'rpc',
        };
      }
      if (rpcErr) {
        console.warn('[rachawei] store_admin_list_orders missing, fallback to SELECT', rpcErr.message);
      }
    } catch (e) {
      console.warn('[rachawei] RPC list orders failed, fallback to SELECT', e);
    }

    // 2) Fallback: direct SELECT + store_order_items (requires GRANT + admin RLS)
    let selectError = null;
    const { data: orderRows, error } = await sb
      .from('store_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error) {
      const ids = (orderRows || []).map((o) => o.id);
      let itemsByOrder = {};
      if (ids.length) {
        const { data: itemRows, error: itemErr } = await sb
          .from('store_order_items')
          .select('*')
          .in('order_id', ids);
        if (itemErr) {
          console.error('[rachawei] admin order items:', itemErr.message);
          selectError = itemErr;
          // fall through to service proxy
        } else {
          itemsByOrder = (itemRows || []).reduce((acc, row) => {
            (acc[row.order_id] ||= []).push(row);
            return acc;
          }, {});
          return {
            ok: true,
            orders: (orderRows || []).map((o) => normalizeAdminOrder(o, itemsByOrder[o.id] || [])),
            error: null,
            source: 'select',
          };
        }
      } else {
        return { ok: true, orders: [], error: null, source: 'select' };
      }
    } else {
      selectError = error;
      console.warn('[rachawei] admin orders select failed, try service proxy', error.message);
    }

    // 3) Server proxy with service role (never exposes the key to the browser)
    const proxy = await fetchOrdersViaServiceProxy();
    if (proxy.ok) return proxy;

    const selectMsg = String(selectError?.message || selectError?.code || '');
    const grantDenied = /42501|permission denied|GRANT SELECT/i.test(selectMsg);
    const proxyMsg = String(proxy.error || '');
    const serviceMissing = /service_role_missing|SERVICE_ROLE/i.test(proxyMsg);
    return {
      ok: false,
      orders: [],
      error: grantDenied
        ? 'อ่านออเดอร์ไม่ได้: ตารางยังไม่มี GRANT/RPC — ต้องรัน supabase/store/006_admin_auth_grants_bootstrap.sql ใน Supabase SQL Editor (โปรเจกต์ Rachawei-store)'
        : serviceMissing
          ? `${proxyMsg} — หรือรัน SQL 006 เพื่อสร้าง store_admin_list_orders`
          : proxy.error || selectMsg || 'อ่านออเดอร์จาก Supabase ไม่สำเร็จ',
      source: proxy.source || 'select',
      detail: {
        select: selectMsg || null,
        proxy: proxyMsg || null,
      },
    };
  }

  function mapUpdateOrderStatusError(error) {
    const raw = String(error?.message || error || '');
    const lower = raw.toLowerCase();
    if (/not_admin|42501|permission denied|jwt/i.test(raw) || lower.includes('not_admin')) {
      return 'ไม่มีสิทธิ์เปลี่ยนสถานะ — ต้องเข้าสู่ระบบด้วยบัญชีแอดมินใน store_admins';
    }
    if (/order_not_found/i.test(raw)) {
      return 'ไม่พบออเดอร์นี้ในระบบ';
    }
    if (/missing_order_id/i.test(raw)) {
      return 'เลขออเดอร์ไม่ถูกต้อง';
    }
    if (/invalid_history/i.test(raw)) {
      return 'ประวัติสถานะไม่ถูกต้อง';
    }
    if (/store_admin_set_order_status|pgrst202|404|could not find the function/i.test(raw)) {
      return 'ยังไม่มีฟังก์ชันอัปเดตสถานะบนเซิร์ฟเวอร์ — ต้องรัน SQL 010';
    }
    if (/supabase_not_configured|not configured/i.test(raw)) {
      return 'ยังไม่ได้เชื่อมต่อ Supabase — ตรวจการตั้งค่าแล้วลองใหม่';
    }
    if (/no_session|not authenticated|session/i.test(raw)) {
      return 'ยังไม่ได้เข้าสู่ระบบแอดมิน — กรุณา login ก่อนเปลี่ยนสถานะ';
    }
    return raw ? `อัปเดตสถานะไม่สำเร็จ: ${raw}` : 'อัปเดตสถานะไม่สำเร็จ';
  }

  async function updateOrderStatus(orderId, statusIndex, history) {
    const sb = getClient();
    if (!sb) {
      return {
        ok: false,
        error: 'supabase_not_configured',
        message: mapUpdateOrderStatusError('supabase_not_configured'),
      };
    }

    const session = await getSession();
    if (!session) {
      return {
        ok: false,
        error: 'no_session',
        message: mapUpdateOrderStatusError('no_session'),
      };
    }

    const id = String(orderId || '').trim();
    const idx = Number(statusIndex) || 0;
    const hist = history || [];
    if (!id) {
      return {
        ok: false,
        error: 'missing_order_id',
        message: mapUpdateOrderStatusError('missing_order_id'),
      };
    }

    try {
      const { data, error } = await sb.rpc('store_admin_set_order_status', {
        p_order_id: id,
        p_status_index: idx,
        p_history: hist,
      });
      if (!error) return { ok: Boolean(data), source: 'rpc' };
      if (!/pgrst202|could not find the function/i.test(String(error.message || ''))) {
        return {
          ok: false,
          error: error.message,
          message: mapUpdateOrderStatusError(error),
          source: 'rpc',
        };
      }
    } catch (e) {
      /* fall through to direct update for older DB */
    }

    const { error } = await sb
      .from('store_orders')
      .update({
        status_index: idx,
        history: hist,
      })
      .eq('id', id);
    if (error) {
      return {
        ok: false,
        error: error.message,
        message: mapUpdateOrderStatusError(error),
        source: 'select',
      };
    }
    return { ok: true, source: 'select' };
  }

  async function rejectPaymentSlipForAdmin(orderId) {
    const sb = getClient();
    if (!sb) return { ok: false, error: 'supabase_not_configured' };
    const session = await getSession();
    if (!session) return { ok: false, error: 'no_session' };

    const { data, error } = await sb.rpc('store_admin_reject_payment_slip', {
      p_order_id: String(orderId || '').trim(),
    });
    if (error) {
      const raw = String(error.message || '');
      if (/pgrst202|could not find the function/i.test(raw)) {
        return { ok: false, error: raw, message: 'ยังไม่มีฟังก์ชันปฏิเสธสลิป — รัน SQL 010' };
      }
      return { ok: false, error: raw, message: raw };
    }
    return { ok: Boolean(data) };
  }

  function mapDeleteOrderError(error) {
    const raw = String(error?.message || error || '');
    const lower = raw.toLowerCase();
    if (/not_admin|42501|permission denied|jwt|auth/i.test(raw) || lower.includes('not_admin')) {
      return 'ไม่มีสิทธิ์ลบออเดอร์ — ต้องเข้าสู่ระบบด้วยบัญชีแอดมินใน store_admins';
    }
    if (/order_not_found/i.test(raw)) {
      return 'ไม่พบออเดอร์นี้ในระบบ (อาจถูกลบไปแล้ว)';
    }
    if (/missing_order_id/i.test(raw)) {
      return 'เลขออเดอร์ไม่ถูกต้อง';
    }
    if (/store_admin_delete_order|pgrst202|404|could not find the function/i.test(raw)) {
      return 'ยังไม่มีฟังก์ชันลบออเดอร์บนเซิร์ฟเวอร์ — ต้องรัน SQL 007 (store_admin_delete_order)';
    }
    if (/supabase_not_configured|not configured/i.test(raw)) {
      return 'ยังไม่ได้เชื่อมต่อ Supabase — ตรวจการตั้งค่าแล้วลองใหม่';
    }
    if (/no_session|not authenticated|session/i.test(raw)) {
      return 'ยังไม่ได้เข้าสู่ระบบแอดมิน — กรุณา login ก่อนลบออเดอร์';
    }
    return raw ? `ลบออเดอร์ไม่สำเร็จ: ${raw}` : 'ลบออเดอร์ไม่สำเร็จ';
  }

  async function deleteOrderForAdmin(orderId) {
    const sb = getClient();
    if (!sb) {
      return { ok: false, error: 'supabase_not_configured', message: mapDeleteOrderError('supabase_not_configured') };
    }

    const session = await getSession();
    if (!session) {
      return { ok: false, error: 'no_session', message: mapDeleteOrderError('no_session') };
    }

    const id = String(orderId || '').trim();
    if (!id) {
      return { ok: false, error: 'missing_order_id', message: mapDeleteOrderError('missing_order_id') };
    }

    try {
      const { data, error } = await sb.rpc('store_admin_delete_order', {
        p_order_id: id,
      });
      if (error) {
        return {
          ok: false,
          error: error.message || 'delete_failed',
          message: mapDeleteOrderError(error),
        };
      }
      if (data && data.ok === false) {
        return {
          ok: false,
          error: data.error || 'delete_failed',
          message: mapDeleteOrderError(data.error || data.message || 'delete_failed'),
        };
      }
      return {
        ok: true,
        orderId: (data && data.order_id) || id,
        deletedItems: data && data.deleted_items != null ? Number(data.deleted_items) : null,
      };
    } catch (e) {
      return {
        ok: false,
        error: e?.message || 'delete_failed',
        message: mapDeleteOrderError(e),
      };
    }
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

  function normalizeVideoRow(row) {
    if (!row) return null;
    const productRaw = row.product_id != null ? row.product_id : row.productId;
    const productId = productRaw == null || productRaw === ''
      ? null
      : (Number.isFinite(Number(productRaw)) ? Number(productRaw) : productRaw);
    return {
      id: row.id,
      title: row.title || '',
      videoUrl: row.video_url || row.videoUrl || '',
      productId,
      thumbnail: row.thumbnail || '',
      views: Number(row.views) || 0,
      sortOrder: Number(row.sort_order != null ? row.sort_order : row.sortOrder) || 0,
      isActive: row.is_active !== false && row.isActive !== false,
    };
  }

  async function fetchActiveVideos() {
    const sb = getClient();
    if (!sb) return { ok: false, videos: [], error: 'supabase_not_configured' };
    const { data, error } = await sb
      .from('store_videos')
      .select('id,title,video_url,product_id,thumbnail,views,sort_order,is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });
    if (error) return { ok: false, videos: [], error: error.message };
    return {
      ok: true,
      videos: (data || []).map(normalizeVideoRow).filter(Boolean),
    };
  }

  async function fetchVideosForAdmin() {
    const sb = getClient();
    if (!sb) return { ok: false, videos: [], error: 'supabase_not_configured' };
    const session = await getSession();
    if (!session) return { ok: false, videos: [], error: 'no_session' };
    const { data, error } = await sb
      .from('store_videos')
      .select('id,title,video_url,product_id,thumbnail,views,sort_order,is_active')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });
    if (error) return { ok: false, videos: [], error: error.message };
    return {
      ok: true,
      videos: (data || []).map(normalizeVideoRow).filter(Boolean),
    };
  }

  async function upsertVideo(video) {
    const sb = getClient();
    if (!sb) return { ok: false, error: 'supabase_not_configured' };
    const session = await getSession();
    if (!session) return { ok: false, error: 'no_session' };

    const row = {
      title: String(video.title || '').trim() || 'วิดีโอ',
      video_url: String(video.videoUrl || video.video_url || '').trim(),
      product_id: video.productId != null && video.productId !== '' ? String(video.productId) : null,
      thumbnail: video.thumbnail ? String(video.thumbnail) : null,
      views: Math.max(0, Number(video.views) || 0),
      sort_order: Number(video.sortOrder != null ? video.sortOrder : video.id) || 0,
      is_active: video.isActive !== false,
    };
    if (!row.video_url) return { ok: false, error: 'missing_video_url' };

    const idNum = Number(video.id);
    if (Number.isFinite(idNum) && idNum > 0) {
      const { data, error } = await sb
        .from('store_videos')
        .upsert({ id: idNum, ...row }, { onConflict: 'id' })
        .select('id')
        .maybeSingle();
      if (error) return { ok: false, error: error.message };
      return { ok: true, id: data?.id ?? idNum };
    }

    const { data, error } = await sb
      .from('store_videos')
      .insert(row)
      .select('id')
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  }

  async function deleteVideoRemote(id) {
    const sb = getClient();
    if (!sb) return { ok: false, error: 'supabase_not_configured' };
    const session = await getSession();
    if (!session) return { ok: false, error: 'no_session' };
    const { error } = await sb.from('store_videos').delete().eq('id', Number(id) || id);
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

  function mapAuthError(error) {
    const msg = String(error?.message || error || '');
    const code = String(error?.code || error?.error_code || '');
    const lower = msg.toLowerCase();
    if (code === 'email_not_confirmed' || /email not confirmed/i.test(msg)) {
      return {
        code: 'email_not_confirmed',
        message:
          'อีเมลยังไม่ได้ยืนยัน — เปิดลิงก์ยืนยันในอีเมล หรือให้ปิด Confirm email ใน Supabase Auth สำหรับร้านนี้',
      };
    }
    if (
      code === 'invalid_credentials' ||
      /invalid login credentials|invalid_grant/i.test(msg) ||
      lower.includes('invalid login')
    ) {
      return {
        code: 'invalid_credentials',
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      };
    }
    if (/too many requests|rate limit/i.test(msg)) {
      return {
        code: 'rate_limited',
        message: 'พยายามเข้าสู่ระบบบ่อยเกินไป — รอสักครู่แล้วลองใหม่',
      };
    }
    if (!msg || msg === 'supabase_not_configured') {
      return {
        code: 'supabase_not_configured',
        message: 'ยังเชื่อมต่อ Supabase ไม่ได้ — ตรวจ VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY',
      };
    }
    return { code: code || 'auth_error', message: msg };
  }

  async function signIn(email, password) {
    const sb = getClient();
    if (!sb) {
      return {
        ok: false,
        error: 'supabase_not_configured',
        message: 'ยังเชื่อมต่อ Supabase ไม่ได้ — ตรวจ VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY',
      };
    }
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '');
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return {
        ok: false,
        error: 'email_invalid',
        message: 'กรุณากรอกอีเมลเจ้าของร้านให้ถูกต้อง',
      };
    }
    if (cleanPassword.length < 6) {
      return {
        ok: false,
        error: 'password_too_short',
        message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
      };
    }
    const { data, error } = await sb.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });
    if (error) {
      const mapped = mapAuthError(error);
      return { ok: false, error: mapped.code, message: mapped.message };
    }
    return { ok: true, session: data.session, user: data.user };
  }

  async function signOut() {
    const sb = getClient();
    if (!sb) return { ok: true };
    const { error } = await sb.auth.signOut();
    if (error) return { ok: false, error: error.message, message: error.message };
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

  /**
   * Claim first admin when store_admins is empty (SQL 006).
   * Returns { ok, claimed, alreadyAdmin, error, message }
   */
  async function claimFirstAdmin() {
    const sb = getClient();
    if (!sb) {
      return {
        ok: false,
        error: 'supabase_not_configured',
        message: 'ยังเชื่อมต่อ Supabase ไม่ได้',
      };
    }
    const { data, error } = await sb.rpc('store_claim_first_admin');
    if (error) {
      const msg = String(error.message || '');
      if (/admin_already_configured/i.test(msg)) {
        return {
          ok: false,
          error: 'admin_already_configured',
          message:
            'มีแอดมินในระบบแล้ว — บัญชีนี้ยังไม่อยู่ใน store_admins ให้เจ้าของร้านเพิ่มสิทธิ์ใน Supabase',
        };
      }
      if (/not_authenticated/i.test(msg)) {
        return {
          ok: false,
          error: 'not_authenticated',
          message: 'ยังไม่ได้เข้าสู่ระบบ',
        };
      }
      if (/store_claim_first_admin|PGRST202|404|function/i.test(msg)) {
        return {
          ok: false,
          error: 'rpc_missing',
          message:
            'ยังไม่ได้รัน SQL 006 (store_claim_first_admin) ใน Supabase — หรือใช้ /api/store-admin-bootstrap ฝั่งเซิร์ฟเวอร์',
        };
      }
      return { ok: false, error: 'claim_failed', message: msg };
    }
    return {
      ok: true,
      claimed: Boolean(data?.claimed),
      alreadyAdmin: Boolean(data?.already_admin),
      email: data?.email || null,
    };
  }

  async function ensureAdminAccess() {
    if (await isAdminUser()) return { ok: true, via: 'store_admins' };
    const claim = await claimFirstAdmin();
    if (claim.ok) {
      const ok = await isAdminUser();
      return ok
        ? { ok: true, via: claim.claimed ? 'claimed_first_admin' : 'already_admin' }
        : {
            ok: false,
            error: 'not_admin',
            message: 'เข้าสู่ระบบแล้วแต่ยังไม่มีสิทธิ์แอดมิน',
          };
    }
    return {
      ok: false,
      error: claim.error || 'not_admin',
      message:
        claim.message ||
        'บัญชีนี้ไม่มีสิทธิ์แอดมิน — ต้องอยู่ในตาราง store_admins',
    };
  }

  async function fetchOrdersViaServiceProxy() {
    const session = await getSession();
    if (!session?.access_token) {
      return {
        ok: false,
        orders: [],
        error: 'ยังไม่ได้เข้าสู่ระบบ admin — กรุณา login ด้วยบัญชีเจ้าของร้าน',
        source: 'no_session',
      };
    }
    try {
      const res = await fetch('/api/store-admin-orders?limit=200', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        return {
          ok: false,
          orders: [],
          error: data?.message || data?.error || `proxy_http_${res.status}`,
          source: 'service_proxy',
        };
      }
      return {
        ok: true,
        orders: (data.orders || []).map((row) => normalizeAdminOrder(row, row.items || [])),
        error: null,
        source: data.source || 'service_proxy',
      };
    } catch (e) {
      return {
        ok: false,
        orders: [],
        error: `proxy_failed: ${e?.message || e}`,
        source: 'service_proxy',
      };
    }
  }

  global.RachaweiStoreApi = {
    init,
    isConfigured,
    applyConfig,
    getPublicConfig,
    getConfigStatus,
    getClient,
    fetchActiveProducts,
    fetchPublicShopSettings,
    createOrderRemote,
    attachPaymentSlipRemote,
    lookupOrdersRemote,
    fetchOrdersForAdmin,
    fetchOrdersViaServiceProxy,
    updateOrderStatus,
    rejectPaymentSlipForAdmin,
    deleteOrderForAdmin,
    upsertProduct,
    deleteProductRemote,
    fetchActiveVideos,
    fetchVideosForAdmin,
    upsertVideo,
    deleteVideoRemote,
    saveShopSettingsRemote,
    signIn,
    signOut,
    getSession,
    isAdminUser,
    claimFirstAdmin,
    ensureAdminAccess,
  };
})(typeof window !== 'undefined' ? window : globalThis);
