<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  modelValue: string | number | null
  label?: string
  type?: string
  placeholder?: string
  error?: string
  id: string
  modelModifiers?: { number?: boolean }
}>()

defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void
}>()

function inputValue(event: { target: unknown }): string | number {
  const input = event.target as { value: string; valueAsNumber: number }
  if (props.modelModifiers?.number && input.value !== '') return input.valueAsNumber
  return input.value
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" :for="id" class="text-sm font-semibold text-slate-300">
      {{ label }}
    </label>
    <input
      :id="id"
      v-bind="$attrs"
      :type="type || 'text'"
      :value="modelValue"
      @input="$emit('update:modelValue', inputValue($event))"
      :placeholder="placeholder"
      class="app-field"
      :class="{ '!border-red-500 focus:!ring-red-500': error }"
    />
    <span v-if="error" class="text-xs text-red-500">{{ error }}</span>
  </div>
</template>
