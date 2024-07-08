<template>
  <div class="p-4 bg-white rounded shadow">
    <h1 class="text-xl font-bold mb-4">Add New User</h1>
    <form @submit.prevent="handleAddUser">
      <div class="mb-4">
        <label for="username" class="block text-gray-700 text-sm font-bold mb-2">Username</label>
        <input id="username" v-model="username" type="text" required
               class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
      </div>
      <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
        Add User
      </button>
      <p v-if="error" class="text-red-500 text-xs italic mt-2">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useUsersStore } from '../stores/users';

const username = ref('');
const error = ref('');
const usersStore = useUsersStore();

function handleAddUser() {
  const trimmedUsername = username.value.trim();
  if (!trimmedUsername) {
    error.value = 'Please enter a valid username.';
    return;
  }
  const success = usersStore.addUser(trimmedUsername);
  if (!success) {
    error.value = 'User already exists!';
  } else {
    error.value = '';
    username.value = '';
    alert('User added successfully!');
  }
}
</script>
