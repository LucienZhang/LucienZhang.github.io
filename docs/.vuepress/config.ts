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
    vuePluginOptions: {
      template: {
        compilerOptions: {
          isCustomElement(tag) {
            return ["highcharts"].includes(tag);
          },
        },
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
      title: "?????????",
      description: "??????????????????",
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
        selectLanguageName: "????????????",
        selectLanguageText: "????????????",
        selectLanguageAriaLabel: "????????????",
        // sidebar
        sidebar: sidebarZh,
        // page meta
        editLinkText: "??? GitHub ???????????????",
        lastUpdatedText: "????????????",
        contributorsText: "?????????",
        // custom containers
        tip: "??????",
        warning: "??????",
        danger: "??????",
        // 404 page
        notFound: [
          "?????????????????????",
          "???????????????????????????",
          "???????????? 404 ??????",
          "???????????????????????????????????????",
        ],
        backToHome: "????????????",
        // a11y
        openInNewWindow: "??????????????????",
        toggleColorMode: "??????????????????",
        toggleSidebar: "???????????????",
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
    //       placeholder: "????????????",
    //       translations: {
    //         button: {
    //           buttonText: "????????????",
    //           buttonAriaLabel: "????????????",
    //         },
    //         modal: {
    //           searchBox: {
    //             resetButtonTitle: "??????????????????",
    //             resetButtonAriaLabel: "??????????????????",
    //             cancelButtonText: "??????",
    //             cancelButtonAriaLabel: "??????",
    //           },
    //           startScreen: {
    //             recentSearchesTitle: "????????????",
    //             noRecentSearchesText: "??????????????????",
    //             saveRecentSearchButtonTitle: "?????????????????????",
    //             removeRecentSearchButtonTitle: "????????????????????????",
    //             favoriteSearchesTitle: "??????",
    //             removeFavoriteSearchButtonTitle: "??????????????????",
    //           },
    //           errorScreen: {
    //             titleText: "??????????????????",
    //             helpText: "???????????????????????????????????????",
    //           },
    //           footer: {
    //             selectText: "??????",
    //             navigateText: "??????",
    //             closeText: "??????",
    //             searchByText: "???????????????",
    //           },
    //           noResultsScreen: {
    //             noResultsText: "????????????????????????",
    //             suggestedQueryText: "?????????????????????",
    //             reportMissingResultsText: "????????????????????????????????????",
    //             reportMissingResultsLinkText: "????????????",
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
