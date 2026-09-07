import { defineClientConfig } from 'vuepress/client';
import { defineAsyncComponent } from 'vue';
import SiteLayout from './theme/components/SiteLayout.vue';

const Homepage = defineAsyncComponent(() => import('./theme/components/Home.vue'));

export default defineClientConfig({
  layouts: {
    Homepage,
    Layout: SiteLayout,
  },
});
