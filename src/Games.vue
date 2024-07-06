<template>
  <div class="min-h-screen bg-gray-100 flex flex-col items-center pt-10">
    <h1 class="text-4xl font-bold text-gray-900 mb-5">Board Games</h1>
    <ul class="w-full max-w-4xl">
      <li v-for="game in games" :key="game.id" class="mb-4">
        <router-link
            :to="`/game/${game.id}`"
            class="block p-4 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors"
        >
          <h2 class="text-xl font-semibold">{{ game.name }}</h2>
        </router-link>
      </li>
    </ul>
  </div>
</template>


<script setup>
defineProps(['games']);

</script>
