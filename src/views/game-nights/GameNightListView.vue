<script setup lang="ts">
import { watch } from 'vue'
import { useGameNightStore } from '@/stores/gameNightStore'
import { useGroupStore } from '@/stores/groupStore'
import GameNightCard from '@/components/game-night/GameNightCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const store = useGameNightStore()
const groupStore = useGroupStore()

function loadGameNights() {
  if (groupStore.activeGroupId) void store.fetchGameNights(groupStore.activeGroupId)
}

watch(() => groupStore.activeGroupId, loadGameNights, { immediate: true })
</script>

<template>
  <div>
    <PageHeader title="Game nights" :description="`Upcoming events and sessions for ${groupStore.activeGroup?.name ?? 'your table'}.`">
      <template #actions>
        <AppButton @click="$router.push('/game-nights/create')">Plan event</AppButton>
      </template>
    </PageHeader>

    <LoadingState v-if="store.loading" label="Loading game nights…" />

    <ErrorState v-else-if="store.error" :message="store.error" @retry="loadGameNights" />

    <EmptyState v-else-if="store.gameNights.length === 0" icon="◈" title="No game nights scheduled" description="Start planning the first gathering for this table.">
      <template #actions>
        <AppButton @click="$router.push('/game-nights/create')">Create event</AppButton>
      </template>
    </EmptyState>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <GameNightCard
        v-for="event in store.gameNights"
        :key="event.id"
        :game-night="event"
      />
    </div>
  </div>
</template>
