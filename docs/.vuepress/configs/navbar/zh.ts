import type { NavbarConfig } from "@vuepress/theme-default";

export const navbarZh: NavbarConfig = [
  { text: "工具", children: [
    { text: "房贷比较", link: "/zh/tools/mortgage.html" },
    { text: "日本税务计算器", link: "/zh/tools/japan-tax.html" },
  ] },
  { text: "机器学习", link: "/zh/ml/overview" },
  // Programming and Misc stay out of the Chinese navigation until translated
  // routes exist. The English sections remain available through locale switch.
];
