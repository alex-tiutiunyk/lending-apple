import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { applyStoredMotionPause } from '@/hooks/motionPause'
import '@/styles/global.scss'

applyStoredMotionPause()

const rootElement = document.getElementById('root')
const page = (
  <StrictMode>
    <App />
  </StrictMode>
)

if (rootElement?.hasChildNodes()) hydrateRoot(rootElement, page)
else if (rootElement) createRoot(rootElement).render(page)
