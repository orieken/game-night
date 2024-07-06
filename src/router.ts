import { createRouter, createWebHistory } from 'vue-router';
import GamePage from './game/GamePage.vue';
import Games from './Games.vue';


const routes = [
  {
    path: '/games/:id',
    name: 'game',
    component: GamePage,
    props: true
  },
  {
    path: '/games',
    name: 'games',
    component: Games,
    props: true
  },
  {
    path: '/',
    component: Games,
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,

});

export default router;
