<script setup>
import { computed } from 'vue';
import { useData } from '@theme/useData';
import { useNavbarSelectLanguage } from '@theme/useNavbarSelectLanguage';
const { routeLocale } = useData();
const languages = useNavbarSelectLanguage();
const other = computed(() => languages.value[0]?.children.find(item => item.activeMatch !== '.'));
</script>
<template><a v-if="other" class="language" :href="other.link" :lang="routeLocale === '/zh/' ? 'en' : 'zh'" :aria-label="routeLocale === '/zh/' ? '切换至英文' : 'Switch to Chinese'">{{ routeLocale === '/zh/' ? 'EN' : '中文' }}</a></template>
<style>.vp-navbar .language { display: inline-flex; min-width: 44px; min-height: 44px; align-items: center; justify-content: center; color: var(--vp-c-text); margin-inline: 12px; }</style>
