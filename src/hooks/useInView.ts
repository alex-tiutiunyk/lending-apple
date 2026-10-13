import { useEffect, useState, type RefObject } from 'react'

type InViewOptions = {
  once?: boolean
  rootMargin?: string
  threshold?: number
}

export function useInView(
  target: RefObject<Element | null>,
  { once = false, rootMargin = '0px', threshold = 0 }: InViewOptions = {},
) {
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const element = target.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        setIsInView(entry.isIntersecting)
        if (entry.isIntersecting && once) observer.disconnect()
      },
      { rootMargin, threshold },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [target, once, rootMargin, threshold])

  return isInView
}
