'use client';

import { useEffect, useState } from 'react';
import type { MaterialProduct } from '@/types/material';
import {
  PROJECT_TEMPLATES,
  createProject,
  deleteProject,
  loadProjects,
  projectTotal,
  resolveProjectItems,
  type MaterialProject,
} from '@/lib/materials/projects';
import { openLineWithQuote } from '@/lib/materials/line-quote';
import { addLoyaltyPoints } from '@/lib/materials/loyalty';
import { notifyLoyaltyUpdate } from '@/components/materials/loyalty-badge';

type Props = {
  products: MaterialProduct[];
  quoteItems: { product_id: string; quantity: number }[];
  onAddItems: (items: { product: MaterialProduct; quantity: number }[]) => void;
};

export function ProjectLists({ products, quoteItems, onAddItems }: Props) {
  const [saved, setSaved] = useState<MaterialProject[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    setSaved(loadProjects());
  }, []);

  const handleSaveCurrent = () => {
    if (!quoteItems.length) return;
    const name = window.prompt('ชื่อโปรเจกต์ เช่น บ้านลุงสมชาย');
    if (!name?.trim()) return;
    createProject(name.trim(), quoteItems);
    setSaved(loadProjects());
    alert(`บันทึกโปรเจกต์ "${name}" แล้ว (${quoteItems.length} รายการ)`);
  };

  const sendProject = async (
    project: MaterialProject | (typeof PROJECT_TEMPLATES)[number],
    key: string,
  ) => {
    const items = resolveProjectItems(project, products);
    if (!items.length) return;

    const name = window.prompt('ชื่อผู้ติดต่อ');
    const phone = window.prompt('เบอร์โทร');
    if (!name?.trim() || !phone?.trim()) return;

    setSending(key);
    try {
      const payload = {
        customer_name: name.trim(),
        phone: phone.trim(),
        note: `โปรเจกต์: ${project.name}`,
        items: items.map(({ product, quantity }) => ({
          product_id: product.id,
          product_name: product.name,
          quantity,
          unit: product.unit,
          unit_price: product.price,
        })),
      };
      await openLineWithQuote(payload);
      const total = projectTotal(project, products);
      addLoyaltyPoints(items.length, total);
      notifyLoyaltyUpdate();
    } finally {
      setSending(null);
    }
  };

  const templates = PROJECT_TEMPLATES.map((t, i) => ({ ...t, key: `tpl-${i}` }));
  const allProjects = [
    ...templates.map((t) => ({ ...t, isTemplate: true as const })),
    ...saved.map((p) => ({ ...p, isTemplate: false as const })),
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">📁 รายการวัสดุตามโปรเจกต์</h2>
          <p className="mt-1 text-sm text-gray-500">
            เลือกชุดวัสดุสำเร็จรูป หรือสร้างโปรเจกต์ของคุณ — ส่งขอราคาคลิกเดียว
          </p>
        </div>
        {quoteItems.length > 0 && (
          <button
            type="button"
            onClick={handleSaveCurrent}
            className="rounded-xl border-2 border-orange-200 px-4 py-2 text-sm font-semibold text-[var(--brand-primary)] hover:bg-orange-50"
          >
            + บันทึกโปรเจกต์ ({quoteItems.length} รายการ)
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allProjects.map((project) => {
          const key = 'id' in project ? project.id : project.key;
          const items = resolveProjectItems(project, products);
          const total = projectTotal(project, products);
          const isOpen = expanded === key;

          return (
            <article
              key={key}
              className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-[var(--shadow-card)]"
            >
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-gray-900">{project.name}</h3>
                    {'description' in project && project.description && (
                      <p className="mt-0.5 text-xs text-gray-500">{project.description}</p>
                    )}
                  </div>
                  {'isTemplate' in project && project.isTemplate && (
                    <span className="shrink-0 rounded-full bg-[var(--brand-primary)] px-2 py-0.5 text-[10px] font-bold text-white">
                      แม่แบบ
                    </span>
                  )}
                </div>
                <p className="mt-2 text-lg font-extrabold text-[var(--brand-primary)]">
                  ฿{total.toLocaleString('th-TH')}
                  <span className="text-xs font-normal text-gray-500"> ประมาณ</span>
                </p>
                <p className="text-xs text-gray-500">{items.length} รายการวัสดุ</p>
              </div>

              <div className="p-4">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : key)}
                  className="mb-3 text-sm font-medium text-[var(--brand-primary)]"
                >
                  {isOpen ? 'ซ่อนรายการ ▲' : 'ดูรายการ ▼'}
                </button>

                {isOpen && (
                  <ul className="mb-3 space-y-1.5 text-sm text-gray-600">
                    {items.map(({ product, quantity }) => (
                      <li key={product.id} className="flex justify-between gap-2">
                        <span className="truncate">{product.name}</span>
                        <span className="shrink-0 font-medium">
                          {quantity} {product.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onAddItems(items)}
                    className="rounded-xl border border-orange-200 py-2.5 text-sm font-medium text-[var(--brand-primary)] hover:bg-orange-50"
                  >
                    เพิ่มลงรายการ
                  </button>
                  <button
                    type="button"
                    onClick={() => sendProject(project, key)}
                    disabled={sending === key}
                    className="rounded-xl bg-[#06c755] py-2.5 text-sm font-bold text-white hover:bg-[#05b34c] disabled:opacity-60"
                  >
                    {sending === key ? '...' : '💬 ขอราคา'}
                  </button>
                </div>

                {!('isTemplate' in project && project.isTemplate) && 'id' in project && (
                  <button
                    type="button"
                    onClick={() => {
                      deleteProject(project.id);
                      setSaved(loadProjects());
                    }}
                    className="mt-2 w-full text-xs text-gray-400 hover:text-red-500"
                  >
                    ลบโปรเจกต์
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
