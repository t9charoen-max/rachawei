import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAnonKey, getSupabaseUrl } from './_lib/storeSupabaseAdmin';

/**
 * Tiny public ping so the Supabase free project does not pause after 7 idle days.
 * Vercel Hobby only allows a cron that runs at most once per day, so this route is daily.
 * Uses the anon key only. Selects one product id — never service_role, never a full row.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  const url = getSupabaseUrl().replace(/\/$/, '');
  const key = getAnonKey();
  if (!url || !key || /service_role/i.test(key)) {
    res.status(500).json({ ok: false, error: 'supabase_not_configured' });
    return;
  }

  try {
    const remote = await fetch(
      `${url}/rest/v1/store_products?select=id&status=eq.active&limit=1`,
      {
        method: 'GET',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: 'application/json',
        },
      },
    );
    if (!remote.ok) {
      res.status(502).json({ ok: false, error: 'keepalive_failed', status: remote.status });
      return;
    }
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'HEAD') {
      res.status(204).end();
      return;
    }
    res.status(200).json({ ok: true, ping: 'store_products' });
  } catch {
    res.status(502).json({ ok: false, error: 'keepalive_exception' });
  }
}
