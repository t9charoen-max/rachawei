/** Canonical shop — cart, checkout, admin live at /store/ only */
export const STORE_URL = '/store/';

export function storeProductUrl(id: number | string) {
  return `${STORE_URL}#product/${id}`;
}

export function goToStore(hash = '') {
  window.location.href = `${STORE_URL}${hash}`;
}
