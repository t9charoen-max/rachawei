import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? '';

/** true เมื่อตั้งค่า env สำหรับ production Supabase ครบ */
export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

/**
 * Supabase browser client — ใช้เฉพาะ anon key
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
