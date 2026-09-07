<script setup>
import { inject } from 'vue';
import { useData } from '@theme/useData';
defineEmits(['toggle']);
const open = inject('site-menu-open', false);
const { routeLocale } = useData();
</script>
<template><button type="button" class="vp-toggle-sidebar-button menu-button" :aria-label="routeLocale === '/zh/' ? '全站菜单' : 'Site menu'" :aria-expanded="open" aria-controls="site-sidebar" @click="$emit('toggle')"><span aria-hidden="true">{{ open ? '✕' : '☰' }}</span></button></template>
<style>
.vp-toggle-sidebar-button { display: none; position: absolute; left: 12px; top: 10px; width: 44px; height: 44px; padding: 0; border: 0; background: transparent; color: var(--vp-c-text); font: 24px system-ui; cursor: pointer; }
.vp-toggle-sidebar-button:focus-visible { outline: 2px solid var(--vp-c-accent); outline-offset: 2px; }
@media (max-width: 719px) { .vp-toggle-sidebar-button { display: block; } }
</style>
