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
</script>