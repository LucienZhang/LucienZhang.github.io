import { defineClientConfig } from 'vuepress/client';
import { defineAsyncComponent } from 'vue';

export default defineClientConfig({
  layouts: {
    HomepagePrototype: defineAsyncComponent(() => import('./prototype/HomepagePrototype.vue')),
  },
});
