import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppInput from '@/components/common/AppInput.vue'

describe('AppInput', () => {
  it('emits numeric values when used with the number model modifier', async () => {
    const wrapper = mount(AppInput, {
      props: {
        id: 'capacity',
        type: 'number',
        modelValue: null,
        modelModifiers: { number: true }
      }
    })

    await wrapper.get('input').setValue('8')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([8])
  })
})
