import type { Theme } from "vuepress/core";
import {
  defaultTheme,
  type DefaultThemeOptions,
} from "@vuepress/theme-default";

export const lucienTheme = (options: DefaultThemeOptions): Theme => {
  return {
    name: "vuepress-theme-lucien",
    extends: defaultTheme(options),

  };
};
