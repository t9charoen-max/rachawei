/**
 * Supabase Edge Function: ai-sales-assistant
 * - Reads active store_products from Supabase (anon / service role via env)
 * - Calls Gemini Free Tier (server-side only)
 * - Never exposes GEMINI_API_KEY to the browser
 *
 * Secrets (Dashboard → Edge Functions → Secrets):
 *   GEMINI_API_KEY=...
 * Optional:
 *   GEMINI_MODEL=gemini-2.5-flash-lite
 *
 * Auto-provided by Supabase runtime:
 *   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-rachawei-client',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** Free-tier-friendly defaults (paid models must not be selected automatically) */
const DEFAULT_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
];

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 12;
const MAX_MESSAGE = 480;
const rateMap = new Map<string, { count: number; resetAt: number }>();

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: unknown;
  stock: number | null;
  size: string | null;
  emoji: string | null;
  badge: string | null;
  category: string | null;
  store_cat: string | null;
  status: string | null;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const cur = rateMap.get(ip);
  if (!cur || now > cur.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (cur.count >= RATE_MAX) return false;
  cur.count += 1;
  return true;
}

function sanitizeMessage(raw: unknown): string {
  const s = String(raw || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (s.length > MAX_MESSAGE) return s.slice(0, MAX_MESSAGE);
  return s;
}

function resolveImage(file: unknown): string {
  const s = String(file || '').trim();
  if (!s) return '';
  if (s.startsWith('http') || s.startsWith('data:') || s.startsWith('/')) return s;
  return `/products/${s}`;
}

function compactProducts(rows: ProductRow[]) {
  return rows.map((p) => {
    const imgs = Array.isArray(p.images) ? p.images : [];
    const image = resolveImage(imgs[0]);
    return {
      id: String(p.id),
      name: p.name,
      description: String(p.description || '').slice(0, 220),
      price: Number(p.price) || 0,
      stock: p.stock == null ? null : Number(p.stock),
      size: p.size || '',
      emoji: p.emoji || '🧺',
      badge: p.badge || '',
      category: p.category || p.store_cat || '',
      image,
    };
  });
}

function localMatch(query: string, products: ReturnType<typeof compactProducts>) {
  const q = query.toLowerCase();
  const budget = (() => {
    const m = q.match(/(?:งบ|ไม่เกิน|ภายใต้|ราคา)\s*(\d{2,6})/);
    return m ? Number(m[1]) : null;
  })();

  let list = products.filter((p) => (p.stock == null || p.stock > 0));
  if (budget != null && Number.isFinite(budget)) {
    list = list.filter((p) => p.price <= budget);
  }

  const tokens = q.split(/[\s,./]+/).filter((t) => t.length >= 2);
  const scored = list
    .map((p) => {
      const hay = `${p.name} ${p.description} ${p.category} ${p.size} ${p.badge}`.toLowerCase();
      let score = 0;
      for (const t of tokens) {
        if (hay.includes(t)) score += 2;
      }
      if (/ตะกร้า|basket/.test(q) && /ตะกร้า|basket/.test(hay)) score += 3;
      if (/เก้าอี้|เก้าอ|chair/.test(q) && /เก้าอี้|chair/.test(hay)) score += 3;
      if (/ของขวัญ|gift|กระเช้า/.test(q) && /ขวัญ|gift|กระเช้า|badge/.test(hay + p.badge)) score += 2;
      return { p, score };
    })
    .filter((x) => x.score > 0 || budget != null)
    .sort((a, b) => b.score - a.score || a.p.price - b.p.price);

  const picked = (scored.length ? scored : list.map((p) => ({ p, score: 0 })))
    .slice(0, 5)
    .map((x) => x.p);

  if (!picked.length) {
    return {
      answer:
        'ไม่พบสินค้าที่ตรงกับคำถามในคลังร้านขณะนี้ — ลองระบุงบประมาณหรือประเภท เช่น ตะกร้า เก้าอี้ ของขวัญ',
      products: [] as ReturnType<typeof compactProducts>,
    };
  }

  const lines = picked.map(
    (p, i) =>
      `${i + 1}. ${p.name} — ${p.price.toLocaleString('th-TH')} บาท` +
      (p.stock != null ? ` (คงเหลือ ${p.stock})` : '') +
      (p.size ? ` · ${p.size}` : ''),
  );
  return {
    answer:
      `ค้นหาจากสินค้าจริงในร้านราชาหวายสุรินทร์:\n${lines.join('\n')}\n\n` +
      'กดดูรายละเอียดหรือใส่ตะกร้าได้จากปุ่มด้านล่าง — ผู้ช่วยไม่ยืนยันการชำระเงินแทนคุณ',
    products: picked,
  };
}

async function fetchProducts() {
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key =
    Deno.env.get('SUPABASE_ANON_KEY') ||
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
    '';
  if (!url || !key) throw new Error('supabase_env_missing');

  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb
    .from('store_products')
    .select(
      'id,name,description,price,images,stock,size,emoji,badge,category,store_cat,status',
    )
    .eq('status', 'active')
    .order('sort_order', { ascending: true })
    .limit(80);

  if (error) throw new Error(error.message);
  return compactProducts((data || []) as ProductRow[]);
}

function buildPrompt(message: string, catalog: ReturnType<typeof compactProducts>) {
  const catalogJson = JSON.stringify(
    catalog.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      stock: p.stock,
      size: p.size,
      category: p.category,
      badge: p.badge,
      description: p.description,
    })),
  );

  return `คุณเป็นผู้ช่วยขายของร้าน "ราชาหวายสุรินทร์" งานจักสานหวายบ้านบุทม จ.สุรินทร์
กฎสำคัญ:
1) ตอบภาษาไทย สุภาพ กระชับ
2) แนะนำเฉพาะสินค้าใน CATALOG ด้านล่างเท่านั้น — ห้ามแต่งราคา สต็อก ส่วนลด ค่าจัดส่ง หรือสินค้าที่ไม่มี
3) หากไม่มีข้อมูลใน CATALOG ให้บอกว่าไม่พบข้อมูลอย่างตรงไปตรงมา
4) ห้ามสร้างออเดอร์ ห้ามยืนยันการชำระเงิน ห้ามขอรหัสผ่าน/เลขบัตร
5) เมื่อแนะนำสินค้า ให้ใส่รหัสสินค้าในรูปแบบ [รหัส:ID] เช่น [รหัส:1]
6) แนะนำได้สูงสุด 5 รายการ
7) ถ้าลูกค้าถามเรื่องโปร/ค่าส่งที่ไม่อยู่ใน CATALOG ให้บอกให้ดูที่หน้าร้านหรือติดต่อร้าน

CATALOG (JSON):
${catalogJson}

คำถามลูกค้า:
${message}`;
}

async function callGemini(prompt: string): Promise<{ text: string; model: string }> {
  const apiKey = Deno.env.get('GEMINI_API_KEY') || '';
  if (!apiKey) {
    const err = new Error('gemini_key_missing');
    (err as Error & { code?: string }).code = 'gemini_key_missing';
    throw err;
  }

  const preferred = (Deno.env.get('GEMINI_MODEL') || '').trim();
  const models = preferred
    ? [preferred, ...DEFAULT_MODELS.filter((m) => m !== preferred)]
    : DEFAULT_MODELS;

  let lastErr = 'gemini_failed';
  for (const model of models) {
    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent` +
      `?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 700,
        },
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = String(body?.error?.message || res.status);
      lastErr = msg;
      // Try next free model on 404/not found / quota for this model
      if (
        res.status === 404 ||
        /not found|unsupported|quota|rate limit|RESOURCE_EXHAUSTED/i.test(msg)
      ) {
        continue;
      }
      const err = new Error(msg);
      (err as Error & { code?: string }).code =
        /quota|rate limit|RESOURCE_EXHAUSTED/i.test(msg)
          ? 'gemini_quota'
          : 'gemini_error';
      throw err;
    }
    const text =
      body?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text || '')
        .join('')
        .trim() || '';
    if (!text) {
      lastErr = 'empty_response';
      continue;
    }
    return { text, model };
  }

  const err = new Error(lastErr);
  (err as Error & { code?: string }).code = /quota|rate|RESOURCE/i.test(lastErr)
    ? 'gemini_quota'
    : 'gemini_error';
  throw err;
}

function extractIds(answer: string, catalog: ReturnType<typeof compactProducts>) {
  const ids = new Set<string>();
  const re = /\[รหัส\s*:\s*([^\]]+)\]/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(answer))) {
    ids.add(String(m[1]).trim());
  }
  // Also match bare "รหัส 1" lightly
  const re2 = /รหัส\s*[:：]?\s*(\d{1,6})/gi;
  while ((m = re2.exec(answer))) {
    ids.add(String(m[1]).trim());
  }
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const products = [...ids]
    .map((id) => byId.get(id))
    .filter(Boolean)
    .slice(0, 5) as ReturnType<typeof compactProducts>;
  return products;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  const ip = clientIp(req);
  if (!rateLimit(ip)) {
    return json(
      {
        ok: false,
        error: 'rate_limited',
        message: 'ถามบ่อยเกินไป — รอประมาณ 1 นาทีแล้วลองใหม่ หรือใช้ช่องค้นหาสินค้า',
      },
      429,
    );
  }

  let payload: { message?: string } = {};
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: 'invalid_json', message: 'รูปแบบคำขอไม่ถูกต้อง' }, 400);
  }

  const message = sanitizeMessage(payload.message);
  if (message.length < 2) {
    return json({ ok: false, error: 'message_required', message: 'กรุณาพิมพ์คำถาม' }, 400);
  }

  let catalog: ReturnType<typeof compactProducts> = [];
  try {
    catalog = await fetchProducts();
  } catch (e) {
    return json(
      {
        ok: false,
        error: 'catalog_unavailable',
        message: 'โหลดสินค้าจากฐานข้อมูลไม่สำเร็จ — ลองใหม่หรือค้นหาในหน้าร้าน',
        detail: String((e as Error)?.message || e),
      },
      503,
    );
  }

  try {
    const { text, model } = await callGemini(buildPrompt(message, catalog));
    let products = extractIds(text, catalog);
    if (!products.length) {
      products = localMatch(message, catalog).products;
    }
    return json({
      ok: true,
      mode: 'gemini',
      model,
      answer: text,
      products,
    });
  } catch (e) {
    const code = String((e as Error & { code?: string })?.code || '');
    const fallback = localMatch(message, catalog);
    const userMsg =
      code === 'gemini_key_missing'
        ? 'ยังไม่ได้ตั้งค่า Gemini API Key — แสดงผลการค้นหาสินค้าในร้านแทน'
        : code === 'gemini_quota'
          ? 'โควตาฟรีของ Gemini เต็มชั่วคราว — แสดงผลการค้นหาสินค้าในร้านแทน'
          : 'ผู้ช่วย AI ใช้ไม่ได้ชั่วคราว — แสดงผลการค้นหาสินค้าในร้านแทน';

    return json({
      ok: true,
      mode: 'fallback',
      answer: `${userMsg}\n\n${fallback.answer}`,
      products: fallback.products,
      error: code || 'gemini_unavailable',
    });
  }
});
