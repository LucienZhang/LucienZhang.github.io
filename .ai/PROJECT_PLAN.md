# 网站维护与产品计划

更新：2026-09-07。本文只保留当前架构与阶段索引；实施前审计、旧版本矩阵和逐轮输出可从 Git 历史查阅，不作为当前依赖升级指令。

## 当前状态

- 基础设施维护 Phase 0–4.5 已完成并合并。
- PR #14（c4184ee）已合并部署：双语主页、房贷比较、日本税务限定年度工具和筛股器空壳。
- 本轮收尾包含工具入口及体验状态、键盘导航、最终 logo/favicon、品牌尺寸统一和文档精简。分支推送不代表合并或发布。
- 唯一后续清单：[remaining-work.md](./phase5/remaining-work.md)；验证证据：[validation.md](./phase5/validation.md)。

## 架构与边界

- 保留 Vue / VuePress 2、Vite bundler、现有 Markdown 和交互组件；不迁移 React 或引入 MUI。
- 实际依赖版本以 package.json / package-lock.json 为准。VuePress core、bundler、theme、plugins 作为兼容组合验证，Vite 不单独升级。
- 首页自定义布局；文章和计算工具复用默认导航及侧栏机制。Ant Design Vue 用于必要的工具交互。
- 静态站由 GitHub Pages 发布；notebook 来自 website-binder，既有 ML/proxy 后端独立维护。
- 真实 AI 使用独立后端，模型密钥、限流和成本控制不得放入静态前端；当前解释仍为本地 mock。
- 数值工具的年度、资格、公式和舍入边界记录在对应规格及规则文档，不能仅凭构建通过声称算法完整适用。

## 当前文档

- [主页决策](./phase5/homepage-design-plan.md) / [主页规格](./phase5/homepage-design-spec.md)
- [房贷规格](./tools/mortgage/spec.md)
- [税务规格与规则索引](./tools/japan-tax/spec.md)
- [筛股器空壳规格](./tools/stock-screener/spec.md)
- [验证与复现](./phase5/validation.md) / [下一步](./phase5/remaining-work.md)

## 维护历史索引

以下记录保留当时语境，基线文件仍由检查脚本使用。

- [基线](./baseline/2026-09-04/README.md)
- [Phase 1](./phase1/2026-09-04.md) / [Phase 2](./phase2/2026-09-04.md) / [Phase 3](./phase3/2026-09-04.md)
- [Phase 3.5 tabs](./phase3.5/2026-09-04-tabs.md) / [home](./phase3.5/2026-09-04-home.md)
- [Phase 4 安全与失效处理](./phase4/2026-09-04.md) / [Phase 4.5 上线收尾](./phase4.5/2026-09-05.md)

## 验证和提交原则

生产变更执行适当的构建、链接、路由、安全、浏览器及业务回归；完整链为 `npm run verify`。数值正确性与页面交互分别验证，不降低阈值掩盖失败。Safari、真机、读屏与线上用户性能不能由本地 Chromium 结果代替。

每轮保留必要代码、测试、当前规格与精简验证结论。截图、生成草稿、日志、原始测量放 `.ai/artifacts/`，不进入源码 PR。需求、算法、基础设施和发布保持可独立审查；合并后新工作从 main 建独立 worktree。
