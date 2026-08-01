/** คีย์ร่วม — หลังร้านจำเครื่องที่ปลดล็อกแล้ว (ไม่โชว์ให้ลูกค้า) */
export const ADMIN_UNLOCK_KEY = 'rachawei-admin-unlocked';

export function isAdminUnlocked(): boolean {
  try {
    return localStorage.getItem(ADMIN_UNLOCK_KEY) === '1';
  } catch {
    return false;
  }
}

export function setAdminUnlocked(value: boolean) {
  try {
    if (value) localStorage.setItem(ADMIN_UNLOCK_KEY, '1');
    else localStorage.removeItem(ADMIN_UNLOCK_KEY);
  } catch {
    // private mode — ใช้แค่ในหน่วยความจำผ่าน state ของแอป
  }
}

/** เปิดด้วยลิงก์ลับ หรือเครื่องที่เคยใส่รหัสแล้ว */
export function wantsAdminUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('admin') === '1' || window.location.hash === '#admin';
}

export function shouldOpenAdminGate(): boolean {
  return wantsAdminUrl() || isAdminUnlocked();
}

export function adminInviteUrl(): string {
  if (typeof window === 'undefined') return 'https://rachawei.vercel.app/?admin=1';
  const url = new URL(window.location.href);
  url.searchParams.set('admin', '1');
  url.hash = '';
  return url.toString();
}
