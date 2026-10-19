import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { applySettings, getA11ySettings } from '@/hooks/a11yStore'
import '@/styles/global.scss'

applySettings(getA11ySettings())

// Plan 11 §1: the on-device readout, its own chunk, only with `?diag` (removed at P9)
if (new URLSearchParams(window.location.search).has('diag')) void import('@/diag/diag')

const rootElement = document.getElementById('root')
const page = (
  <StrictMode>
    <App />
  </StrictMode>
)

if (rootElement?.hasChildNodes()) hydrateRoot(rootElement, page)
else if (rootElement) createRoot(rootElement).render(page)
