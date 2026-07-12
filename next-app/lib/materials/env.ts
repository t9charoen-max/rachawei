/** ตรวจ env ฝั่ง browser (ใช้ตอน static export บน Vercel) */
export function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? '';

  return {
    url,
    anonKey,
    basePath,
    isConfigured: Boolean(url.startsWith('http') && anonKey.length > 20),
  };
}

export function isPublicSupabaseReady() {
  return getPublicSupabaseConfig().isConfigured;
}
