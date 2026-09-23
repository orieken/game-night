# Coding Standards for AI Agents

## General Principles
- Follow clean code practices (SOLID, DRY, KISS)
- Write self-documenting code with clear names
- Keep functions small and focused (< 20 lines)
- Use TypeScript strictly (no `any` types)
- Prefer composition over inheritance
- Handle errors explicitly, never silently fail

## Vue 3 Specific
- Use Composition API exclusively
- Prefer `<script setup>` syntax
- Extract complex logic to composables
- Keep components under 200 lines
- Use `defineProps` and `defineEmits` with TypeScript
- Avoid direct DOM manipulation
- Use `ref` for primitives, `reactive` for objects

## Testing Requirements (TDD)
- **Write tests BEFORE implementation**
- Unit test coverage: > 80%
- Test file naming: `*.spec.ts` (unit), `*.test.ts` (integration)
- E2E tests for critical user flows
- Mock external dependencies
- Test edge cases and error scenarios
- Use descriptive test names: `it('should [expected behavior] when [condition]')`

## State Management (Pinia)
- Use Pinia for global state only
- Local state stays in components
- Actions for async operations
- Getters for derived state
- Define stores with TypeScript interfaces
- Keep stores focused (single responsibility)

## API Integration
- Repository pattern for data access
- DTOs for data transfer objects
- Error handling with custom error classes
- Loading and error states managed consistently
- Retry logic for transient failures
- Request/response interceptors for auth

## Naming Conventions
- **Components**: PascalCase (GameCard.vue)
- **Composables**: camelCase with `use` prefix (useGameNight.ts)
- **Stores**: camelCase with `use` suffix + `Store` (useGameNightStore.ts)
- **Constants**: UPPER_SNAKE_CASE
- **Interfaces**: PascalCase with `I` prefix (IGameNight) or descriptive name (GameNightData)
- **Types**: PascalCase (GameStatus)
- **Files**: kebab-case for non-component files (game-repository.ts)

## Code Organization
- One component per file
- Group related functionality in modules
- Index files for clean imports
- Separate business logic from presentation
- Utils for pure functions only

## Comments & Documentation
- JSDoc for public APIs
- Explain WHY, not WHAT
- TODO comments include ticket numbers
- Keep comments up-to-date with code changes

## Performance
- Lazy load routes and heavy components
- Debounce user input handlers
- Use computed properties for derived data
- Virtual scrolling for large lists
- Optimize images and assets

## Accessibility
- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Proper color contrast
- Focus management

## Example: Well-Structured Component

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { GameNight } from '@/types/gameNight'
import { useGameNightStore } from '@/stores/gameNightStore'

interface Props {
  gameNight: GameNight
  showActions?: boolean
}

interface Emits {
  (e: 'edit', id: string): void
  (e: 'delete', id: string): void
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true
})

const emit = defineEmits<Emits>()
const gameNightStore = useGameNightStore()

// Computed
const formattedDate = computed(() => {
  return new Date(props.gameNight.eventDate).toLocaleDateString()
})

const isUpcoming = computed(() => {
  return new Date(props.gameNight.eventDate) > new Date()
})

// Methods
const handleEdit = () => {
  emit('edit', props.gameNight.id)
}

const handleDelete = async () => {
  if (confirm('Are you sure you want to delete this game night?')) {
    await gameNightStore.deleteGameNight(props.gameNight.id)
    emit('delete', props.gameNight.id)
  }
}
</script>

<template>
  <article class="game-night-card" :class="{ upcoming: isUpcoming }">
    <header>
      <h3>{{ gameNight.name }}</h3>
      <time :datetime="gameNight.eventDate">{{ formattedDate }}</time>
    </header>

    <p v-if="gameNight.description">{{ gameNight.description }}</p>

    <footer v-if="showActions">
      <button
        @click="handleEdit"
        aria-label="Edit game night"
      >
        Edit
      </button>
      <button
        @click="handleDelete"
        class="danger"
        aria-label="Delete game night"
      >
        Delete
      </button>
    </footer>
  </article>
</template>

<style scoped>
.game-night-card {
  padding: 1.5rem;
  border-radius: 8px;
  background: var(--card-bg);
  box-shadow: var(--shadow-sm);
}

.game-night-card.upcoming {
  border-left: 4px solid var(--accent-color);
}

footer {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

button.danger {
  background: var(--danger-color);
  color: white;
}
</style>
```

## Example: Well-Structured Composable

```typescript
// useGameNight.ts
import { ref, computed } from 'vue'
import type { GameNight, CreateGameNightDto } from '@/types/gameNight'
import { gameNightRepository } from '@/infrastructure/repositories/gameNightRepository'

export function useGameNight() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const gameNight = ref<GameNight | null>(null)

  const isUpcoming = computed(() => {
    if (!gameNight.value) return false
    return new Date(gameNight.value.eventDate) > new Date()
  })

  const fetchGameNight = async (id: string): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      gameNight.value = await gameNightRepository.getById(id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch game night'
      console.error('Error fetching game night:', err)
    } finally {
      loading.value = false
    }
  }

  const createGameNight = async (dto: CreateGameNightDto): Promise<GameNight | null> => {
    loading.value = true
    error.value = null

    try {
      const created = await gameNightRepository.create(dto)
      gameNight.value = created
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create game night'
      console.error('Error creating game night:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    loading,
    error,
    gameNight,

    // Computed
    isUpcoming,

    // Methods
    fetchGameNight,
    createGameNight
  }
}
```

## Example: Well-Structured Store

```typescript
// gameNightStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GameNight, CreateGameNightDto } from '@/types/gameNight'
import { gameNightRepository } from '@/infrastructure/repositories/gameNightRepository'

export const useGameNightStore = defineStore('gameNight', () => {
  // State
  const gameNights = ref<GameNight[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const upcomingGameNights = computed(() => {
    return gameNights.value.filter(gn => new Date(gn.eventDate) > new Date())
  })

  const pastGameNights = computed(() => {
    return gameNights.value.filter(gn => new Date(gn.eventDate) <= new Date())
  })

  // Actions
  async function fetchGameNights(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      gameNights.value = await gameNightRepository.getAll()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch game nights'
      console.error('Error fetching game nights:', err)
    } finally {
      loading.value = false
    }
  }

  async function createGameNight(dto: CreateGameNightDto): Promise<GameNight | null> {
    loading.value = true
    error.value = null

    try {
      const created = await gameNightRepository.create(dto)
      gameNights.value.push(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create game night'
      console.error('Error creating game night:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function deleteGameNight(id: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      await gameNightRepository.delete(id)
      gameNights.value = gameNights.value.filter(gn => gn.id !== id)
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete game night'
      console.error('Error deleting game night:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    gameNights,
    loading,
    error,

    // Getters
    upcomingGameNights,
    pastGameNights,

    // Actions
    fetchGameNights,
    createGameNight,
    deleteGameNight
  }
})
```

## Error Handling Pattern

```typescript
// Custom error classes
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Usage in repository
export const gameNightRepository = {
  async create(dto: CreateGameNightDto): Promise<GameNight> {
    try {
      const response = await api.post('/game-nights', dto)
      return response.data
    } catch (err) {
      if (axios.isAxiosError(err)) {
        throw new ApiError(
          err.response?.data?.message || 'Failed to create game night',
          err.response?.status || 500,
          '/game-nights'
        )
      }
      throw err
    }
  }
}
```

## Commit Message Format

```
type(scope): subject

body

footer
```

**Types**: feat, fix, docs, style, refactor, test, chore
**Example**: `feat(game-night): add ability to invite players to events`
