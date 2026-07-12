'use client';

import { useState } from 'react';
import { isPublicSupabaseReady } from '@/lib/materials/env';
import { getLineDisplayId } from '@/lib/materials/line-quote';
import { submitQuoteRequest } from '@/lib/materials/submit-quote';
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
  const [sending, setSending] = useState(false);
  const lineDirect = !isPublicSupabaseReady();

  if (!open || !product) return null;

  const customer = {
    name: form.name.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
    note: form.note.trim(),
  };

  const validate = () => {
    if (!customer.name || !customer.phone) {
      alert('กรุณากรอกชื่อและเบอร์โทร');
      return false;
    }
    return true;
  };

  const sendToLine = async () => {
    if (!validate()) return;
    setSending(true);
    try {
      await submitQuoteRequest({
        customer_name: customer.name,
        phone: customer.phone,
        address: customer.address || undefined,
        note: customer.note || undefined,
        items: [
          {
            product_id: product.id,
            product_name: product.name,
            quantity: form.quantity,
            unit: product.unit,
            unit_price: product.price,
            note: form.note || undefined,
          },
        ],
      });
      onClose();
    } finally {
      setSending(false);
    }
  };

  const addToList = () => {
    if (!validate()) return;
    onSubmit({
      product,
      quantity: form.quantity,
      note: form.note,
      customer,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-brand-gradient px-6 py-5 text-white">
          <h3 className="text-xl font-bold">📋 ขอใบเสนอราคา</h3>
          <p className="mt-1 font-medium text-orange-100">{product.name}</p>
          <p className="mt-2 text-2xl font-extrabold">
            ฿{product.price.toLocaleString('th-TH')}
            <span className="text-base font-normal text-orange-100"> / {product.unit}</span>
          </p>
        </div>

        <div className="p-6">
          {lineDirect ? (
            <p className="mb-4 rounded-xl bg-[#06c755]/10 px-4 py-3 text-sm text-[#06c755]">
              💡 ต้องการสั่งเร็ว? ปิดหน้านี้แล้วกด &quot;สั่งเลย&quot; ได้เลย
            </p>
          ) : null}

          <div className="space-y-3">
            <input
              type="text"
              placeholder="ชื่อ-นามสกุล *"
              className="w-full rounded-xl border-2 border-orange-100 px-4 py-3 transition focus:border-[var(--brand-primary)] focus:outline-none"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              type="tel"
              placeholder="เบอร์โทรศัพท์ *"
              className="w-full rounded-xl border-2 border-orange-100 px-4 py-3 transition focus:border-[var(--brand-primary)] focus:outline-none"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <div className="flex gap-3">
              <input
                type="number"
                min={1}
                placeholder="จำนวน"
                className="flex-1 rounded-xl border-2 border-orange-100 px-4 py-3 focus:border-[var(--brand-primary)] focus:outline-none"
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })
                }
              />
              <div className="flex items-center rounded-xl border-2 border-orange-100 bg-orange-50 px-4 font-medium text-gray-600">
                {product.unit}
              </div>
            </div>
            <input
              type="text"
              placeholder="ที่อยู่หน้างาน"
              className="w-full rounded-xl border-2 border-orange-100 px-4 py-3 focus:border-[var(--brand-primary)] focus:outline-none"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <textarea
              placeholder="หมายเหตุเพิ่มเติม"
              className="h-20 w-full rounded-xl border-2 border-orange-100 px-4 py-3 focus:border-[var(--brand-primary)] focus:outline-none"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {lineDirect ? (
              <>
                <button
                  type="button"
                  onClick={sendToLine}
                  disabled={sending}
                  className="btn-shine rounded-2xl bg-[#06c755] py-3.5 font-bold text-white disabled:opacity-60"
                >
                  {sending ? 'กำลังเปิด Line...' : `💬 ส่งไป Line ${getLineDisplayId()}`}
                </button>
                <button
                  type="button"
                  onClick={addToList}
                  className="rounded-2xl border-2 border-orange-200 py-3 text-sm font-semibold text-[var(--brand-primary)] transition hover:bg-orange-50"
                >
                  + เพิ่มรายการอื่นก่อนส่ง
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={addToList}
                className="rounded-2xl bg-brand-gradient py-3.5 font-bold text-white"
              >
                เพิ่มลงรายการ
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl py-3 text-sm text-gray-500 transition hover:text-gray-700"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
