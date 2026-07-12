'use client';

import { useCallback, useState } from 'react';
import { submitQuoteRequest } from '@/lib/materials/submit-quote';
import { addLoyaltyPoints } from '@/lib/materials/loyalty';
import { notifyLoyaltyUpdate } from '@/components/materials/loyalty-badge';
import type { MaterialProduct, QuoteItemInput, QuoteRequestPayload } from '@/types/material';

export type PendingQuoteItem = QuoteItemInput & {
  product: MaterialProduct;
};

const STORAGE_KEY = 'rachawatsadu-quote-list';

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
        const result = await submitQuoteRequest(payload);
        if (!result.lineOpened) {
          alert(result.message);
        }
        if (result.ok) {
          const total = quoteList.reduce(
            (sum, item) => sum + item.quantity * item.unit_price,
            0,
          );
          addLoyaltyPoints(quoteList.length, total);
          notifyLoyaltyUpdate();
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

  const loadItems = useCallback(
    (items: { product: MaterialProduct; quantity: number }[]) => {
      setQuoteList(
        items.map(({ product, quantity }) => ({
          product_id: product.id,
          product_name: product.name,
          quantity,
          unit: product.unit,
          unit_price: product.price,
          product,
        })),
      );
    },
    [],
  );

  const addMany = useCallback(
    (items: { product: MaterialProduct; quantity: number }[]) => {
      setQuoteList((prev) => [
        ...prev,
        ...items.map(({ product, quantity }) => ({
          product_id: product.id,
          product_name: product.name,
          quantity,
          unit: product.unit,
          unit_price: product.price,
          product,
        })),
      ]);
    },
    [],
  );

  return {
    quoteList,
    addItem,
    addMany,
    loadItems,
    submitAll,
    count: quoteList.length,
    isSubmitting,
    customer,
    setCustomer,
  };
}
