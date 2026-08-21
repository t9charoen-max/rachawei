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
import { saveAdminQuote } from '@/lib/materials/admin-store';
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
    const stamp = new Date().toLocaleString('th-TH', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
    const name = `โปรเจกต์ ${stamp}`;
    createProject(name, quoteItems);
    setSaved(loadProjects());
  };

  const sendProject = async (
    project: MaterialProject | (typeof PROJECT_TEMPLATES)[number],
    key: string,
  ) => {
    const items = resolveProjectItems(project, products);
    if (!items.length) return;

    setSending(key);
    try {
      const payload = {
        customer_name: '(รอติดต่อกลับ)',
        phone: '-',
        note: `โปรเจกต์: ${project.name} — ส่งถึงหน้างาน`,
        items: items.map(({ product, quantity }) => ({
          product_id: product.id,
          product_name: product.name,
          quantity,
          unit: product.unit,
          unit_price: product.price,
        })),
      };
      try {
        saveAdminQuote(payload, 'project');
      } catch {
        /* admin store optional */
      }
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
    <section className="relative py-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-amber-50 sm:text-2xl">📁 รายการวัสดุตามโปรเจกต์</h2>
          <p className="mt-1 text-sm text-slate-400">
            เลือกชุดวัสดุสำเร็จรูป หรือสร้างโปรเจกต์ของคุณ — ส่งขอราคาคลิกเดียว
          </p>
        </div>
        {quoteItems.length > 0 && (
          <button
            type="button"
            onClick={handleSaveCurrent}
            className="glass-panel rounded-xl px-4 py-2 text-sm font-semibold text-amber-200 transition hover:border-amber-400/50"
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
              className="card-lift glass-panel overflow-hidden rounded-2xl"
            >
              <div className="relative overflow-hidden bg-gradient-to-r from-amber-700/25 to-yellow-600/15 p-4">
                <div className="light-orb -right-8 -top-8 h-24 w-24 bg-amber-400/20" />
                <div className="relative flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-amber-50">{project.name}</h3>
                    {'description' in project && project.description && (
                      <p className="mt-0.5 text-xs text-slate-400">{project.description}</p>
                    )}
                  </div>
                  {'isTemplate' in project && project.isTemplate && (
                    <span className="shrink-0 rounded-full bg-brand-gradient px-2 py-0.5 text-[10px] font-bold text-white">
                      แม่แบบ
                    </span>
                  )}
                </div>
                <p className="relative mt-2 text-lg font-extrabold text-amber-200">
                  ฿{total.toLocaleString('th-TH')}
                  <span className="text-xs font-normal text-slate-500"> ประมาณ</span>
                </p>
                <p className="relative text-xs text-slate-500">{items.length} รายการวัสดุ</p>
              </div>

              <div className="p-4">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : key)}
                  className="mb-3 text-sm font-medium text-amber-200"
                >
                  {isOpen ? 'ซ่อนรายการ ▲' : 'ดูรายการ ▼'}
                </button>

                {isOpen && (
                  <ul className="mb-3 space-y-1.5 text-sm text-slate-400">
                    {items.map(({ product, quantity }) => (
                      <li key={product.id} className="flex justify-between gap-2">
                        <span className="truncate">{product.name}</span>
                        <span className="shrink-0 font-medium text-slate-300">
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
                    className="rounded-xl border border-amber-500/30 py-2.5 text-sm font-medium text-amber-200 transition hover:bg-amber-500/10"
                  >
                    เพิ่มลงรายการ
                  </button>
                  <button
                    type="button"
                    onClick={() => sendProject(project, key)}
                    disabled={sending === key}
                    className="btn-shine rounded-xl bg-[#06c755] py-2.5 text-sm font-bold text-white transition hover:bg-[#05b34c] disabled:opacity-60"
                  >
                    {sending === key ? 'กำลังเปิด Line...' : '💬 สั่งเลย'}
                  </button>
                </div>

                {!('isTemplate' in project && project.isTemplate) && 'id' in project && (
                  <button
                    type="button"
                    onClick={() => {
                      deleteProject(project.id);
                      setSaved(loadProjects());
                    }}
                    className="mt-2 w-full text-xs text-slate-500 hover:text-rose-400"
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
