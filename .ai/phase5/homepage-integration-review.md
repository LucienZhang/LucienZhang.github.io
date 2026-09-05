# 主页原型集成审查

2026-09-05。用户授权审查 `codex/homepage-prototype` 后合并到当前 `codex/phase-5a0`。源提交 c9acfd4；目标原含筛股器空壳与基线修正 f273670。

审查 loan.mjs、HomepagePrototype.vue、client.ts、extendsPage、产物检查、源分支报告和测试。未发现阻止作为隔离原型合并的问题。检查无真实 AI/金融请求、scope 扩张或正式主页替换；固定月度公式、零利率、末期清偿、过期快照和定时任务清理符合原型边界。

唯一合并冲突为 scripts/check-build-output.mjs 的日志文案。保留当前52路由基线（含筛股器），叠加原型两条精确 noindex 路由；日志不再硬编码50页。未放宽路由匹配。

在集成工作树重新执行并通过：

- node scripts/check-prototype-loan.mjs：独立现值 oracle、手工例、零/小/高利率、边界、清偿与本金守恒、非法输入。
- npm run verify：54页构建、链接、关键产物与精确路由、security、7路由 Chrome smoke；完整命令退出0。本轮预先允许测试监听本地端口。
- node scripts/check-homepage-prototype.mjs：双语多视口、展开状态、输入错误、mock 各状态、焦点、SPA、SSR无JS和重排测试，退出0。更新的真实截图/checks.json 保存在 prototype-evidence；检查英文桌面与中文移动展开截图未见阻塞问题。
- git diff --check 通过。

验证日志 integration-verify.log、integration-browser.log 置于 prototype-evidence。本轮环境为 Node26.8.1；源分支记录为 Node22.18.0，不混淆。资源和时间预算沿源报告作为历史数据，本轮未重复基准测量，也未声称超标已修复。筛股器组件代码未变，其专项证据沿原交付。

非阻塞后续：USD单图主页示例与最新日元三图工具需求有意分离；mock 不是服务；必要原型断言尚未加入日常verify；公共CSS/初始JS略超候选预算；跨浏览器/真实设备/人工读屏未全面验证。详见 remaining-work.md。

本次仅本地集成，不替换 / 和 /zh/，不合并 main、不推送/部署、不实现房贷详细工具。未提交贷款文档继续保留，不混入本合并。
