<template>
  <UserTable />
  <!-- <UserTableLegacy /> -->
  <Teleport to="body"></Teleport>
</template>

<script setup lang="ts">
import UserTable from '@/components/UserTable.vue'
// import UserTableLegacy from '@/legacy/UserTableLegacy.vue'
</script>

<style>
* {
  box-sizing: border-box;
}
</style>
