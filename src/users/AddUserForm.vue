<template>
  <div class="p-4 bg-white rounded shadow">
    <h1 class="text-xl font-bold mb-4">Add New User</h1>
    <form @submit.prevent="addUser">
      <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="username">
          Username
        </label>
        <input id="username" v-model="user.username" type="text" required
               class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
      </div>
      <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
        Add User
      </button>
    </form>
  </div>
</template>

<script setup>
import { reactive } from 'vue';

const user = reactive({
  username: ''
});

function addUser() {
  // Assume a method to add a user to your store or API
  console.log('Adding user:', user);
  // Reset form
  user.username = '';
}
</script>
