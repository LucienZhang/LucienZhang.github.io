import type { NavbarConfig } from "@vuepress/theme-default";

export const navbarEn: NavbarConfig = [
  { text: "Tools", children: [
    { text: "Mortgage comparison", link: "/tools/mortgage.html" },
    { text: "Japan tax calculator", link: "/tools/japan-tax.html" },
  ] },
  { text: "Programming", link: "/programming/prog-lang/overview" },
  { text: "Machine Learning", link: "/ml/overview" },
  { text: "Misc", link: "/misc/apis" },
];
