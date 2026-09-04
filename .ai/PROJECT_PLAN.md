# LucienZhang.github.io 维护与升级计划

> 状态：Phase 1 本地实施与验证完成，等待 GitHub Pages 线上验收
> 基线审计日期：2026-09-04
> 适用仓库：`LucienZhang/LucienZhang.github.io`

## 1. 目标与结论

这个仓库接下来要支持三类工作：重做个人主页视觉、增加工具页面、接入 chatbot。开始这些产品工作前，应先完成一次有边界的基础设施升级和现有问题清理。

当前建议是：

1. **保留 Vue，不迁移 React，也不引入 MUI。** 现有 49 个 Markdown 页面、6 个 Vue 交互组件和自定义 VuePress 主题都可以继续复用。
2. **第一选择是在 VuePress 2 内完成升级。** 先将 `beta.60` 升到一组经过验证的 RC 兼容矩阵，再决定是否有必要迁移 VitePress。
3. **Vite 不单独升级。** 它由 `@vuepress/bundler-vite` 管理；直接在旧 VuePress 上安装最新版 Vite 会破坏打包器的版本约束。
4. **升级 Ant Design Vue 到 v4，移除 Bootstrap。** 首页保持自定义视觉，Ant Design Vue 只服务工具页和通用交互控件。
5. **不要把 VuePress/Vite、UI、Three/IFC、业务组件重写混成一次变更。** 每一阶段都必须能够独立构建、预览、验证和回退。

升级不是为了追逐版本，而是为了先建立一个稳定基线，使后续主页、工具和 chatbot 不继续依赖 2023 年的 beta 工具链。

## 2. 当前基线

### 2.1 项目形态

- VuePress 2 静态内容站，使用 Vite bundler。
- 英文内容为主，部分中文内容。
- 自定义主题仅覆盖默认主题的 `Home.vue`。
- Markdown 中直接嵌入 Vue 组件。
- GitHub Pages 部署。
- notebook 由另一个仓库 `LucienZhang/website-binder` 转换，再在部署阶段合并。
- 浏览器端交互还依赖 `https://api.ziliang.ninja` 的 ML API 和 CORS proxy。

### 2.2 已验证基线

- `npm run build` 成功。
- 当前生成 50 个页面，构建时间约 26 秒。
- 构建后 Git 工作树保持干净。
- 构建存在两类警告：`caniuse-lite` 过期，以及部分 chunk 超过 500 kB。
- 当前最大的交互 chunk 是 BIM，约 1.25 MB；`Lang` chunk 约 628 kB。

这些结果必须在升级前保存为对照基线。升级后的“成功”不能只定义为命令退出码为 0，还必须验证页面、SSR 和交互组件。

### 2.3 当前核心依赖拓扑

| 层级 | 当前解析版本 | 说明 |
| --- | --- | --- |
| Node | `package.json >=16`；CI 为 18 | 已低于目标 VuePress package 的实际 engine 要求 |
| VuePress meta package | `vuepress-vite 2.0.0-beta.60` | 旧的整合包；现代官方安装方式改为分别安装 `vuepress`、bundler 和 theme |
| VuePress core/client/CLI | 主要为 `2.0.0-beta.60` | 已跨越大量 beta 和 RC 版本 |
| Vite | `4.0.4` | 由 `@vuepress/bundler-vite beta.60` 引入 |
| Vue | `3.2.47` | 由 VuePress 和 Ant Design Vue 共同解析 |
| Vue Router | `4.1.6` | 由旧 VuePress 生态引入 |
| Sass | `1.58.0` | 由主题/Markdown 插件引入 |
| Ant Design Vue | `3.2.15` | 仅使用 Modal、Spin、message |
| Bootstrap | `4.6.2` | 只在 `DemoMnist.vue` 中按 Sass partial 使用 |

### 2.4 当前依赖树已经不一致

当前 `npm ls` 显示：

- `vuepress-vite` 使用 VuePress `beta.60`。
- `@vuepress/plugin-register-components` 和 `@vuepress/plugin-shiki` 实际解析到了 `beta.50-pre.1`。
- `vuepress-plugin-md-enhance` 又引入一套 `beta.60` client 与旧生态包。

也就是说，当前构建虽然能通过，但依赖树中存在多个 VuePress core/client 版本。继续使用预发布版本上的宽泛 `^` 范围会让一次普通 `npm install` 产生不可预测的解析结果。

升级后必须满足：

```text
一个 VuePress core 版本
一个 VuePress client 版本
一个 Vue 版本
一个 Vue Router 版本
所有官方插件的 peerDependencies 均满足
```

RC 阶段的 VuePress 核心包应使用精确版本，不使用 `^`，不盲目混用 `latest` 与 `next`。

## 3. VuePress 与 Vite 升级分析

### 3.1 为什么不能只升级 Vite

当前代码并没有直接拥有一个独立 `vite.config.ts`。Vite 配置嵌套在：

```text
VuePress config
  -> @vuepress/bundler-vite
    -> Vite
      -> production bundler / dependency optimizer / Vue plugin
```

因此 Vite 的主版本由 VuePress bundler 决定。若在根目录强制安装新版 Vite，可能出现：

- `@vitejs/plugin-vue` 与 Vite 主版本不匹配；
- VuePress dev server 与 SSR 构建使用不同 Vite 实例；
- `viteOptions` 类型与运行时不一致；
- 插件在开发环境正常、生产 SSR 失败；
- lockfile 出现重复的 Vite/Rollup/Rolldown 实现。

结论：**升级单位是 VuePress core + bundler + theme + official plugins，而不是 Vite 单包。**

### 3.2 2026-09-04 可用版本矩阵

根据当日 npm package metadata：

- `vuepress@next`：`2.0.0-rc.31`
- `@vuepress/bundler-vite@next`：`2.0.0-rc.31`
- `@vuepress/theme-default@next`：`2.0.0-rc.132`
- `@vuepress/plugin-register-components@next`：`2.0.0-rc.132`
- `@vuepress/plugin-shiki@next`：`2.0.0-rc.132`

但这里存在一个必须显式处理的发布窗口问题：`theme-default rc.132` 和上述生态插件当前声明的 peer 是 **`vuepress 2.0.0-rc.30`**，不是刚发布的 core `rc.31`。

因此不能把所有包机械地安装为 `@next`。当前可作为升级 spike 起点的兼容矩阵是：

```json
{
  "vuepress": "2.0.0-rc.30",
  "@vuepress/bundler-vite": "2.0.0-rc.30",
  "@vuepress/theme-default": "2.0.0-rc.132",
  "@vuepress/plugin-register-components": "2.0.0-rc.132",
  "@vuepress/plugin-shiki": "2.0.0-rc.132"
}
```

这不是最终承诺版本。真正实施当天应再次查询 metadata：如果 theme/plugin 已发布支持 `rc.31` 的版本，则整个 core/bundler 一起前移到 `rc.31`；否则先锁定上面的 `rc.30` 矩阵。

验收规则比具体版本号更重要：

```bash
npm ls vuepress @vuepress/core @vuepress/client @vuepress/bundler-vite vue vue-router
```

输出必须没有 `invalid`、`extraneous` 和意外重复核心版本。

### 3.3 目标矩阵带来的实际跃迁

以兼容矩阵 `rc.30` 为例，它会带来：

| 依赖 | 当前 | 目标链路 | 主要影响 |
| --- | --- | --- | --- |
| Node | CI 18 | VuePress 要求 `>=22.18.0` | 本地与 CI 必须统一；旧 workflow 先升级 |
| VuePress | `beta.60` | `rc.30` | config、主题、插件 API 经历大量迭代 |
| Vue | `3.2.47` | `^3.5.34` | SSR、响应式和类型行为需要回归 |
| Vite | `4.0.4` | `^8.0.11` | 跨越 4 个主版本，生产 bundler 从 Rollup 迁到 Rolldown |
| Vue Router | `4.1.6` | `^5.0.6` | 对未使用 file-based routing 的项目影响较小，但导航和 locale 必须验证 |
| Vue plugin | `@vitejs/plugin-vue 4` | `^6.0.6` | Vue SFC 编译与 SSR 路径发生变化 |
| Sass | `1.58` | theme 要求约 `1.101` | 旧 Sass import/deprecation 可能暴露出来 |

VuePress 官方文档仍将 v2 标为 RC，并提醒 RC 之间可能存在小型 breaking changes。与此同时，实际 `vuepress@rc.30` package metadata 对 Node 的要求已经高于文档首页所写的 Node 20.9；实施时应以安装包的 `engines` 为准。

### 3.4 Vite 4 到 Vite 8 的关键变化

Vite 8 的核心变化不是版本号，而是生产和依赖优化底层从 esbuild + Rollup 转为 Rolldown + Oxc：

- Vite 8 使用 Rolldown 作为统一 bundler。
- JavaScript transform/minify 转向 Oxc。
- CSS minify 默认使用 Lightning CSS。
- 默认浏览器 target 更新。
- CommonJS default import 行为更一致，可能暴露旧包的互操作差异。
- `rollupOptions` 有兼容转换层，但新配置方向是 `rolldownOptions`。

当前项目在 `config.ts` 中使用：

```ts
viteOptions: {
  plugins: [Components(...)],
  ssr: { noExternal: [...] },
  build: {
    rollupOptions: {
      external: [...]
    }
  }
}
```

需要逐项验证：

1. `unplugin-vue-components` 的 Vite 插件能否在 Vite 8/Rolldown 下工作。
2. `ssr.noExternal` 中的 `web-ifc-three`、Ant Design Vue、icons 包是否仍有必要。
3. `build.rollupOptions.external` 是否正确转换；通过构建后 HTML 和 chunk 内容证明，而不是只看无报错。
4. `/static/js/d3.js`、`nv.d3.js`、`pseudocode.js` 的绝对路径动态 import 是否仍保留为浏览器加载。
5. Three.js、`web-ifc-three`、Highcharts、Cheerio、Typed.js 等旧包的 CommonJS/ESM interop 是否改变。

当前项目没有自定义 esbuild transform，因此不需要主动迁移 `esbuild` 配置；风险主要集中在第三方插件、外部化规则和旧依赖的模块格式。

### 3.5 VuePress 配置与主题预期变化

计划中的配置调整包括：

- 用 `vuepress` 导出的 `defineUserConfig`，不再从 `@vuepress/cli` 直接导入。
- 移除 `vuepress-vite` meta package，显式声明 `vuepress`、bundler 和 theme。
- 保留现有纯 ESM/TypeScript config。
- 重新核对默认主题 locale、navbar、sidebar、edit link 和 git metadata 配置。
- 验证 `lucienTheme()` 继承默认主题、通过 alias 覆盖 `@theme/Home.vue` 的方式是否仍有效。
- 检查新版默认主题的 CSS variables 是否与 `styles/index.scss` 和旧 HTML5 UP 首页样式冲突。
- 检查生产模式 `git` 插件和 Shiki、开发模式 Prism 的差异是否仍有必要；优先统一 highlighter，减少开发/生产渲染差异。

### 3.6 Markdown 插件策略

当前插件组合较老且重叠：

- `@snippetors/vuepress-plugin-code-copy`
- `@snippetors/vuepress-plugin-tabs`
- `vuepress-plugin-md-enhance`，实际只开启 `mathjax: true`
- `@vuepress/plugin-shiki`
- 三个手动注册的 markdown-it 插件

新版默认主题已经依赖官方 copy-code 和 markdown-tab 插件。建议：

1. 删除两个 `@snippetors` 插件，改用默认主题/官方插件能力。
2. 不再为了一个 `mathjax: true` 引入整个 `vuepress-plugin-md-enhance`；改用官方 `@vuepress/plugin-markdown-math`，或在确认公式页面需求后选择 KaTeX/MathJax。
3. 保留 `markdown-it-footnote`、`markdown-it-multimd-table`、`markdown-it-pangu` 前先建立包含脚注、无表头表格、中英文混排的 fixture 页面。
4. 确认代码 tab、copy button、Shiki 高亮在开发和生产一致。

这样可以消除目前重复的 VuePress client/core，并缩小未来 RC 升级面。

### 3.7 `@babel/runtime` patch

仓库当前通过 `patch-package` 修改 `@babel/runtime 7.20.13` 的 `exports` 路径。它很可能是旧 VuePress/Vite/Babel 组合的历史兼容补丁。

处理方式：

1. 升级分支首次安装时先保留 patch，观察是否因目标版本不再安装 `7.20.13` 而失败。
2. 若 patch target 不存在，临时移出 patch 后执行干净安装和构建。
3. 只有在构建、SSR 和组件预览都通过后，删除 patch 与不再需要的 `patch-package`。
4. 不应把 patch 无条件改写到一个新的 Babel runtime 版本；必须先证明原问题仍存在。

## 4. UI 与组件依赖升级

### 4.1 Ant Design Vue

当前只使用：

- `a-modal`：主页微信二维码；
- `a-spin`：Jupyter、LeetCode、TIOBE；
- `message`：MNIST 成功/失败反馈。

建议升级到 Ant Design Vue v4，但与 VuePress/Vite 核心升级分开提交。预期改动：

- Modal 的 `visible` 改为 `open`。
- 删除 `ant-design-vue/lib/message/style/css` 旧式样式导入。
- v4 使用 CSS-in-JS，主题色、圆角、阴影和间距会变化。
- 重新验证 SSR 时样式注入和 hydration。
- 重新验证 `unplugin-vue-components` 的 `AntDesignVueResolver`。

首页不应以 Ant Design Vue 作为主视觉系统。它只作为工具页的控件层；主页使用项目自己的 design tokens 和 CSS。

### 4.2 Bootstrap

Bootstrap 4 只在 `DemoMnist.vue` 引入 grid、buttons 和 utilities。迁移 Bootstrap 5 的成本没有对应收益。

建议直接用 CSS Grid/Flex 和局部 button 样式替换：

- `container-fluid`
- `row`
- `col-2` / `col-8`
- `btn` / `btn-info` / `btn-success`
- `float-left` / `float-right`

替换完成后删除 Bootstrap 依赖。这会减少 Sass 兼容面，也避免 Bootstrap 与新版默认主题/首页样式相互污染。

### 4.3 暂不随核心升级的大型依赖

以下依赖不应在第一阶段顺手升级：

- Three.js / `web-ifc-three`
- Highcharts / `highcharts-vue`
- D3 / NVD3 静态脚本
- Cheerio
- Signature Pad
- Axios

尤其 `web-ifc-three 0.0.102` 与 Three.js `0.135` 存在强耦合。应先让旧业务依赖在新 VuePress/Vite 下工作，再单独规划 BIM 技术栈更新。

## 5. 已知维护问题

### P0：影响发布或依赖确定性

1. **GitHub Actions 已过期。** workflow 使用 `upload-artifact@v3`、`download-artifact@v3`、`upload-pages-artifact@v1`、`deploy-pages@v1` 和 Node 18。`upload-artifact@v3` 已被官方弃用。升级时需整体更新 artifact/Pages actions，并验证 artifact 合并语义。
2. **VuePress 依赖树混合多个 beta 版本。** 必须改成精确兼容矩阵并重新生成 lockfile。
3. **CI Node 与目标 VuePress engine 不符。** 目标 `rc.30`/`rc.31` package 要求 Node `>=22.18.0`。
4. **部署依赖另一个仓库。** `website-binder` 任一安装或转换失败会阻塞本站部署；应为 docs 与 notebooks 分别提供清晰失败信息和可复现输入。

### P1：用户可见问题

1. 中文 navbar 的“编程”和“杂项”指向不存在的页面。
2. VuePress theme 的 `repo` 仍为 `LucienZhang/website`，但当前 remote 是 `LucienZhang/LucienZhang.github.io`，编辑链接可能错误。
3. `package.json` 中 repository、bugs、homepage 仍指向旧仓库。
4. `/misc/werewolf` 和部分中文 project 内容存在但没有进入正式导航，需要决定保留、归档还是暴露。
5. README 与真实部署/开发要求过于简略，没有 Node 版本、安装、构建、跨仓库 notebook 说明。

### P1：安全与运行时稳定性

1. `Lang.vue` 对通过 CORS proxy 获取的 TIOBE 页面脚本使用 `eval`。这是远程代码执行面，应改为解析结构化数据或受控文本，不能继续执行第三方页面脚本。
2. `api.ziliang.ninja` 是多个工具的单点依赖，缺少显式超时、用户可见错误态和降级。
3. LeetCode/TIOBE 页面依赖第三方未公开稳定的页面结构或 GraphQL 行为，失败时当前主要写 console。
4. chatbot 不能把模型 API key 放入 GitHub Pages 的浏览器 bundle；必须使用独立后端/serverless endpoint，并实现限流。

### P2：质量与性能

1. 没有 lint、typecheck、单元测试或浏览器测试。
2. 没有自动链接检查，现有构建不会因无效 navbar 路径失败。
3. BIM 和 Lang chunk 较大，需要路由级/组件级延迟加载与 bundle 分析。
4. 首页包含大量旧模板 CSS、Font Awesome 字体和注释代码，可在视觉重做时清理。
5. `Jupyter.vue` 使用 `event.path` fallback 和同源 iframe DOM 访问，需要覆盖 Chromium、Firefox、Safari 的测试。
6. 交互组件普遍没有在卸载时清理 resize listener、chart callback、Typed 或 Three.js renderer 资源。

## 6. 分阶段实施计划

### Phase 0：冻结并记录基线

目标：确保后续每个变化都可以和现状对比。

- [x] 记录当前 Node/npm 版本与 `npm ls` 输出。
- [x] 保存当前 50 个构建路由列表。
- [x] 对首页、英文/中文内容、MNIST、BIM、LeetCode、Lang、Jupyter、Pseudo 分别保存截图或手工验收记录。
- [x] 记录 build 时间、dist 大小和主要 chunk 大小。
- [x] 添加最小验证脚本：build、内部链接检查、关键产物存在检查。
- [x] 修复 repo metadata 和明确无效中文导航的预期行为。

完成条件：没有依赖升级；基线变更只涉及文档、验证设施和确定性的配置修复。

### Phase 1：更新 CI 与运行时基线

目标：让旧代码先在目标 Node 和现代 GitHub Actions 上稳定运行。

- [x] 将 `package.json.engines.node` 调整为与目标 VuePress 一致。
- [x] 增加 `.nvmrc` 或 `.node-version`，固定 Node 22 的满足版本。
- [x] 将 CI Node 从 18 升到满足 VuePress engine 的 22.x。
- [x] 更新 checkout/setup-python/setup-node/artifact/Pages actions。
- [x] 验证两个 artifact 下载后仍能正确合并到最终 Pages artifact。
- [ ] 在实际 Pages 环境验证 custom domain、base path、静态 WASM、IFC 和 notebook 路径。

完成条件：仍使用旧 VuePress，但新 CI 能成功发布；这样可将 CI 问题和框架升级问题分离。

### Phase 2：VuePress/Vite 兼容矩阵 spike

目标：证明新版核心链可承载现有站点，不在该阶段改视觉或业务行为。

- [ ] 实施当天重新查询所有目标包的 dist-tag、peerDependencies、engines。
- [ ] 选择一致矩阵；若生态仍 peer `rc.30`，使用上文 `rc.30` 方案。
- [ ] 移除 `vuepress-vite`，显式安装 `vuepress`、`@vuepress/bundler-vite`、`@vuepress/theme-default`。
- [ ] 所有 RC 根依赖使用精确版本。
- [ ] 用 `vuepress` 导入 `defineUserConfig`。
- [ ] 替换旧 code-copy、tabs 和 md-enhance 插件。
- [ ] 处理 Sass peer dependency。
- [ ] 重新生成 `package-lock.json`，不手工编辑 lockfile。
- [ ] 检查和删除已失效的 Babel runtime patch。
- [ ] 执行 `npm ls`，确认没有混合 VuePress core/client。
- [ ] 修复 Vite 8/Rolldown 下的 SSR、external、CJS interop 问题。

完成条件：50 个页面构建成功；所有关键组件至少能够加载；依赖树一致；没有新 hydration 错误。

### Phase 3：UI 依赖收敛

目标：形成“自定义主页 + Ant Design Vue 工具控件”的清晰边界。

- [ ] 将 Bootstrap 布局从 `DemoMnist.vue` 改为局部 CSS，并删除 Bootstrap。
- [ ] 升级 Ant Design Vue v4。
- [ ] 调整 Modal `visible -> open`、message 样式和 SSR 注入。
- [ ] 升级与 Vite 8 兼容的 `unplugin-vue-components`。
- [ ] 验证 Modal、Spin、message、中文和英文页面。
- [ ] 引入少量 design tokens：颜色、字体、间距、圆角、阴影、动效时长。

完成条件：UI 行为无回归；首页不被 Ant Design 默认视觉接管；Bootstrap 完全移除。

### Phase 4：安全与稳定性清理

目标：在新增工具和 chatbot 前清除已知高风险实现。

- [ ] 删除 `Lang.vue` 中的 `eval`。
- [ ] 为所有远程请求增加 timeout、loading、empty、error、retry 状态。
- [ ] 检查 CORS proxy 的 allowlist、请求方法、header/cookie 转发边界。
- [ ] 为 LeetCode/TIOBE 等第三方集成设计可接受的失效表现。
- [ ] 为组件补充 unmount 资源清理。
- [ ] 增加内部链接检查和最小浏览器 smoke test。

完成条件：第三方服务失效不会造成无限 loading；浏览器不执行代理返回的远程脚本。

### Phase 5：产品工作

完成前四阶段后，再按独立功能推进：

1. 主页视觉重做；
2. 工具页面信息架构与首批工具；
3. chatbot UI；
4. chatbot 独立后端、流式协议、限流和观测。

## 7. 验证矩阵

### 每阶段自动验证

```bash
npm ci
npm ls
npm run build
git diff --check
```

应补充：

- 内部链接/导航检查；
- 生成路由数量检查；
- `dist/static/IFCwasm`、IFC 示例、fonts、D3/NVD3/Pseudo 资源存在检查；
- bundle size 报告；
- console error 检查。

### 手工/浏览器验证

| 页面或能力 | 必须验证 |
| --- | --- |
| `/`、`/zh/` | 首页、locale、Typed 动画、二维码 Modal、响应式 |
| Programming | sidebar、代码高亮、copy、tabs、Jupyter iframe |
| Algorithms | 数学公式、脚注、表格、Pseudo、LeetCode chart |
| ML/MNIST | canvas resize、手写输入、message、API 成功/失败 |
| BIM | WASM 路径、IFC 加载、OrbitControls、resize、销毁 |
| Lang | 数据加载、表格、chart、失败态、无 `eval` |
| GitHub Pages | custom domain、根路径、404、edit link、notebook merge |

建议至少覆盖 Chromium、Firefox 和移动尺寸；涉及 canvas/WebGL/iframe 的页面不能只依赖 SSR 构建结果。

## 8. 回滚与提交边界

升级工作应按阶段拆分提交，避免一个提交同时包含 lockfile、视觉和业务重写。

建议提交边界：

1. `chore: establish maintenance baseline`
2. `ci: modernize pages deployment`
3. `chore: upgrade vuepress and vite toolchain`
4. `chore: replace legacy markdown plugins`
5. `refactor: remove bootstrap from mnist demo`
6. `chore: upgrade ant design vue`
7. `fix: remove remote script evaluation`

任一阶段失败时回退该阶段，而不是通过继续升级更多无关包来碰运气。

## 9. VuePress 与 VitePress 的决策门

本计划默认先尝试 VuePress RC 原地升级，因为它最能保留：

- 当前默认主题继承方式；
- navbar/sidebar 配置；
- Markdown 插件组合；
- 现有 Vue 组件注册；
- git metadata 和 edit link。

只有在 Phase 2 spike 出现以下情况时，才转向 VitePress 迁移：

- 无法形成没有 peer conflict 的 VuePress 兼容矩阵；
- 默认主题/插件 RC 的发布错位持续阻塞安装；
- 现有功能必须依赖大量已停止维护的 VuePress 插件；
- VuePress RC 升级后的维护成本明显高于迁移 49 个 Markdown 页面和自定义主题。

若转向 VitePress，应另写迁移设计，不与本计划的 VuePress spike 混做。VitePress 可以继续使用 Vue SFC 和 Markdown 内 Vue 组件，因此仍不构成迁移 React 的理由。

## 10. 本轮明确不做

- 不迁移 React/Next.js。
- 不引入 MUI。
- 不在依赖升级同时设计新主页。
- 不在核心升级同时重写 BIM/IFC。
- 不把 chatbot API key 放入静态前端。
- 不仅凭 `npm run build` 成功就宣布升级完成。
- 不使用 `npm update` 或所有依赖 `@latest` 的无差别升级。

## 11. 参考资料

- [VuePress Introduction](https://vuepress.vuejs.org/guide/introduction.html)
- [VuePress Getting Started and RC notice](https://vuepress.vuejs.org/guide/getting-started.html)
- [VuePress core repository and changelog](https://github.com/vuepress/core/blob/main/CHANGELOG.md)
- [Vite 8 announcement](https://vite.dev/blog/announcing-vite8)
- [Vite 8 migration guide](https://vite.dev/guide/migration)
- [Ant Design Vue v4 changelog](https://github.com/vueComponent/ant-design-vue/blob/main/CHANGELOG.en-US.md)
- [Bootstrap 4 to 5 migration reference](https://getbootstrap.com/docs/5.0/migration/)
- [GitHub upload-artifact migration](https://github.com/actions/upload-artifact/blob/main/docs/MIGRATION.md)
- [GitHub deploy-pages releases](https://github.com/actions/deploy-pages/releases)

版本号和 peer/engine 信息来自 2026-09-04 的 npm registry metadata。开始实施时必须重新查询，不能把本文件中的 RC 编号视为永久最新版本。
