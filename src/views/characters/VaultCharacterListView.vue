<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import VaultCharacterCard from '@/components/characters/VaultCharacterCard.vue'
import { useAuthStore } from '@/stores/authStore'
import { useGroupStore } from '@/stores/groupStore'
import { useVaultCharacterStore } from '@/stores/vaultCharacterStore'

const router = useRouter()
const authStore = useAuthStore()
const groupStore = useGroupStore()
const vaultStore = useVaultCharacterStore()
const hasCharacters = computed(() => vaultStore.ownedCharacters.length || vaultStore.sharedCharacters.length)

function ownerName(ownerId: string) {
  if (ownerId === authStore.user?.id) return 'Your character'
  return `Created by ${groupStore.members.find((member) => member.userId === ownerId)?.displayName ?? 'a table member'}`
}

async function loadVault() {
  if (!groupStore.activeGroupId || !authStore.user?.id) return
  await Promise.all([
    groupStore.fetchMembers(groupStore.activeGroupId),
    vaultStore.fetchVault(groupStore.activeGroupId, authStore.user.id)
  ])
}

watch(() => groupStore.activeGroupId, () => void loadVault(), { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-6xl">
    <PageHeader eyebrow="Character vault" title="Characters" description="Build characters before a campaign, share trial characters, and keep reusable ideas ready for game night.">
      <template #actions><AppButton @click="router.push('/characters/new')">Create character</AppButton></template>
    </PageHeader>
    <LoadingState v-if="vaultStore.loading && !hasCharacters" label="Opening the character vault…" />
    <ErrorState v-else-if="vaultStore.error" :message="vaultStore.error" @retry="loadVault" />
    <EmptyState v-else-if="!hasCharacters" icon="⚔" title="Your vault is empty" description="Create a personal draft or a copyable trial character for your table."><template #actions><AppButton @click="router.push('/characters/new')">Create character</AppButton></template></EmptyState>
    <div v-else class="space-y-9">
      <section aria-labelledby="my-vault-heading"><div class="mb-4"><h2 id="my-vault-heading" class="text-xl font-bold text-white">My character vault</h2><p class="mt-1 text-sm text-slate-400">Private drafts and characters you have shared with the table.</p></div><div v-if="vaultStore.ownedCharacters.length" class="grid gap-4 sm:grid-cols-2"><VaultCharacterCard v-for="character in vaultStore.ownedCharacters" :key="character.id" :character="character" owner-name="Your character" /></div><p v-else class="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">You have not created any vault characters yet.</p></section>
      <section aria-labelledby="shared-vault-heading"><div class="mb-4"><h2 id="shared-vault-heading" class="text-xl font-bold text-white">Shared by your table</h2><p class="mt-1 text-sm text-slate-400">View shared characters and copy those their owners have made reusable.</p></div><div v-if="vaultStore.sharedCharacters.length" class="grid gap-4 sm:grid-cols-2"><VaultCharacterCard v-for="character in vaultStore.sharedCharacters" :key="character.id" :character="character" :owner-name="ownerName(character.ownerId)" /></div><p v-else class="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">No table-visible characters have been shared yet.</p></section>
    </div>
  </div>
</template>
