<script setup>
defineProps({ external: Boolean });
</script>

<template>
  <svg class="link-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    <path v-if="external" d="M5 19 19 5M5 5h14v14" />
    <path v-else d="M4 12h16m-6-6 6 6-6 6" />
  </svg>
</template>

<style scoped>
.link-arrow { display: inline-block; width: 1em; height: 1em; flex: none; vertical-align: -.125em; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
</style>
