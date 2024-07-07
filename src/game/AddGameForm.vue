<template>
  <div class="p-4 bg-white rounded shadow">
    <h1 class="text-xl font-bold mb-4">Add New Game</h1>
    <form @submit.prevent="addGame">
      <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="name">
          Game Name
        </label>
        <input id="name" v-model="game.name" type="text" required
               class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
      </div>
      <div class="mb-6">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="details">
          Details
        </label>
        <textarea id="details" v-model="game.details" required
                  class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"></textarea>
      </div>
      <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
        Add Game
      </button>
    </form>
  </div>
</template>

<script setup>
import { reactive } from 'vue';

const game = reactive({
  name: '',
  details: ''
});

function addGame() {
  // Assume a method to add a game to your store or API
  console.log('Adding game:', game);
  // Reset form
  game.name = '';
  game.details = '';
}
</script>
