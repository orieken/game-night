import { DocumentReference, GeoPoint, Timestamp } from 'firebase-admin/firestore'

export const BACKUP_FORMAT = 'game-night-firestore-backup'
export const BACKUP_VERSION = 1

const TYPE_KEY = '__firestoreType'
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

export function encodeFirestoreValue(value) {
  if (typeof value === 'number' && !Number.isFinite(value)) {
    return { [TYPE_KEY]: 'number', value: String(value) }
  }
  if (value instanceof Timestamp) {
    return { [TYPE_KEY]: 'timestamp', value: value.toDate().toISOString() }
  }
  if (value instanceof GeoPoint) {
    return { [TYPE_KEY]: 'geopoint', latitude: value.latitude, longitude: value.longitude }
  }
  if (value instanceof DocumentReference) {
    return { [TYPE_KEY]: 'reference', path: value.path }
  }
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    return { [TYPE_KEY]: 'bytes', value: Buffer.from(value).toString('base64') }
  }
  if (Array.isArray(value)) return value.map(encodeFirestoreValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encodeFirestoreValue(item)]))
  }
  return value
}

export function decodeFirestoreValue(value, firestore) {
  if (Array.isArray(value)) return value.map((item) => decodeFirestoreValue(item, firestore))
  if (!value || typeof value !== 'object') return value

  if (value[TYPE_KEY] === 'timestamp') return Timestamp.fromDate(new Date(value.value))
  if (value[TYPE_KEY] === 'number') return Number(value.value)
  if (value[TYPE_KEY] === 'geopoint') return new GeoPoint(value.latitude, value.longitude)
  if (value[TYPE_KEY] === 'reference') return firestore.doc(value.path)
  if (value[TYPE_KEY] === 'bytes') return Buffer.from(value.value, 'base64')

  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    if (FORBIDDEN_KEYS.has(key)) throw new Error(`Backup data contains a forbidden field name: ${key}`)
    return [key, decodeFirestoreValue(item, firestore)]
  }))
}

export function createBackup(projectId, documents, createdAt = new Date()) {
  const sortedDocuments = [...documents].sort((left, right) => left.path.localeCompare(right.path))
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    projectId,
    createdAt: createdAt.toISOString(),
    documentCount: sortedDocuments.length,
    documents: sortedDocuments
  }
}

export function validateBackup(input) {
  if (!input || typeof input !== 'object') throw new Error('Backup must be a JSON object.')
  if (input.format !== BACKUP_FORMAT) throw new Error('This is not a Game Night Firestore backup.')
  if (input.version !== BACKUP_VERSION) throw new Error(`Unsupported backup version: ${String(input.version)}.`)
  if (typeof input.projectId !== 'string' || !input.projectId.trim()) throw new Error('Backup projectId is missing.')
  if (typeof input.createdAt !== 'string' || Number.isNaN(Date.parse(input.createdAt))) throw new Error('Backup createdAt is invalid.')
  if (!Array.isArray(input.documents)) throw new Error('Backup documents must be an array.')
  if (input.documentCount !== input.documents.length) throw new Error('Backup document count does not match its contents.')

  const paths = new Set()
  for (const entry of input.documents) {
    if (!entry || typeof entry !== 'object' || typeof entry.path !== 'string') throw new Error('Every backup document must have a path.')
    const segments = entry.path.split('/')
    if (segments.length < 2 || segments.length % 2 !== 0 || segments.some((segment) => !segment)) {
      throw new Error(`Invalid Firestore document path: ${entry.path}`)
    }
    if (paths.has(entry.path)) throw new Error(`Duplicate Firestore document path: ${entry.path}`)
    if (!entry.data || typeof entry.data !== 'object' || Array.isArray(entry.data)) throw new Error(`Document ${entry.path} has invalid data.`)
    paths.add(entry.path)
  }

  return input
}

export function containsBackupData(actual, expected) {
  if (Array.isArray(expected)) {
    return Array.isArray(actual) && actual.length === expected.length && expected.every((item, index) => containsBackupData(actual[index], item))
  }
  if (expected && typeof expected === 'object') {
    return actual && typeof actual === 'object' && !Array.isArray(actual) && Object.entries(expected).every(([key, value]) => containsBackupData(actual[key], value))
  }
  return Object.is(actual, expected)
}
