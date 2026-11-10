export interface RouteDef {
  path: string
  label: string
  nav: boolean
}

// Primary navigation. Calendar, Plan and Game live under these as tabs in later phases.
export const ROUTES: RouteDef[] = [
  { path: 'today', label: 'Today', nav: true },
  { path: 'week', label: 'Week', nav: true },
  { path: 'school', label: 'School', nav: true },
  { path: 'life', label: 'Life', nav: true },
  { path: 'insights', label: 'Insights', nav: true },
  { path: 'settings', label: 'Settings', nav: false },
]

export const DEFAULT_ROUTE = 'today'
