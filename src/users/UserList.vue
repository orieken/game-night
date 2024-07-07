<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Users</h1>
    <ul>
      <li v-for="user in users" :key="user.id" class="mb-2">
        <router-link :to="`/users/${user.id}`" class="block p-2 bg-white rounded hover:bg-gray-100">
          {{ user.username }}
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const users = ref([
  { id: 1, username: 'Oscar', gamesWon: [{ name: 'Catan', date: '2021-10-01' }] },
  { id: 2, username: 'Maria', gamesWon: [{ name: 'Risk', date: '2021-10-02' }] },
  { id: 3, username: 'John', gamesWon: [{ name: 'Monopoly', date: '2021-10-03' }] },
  { id: 4, username: 'Jane', gamesWon: [{ name: 'Scrabble', date: '2021-10-04' }] },
  { id: 5, username: 'Alice', gamesWon: [{ name: 'Chess', date: '2021-10-05' }] },
  { id: 6, username: 'Bob', gamesWon: [{ name: 'Blockus', date: '2021-10-06' }] },
  { id: 7, username: 'Eve', gamesWon: [{ name: 'Uno No Mercy', date: '2021-10-07' }] },
  { id: 8, username: 'Charlie', gamesWon: [{ name: 'Coup', date: '2021-10-08' }] },
  { id: 9, username: 'David', gamesWon: [{ name: 'Decodables', date: '2021-10-09' }] }
]);
</script>