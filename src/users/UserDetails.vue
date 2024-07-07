<template>
  <div class="bg-gray-100 flex items-center justify-center">
    <div v-if="user" class="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
      <h2 class="text-2xl font-bold mb-2">{{ user.username }}</h2>
      <p class="mb-4">{{ user.username }}</p>
      <h2 class="text-xl font-semibold">Games Won</h2>
      <ul>
        <li v-for="game in user.gamesWon" :key="game.date">
          {{ game.name }} - {{ game.date }}
        </li>
      </ul>
    </div>
    <div v-else class="text-center p-8 bg-white rounded-lg shadow-lg max-w-lg w-full">
      <p>Loading user details...</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const users = [
  { id: 1, username: 'Oscar', gamesWon: [{ name: 'Catan', date: '2021-10-01' }] },
  { id: 2, username: 'Maria', gamesWon: [{ name: 'Risk', date: '2021-10-02' }] },
  { id: 3, username: 'John', gamesWon: [{ name: 'Monopoly', date: '2021-10-03' }] },
  { id: 4, username: 'Jane', gamesWon: [{ name: 'Scrabble', date: '2021-10-04' }] },
  { id: 5, username: 'Alice', gamesWon: [{ name: 'Chess', date: '2021-10-05' }] },
  { id: 6, username: 'Bob', gamesWon: [{ name: 'Blockus', date: '2021-10-06' }] },
  { id: 7, username: 'Eve', gamesWon: [{ name: 'Uno No Mercy', date: '2021-10-07' }] },
  { id: 8, username: 'Charlie', gamesWon: [{ name: 'Coup', date: '2021-10-08' }] },
  { id: 9, username: 'David', gamesWon: [{ name: 'Decodables', date: '2021-10-09' }] }
];

function getUserDetails(id) {
  return new Promise(resolve => {
    setTimeout(() => {
      const user = users.find(user => user.id === parseInt(id));
      resolve(user);
    }, 200);
  });
}

const user = ref(null);
const route = useRoute();

onMounted(async () => {
  user.value = await getUserDetails(route.params.id);
});

watch(() => route.params.id, async (newId) => {
  user.value = await getUserDetails(newId);
});

</script>
