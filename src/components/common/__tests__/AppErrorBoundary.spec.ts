import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppErrorBoundary from '../AppErrorBoundary.vue'
import { reportClientError } from '@/services/errorReporter'

vi.mock('@/services/errorReporter', () => ({
  reportClientError: vi.fn(() => 'error-reference-123')
}))

describe('AppErrorBoundary', () => {
  beforeEach(() => vi.clearAllMocks())

  it('replaces a broken page with recovery actions and a reference ID', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }]
    })
    await router.push('/')
    await router.isReady()
    const BrokenPage = defineComponent({
      name: 'BrokenPage',
      setup() {
        throw new Error('Render failed')
      },
      template: '<div />'
    })

    const wrapper = mount(AppErrorBoundary, {
      global: { plugins: [router] },
      slots: { default: () => h(BrokenPage) }
    })
    await nextTick()

    expect(wrapper.get('[role="alert"]').text()).toContain('This page hit an unexpected problem')
    expect(wrapper.text()).toContain('error-reference-123')
    expect(wrapper.get('button').text()).toBe('Reload page')
    expect(wrapper.get('a').attributes('href')).toBe('/')
    expect(reportClientError).toHaveBeenCalledWith(expect.objectContaining({ kind: 'vue' }))
  })
})
