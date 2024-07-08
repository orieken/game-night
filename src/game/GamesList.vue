<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Games</h1>
    <ul>
      <li v-for="game in gamesStore.games" :key="game.id" class="mb-2">
        <router-link
            :to="`/games/${game.id}`"
            class="block p-2 bg-white rounded hover:bg-gray-100"
        >
          {{ game.name }}
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { useGamesStore } from '../stores/games';

const gamesStore = useGamesStore();
</script>
