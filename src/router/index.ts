import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import DashboardView from '@/views/dashboard/DashboardView.vue'
import GamesLibraryView from '@/views/games/GamesLibraryView.vue'
import GameDetailView from '@/views/games/GameDetailView.vue'
import GameFormView from '@/views/games/GameFormView.vue'
import CreateGameNightView from '@/views/game-nights/CreateGameNightView.vue'
import GameNightListView from '@/views/game-nights/GameNightListView.vue'
import GameNightDetailView from '@/views/game-nights/GameNightDetailView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import LeaderboardView from '@/views/leaderboard/LeaderboardView.vue'
import AcceptInviteView from '@/views/invites/AcceptInviteView.vue'
import UsersView from '@/views/users/UsersView.vue'
import UserProfileView from '@/views/users/UserProfileView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresGuest: true, title: 'Sign in' }
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { requiresGuest: true, title: 'Create account' }
    },
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true, title: 'Overview' }
    },
    {
      path: '/games',
      name: 'games-library',
      component: GamesLibraryView,
      meta: { requiresAuth: true, title: 'Game library' }
    },
    {
      path: '/games/new',
      name: 'game-create',
      component: GameFormView,
      meta: { requiresAuth: true, title: 'Add a game' }
    },
    {
      path: '/games/:id/edit',
      name: 'game-edit',
      component: GameFormView,
      meta: { requiresAuth: true, title: 'Edit game' }
    },
    {
      path: '/games/:id',
      name: 'game-detail',
      component: GameDetailView,
      meta: { requiresAuth: true, title: 'Game details' }
    },
    {
      path: '/game-nights',
      name: 'game-nights',
      component: GameNightListView,
      meta: { requiresAuth: true, title: 'Game nights' }
    },
    {
      path: '/game-nights/create',
      name: 'create-game-night',
      component: CreateGameNightView,
      meta: { requiresAuth: true, title: 'Create game night' }
    },
    {
      path: '/game-nights/:id',
      name: 'game-night-detail',
      component: GameNightDetailView,
      meta: { requiresAuth: true, title: 'Game night details' }
    },
    {
      path: '/invite/:code',
      name: 'accept-invite',
      component: AcceptInviteView,
      meta: { requiresAuth: true, title: 'Accept invitation' }
    },
    {
      path: '/users',
      name: 'users',
      component: UsersView,
      meta: { requiresAuth: true, title: 'Users' }
    },
    {
      path: '/profile',
      name: 'profile',
      component: UserProfileView,
      meta: { requiresAuth: true, title: 'Profile' }
    },
    {
      path: '/leaderboard',
      name: 'leaderboard',
      component: LeaderboardView,
      meta: { requiresAuth: true, title: 'Leaderboard' }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
      meta: { requiresAuth: true, title: 'Page not found' }
    }
  ]
})

let hasCompletedInitialNavigation = false

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    await authStore.initialize()
  }

  if (to.meta.requiresAuth && !authStore.user) {
    if (!authStore.user) {
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }
  }

  if (to.meta.requiresGuest && authStore.user) {
    next('/')
    return
  }

  next()
})

router.afterEach((to) => {
  document.title = `${String(to.meta.title ?? 'Game Night')} · Game Night`

  if (!hasCompletedInitialNavigation) {
    hasCompletedInitialNavigation = true
    return
  }

  window.requestAnimationFrame(() => {
    document.querySelector<HTMLElement>('#main-content')?.focus({ preventScroll: true })
  })
})

export default router
