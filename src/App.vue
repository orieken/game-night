<template>
  <div>
    <!-- Sticky Navbar -->
    <div class="bg-gray-800 text-white p-4 sticky top-0 z-50">
      <router-link to="/games" class="mr-6 hover:text-gray-300">Games</router-link>
      <router-link to="/add-game" class="mr-6 hover:text-gray-300 btn">Add Game</router-link>
      <router-link to="/users" class="mr-6 hover:text-gray-300">Users</router-link>
      <router-link to="/add-user" class="mr-6 hover:text-gray-300 btn">Add User</router-link>
    </div>

    <!-- Main Content Area -->
    <div class="flex min-h-screen">
      <div class="w-1/3 bg-white p-4 overflow-auto">
        <router-view name="list" />
      </div>
      <div class="w-2/3 bg-gray-100 p-4 overflow-auto">
        <router-view name="details" />
      </div>
    </div>
  </div>
</template>



<script setup>
import { onMounted, reactive } from 'vue';
import Games from './game/GamesList.vue';

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