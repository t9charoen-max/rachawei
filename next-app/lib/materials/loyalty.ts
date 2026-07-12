const STORAGE_KEY = 'rachawatsadu-loyalty';

export type LoyaltyData = {
  points: number;
  orders: number;
};

export function getLoyaltyTier(points: number) {
  if (points >= 500) return { name: 'ทอง', emoji: '🥇', color: 'text-amber-600' };
  if (points >= 200) return { name: 'เงิน', emoji: '🥈', color: 'text-gray-500' };
  return { name: 'ทองแดง', emoji: '🥉', color: 'text-orange-700' };
}

export function pointsForOrder(itemCount: number, totalBaht: number) {
  return Math.max(10, itemCount * 5 + Math.floor(totalBaht / 100));
}

export function loadLoyalty(): LoyaltyData {
  if (typeof window === 'undefined') return { points: 0, orders: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { points: 0, orders: 0 };
    return JSON.parse(raw) as LoyaltyData;
  } catch {
    return { points: 0, orders: 0 };
  }
}

export function saveLoyalty(data: LoyaltyData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function addLoyaltyPoints(itemCount: number, totalBaht: number): LoyaltyData {
  const current = loadLoyalty();
  const earned = pointsForOrder(itemCount, totalBaht);
  const next = {
    points: current.points + earned,
    orders: current.orders + 1,
  };
  saveLoyalty(next);
  return { ...next, earned } as LoyaltyData & { earned: number };
}
