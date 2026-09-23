<script setup lang="ts">
import { computed } from 'vue'
import { useGroupStore } from '@/stores/groupStore'

const groupStore = useGroupStore()

const selectedGroupId = computed({
  get: () => groupStore.activeGroupId ?? '',
  set: (groupId: string) => groupStore.selectGroup(groupId)
})
</script>

<template>
  <div v-if="groupStore.groups.length" class="space-y-2">
    <label for="active-group" class="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
      Active table
    </label>
    <select
      id="active-group"
      v-model="selectedGroupId"
      class="app-field text-sm font-medium"
      aria-label="Active game group"
    >
      <option v-for="group in groupStore.groups" :key="group.id" :value="group.id">
        {{ group.name }}
      </option>
    </select>
  </div>
</template>
