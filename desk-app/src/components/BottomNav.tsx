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
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.45rem,env(safe-area-inset-bottom))]">
      <nav className="nav-dock pointer-events-auto mx-auto grid max-w-md grid-cols-5 gap-0.5 rounded-2xl p-1.5 sm:max-w-lg">
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`pressable flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10.5px] font-semibold leading-none ${
                isActive
                  ? 'bg-gradient-to-b from-gold/35 to-gold/15 text-gold-soft shadow-[0_1px_0_rgb(255_255_255_/_12%)_inset,0_6px_14px_rgb(201_162_39_/_18%)]'
                  : 'text-muted hover:bg-white/5 hover:text-ink'
              }`}
            >
              <Icon
                className={`size-[1.05rem] ${isActive ? 'text-gold' : 'opacity-80'}`}
                aria-hidden
              />
              <span className="mt-1">{label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
