import type { SidebarConfig } from "@vuepress/theme-default";

export const sidebarZh: SidebarConfig = {
  "/zh/ml/": [{ text: "机器学习", children: [
    { text: "概览", link: "/zh/ml/overview" }, "/zh/ml/mnist",
  ] }],
  "/zh/projects/": [{ text: "项目", children: [
    { text: "概览", link: "/zh/projects/" }, "/zh/projects/werewolf",
  ] }],
};
