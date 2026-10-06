import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getServiceRoleKey,
  getSupabaseUrl,
  hasServiceRole,
  supabaseAdminFetch,
} from './_lib/storeSupabaseAdmin.js';

/**
 * One-time / operator bootstrap for store admin (server-only service role).
 *
 * POST JSON:
 *   { "secret": "<STORE_ADMIN_BOOTSTRAP_SECRET>", "email": "...", "password": "..." }
 *
 * Effects:
 *   - Creates Auth user (confirmed) if missing
 *   - Upserts store_admins row for that user
 *
 * Never exposes service_role to the browser.
 */
function read(name: string): string {
  return String(process.env[name] || '').trim();
}

function cors(res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    let host = '';
    try {
      host = new URL(getSupabaseUrl()).hostname;
    } catch {
      host = '';
    }
    return res.status(200).json({
      ok: true,
      serviceRoleConfigured: hasServiceRole(),
      bootstrapSecretConfigured: Boolean(read('STORE_ADMIN_BOOTSTRAP_SECRET')),
      projectUrlHost: host,
      hint: hasServiceRole()
        ? 'พร้อม bootstrap — ส่ง POST พร้อม secret + email + password'
        : 'ยังไม่มี SUPABASE_SERVICE_ROLE_KEY บน Vercel — หรือรัน supabase/store/006_admin_auth_grants_bootstrap.sql ใน SQL Editor แล้วใช้ store_claim_first_admin / store_link_admin_by_email',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const bootstrapSecret = read('STORE_ADMIN_BOOTSTRAP_SECRET');
  if (!bootstrapSecret) {
    return res.status(503).json({
      ok: false,
      error: 'bootstrap_secret_missing',
      message:
        'ยังไม่ได้ตั้ง STORE_ADMIN_BOOTSTRAP_SECRET บน Vercel — หรือสร้างแอดมินผ่าน SQL Editor ด้วย 006_admin_auth_grants_bootstrap.sql',
    });
  }

  if (!hasServiceRole()) {
    return res.status(503).json({
      ok: false,
      error: 'service_role_missing',
      message:
        'ต้องมี SUPABASE_SERVICE_ROLE_KEY บน Vercel (server only) เพื่อสร้างบัญชีแอดมิน — ห้ามใส่ใน frontend',
    });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const secret = String(body.secret || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!secret || secret !== bootstrapSecret) {
    return res.status(401).json({
      ok: false,
      error: 'unauthorized',
      message: 'รหัส bootstrap ไม่ถูกต้อง',
    });
  }
  if (!email || !email.includes('@')) {
    return res.status(400).json({
      ok: false,
      error: 'email_invalid',
      message: 'กรุณาระบุอีเมลแอดมินที่ถูกต้อง',
    });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({
      ok: false,
      error: 'password_too_short',
      message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
    });
  }

  const url = getSupabaseUrl().replace(/\/$/, '');
  const serviceKey = getServiceRoleKey();

  // 1) Find or create Auth user (email confirmed)
  let userId = '';
  const listRes = await fetch(
    `${url}/auth/v1/admin/users?page=1&per_page=200`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
  );
  if (listRes.ok) {
    const listed = (await listRes.json()) as { users?: Array<{ id: string; email?: string }> };
    const found = (listed.users || []).find((u) => (u.email || '').toLowerCase() === email);
    if (found) userId = found.id;
  }

  if (!userId) {
    const createRes = await fetch(`${url}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'store_admin' },
      }),
    });
    const created = await createRes.json();
    if (!createRes.ok) {
      return res.status(400).json({
        ok: false,
        error: 'auth_create_failed',
        message: created?.msg || created?.message || 'สร้างผู้ใช้ Auth ไม่สำเร็จ',
      });
    }
    userId = created?.id || created?.user?.id || '';
  } else {
    // Update password + confirm for existing user
    await fetch(`${url}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password, email_confirm: true }),
    });
  }

  if (!userId) {
    return res.status(500).json({
      ok: false,
      error: 'user_id_missing',
      message: 'ไม่พบรหัสผู้ใช้หลังสร้างบัญชี',
    });
  }

  // 2) Upsert store_admins
  const upsertRes = await supabaseAdminFetch('/rest/v1/store_admins', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify({ user_id: userId, email }),
  });
  if (!upsertRes.ok) {
    const errText = await upsertRes.text();
    return res.status(500).json({
      ok: false,
      error: 'store_admins_upsert_failed',
      message:
        'บันทึก store_admins ไม่สำเร็จ — ตรวจว่าตารางมีอยู่และรัน 006_admin_auth_grants_bootstrap.sql แล้ว',
      detail: errText.slice(0, 300),
    });
  }

  return res.status(200).json({
    ok: true,
    email,
    userId,
    message: 'สร้าง/อัปเดตเจ้าของร้านสำเร็จ — เข้า /store/#admin ด้วยอีเมลและรหัสผ่านนี้ได้ทันที',
  });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return res.status(500).json({
      ok: false,
      error: 'bootstrap_exception',
      message: `bootstrap failed: ${message}`,
    });
  }
}
