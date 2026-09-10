import { defineClientConfig, resolvers } from 'vuepress/client';
import { defineAsyncComponent } from 'vue';
import SiteLayout from './theme/components/SiteLayout.vue';

const Homepage = defineAsyncComponent(() => import('./theme/components/Home.vue'));

export default defineClientConfig({
  enhance() {
    // Keep browser titles independent of navbar branding and page headings.
    resolvers.resolvePageHeadTitle = () => '張本人';
  },
  layouts: {
    Homepage,
    AuthCallback: defineAsyncComponent(() => import('./theme/components/AuthCallback.vue')),
    Layout: SiteLayout,
  },
});
