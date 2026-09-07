<script setup>
import { ref, provide, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { onContentUpdated } from 'vuepress/client';
import VPSidebar from '@theme/VPSidebar.vue';
import ParentLayout from '@vuepress/theme-default/layouts/Layout.vue';
import { useData } from '@theme/useData';
import { useSidebarItems } from '@theme/useSidebarItems';
import LanguageLink from './LanguageLink.vue';
const layout = ref(null);
const open = ref(false);
const { routeLocale } = useData();
const items = useSidebarItems();
provide('site-menu-open', open);
let observer, media, previousOverflow = '';
const root = () => layout.value?.$el;
const button = () => root()?.querySelector('.vp-toggle-sidebar-button');
const close = (restore = false) => { if (open.value) button()?.click(); if (restore) button()?.focus(); };
async function revealCurrentArticle() {
  await nextTick();
  const sidebar = root()?.querySelector('.vp-sidebar');
  if (!sidebar || (media?.matches && !open.value)) return;
  const current = sidebar.querySelector('.vp-sidebar-items a.route-link-active');
  if (!current) return;
  const box = sidebar.getBoundingClientRect(), item = current.getBoundingClientRect();
  const top = Math.max(box.top, 64);
  if (item.top < top || item.bottom > box.bottom) sidebar.scrollTop += item.top - top - 24;
}
onContentUpdated(revealCurrentArticle);
function sync() {
  const el = root(); if (!el) return;
  open.value = el.classList.contains('sidebar-open');
  const mobile = media.matches;
  const sidebar = el.querySelector('.vp-sidebar');
  if (sidebar) { sidebar.inert = mobile && !open.value; }
  const content = el.querySelector('.vp-page, .homepage');
  if (content) content.inert = mobile && open.value;
  document.body.style.overflow = mobile && open.value ? 'hidden' : previousOverflow;
  revealCurrentArticle();
}
function navigate(event) { if (event.target.closest('.vp-sidebar a')) close(); }
function resize() { if (!media.matches) close(); sync(); }
function keydown(event) {
  if (!media?.matches || !open.value) return;
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
  if (event.key === 'Tab') {
    const elements = [...root().querySelectorAll('.vp-navbar a, .vp-navbar button, .vp-sidebar a, .vp-sidebar button')].filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden' && !el.disabled);
    const first = elements[0], last = elements.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
}
onMounted(() => {
  previousOverflow = document.body.style.overflow;
  media = matchMedia('(max-width: 719px)');
  observer = new MutationObserver(sync); observer.observe(root(), { attributes: true, attributeFilter: ['class'] });
  media.addEventListener('change', resize); sync();
});
onBeforeUnmount(() => { observer?.disconnect(); media?.removeEventListener('change', resize); document.body.style.overflow = previousOverflow; });
</script>

<template>
  <ParentLayout ref="layout" class="site-layout" @keydown.capture="keydown" @click="navigate">
    <template #navbar-after><LanguageLink /></template>
    <template #sidebar><VPSidebar id="site-sidebar"><template #top><h2 v-if="items.length" class="directory-title">{{ routeLocale === '/zh/' ? '文章目录' : 'Article directory' }}</h2></template></VPSidebar></template>
    <template v-if="$slots.page" #page><slot name="page" /></template>
  </ParentLayout>
</template>

<style>
:root { --navbar-height: 64px; }
.site-layout .directory-title { font-size: 14px; color: var(--vp-c-text-mute); margin: 20px 24px 0; border: 0; padding: 0; }
.site-layout .vp-sidebar-items { padding-top: 12px; }
.site-layout .vp-navbar { z-index: 30; }
@media (max-width: 719px) {
  .site-layout:not(.sidebar-open) .vp-sidebar { visibility: hidden; }
  .site-layout.sidebar-open .vp-sidebar { visibility: visible; }
  .site-layout .vp-sidebar { z-index: 25; }
  .site-layout .vp-sidebar-mask { z-index: 24; background: rgb(0 0 0 / 25%); }
}
</style>
