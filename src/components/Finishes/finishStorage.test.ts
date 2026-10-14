import { afterEach, describe, expect, it, vi } from 'vitest'
import { finishes } from '@/content/specs'
import { finishHeadScript, finishStorageKey, readStoredFinish, storeFinish } from './finishStorage'

afterEach(() => {
  window.localStorage.clear()
  vi.restoreAllMocks()
  document.documentElement.removeAttribute('style')
})

describe('finish storage', () => {
  it('reads back a stored finish', () => {
    expect(storeFinish('moss')).toBe(true)
    expect(readStoredFinish()).toBe('moss')
  })

  it('falls back to the first finish for missing or broken values', () => {
    expect(readStoredFinish()).toBe(finishes[0].id)
    for (const broken of ['', 'gold', '{"id":"moss"}', '__proto__']) {
      window.localStorage.setItem(finishStorageKey, broken)
      expect(readStoredFinish()).toBe(finishes[0].id)
    }
  })

  it('works without storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readStoredFinish()).toBe(finishes[0].id)
    expect(storeFinish('ember')).toBe(false)
  })

  it('has a head script that applies the stored finish and ignores junk', () => {
    window.localStorage.setItem(finishStorageKey, 'ember')
    new Function(finishHeadScript())()
    expect(document.documentElement.style.getPropertyValue('--accent-h')).toBe('18')
    expect(document.documentElement.style.getPropertyValue('--accent-s')).toBe('78%')

    document.documentElement.removeAttribute('style')
    window.localStorage.setItem(finishStorageKey, '__proto__')
    new Function(finishHeadScript())()
    expect(document.documentElement.style.getPropertyValue('--accent-h')).toBe('')
  })
})
