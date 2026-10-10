import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getAnonKey,
  getSupabaseUrl,
  hasServiceRole,
  isStoreAdminUserId,
  supabaseAdminFetch,
  verifyUserJwt,
} from './_lib/storeSupabaseAdmin.js';

function cors(res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function bearer(req: VercelRequest): string {
  const h = String(req.headers.authorization || '');
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : '';
}

function digitsOnly(s: string): string {
  return String(s || '').replace(/\D/g, '');
}

/** True when query is phone-like (digits / phone punctuation only). */
function isPhoneQuery(query: string): boolean {
  const q = query.trim();
  if (!q) return false;
  return /^[0-9+().\-\s]+$/.test(q) && digitsOnly(q).length >= 3;
}

/** In-memory filter when RPC 011 is not yet applied — still admin-gated. */
function filterOrdersLocal(
  orders: Array<Record<string, unknown>>,
  query: string,
): Array<Record<string, unknown>> {
  const q = query.trim().toLowerCase();
  const dig = digitsOnly(query);
  const phoneMode = isPhoneQuery(query);
  if (!q) return orders;
  return orders.filter((o) => {
    const id = String(o.id || '').toLowerCase();
    const name = String(o.customer_name || '').toLowerCase();
    const phone = digitsOnly(String(o.customer_phone || ''));
    const phoneDisp = digitsOnly(String(o.phone_display || ''));
    const addr = String(o.customer_address || '').toLowerCase();
    if (id.includes(q) || name.includes(q) || addr.includes(q)) return true;
    // Avoid false positives from letters+digits (e.g. ZZZNOMATCH999 → 999)
    if (phoneMode && dig.length >= 3) {
      if (phone.includes(dig) || phoneDisp.includes(dig)) return true;
      if (dig.length >= 9 && (phone.slice(-9) === dig.slice(-9) || phoneDisp.slice(-9) === dig.slice(-9))) {
        return true;
      }
    }
    return false;
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const token = bearer(req);
  if (!token) {
    return res.status(401).json({
      ok: false,
      error: 'missing_token',
      message: 'กรุณาเข้าสู่ระบบแอดมินก่อน',
    });
  }

  const auth = await verifyUserJwt(token);
  if (!auth.ok || !auth.user) {
    const err = auth.error || 'invalid_session';
    return res.status(401).json({
      ok: false,
      error: err,
      message:
        err === 'auth_not_configured'
          ? 'เซิร์ฟเวอร์ยังตั้งค่า Supabase ไม่ครบ — ตรวจ VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY'
          : 'เซสชันหมดอายุหรือไม่ถูกต้อง — กรุณาเข้าสู่ระบบใหม่',
    });
  }

  // Prefer service-role membership check; if missing service role, fall through to RPC path with user JWT
  if (hasServiceRole()) {
    const isAdmin = await isStoreAdminUserId(auth.user.id);
    if (!isAdmin) {
      return res.status(403).json({
        ok: false,
        error: 'not_admin',
        message: 'บัญชีนี้ไม่มีสิทธิ์แอดมิน (ไม่ได้อยู่ในตาราง store_admins)',
      });
    }
  }

  const limit = Math.max(1, Math.min(Number(req.query.limit) || 200, 500));
  const q = String(req.query.q || req.query.query || '').trim();

  // Search via security-definer RPC (auth.uid from user JWT) — works without listing all rows
  if (q) {
    const url = getSupabaseUrl().replace(/\/$/, '');
    const anon = getAnonKey();
    if (url && anon) {
      const rpcRes = await fetch(`${url}/rest/v1/rpc/store_admin_search_orders`, {
        method: 'POST',
        headers: {
          apikey: anon,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          p_query: q,
          p_limit: Math.min(limit, 200),
        }),
      });
      const rpcText = await rpcRes.text();
      if (rpcRes.ok) {
        let rows: unknown[] = [];
        try {
          rows = JSON.parse(rpcText);
        } catch {
          rows = [];
        }
        if (!Array.isArray(rows)) rows = [];
        return res.status(200).json({
          ok: true,
          source: 'store_admin_search_orders',
          query: q,
          orders: rows,
        });
      }
      if (/not_admin/i.test(rpcText)) {
        return res.status(403).json({
          ok: false,
          error: 'not_admin',
          message: 'บัญชีนี้ไม่มีสิทธิ์แอดมิน',
        });
      }
      // If RPC missing, fall through to list+filter when service role available
      if (!/PGRST202|Could not find the function/i.test(rpcText) && !hasServiceRole()) {
        return res.status(500).json({
          ok: false,
          error: 'search_failed',
          message: 'ค้นหาออเดอร์ไม่สำเร็จ',
          detail: rpcText.slice(0, 300),
        });
      }
    }
  }

  if (!hasServiceRole()) {
    return res.status(503).json({
      ok: false,
      error: 'service_role_missing',
      message:
        q
          ? 'ยังไม่มี SUPABASE_SERVICE_ROLE_KEY และ RPC ค้นหายังไม่พร้อม — รัน SQL 011 หรือตั้ง service role'
          : 'เซิร์ฟเวอร์ยังไม่มี SUPABASE_SERVICE_ROLE_KEY — ใช้ RPC store_admin_list_orders หลังรัน SQL 006/011 แทน',
    });
  }

  const ordersRes = await supabaseAdminFetch(
    `/rest/v1/store_orders?select=*&order=created_at.desc&limit=${limit}`,
  );
  if (!ordersRes.ok) {
    const detail = await ordersRes.text();
    return res.status(500).json({
      ok: false,
      error: 'orders_fetch_failed',
      message: 'อ่านออเดอร์ไม่สำเร็จ',
      detail: detail.slice(0, 300),
    });
  }
  let orders = (await ordersRes.json()) as Array<Record<string, unknown> & { id: string }>;
  if (q) orders = filterOrdersLocal(orders, q) as typeof orders;

  const ids = orders.map((o) => o.id).filter(Boolean);
  let items: unknown[] = [];
  if (ids.length) {
    const inList = ids.map((id) => `"${String(id).replace(/"/g, '')}"`).join(',');
    const itemsRes = await supabaseAdminFetch(
      `/rest/v1/store_order_items?select=*&order_id=in.(${inList})`,
    );
    if (itemsRes.ok) items = await itemsRes.json();
  }

  const itemsByOrder = (items as Array<{ order_id: string }>).reduce(
    (acc: Record<string, unknown[]>, row) => {
      (acc[row.order_id] ||= []).push(row);
      return acc;
    },
    {},
  );

  return res.status(200).json({
    ok: true,
    source: q ? 'service_role_proxy_filtered' : 'service_role_proxy',
    query: q || undefined,
    orders: orders.map((o) => ({
      ...o,
      items: itemsByOrder[o.id] || [],
    })),
  });
}
