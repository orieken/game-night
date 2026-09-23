import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { getFirestoreDb } from '@/infrastructure/api/firebaseClient'
import type { Game } from '@/domain/entities/Game'
import type { IGameRepository } from '@/domain/interfaces/IGameRepository'
import { toGame, type GameDocument } from '@/infrastructure/mappers/gameMapper'

function gamesCollection(groupId: string) {
  return collection(getFirestoreDb(), 'groups', groupId, 'games')
}

export const gameRepository: IGameRepository = {
  async getAll(groupId, availableOnly = false): Promise<Game[]> {
    const constraints = availableOnly ? [where('isAvailable', '==', true), orderBy('name')] : [orderBy('name')]
    const snapshot = await getDocs(query(gamesCollection(groupId), ...constraints))
    return snapshot.docs.map((game) => toGame(game.id, game.data() as GameDocument))
  },

  async getById(groupId, id): Promise<Game | null> {
    const snapshot = await getDoc(doc(gamesCollection(groupId), id))
    return snapshot.exists() ? toGame(snapshot.id, snapshot.data() as GameDocument) : null
  },

  async create(groupId, game): Promise<Game> {
    const snapshot = await addDoc(gamesCollection(groupId), {
      name: game.name,
      description: game.description,
      minPlayers: game.minPlayers,
      maxPlayers: game.maxPlayers,
      avgDuration: game.avgDuration,
      complexity: game.complexity,
      category: game.category,
      imageUrl: game.imageUrl,
      bggId: game.bggId,
      catalogData: game.catalogData,
      isAvailable: game.isAvailable,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    const created = await getDoc(snapshot)
    return toGame(created.id, created.data() as GameDocument)
  },

  async update(groupId, id, game): Promise<Game> {
    const updates = Object.fromEntries(Object.entries({
      name: game.name,
      description: game.description,
      minPlayers: game.minPlayers,
      maxPlayers: game.maxPlayers,
      avgDuration: game.avgDuration,
      complexity: game.complexity,
      category: game.category,
      imageUrl: game.imageUrl,
      bggId: game.bggId,
      catalogData: game.catalogData,
      isAvailable: game.isAvailable
    }).filter(([, value]) => value !== undefined))
    const gameRef = doc(gamesCollection(groupId), id)
    await updateDoc(gameRef, { ...updates, updatedAt: serverTimestamp() })
    const updated = await getDoc(gameRef)
    return toGame(updated.id, updated.data() as GameDocument)
  }
}
