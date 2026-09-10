# AI 解释器交接

2026-09-10 当前状态：Terraform PR #154、SAM PR #22 和合并 PR #23 均已合并。用户删除了旧 personal-site-ai-dev stack 和 Ledger 表。新资源已部署到现有 personal-site stack，复用 PersonalSiteApi/api.ziliang.ninja；Actions 34346766280 成功。三个 Lambda 均 arm64；Python 3.13、AI Node.js 22。

SAM PR #24 和 Terraform PR #155 也已合并；最新 SAM 部署 Actions 34443485105 成功。共享客户端名称为 dev-site，ID 不变；DDB 固定名 personal-site-ai-quota，替换删除空旧表。

前端在 codex/homepage-ai-client 分支，已使用 https://api.ziliang.ninja/v1/loan-explanations。首页旧 mock 已替换为登录后真实 JSON 请求，callback/logout 页面、参数恢复、剩余额度、取消和失效状态已实现。当前没有合并/发布前端，不宣称页面已上线。

Cognito pool ap-northeast-1_3lKGfNGmK、client 44vib0bmejkp82ghvfsvffiio1、域名 https://bitinker-dev.auth.ap-northeast-1.amazoncognito.com。OAuth 回调/退出使用注册的 /callback 与 /logout，静态托管可补尾斜杠。token 仅在内存，刷新需重新登录；登录后不自动发起 AI 请求。普通贷款计算无需登录。

2026-09-09 线上公开接口已核对：三个 HTTPS 站点的 OPTIONS 均 204，未登录 POST 均 401，均带匹配 Origin 的 CORS 响应头。未使用真实登录凭证，未调用模型。本地浏览器用全请求拦截夹具验证登录往返及业务状态，不能替代真实已登录验收。

剩余：前端发布；真实 Cognito 登录/注册/退出、首次模型响应、额度和日志联调。localhost 只在 Cognito 白名单中，真实 API CORS 不允许 localhost。所有 AI 文档保留在 homepage .ai/，禁止本地执行 SAM/Terraform/aws 命令。

详见 [前端接入](./frontend.md)、[协议](./contracts.md)、[合并实施](./consolidation.md)、[验证](./validation.md)。后续 AWS 修改从 main 新开分支，已合并后台分支不再继续开发。
