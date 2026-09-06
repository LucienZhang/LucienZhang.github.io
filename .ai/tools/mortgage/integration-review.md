# 房贷工具集成审查

日期：2026-09-06。来源：codex/mortgage-tool / 5c980e0；目标：codex/phase-5a0，原 HEAD 4d57c1d。

## 结论与范围

审查通过，合并到当前集成分支。固定名义年利率、共用日元本金、两方案独立还款方式/利率/期限。最新用户确认的默认两个视图、最多六个可配置视图取代早期三图方案。交点只表示所选指标高低关系反转，不表示整体最优。

保留双语路由 /tools/mortgage.html 与 /zh/tools/mortgage.html 的 noindex/nofollow。没有新增主页入口，没有接入真实 AI、变动利率、手续费模型或后台。未合并 main、push 或部署。

## 审查与集成修改

- 阅读工具组件、月历、模型、测试及最新实施记录，查看英文桌面、中文手机和极值截图。
- 应用 shared-core.patch：新增 prototype/fixed-schedules.mjs，主页和房贷页调用同一还款核心；移除房贷临时扩展算法。主页原有输入与 USD 展示语义保持，房贷页使用 JPY、1–600 月。
- 应用 route-check.patch：只增加两个明确列出的工具路由，保留原始路由基线及正式主页 SSR 检查。
- 修正 MortgageChart.vue：包含可聚焦按钮的 SVG 使用 role=group，避免静态图片语义遮蔽交互子元素。浏览器测试新增无障碍树中具名图表按钮断言。
- 将房贷数值测试纳入 npm run verify（check:mortgage）；专用浏览器检查仍可独立运行。

## 验证

- npm run verify：退出码 0。构建 56 页；检查 3068 个内部引用；15 项关键产物、既有路由基线与四个明确列出的 noindex 页面通过；安全检查、9 路由 smoke、正式中英文主页断言通过。
- 房贷数值：120 组金额/利率/期限边界、独立闭式公式、金额守恒、结清、167/168 期交点、相等与反转区别、无效输入、日期边界通过。
- 首页数值：独立现金流现值 oracle、零/微小/高利率、金额守恒等通过。
- node scripts/check-mortgage-browser.mjs：中英文 1440/390/320px、视图配置和数量上下限、交点交互与焦点、日期联动、表格、极值、SSR、深色/reduced-motion、SPA 文章宽度恢复通过；无运行错误。更新截图见 evidence/。
- 构建仍报告大 chunk 提示和两条既有中文项目 sidebar 配置提示，没有构建失败。不将本次集成当作全站性能验收。
- Chrome 自动化与无障碍树检查不能替代 Safari、实际手机和人工读屏验证，这些保留为上线验收项。

route-check.patch 与 shared-core.patch 保留为来源任务交接证据，已在本次集成应用，不应再次执行。
