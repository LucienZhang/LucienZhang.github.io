import type { SidebarConfig } from "@vuepress/theme-default";

export const sidebarZh: SidebarConfig = {
  // "/zh/programming/": [
  //   {
  //     title: "编程语言",
  //     children: [
  //       ["/zh/programming/prog-lang/overview", "概览"],
  //       "/zh/programming/prog-lang/basics",
  //       "/zh/programming/prog-lang/collections",
  //       "/zh/programming/prog-lang/controls",
  //       "/zh/programming/prog-lang/function",
  //       "/zh/programming/prog-lang/libs",
  //       "/zh/programming/prog-lang/io",
  //       "/zh/programming/prog-lang/exceptions",
  //       "/zh/programming/prog-lang/ood",
  //       "/zh/programming/prog-lang/scope",
  //     ],
  //   },
  //   {
  //     title: "算法",
  //     children: [["/zh/programming/algorithms/overview", "概览"], "/zh/programming/algorithms/np-hard/knapsack"],
  //   },
  // ],
  "/zh/ml/": [
    {
      text: "机器学习",
      children: [{ text: "概览", link: "/zh/ml/overview" }, "/zh/ml/mnist"],
    },
  ],
  // "/zh/projects/": ["/zh/projects/werewolf"],
};
