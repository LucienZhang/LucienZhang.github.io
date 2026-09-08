import { defineClientConfig, resolvers } from 'vuepress/client';
import { defineAsyncComponent } from 'vue';
import SiteLayout from './theme/components/SiteLayout.vue';

const Homepage = defineAsyncComponent(() => import('./theme/components/Home.vue'));

export default defineClientConfig({
  enhance() {
    // Only homepages override the browser title; keep VuePress defaults elsewhere.
    const defaultTitle = resolvers.resolvePageHeadTitle;
    resolvers.resolvePageHeadTitle = (page, siteLocale) =>
      page.path === '/' || page.path === '/zh/'
        ? '張本人'
        : defaultTitle(page, siteLocale);
  },
  layouts: {
    Homepage,
    Layout: SiteLayout,
  },
});
