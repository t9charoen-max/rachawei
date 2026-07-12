'use client';

import { useEffect, useState } from 'react';
import { createPromptPayQr } from '@/lib/promptpay';
import { formatPrice } from '@/lib/format';

type PromptPayQrProps = {
  amount: number;
};

export function PromptPayQr({ amount }: PromptPayQrProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createPromptPayQr({ amount })
      .then((result) => setDataUrl(result.dataUrl))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'สร้าง QR ไม่สำเร็จ';
        setError(message);
      });
  }, [amount]);

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (!dataUrl) {
    return <p className="text-sm text-muted-foreground">กำลังสร้าง QR PromptPay...</p>;
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border bg-background p-4">
      <p className="text-sm font-medium">สแกนจ่ายผ่าน PromptPay</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt={`PromptPay ${formatPrice(amount)}`} className="size-48" />
      <p className="text-lg font-semibold text-primary">{formatPrice(amount)}</p>
    </div>
  );
}
