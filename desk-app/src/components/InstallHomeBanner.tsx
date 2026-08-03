import { useEffect, useState } from 'react'

const SESSION_DISMISS_KEY = 'rws-desk-install-dismissed-session'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  )
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

/** แบนเนอร์ชวนเพิ่มลงหน้าจอโฮม — ปิดได้แค่รอบนี้ จะกลับมาใหม่จนกว่าจะติดตั้ง */
export function InstallHomeBanner() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIosHint, setShowIosHint] = useState(false)
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    if (isStandalone()) return
    try {
      if (sessionStorage.getItem(SESSION_DISMISS_KEY)) return
    } catch {
      // ignore
    }
    setHidden(false)

    const onPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    if (isIos()) setShowIosHint(true)

    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const dismissSession = () => {
    setHidden(true)
    try {
      sessionStorage.setItem(SESSION_DISMISS_KEY, '1')
    } catch {
      // ignore
    }
  }

  const install = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    const choice = await installEvent.userChoice
    if (choice.outcome === 'accepted') setHidden(true)
  }

  if (hidden || (!installEvent && !showIosHint)) return null

  return (
    <div className="install-home fade-up" role="region" aria-label="เพิ่มลงหน้าจอโฮม">
      <div className="install-home__icon" aria-hidden>
        <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" width={40} height={40} />
      </div>
      <div className="install-home__copy">
        <p className="install-home__title">เพิ่มลงหน้าจอโฮม</p>
        <p className="install-home__desc">
          {installEvent
            ? 'เปิดได้ถาวรเหมือนแอป — ไม่หายเมื่อปิดเบราว์เซอร์'
            : 'กดแชร์ แล้วเลือก “เพิ่มไปยังหน้าจอโฮม”'}
        </p>
      </div>
      <div className="install-home__actions">
        {installEvent && (
          <button type="button" className="install-home__cta pressable" onClick={install}>
            ติดตั้ง
          </button>
        )}
        <button type="button" className="install-home__later pressable" onClick={dismissSession}>
          ทีหลัง
        </button>
      </div>
    </div>
  )
}
