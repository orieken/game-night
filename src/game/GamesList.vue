<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Games</h1>
    <ul>
      <li v-for="game in games" :key="game.id" class="mb-2">
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
import { ref } from 'vue';

const games = ref([
    { id: 1, name: 'Catan', details: 'A strategy game of trade and resource management.', winners: [{ name: 'Oscar', date: '2021-10-01' }] },
    { id: 2, name: 'Risk', details: 'A classic game of military strategy.', winners: [{ name: 'Maria', date: '2021-10-02' }] },
    { id: 3, name: 'Monopoly', details: 'The famous real estate trading game.', winners: [{ name: 'John', date: '2021-10-03' }] },
    { id: 4, name: 'Scrabble', details: 'A word game where every letter counts.', winners: [{ name: 'Jane', date: '2021-10-04' }] },
    { id: 5, name: 'Chess', details: 'A two-player strategy board game.', winners: [{ name: 'Alice', date: '2021-10-05' }] },
    { id: 6, name: 'Blockus', details: 'A strategy game of blocking your opponents.', winners: [{ name: 'Bob', date: '2021-10-06' }] },
    { id: 7, name: 'Uno No Mercy', details: 'A card game of no mercy.', winners: [{ name: 'Eve', date: '2021-10-07' }] },
    { id: 8, name: 'Coup', details: 'A card game of deception.', winners: [{ name: 'Charlie', date: '2021-10-08' }] },
    { id: 9, name: 'Decodables', details: 'A card game of decoding.', winners: [{ name: 'David', date: '2021-10-09' }] }
]);

</script>
