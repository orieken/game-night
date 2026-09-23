import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useGroupStore } from '@/stores/groupStore'
import type { Group } from '@/domain/entities/Group'

const firstGroup: Group = {
  id: 'group-1',
  name: 'Tuesday Table',
  ownerId: 'user-1',
  memberIds: ['user-1'],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01')
}

const secondGroup: Group = {
  ...firstGroup,
  id: 'group-2',
  name: 'Weekend Crew'
}

describe('GroupStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('selects the first available group by default', () => {
    const store = useGroupStore()
    store.setAvailableGroups([firstGroup, secondGroup], 'user-1')

    expect(store.activeGroup).toEqual(firstGroup)
  })

  it('restores and updates the selected group for the current user', () => {
    localStorage.setItem('game-night:active-group:user-1', 'group-2')
    const store = useGroupStore()
    store.setAvailableGroups([firstGroup, secondGroup], 'user-1')

    expect(store.activeGroup?.id).toBe('group-2')
    expect(store.selectGroup('group-1')).toBe(true)
    expect(localStorage.getItem('game-night:active-group:user-1')).toBe('group-1')
  })

  it('rejects a group that is not in the signed-in user’s membership list', () => {
    const store = useGroupStore()
    store.setAvailableGroups([firstGroup], 'user-1')

    expect(store.selectGroup('outsider-group')).toBe(false)
    expect(store.activeGroup?.id).toBe('group-1')
  })
})
