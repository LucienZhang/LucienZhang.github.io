import type { HeadConfig } from "vuepress/core";

export const head: HeadConfig[] = [
  ["link", { rel: "icon", href: "/favicon.ico", sizes: "16x16 32x32 48x48" }],
  ["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg", sizes: "any" }],
];
