# Project Structure & Setup Guide

## Recommended Project Structure

```
game-night-tracker/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Continuous Integration
│       └── deploy.yml             # Deployment workflow
├── docs/
│   ├── agents/
│   │   ├── coding-standards.md
│   │   ├── architecture.md
│   │   └── testing.md
│   ├── api-design.md
│   ├── database-schema.md
│   └── mockup-specifications.md
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   └── assets/
│       ├── images/
│       └── fonts/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.vue
│   │   │   ├── Card.vue
│   │   │   ├── Modal.vue
│   │   │   └── LoadingSpinner.vue
│   │   ├── game-night/
│   │   │   ├── GameNightCard.vue
│   │   │   ├── GameNightForm.vue
│   │   │   ├── GameNightList.vue
│   │   │   └── GameNightDetails.vue
│   │   ├── game/
│   │   │   ├── GameCard.vue
│   │   │   ├── GameSelector.vue
│   │   │   └── GameVoteForm.vue
│   │   ├── leaderboard/
│   │   │   ├── LeaderboardTable.vue
│   │   │   ├── LeaderboardFilters.vue
│   │   │   └── UserStatsCard.vue
│   │   ├── session/
│   │   │   ├── SessionTracker.vue
│   │   │   ├── ResultsForm.vue
│   │   │   └── SessionHistory.vue
│   │   └── layout/
│   │       ├── AppHeader.vue
│   │       ├── AppFooter.vue
│   │       ├── Sidebar.vue
│   │       └── MobileNav.vue
│   ├── composables/
│   │   ├── useGameNight.ts
│   │   ├── useGame.ts
│   │   ├── useSession.ts
│   │   ├── useLeaderboard.ts
│   │   ├── useAuth.ts
│   │   └── useToast.ts
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── gameNightStore.ts
│   │   ├── gameStore.ts
│   │   ├── sessionStore.ts
│   │   ├── leaderboardStore.ts
│   │   └── notificationStore.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── GameNight.ts
│   │   │   ├── Game.ts
│   │   │   ├── User.ts
│   │   │   ├── Session.ts
│   │   │   └── Achievement.ts
│   │   ├── interfaces/
│   │   │   ├── IGameNightRepository.ts
│   │   │   ├── IGameRepository.ts
│   │   │   ├── IUserRepository.ts
│   │   │   └── ISessionRepository.ts
│   │   └── services/
│   │       ├── scoringService.ts
│   │       ├── achievementService.ts
│   │       └── recommendationService.ts
│   ├── infrastructure/
│   │   ├── repositories/
│   │   │   ├── gameNightRepository.ts
│   │   │   ├── gameRepository.ts
│   │   │   ├── userRepository.ts
│   │   │   └── sessionRepository.ts
│   │   ├── api/
│   │   │   ├── supabaseClient.ts
│   │   │   ├── apiClient.ts
│   │   │   └── mlApiClient.ts
│   │   └── mappers/
│   │       ├── gameNightMapper.ts
│   │       ├── gameMapper.ts
│   │       └── userMapper.ts
│   ├── router/
│   │   ├── index.ts
│   │   ├── guards.ts
│   │   └── routes/
│   │       ├── auth.ts
│   │       ├── dashboard.ts
│   │       ├── gameNights.ts
│   │       └── leaderboard.ts
│   ├── services/
│   │   ├── gameNightService.ts
│   │   ├── notificationService.ts
│   │   └── analyticsService.ts
│   ├── utils/
│   │   ├── dateUtils.ts
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   ├── types/
│   │   ├── gameNight.ts
│   │   ├── game.ts
│   │   ├── user.ts
│   │   ├── session.ts
│   │   └── supabase.ts
│   ├── assets/
│   │   ├── styles/
│   │   │   ├── main.css
│   │   │   ├── variables.css
│   │   │   └── utilities.css
│   │   └── images/
│   ├── views/
│   │   ├── auth/
│   │   │   ├── LoginView.vue
│   │   │   ├── RegisterView.vue
│   │   │   └── ForgotPasswordView.vue
│   │   ├── dashboard/
│   │   │   └── DashboardView.vue
│   │   ├── game-nights/
│   │   │   ├── GameNightsListView.vue
│   │   │   ├── GameNightDetailView.vue
│   │   │   ├── CreateGameNightView.vue
│   │   │   └── EditGameNightView.vue
│   │   ├── games/
│   │   │   ├── GamesLibraryView.vue
│   │   │   └── GameDetailView.vue
│   │   ├── leaderboard/
│   │   │   └── LeaderboardView.vue
│   │   ├── profile/
│   │   │   ├── ProfileView.vue
│   │   │   └── EditProfileView.vue
│   │   └── NotFoundView.vue
│   ├── App.vue
│   └── main.ts
├── tests/
│   ├── unit/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── domain/
│   │   └── utils/
│   ├── integration/
│   │   ├── stores/
│   │   └── services/
│   └── e2e/
│       ├── auth.spec.ts
│       ├── gameNights.spec.ts
│       ├── leaderboard.spec.ts
│       └── helpers/
│           └── fixtures.ts
├── netlify/
│   ├── functions/
│   │   ├── recommend-games.ts
│   │   ├── suggest-teams.ts
│   │   └── optimal-schedule.ts
│   └── edge-functions/
├── .env.example
├── .env.local
├── .eslintrc.js
├── .gitignore
├── netlify.toml
├── package.json
├── playwright.config.ts
├── README.md
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

---

## Initial Setup

### Prerequisites
```bash
Node.js >= 20.x
npm >= 10.x
Git
```

### 1. Initialize Project
```bash
# Create project with Vite
npm create vite@latest game-night-tracker -- --template vue-ts

cd game-night-tracker

# Install dependencies
npm install
```

### 2. Install Core Dependencies
```bash
# Vue ecosystem
npm install vue-router@4 pinia

# Supabase
npm install @supabase/supabase-js

# UI/Styling (choose based on mockup)
npm install tailwindcss@latest postcss autoprefixer
npx tailwindcss init -p

# Utilities
npm install date-fns axios
```

### 3. Install Dev Dependencies
```bash
# Testing
npm install -D vitest @vitest/ui @vue/test-utils happy-dom
npm install -D @playwright/test

# Code Quality
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier eslint-plugin-vue

# Build Tools
npm install -D vite-plugin-vue-devtools
```

### 4. Setup Configuration Files

#### `vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000
  }
})
```

#### `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '**/*.spec.ts']
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
```

#### `playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

#### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path Mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

#### `.eslintrc.js`
```javascript
module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 2021,
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
  },
}
```

#### `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  VITE_SUPABASE_URL = "your-production-url"
  VITE_SUPABASE_ANON_KEY = "your-production-anon-key"

[context.deploy-preview.environment]
  VITE_SUPABASE_URL = "your-staging-url"
  VITE_SUPABASE_ANON_KEY = "your-staging-anon-key"
```

#### `.env.example`
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=Game Night Tracker
VITE_API_BASE_URL=https://your-project.supabase.co
```

#### `package.json` scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview",
    "test": "npm run test:unit && npm run test:e2e",
    "test:unit": "vitest",
    "test:unit:coverage": "vitest --coverage",
    "test:unit:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix --ignore-path .gitignore",
    "format": "prettier --write src/"
  }
}
```

---

## Supabase Setup

### 1. Create Supabase Project
```bash
# Go to https://supabase.com
# Create new project
# Copy URL and anon key to .env.local
```

### 2. Run Database Migrations
```sql
-- In Supabase SQL Editor
-- Run migrations from docs/database-schema.md
```

### 3. Configure Authentication
```bash
# In Supabase Dashboard > Authentication
# Enable Email provider
# Configure email templates
# Set up OAuth providers (optional)
```

### 4. Set Up Storage
```sql
-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Create policy
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
```

---

## GitHub Setup

### 1. Initialize Git
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/game-night-tracker.git
git push -u origin main
```

### 2. Create GitHub Actions Workflow

#### `.github/workflows/ci.yml`
```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm run test:unit:coverage

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## Netlify Setup

### 1. Connect Repository
```bash
# Go to https://app.netlify.com
# Click "Add new site" > "Import an existing project"
# Connect to GitHub repository
# Configure build settings (already in netlify.toml)
```

### 2. Add Environment Variables
```bash
# In Netlify Dashboard > Site settings > Environment variables
# Add all variables from .env.example
```

### 3. Enable Deploy Previews
```bash
# In Netlify Dashboard > Build & deploy > Deploy notifications
# Enable deploy previews for pull requests
```

---

## Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/game-night-crud
```

### 2. Write Tests First (TDD)
```bash
npm run test:unit:ui
# Write failing test
# Implement feature
# Test passes
```

### 3. Run All Tests
```bash
npm run test
```

### 4. Commit & Push
```bash
git add .
git commit -m "feat(game-night): add CRUD operations"
git push origin feature/game-night-crud
```

### 5. Create Pull Request
```bash
# On GitHub, create PR from feature branch to main
# Wait for CI to pass
# Request review
# Merge when approved
```

---

## First Feature: Authentication

### Step 1: Create Domain Entities
```typescript
// src/domain/entities/User.ts
export interface User {
  id: string
  email: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  createdAt: Date
}
```

### Step 2: Create Repository Interface
```typescript
// src/domain/interfaces/IUserRepository.ts
import type { User } from '@/domain/entities/User'

export interface IUserRepository {
  getCurrentUser(): Promise<User | null>
  updateProfile(userId: string, data: Partial<User>): Promise<User>
}
```

### Step 3: Implement Repository
```typescript
// src/infrastructure/repositories/userRepository.ts
import { supabase } from '@/infrastructure/api/supabaseClient'
import type { IUserRepository } from '@/domain/interfaces/IUserRepository'
import type { User } from '@/domain/entities/User'

export const userRepository: IUserRepository = {
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error

    return {
      id: data.id,
      email: data.email,
      username: data.username,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      createdAt: new Date(data.created_at)
    }
  },

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    // Implementation
  }
}
```

### Step 4: Create Store
```typescript
// src/stores/authStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userRepository } from '@/infrastructure/repositories/userRepository'
import type { User } from '@/domain/entities/User'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)

  async function fetchCurrentUser() {
    loading.value = true
    try {
      user.value = await userRepository.getCurrentUser()
    } finally {
      loading.value = false
    }
  }

  return { user, loading, fetchCurrentUser }
})
```

---

## Ready to Build!

You now have:
- ✅ Complete project structure
- ✅ Development environment configured
- ✅ Testing framework set up
- ✅ CI/CD pipeline ready
- ✅ Database schema designed
- ✅ API contracts defined
- ✅ Agent documentation for AI tools

**Next step**: Start building features using TDD! 🚀
