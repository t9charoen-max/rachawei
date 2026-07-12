'use client';

import { useState } from 'react';
import type { MaterialProduct } from '@/types/material';

type QuoteModalProps = {
  product: MaterialProduct | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (item: {
    product: MaterialProduct;
    quantity: number;
    note?: string;
    customer: { name: string; phone: string; address?: string; note?: string };
  }) => void;
};

export function QuoteModal({ product, open, onClose, onSubmit }: QuoteModalProps) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    quantity: 1,
    address: '',
    note: '',
  });

  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
        <h3 className="text-xl font-semibold">ขอใบเสนอราคา</h3>
        <p className="mt-1 font-medium text-[var(--brand-primary)]">{product.name}</p>

        <div className="mt-4 space-y-3">
          <input
            type="text"
            placeholder="ชื่อ-นามสกุล *"
            className="w-full rounded-xl border border-orange-100 px-4 py-3"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="tel"
            placeholder="เบอร์โทรศัพท์ *"
            className="w-full rounded-xl border border-orange-100 px-4 py-3"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <div className="flex gap-3">
            <input
              type="number"
              min={1}
              placeholder="จำนวน"
              className="flex-1 rounded-xl border border-orange-100 px-4 py-3"
              value={form.quantity}
              onChange={(e) =>
                setForm({ ...form, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })
              }
            />
            <div className="flex items-center rounded-xl border border-orange-100 px-4 text-gray-500">
              {product.unit}
            </div>
          </div>
          <input
            type="text"
            placeholder="ที่อยู่หน้างาน"
            className="w-full rounded-xl border border-orange-100 px-4 py-3"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <textarea
            placeholder="หมายเหตุเพิ่มเติม"
            className="h-20 w-full rounded-xl border border-orange-100 px-4 py-3"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border py-3">
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => {
              if (!form.name.trim() || !form.phone.trim()) {
                alert('กรุณากรอกชื่อและเบอร์โทร');
                return;
              }
              onSubmit({
                product,
                quantity: form.quantity,
                note: form.note,
                customer: {
                  name: form.name,
                  phone: form.phone,
                  address: form.address,
                  note: form.note,
                },
              });
            }}
            className="flex-1 rounded-xl bg-[var(--brand-primary)] py-3 font-medium text-white"
          >
            เพิ่มลงรายการ
          </button>
        </div>
      </div>
    </div>
  );
}
