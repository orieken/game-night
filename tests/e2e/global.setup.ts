import { deleteApp, initializeApp } from 'firebase/app'
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { connectFirestoreEmulator, doc, getFirestore, serverTimestamp, setDoc, Timestamp, writeBatch } from 'firebase/firestore'
import { E2E_CAMPAIGN, E2E_CHARACTER, E2E_GAME, E2E_GUEST, E2E_RSVP_EVENTS, E2E_USER } from './seedData'

const projectId = 'demo-game-night'

export default async function globalSetup() {
  await clearEmulatorData()

  const app = initializeApp({
    apiKey: 'demo-api-key',
    authDomain: `${projectId}.firebaseapp.com`,
    projectId,
    appId: '1:000000000000:web:e2e'
  }, 'playwright-seed')
  const auth = getAuth(app)
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  const database = getFirestore(app)
  connectFirestoreEmulator(database, '127.0.0.1', 8080)

  const credentials = await createUserWithEmailAndPassword(auth, E2E_USER.email, E2E_USER.password)
  await updateProfile(credentials.user, { displayName: E2E_USER.displayName })
  const userId = credentials.user.uid

  await setDoc(doc(database, 'users', userId), {
    email: E2E_USER.email,
    username: 'test-host',
    displayName: E2E_USER.displayName,
    avatarUrl: null,
    bio: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })

  const guestCredentials = await createUserWithEmailAndPassword(auth, E2E_GUEST.email, E2E_GUEST.password)
  await updateProfile(guestCredentials.user, { displayName: E2E_GUEST.displayName })
  const guestId = guestCredentials.user.uid
  await setDoc(doc(database, 'users', guestId), {
    email: E2E_GUEST.email,
    username: 'test-guest',
    displayName: E2E_GUEST.displayName,
    avatarUrl: null,
    bio: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })

  await signInWithEmailAndPassword(auth, E2E_USER.email, E2E_USER.password)

  const groupRef = doc(database, 'groups', userId)
  const batch = writeBatch(database)
  batch.set(groupRef, {
    name: 'Playwright Table',
    ownerId: userId,
    memberIds: [userId],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  batch.set(doc(groupRef, 'members', userId), {
    userId,
    role: 'owner',
    displayName: E2E_USER.displayName,
    avatarUrl: null,
    joinedAt: serverTimestamp()
  })
  await batch.commit()

  const guestMembershipBatch = writeBatch(database)
  guestMembershipBatch.set(doc(groupRef, 'members', guestId), {
    userId: guestId,
    role: 'member',
    displayName: E2E_GUEST.displayName,
    avatarUrl: null,
    joinedAt: serverTimestamp()
  })
  guestMembershipBatch.update(groupRef, {
    memberIds: [userId, guestId],
    updatedAt: serverTimestamp()
  })
  await guestMembershipBatch.commit()

  await setDoc(doc(groupRef, 'games', E2E_GAME.id), {
    name: E2E_GAME.name,
    description: 'A deterministic game for local browser tests.',
    minPlayers: 1,
    maxPlayers: 4,
    avgDuration: 45,
    complexity: 'medium',
    category: ['Abstract'],
    imageUrl: null,
    bggId: null,
    isAvailable: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })

  await setDoc(doc(groupRef, 'campaigns', E2E_CAMPAIGN.id), {
    name: E2E_CAMPAIGN.name,
    description: 'A deterministic campaign for local browser tests.',
    system: 'Symbaroum',
    variant: 'Original rules',
    status: 'active',
    dmIds: [userId],
    memberIds: [userId, guestId],
    externalLinks: [],
    characterFieldDefinitions: [
      { id: 'archetype', label: 'Archetype', type: 'select', required: true, options: ['Witch', 'Mystic', 'Warrior'] },
      { id: 'corruption', label: 'Corruption', type: 'number', required: false, options: [] },
      { id: 'shadow-visible', label: 'Shadow visible', type: 'boolean', required: false, options: [] },
      { id: 'abilities', label: 'Abilities', type: 'long_text', required: false, options: [] }
    ],
    createdById: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })

  await setDoc(doc(groupRef, 'campaigns', E2E_CAMPAIGN.id, 'characters', E2E_CHARACTER.id), {
    name: E2E_CHARACTER.name,
    playerId: userId,
    pronouns: 'he/him',
    status: 'active',
    portraitUrl: null,
    externalSheetUrl: null,
    publicNotes: 'A seasoned warrior exploring Davokar.',
    fieldValues: {
      archetype: 'Warrior',
      corruption: 1,
      'shadow-visible': true,
      abilities: 'Iron Fist and Man-at-Arms'
    },
    createdById: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })

  const eventDate = Timestamp.fromDate(new Date('2027-01-15T18:00:00.000Z'))
  const eventsBatch = writeBatch(database)
  const eventDefaults = {
    description: 'A deterministic event for RSVP browser tests.',
    eventDate,
    location: 'Test HQ',
    hostId: userId,
    status: 'upcoming',
    selectedGameIds: [],
    attendeeCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
  eventsBatch.set(doc(groupRef, 'events', E2E_RSVP_EVENTS.public), {
    ...eventDefaults,
    name: 'Public RSVP Test',
    eventType: 'tabletop_rpg',
    campaignId: E2E_CAMPAIGN.id,
    maxAttendees: 4,
    isPublic: true,
    invitedUserIds: []
  })
  eventsBatch.set(doc(groupRef, 'events', E2E_RSVP_EVENTS.full), {
    ...eventDefaults,
    name: 'Full RSVP Test',
    eventType: 'mixed',
    campaignId: E2E_CAMPAIGN.id,
    maxAttendees: 0,
    isPublic: true,
    invitedUserIds: []
  })
  eventsBatch.set(doc(groupRef, 'events', E2E_RSVP_EVENTS.invitedPrivate), {
    ...eventDefaults,
    name: 'Invited Private RSVP Test',
    maxAttendees: 4,
    isPublic: false,
    invitedUserIds: [guestId]
  })
  eventsBatch.set(doc(groupRef, 'events', E2E_RSVP_EVENTS.uninvitedPrivate), {
    ...eventDefaults,
    name: 'Uninvited Private RSVP Test',
    eventType: 'tabletop_rpg',
    campaignId: E2E_CAMPAIGN.id,
    maxAttendees: 4,
    isPublic: false,
    invitedUserIds: []
  })
  eventsBatch.set(doc(groupRef, 'events', 'mixed-upcoming'), {
    ...eventDefaults,
    name: 'Mixed Table Night',
    eventType: 'mixed',
    maxAttendees: 6,
    isPublic: false,
    invitedUserIds: []
  })
  eventsBatch.set(doc(groupRef, 'events', 'rpg-history'), {
    ...eventDefaults,
    name: 'Archived Symbaroum Adventure',
    eventType: 'tabletop_rpg',
    eventDate: Timestamp.fromDate(new Date('2025-01-15T18:00:00.000Z')),
    status: 'completed',
    maxAttendees: 5,
    isPublic: false,
    invitedUserIds: []
  })
  await eventsBatch.commit()
  await deleteApp(app)
}

async function clearEmulatorData() {
  const responses = await Promise.all([
    fetch(`http://127.0.0.1:9099/emulator/v1/projects/${projectId}/accounts`, { method: 'DELETE' }),
    fetch(`http://127.0.0.1:8080/emulator/v1/projects/${projectId}/databases/(default)/documents`, { method: 'DELETE' })
  ])
  if (responses.some((response) => !response.ok)) throw new Error('Unable to reset Firebase emulator data for Playwright.')
}
