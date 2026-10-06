import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  hasServiceRole,
  isStoreAdminUserId,
  supabaseAdminFetch,
  verifyUserJwt,
} from '../lib/storeSupabaseAdmin';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  if (!hasServiceRole()) {
    return res.status(503).json({
      ok: false,
      error: 'service_role_missing',
      message:
        'เซิร์ฟเวอร์ยังไม่มี SUPABASE_SERVICE_ROLE_KEY — ใช้ RPC store_admin_list_orders หลังรัน SQL 006 แทน',
    });
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
    return res.status(401).json({
      ok: false,
      error: 'invalid_session',
      message: 'เซสชันหมดอายุหรือไม่ถูกต้อง — กรุณาเข้าสู่ระบบใหม่',
    });
  }

  const isAdmin = await isStoreAdminUserId(auth.user.id);
  if (!isAdmin) {
    return res.status(403).json({
      ok: false,
      error: 'not_admin',
      message: 'บัญชีนี้ไม่มีสิทธิ์แอดมิน (ไม่ได้อยู่ในตาราง store_admins)',
    });
  }

  const limit = Math.max(1, Math.min(Number(req.query.limit) || 200, 500));
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
  const orders = (await ordersRes.json()) as Array<{ id: string }>;
  const ids = orders.map((o) => o.id).filter(Boolean);
  let items: unknown[] = [];
  if (ids.length) {
    const inList = ids.map((id) => `"${id}"`).join(',');
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
    source: 'service_role_proxy',
    orders: orders.map((o) => ({
      ...o,
      items: itemsByOrder[o.id] || [],
    })),
  });
}
