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

  useEffect(() => {
    const list = getAdminProducts(DEMO_MATERIALS);
    setProducts(list);
    setDrafts(draftsFrom(list));
  }, []);

  const count = useMemo(() => products.length, [products]);

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">สินค้า</h1>
        <p className="mt-1 text-sm text-blue-200/70">
          แก้ไขราคาและสต็อก (บันทึกในเครื่อง — localStorage)
        </p>
      </div>

      <div className="glass-panel overflow-hidden rounded-xl">
        <div className="border-b border-blue-400/20 px-4 py-3 sm:px-5">
          <p className="text-sm text-blue-100/80">ทั้งหมด {count} รายการ</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-blue-400/15 text-blue-200/70">
                <th className="px-4 py-3 font-medium sm:px-5">ชื่อสินค้า</th>
                <th className="px-3 py-3 font-medium">หมวด</th>
                <th className="px-3 py-3 font-medium">ราคา</th>
                <th className="px-3 py-3 font-medium">สต็อก</th>
                <th className="px-3 py-3 font-medium">สถานะสต็อก</th>
                <th className="px-4 py-3 font-medium sm:px-5">บันทึก</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const draft = drafts[product.id] ?? toDraft(product);
                return (
                  <tr key={product.id} className="border-b border-blue-400/10 last:border-0">
                    <td className="px-4 py-3 sm:px-5">
                      <p className="font-medium text-white">{product.name}</p>
                      <p className="text-xs text-blue-200/55">{product.spec}</p>
                    </td>
                    <td className="px-3 py-3 text-blue-100/80">{product.category}</td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={draft.price}
                        onChange={(e) => updateDraft(product.id, { price: e.target.value })}
                        className="w-24 rounded-md border border-blue-400/25 bg-[#0a1628]/80 px-2 py-1.5 text-white outline-none focus:ring-2 focus:ring-cyan-400/40"
                      />
                      <span className="ml-1 text-xs text-blue-200/50">/{product.unit}</span>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={draft.stock}
                        onChange={(e) => updateDraft(product.id, { stock: e.target.value })}
                        className="w-24 rounded-md border border-blue-400/25 bg-[#0a1628]/80 px-2 py-1.5 text-white outline-none focus:ring-2 focus:ring-cyan-400/40"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={draft.stock_status}
                        onChange={(e) =>
                          updateDraft(product.id, {
                            stock_status: e.target.value as StockStatus,
                          })
                        }
                        className="rounded-md border border-blue-400/25 bg-[#0a1628]/80 px-2 py-1.5 text-white outline-none focus:ring-2 focus:ring-cyan-400/40"
                      >
                        <option value="พร้อมส่ง">พร้อมส่ง</option>
                        <option value="เหลือน้อย">เหลือน้อย</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 sm:px-5">
                      <button
                        type="button"
                        onClick={() => handleSave(product.id)}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
                      >
                        {savedId === product.id ? 'บันทึกแล้ว' : 'บันทึก'}
                      </button>
                      <p className="mt-1 text-[10px] text-blue-200/45">
                        ปัจจุบัน {formatPrice(product.price)}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
