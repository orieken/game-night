<template>
  <div class="bg-gray-100 flex items-center justify-center">
    <div v-if="user" class="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
      <h2 class="text-2xl font-bold mb-2">{{ user.name }}</h2>
      <p class="mb-4">{{ user.name }}</p>
      <h2 class="text-xl font-semibold">Games Won</h2>
      <ul>
        <li v-for="game in user.gamesWon" :key="game.date">
          {{ game.name }} - {{ game.date }}
        </li>
      </ul>
    <form @submit.prevent="addGameWon">
      <select v-model="selectedGame" class="mb-2">
        <option v-for="game in games" :key="game.id" :value="game.name">{{ game.name }}</option>
      </select>
      <input type="date" v-model="gameDate" class="mb-2">
      <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Add Game</button>
    </form>
    </div>
    <div v-else class="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full text-center">
      <p>Select an item to view details</p>
<!--      <img src="/path/to/placeholder-image.png" alt="Placeholder" class="mx-auto">-->
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { computed, ref } from 'vue';

import { useUsersStore } from '../stores/users';
import { useGamesStore } from '../stores/games';

const usersStore = useUsersStore();
const gamesStore = useGamesStore();
const route = useRoute();

const user = computed(() => usersStore.getUserById(parseInt(route.params.id)));
const games = computed(() => gamesStore.games);
const selectedGame = ref('');
const gameDate = ref('');

function addGameWon() {
  if (selectedGame.value && gameDate.value) {
    usersStore.addGameWon(user.value.id, { name: selectedGame.value, date: gameDate.value });
    selectedGame.value = ''; // Reset after adding
    gameDate.value = '';    // Reset after adding
  }
}
</script>
