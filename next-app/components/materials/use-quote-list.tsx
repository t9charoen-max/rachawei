'use client';

import { useCallback, useState } from 'react';
import type { MaterialProduct, QuoteItemInput, QuoteRequestPayload } from '@/types/material';

export type PendingQuoteItem = QuoteItemInput & {
  product: MaterialProduct;
};

const STORAGE_KEY = 'rajawasu-quote-list';

export function useQuoteList() {
  const [quoteList, setQuoteList] = useState<PendingQuoteItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '', note: '' });

  const addItem = useCallback(
    (item: {
      product: MaterialProduct;
      quantity: number;
      note?: string;
      customer?: { name: string; phone: string; address?: string; note?: string };
    }) => {
      if (item.customer) {
        setCustomer({
          name: item.customer.name,
          phone: item.customer.phone,
          address: item.customer.address ?? '',
          note: item.customer.note ?? '',
        });
      }

      setQuoteList((prev) => [
        ...prev,
        {
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit: item.product.unit,
          unit_price: item.product.price,
          note: item.note,
          product: item.product,
        },
      ]);
    },
    [],
  );

  const submitAll = useCallback(
    async (overrideCustomer?: typeof customer) => {
      const info = overrideCustomer ?? customer;
      if (!info.name.trim() || !info.phone.trim()) {
        const name = window.prompt('ชื่อ-นามสกุล');
        const phone = window.prompt('เบอร์โทรศัพท์');
        if (!name?.trim() || !phone?.trim()) return;
        info.name = name;
        info.phone = phone;
        setCustomer((c) => ({ ...c, name, phone }));
      }

      if (!quoteList.length) return;

      setIsSubmitting(true);

      const payload: QuoteRequestPayload = {
        customer_name: info.name.trim(),
        phone: info.phone.trim(),
        address: info.address?.trim(),
        note: info.note?.trim(),
        items: quoteList.map(({ product: _p, ...item }) => item),
      };

      try {
        const response = await fetch('/api/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = (await response.json()) as { message?: string; ok?: boolean };
        alert(data.message ?? (data.ok ? 'ส่งคำขอราคาเรียบร้อย' : 'ส่งไม่สำเร็จ'));
        if (data.ok) {
          setQuoteList([]);
          sessionStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        alert('ส่งคำขอราคาไม่สำเร็จ กรุณาลองใหม่');
      } finally {
        setIsSubmitting(false);
      }
    },
    [customer, quoteList],
  );

  return {
    quoteList,
    addItem,
    submitAll,
    count: quoteList.length,
    isSubmitting,
    customer,
    setCustomer,
  };
}
