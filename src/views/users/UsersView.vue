<script setup lang="ts">
import { computed, watch } from 'vue'
import { format } from 'date-fns'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { useAuthStore } from '@/stores/authStore'
import { useGroupStore } from '@/stores/groupStore'
import type { GroupMember, GroupRole } from '@/domain/entities/Group'

const authStore = useAuthStore()
const groupStore = useGroupStore()

const roleOrder: Record<GroupRole, number> = { owner: 0, organizer: 1, member: 2 }
const users = computed(() => [...groupStore.members].sort((left, right) => (
  roleOrder[left.role] - roleOrder[right.role] || left.displayName.localeCompare(right.displayName)
)))

function initials(member: GroupMember) {
  return member.displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

async function loadUsers() {
  if (groupStore.activeGroupId) await groupStore.fetchMembers(groupStore.activeGroupId)
}

watch(() => groupStore.activeGroupId, () => void loadUsers(), { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-5xl">
    <PageHeader
      eyebrow="Your table"
      title="Users"
      :description="`${users.length} ${users.length === 1 ? 'person' : 'people'} in ${groupStore.activeGroup?.name ?? 'this game group'}.`"
    />

    <LoadingState v-if="groupStore.membersLoading && !users.length" label="Loading table members…" />
    <ErrorState v-else-if="groupStore.membersError" :message="groupStore.membersError" @retry="loadUsers" />
    <EmptyState
      v-else-if="!users.length"
      icon="♙"
      title="No users yet"
      description="Share an RSVP link from a private game night to invite someone to this table."
    />

    <ul v-else class="grid gap-4 sm:grid-cols-2" aria-label="Table users">
      <li
        v-for="member in users"
        :key="member.userId"
        class="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#181d27] p-5"
        :class="member.userId === authStore.user?.id ? 'border-[#8b5cf6]/35 bg-[#8b5cf6]/10' : ''"
      >
        <img v-if="member.avatarUrl" :src="member.avatarUrl" :alt="`${member.displayName} avatar`" class="h-12 w-12 rounded-full object-cover">
        <div v-else class="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#57d2a4] text-sm font-black text-[#10131a]" aria-hidden="true">
          {{ initials(member) }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="truncate font-bold text-white">{{ member.displayName }}</h2>
            <span v-if="member.userId === authStore.user?.id" class="text-xs font-semibold uppercase tracking-wider text-[#bda7ff]">You</span>
          </div>
          <p class="mt-1 text-xs text-slate-400">Joined {{ format(member.joinedAt, 'MMM d, yyyy') }}</p>
          <RouterLink v-if="member.userId === authStore.user?.id" to="/profile" class="mt-2 inline-block text-xs font-semibold text-[#bda7ff] hover:text-white">View profile</RouterLink>
        </div>
        <span class="rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold capitalize text-slate-300">{{ member.role }}</span>
      </li>
    </ul>

    <div class="mt-6 rounded-2xl border border-[#57d2a4]/15 bg-[#57d2a4]/5 px-5 py-4 text-sm leading-6 text-slate-300">
      New users join this table when they accept a private game night’s RSVP link.
    </div>
  </div>
</template>
