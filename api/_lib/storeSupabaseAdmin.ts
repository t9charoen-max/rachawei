/**
 * Server-only Supabase helpers (service role). Never import from frontend bundles.
 */

function read(name: string): string {
  return String(process.env[name] || '').trim().replace(/^["']|["']$/g, '');
}

export function getSupabaseUrl(): string {
  return (
    read('VITE_SUPABASE_URL') ||
    read('SUPABASE_URL') ||
    read('NEXT_PUBLIC_SUPABASE_URL')
  );
}

export function getAnonKey(): string {
  return (
    read('VITE_SUPABASE_ANON_KEY') ||
    read('SUPABASE_ANON_KEY') ||
    read('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  );
}

/** Prefer dedicated service role; never fall back to anon/publishable. */
export function getServiceRoleKey(): string {
  const key =
    read('SUPABASE_SERVICE_ROLE_KEY') ||
    read('SUPABASE_SERVICE_KEY') ||
    read('SERVICE_ROLE_KEY');
  if (!key) return '';
  if (/service_role/i.test(key) || key.startsWith('eyJ') || key.startsWith('sb_secret_')) {
    return key;
  }
  return '';
}

export function hasServiceRole(): boolean {
  return Boolean(getSupabaseUrl() && getServiceRoleKey());
}

export async function supabaseAdminFetch(
  path: string,
  init: RequestInit & { userJwt?: string } = {},
): Promise<Response> {
  const url = getSupabaseUrl().replace(/\/$/, '');
  const serviceKey = getServiceRoleKey();
  if (!url || !serviceKey) {
    throw new Error('service_role_not_configured');
  }
  const headers = new Headers(init.headers || {});
  headers.set('apikey', serviceKey);
  headers.set('Authorization', `Bearer ${init.userJwt || serviceKey}`);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(`${url}${path}`, { ...init, headers });
}

export async function verifyUserJwt(accessToken: string): Promise<{
  ok: boolean;
  user?: { id: string; email?: string };
  error?: string;
}> {
  const url = getSupabaseUrl().replace(/\/$/, '');
  const anon = getAnonKey() || getServiceRoleKey();
  if (!url || !anon || !accessToken) {
    return { ok: false, error: 'auth_not_configured' };
  }
  const res = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: anon,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    return { ok: false, error: 'invalid_session' };
  }
  const user = (await res.json()) as { id?: string; email?: string };
  if (!user?.id) return { ok: false, error: 'invalid_session' };
  return { ok: true, user: { id: user.id, email: user.email } };
}

export async function isStoreAdminUserId(userId: string): Promise<boolean> {
  const res = await supabaseAdminFetch(
    `/rest/v1/store_admins?select=user_id&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
  );
  if (!res.ok) return false;
  const rows = (await res.json()) as unknown[];
  return Array.isArray(rows) && rows.length > 0;
}
