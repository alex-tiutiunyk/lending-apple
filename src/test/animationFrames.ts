import { vi } from 'vitest'

type FrameCallback = (time: number) => void

export function installManualFrames() {
  const queue = new Map<number, FrameCallback>()
  let nextId = 1

  vi.stubGlobal('requestAnimationFrame', (callback: FrameCallback) => {
    const id = nextId
    nextId += 1
    queue.set(id, callback)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    queue.delete(id)
  })

  return {
    runFrame(time: number) {
      const callbacks = [...queue.values()]
      queue.clear()
      callbacks.forEach((callback) => callback(time))
    },
    pendingCount: () => queue.size,
  }
}
