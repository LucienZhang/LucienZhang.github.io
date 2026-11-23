# 主页与工具后续工作

2026-09-07。PR #14 已合并 main 并部署；当前收尾分支 codex/homepage-launch-closeout 包含品牌、导航和工具体验状态，尚未合并发布。

## 已交付

- A v2 主页设计与实施规格，用户已确认。
- 中英隔离主页原型 c9acfd4，用户在原型任务中确认视觉与使用感受；本轮按授权审查合并。
- AI 筛股器双语空壳 7bc48f4 已合并，只有本地意图草稿与空状态，无筛选、数据或 AI 功能。
- 房贷工具分支 codex/mortgage-tool（5c980e0）已交付双语固定利率比较；最新用户确认方案为默认两个视图、最多六个可配置视图，替代早期三图规格。集成审查见 ../tools/mortgage/spec.md。

## 推进顺序与边界

A. **完成本轮收尾 PR**：品牌 logo/favicon 定稿、旧 PNG 删除、全站共享导航与品牌对齐，文章目录补齐及手机焦点管理；主页及税务页面提供直接入口和适用年度，不额外显示“可体验”标签，默认导航补上房贷/税务入口；筛股器仍规划中。代码与文档验证后提交推送，合并部署后复核 favicon、双语入口、导航及窄屏焦点。推送不代表发布。
B. **AI 解释器接入与验收**（2026-11-23：Bedrock 模型权限未开通，公开页已用 `aiExplanationLive=false` 隐藏入口，可用 `?ai-preview=1` 预览；先按 CloudWatch 原始报错区分 IAM、推理配置文件 ID、配额为 0 或账户级限制，必要时改用 Anthropic API）：后端已部署到共享 personal-site stack；本分支替换首页 mock，登录后使用 JSON 请求与每日 20 次额度。前端发布后验证真实 Cognito 登录、模型响应与额度；实现与验收见 ../ai-interpreter/handoff.md。

C. **AI 筛股器 MVP 先确认需求**：市场/证券范围、数据源及许可与更新频率、首批条件确定后，再设计自然语言到明确筛选条件与后端。空壳不是筛股实现完成，无行情、伪造结果或真实 AI。

D. **可延后独立任务**：税务新收入年度及适用范围、房贷变动利率/费用、全站大 chunk、已有外部 proxy 后端安全审计。不混入本轮 PR。

### 搜索索引与后续工作方式

- 三个工具双语页本轮继续 `noindex, nofollow`。`noindex`禁止搜索收录但不影响公开链接访问，不是权限控制；`nofollow`是对链接的抓取提示，不是防收录必需条件。税务体验版和筛股器空壳暂留noindex；房贷正式推广时可先评估开放索引，届时一并评估是否移除nofollow。首页入口不等于开放索引。开放前须由用户确认产品定位、年度与支持范围、说明/来源和维护责任，补齐相应验收后另行批准修改 robots；筛股器须先交付真实 MVP。
- 后续实现从合并后的 main 建独立 worktree；任务须明确共享图表、计算核心、路由和公共样式是否属于范围。
- 需求未确定先设计文档；有单一可验收目标后才考虑 `/goal`，不启动“完成整个网站”的无限目标。
- Safari、实际手机触控、人工 VoiceOver/NVDA、真实浏览器缩放仍待人工；本地自动化与线上实验室检查不代表用户性能数据。

## 主页贷款 demo 更新（用户已批准并实施）

- 保持 A v2 页面布局与一张月供对比图，采用工具页相同的朱红/橄榄色、实虚线、图例与交点提示。
- 示例统一为 JPY 50,000,000 / 1.5% / 35 年，对应工具页默认 420 月。两条线固定比较元利均等和元金均等；首页共用本金、利率与期限，不提供两方案独立配置。
- 年限仍为主要交互，本金/利率收在“更多参数”；只保留首月月供和总利息的紧凑摘要。无多图管理、日期选择器、完整还款明细或税务内容。
- 主入口“打开完整房贷比较”指向对应语言工具页，携带经过验证的当前本金、利率与期限；完整页负责多指标、独立方案、月份和数据表。已增加工具页的安全参数初始化，不能直接信任 URL 值。
- AI 解释保持次级入口，仅登录后可请求；普通计算与图表无需登录。前端发布状态见 AI 交接文档。
- 复用共享计算核心与图表呈现逻辑；横轴首页优先经过年数，详情保留年月。已验证中英文桌面/移动、零利率、交点、参数传递和 SSR；结果见 validation.md。


2026-09-09：AI 后端已合并到 personal-site 并部署；本分支首页接入 Cognito 登录和共享 API，替换旧模拟解释。普通计算不要求登录。当前前端尚未发布，状态与验收见 [.ai/ai-interpreter/handoff.md](../ai-interpreter/handoff.md)。

## 2026-11-23 墨与朱改版后续

- Bedrock 权限开通并完成真实登录、推理、额度验收后，把 `aiExplanationLive` 改为 true，并恢复首页 AI 解释按钮相关断言。
- 手写模型如需更新：`python3 -I scripts/digits/train.py <MNIST目录> docs/.vuepress/public/static/models/digits-mlp.bin`，同时更新 `lib/digits/meta.json`，再跑 `node scripts/digits/check-model.mjs`。
- 既有问题（main 上同样存在）：`check-japan-tax-browser.mjs` 第 405 行仍按旧文案断言首个 `.preview-note` 不含“2025”；筛股器专项需 `PREVIEW_ORIGIN` 预启动服务器。
- Safari、实体手机触控书写和 VoiceOver 仍待人工检查。

## 2026-11-23 改用 Claude API

- 后端 bitinker/aws_sam PR #26：Bedrock → Claude API（Opus 5.5）+ Workload Identity Federation，无 API key。在 AWS 开启 Outbound web identity federation，在 Anthropic Console 创建 AWS 联邦（规则 subject 为 `arn:aws:iam::258410268602:role/personal-site-ai`），把组织 ID 与规则 ID 写进 `personal-site/template.yaml` 中 AiFunction 的环境变量。
- 部署后用 `?ai-preview=1` 做真实登录、解释、额度与日志验收；通过后把 `aiExplanationLive` 改为 true，并把首页 AI 链路的 Claude 站去掉“接入中”。

## 2026-11-23 AI 解释上线

- 后端 bitinker/aws_sam#26 已部署，用户真实验收成功；前端 `aiExplanationLive = true` 正式开放。
- 待办：AI 解释面板体验优化（面积小、层级弱、答案撑高相邻的手写识别卡），方案待用户选择。
