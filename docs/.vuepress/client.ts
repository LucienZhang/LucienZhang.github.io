import { defineClientConfig } from 'vuepress/client';
import { defineAsyncComponent } from 'vue';

const Homepage = defineAsyncComponent(() => import('./theme/components/Home.vue'));

export default defineClientConfig({
  layouts: {
    Homepage,
  },
});
