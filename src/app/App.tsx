import { useEffect } from 'react'
import { repo } from '../data'
import { ComingSoon } from '../features/placeholder/ComingSoon'
import { SettingsPage } from '../features/settings/SettingsPage'
import { TodayPage } from '../features/today/TodayPage'
import { useHashRoute, useLive } from '../ui/hooks'
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

function Page({ route }: { route: string }) {
  switch (route) {
    case 'today': return <TodayPage />
    case 'settings': return <SettingsPage />
    case 'week': return <ComingSoon id="week" />
    case 'school': return <ComingSoon id="school" />
    case 'life': return <ComingSoon id="life" />
    case 'insights': return <ComingSoon id="insights" />
    default: return <TodayPage />
  }
}

export function App() {
  useTheme()
  const route = useHashRoute(DEFAULT_ROUTE)
  return (
    <div className="shell">
      <header className="topbar">
        <nav className="navpill glass" aria-label="Main">
          {ROUTES.filter((r) => r.nav).map((r) => (
            <a key={r.path} href={`#/${r.path}`} aria-current={route === r.path ? 'page' : undefined}>{r.label}</a>
          ))}
          <a className="gear" href="#/settings" aria-label="Settings" aria-current={route === 'settings' ? 'page' : undefined}>⚙</a>
        </nav>
      </header>
      <main>
        <Page route={route} />
      </main>
    </div>
  )
}
