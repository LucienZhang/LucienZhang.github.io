import type { NavbarConfig } from "@vuepress/theme-default";

export const navbarZh: NavbarConfig = [
  { text: "机器学习", link: "/zh/ml/overview" },
  // Programming and Misc stay out of the Chinese navigation until translated
  // routes exist. The English sections remain available through locale switch.
];
