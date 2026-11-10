import '@fontsource/instrument-serif/400.css'
import '@fontsource/unbounded/500.css'
import '@fontsource/unbounded/700.css'
import '@fontsource-variable/manrope'
import '@fontsource/jetbrains-mono/400.css'
import './ui/theme.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { App } from './app/App'
import { initData } from './data'

registerSW({ immediate: true })

initData()
  .catch((e) => console.error('Could not open local storage', e))
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
