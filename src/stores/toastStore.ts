import { ref } from 'vue'
import { defineStore } from 'pinia'

export type ToastTone = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: number
  message: string
  tone: ToastTone
}

export const useToastStore = defineStore('toast', () => {
  const messages = ref<ToastMessage[]>([])
  let nextId = 1

  function show(message: string, tone: ToastTone = 'info', duration = 4_000): number {
    const id = nextId++
    messages.value.push({ id, message, tone })

    if (duration > 0) window.setTimeout(() => dismiss(id), duration)
    return id
  }

  function dismiss(id: number) {
    messages.value = messages.value.filter((message) => message.id !== id)
  }

  return { messages, show, dismiss }
})
