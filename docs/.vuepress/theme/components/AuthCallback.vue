<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePageData } from 'vuepress/client';
import SiteLayout from './SiteLayout.vue';
import { getBrowserClient } from '../../../../services/ai-interpreter/client/browser.mjs';
const router = useRouter(), page = usePageData();
const failed = ref(false), signedOut = ref(false);
onMounted(async () => {
  const href = location.href;
  history.replaceState(history.state, '', location.pathname);
  try {
    const client = getBrowserClient();
    if (page.value.frontmatter.authAction === 'logout') {
      client.session.clear(); signedOut.value = true;
      const saved = client.takeReturn();
      await router.replace(saved.locale === 'zh-CN' ? '/zh/' : '/');
    } else {
      if (!await client.session.callback(href, () => {})) throw new Error('Missing authorization response');
      const locale = client.returnLocale();
      await router.replace({ path: locale === 'zh-CN' ? '/zh/' : '/', query: { ai: 'return' } });
    }
  } catch { failed.value = true; }
});
</script>
<template>
  <SiteLayout><template #page><main class="auth-page">
    <h1>{{ failed ? '登录未完成 / Sign-in incomplete' : signedOut ? '已退出登录 / Signed out' : '正在处理登录 / Completing sign-in' }}</h1>
    <p role="status">{{ failed ? '登录链接可能已失效，请回到首页重新登录。 / The sign-in link may have expired. Return home and sign in again.' : '请稍候… / Please wait…' }}</p>
    <p><RouterLink to="/zh/">中文首页</RouterLink> · <RouterLink to="/">English homepage</RouterLink></p>
  </main></template></SiteLayout>
</template>
<style scoped>
.auth-page { max-width: 720px; margin: 100px auto 40px; padding: 24px; overflow-wrap: anywhere; }
</style>
