<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  type: 'button'
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
    :class="{
      'bg-[#ff6b5e] text-[#10131a] shadow-lg shadow-[#ff6b5e]/15 hover:bg-[#ff877c]': variant === 'primary',
      'border border-white/10 bg-[#222938] text-white hover:border-white/20 hover:bg-[#2b3446]': variant === 'secondary',
      'bg-red-600 text-white hover:bg-red-500': variant === 'danger',
      'bg-transparent text-slate-300 hover:bg-white/10 hover:text-white': variant === 'ghost'
    }"
  >
    <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <slot />
  </button>
</template>
