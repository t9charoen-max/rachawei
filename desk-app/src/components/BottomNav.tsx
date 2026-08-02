import {
  BriefcaseBusiness,
  Calculator,
  LineChart,
  ScrollText,
  Split,
} from 'lucide-react'
import type { TabId } from '../App'

const ITEMS: { id: TabId; label: string; icon: typeof BriefcaseBusiness }[] = [
  { id: 'plan', label: 'แผน', icon: BriefcaseBusiness },
  { id: 'capital', label: 'ทุน', icon: Calculator },
  { id: 'cashflow', label: 'กระแสเงิน', icon: LineChart },
  { id: 'scenario', label: 'สถานการณ์', icon: Split },
  { id: 'rules', label: 'กฎ', icon: ScrollText },
]

export function BottomNav({
  active,
  onChange,
}: {
  active: TabId
  onChange: (id: TabId) => void
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <nav className="nav-dock pointer-events-auto mx-auto grid max-w-md grid-cols-5 gap-1 rounded-[1.35rem] p-1.5 sm:max-w-lg">
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`pressable flex flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-[10.5px] font-semibold leading-none ${
                isActive ? 'nav-item-active' : 'text-muted hover:bg-white/5 hover:text-ink'
              }`}
            >
              <span
                className={`grid size-7 place-items-center rounded-full ${
                  isActive
                    ? 'bg-gold/15 shadow-[0_0_16px_rgba(212,175,55,0.35)]'
                    : 'bg-transparent'
                }`}
              >
                <Icon
                  className={`size-[1.05rem] ${isActive ? 'text-gold' : 'opacity-80'}`}
                  aria-hidden
                />
              </span>
              <span>{label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
