import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useToastStore } from '@/stores/toastStore'

describe('ToastStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('adds and manually dismisses a notification', () => {
    const store = useToastStore()
    const id = store.show('Game night created.', 'success', 0)

    expect(store.messages).toEqual([{ id, message: 'Game night created.', tone: 'success' }])

    store.dismiss(id)
    expect(store.messages).toHaveLength(0)
  })

  it('automatically dismisses a notification after its duration', () => {
    const store = useToastStore()
    store.show('Saved.', 'info', 1_000)

    vi.advanceTimersByTime(1_000)

    expect(store.messages).toHaveLength(0)
  })
})
