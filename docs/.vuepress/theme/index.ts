import type { Theme } from "@vuepress/core";
import {
  defaultTheme,
  type DefaultThemeOptions,
} from "@vuepress/theme-default";
import { getDirname, path } from "@vuepress/utils";

const __dirname = getDirname(import.meta.url);

export const lucienTheme = (options: DefaultThemeOptions): Theme => {
  return {
    name: "vuepress-theme-lucien",
    extends: defaultTheme(options),

    alias: {
      "@theme/Home.vue": path.resolve(__dirname, "./components/Home.vue"),
    },
  };
};
