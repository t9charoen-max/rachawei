'use client';

import { useEffect, useState } from 'react';
import { getLoyaltyTier, loadLoyalty } from '@/lib/materials/loyalty';

export function LoyaltyBadge() {
  const [points, setPoints] = useState(0);

  useEffect(() => {
    setPoints(loadLoyalty().points);
    const onUpdate = () => setPoints(loadLoyalty().points);
    window.addEventListener('loyalty-update', onUpdate);
    return () => window.removeEventListener('loyalty-update', onUpdate);
  }, []);

  const tier = getLoyaltyTier(points);

  return (
    <div
      className="glass-panel flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-amber-100"
      title="สะสมแต้มทุกครั้งที่สั่งซื้อ"
    >
      <span className="animate-pulse-glow">{tier.emoji}</span>
      <span className="hidden sm:inline">{tier.name}</span>
      <span>{points.toLocaleString('th-TH')} แต้ม</span>
    </div>
  );
}

export function notifyLoyaltyUpdate() {
  window.dispatchEvent(new Event('loyalty-update'));
}
