import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Group, GroupMember } from '@/domain/entities/Group'
import { groupRepository } from '@/infrastructure/repositories/groupRepository'

export const useGroupStore = defineStore('group', () => {
  const groups = ref<Group[]>([])
  const activeGroupId = ref<string | null>(null)
  const members = ref<GroupMember[]>([])
  const membersLoading = ref(false)
  const membersError = ref<string | null>(null)
  let currentUserId: string | null = null

  const activeGroup = computed(() => (
    groups.value.find((group) => group.id === activeGroupId.value) ?? null
  ))

  function setAvailableGroups(availableGroups: Group[], userId: string) {
    groups.value = availableGroups
    currentUserId = userId

    const storedGroupId = localStorage.getItem(storageKey(userId))
    const nextGroupId = availableGroups.some((group) => group.id === storedGroupId)
      ? storedGroupId
      : availableGroups[0]?.id ?? null

    activeGroupId.value = nextGroupId
    if (nextGroupId) localStorage.setItem(storageKey(userId), nextGroupId)
  }

  function selectGroup(groupId: string): boolean {
    if (!groups.value.some((group) => group.id === groupId)) return false

    activeGroupId.value = groupId
    members.value = []
    if (currentUserId) localStorage.setItem(storageKey(currentUserId), groupId)
    return true
  }

  function reset() {
    groups.value = []
    activeGroupId.value = null
    members.value = []
    membersError.value = null
    currentUserId = null
  }

  async function fetchMembers(groupId: string) {
    membersLoading.value = true
    membersError.value = null
    try {
      members.value = await groupRepository.getMembers(groupId)
    } catch (error: unknown) {
      membersError.value = error instanceof Error ? error.message : 'Unable to load group members.'
    } finally {
      membersLoading.value = false
    }
  }

  async function addMemberByEmail(groupId: string, email: string) {
    membersLoading.value = true
    membersError.value = null
    try {
      const member = await groupRepository.addMemberByEmail(groupId, email)
      const index = members.value.findIndex((existing) => existing.userId === member.userId)
      if (index === -1) members.value.push(member)
      else members.value[index] = member
      return member
    } catch (error: unknown) {
      membersError.value = error instanceof Error ? error.message : 'Unable to add the group member.'
      return null
    } finally {
      membersLoading.value = false
    }
  }

  return { groups, activeGroupId, activeGroup, members, membersLoading, membersError, setAvailableGroups, selectGroup, fetchMembers, addMemberByEmail, reset }
})

function storageKey(userId: string): string {
  return `game-night:active-group:${userId}`
}
