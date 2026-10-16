import { lazy, Suspense } from 'react'
import { useProjectDetailsRequest } from './projectDetailsStore'

// The dialog is code-split (plan 10 §3): fetched on the first hover, focus or press of a trigger
const ProjectDetailsDialog = lazy(() => import('./ProjectDetailsDialog'))

export function ProjectDetailsSlot() {
  const { isWanted, openCount, trigger } = useProjectDetailsRequest()
  if (!isWanted) return null
  return (
    <Suspense fallback={null}>
      <ProjectDetailsDialog openCount={openCount} trigger={trigger} />
    </Suspense>
  )
}
