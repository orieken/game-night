import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import UserDetails from './users/UserDetails.vue';
import UserList from './users/UserList.vue';
import GamesList from './game/GamesList.vue';
import GameDetails from './game/GameDetails.vue';
import Home from './Home.vue';
import AddGameForm from './game/AddGameForm.vue';
import AddUserForm from './users/AddUserForm.vue';


const routes: RouteRecordRaw[] = [
  { path: '/',
    components: {
      default: Home,
      list: GamesList,
      details: Home
    }
  },
  { path: '/games',
    components: {
      list: GamesList,
      details: GameDetails
    }
  },
  { path: '/games/:id',
    components: {
      list: GamesList,
      details: GameDetails
    }
  },
  {
    path: '/users',
    components: {
      list: UserList,
      details: UserDetails
    }
  },
  {
    path: '/users/:id',
    components: {
      list: UserList,
      details: UserDetails
    }
  },
  {
    path: '/add-game',
    components: {
      default: GamesList, // Optional: Provide a default view if needed
      list: GamesList,
      details: AddGameForm
    }
  },
  {
    path: '/add-user',
    components: {
      default: UserList, // Optional: Provide a default view if needed
      list: UserList,
      details: AddUserForm
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
