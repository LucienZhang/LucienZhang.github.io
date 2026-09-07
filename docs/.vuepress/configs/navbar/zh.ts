import type { NavbarConfig } from "@vuepress/theme-default";

export const navbarZh: NavbarConfig = [
  { text: "工具", children: [
    { text: "房贷比较", link: "/zh/tools/mortgage.html" },
    { text: "日本税务计算器", link: "/zh/tools/japan-tax.html" },
  ] },
  { text: "笔记", children: [
    { text: "编程（英文）", link: "/programming/prog-lang/overview.html" },
    { text: "算法（英文）", link: "/programming/algorithms/overview.html" },
    { text: "机器学习", link: "/zh/ml/overview.html" },
    { text: "杂项（英文）", link: "/misc/apis.html" },
  ] },
  { text: "工程", link: "/zh/#engineering" },
  { text: "联系", link: "/zh/#contact" },
];
