import type { CartItem } from '@/types/checkout';

export const CART_STORAGE_KEY = 'rachawei-cart';

export function readCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item) =>
        typeof item.productId === 'string' &&
        typeof item.quantity === 'number' &&
        item.quantity > 0,
    );
  } catch {
    return [];
  }
}

export function writeCartToStorage(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function cartToQueryString(items: CartItem[]) {
  if (items.length === 0) return '';
  return items.map((item) => `${item.productId}:${item.quantity}`).join(',');
}

export function addToCart(items: CartItem[], productId: string, quantity = 1): CartItem[] {
  const existing = items.find((item) => item.productId === productId);

  if (!existing) {
    return [...items, { productId, quantity }];
  }

  return items.map((item) =>
    item.productId === productId
      ? { ...item, quantity: item.quantity + quantity }
      : item,
  );
}

export function updateCartQuantity(
  items: CartItem[],
  productId: string,
  quantity: number,
): CartItem[] {
  if (quantity <= 0) {
    return items.filter((item) => item.productId !== productId);
  }

  return items.map((item) =>
    item.productId === productId ? { ...item, quantity } : item,
  );
}
