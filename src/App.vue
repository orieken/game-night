<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import ToastRegion from '@/components/common/ToastRegion.vue'

const route = useRoute()
const isStandaloneRoute = computed(() => route.meta.requiresGuest === true || route.meta.publicPage === true)
</script>

<template>
  <ToastRegion />
  <router-view v-slot="{ Component }">
    <component :is="Component" v-if="isStandaloneRoute" />
    <AppShell v-else>
      <component :is="Component" />
    </AppShell>
  </router-view>
</template>
