import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { applySettings, getA11ySettings } from '@/hooks/a11yStore'
import '@/styles/global.scss'

applySettings(getA11ySettings())

const rootElement = document.getElementById('root')
const page = (
  <StrictMode>
    <App />
  </StrictMode>
)

if (rootElement?.hasChildNodes()) hydrateRoot(rootElement, page)
else if (rootElement) createRoot(rootElement).render(page)
