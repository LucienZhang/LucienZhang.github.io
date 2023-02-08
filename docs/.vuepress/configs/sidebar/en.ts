import type { SidebarConfig } from "@vuepress/theme-default";

export const sidebarEn: SidebarConfig = {
  "/programming/": [
    {
      text: "Programming Languages",
      collapsible: true,
      children: [
        { text: "Overview", link: "/programming/prog-lang/overview" },
        "/programming/prog-lang/basics",
        "/programming/prog-lang/collections",
        "/programming/prog-lang/controls",
        "/programming/prog-lang/function",
        "/programming/prog-lang/libs",
        "/programming/prog-lang/io",
        "/programming/prog-lang/exceptions",
        "/programming/prog-lang/ood",
        "/programming/prog-lang/scope",
      ],
    },
    {
      text: "Data Structures and Algorithms",
      collapsible: true,
      children: [
        { text: "Overview", link: "/programming/algorithms/overview" },
        "/programming/algorithms/math-formula",
        "/programming/algorithms/math-code",
        "/programming/algorithms/misc",
        "/programming/algorithms/string",
        "/programming/algorithms/tree-traversal",
        "/programming/algorithms/balanced-tree",
        "/programming/algorithms/heap",
        "/programming/algorithms/segment-tree",
        "/programming/algorithms/dynamic-programming",
        // "/programming/algorithms/tree-misc",
        "/programming/algorithms/disjoint-sets",
        "/programming/algorithms/graph-traversal",
        "/programming/algorithms/mst",
        "/programming/algorithms/sssp",
        "/programming/algorithms/scc",
        "/programming/algorithms/cut",
        "/programming/algorithms/cache",
        "/programming/algorithms/binary-search",
        "/programming/algorithms/quicksort",
        "/programming/algorithms/knapsack",
        "/programming/algorithms/vertex-cover",
        "/programming/algorithms/set-cover",
        "/programming/algorithms/pca",
        "/programming/algorithms/k-center",
      ],
    },
  ],
  "/ml/": [
    {
      text: "ML & DL",
      children: [{ text: "Overview", link: "/ml/overview" }, "/ml/mnist"],
    },
  ],
  "/misc/": [
    {
      text: "Misc",
      children: ["/misc/apis", "/misc/bim", "/misc/pixel-streaming"],
    },
  ],
  // "/projects/": [
  //   "/projects/werewolf",
  //   // {
  //   //     text: 'Games',
  //   //     children: [
  //   //         '/projects/games/werewolf',
  //   //     ]
  //   // },
  // ],
};
