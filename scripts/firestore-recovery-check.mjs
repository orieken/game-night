#!/usr/bin/env node
import console from 'node:console'
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

const projectId = 'demo-game-night'
if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Recovery check must run against the Firestore emulator.')
if (!process.env.GCLOUD_PROJECT?.startsWith('demo-')) throw new Error('Recovery check refuses to run outside a demo Firebase project.')

const database = getFirestore(initializeApp({ projectId }))
const root = database.doc('recoveryChecks/check-1')
const child = root.collection('nested').doc('child-1')
const leafOnlyDocument = database.doc('publicCampaignHighlights/group-1/campaigns/campaign-1/sessions/log-1')
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'game-night-recovery-'))
const backupFile = join(temporaryDirectory, 'recovery-check.json')

try {
  await root.set({ name: 'recovery drill', count: 7, checkedAt: Timestamp.fromDate(new Date('2026-09-24T12:00:00.000Z')) })
  await child.set({ restored: true })
  await leafOnlyDocument.set({ excerpt: 'Leaf-only document with virtual ancestors.' })

  await runAdmin('backup', '--project', projectId, '--output', backupFile)
  await child.delete()
  await root.delete()
  await leafOnlyDocument.delete()
  await runAdmin('restore', '--project', projectId, '--file', backupFile, '--confirm', projectId)
  await runAdmin('verify', '--project', projectId, '--file', backupFile)

  const [restoredRoot, restoredChild, restoredLeaf] = await Promise.all([root.get(), child.get(), leafOnlyDocument.get()])
  if (!restoredRoot.exists || !restoredChild.exists || !restoredLeaf.exists || restoredRoot.data()?.count !== 7) {
    throw new Error('Recovery drill did not recreate the expected root, nested, and leaf-only documents.')
  }
  console.log('Recovery drill passed against the disposable Firestore emulator.')
} finally {
  await Promise.allSettled([child.delete(), root.delete(), leafOnlyDocument.delete(), rm(temporaryDirectory, { recursive: true, force: true })])
}

function runAdmin(...args) {
  return new Promise((resolvePromise, rejectPromise) => {
    const childProcess = spawn(process.execPath, [resolve('scripts/firestore-admin.mjs'), ...args], { stdio: 'inherit', env: process.env })
    childProcess.once('error', rejectPromise)
    childProcess.once('exit', (code) => code === 0 ? resolvePromise() : rejectPromise(new Error(`firestore-admin exited with code ${code}.`)))
  })
}
