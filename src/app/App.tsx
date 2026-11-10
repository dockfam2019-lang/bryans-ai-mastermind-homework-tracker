import { useEffect } from 'react'
import { repo } from '../data'
import { LifePage } from '../features/life/LifePage'
import { ComingSoon } from '../features/placeholder/ComingSoon'
import { SchoolPage } from '../features/school/SchoolPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { TodayPage } from '../features/today/TodayPage'
import { WeekPage } from '../features/week/WeekPage'
import { useHashRoute, useLive } from '../ui/hooks'
import { ToastHost } from '../ui/ToastHost'
import { useReminders } from '../ui/useReminders'
import { DEFAULT_ROUTE, ROUTES } from './routes'

function useTheme() {
  const settings = useLive(() => repo.settings.get('main'))
  useEffect(() => {
    const apply = () => {
      const pref = settings?.theme ?? 'dark'
      const dark = pref === 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches : pref === 'dark'
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    }
    apply()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [settings?.theme])
}

/** n = new assignment, t = today, / = search or quick add. Ignored while typing. */
function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return
      if (document.querySelector('dialog[open]')) return
      if (e.key === 't') window.location.hash = '#/today'
      else if (e.key === 'n') {
        window.location.hash = '#/school'
        setTimeout(() => window.dispatchEvent(new CustomEvent('studyboard:new-assignment')), 60)
      } else if (e.key === '/') {
        const target = document.getElementById('search') ?? document.getElementById('quick-add')
        if (target) { e.preventDefault(); target.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

function Page({ route }: { route: string }) {
  const [head, tab = ''] = route.split('/')
  switch (head) {
    case 'today': return <TodayPage />
    case 'settings': return <SettingsPage />
    case 'week': return <WeekPage tab={tab} />
    case 'school': return <SchoolPage tab={tab} />
    case 'life': return <LifePage sub={tab} />
    case 'insights': return <ComingSoon id="insights" />
    default: return <TodayPage />
  }
}

export function App() {
  useTheme()
  useShortcuts()
  useReminders()
  const route = useHashRoute(DEFAULT_ROUTE)
  const head = route.split('/')[0]
  return (
    <div className="shell">
      <header className="topbar">
        <nav className="navpill glass" aria-label="Main">
          {ROUTES.filter((r) => r.nav).map((r) => (
            <a key={r.path} href={`#/${r.path}`} aria-current={head === r.path ? 'page' : undefined}>{r.label}</a>
          ))}
          <a className="gear" href="#/settings" aria-label="Settings" aria-current={head === 'settings' ? 'page' : undefined}>⚙</a>
        </nav>
      </header>
      <main>
        <Page route={route} />
      </main>
      <ToastHost />
    </div>
  )
}
