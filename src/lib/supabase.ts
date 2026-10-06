import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function readEnv(name: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'): string {
  return String(import.meta.env[name] ?? '').trim();
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

function isValidAnonKey(value: string, supabaseUrl: string): boolean {
  if (!value || value === supabaseUrl) return false;
  if (/service_role/i.test(value)) return false;
  return (
    value.startsWith('eyJ') ||
    value.startsWith('sb_publishable_') ||
    value.startsWith('sb_')
  );
}

let url = readEnv('VITE_SUPABASE_URL');
let anonKey = readEnv('VITE_SUPABASE_ANON_KEY');
let runtimeReady: Promise<boolean> | null = null;

function computeConfigured(): boolean {
  return isValidSupabaseUrl(url) && isValidAnonKey(anonKey, url);
}

/** true เมื่อตั้งค่า env สำหรับ production Supabase ครบและถูกต้อง */
export let isSupabaseConfigured = computeConfigured();

let client: SupabaseClient | null = null;

/**
 * โหลด config จาก /api/store-config ตอน runtime (กรณี build-time env ยังไม่ถูกต้อง)
 */
export async function ensureSupabaseConfig(): Promise<boolean> {
  if (computeConfigured()) {
    isSupabaseConfigured = true;
    return true;
  }
  if (!runtimeReady) {
    runtimeReady = (async () => {
      try {
        const res = await fetch('/api/store-config', { cache: 'no-store' });
        if (!res.ok) return false;
        const data = (await res.json()) as {
          configured?: boolean;
          url?: string;
          anonKey?: string;
        };
        if (data?.configured && data.url && data.anonKey) {
          url = String(data.url).trim();
          anonKey = String(data.anonKey).trim();
          client = null;
          isSupabaseConfigured = computeConfigured();
          return isSupabaseConfigured;
        }
      } catch (err) {
        console.warn('[supabase] runtime config fetch failed', err);
      }
      isSupabaseConfigured = false;
      return false;
    })();
  }
  return runtimeReady;
}

/**
 * Supabase browser client — ใช้เฉพาะ anon/publishable key
 * ห้ามใส่ service_role ใน frontend
 */
export function getSupabase(): SupabaseClient | null {
  if (!computeConfigured()) return null;
  isSupabaseConfigured = true;
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'rachawei-supabase-auth',
      },
    });
  }
  return client;
}

export type StoreProductRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  images: unknown;
  category: string;
  store_cat: string;
  stock: number;
  emoji: string;
  badge: string | null;
  featured: boolean;
  size: string | null;
  panorama360: string | null;
  status: string;
  sort_order: number;
};
