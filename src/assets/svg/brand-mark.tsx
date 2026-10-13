import { appleBodyPath, appleLeafPath, appleMarkViewBox } from './apple-mark-path'

export function BrandMark({ className }: { className?: string | undefined }) {
  return (
    <svg className={className} viewBox={appleMarkViewBox} aria-hidden="true" focusable="false">
      <path d={appleBodyPath} fill="currentColor" />
      <path d={appleLeafPath} fill="currentColor" />
    </svg>
  )
}
