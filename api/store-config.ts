import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Public store config for /store/ (anon key only).
 * Reads Vercel env at runtime so Production can connect without relying
 * solely on build-time inject into static JS.
 */
function read(name: string): string {
  return String(process.env[name] || '').trim();
}

function isValidSupabaseUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') return false;
    return (
      parsed.hostname.endsWith('.supabase.co') ||
      parsed.hostname.endsWith('.supabase.in')
    );
  } catch {
    return false;
  }
}

function isValidAnonKey(value: string, url: string): boolean {
  if (!value || value === url) return false;
  if (/service_role/i.test(value)) return false;
  return (
    value.startsWith('eyJ') ||
    value.startsWith('sb_publishable_') ||
    value.startsWith('sb_')
  );
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ configured: false, error: 'method_not_allowed' });
  }

  const url = read('VITE_SUPABASE_URL');
  const anonKey = read('VITE_SUPABASE_ANON_KEY');
  const urlOk = isValidSupabaseUrl(url);
  const keyOk = isValidAnonKey(anonKey, url);
  const configured = urlOk && keyOk;

  if (!configured) {
    return res.status(200).json({
      configured: false,
      // lengths only — help diagnose misconfigured Vercel env without leaking secrets
      urlPresent: Boolean(url),
      keyPresent: Boolean(anonKey),
      urlLooksValid: urlOk,
      keyLooksValid: keyOk,
      sameValue: Boolean(url) && url === anonKey,
    });
  }

  return res.status(200).json({
    configured: true,
    url,
    anonKey,
  });
}
