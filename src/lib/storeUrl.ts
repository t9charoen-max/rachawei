/** Canonical shop — cart, checkout, catalog live at /store/ only */
export const STORE_URL = '/store/';

/**
 * Owner back-office entry (Supabase Auth + store_admins).
 * Not shown in customer tabbar — open via this URL or the discreet landing link.
 */
export const STORE_ADMIN_URL = '/store/#admin';

export function storeProductUrl(id: number | string) {
  return `${STORE_URL}#product/${id}`;
}

export function goToStore(hash = '') {
  window.location.href = `${STORE_URL}${hash}`;
}

export function goToStoreAdmin() {
  window.location.href = STORE_ADMIN_URL;
}
