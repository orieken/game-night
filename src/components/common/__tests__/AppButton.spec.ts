import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppButton from '@/components/common/AppButton.vue'

describe('AppButton.vue', () => {
  it('renders slot content', () => {
    const wrapper = mount(AppButton, {
      slots: {
        default: 'Click Me'
      }
    })
    expect(wrapper.text()).toContain('Click Me')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(AppButton)
    await wrapper.trigger('click')
    expect(wrapper.emitted()).toHaveProperty('click')
  })

  it('shows loading state', () => {
    const wrapper = mount(AppButton, {
      props: {
        loading: true
      }
    })
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('applies variant classes', () => {
    const wrapper = mount(AppButton, {
      props: {
        variant: 'danger'
      }
    })
    expect(wrapper.classes()).toContain('bg-red-600')
  })
})
