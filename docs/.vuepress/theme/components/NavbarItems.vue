<script setup>
import { ref } from 'vue';
import { DeviceType, useUpdateDeviceStatus } from '@theme/useUpdateDeviceStatus';
import { useNavbarConfig } from '@theme/useNavbarConfig';
import { useData } from '@theme/useData';
import VPAutoLink from '@theme/VPAutoLink.vue';
import VPNavbarDropdown from '@theme/VPNavbarDropdown.vue';
const items = useNavbarConfig();
const mobile = ref(false);
useUpdateDeviceStatus(DeviceType.Mobile, breakpoint => { mobile.value = window.innerWidth < breakpoint; });
const { routeLocale } = useData();
</script>
<template>
  <nav class="vp-navbar-items" :aria-label="routeLocale === '/zh/' ? '全站导航' : 'Site navigation'">
    <h2 class="site-nav-title">{{ routeLocale === '/zh/' ? '全站导航' : 'Site navigation' }}</h2>
    <div v-for="item in items" :key="item.text" class="vp-navbar-item">
      <VPNavbarDropdown v-if="item.children" :config="item" :class="{ mobile }" />
      <VPAutoLink v-else :config="item" />
    </div>
  </nav>
</template>
<style>
.vp-navbar-items { display: inline-flex; align-items: center; gap: 24px; }
.vp-navbar-item { position: relative; display: inline-block; line-height: var(--navbar-line-height); }
.vp-navbar-items .auto-link { color: var(--vp-c-text); }
.vp-navbar-items .auto-link:hover, .vp-navbar-items .route-link-active { color: var(--vp-c-accent); }
.site-nav-title { display: none; }
.vp-sidebar .site-nav-title { display: block; font-size: 14px; color: var(--vp-c-text-mute); margin: 12px 24px; border: 0; padding: 0; }
@media (max-width: 719px) { .vp-navbar-items { display: block; } .vp-navbar-item { display: block; margin: 0; } }
</style>
