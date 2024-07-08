<template>
  <div class="bg-gray-100 flex items-center justify-center">
    <div v-if="game" class="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
      <h2 class="text-2xl font-bold mb-2">{{ game.name }}</h2>
      <p class="mb-4">{{ game.details }}</p>
      <h2 class="text-xl font-semibold">Winners</h2>
      <ul>
        <li v-for="winner in game.winners" :key="winner.nickname" class="list-disc ml-5">
          {{ winner.name }} - {{ winner.date }}
        </li>
      </ul>
      <form @submit.prevent="addWinner">
        <input type="text" v-model="winnerName" placeholder="Enter winner's name">
        <button type="submit">Add Winner</button>
      </form>
    </div>
    <div v-else class="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full text-center">
      <p>Select an item to view details</p>
<!--      <img src="/path/to/placeholder-image.png" alt="Placeholder" class="mx-auto">-->
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useGamesStore } from '../stores/games';
import { formatDate } from '../utils/date';

const gamesStore = useGamesStore();
const route = useRoute();
const winnerName = ref('');

const game = computed(() => gamesStore.getGameById(parseInt(route.params.id)));

function addWinner() {
  const today = new Date();
  gamesStore.addWinner(game.value.id, { name: winnerName.value, date: formatDate(today) });
  winnerName.value = '';
}
</script>
