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

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresGuest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { requiresGuest: true }
    },
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/games',
      name: 'games-library',
      component: GamesLibraryView,
      meta: { requiresAuth: true }
    },
    {
      path: '/games/new',
      name: 'game-create',
      component: GameFormView,
      meta: { requiresAuth: true }
    },
    {
      path: '/games/:id/edit',
      name: 'game-edit',
      component: GameFormView,
      meta: { requiresAuth: true }
    },
    {
      path: '/games/:id',
      name: 'game-detail',
      component: GameDetailView,
      meta: { requiresAuth: true }
    },
    {
      path: '/game-nights',
      name: 'game-nights',
      component: GameNightListView,
      meta: { requiresAuth: true }
    },
    {
      path: '/game-nights/create',
      name: 'create-game-night',
      component: CreateGameNightView,
      meta: { requiresAuth: true }
    },
    {
      path: '/game-nights/:id',
      name: 'game-night-detail',
      component: GameNightDetailView,
      meta: { requiresAuth: true }
    },
    {
      path: '/invite/:code',
      name: 'accept-invite',
      component: AcceptInviteView,
      meta: { requiresAuth: true }
    },
    {
      path: '/users',
      name: 'users',
      component: UsersView,
      meta: { requiresAuth: true }
    },
    {
      path: '/leaderboard',
      name: 'leaderboard',
      component: LeaderboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
      meta: { requiresAuth: true }
    }
  ]
})

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

export default router
