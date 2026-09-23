import { defineStore } from 'pinia'
import { ref } from 'vue'
import { createUserWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from 'firebase/auth'
import { getFirebaseAuth } from '@/infrastructure/api/firebaseClient'
import { groupRepository } from '@/infrastructure/repositories/groupRepository'
import { userRepository } from '@/infrastructure/repositories/userRepository'
import { useGroupStore } from '@/stores/groupStore'
import type { User } from '@/domain/entities/User'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)
  let initialization: Promise<void> | undefined

  function initialize(): Promise<void> {
    initialization ??= new Promise((resolve) => {
      loading.value = true
      onAuthStateChanged(getFirebaseAuth(), async () => {
        try {
          await synchronizeCurrentUser()
        } catch (err: unknown) {
          error.value = getErrorMessage(err, 'Unable to finish setting up your account.')
        } finally {
          // Router startup must always be released, even when Firebase rejects
          // a profile or personal-group request.
          initialized.value = true
          loading.value = false
          resolve()
        }
      })
    })

    return initialization
  }

  async function fetchCurrentUser() {
    loading.value = true
    error.value = null
    try {
      const currentUser = await userRepository.getCurrentUser()
      user.value = currentUser
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Unable to load your profile.')
    } finally {
      loading.value = false
    }
  }

  async function synchronizeCurrentUser() {
    await fetchCurrentUser()
    if (user.value) {
      await initializeGroups(user.value)
    } else {
      useGroupStore().reset()
    }
  }

  async function initializeGroups(currentUser: User) {
    const personalGroup = await groupRepository.ensurePersonalGroup(currentUser)
    const availableGroups = await groupRepository.getForUser(currentUser.id)
    const groups = availableGroups.some((group) => group.id === personalGroup.id)
      ? availableGroups
      : [personalGroup, ...availableGroups]

    useGroupStore().setAvailableGroups(groups, currentUser.id)
  }

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
      // Do not navigate until the profile and personal group are ready. The
      // auth-state callback runs independently and may not finish first.
      await synchronizeCurrentUser()
      if (!user.value) {
        error.value = 'Your account is signed in, but its profile could not be loaded.'
        return false
      }
      return true
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Unable to sign in.')
      return false
    } finally {
      loading.value = false
    }
  }

  async function loginWithGoogle() {
    loading.value = true
    error.value = null
    try {
      const credentials = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider())
      const existingProfile = await userRepository.getCurrentUser()
      if (existingProfile) {
        user.value = existingProfile
      } else {
        user.value = await userRepository.createProfile({
          id: credentials.user.uid,
          email: credentials.user.email ?? '',
          username: createUsername(credentials.user.email, credentials.user.uid),
          displayName: credentials.user.displayName,
          avatarUrl: credentials.user.photoURL,
          bio: null,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
      await initializeGroups(user.value)
      return true
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Unable to sign in with Google.')
      return false
    } finally {
      loading.value = false
    }
  }

  async function register(email: string, password: string, username: string) {
    loading.value = true
    error.value = null
    try {
      const credentials = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)
      await updateProfile(credentials.user, { displayName: username })
      const newUser: User = {
        id: credentials.user.uid,
        email: email,
        username: username,
        displayName: null,
        avatarUrl: null,
        bio: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      user.value = await userRepository.createProfile(newUser)
      await initializeGroups(user.value)
      return true
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Unable to create your account.')
      return false
    } finally {
      loading.value = false
    }
  }

  async function retryGroupSetup() {
    if (!user.value) return false

    loading.value = true
    error.value = null
    try {
      await initializeGroups(user.value)
      return true
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Unable to finish setting up your game table.')
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true
    try {
      await signOut(getFirebaseAuth())
      user.value = null
      useGroupStore().reset()
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Unable to sign out.')
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    error,
    initialized,
    initialize,
    login,
    loginWithGoogle,
    register,
    logout,
    fetchCurrentUser,
    retryGroupSetup
  }
})

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

function createUsername(email: string | null, userId: string): string {
  const localPart = email?.split('@')[0]?.replace(/[^a-zA-Z0-9_-]/g, '')
  return localPart || `player-${userId.slice(0, 8)}`
}
