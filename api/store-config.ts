import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Public store config for /store/ (anon key only).
 * Reads Vercel env at runtime so Production can connect without relying
 * solely on build-time inject into static JS.
 */
function read(name: string): string {
  return String(process.env[name] || '').trim().replace(/^["']|["']$/g, '');
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

function pickUrl(): { value: string; source: string } {
  const candidates: Array<[string, string]> = [
    ['VITE_SUPABASE_URL', read('VITE_SUPABASE_URL')],
    ['SUPABASE_URL', read('SUPABASE_URL')],
    ['NEXT_PUBLIC_SUPABASE_URL', read('NEXT_PUBLIC_SUPABASE_URL')],
  ];
  for (const [source, value] of candidates) {
    if (isValidSupabaseUrl(value)) return { value, source };
  }
  return { value: '', source: '' };
}

function pickAnonKey(url: string): { value: string; source: string } {
  const candidates: Array<[string, string]> = [
    ['VITE_SUPABASE_ANON_KEY', read('VITE_SUPABASE_ANON_KEY')],
    ['SUPABASE_ANON_KEY', read('SUPABASE_ANON_KEY')],
    ['NEXT_PUBLIC_SUPABASE_ANON_KEY', read('NEXT_PUBLIC_SUPABASE_ANON_KEY')],
  ];
  for (const [source, value] of candidates) {
    if (isValidAnonKey(value, url)) return { value, source };
  }
  return { value: '', source: '' };
}

/** Safe shape of an env value — never returns the secret itself. */
function describeEnv(value: string): {
  present: boolean;
  length: number;
  kind: 'empty' | 'supabase_url' | 'jwt' | 'publishable' | 'service_role' | 'other';
  prefix: string;
} {
  if (!value) {
    return { present: false, length: 0, kind: 'empty', prefix: '' };
  }
  let kind: 'supabase_url' | 'jwt' | 'publishable' | 'service_role' | 'other' = 'other';
  if (isValidSupabaseUrl(value)) kind = 'supabase_url';
  else if (/service_role/i.test(value)) kind = 'service_role';
  else if (value.startsWith('eyJ')) kind = 'jwt';
  else if (value.startsWith('sb_publishable_') || value.startsWith('sb_')) kind = 'publishable';
  return {
    present: true,
    length: value.length,
    kind,
    prefix: value.slice(0, 14),
  };
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

  const viteUrl = read('VITE_SUPABASE_URL');
  const viteKey = read('VITE_SUPABASE_ANON_KEY');
  const altUrl = read('SUPABASE_URL') || read('NEXT_PUBLIC_SUPABASE_URL');
  const altKey = read('SUPABASE_ANON_KEY') || read('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const pickedUrl = pickUrl();
  const pickedKey = pickAnonKey(pickedUrl.value);
  const configured = Boolean(pickedUrl.value && pickedKey.value);

  const envShapes = {
    VITE_SUPABASE_URL: describeEnv(viteUrl),
    VITE_SUPABASE_ANON_KEY: describeEnv(viteKey),
    SUPABASE_URL: describeEnv(read('SUPABASE_URL')),
    SUPABASE_ANON_KEY: describeEnv(read('SUPABASE_ANON_KEY')),
    NEXT_PUBLIC_SUPABASE_URL: describeEnv(read('NEXT_PUBLIC_SUPABASE_URL')),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: describeEnv(read('NEXT_PUBLIC_SUPABASE_ANON_KEY')),
  };

  if (!configured) {
    const sameValue = Boolean(viteUrl) && viteUrl === viteKey;
    const urlLooksValid = isValidSupabaseUrl(viteUrl) || Boolean(pickedUrl.value);
    // When URL===KEY (both publishable), do not report keyLooksValid:true alone —
    // that misleads operators into thinking only the URL is wrong.
    const keyLooksValid = sameValue
      ? false
      : isValidAnonKey(viteKey, isValidSupabaseUrl(viteUrl) ? viteUrl : '') ||
        Boolean(pickedKey.value && pickedUrl.value);

    return res.status(200).json({
      configured: false,
      urlPresent: Boolean(viteUrl || altUrl),
      keyPresent: Boolean(viteKey || altKey),
      urlLooksValid,
      keyLooksValid,
      sameValue,
      envShapes,
      project: 'rachawei',
      hint: sameValue
        ? 'VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY ถูกตั้งเป็นค่าเดียวกัน — ตั้ง URL=https://YOUR_PROJECT.supabase.co และ KEY=anon/publishable คนละค่า แล้ว Redeploy โปรเจกต์ rachawei'
        : 'ตั้ง VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co และ VITE_SUPABASE_ANON_KEY คนละค่า แล้ว Redeploy โปรเจกต์ rachawei',
    });
  }

  return res.status(200).json({
    configured: true,
    url: pickedUrl.value,
    anonKey: pickedKey.value,
    sources: { url: pickedUrl.source, anonKey: pickedKey.source },
    envShapes,
    project: 'rachawei',
  });
}
