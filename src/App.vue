<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import ToastRegion from '@/components/common/ToastRegion.vue'

const route = useRoute()
const isAuthenticationRoute = computed(() => route.meta.requiresGuest === true)
</script>

<template>
  <ToastRegion />
  <router-view v-slot="{ Component }">
    <component :is="Component" v-if="isAuthenticationRoute" />
    <AppShell v-else>
      <component :is="Component" />
    </AppShell>
  </router-view>
</template>
