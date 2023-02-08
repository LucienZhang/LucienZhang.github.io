import { viteBundler } from "@vuepress/bundler-vite";
// import { webpackBundler } from '@vuepress/bundler-webpack'
import { defineUserConfig } from "@vuepress/cli";
// import { docsearchPlugin } from '@vuepress/plugin-docsearch'
// import { googleAnalyticsPlugin } from '@vuepress/plugin-google-analytics'
import codeCopyPlugin from "@snippetors/vuepress-plugin-code-copy";
import tabsPlugin from "@snippetors/vuepress-plugin-tabs";
import { registerComponentsPlugin } from "@vuepress/plugin-register-components";
import { shikiPlugin } from "@vuepress/plugin-shiki";
import { getDirname, path } from "@vuepress/utils";
import { AntDesignVueResolver } from "unplugin-vue-components/resolvers";
import Components from "unplugin-vue-components/vite";
import { mdEnhancePlugin } from "vuepress-plugin-md-enhance";
import {
  // head,
  navbarEn,
  navbarZh,
  sidebarEn,
  sidebarZh,
} from "./configs/index.js";
import { lucienTheme } from "./theme";

import markdownItFootnotePlugin from "markdown-it-footnote";
import markdownItMultimdTablePlugin from "markdown-it-multimd-table";
import markdownItPanguPlugin from "markdown-it-pangu";
import { isProd } from "./common";

const __dirname = getDirname(import.meta.url);

export default defineUserConfig({
  define: isProd
    ? {
        __APP_DEBUG__: false,
      }
    : { __APP_DEBUG__: true },
  // set site base to default value
  base: "/",
  alias: {
    "@assets": path.resolve(__dirname, "../assets"),
  },

  // extra tags in `<head>`
  //   head,

  bundler: viteBundler({
    viteOptions: {
      plugins: [
        Components({
          resolvers: [AntDesignVueResolver()],
        }),
      ],
      ssr: {
        noExternal: [
          "web-ifc-three",
          "ant-design-vue",
          "@ant-design/icons-vue",
          "@ant-design/icons-svg",
          "highcharts-vue",
        ],
      },
    },
  }),

  // site-level locales config
  locales: {
    "/": {
      lang: "en-US",
      title: "Ziliang",
      description: "Not Only a Coder",
    },
    "/zh/": {
      lang: "zh-CN",
      title: "张本人",
      description: "不仅是程序员",
    },
  },

  // configure default theme
  theme: lucienTheme({
    logo: "/logo.png",
    repo: "LucienZhang/website",
    docsDir: "docs",

    locales: {
      "/": {
        // navbar
        navbar: navbarEn,
        // sidebar
        sidebar: sidebarEn,
        // page meta
        editLinkText: "Edit this page on GitHub",
      },

      /**
       * Chinese locale config
       */
      "/zh/": {
        // navbar
        navbar: navbarZh,
        selectLanguageName: "简体中文",
        selectLanguageText: "选择语言",
        selectLanguageAriaLabel: "选择语言",
        // sidebar
        sidebar: sidebarZh,
        // page meta
        editLinkText: "在 GitHub 上编辑此页",
        lastUpdatedText: "上次更新",
        contributorsText: "贡献者",
        // custom containers
        tip: "提示",
        warning: "注意",
        danger: "警告",
        // 404 page
        notFound: [
          "这里什么都没有",
          "我们怎么到这来了？",
          "这是一个 404 页面",
          "看起来我们进入了错误的链接",
        ],
        backToHome: "返回首页",
        // a11y
        openInNewWindow: "在新窗口打开",
        toggleColorMode: "切换颜色模式",
        toggleSidebar: "切换侧边栏",
      },
    },

    themePlugins: {
      // only enable git plugin in production mode
      git: isProd,
      // use shiki plugin in production mode instead
      prismjs: !isProd,
    },
  }),

  // configure markdown
  extendsMarkdown: (md) => {
    md.use(markdownItFootnotePlugin);
    md.use(markdownItPanguPlugin);
    md.use(markdownItMultimdTablePlugin, { headerless: true });
  },
  //   markdown: {
  //     importCode: {
  //       handleImportPath: (str) =>
  //         str.replace(/^@vuepress/, path.resolve(__dirname, "../../ecosystem")),
  //     },
  //   },

  // use plugins
  plugins: [
    // docsearchPlugin({
    //   appId: "34YFD9IUQ2",
    //   apiKey: "9a9058b8655746634e01071411c366b8",
    //   indexName: "vuepress",
    //   searchParameters: {
    //     facetFilters: ["tags:v2"],
    //   },
    //   locales: {
    //     "/zh/": {
    //       placeholder: "搜索文档",
    //       translations: {
    //         button: {
    //           buttonText: "搜索文档",
    //           buttonAriaLabel: "搜索文档",
    //         },
    //         modal: {
    //           searchBox: {
    //             resetButtonTitle: "清除查询条件",
    //             resetButtonAriaLabel: "清除查询条件",
    //             cancelButtonText: "取消",
    //             cancelButtonAriaLabel: "取消",
    //           },
    //           startScreen: {
    //             recentSearchesTitle: "搜索历史",
    //             noRecentSearchesText: "没有搜索历史",
    //             saveRecentSearchButtonTitle: "保存至搜索历史",
    //             removeRecentSearchButtonTitle: "从搜索历史中移除",
    //             favoriteSearchesTitle: "收藏",
    //             removeFavoriteSearchButtonTitle: "从收藏中移除",
    //           },
    //           errorScreen: {
    //             titleText: "无法获取结果",
    //             helpText: "你可能需要检查你的网络连接",
    //           },
    //           footer: {
    //             selectText: "选择",
    //             navigateText: "切换",
    //             closeText: "关闭",
    //             searchByText: "搜索提供者",
    //           },
    //           noResultsScreen: {
    //             noResultsText: "无法找到相关结果",
    //             suggestedQueryText: "你可以尝试查询",
    //             reportMissingResultsText: "你认为该查询应该有结果？",
    //             reportMissingResultsLinkText: "点击反馈",
    //           },
    //         },
    //       },
    //     },
    //   },
    // }),
    // googleAnalyticsPlugin({
    //   // we have multiple deployments, which would use different id
    //   id: process.env.DOCS_GA_ID ?? "",
    // }),
    registerComponentsPlugin({
      componentsDir: path.resolve(__dirname, "./components"),
    }),
    mdEnhancePlugin({
      mathjax: true,
    }),
    // only enable shiki plugin in production mode
    isProd ? shikiPlugin({ theme: "light-plus" }) : [],
    tabsPlugin({
      events: ["snippetors-vuepress-plugin-code-copy-update-event"],
    }),
    codeCopyPlugin({
      color: "#757575",
      staticIcon: true,
      backgroundTransition: false,
    }),
  ],
});
