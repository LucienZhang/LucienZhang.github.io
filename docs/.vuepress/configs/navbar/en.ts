import type { NavbarConfig } from "@vuepress/theme-default";

export const navbarEn: NavbarConfig = [
  { text: "Tools", children: [
    { text: "Mortgage comparison", link: "/tools/mortgage.html" },
    { text: "Japan tax calculator", link: "/tools/japan-tax.html" },
  ] },
  { text: "Notes", children: [
    { text: "Programming", link: "/programming/prog-lang/overview.html" },
    { text: "Algorithms", link: "/programming/algorithms/overview.html" },
    { text: "Machine learning", link: "/ml/overview.html" },
    { text: "Misc", link: "/misc/apis.html" },
  ] },
  { text: "Engineering", link: "/#engineering" },
  { text: "Contact", link: "/#contact" },
];
