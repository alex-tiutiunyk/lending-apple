type Listener<Request> = (request: Request) => boolean

/**
 * A tiny one-way channel between lazy chunks that must not import each other (plan 4 §1,
 * §7.3): the letters ask Pip for a chase, the footer asks the particles for a launch. A request
 * is handed to each listener until one accepts it; `request` reports whether anyone did.
 */
export function createRequestChannel<Request>() {
  const listeners = new Set<Listener<Request>>()

  return {
    request(request: Request) {
      for (const listener of listeners) {
        if (listener(request)) return true
      }
      return false
    },
    subscribe(listener: Listener<Request>) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    get hasListeners() {
      return listeners.size > 0
    },
  }
}
