<template>
  <div class="flex min-h-screen bg-gray-100">
    <!-- Left Column for Games List -->
    <div class="w-1/4 bg-white shadow">
      <div class="sticky top-0 p-4 bg-white">
        <router-link to="/games" class="text-blue-500 hover:text-blue-700">All Games</router-link>
        <h1 class="text-xl font-bold text-gray-900 mt-2">Board Games</h1>
      </div>
      <ul class="overflow-auto h-screen">
        <li v-for="game in games" :key="game.id">
          <router-link
              :to="`/games/${game.id}`"
              class="block p-4 hover:bg-gray-50 transition-colors"
          >
            {{ game.name }}
          </router-link>
        </li>
      </ul>
    </div>

    <!-- Right Column for Game Details -->
    <div class="w-3/4 p-10 overflow-auto">
      <router-view/>
    </div>
  </div>
</template>


<script setup>
import { onMounted, reactive } from 'vue';
import Games from './Games.vue';

const games = reactive([]);
const currentGame = reactive({
  id: 1,
  name: 'Catan',
  details: 'A strategy game of trade and resource management.',
  winners: []
});


const sampleGames = [
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

async function fetchGames() {
  // use sample games as the mocked response for this function
  Object.assign(games, sampleGames);
}

onMounted(async () => {
  await fetchGames();
  console.log('Games:', games);
});
</script>