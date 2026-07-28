import { useEffect, useState } from 'react';

const DISMISS_KEY = 'rachawei-install-dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallAppBanner() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      // ใช้ได้ต่อแม้อ่าน storage ไม่ได้
    }
    setDismissed(false);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    if (isIos()) setShowIosHint(true);

    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ปิดเฉพาะครั้งนี้
    }
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted') dismiss();
  };

  if (dismissed || (!installEvent && !showIosHint)) return null;

  return (
    <div className="install-banner" role="region" aria-label="ติดตั้งแอป">
      <span className="install-banner__icon" aria-hidden>
        <img src="/icons/icon-192.png" alt="" width={38} height={38} />
      </span>
      <div className="install-banner__text">
        <p className="install-banner__title">ติดตั้งแอปราชาหวาย</p>
        {installEvent ? (
          <p className="install-banner__desc">เปิดเร็ว สั่งซื้อง่าย เหมือนแอปทั่วไป</p>
        ) : (
          <p className="install-banner__desc">
            กดปุ่มแชร์ <span aria-hidden>⎋</span> แล้วเลือก “เพิ่มลงหน้าจอโฮม”
          </p>
        )}
      </div>
      {installEvent && (
        <button type="button" className="install-banner__install" onClick={install}>
          ติดตั้ง
        </button>
      )}
      <button type="button" className="install-banner__close" onClick={dismiss} aria-label="ปิด">
        ✕
      </button>
    </div>
  );
}
