#!/usr/bin/env node
import console from 'node:console'
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import process from 'node:process'
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { containsBackupData, createBackup, decodeFirestoreValue, encodeFirestoreValue, validateBackup } from './lib/firestore-backup-format.mjs'

const [command, ...args] = process.argv.slice(2)
const options = parseArgs(args)

if (!['backup', 'restore', 'verify'].includes(command)) {
  usage('Choose the backup, restore, or verify command.')
}

const projectId = options.project ?? process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT ?? process.env.VITE_FIREBASE_PROJECT_ID
if (!projectId) usage('Set FIREBASE_PROJECT_ID or pass --project <project-id>.')

const usingEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST)
const knownCollectionIds = [
  'users', 'groups', 'members', 'games', 'characterVault', 'campaigns', 'characters',
  'adventureLogs', 'dmNotes', 'events', 'rsvps', 'sessions', 'players', 'eventInvites',
  'publicCampaignHighlights'
]
const app = initializeApp({
  projectId,
  ...(!usingEmulator && { credential: applicationDefault() })
})
const firestore = getFirestore(app)

try {
  if (command === 'backup') await backup(firestore, projectId, options)
  else if (command === 'restore') await restoreBackup(firestore, projectId, options)
  else await verifyBackup(firestore, projectId, options)
} catch (error) {
  console.error(`\n${error instanceof Error ? error.message : String(error)}`)
  if (!usingEmulator && isCredentialError(error)) {
    console.error('Set GOOGLE_APPLICATION_CREDENTIALS to an absolute service-account JSON path, then retry.')
  }
  process.exitCode = 1
}

async function backup(database, selectedProjectId, settings) {
  const documentMap = new Map()
  const collections = await database.listCollections()
  for (const collection of collections) await readCollection(collection, documentMap)
  for (const collectionId of knownCollectionIds) {
    const snapshot = await database.collectionGroup(collectionId).get()
    for (const document of snapshot.docs) addDocument(document, documentMap)
  }

  const payload = createBackup(selectedProjectId, [...documentMap.values()])
  const defaultName = `firestore-${selectedProjectId}-${payload.createdAt.replaceAll(':', '-').replace(/\.\d{3}Z$/, 'Z')}.json`
  const outputPath = resolve(settings.output ?? `backups/firestore/${defaultName}`)
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 })
  await chmod(outputPath, 0o600)

  console.log(`Backed up ${payload.documentCount} documents from ${selectedProjectId}.`)
  console.log(`Saved: ${outputPath}`)
  console.log('Store this file somewhere private; it can contain user profiles, campaign notes, and other personal data.')
}

async function readCollection(collection, documentMap) {
  const snapshot = await collection.get()
  for (const document of snapshot.docs) {
    addDocument(document, documentMap)
    const children = await document.ref.listCollections()
    for (const child of children) await readCollection(child, documentMap)
  }
}

function addDocument(document, documentMap) {
  documentMap.set(document.ref.path, { path: document.ref.path, data: encodeFirestoreValue(document.data()) })
}

async function restoreBackup(database, selectedProjectId, settings) {
  const { absolutePath, payload } = await loadBackup(settings, selectedProjectId)

  console.log(`Recovery preview for ${selectedProjectId}`)
  console.log(`Backup created: ${payload.createdAt}`)
  console.log(`Documents to merge: ${payload.documentCount}`)
  console.log('Existing documents will not be deleted. Matching fields will be replaced with backup values.')

  if (settings.confirm !== selectedProjectId) {
    console.log(`\nDry run only. To apply this recovery, repeat with --confirm ${selectedProjectId}`)
    return
  }

  for (let offset = 0; offset < payload.documents.length; offset += 400) {
    const batch = database.batch()
    for (const entry of payload.documents.slice(offset, offset + 400)) {
      batch.set(database.doc(entry.path), decodeFirestoreValue(entry.data, database), { merge: true })
    }
    await batch.commit()
    console.log(`Restored ${Math.min(offset + 400, payload.documentCount)} of ${payload.documentCount} documents…`)
  }
  console.log(`Recovery complete: merged ${payload.documentCount} documents into ${selectedProjectId}.`)
  console.log(`Run npm run firebase:verify -- --file ${absolutePath} to verify the recovered fields.`)
}

async function verifyBackup(database, selectedProjectId, settings) {
  const { payload } = await loadBackup(settings, selectedProjectId)
  const mismatches = []

  for (let offset = 0; offset < payload.documents.length; offset += 100) {
    const entries = payload.documents.slice(offset, offset + 100)
    const snapshots = await database.getAll(...entries.map((entry) => database.doc(entry.path)))
    snapshots.forEach((snapshot, index) => {
      const entry = entries[index]
      const actual = snapshot.exists ? encodeFirestoreValue(snapshot.data()) : null
      if (!snapshot.exists || !containsBackupData(actual, entry.data)) mismatches.push(entry.path)
    })
  }

  if (mismatches.length) {
    const sample = mismatches.slice(0, 10).map((path) => `  - ${path}`).join('\n')
    throw new Error(`Recovery verification failed for ${mismatches.length} document(s):\n${sample}${mismatches.length > 10 ? '\n  - …' : ''}`)
  }
  console.log(`Verified ${payload.documentCount} documents in ${selectedProjectId}; all backup fields match.`)
}

async function loadBackup(settings, selectedProjectId) {
  const inputPath = settings.file ?? settings._[0]
  if (!inputPath) usage('Pass the backup file with --file <path>.')
  const absolutePath = resolve(inputPath)
  const payload = validateBackup(JSON.parse(await readFile(absolutePath, 'utf8')))
  if (payload.projectId !== selectedProjectId) {
    throw new Error(`Project mismatch: ${basename(absolutePath)} belongs to ${payload.projectId}, not ${selectedProjectId}.`)
  }
  return { absolutePath, payload }
}

function parseArgs(values) {
  const result = { _: [] }
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index]
    if (!value.startsWith('--')) {
      result._.push(value)
      continue
    }
    const key = value.slice(2)
    const next = values[index + 1]
    if (!next || next.startsWith('--')) usage(`Missing value for --${key}.`)
    result[key] = next
    index += 1
  }
  return result
}

function isCredentialError(error) {
  const message = error instanceof Error ? error.message : String(error)
  return /credential|Could not load the default credentials|metadata server/i.test(message)
}

function usage(message) {
  console.error(message)
  console.error('Usage:')
  console.error('  npm run firebase:backup -- [--project <id>] [--output <file>]')
  console.error('  npm run firebase:restore -- --file <file> [--project <id>] [--confirm <project-id>]')
  console.error('  npm run firebase:verify -- --file <file> [--project <id>]')
  process.exit(1)
}
