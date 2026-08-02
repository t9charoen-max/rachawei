import { useEffect, useState } from 'react'
import { BottomNav } from './components/BottomNav'
import { PlanScreen } from './components/screens/PlanScreen'
import { CapitalScreen } from './components/screens/CapitalScreen'
import { CashflowScreen } from './components/screens/CashflowScreen'
import { ScenarioScreen } from './components/screens/ScenarioScreen'
import { RulesScreen } from './components/screens/RulesScreen'

export type TabId = 'plan' | 'capital' | 'cashflow' | 'scenario' | 'rules'

const TAB_FROM_HASH: Record<string, TabId> = {
  plan: 'plan',
  capital: 'capital',
  cashflow: 'cashflow',
  scenario: 'scenario',
  rules: 'rules',
}

function tabFromLocation(): TabId {
  const hash = window.location.hash.replace(/^#/, '')
  return TAB_FROM_HASH[hash] ?? 'plan'
}

export default function App() {
  const [tab, setTab] = useState<TabId>(() => tabFromLocation())

  useEffect(() => {
    const onHash = () => setTab(tabFromLocation())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = (next: TabId) => {
    setTab(next)
    window.history.replaceState(null, '', `#${next}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app-shell">
      <div className="ambient-floor" aria-hidden />
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-3.5 pt-3 sm:max-w-lg sm:px-4 sm:pt-4">
        <main
          key={tab}
          className="relative z-0 flex-1 pb-[calc(5.85rem+env(safe-area-inset-bottom))]"
        >
          {tab === 'plan' && <PlanScreen onNavigate={go} />}
          {tab === 'capital' && <CapitalScreen />}
          {tab === 'cashflow' && <CashflowScreen />}
          {tab === 'scenario' && <ScenarioScreen />}
          {tab === 'rules' && <RulesScreen />}
        </main>
        <BottomNav active={tab} onChange={go} />
      </div>
    </div>
  )
}
