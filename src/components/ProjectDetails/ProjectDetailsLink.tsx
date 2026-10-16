import type { ComponentProps, MouseEvent } from 'react'
import { detailsReadmeUrl } from '@/content/projectDetailsTree'
import { openProjectDetails, primeProjectDetails } from './projectDetailsStore'

type ProjectDetailsLinkProps = Omit<ComponentProps<'a'>, 'href' | 'onClick'>

function opensElsewhere(event: MouseEvent) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
}

/**
 * A real link to the README on GitHub that opens the details dialog instead (plan 10 §2).
 * Without JS, for a new-tab click and where there is no `<dialog>`, the link is followed.
 */
export function ProjectDetailsLink({ children, ...props }: ProjectDetailsLinkProps) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (opensElsewhere(event) || typeof HTMLDialogElement !== 'function') return
    event.preventDefault()
    openProjectDetails(event.currentTarget)
  }

  return (
    <a
      {...props}
      href={detailsReadmeUrl}
      onClick={onClick}
      onFocus={primeProjectDetails}
      onPointerEnter={primeProjectDetails}
      onPointerDown={primeProjectDetails}
    >
      {children}
    </a>
  )
}
