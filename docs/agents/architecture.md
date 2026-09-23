# Architecture Decision Records

## ADR-001: State Management with Pinia

**Status**: Accepted
**Date**: 2024-12-21

### Context
Need global state management for user session, game nights, leaderboard data, and real-time updates across components.

### Decision
Use Pinia for state management.

### Rationale
- Official Vue 3 state management solution
- TypeScript support out of the box
- Simpler API than Vuex (no mutations)
- Better DevTools integration
- Modular store design
- Composition API style aligns with Vue 3
- Lightweight (< 1KB)

### Consequences

**Positive**:
- Type-safe stores with minimal boilerplate
- Easy to test stores independently
- Hot module replacement works well
- Can use stores outside components

**Negative**:
- Learning curve for team members new to Pinia
- Need to establish clear boundaries between global and local state
- Migration path from Vuex requires effort (if applicable)

### Examples

```typescript
// Define a store
export const useGameNightStore = defineStore('gameNight', () => {
  const gameNights = ref<GameNight[]>([])
  const loading = ref(false)

  const upcomingGameNights = computed(() =>
    gameNights.value.filter(gn => new Date(gn.eventDate) > new Date())
  )

  async function fetchGameNights() {
    loading.value = true
    try {
      gameNights.value = await gameNightRepository.getAll()
    } finally {
      loading.value = false
    }
  }

  return { gameNights, loading, upcomingGameNights, fetchGameNights }
})
```

---

## ADR-002: Backend with Supabase

**Status**: Accepted
**Date**: 2024-12-21

### Context
Need backend infrastructure for authentication, database, real-time updates, file storage, and serverless functions for ML features.

### Decision
Use Supabase as primary backend-as-a-service.

### Rationale
- **PostgreSQL**: Robust relational database with full SQL support
- **Real-time subscriptions**: Built-in WebSocket support for live updates
- **Authentication**: Email/password, OAuth, magic links out of the box
- **Row-level security**: Database-level authorization
- **Edge functions**: Deno-based serverless functions for custom logic
- **Storage**: Built-in file storage with CDN
- **Free tier**: Generous limits suitable for MVP
- **Open source**: Can self-host if needed
- **Easy Netlify integration**: Works well with our deployment platform

### Alternatives Considered

**Firebase**:
- ❌ NoSQL may not fit our relational data model
- ❌ Vendor lock-in concerns
- ✅ Excellent real-time capabilities

**PocketBase**:
- ❌ Requires self-hosting infrastructure
- ❌ Less mature ecosystem
- ✅ Very lightweight and simple

### Consequences

**Positive**:
- Single backend service for all needs
- Strong TypeScript SDK
- Excellent local development experience
- Built-in auth reduces security risks
- Real-time updates enable collaborative features

**Negative**:
- Vendor lock-in to Supabase
- Need to learn Supabase-specific patterns (RLS policies, etc.)
- Migration complexity if switching providers later
- Edge functions use Deno (different from Node.js)

### Implementation Notes

```typescript
// Supabase client setup
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Real-time subscription example
supabase
  .channel('game-nights')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'game_nights' },
    (payload) => {
      console.log('Game night changed:', payload)
      // Update local state
    }
  )
  .subscribe()
```

---

## ADR-003: Testing Strategy

**Status**: Accepted
**Date**: 2024-12-21

### Context
Need comprehensive testing strategy that supports Test-Driven Development (TDD) while providing confidence in code quality and preventing regressions.

### Decision
Implement three-tier testing strategy:
- **Vitest** for unit and integration tests
- **Playwright** for end-to-end tests
- **Test-Driven Development** as required practice

### Rationale

**Vitest**:
- Vite-native (same build pipeline)
- Extremely fast (milliseconds for unit tests)
- Vue Testing Library integration
- Jest-compatible API (easy migration)
- ESM and TypeScript support
- Great DX with watch mode

**Playwright**:
- Cross-browser testing (Chromium, Firefox, WebKit)
- Reliable and fast E2E tests
- Great debugging tools (trace viewer)
- Auto-wait mechanisms (fewer flaky tests)
- Codegen for generating test scripts
- Mobile device emulation

**TDD Approach**:
- Forces better design through testability
- Documents expected behavior
- Catches regressions immediately
- Reduces debugging time
- Increases confidence for refactoring

### Testing Pyramid

```
       /\
      /E2E\     <- Critical user flows (Playwright)
     /------\      ~10-20 tests
    /  INT  \   <- Service integration (Vitest)
   /--------\     ~50-100 tests
  /   UNIT   \  <- Business logic (Vitest)
 /------------\   ~200-500 tests
```

### Coverage Requirements
- **Unit Tests**: 80%+ line coverage
- **Integration Tests**: All critical service paths
- **E2E Tests**: All primary user journeys

### Consequences

**Positive**:
- High confidence in code quality
- Fast feedback loop (unit tests in milliseconds)
- Easier refactoring with safety net
- Better API design through TDD
- Documentation through tests

**Negative**:
- Initial development slower due to TDD
- Test maintenance overhead
- E2E tests can be slower to run
- Learning curve for testing best practices

### Examples

**Unit Test (Vitest)**:
```typescript
import { describe, it, expect } from 'vitest'
import { calculateLeaderboardScore } from '@/domain/scoring'

describe('calculateLeaderboardScore', () => {
  it('should calculate total score from wins and participation', () => {
    const score = calculateLeaderboardScore({
      wins: 5,
      participations: 10,
      streaks: 2
    })

    expect(score).toBe(85) // 5*10 + 10*3 + 2*5
  })

  it('should return 0 for empty game history', () => {
    const score = calculateLeaderboardScore({
      wins: 0,
      participations: 0,
      streaks: 0
    })

    expect(score).toBe(0)
  })
})
```

**E2E Test (Playwright)**:
```typescript
import { test, expect } from '@playwright/test'

test('user can create game night and invite players', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[data-testid="email"]', 'user@example.com')
  await page.fill('[data-testid="password"]', 'password')
  await page.click('[data-testid="login-button"]')

  await page.goto('/game-nights/new')
  await page.fill('[data-testid="event-name"]', 'Friday Gaming')
  await page.fill('[data-testid="event-date"]', '2024-12-25')
  await page.click('[data-testid="create-button"]')

  await expect(page).toHaveURL(/\/game-nights\/\d+/)
  await expect(page.locator('h1')).toContainText('Friday Gaming')
})
```

---

## ADR-004: Clean Architecture Layers

**Status**: Accepted
**Date**: 2024-12-21

### Context
Need maintainable, testable, and scalable code structure that separates concerns and allows the application to evolve without major rewrites.

### Decision
Implement clean architecture with four distinct layers, following dependency inversion principle.

### Architecture Layers

```
┌─────────────────────────────────────┐
│  Presentation Layer                 │  <- Vue Components, Composables
│  (UI, User Interaction)             │
├─────────────────────────────────────┤
│  Application Layer                  │  <- Pinia Stores, Services
│  (Use Cases, Orchestration)         │
├─────────────────────────────────────┤
│  Domain Layer                       │  <- Entities, Business Rules
│  (Business Logic, Core)             │
├─────────────────────────────────────┤
│  Infrastructure Layer               │  <- API, Database, External Services
│  (External Dependencies)            │
└─────────────────────────────────────┘
```

### Layer Responsibilities

**1. Presentation Layer** (`/components`, `/composables`)
- Vue components for UI rendering
- Composables for reusable UI logic
- User input handling
- Display formatting
- **Dependencies**: Application layer (stores, services)

**2. Application Layer** (`/stores`, `/services`)
- Pinia stores for state management
- Application services for use case orchestration
- Coordinate domain and infrastructure
- **Dependencies**: Domain layer (entities, interfaces)

**3. Domain Layer** (`/domain`)
- Business entities and value objects
- Business rules and validation
- Domain services
- Interfaces (ports) for infrastructure
- **Dependencies**: NONE (pure TypeScript)

**4. Infrastructure Layer** (`/infrastructure`)
- API clients (Supabase, external APIs)
- Repository implementations
- Data mappers (API DTOs ↔ Domain entities)
- External service integrations
- **Dependencies**: Domain layer (implements interfaces)

### Dependency Rules

1. **Dependencies flow inward only**:
   - Presentation → Application → Domain ← Infrastructure

2. **Domain has no dependencies**:
   - Pure TypeScript/JavaScript
   - No framework-specific code
   - No external libraries

3. **Infrastructure implements domain interfaces**:
   - Dependency inversion principle
   - Domain defines contracts, infrastructure implements

### Rationale

- **Testability**: Each layer can be tested in isolation
- **Maintainability**: Changes in one layer don't ripple everywhere
- **Framework independence**: Can swap Vue for React without touching domain
- **Database independence**: Can change from Supabase to Firebase
- **Business logic clarity**: Core rules isolated from technical details

### Consequences

**Positive**:
- Highly testable (mock interfaces easily)
- Easy to refactor
- Business logic is portable
- Clear separation of concerns
- Onboarding easier (layers are self-explanatory)

**Negative**:
- More files and boilerplate initially
- Steeper learning curve for team
- May feel over-engineered for simple features
- Requires discipline to maintain boundaries

### Example Structure

```
/src
  /components
    /game-night
      GameNightCard.vue
      GameNightForm.vue
      GameNightList.vue

  /composables
    useGameNight.ts
    useLeaderboard.ts

  /stores
    gameNightStore.ts
    userStore.ts

  /services
    gameNightService.ts
    leaderboardService.ts

  /domain
    /entities
      GameNight.ts
      User.ts
      Game.ts
    /interfaces
      IGameNightRepository.ts
      IUserRepository.ts
    /services
      scoringService.ts
      recommendationService.ts

  /infrastructure
    /repositories
      gameNightRepository.ts
      userRepository.ts
    /api
      supabaseClient.ts
      apiClient.ts
    /mappers
      gameNightMapper.ts
```

### Code Examples

**Domain Entity**:
```typescript
// /domain/entities/GameNight.ts
export interface GameNight {
  id: string
  name: string
  eventDate: Date
  hostId: string
  status: 'upcoming' | 'in_progress' | 'completed'
}

export function isUpcoming(gameNight: GameNight): boolean {
  return gameNight.eventDate > new Date() && gameNight.status === 'upcoming'
}
```

**Domain Interface**:
```typescript
// /domain/interfaces/IGameNightRepository.ts
import type { GameNight } from '@/domain/entities/GameNight'

export interface IGameNightRepository {
  getAll(): Promise<GameNight[]>
  getById(id: string): Promise<GameNight | null>
  create(data: Omit<GameNight, 'id'>): Promise<GameNight>
  update(id: string, data: Partial<GameNight>): Promise<GameNight>
  delete(id: string): Promise<void>
}
```

**Infrastructure Implementation**:
```typescript
// /infrastructure/repositories/gameNightRepository.ts
import { supabase } from '@/infrastructure/api/supabaseClient'
import type { IGameNightRepository } from '@/domain/interfaces/IGameNightRepository'
import type { GameNight } from '@/domain/entities/GameNight'

export const gameNightRepository: IGameNightRepository = {
  async getAll(): Promise<GameNight[]> {
    const { data, error } = await supabase
      .from('game_nights')
      .select('*')

    if (error) throw error
    return data.map(mapToGameNight)
  },

  async getById(id: string): Promise<GameNight | null> {
    const { data, error } = await supabase
      .from('game_nights')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return mapToGameNight(data)
  },

  // ... other methods
}

function mapToGameNight(dto: any): GameNight {
  return {
    id: dto.id,
    name: dto.name,
    eventDate: new Date(dto.event_date),
    hostId: dto.host_id,
    status: dto.status
  }
}
```

**Application Layer (Store)**:
```typescript
// /stores/gameNightStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { gameNightRepository } from '@/infrastructure/repositories/gameNightRepository'
import type { GameNight } from '@/domain/entities/GameNight'

export const useGameNightStore = defineStore('gameNight', () => {
  const gameNights = ref<GameNight[]>([])

  async function fetchGameNights() {
    gameNights.value = await gameNightRepository.getAll()
  }

  return { gameNights, fetchGameNights }
})
```

---

## ADR-005: UI Component Library Selection

**Status**: Proposed
**Date**: 2024-12-21

### Context
Need to decide on UI component library approach for consistent design and faster development.

### Options

**Option 1: Custom Components with TailwindCSS**
- ✅ Full design control
- ✅ Lightweight bundle size
- ❌ More development time
- ❌ Need to build accessibility features

**Option 2: Vuetify**
- ✅ Material Design components
- ✅ Comprehensive component set
- ❌ Larger bundle size
- ❌ Material Design may not fit brand

**Option 3: PrimeVue**
- ✅ Unstyled mode available
- ✅ Good TypeScript support
- ✅ Comprehensive components
- ❌ Learning curve

**Option 4: Headless UI + TailwindCSS**
- ✅ Full style control
- ✅ Accessible by default
- ✅ Small bundle
- ❌ Less components out of box

### Decision
**TBD** - Evaluate based on chosen mockup design direction.

### Recommendation
If mockup 1 or 3 chosen → Custom + TailwindCSS
If mockup 2 or 4 chosen → Headless UI + TailwindCSS

---

## Future ADRs to Create

- ADR-006: API Rate Limiting Strategy
- ADR-007: File Upload Handling
- ADR-008: Internationalization Approach
- ADR-009: Analytics Integration
- ADR-010: Error Tracking Service
- ADR-011: ML Model Deployment Strategy
