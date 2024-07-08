<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Users</h1>
    <ul>
      <li v-for="user in usersStore.users" :key="user.id" class="mb-2">
        <router-link
            :to="`/users/${user.id}`"
            class="block p-2 bg-white rounded hover:bg-gray-100"
        >
          {{ user.name }}
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { useUsersStore } from '../stores/users';

const usersStore = useUsersStore();
</script>