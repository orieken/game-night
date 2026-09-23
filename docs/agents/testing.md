# Testing Strategy

## Test-Driven Development (TDD) Workflow

### Red-Green-Refactor Cycle
1. **Red**: Write a failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Improve code quality

### TDD Rules
- No production code without a failing test
- Write only enough test to fail
- Write only enough code to pass the test
- Refactor with confidence (tests protect you)

### Why TDD?
- **Better design**: Forces you to think about API before implementation
- **Documentation**: Tests describe expected behavior
- **Confidence**: Refactor without fear
- **Faster debugging**: Catch bugs immediately
- **Fewer regressions**: Breaking changes caught instantly

---

## Unit Testing (Vitest)

### What to Test
- Business logic in domain layer
- Composables and utilities
- Pinia store actions and getters
- Vue component logic (not DOM rendering)
- Data transformations and validators
- Complex algorithms

### What NOT to Test
- Third-party libraries
- Framework internals
- Simple getters/setters
- Configuration files

### Test File Structure
```typescript
// useGameScore.spec.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useGameScore } from '@/composables/useGameScore'

describe('useGameScore', () => {
  describe('calculateScore', () => {
    it('should calculate total score from wins and participation', () => {
      const { calculateScore } = useGameScore()

      const result = calculateScore({
        wins: 5,
        participations: 10,
        streaks: 2
      })

      expect(result).toBe(85) // 5*10 + 10*3 + 2*5
    })

    it('should return 0 for empty game history', () => {
      const { calculateScore } = useGameScore()

      const result = calculateScore({
        wins: 0,
        participations: 0,
        streaks: 0
      })

      expect(result).toBe(0)
    })

    it('should handle negative values gracefully', () => {
      const { calculateScore } = useGameScore()

      const result = calculateScore({
        wins: -1,
        participations: 5,
        streaks: 0
      })

      expect(result).toBe(15) // Wins treated as 0, participations * 3
    })
  })

  describe('getScoreBreakdown', () => {
    it('should provide detailed score breakdown', () => {
      const { getScoreBreakdown } = useGameScore()

      const result = getScoreBreakdown({
        wins: 3,
        participations: 8,
        streaks: 1
      })

      expect(result).toEqual({
        winPoints: 30,
        participationPoints: 24,
        streakBonus: 5,
        total: 59
      })
    })
  })
})
```

### Testing Vue Composables
```typescript
// useGameNight.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGameNight } from '@/composables/useGameNight'
import { gameNightRepository } from '@/infrastructure/repositories/gameNightRepository'

// Mock the repository
vi.mock('@/infrastructure/repositories/gameNightRepository')

describe('useGameNight', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch game night and update state', async () => {
    const mockGameNight = {
      id: '123',
      name: 'Test Night',
      eventDate: new Date('2024-12-25'),
      hostId: 'user-1',
      status: 'upcoming'
    }

    vi.mocked(gameNightRepository.getById).mockResolvedValue(mockGameNight)

    const { gameNight, loading, fetchGameNight } = useGameNight()

    expect(loading.value).toBe(false)
    expect(gameNight.value).toBeNull()

    await fetchGameNight('123')

    expect(loading.value).toBe(false)
    expect(gameNight.value).toEqual(mockGameNight)
    expect(gameNightRepository.getById).toHaveBeenCalledWith('123')
  })

  it('should handle errors when fetching fails', async () => {
    vi.mocked(gameNightRepository.getById).mockRejectedValue(
      new Error('Network error')
    )

    const { error, fetchGameNight } = useGameNight()

    await fetchGameNight('123')

    expect(error.value).toBe('Failed to fetch game night')
  })

  it('should set loading state during fetch', async () => {
    let resolvePromise: any
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    vi.mocked(gameNightRepository.getById).mockReturnValue(promise)

    const { loading, fetchGameNight } = useGameNight()

    const fetchPromise = fetchGameNight('123')

    expect(loading.value).toBe(true)

    resolvePromise({ id: '123', name: 'Test' })
    await fetchPromise

    expect(loading.value).toBe(false)
  })
})
```

### Testing Domain Logic
```typescript
// scoringService.spec.ts
import { describe, it, expect } from 'vitest'
import {
  calculateLeaderboardScore,
  determineRank,
  awardAchievement
} from '@/domain/services/scoringService'

describe('scoringService', () => {
  describe('calculateLeaderboardScore', () => {
    it('should calculate base score correctly', () => {
      const score = calculateLeaderboardScore({
        wins: 10,
        participations: 20,
        uniqueGamesPlayed: 5,
        winStreak: 3
      })

      expect(score).toBe(
        10 * 10 + // wins
        20 * 3 + // participation
        5 * 2 + // variety bonus
        3 * 5   // streak bonus
      )
    })

    it('should apply difficulty multipliers', () => {
      const score = calculateLeaderboardScore({
        wins: 5,
        participations: 10,
        difficultyPoints: {
          light: 2,
          medium: 2,
          heavy: 1
        }
      })

      expect(score).toBeGreaterThan(5 * 10 + 10 * 3)
    })
  })

  describe('determineRank', () => {
    it('should assign correct rank tiers', () => {
      expect(determineRank(0)).toBe('Novice')
      expect(determineRank(100)).toBe('Regular')
      expect(determineRank(500)).toBe('Enthusiast')
      expect(determineRank(1000)).toBe('Champion')
      expect(determineRank(2500)).toBe('Legend')
    })
  })

  describe('awardAchievement', () => {
    it('should award "First Win" achievement', () => {
      const result = awardAchievement({
        userId: 'user-1',
        wins: 1,
        totalGames: 1,
        achievements: []
      })

      expect(result).toContainEqual(
        expect.objectContaining({ name: 'First Win' })
      )
    })

    it('should not award duplicate achievements', () => {
      const result = awardAchievement({
        userId: 'user-1',
        wins: 1,
        totalGames: 1,
        achievements: [{ name: 'First Win', earnedAt: new Date() }]
      })

      expect(result.filter(a => a.name === 'First Win')).toHaveLength(1)
    })
  })
})
```

---

## Integration Testing (Vitest)

### What to Test
- Pinia stores with repository interactions
- Service layer orchestration
- Multi-step workflows
- API error handling
- State synchronization

### Testing Pinia Stores
```typescript
// gameNightStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameNightStore } from '@/stores/gameNightStore'
import { gameNightRepository } from '@/infrastructure/repositories/gameNightRepository'

vi.mock('@/infrastructure/repositories/gameNightRepository')

describe('GameNightStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should fetch game nights and update state', async () => {
    const mockGameNights = [
      { id: '1', name: 'Weekly Meetup', eventDate: new Date() },
      { id: '2', name: 'Tournament', eventDate: new Date() }
    ]

    vi.mocked(gameNightRepository.getAll).mockResolvedValue(mockGameNights)

    const store = useGameNightStore()

    expect(store.gameNights).toEqual([])

    await store.fetchGameNights()

    expect(store.gameNights).toEqual(mockGameNights)
    expect(store.loading).toBe(false)
    expect(gameNightRepository.getAll).toHaveBeenCalledOnce()
  })

  it('should handle errors when fetching fails', async () => {
    vi.mocked(gameNightRepository.getAll).mockRejectedValue(
      new Error('Network error')
    )

    const store = useGameNightStore()
    await store.fetchGameNights()

    expect(store.error).toBe('Failed to fetch game nights')
    expect(store.loading).toBe(false)
    expect(store.gameNights).toEqual([])
  })

  it('should create game night and add to state', async () => {
    const newGameNight = {
      name: 'New Event',
      eventDate: new Date('2024-12-25'),
      hostId: 'user-1'
    }

    const createdGameNight = {
      id: '3',
      ...newGameNight,
      status: 'upcoming'
    }

    vi.mocked(gameNightRepository.create).mockResolvedValue(createdGameNight)

    const store = useGameNightStore()
    const result = await store.createGameNight(newGameNight)

    expect(result).toEqual(createdGameNight)
    expect(store.gameNights).toContainEqual(createdGameNight)
  })

  it('should delete game night and remove from state', async () => {
    const store = useGameNightStore()
    store.gameNights = [
      { id: '1', name: 'Event 1' },
      { id: '2', name: 'Event 2' }
    ]

    vi.mocked(gameNightRepository.delete).mockResolvedValue()

    await store.deleteGameNight('1')

    expect(store.gameNights).toHaveLength(1)
    expect(store.gameNights[0].id).toBe('2')
  })

  describe('getters', () => {
    it('should filter upcoming game nights', () => {
      const store = useGameNightStore()
      const past = new Date('2020-01-01')
      const future = new Date('2025-12-31')

      store.gameNights = [
        { id: '1', name: 'Past Event', eventDate: past, status: 'completed' },
        { id: '2', name: 'Future Event', eventDate: future, status: 'upcoming' }
      ]

      expect(store.upcomingGameNights).toHaveLength(1)
      expect(store.upcomingGameNights[0].id).toBe('2')
    })
  })
})
```

### Testing Services
```typescript
// gameNightService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { gameNightService } from '@/services/gameNightService'
import { gameNightRepository } from '@/infrastructure/repositories/gameNightRepository'
import { notificationService } from '@/services/notificationService'

vi.mock('@/infrastructure/repositories/gameNightRepository')
vi.mock('@/services/notificationService')

describe('gameNightService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create game night and notify attendees', async () => {
    const dto = {
      name: 'Friday Night',
      eventDate: new Date('2024-12-25'),
      invitedUserIds: ['user-1', 'user-2']
    }

    const created = { id: '123', ...dto, status: 'upcoming' }
    vi.mocked(gameNightRepository.create).mockResolvedValue(created)

    await gameNightService.createWithInvites(dto)

    expect(gameNightRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Friday Night' })
    )
    expect(notificationService.sendInvitations).toHaveBeenCalledWith(
      '123',
      ['user-1', 'user-2']
    )
  })

  it('should rollback on notification failure', async () => {
    const dto = {
      name: 'Friday Night',
      eventDate: new Date('2024-12-25'),
      invitedUserIds: ['user-1']
    }

    vi.mocked(gameNightRepository.create).mockResolvedValue({
      id: '123',
      ...dto,
      status: 'upcoming'
    })
    vi.mocked(notificationService.sendInvitations).mockRejectedValue(
      new Error('Email service down')
    )

    await expect(
      gameNightService.createWithInvites(dto)
    ).rejects.toThrow()

    expect(gameNightRepository.delete).toHaveBeenCalledWith('123')
  })
})
```

---

## E2E Testing (Playwright)

### Local emulator-backed run

Run the browser suite with:

```bash
npm run test:e2e
```

To watch the same tests run in a visible Chromium window:

```bash
npm run test:e2e:headed
```

This command starts the Firebase Authentication and Firestore emulators, starts Vite on `127.0.0.1:4173` in E2E mode, seeds deterministic data, and runs Chromium. It clears emulator data at the beginning of every run and never connects to the production Firebase project.

The seeded login is:

- Email: `host@example.com`
- Password: `playwright123!`
- Table: `Playwright Table`

The seeder also creates an available one-player game named `Azul`. Tests should import shared values from `tests/e2e/seedData.ts` instead of duplicating credentials or fixture IDs.

### Critical User Flows to Test

1. **Authentication Flow**
   - User registration
   - User login
   - Password reset
   - Logout

2. **Game Night Flow**
   - Create event
   - Edit event
   - Invite players
   - Add games
   - Delete event

3. **Game Session Flow**
   - Start game session
   - Record results
   - Submit votes
   - View session history

4. **Leaderboard Flow**
   - View overall leaderboard
   - Filter by time period
   - View game-specific rankings
   - View user profile stats

5. **Social Features**
   - Add friends
   - View activity feed
   - React to posts
   - Leave comments

### E2E Test Examples

```typescript
// auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should register new user', async ({ page }) => {
    await page.goto('/register')

    await page.fill('[data-testid="email"]', 'newuser@example.com')
    await page.fill('[data-testid="username"]', 'newuser')
    await page.fill('[data-testid="password"]', 'SecurePass123!')
    await page.fill('[data-testid="confirm-password"]', 'SecurePass123!')

    await page.click('[data-testid="register-button"]')

    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('[data-testid="user-menu"]')).toContainText('newuser')
  })

  test('should show error for invalid email', async ({ page }) => {
    await page.goto('/register')

    await page.fill('[data-testid="email"]', 'invalid-email')
    await page.click('[data-testid="register-button"]')

    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('Please enter a valid email')
  })

  test('should login existing user', async ({ page }) => {
    await page.goto('/login')

    await page.fill('[data-testid="email"]', 'user@example.com')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')

    await expect(page).toHaveURL('/dashboard')
  })
})
```

```typescript
// gameNight.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Game Night Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'user@example.com')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
  })

  test('should create new game night', async ({ page }) => {
    await page.goto('/game-nights/new')

    await page.fill('[data-testid="event-name"]', 'Friday Night Gaming')
    await page.fill('[data-testid="event-date"]', '2024-12-25')
    await page.fill('[data-testid="location"]', 'Game Café Downtown')
    await page.fill('[data-testid="description"]', 'Weekly casual gaming')

    await page.click('[data-testid="create-button"]')

    await expect(page).toHaveURL(/\/game-nights\/\w+/)
    await expect(page.locator('h1')).toContainText('Friday Night Gaming')
  })

  test('should add game to event', async ({ page }) => {
    await page.goto('/game-nights/test-event-id')

    await page.click('[data-testid="add-game-button"]')
    await page.selectOption('[data-testid="game-select"]', 'Catan')
    await page.click('[data-testid="confirm-add-game"]')

    await expect(page.locator('[data-testid="game-list"]'))
      .toContainText('Catan')
  })

  test('should record game results', async ({ page }) => {
    await page.goto('/game-nights/test-event-id')

    await page.click('[data-testid="start-session-button"]')
    await page.selectOption('[data-testid="game-select"]', 'Catan')
    await page.click('[data-testid="start-game"]')

    // Simulate game play
    await page.waitForTimeout(1000)

    await page.click('[data-testid="end-game-button"]')
    await page.selectOption('[data-testid="winner-select"]', 'Alice')
    await page.click('[data-testid="save-result"]')

    await expect(page.locator('[data-testid="session-results"]'))
      .toContainText('Alice - Winner')
  })

  test('should vote on games', async ({ page }) => {
    await page.goto('/game-nights/test-event-id/vote')

    const gameCards = page.locator('[data-testid="game-vote-card"]')
    const firstCard = gameCards.first()

    await firstCard.locator('[data-testid="rating-5"]').click()
    await firstCard.locator('[data-testid="comment"]').fill('Great game!')

    await page.click('[data-testid="submit-votes"]')

    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('Votes submitted successfully')
  })
})
```

```typescript
// leaderboard.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Leaderboard', () => {
  test('should display overall leaderboard', async ({ page }) => {
    await page.goto('/leaderboard')

    const rows = page.locator('[data-testid="leaderboard-row"]')
    await expect(rows).toHaveCount(10) // Top 10 players

    const firstPlace = rows.first()
    await expect(firstPlace).toContainText('1')
    await expect(firstPlace.locator('[data-testid="trophy"]')).toBeVisible()
  })

  test('should filter by time period', async ({ page }) => {
    await page.goto('/leaderboard')

    await page.selectOption('[data-testid="period-filter"]', 'monthly')

    await expect(page.locator('[data-testid="period-label"]'))
      .toContainText('Monthly Leaders')
  })

  test('should navigate to user profile', async ({ page }) => {
    await page.goto('/leaderboard')

    await page.click('[data-testid="leaderboard-row"]:first-child [data-testid="username"]')

    await expect(page).toHaveURL(/\/users\/\w+/)
    await expect(page.locator('[data-testid="user-stats"]')).toBeVisible()
  })
})
```

### Page Object Model

```typescript
// pages/LoginPage.ts
import { Page, Locator } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly loginButton: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.locator('[data-testid="email"]')
    this.passwordInput = page.locator('[data-testid="password"]')
    this.loginButton = page.locator('[data-testid="login-button"]')
    this.errorMessage = page.locator('[data-testid="error-message"]')
  }

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.loginButton.click()
  }

  async expectError(message: string) {
    await expect(this.errorMessage).toContainText(message)
  }
}

// Usage in test
test('should login with valid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.login('user@example.com', 'password123')
  await expect(page).toHaveURL('/dashboard')
})
```

### E2E Best Practices

1. **Use data-testid attributes**: Avoid brittle CSS selectors
2. **Test user workflows**: Not implementation details
3. **Keep tests independent**: Each test should run in isolation
4. **Use fixtures**: Set up test data consistently
5. **Visual regression testing**: Screenshot comparison for UI
6. **Mobile testing**: Test responsive layouts
7. **Accessibility testing**: Use axe-playwright

---

## Test Coverage Goals

### Coverage Targets
- **Overall**: 80%+ line coverage
- **Domain Layer**: 95%+ (critical business logic)
- **Application Layer**: 85%+ (stores, services)
- **Infrastructure**: 70%+ (repository implementations)
- **Presentation**: 60%+ (complex composables)

### Running Coverage Reports
```bash
# Generate coverage report
npm run test:unit:coverage

# View HTML report
open coverage/index.html
```

---

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit:coverage

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

## Testing Checklist

### Before Committing Code
- [ ] All tests pass locally
- [ ] New features have unit tests
- [ ] Critical paths have E2E tests
- [ ] Coverage meets requirements (80%+)
- [ ] No skipped/disabled tests without justification
- [ ] Test names are descriptive
- [ ] Edge cases are tested
- [ ] Error scenarios are tested

### Before Deploying
- [ ] All CI tests pass
- [ ] E2E tests pass on staging
- [ ] Performance tests acceptable
- [ ] No flaky tests in suite
- [ ] Coverage report reviewed

---

## Common Testing Patterns

### Async Testing
```typescript
it('should handle async operations', async () => {
  const promise = fetchData()
  await expect(promise).resolves.toEqual(expectedData)
})

it('should handle rejected promises', async () => {
  const promise = fetchData()
  await expect(promise).rejects.toThrow('Error message')
})
```

### Timer Testing
```typescript
import { vi } from 'vitest'

it('should execute after delay', () => {
  vi.useFakeTimers()

  const callback = vi.fn()
  setTimeout(callback, 1000)

  vi.advanceTimersByTime(1000)
  expect(callback).toHaveBeenCalled()

  vi.useRealTimers()
})
```

### Snapshot Testing
```typescript
it('should match snapshot', () => {
  const data = generateComplexData()
  expect(data).toMatchSnapshot()
})
```

### Testing Hooks
```typescript
describe('with lifecycle', () => {
  beforeAll(() => {
    // Runs once before all tests
  })

  beforeEach(() => {
    // Runs before each test
  })

  afterEach(() => {
    // Runs after each test
  })

  afterAll(() => {
    // Runs once after all tests
  })
})
```
