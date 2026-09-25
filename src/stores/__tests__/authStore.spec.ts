import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import { userRepository } from '@/infrastructure/repositories/userRepository'
import { groupRepository } from '@/infrastructure/repositories/groupRepository'
import { onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'

// Mock dependencies
vi.mock('@/infrastructure/repositories/userRepository', () => ({
  userRepository: {
    getCurrentUser: vi.fn(),
    createProfile: vi.fn()
  }
}))

vi.mock('@/infrastructure/repositories/groupRepository', () => ({
  groupRepository: {
    ensurePersonalGroup: vi.fn(),
    getForUser: vi.fn()
  }
}))

vi.mock('@/infrastructure/api/firebaseClient', () => ({
  getFirebaseAuth: vi.fn()
}))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn()
}))

describe('AuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(groupRepository.getForUser).mockResolvedValue([])
  })

  it('fetchCurrentUser updates user state on success', async () => {
    const mockUser = { id: '123', email: 'test@test.com', username: 'testuser' }
    // @ts-ignore
    userRepository.getCurrentUser.mockResolvedValue(mockUser)

    const store = useAuthStore()
    await store.fetchCurrentUser()

    expect(store.user).toEqual(mockUser)
    expect(store.loading).toBe(false)
  })

  it('fetchCurrentUser handles errors gracefully', async () => {
    // @ts-ignore
    userRepository.getCurrentUser.mockRejectedValue(new Error('Fetch failed'))

    const store = useAuthStore()
    await store.fetchCurrentUser()

    expect(store.user).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('creates a profile and group for a first-time Google user', async () => {
    const googleUser = { uid: 'user-123', email: 'player@example.com', displayName: 'Player', photoURL: null }
    vi.mocked(signInWithPopup).mockResolvedValue({ user: googleUser } as never)
    vi.mocked(userRepository.getCurrentUser).mockResolvedValue(null)
    vi.mocked(userRepository.createProfile).mockResolvedValue({ id: 'user-123', username: 'player' } as never)
    vi.mocked(groupRepository.ensurePersonalGroup).mockResolvedValue({ id: 'user-123', name: "player's game night" } as never)

    const store = useAuthStore()
    await expect(store.loginWithGoogle()).resolves.toBe(true)

    expect(userRepository.createProfile).toHaveBeenCalledWith(expect.objectContaining({
      id: 'user-123',
      username: 'player',
      displayName: 'Player'
    }))
    expect(groupRepository.ensurePersonalGroup).toHaveBeenCalled()
  })

  it('shows a friendly message when a Google popup is actually closed', async () => {
    vi.mocked(signInWithPopup).mockRejectedValue(Object.assign(new Error('Firebase: Error (auth/popup-closed-by-user).'), { code: 'auth/popup-closed-by-user' }))
    const store = useAuthStore()

    await expect(store.loginWithGoogle()).resolves.toBe(false)

    expect(store.error).toBe('Google sign-in was closed before it finished. Please try again.')
  })

  it('always finishes initialization when personal group provisioning fails', async () => {
    vi.mocked(onAuthStateChanged).mockImplementation(((_auth: unknown, callback: (user: unknown) => void) => {
      void callback({ uid: 'user-123' } as never)
      return vi.fn()
    }) as never)
    vi.mocked(userRepository.getCurrentUser).mockResolvedValue({ id: 'user-123', username: 'player' } as never)
    vi.mocked(groupRepository.ensurePersonalGroup).mockRejectedValue(new Error('Missing or insufficient permissions.'))

    const store = useAuthStore()
    await expect(store.initialize()).resolves.toBeUndefined()

    expect(store.initialized).toBe(true)
    expect(store.loading).toBe(false)
    expect(store.error).toContain('Missing or insufficient permissions')
  })

  it('waits for the profile and personal group before completing email login', async () => {
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue({ user: { uid: 'user-123' } } as never)
    vi.mocked(userRepository.getCurrentUser).mockResolvedValue({ id: 'user-123', username: 'player' } as never)
    vi.mocked(groupRepository.ensurePersonalGroup).mockResolvedValue({ id: 'user-123' } as never)

    const store = useAuthStore()
    await expect(store.login('player@example.com', 'password123')).resolves.toBe(true)

    expect(userRepository.getCurrentUser).toHaveBeenCalled()
    expect(groupRepository.ensurePersonalGroup).toHaveBeenCalled()
    expect(store.user?.id).toBe('user-123')
  })
})
