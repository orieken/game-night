<template>
  <div class="bg-gray-100 flex items-center justify-center">
    <div v-if="currentGame" class="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
      <h2 class="text-2xl font-bold mb-2">{{ currentGame.name }}</h2>
      <p class="mb-4">{{ currentGame.details }}</p>
      <h2 class="text-xl font-semibold">Winners</h2>
      <ul>
        <li v-for="winner in currentGame.winners" :key="winner.nickname" class="list-disc ml-5">
          {{ winner.name }} - {{ winner.date }}
        </li>
      </ul>
    </div>
    <div v-else class="text-center p-8 bg-white rounded-lg shadow-lg max-w-lg w-full">
      <p>Loading game details...</p>
    </div>
  </div>
</template>

<script setup>

import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

function fetchGameDetails(id) {
  const games = [
    { id: 1, name: 'Catan', details: 'A strategy game of trade and resource management.', winners: [{ name: 'Oscar', date: '2021-10-01' }] },
    { id: 2, name: 'Risk', details: 'A classic game of military strategy.', winners: [{ name: 'Maria', date: '2021-10-02' }] },
    { id: 3, name: 'Monopoly', details: 'The famous real estate trading game.', winners: [{ name: 'John', date: '2021-10-03' }] },
    { id: 4, name: 'Scrabble', details: 'A word game where every letter counts.', winners: [{ name: 'Jane', date: '2021-10-04' }] },
    { id: 5, name: 'Chess', details: 'A two-player strategy board game.', winners: [{ name: 'Alice', date: '2021-10-05' }] },
    { id: 6, name: 'Blockus', details: 'A strategy game of blocking your opponents.', winners: [{ name: 'Bob', date: '2021-10-06' }] },
    { id: 7, name: 'Uno No Mercy', details: 'A card game of no mercy.', winners: [{ name: 'Eve', date: '2021-10-07' }] },
    { id: 8, name: 'Coup', details: 'A card game of deception.', winners: [{ name: 'Charlie', date: '2021-10-08' }] },
    { id: 9, name: 'Decodables', details: 'A card game of decoding.', winners: [{ name: 'David', date: '2021-10-09' }] }
  ];
  const users = [
    { id: 1, username: 'Oscar', gamesWon: [ { name: 'Catan', date: '2021-10-01' }] },
    { id: 2, username: 'Maria', gamesWon: [ { name: 'Risk', date: '2021-10-02' }] },
    { id: 3, username: 'John', gamesWon: [ { name: 'Monopoly', date: '2021-10-03' }] },
    { id: 4, username: 'Jane', gamesWon: [ { name: 'Scrabble', date: '2021-10-04' }] },
    { id: 5, username: 'Alice', gamesWon: [ { name: 'Chess', date: '2021-10-05' }] },
    { id: 6, username: 'Bob', gamesWon: [ { name: 'Blockus', date: '2021-10-06' }] },
    { id: 7, username: 'Eve', gamesWon: [ { name: 'Uno No Mercy', date: '2021-10-07' }] },
    { id: 8, username: 'Charlie', gamesWon: [ { name: 'Coup', date: '2021-10-08' }] },
    { id: 9, username: 'David', gamesWon: [ { name: 'Decodables', date: '2021-10-09' }] }
  ]
  return new Promise(resolve => {
    setTimeout(() => {
      const game = games.find(game => game.id === parseInt(id));
      resolve(game);
    }, 200);
  });
}

const currentGame = ref(null);
const route = useRoute();

onMounted(async () => {
  currentGame.value = await fetchGameDetails(route.params.id);
});

watch(() => route.params.id, async (newId) => {
  currentGame.value = await fetchGameDetails(newId);
});
</script>
