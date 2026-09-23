import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment
} from '@firebase/rules-unit-testing'
import { arrayUnion, collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

const projectId = 'demo-game-night'
const rules = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8')
const [host, portText] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080').split(':')

let testEnvironment: RulesTestEnvironment

beforeAll(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: {
      host,
      port: Number(portText),
      rules
    }
  })
})

afterEach(async () => {
  if (testEnvironment) await testEnvironment.clearFirestore()
})

afterAll(async () => {
  if (testEnvironment) await testEnvironment.cleanup()
})

async function seedGroup(
  groupId: string,
  ownerId: string,
  members: Array<{ id: string; role: 'owner' | 'organizer' | 'member' }> = [{ id: ownerId, role: 'owner' }]
) {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore()
    await setDoc(doc(database, 'groups', groupId), {
      name: 'Tuesday Table',
      ownerId,
      memberIds: members.map((member) => member.id),
      createdAt: new Date(),
      updatedAt: new Date()
    })

    for (const member of members) {
      await setDoc(doc(database, 'groups', groupId, 'members', member.id), {
        userId: member.id,
        role: member.role,
        displayName: member.id,
        avatarUrl: null,
        joinedAt: new Date()
      })
    }
  })
}

async function seedEvent(groupId: string, eventId: string, overrides: Record<string, unknown> = {}) {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'groups', groupId, 'events', eventId), {
      name: 'Friday games',
      hostId: 'owner-1',
      eventDate: new Date(),
      status: 'upcoming',
      isPublic: true,
      invitedUserIds: [],
      selectedGameIds: [],
      attendeeCount: 0,
      maxAttendees: null,
      rsvpInviteCode: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    })
  })
}

async function seedCampaign(groupId: string, campaignId: string) {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'groups', groupId, 'campaigns', campaignId), {
      name: 'The Darkest Star',
      description: null,
      system: 'Symbaroum',
      variant: 'Original rules',
      status: 'active',
      dmIds: ['owner-1'],
      memberIds: ['owner-1'],
      externalLinks: [],
      characterFieldDefinitions: [],
      createdById: 'owner-1',
      createdAt: new Date(),
      updatedAt: new Date()
    })
  })
}

describe('Firestore security rules', () => {
  it('allows a signed-in user to provision their personal group atomically', async () => {
    const database = testEnvironment.authenticatedContext('owner-1').firestore()
    const groupRef = doc(database, 'groups', 'owner-1')

    await assertSucceeds(getDoc(groupRef))

    const batch = writeBatch(database)
    batch.set(groupRef, {
      name: "Owner's game night",
      ownerId: 'owner-1',
      memberIds: ['owner-1'],
      createdAt: new Date(),
      updatedAt: new Date()
    })
    batch.set(doc(groupRef, 'members', 'owner-1'), {
      userId: 'owner-1',
      role: 'owner',
      displayName: 'Owner',
      avatarUrl: null,
      joinedAt: new Date()
    })

    await assertSucceeds(batch.commit())
    await assertSucceeds(getDoc(groupRef))
  })

  it('denies anonymous access and prevents outsiders from reading a group', async () => {
    await seedGroup('group-1', 'owner-1')

    const anonymousDatabase = testEnvironment.unauthenticatedContext().firestore()
    const outsiderDatabase = testEnvironment.authenticatedContext('outsider-1').firestore()

    await assertFails(getDoc(doc(anonymousDatabase, 'groups', 'group-1')))
    await assertFails(getDoc(doc(outsiderDatabase, 'groups', 'group-1')))
  })

  it('allows members to read their group but not list unrelated groups', async () => {
    await seedGroup('group-1', 'owner-1', [
      { id: 'owner-1', role: 'owner' },
      { id: 'member-1', role: 'member' }
    ])

    const memberDatabase = testEnvironment.authenticatedContext('member-1').firestore()

    await assertSucceeds(getDoc(doc(memberDatabase, 'groups', 'group-1')))
    await assertFails(getDocs(collection(memberDatabase, 'groups')))
  })

  it('lets a user discover only their own group memberships', async () => {
    await seedGroup('group-1', 'owner-1', [
      { id: 'owner-1', role: 'owner' },
      { id: 'member-1', role: 'member' }
    ])

    const memberDatabase = testEnvironment.authenticatedContext('member-1').firestore()
    const ownMemberships = query(
      collectionGroup(memberDatabase, 'members'),
      where('userId', '==', 'member-1')
    )
    const someoneElsesMemberships = query(
      collectionGroup(memberDatabase, 'members'),
      where('userId', '==', 'owner-1')
    )

    const memberships = await assertSucceeds(getDocs(ownMemberships))
    expect(memberships.size).toBe(1)
    await assertFails(getDocs(someoneElsesMemberships))
  })

  it('allows organizers, but not ordinary members, to add games', async () => {
    await seedGroup('group-1', 'owner-1', [
      { id: 'owner-1', role: 'owner' },
      { id: 'organizer-1', role: 'organizer' },
      { id: 'member-1', role: 'member' }
    ])

    const organizerDatabase = testEnvironment.authenticatedContext('organizer-1').firestore()
    const memberDatabase = testEnvironment.authenticatedContext('member-1').firestore()
    const game = {
      name: 'Azul',
      isAvailable: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await assertSucceeds(setDoc(doc(organizerDatabase, 'groups', 'group-1', 'games', 'azul'), game))
    await assertFails(setDoc(doc(memberDatabase, 'groups', 'group-1', 'games', 'catan'), game))
  })

  it('lets organizers create campaigns and assigned DMs maintain them', async () => {
    await seedGroup('group-1', 'owner-1', [
      { id: 'owner-1', role: 'owner' },
      { id: 'dm-1', role: 'member' },
      { id: 'member-1', role: 'member' }
    ])

    const ownerDatabase = testEnvironment.authenticatedContext('owner-1').firestore()
    const dmDatabase = testEnvironment.authenticatedContext('dm-1').firestore()
    const memberDatabase = testEnvironment.authenticatedContext('member-1').firestore()
    const outsiderDatabase = testEnvironment.authenticatedContext('outsider-1').firestore()
    const campaignRef = doc(ownerDatabase, 'groups', 'group-1', 'campaigns', 'campaign-1')
    const campaign = {
      name: 'The Darkest Star',
      description: 'A Symbaroum campaign.',
      system: 'Symbaroum',
      variant: 'Original rules',
      status: 'active',
      dmIds: ['owner-1', 'dm-1'],
      memberIds: ['owner-1', 'dm-1', 'member-1'],
      externalLinks: [],
      characterFieldDefinitions: [],
      createdById: 'owner-1',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await assertSucceeds(setDoc(campaignRef, campaign))
    await assertSucceeds(getDoc(doc(memberDatabase, 'groups', 'group-1', 'campaigns', 'campaign-1')))
    await assertFails(getDoc(doc(outsiderDatabase, 'groups', 'group-1', 'campaigns', 'campaign-1')))
    await assertSucceeds(updateDoc(doc(dmDatabase, 'groups', 'group-1', 'campaigns', 'campaign-1'), {
      description: 'Updated by an assigned DM.',
      updatedAt: new Date()
    }))
    await assertFails(updateDoc(doc(memberDatabase, 'groups', 'group-1', 'campaigns', 'campaign-1'), {
      description: 'A player edit.',
      updatedAt: new Date()
    }))
    await assertFails(updateDoc(campaignRef, { status: 'unknown', updatedAt: new Date() }))
    await assertFails(updateDoc(campaignRef, { createdAt: new Date('2030-01-01'), updatedAt: new Date() }))
    await assertFails(deleteDoc(campaignRef))
  })

  it('rejects campaigns that do not assign the creating organizer as a DM and member', async () => {
    await seedGroup('group-1', 'owner-1')
    const database = testEnvironment.authenticatedContext('owner-1').firestore()
    const campaign = {
      name: 'Invalid campaign',
      description: null,
      system: 'D&D 5e',
      variant: null,
      status: 'active',
      dmIds: ['someone-else'],
      memberIds: ['someone-else'],
      externalLinks: [],
      characterFieldDefinitions: [],
      createdById: 'owner-1',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await assertFails(setDoc(doc(database, 'groups', 'group-1', 'campaigns', 'campaign-1'), campaign))
  })

  it('requires an organizer to create an event as themselves', async () => {
    await seedGroup('group-1', 'owner-1', [
      { id: 'owner-1', role: 'owner' },
      { id: 'organizer-1', role: 'organizer' },
      { id: 'organizer-2', role: 'organizer' }
    ])
    await seedCampaign('group-1', 'campaign-1')

    const organizerDatabase = testEnvironment.authenticatedContext('organizer-1').firestore()
    const eventRef = doc(organizerDatabase, 'groups', 'group-1', 'events', 'event-1')
    const event = {
      name: 'Friday games',
      hostId: 'organizer-1',
      startsAt: new Date(),
      status: 'upcoming',
      isPublic: true,
      invitedUserIds: [],
      selectedGameIds: [],
      attendeeCount: 0,
      maxAttendees: null
    }

    await assertSucceeds(setDoc(eventRef, event))
    await assertSucceeds(setDoc(doc(organizerDatabase, 'groups', 'group-1', 'events', 'event-linked-rpg'), {
      ...event,
      eventType: 'tabletop_rpg',
      campaignId: 'campaign-1'
    }))
    await assertFails(setDoc(doc(organizerDatabase, 'groups', 'group-1', 'events', 'event-board-campaign'), {
      ...event,
      eventType: 'board_game',
      campaignId: 'campaign-1'
    }))
    await assertFails(setDoc(doc(organizerDatabase, 'groups', 'group-1', 'events', 'event-missing-campaign'), {
      ...event,
      eventType: 'tabletop_rpg',
      campaignId: 'missing-campaign'
    }))
    await assertSucceeds(setDoc(doc(organizerDatabase, 'groups', 'group-1', 'events', 'event-rpg'), {
      ...event,
      eventType: 'tabletop_rpg'
    }))
    await assertFails(setDoc(doc(organizerDatabase, 'groups', 'group-1', 'events', 'event-invalid-type'), {
      ...event,
      eventType: 'video_game'
    }))
    await assertFails(setDoc(doc(organizerDatabase, 'groups', 'group-1', 'events', 'event-2'), {
      ...event,
      hostId: 'owner-1'
    }))

    await assertSucceeds(updateDoc(eventRef, { name: 'Updated Friday games' }))
    await assertSucceeds(updateDoc(eventRef, { selectedGameIds: ['azul'] }))
    await assertSucceeds(updateDoc(eventRef, { eventType: 'mixed' }))
    await assertFails(updateDoc(eventRef, { eventType: 'video_game' }))
    await assertFails(updateDoc(eventRef, { selectedGameIds: 'azul' }))
    await assertFails(updateDoc(eventRef, { hostId: 'owner-1' }))

    const otherOrganizerDatabase = testEnvironment.authenticatedContext('organizer-2').firestore()
    await assertFails(updateDoc(doc(otherOrganizerDatabase, 'groups', 'group-1', 'events', 'event-1'), { status: 'cancelled' }))
    await assertSucceeds(updateDoc(eventRef, { status: 'cancelled' }))
    await assertFails(updateDoc(eventRef, { name: 'Reopened event' }))
  })

  it('allows only group members to write their own RSVP', async () => {
    await seedGroup('group-1', 'owner-1', [
      { id: 'owner-1', role: 'owner' },
      { id: 'member-1', role: 'member' }
    ])
    await seedEvent('group-1', 'event-1')

    const memberDatabase = testEnvironment.authenticatedContext('member-1').firestore()
    const outsiderDatabase = testEnvironment.authenticatedContext('outsider-1').firestore()
    const response = { userId: 'member-1', status: 'going', createdAt: new Date(), updatedAt: new Date() }

    const memberBatch = writeBatch(memberDatabase)
    memberBatch.update(doc(memberDatabase, 'groups', 'group-1', 'events', 'event-1'), { attendeeCount: 1, updatedAt: new Date() })
    memberBatch.set(doc(memberDatabase, 'groups', 'group-1', 'events', 'event-1', 'rsvps', 'member-1'), response)
    await assertSucceeds(memberBatch.commit())

    await assertFails(setDoc(doc(memberDatabase, 'groups', 'group-1', 'events', 'event-1', 'rsvps', 'owner-1'), { ...response, userId: 'owner-1' }))
    await assertFails(setDoc(doc(outsiderDatabase, 'groups', 'group-1', 'events', 'event-1', 'rsvps', 'outsider-1'), { ...response, userId: 'outsider-1' }))
  })

  it('rejects a going RSVP when the event is at capacity', async () => {
    await seedGroup('group-1', 'owner-1', [
      { id: 'owner-1', role: 'owner' },
      { id: 'member-1', role: 'member' }
    ])
    await seedEvent('group-1', 'event-1', { attendeeCount: 1, maxAttendees: 1 })

    const memberDatabase = testEnvironment.authenticatedContext('member-1').firestore()
    const batch = writeBatch(memberDatabase)
    batch.update(doc(memberDatabase, 'groups', 'group-1', 'events', 'event-1'), { attendeeCount: 2, updatedAt: new Date() })
    batch.set(doc(memberDatabase, 'groups', 'group-1', 'events', 'event-1', 'rsvps', 'member-1'), {
      userId: 'member-1',
      status: 'going',
      createdAt: new Date(),
      updatedAt: new Date()
    })

    await assertFails(batch.commit())
  })

  it('allows invited members and rejects uninvited members for a private event', async () => {
    await seedGroup('group-1', 'owner-1', [
      { id: 'owner-1', role: 'owner' },
      { id: 'invited-1', role: 'member' },
      { id: 'uninvited-1', role: 'member' }
    ])
    await seedEvent('group-1', 'event-1', { isPublic: false, invitedUserIds: ['invited-1'] })

    const invitedDatabase = testEnvironment.authenticatedContext('invited-1').firestore()
    const invitedBatch = writeBatch(invitedDatabase)
    invitedBatch.update(doc(invitedDatabase, 'groups', 'group-1', 'events', 'event-1'), { attendeeCount: 1, updatedAt: new Date() })
    invitedBatch.set(doc(invitedDatabase, 'groups', 'group-1', 'events', 'event-1', 'rsvps', 'invited-1'), {
      userId: 'invited-1', status: 'going', createdAt: new Date(), updatedAt: new Date()
    })
    await assertSucceeds(invitedBatch.commit())

    const uninvitedDatabase = testEnvironment.authenticatedContext('uninvited-1').firestore()
    await assertFails(setDoc(doc(uninvitedDatabase, 'groups', 'group-1', 'events', 'event-1', 'rsvps', 'uninvited-1'), {
      userId: 'uninvited-1', status: 'maybe', createdAt: new Date(), updatedAt: new Date()
    }))
  })

  it('lets a signed-in recipient join a private event with its RSVP link', async () => {
    await seedGroup('group-1', 'owner-1')
    await seedEvent('group-1', 'event-1', {
      isPublic: false,
      rsvpInviteCode: 'valid-secret-code'
    })
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'eventInvites', 'valid-secret-code'), {
        code: 'valid-secret-code',
        groupId: 'group-1',
        eventId: 'event-1',
        eventName: 'Friday games',
        eventDate: new Date(),
        location: null,
        active: true
      })
    })

    const recipientDatabase = testEnvironment.authenticatedContext('recipient-1').firestore()
    await assertSucceeds(getDoc(doc(recipientDatabase, 'eventInvites', 'valid-secret-code')))

    const acceptBatch = writeBatch(recipientDatabase)
    acceptBatch.set(doc(recipientDatabase, 'groups', 'group-1', 'members', 'recipient-1'), {
      userId: 'recipient-1',
      role: 'member',
      displayName: 'Recipient',
      avatarUrl: null,
      inviteCode: 'valid-secret-code',
      joinedAt: new Date()
    })
    acceptBatch.update(doc(recipientDatabase, 'groups', 'group-1'), {
      memberIds: arrayUnion('recipient-1'),
      updatedAt: new Date()
    })
    acceptBatch.update(doc(recipientDatabase, 'groups', 'group-1', 'events', 'event-1'), {
      invitedUserIds: arrayUnion('recipient-1'),
      updatedAt: new Date()
    })
    await assertSucceeds(acceptBatch.commit())
    await assertSucceeds(getDoc(doc(recipientDatabase, 'groups', 'group-1', 'events', 'event-1')))

    const attackerDatabase = testEnvironment.authenticatedContext('attacker-1').firestore()
    const attackerBatch = writeBatch(attackerDatabase)
    attackerBatch.set(doc(attackerDatabase, 'groups', 'group-1', 'members', 'attacker-1'), {
      userId: 'attacker-1',
      role: 'member',
      displayName: 'Attacker',
      avatarUrl: null,
      inviteCode: 'wrong-code',
      joinedAt: new Date()
    })
    attackerBatch.update(doc(attackerDatabase, 'groups', 'group-1'), {
      memberIds: arrayUnion('attacker-1'),
      updatedAt: new Date()
    })
    await assertFails(attackerBatch.commit())

    const anonymousDatabase = testEnvironment.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(anonymousDatabase, 'eventInvites', 'valid-secret-code')))
  })

  it('lets only the event host manage sessions and completed results', async () => {
    await seedGroup('group-1', 'owner-1', [
      { id: 'owner-1', role: 'owner' },
      { id: 'organizer-1', role: 'organizer' },
      { id: 'member-1', role: 'member' }
    ])
    await seedEvent('group-1', 'event-1', { selectedGameIds: ['azul'] })

    const ownerDatabase = testEnvironment.authenticatedContext('owner-1').firestore()
    const organizerDatabase = testEnvironment.authenticatedContext('organizer-1').firestore()
    const sessionRef = doc(ownerDatabase, 'groups', 'group-1', 'events', 'event-1', 'sessions', 'session-1')
    const ownerPlayerRef = doc(sessionRef, 'players', 'owner-1')
    const memberPlayerRef = doc(sessionRef, 'players', 'member-1')
    const createBatch = writeBatch(ownerDatabase)
    createBatch.set(sessionRef, {
      gameId: 'azul', createdBy: 'owner-1', status: 'in_progress', notes: null,
      startedAt: new Date(), completedAt: null, createdAt: new Date(), updatedAt: new Date()
    })
    createBatch.set(ownerPlayerRef, { userId: 'owner-1', placement: null, score: null, isWinner: false })
    createBatch.set(memberPlayerRef, { userId: 'member-1', placement: null, score: null, isWinner: false })
    await assertSucceeds(createBatch.commit())

    const memberDatabase = testEnvironment.authenticatedContext('member-1').firestore()
    await assertSucceeds(getDoc(doc(memberDatabase, 'groups', 'group-1', 'events', 'event-1', 'sessions', 'session-1')))
    await assertSucceeds(getDoc(doc(memberDatabase, 'groups', 'group-1', 'events', 'event-1', 'sessions', 'session-1', 'players', 'member-1')))
    await assertFails(updateDoc(doc(memberDatabase, 'groups', 'group-1', 'events', 'event-1', 'sessions', 'session-1', 'players', 'member-1'), { score: 999 }))

    const organizerSessionRef = doc(organizerDatabase, 'groups', 'group-1', 'events', 'event-1', 'sessions', 'session-1')
    await assertFails(updateDoc(organizerSessionRef, { status: 'completed', completedAt: new Date(), updatedAt: new Date() }))
    await assertFails(deleteDoc(organizerSessionRef))

    const resultsBatch = writeBatch(ownerDatabase)
    resultsBatch.update(sessionRef, { status: 'completed', completedAt: new Date(), updatedAt: new Date() })
    resultsBatch.update(ownerPlayerRef, { placement: 1, score: 42, isWinner: true })
    resultsBatch.update(memberPlayerRef, { placement: 2, score: 31, isWinner: false })
    await assertSucceeds(resultsBatch.commit())

    await assertFails(updateDoc(memberPlayerRef, { placement: 2, score: 99, isWinner: false }))
    await assertFails(deleteDoc(memberPlayerRef))
    await assertFails(updateDoc(sessionRef, { status: 'in_progress', completedAt: null, updatedAt: new Date() }))
    await assertFails(updateDoc(memberPlayerRef, { placement: 1, score: 31, isWinner: false }))

    const deleteBatch = writeBatch(ownerDatabase)
    deleteBatch.delete(ownerPlayerRef)
    deleteBatch.delete(memberPlayerRef)
    deleteBatch.delete(sessionRef)
    await assertSucceeds(deleteBatch.commit())
  })

})
