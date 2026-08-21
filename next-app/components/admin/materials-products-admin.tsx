'use client';

import { useEffect, useMemo, useState } from 'react';
import { getAdminProducts, saveProductOverride } from '@/lib/materials/admin-store';
import { DEMO_MATERIALS } from '@/lib/materials/demo-data';
import { formatPrice } from '@/lib/format';
import type { MaterialProduct, StockStatus } from '@/types/material';

type Draft = {
  price: string;
  stock: string;
  stock_status: StockStatus;
};

function toDraft(p: MaterialProduct): Draft {
  return {
    price: String(p.price),
    stock: String(p.stock),
    stock_status: p.stock_status,
  };
}

function draftsFrom(list: MaterialProduct[]) {
  const map: Record<string, Draft> = {};
  for (const p of list) map[p.id] = toDraft(p);
  return map;
}

export function MaterialsProductsAdmin() {
  const [products, setProducts] = useState<MaterialProduct[]>(DEMO_MATERIALS);
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => draftsFrom(DEMO_MATERIALS));
  const [savedId, setSavedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const list = getAdminProducts(DEMO_MATERIALS);
    setProducts(list);
    setDrafts(draftsFrom(list));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.spec.toLowerCase().includes(q),
    );
  }, [products, query]);

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function handleSave(id: string) {
    const d = drafts[id];
    if (!d) return;
    const price = Number(d.price);
    const stock = Number(d.stock);
    if (!Number.isFinite(price) || price < 0 || !Number.isFinite(stock) || stock < 0) return;

    saveProductOverride(id, {
      price,
      stock,
      stock_status: d.stock_status,
    });
    const next = getAdminProducts(DEMO_MATERIALS);
    setProducts(next);
    const updated = next.find((p) => p.id === id);
    if (updated) {
      setDrafts((prev) => ({ ...prev, [id]: toDraft(updated) }));
    }
    setSavedId(id);
    window.setTimeout(() => setSavedId((cur) => (cur === id ? null : cur)), 1500);
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      <div>
        <p className="text-xs font-medium tracking-wide text-amber-300/80 uppercase">วัสดุก่อสร้าง</p>
        <h1 className="font-display mt-1 text-2xl font-semibold gold-text">สินค้า</h1>
        <p className="mt-1 text-sm text-amber-100/65">
          แก้ราคาและสต็อก — บันทึกแล้วขึ้นหน้าร้านทันที
        </p>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ค้นหา เช่น ปูน, เหล็ก, ท่อ..."
        className="glass-panel w-full rounded-2xl px-4 py-3 text-amber-50 placeholder:text-amber-100/35 outline-none focus:ring-2 focus:ring-amber-400/40"
      />

      <p className="text-sm text-amber-100/55">{filtered.length} รายการ</p>

      <ul className="space-y-3">
        {filtered.map((product) => {
          const draft = drafts[product.id] ?? toDraft(product);
          return (
            <li key={product.id} className="glass-panel rounded-2xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-amber-50">{product.name}</p>
                  <p className="text-xs text-amber-100/55">
                    {product.category} · {product.spec}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                    draft.stock_status === 'พร้อมส่ง'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-200'
                  }`}
                >
                  {draft.stock_status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <label className="block text-xs text-amber-100/55">
                  ราคา (บาท/{product.unit})
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={draft.price}
                    onChange={(e) => updateDraft(product.id, { price: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-amber-400/30 bg-[#0a1628]/80 px-3 py-2.5 text-base text-amber-50 outline-none focus:ring-2 focus:ring-amber-400/40"
                  />
                </label>
                <label className="block text-xs text-amber-100/55">
                  สต็อก
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={draft.stock}
                    onChange={(e) => updateDraft(product.id, { stock: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-amber-400/30 bg-[#0a1628]/80 px-3 py-2.5 text-base text-amber-50 outline-none focus:ring-2 focus:ring-amber-400/40"
                  />
                </label>
                <label className="col-span-2 block text-xs text-amber-100/55 sm:col-span-1">
                  สถานะ
                  <select
                    value={draft.stock_status}
                    onChange={(e) =>
                      updateDraft(product.id, { stock_status: e.target.value as StockStatus })
                    }
                    className="mt-1 w-full rounded-xl border border-amber-400/30 bg-[#0a1628]/80 px-3 py-2.5 text-base text-amber-50 outline-none focus:ring-2 focus:ring-amber-400/40"
                  >
                    <option value="พร้อมส่ง">พร้อมส่ง</option>
                    <option value="เหลือน้อย">เหลือน้อย</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs text-amber-100/45">ตอนนี้ {formatPrice(product.price)}</p>
                <button
                  type="button"
                  onClick={() => handleSave(product.id)}
                  className="btn-shine rounded-xl bg-gold-gradient px-5 py-2.5 text-sm font-bold text-[#0a1628]"
                >
                  {savedId === product.id ? '✓ บันทึกแล้ว' : 'บันทึก'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
