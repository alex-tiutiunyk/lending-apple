import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { App } from '@/app/App'

export function renderPage() {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
