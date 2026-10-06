/**
 * Rachawei Store — Supabase data layer (anon key only).
 * Depends on: vendor/supabase.js (UMD), supabase-env.js
 * Exposes: window.RachaweiStoreApi
 */
(function initRachaweiStoreApi(global) {
  const cfg = global.__RACHAWEI_SUPABASE__ || {};
  const url = String(cfg.url || '').trim();
  const anonKey = String(cfg.anonKey || '').trim();

  let client = null;
  let initError = null;
  let usingSupabase = false;

  function safeLog(message, err) {
    try {
      const detail = err && err.message ? err.message : err;
      console.warn('[RachaweiStore]', message, detail || '');
    } catch (_) { /* ignore */ }
  }

  function isConfigured() {
    return Boolean(url && anonKey && !/service_role/i.test(anonKey));
  }

  function getClient() {
    if (client) return client;
    if (!isConfigured()) {
      initError = 'missing_env';
      return null;
    }
    if (!global.supabase || typeof global.supabase.createClient !== 'function') {
      initError = 'sdk_missing';
      safeLog('Supabase SDK ไม่พร้อม');
      return null;
    }
    try {
      client = global.supabase.createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'rachawei-store-auth',
        },
      });
      return client;
    } catch (err) {
      initError = 'init_failed';
      safeLog('สร้าง Supabase client ไม่สำเร็จ', err);
      return null;
    }
  }

  function resolveImagePath(file) {
    const s = String(file || '').trim();
    if (!s) return '';
    if (s.startsWith('/') || s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:')) {
      return s;
    }
    return `/products/${s}`;
  }

  function mapProductFromRow(row) {
    if (!row) return null;
    const idNum = Number(row.id);
    const id = Number.isFinite(idNum) ? idNum : row.id;
    const images = (Array.isArray(row.images) ? row.images : [])
      .map(resolveImagePath)
      .filter(Boolean);
    const badge = row.badge || (row.featured ? 'พิเศษ' : null);
    return {
      id,
      name: row.name || '',
      cat: row.store_cat || (row.category === 'เก้าอี้' ? 'chair' : 'basket'),
      category: row.category || '',
      desc: String(row.description || '').slice(0, 160),
      detail: row.description || '',
      price: Number(row.price) || 0,
      stock: row.stock != null ? Number(row.stock) : null,
      size: row.size || '',
      emoji: row.emoji || '🧺',
      badge,
      special: Boolean(row.featured),
      images,
      image: images[0] || '',
      panorama360: row.panorama360
        ? resolveImagePath(row.panorama360)
        : '',
      status: row.status || 'active',
      sortOrder: row.sort_order != null ? Number(row.sort_order) : 0,
      _supabase: true,
    };
  }

  function mapProductToRow(p, { forAdmin = false } = {}) {
    const images = (Array.isArray(p.images) ? p.images : [])
      .map((img) => {
        const s = String(img || '');
        return s.startsWith('/products/') ? s.slice('/products/'.length) : s;
      })
      .filter(Boolean);
    const row = {
      id: String(p.id),
      name: String(p.name || '').trim() || 'สินค้า',
      description: String(p.detail || p.desc || ''),
      price: Number(p.price) || 0,
      images,
      category: String(p.category || ''),
      store_cat: String(p.cat || p.storeCat || 'basket'),
      stock: Math.max(0, Number(p.stock) || 0),
      emoji: p.emoji || '🧺',
      badge: p.badge || null,
      featured: Boolean(p.special || p.featured || (p.badge === 'พิเศษ')),
      size: p.size || null,
      panorama360: p.panorama360
        ? String(p.panorama360).replace(/^\/products\//, '')
        : null,
      status: p.status === 'hidden' || p.status === 'draft' ? p.status : 'active',
      sort_order: Number.isFinite(Number(p.sortOrder)) ? Number(p.sortOrder) : Number(p.id) || 0,
    };
    if (!forAdmin) {
      // public upsert not allowed; admin path only
    }
    return row;
  }

  function mapSettingsFromRow(row) {
    if (!row) return null;
    return {
      shopName: row.shop_name,
      shopSub: row.shop_sub,
      phoneDisplay: row.phone_display,
      phoneTel: row.phone_tel,
      lineUrl: row.line_url,
      facebookUrl: row.facebook_url,
      mapUrl: row.map_url,
      addressHtml: row.address_html,
      promoMin: Number(row.promo_min) || 0,
      promoDiscount: Number(row.promo_discount) || 0,
      shippingFee: Number(row.shipping_fee) || 0,
      freeShippingMin: Number(row.free_shipping_min) || 0,
      bankName: row.bank_name || '',
      bankAccountName: row.bank_account_name || '',
      promptPayNo: row.promptpay_no || '',
      bankAccountNo: row.bank_account_no || '',
      bankNote: row.bank_note || '',
      heroImages: Array.isArray(row.hero_images) ? row.hero_images : [],
      storefrontPhotos: Array.isArray(row.storefront_photos) ? row.storefront_photos : [],
      content: row.content && typeof row.content === 'object' ? row.content : {},
    };
  }

  function mapSettingsToRow(cfg) {
    return {
      id: 'default',
      shop_name: cfg.shopName || 'ราชาหวายสุรินทร์',
      shop_sub: cfg.shopSub || '',
      phone_display: cfg.phoneDisplay || '',
      phone_tel: cfg.phoneTel || '',
      line_url: cfg.lineUrl || '',
      facebook_url: cfg.facebookUrl || '',
      map_url: cfg.mapUrl || '',
      address_html: cfg.addressHtml || '',
      promo_min: Number(cfg.promoMin) || 0,
      promo_discount: Number(cfg.promoDiscount) || 0,
      shipping_fee: Number(cfg.shippingFee) || 0,
      free_shipping_min: Number(cfg.freeShippingMin) || 0,
      bank_name: cfg.bankName || '',
      bank_account_name: cfg.bankAccountName || '',
      promptpay_no: cfg.promptPayNo || '',
      bank_account_no: cfg.bankAccountNo || '',
      bank_note: cfg.bankNote || '',
      hero_images: Array.isArray(cfg.heroImages) ? cfg.heroImages : [],
      storefront_photos: Array.isArray(cfg.storefrontPhotos) ? cfg.storefrontPhotos : [],
      content: cfg.content && typeof cfg.content === 'object' ? cfg.content : {},
    };
  }

  function mapVideoFromRow(row) {
    if (!row) return null;
    return {
      id: Number(row.id),
      title: row.title || '',
      url: row.video_url || '',
      videoUrl: row.video_url || '',
      productId: row.product_id != null ? Number(row.product_id) : null,
      thumbnail: row.thumbnail || '',
      views: Number(row.views) || 0,
      sortOrder: Number(row.sort_order) || 0,
      isActive: row.is_active !== false,
    };
  }

  function mapVideoToRow(v) {
    return {
      title: String(v.title || ''),
      video_url: String(v.url || v.videoUrl || ''),
      product_id: v.productId != null && v.productId !== '' ? String(v.productId) : null,
      thumbnail: v.thumbnail || null,
      views: Math.max(0, Number(v.views) || 0),
      sort_order: Number(v.sortOrder) || 0,
      is_active: v.isActive !== false,
    };
  }

  function mapOrderMethod(method) {
    if (method === 'cod') return 'cod';
    if (method === 'promptpay') return 'promptpay';
    if (method === 'bank' || method === 'transfer') return 'transfer';
    return 'other';
  }

  function mapOrderFromRow(row, items) {
    if (!row) return null;
    const method = row.method === 'transfer' ? 'bank' : row.method;
    return {
      id: row.id,
      name: row.customer_name,
      phone: String(row.customer_phone || '').replace(/\D/g, ''),
      phoneDisplay: row.phone_display || row.customer_phone || '',
      address: row.customer_address || '',
      note: row.note || '',
      method,
      items: (items || []).map((it) => ({
        id: it.product_id != null ? Number(it.product_id) : null,
        name: it.product_name,
        emoji: it.emoji || '🧺',
        qty: Number(it.qty) || 1,
        price: Number(it.unit_price) || 0,
      })),
      subtotal: Number(row.subtotal) || 0,
      promoDiscount: Number(row.promo_discount) || 0,
      shippingFee: Number(row.shipping_fee) || 0,
      total: Number(row.total) || 0,
      statusIndex: Number(row.status_index) || 0,
      history: Array.isArray(row.history) ? row.history : [],
      createdAt: row.created_at ? Date.parse(row.created_at) || Date.now() : Date.now(),
      paymentSlip: row.payment_slip || null,
      slipUploadedAt: row.slip_uploaded_at
        ? Date.parse(row.slip_uploaded_at) || null
        : null,
      _supabase: true,
    };
  }

  async function fetchActiveProducts() {
    const sb = getClient();
    if (!sb) return { ok: false, reason: initError || 'not_configured', products: [] };
    try {
      const { data, error } = await sb
        .from('store_products')
        .select('*')
        .eq('status', 'active')
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true });
      if (error) throw error;
      const products = (data || []).map(mapProductFromRow).filter(Boolean);
      usingSupabase = true;
      return { ok: true, products };
    } catch (err) {
      safeLog('โหลดสินค้าจาก Supabase ไม่สำเร็จ — ใช้ fallback', err);
      return { ok: false, reason: 'fetch_failed', products: [], error: err };
    }
  }

  async function fetchPublicSettings() {
    const sb = getClient();
    if (!sb) return { ok: false, settings: null };
    try {
      const { data, error } = await sb
        .from('store_shop_settings_public')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();
      if (error) throw error;
      return { ok: true, settings: mapSettingsFromRow(data) };
    } catch (err) {
      safeLog('โหลดตั้งค่าร้านจาก Supabase ไม่สำเร็จ', err);
      return { ok: false, settings: null, error: err };
    }
  }

  async function fetchActiveVideos() {
    const sb = getClient();
    if (!sb) return { ok: false, videos: [] };
    try {
      const { data, error } = await sb
        .from('store_videos')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true });
      if (error) throw error;
      return { ok: true, videos: (data || []).map(mapVideoFromRow).filter(Boolean) };
    } catch (err) {
      safeLog('โหลดวิดีโอจาก Supabase ไม่สำเร็จ', err);
      return { ok: false, videos: [], error: err };
    }
  }

  async function createOrderRemote(order) {
    const sb = getClient();
    if (!sb) return { ok: false, reason: 'not_configured' };
    const method = mapOrderMethod(order.method);
    const orderRow = {
      id: order.id,
      customer_name: order.name,
      customer_phone: order.phone || '',
      phone_display: order.phoneDisplay || '',
      customer_address: order.address || '',
      note: order.note || '',
      method,
      subtotal: Number(order.subtotal) || 0,
      promo_discount: Number(order.promoDiscount) || 0,
      shipping_fee: Number(order.shippingFee) || 0,
      total: Number(order.total) || 0,
      status_index: Number(order.statusIndex) || 0,
      history: Array.isArray(order.history) ? order.history : [],
      payment_slip: order.paymentSlip || null,
      slip_uploaded_at: order.slipUploadedAt
        ? new Date(order.slipUploadedAt).toISOString()
        : null,
    };
    const itemRows = (order.items || []).map((it) => ({
      order_id: order.id,
      product_id: it.id != null ? String(it.id) : null,
      product_name: it.name || 'สินค้า',
      emoji: it.emoji || '🧺',
      qty: Math.max(1, Number(it.qty) || 1),
      unit_price: Number(it.price) || 0,
      line_total: (Number(it.price) || 0) * Math.max(1, Number(it.qty) || 1),
    }));

    // Prefer atomic RPC (003_rachawei_store_create_order_rpc.sql)
    try {
      const { data, error } = await sb.rpc('store_create_order', {
        p_order: orderRow,
        p_items: itemRows,
      });
      if (!error && data && data.ok !== false) {
        usingSupabase = true;
        return { ok: true, via: 'rpc', duplicate: Boolean(data.duplicate) };
      }
      if (error && !/could not find|function.*does not exist|PGRST202/i.test(String(error.message || error))) {
        safeLog('RPC store_create_order ล้มเหลว', error);
        return { ok: false, reason: 'rpc_failed', error };
      }
      if (error) safeLog('RPC ยังไม่พร้อม — fallback insert ทีละตาราง', error);
    } catch (err) {
      safeLog('RPC store_create_order เรียกไม่ได้ — fallback', err);
    }

    try {
      const { error: orderErr } = await sb.from('store_orders').insert(orderRow);
      if (orderErr) {
        if (/duplicate|unique/i.test(String(orderErr.message || orderErr.code || ''))) {
          // Same order id already stored (retry / double-submit). Prefer RPC 003 for atomic create.
          usingSupabase = true;
          return { ok: true, via: 'insert', duplicate: true };
        }
        throw orderErr;
      }
      if (itemRows.length) {
        const { error: itemsErr } = await sb.from('store_order_items').insert(itemRows);
        if (itemsErr) {
          safeLog('บันทึกรายการสินค้าในออเดอร์ไม่ครบ — รัน SQL 003 (RPC)', itemsErr);
          return { ok: false, reason: 'items_failed', partial: true, error: itemsErr };
        }
      }
      usingSupabase = true;
      return { ok: true, via: 'insert' };
    } catch (err) {
      safeLog('บันทึกออเดอร์ไป Supabase ไม่สำเร็จ', err);
      return { ok: false, reason: 'insert_failed', error: err };
    }
  }

  async function updateOrderSlipRemote(orderId, paymentSlip, slipUploadedAt) {
    const sb = getClient();
    if (!sb) return { ok: false };
    // anon cannot update orders under current RLS — requires authenticated or RPC
    try {
      const { data: sessionData } = await sb.auth.getSession();
      if (!sessionData?.session) {
        return { ok: false, reason: 'needs_rpc_or_auth' };
      }
      const { error } = await sb
        .from('store_orders')
        .update({
          payment_slip: paymentSlip,
          slip_uploaded_at: slipUploadedAt
            ? new Date(slipUploadedAt).toISOString()
            : new Date().toISOString(),
        })
        .eq('id', orderId);
      if (error) throw error;
      return { ok: true };
    } catch (err) {
      safeLog('อัปเดตสลิปบน Supabase ไม่สำเร็จ (ต้องใช้ RPC สำหรับลูกค้า)', err);
      return { ok: false, reason: 'update_failed', error: err };
    }
  }

  async function fetchAdminOrders() {
    const sb = getClient();
    if (!sb) return { ok: false, orders: [] };
    try {
      const { data: rows, error } = await sb
        .from('store_orders')
        .select('*, store_order_items(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const orders = (rows || []).map((row) => {
        const items = row.store_order_items || row.items || [];
        const orderRow = { ...row };
        delete orderRow.store_order_items;
        delete orderRow.items;
        return mapOrderFromRow(orderRow, items);
      });
      return { ok: true, orders };
    } catch (err) {
      // Fallback without nested select (older PostgREST embedding)
      try {
        const { data: rows, error } = await sb
          .from('store_orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        const orders = [];
        for (const row of rows || []) {
          const { data: items, error: itemsErr } = await sb
            .from('store_order_items')
            .select('*')
            .eq('order_id', row.id);
          if (itemsErr) safeLog('โหลดรายการออเดอร์ไม่ครบ', itemsErr);
          orders.push(mapOrderFromRow(row, items || []));
        }
        return { ok: true, orders };
      } catch (err2) {
        safeLog('โหลดออเดอร์ (admin) ไม่สำเร็จ', err2 || err);
        return { ok: false, orders: [], error: err2 || err };
      }
    }
  }

  let ordersRealtimeChannel = null;

  function subscribeOrders(onChange) {
    const sb = getClient();
    if (!sb || typeof onChange !== 'function') return () => {};
    try {
      if (ordersRealtimeChannel) {
        sb.removeChannel(ordersRealtimeChannel);
        ordersRealtimeChannel = null;
      }
      ordersRealtimeChannel = sb
        .channel('rachawei-store-orders')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'store_orders' },
          () => {
            try { onChange(); } catch (_) { /* ignore */ }
          },
        )
        .subscribe();
      return () => {
        try {
          if (ordersRealtimeChannel) sb.removeChannel(ordersRealtimeChannel);
        } catch (_) { /* ignore */ }
        ordersRealtimeChannel = null;
      };
    } catch (err) {
      safeLog('subscribe orders realtime ไม่สำเร็จ', err);
      return () => {};
    }
  }

  async function updateOrderStatusRemote(orderId, statusIndex, history) {
    const sb = getClient();
    if (!sb) return { ok: false };
    try {
      const { error } = await sb
        .from('store_orders')
        .update({
          status_index: statusIndex,
          history: Array.isArray(history) ? history : [],
        })
        .eq('id', orderId);
      if (error) throw error;
      return { ok: true };
    } catch (err) {
      safeLog('อัปเดตสถานะออเดอร์ไม่สำเร็จ', err);
      return { ok: false, error: err };
    }
  }

  async function upsertProductRemote(product) {
    const sb = getClient();
    if (!sb) return { ok: false };
    try {
      const row = mapProductToRow(product, { forAdmin: true });
      const { error } = await sb.from('store_products').upsert(row, { onConflict: 'id' });
      if (error) throw error;
      return { ok: true };
    } catch (err) {
      safeLog('บันทึกสินค้าไป Supabase ไม่สำเร็จ', err);
      return { ok: false, error: err };
    }
  }

  async function deleteProductRemote(productId) {
    const sb = getClient();
    if (!sb) return { ok: false };
    try {
      const { error } = await sb
        .from('store_products')
        .update({ status: 'hidden' })
        .eq('id', String(productId));
      if (error) throw error;
      return { ok: true };
    } catch (err) {
      safeLog('ซ่อนสินค้าบน Supabase ไม่สำเร็จ', err);
      return { ok: false, error: err };
    }
  }

  async function saveSettingsRemote(cfg) {
    const sb = getClient();
    if (!sb) return { ok: false };
    try {
      const row = mapSettingsToRow(cfg);
      const { error } = await sb.from('store_shop_settings').upsert(row, { onConflict: 'id' });
      if (error) throw error;
      return { ok: true };
    } catch (err) {
      safeLog('บันทึกตั้งค่าร้านไป Supabase ไม่สำเร็จ', err);
      return { ok: false, error: err };
    }
  }

  async function upsertVideoRemote(video) {
    const sb = getClient();
    if (!sb) return { ok: false };
    try {
      const row = mapVideoToRow(video);
      if (video.id != null && Number(video.id) > 0) {
        const { error } = await sb.from('store_videos').update(row).eq('id', Number(video.id));
        if (error) throw error;
      } else {
        const { data, error } = await sb.from('store_videos').insert(row).select('id').single();
        if (error) throw error;
        return { ok: true, id: data?.id };
      }
      return { ok: true, id: video.id };
    } catch (err) {
      safeLog('บันทึกวิดีโอไป Supabase ไม่สำเร็จ', err);
      return { ok: false, error: err };
    }
  }

  async function deleteVideoRemote(videoId) {
    const sb = getClient();
    if (!sb) return { ok: false };
    try {
      const { error } = await sb
        .from('store_videos')
        .update({ is_active: false })
        .eq('id', Number(videoId));
      if (error) throw error;
      return { ok: true };
    } catch (err) {
      safeLog('ปิดวิดีโอบน Supabase ไม่สำเร็จ', err);
      return { ok: false, error: err };
    }
  }

  async function signIn(email, password) {
    const sb = getClient();
    if (!sb) return { ok: false, reason: 'not_configured' };
    try {
      const { data, error } = await sb.auth.signInWithPassword({
        email: String(email || '').trim(),
        password: String(password || ''),
      });
      if (error) throw error;
      return { ok: true, session: data.session, user: data.user };
    } catch (err) {
      safeLog('เข้าสู่ระบบหลังร้านไม่สำเร็จ', err);
      return { ok: false, reason: 'auth_failed', error: err };
    }
  }

  async function signOut() {
    const sb = getClient();
    if (!sb) return { ok: true };
    try {
      await sb.auth.signOut();
      return { ok: true };
    } catch (err) {
      safeLog('ออกจากระบบไม่สำเร็จ', err);
      return { ok: false, error: err };
    }
  }

  async function getSession() {
    const sb = getClient();
    if (!sb) return null;
    try {
      const { data, error } = await sb.auth.getSession();
      if (error) throw error;
      return data.session || null;
    } catch (err) {
      safeLog('อ่าน session ไม่สำเร็จ', err);
      return null;
    }
  }

  async function fetchAdminProducts() {
    const sb = getClient();
    if (!sb) return { ok: false, products: [] };
    try {
      const { data, error } = await sb
        .from('store_products')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true });
      if (error) throw error;
      return { ok: true, products: (data || []).map(mapProductFromRow).filter(Boolean) };
    } catch (err) {
      safeLog('โหลดสินค้า (admin) ไม่สำเร็จ', err);
      return { ok: false, products: [], error: err };
    }
  }

  global.RachaweiStoreApi = {
    isConfigured,
    isUsingSupabase: () => usingSupabase,
    getInitError: () => initError,
    getClient,
    fetchActiveProducts,
    fetchAdminProducts,
    fetchPublicSettings,
    fetchActiveVideos,
    createOrderRemote,
    updateOrderSlipRemote,
    fetchAdminOrders,
    subscribeOrders,
    updateOrderStatusRemote,
    upsertProductRemote,
    deleteProductRemote,
    saveSettingsRemote,
    upsertVideoRemote,
    deleteVideoRemote,
    signIn,
    signOut,
    getSession,
  };
})(window);
