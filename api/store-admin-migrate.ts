import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getDatabaseUrl,
  getServerEnvProbe,
  getSupabaseUrl,
  hasServiceRole,
} from './_lib/storeSupabaseAdmin.js';

/**
 * Apply supabase/store/006_admin_auth_grants_bootstrap.sql (idempotent).
 * Server-only. Never exposes secret values.
 *
 * GET  → status / env probe (no secrets)
 * POST → { "secret": "<STORE_ADMIN_BOOTSTRAP_SECRET>" } applies SQL 006
 *         Requires DATABASE_URL / POSTGRES_URL* or SUPABASE_ACCESS_TOKEN
 */
function read(name: string): string {
  return String(process.env[name] || '').trim().replace(/^["']|["']$/g, '');
}

function cors(res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function loadSql006(): string {
  const candidates = [
    join(process.cwd(), 'supabase/store/006_admin_auth_grants_bootstrap.sql'),
    join(__dirname, '../supabase/store/006_admin_auth_grants_bootstrap.sql'),
  ];
  for (const p of candidates) {
    try {
      return readFileSync(p, 'utf8');
    } catch {
      /* try next */
    }
  }
  throw new Error('sql_006_file_not_found');
}

async function probeRpc(fn: string): Promise<{ ok: boolean; code?: string }> {
  const url = getSupabaseUrl().replace(/\/$/, '');
  const anon =
    read('VITE_SUPABASE_ANON_KEY') ||
    read('SUPABASE_ANON_KEY') ||
    read('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!url || !anon) return { ok: false, code: 'no_anon' };
  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 404 || body?.code === 'PGRST202') {
    return { ok: false, code: 'PGRST202' };
  }
  // 401/not_authenticated/not_admin still means the function exists
  return { ok: true, code: body?.code || String(res.status) };
}

async function applyViaManagementApi(sql: string): Promise<void> {
  const token = read('SUPABASE_ACCESS_TOKEN');
  const ref =
    read('SUPABASE_PROJECT_REF') ||
    (() => {
      try {
        return new URL(getSupabaseUrl()).hostname.split('.')[0];
      } catch {
        return 'jvgfudxdwdwfumdznymu';
      }
    })();
  if (!token) throw new Error('access_token_missing');
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`management_api_${res.status}: ${text.slice(0, 240)}`);
}

async function applyViaPostgres(sql: string): Promise<void> {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) throw new Error('database_url_missing');
  let pg: any;
  try {
    pg = await import('pg');
  } catch {
    throw new Error('pg_package_missing');
  }
  const { Client } = pg.default || pg;
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(204).end();

    const probe = getServerEnvProbe();
    let host = '';
    try {
      host = new URL(getSupabaseUrl()).hostname;
    } catch {
      host = '';
    }

    if (req.method === 'GET') {
      const listRpc = await probeRpc('store_admin_list_orders');
      const claimRpc = await probeRpc('store_claim_first_admin');
      return res.status(200).json({
        ok: true,
        projectUrlHost: host,
        serviceRoleConfigured: hasServiceRole(),
        env: probe,
        rpc: {
          store_admin_list_orders: listRpc,
          store_claim_first_admin: claimRpc,
        },
        hint: listRpc.ok
          ? 'RPC พร้อม — Admin ที่อยู่ใน store_admins อ่านออเดอร์ได้'
          : probe.hasDatabaseUrl || probe.hasAccessToken
            ? 'RPC ยังไม่มี — POST พร้อม STORE_ADMIN_BOOTSTRAP_SECRET เพื่อ apply SQL 006'
            : 'ต้องตั้ง SUPABASE_SERVICE_ROLE_KEY หรือ DATABASE_URL/SUPABASE_ACCESS_TOKEN บน Vercel rachawei Production',
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
        message: 'ต้องมี STORE_ADMIN_BOOTSTRAP_SECRET บน Vercel เพื่อรัน migrate',
      });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const secret = String(body.secret || '').trim();
    if (!secret || secret !== bootstrapSecret) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    const sql = loadSql006();
    let via = '';
    if (probe.hasAccessToken) {
      await applyViaManagementApi(sql);
      via = 'management_api';
    } else if (probe.hasDatabaseUrl) {
      await applyViaPostgres(sql);
      via = 'database_url';
    } else {
      return res.status(503).json({
        ok: false,
        error: 'migrate_credentials_missing',
        message:
          'ต้องมี SUPABASE_ACCESS_TOKEN หรือ DATABASE_URL/POSTGRES_URL บน Vercel เพื่อ apply SQL 006',
        env: probe,
      });
    }

    const listRpc = await probeRpc('store_admin_list_orders');
    const claimRpc = await probeRpc('store_claim_first_admin');
    return res.status(200).json({
      ok: true,
      applied: true,
      via,
      rpc: {
        store_admin_list_orders: listRpc,
        store_claim_first_admin: claimRpc,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return res.status(500).json({
      ok: false,
      error: 'migrate_failed',
      message: message.slice(0, 300),
    });
  }
}
