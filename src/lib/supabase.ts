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

const url = readEnv('VITE_SUPABASE_URL');
const anonKey = readEnv('VITE_SUPABASE_ANON_KEY');

/** true เมื่อตั้งค่า env สำหรับ production Supabase ครบและถูกต้อง */
export const isSupabaseConfigured =
  isValidSupabaseUrl(url) && isValidAnonKey(anonKey, url);

let client: SupabaseClient | null = null;

/**
 * Supabase browser client — ใช้เฉพาะ anon/publishable key
 * ห้ามใส่ service_role ใน frontend
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
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
