<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useCampaignStore } from '@/stores/campaignStore'
import { useGroupStore } from '@/stores/groupStore'
import CampaignCard from '@/components/campaign/CampaignCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import type { CampaignStatus } from '@/domain/entities/Campaign'

const authStore = useAuthStore()
const campaignStore = useCampaignStore()
const groupStore = useGroupStore()
const search = ref('')
const status = ref<'all' | CampaignStatus>('active')

const memberRole = computed(() => groupStore.members.find((member) => member.userId === authStore.user?.id)?.role)
const canCreate = computed(() => memberRole.value === 'owner' || memberRole.value === 'organizer')
const filteredCampaigns = computed(() => {
  const term = search.value.trim().toLowerCase()
  return campaignStore.campaigns.filter((campaign) => {
    const matchesStatus = status.value === 'all' || campaign.status === status.value
    const matchesSearch = !term || [campaign.name, campaign.system, campaign.variant ?? '', campaign.description ?? '']
      .some((value) => value.toLowerCase().includes(term))
    return matchesStatus && matchesSearch
  })
})

function loadCampaigns() {
  if (!groupStore.activeGroupId) return
  void Promise.all([
    campaignStore.fetchCampaigns(groupStore.activeGroupId),
    groupStore.fetchMembers(groupStore.activeGroupId)
  ])
}

watch(() => groupStore.activeGroupId, loadCampaigns, { immediate: true })
</script>

<template>
  <div>
    <PageHeader title="Campaigns" :description="`Tabletop RPG campaigns for ${groupStore.activeGroup?.name ?? 'your table'}.`">
      <template #actions><AppButton v-if="canCreate" @click="$router.push('/campaigns/new')">Create campaign</AppButton></template>
    </PageHeader>

    <LoadingState v-if="campaignStore.loading" label="Loading campaigns…" />
    <ErrorState v-else-if="campaignStore.error" :message="campaignStore.error" @retry="loadCampaigns" />
    <EmptyState v-else-if="!campaignStore.campaigns.length" icon="⚔" title="Begin your first campaign" description="Create a home for your players, characters, scheduled sessions, and adventure history.">
      <template v-if="canCreate" #actions><AppButton @click="$router.push('/campaigns/new')">Create campaign</AppButton></template>
    </EmptyState>
    <template v-else>
      <section class="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-[#181d27] p-4 sm:grid-cols-[1fr_auto]" aria-label="Campaign filters">
        <input v-model="search" type="search" class="app-field text-sm" placeholder="Search campaigns or game systems" aria-label="Search campaigns">
        <select v-model="status" class="app-field text-sm" aria-label="Filter campaigns by status">
          <option value="active">Active</option><option value="on_hold">On hold</option><option value="completed">Completed</option><option value="archived">Archived</option><option value="all">All statuses</option>
        </select>
      </section>
      <EmptyState v-if="!filteredCampaigns.length" icon="⌕" title="No campaigns match" description="Try another status or search term." />
      <div v-else class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <CampaignCard v-for="campaign in filteredCampaigns" :key="campaign.id" :campaign="campaign" />
      </div>
    </template>
  </div>
</template>
