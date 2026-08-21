import type { MaterialProduct, QuoteRequestPayload } from '@/types/material';
import { DEMO_MATERIALS } from '@/lib/materials/demo-data';

const QUOTES_KEY = 'rachawatsadu-admin-quotes';
const PRODUCTS_KEY = 'rachawatsadu-admin-products';
const AUTH_KEY = 'rachawatsadu-admin-auth';

export type AdminQuote = QuoteRequestPayload & {
  id: string;
  status: 'pending' | 'contacted' | 'quoted' | 'closed';
  total_estimate: number;
  created_at: string;
  source: 'line' | 'form' | 'project';
};

export type AdminProductOverride = Partial<
  Pick<MaterialProduct, 'price' | 'stock' | 'stock_status' | 'is_active' | 'name' | 'spec'>
>;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function isAdminAuthed() {
  return readJson<boolean>(AUTH_KEY, false) === true;
}

export function loginAdmin(password: string) {
  // Demo PIN — เปลี่ยนได้เมื่อเชื่อม auth จริง
  if (password.trim() === '1234' || password.trim() === 'admin') {
    writeJson(AUTH_KEY, true);
    return true;
  }
  return false;
}

export function logoutAdmin() {
  localStorage.removeItem(AUTH_KEY);
}

export function saveAdminQuote(
  payload: QuoteRequestPayload,
  source: AdminQuote['source'] = 'form',
): AdminQuote {
  const total = payload.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const quote: AdminQuote = {
    ...payload,
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    status: 'pending',
    total_estimate: total,
    created_at: new Date().toISOString(),
    source,
  };
  const list = readJson<AdminQuote[]>(QUOTES_KEY, []);
  writeJson(QUOTES_KEY, [quote, ...list].slice(0, 200));
  return quote;
}

export function loadAdminQuotes(): AdminQuote[] {
  return readJson<AdminQuote[]>(QUOTES_KEY, []);
}

export function updateQuoteStatus(id: string, status: AdminQuote['status']) {
  const list = loadAdminQuotes().map((q) => (q.id === id ? { ...q, status } : q));
  writeJson(QUOTES_KEY, list);
  return list;
}

export function loadProductOverrides(): Record<string, AdminProductOverride> {
  return readJson(PRODUCTS_KEY, {});
}

export function saveProductOverride(id: string, override: AdminProductOverride) {
  const all = loadProductOverrides();
  all[id] = { ...all[id], ...override };
  writeJson(PRODUCTS_KEY, all);
  return all;
}

export function getAdminProducts(base: MaterialProduct[] = DEMO_MATERIALS): MaterialProduct[] {
  const overrides = loadProductOverrides();
  return base.map((p) => ({ ...p, ...overrides[p.id] }));
}

export function getAdminStats(base: MaterialProduct[] = DEMO_MATERIALS) {
  const products = getAdminProducts(base);
  const quotes = loadAdminQuotes();
  const pending = quotes.filter((q) => q.status === 'pending').length;
  const revenue = quotes
    .filter((q) => q.status === 'quoted' || q.status === 'closed')
    .reduce((sum, q) => sum + q.total_estimate, 0);
  const ready = products.filter((p) => p.stock_status === 'พร้อมส่ง').length;
  const low = products.filter((p) => p.stock_status === 'เหลือน้อย' || p.stock < 50).length;

  return {
    products: products.length,
    active: products.filter((p) => p.is_active).length,
    quotes: quotes.length,
    pending,
    revenue,
    ready,
    low,
  };
}

export function seedDemoQuotesIfEmpty() {
  if (loadAdminQuotes().length) return;
  const demo: QuoteRequestPayload = {
    customer_name: 'คุณสมชาย',
    phone: '081-234-5678',
    address: 'หน้างานบ้านบุทม สุรินทร์',
    note: 'ต้องการส่งเช้าวันจันทร์',
    items: [
      {
        product_id: 'cement-tiger',
        product_name: 'ปูนซีเมนต์ ตราลูกโลก',
        quantity: 20,
        unit: 'ถุง',
        unit_price: 178,
      },
      {
        product_id: 'steel-db16',
        product_name: 'เหล็กเส้นกลม DB16',
        quantity: 10,
        unit: 'เส้น',
        unit_price: 285,
      },
    ],
  };
  saveAdminQuote(demo, 'form');
}
