# 首页 AI 前端接入

## 页面和配置

首页解释入口只使用真实客户端，不再提供旧的固定回答、模拟登录或金额定位按钮。普通贷款计算无需登录；AI 需要 Cognito 登录。前端只提交 apiVersion、locale、intent 和当前数值参数，不传用户 ID 或提示词。

- `services/ai-interpreter/client/site-config.mjs`：公开 API URL、Cognito 域名/client ID 和 callback/logout 域名白名单。缺 API URL 时明确不可用，不发送请求。
- `session.mjs`：授权码 + PKCE S256，校验一次性 state、事务时限和 callback 路径；token 仅在内存。不保存 ID/refresh token、不自动续期。刷新页面需重新登录，可复用 Cognito 登录会话。
- `browser.mjs`：浏览器单例，开始登录/退出、保存登录前参数与语言、绑定 transport。sessionStorage 只存一次性 PKCE 事务和返回用参数。
- `transport.mjs`：带 access token 的单次 JSON POST，30 秒截止时间、取消及响应检查，无自动重试。401 清除登录凭证；429 同时可能来自每日额度或网关节流，提示不假定一定用完每日额度。
- `AiExplanationPanel.vue`：登录门槛、三个预设问题、纯文本答案、响应后的剩余额度、错误提示、停止等待、参数变更后标记旧回答。额度为上次响应时快照，多标签页可能改变它。
- `AuthCallback.vue` 与 callback/logout Markdown：noindex、no-referrer 回调页面，移除授权码查询参数；成功后用 SPA 导航返回主页以保留内存 token。注册使用 Cognito 登录页入口。

Cognito 注册的 URL 是 `/callback` 和 `/logout`。静态输出为 `/callback/index.html`、`/logout/index.html`；浏览器测试覆盖主机补尾斜杠，token exchange 始终使用原注册 redirect_uri。

## 当前发布状态

SAM PR #24 已合并，2026-09-10 核对部署 Actions 34443485105 成功。前端接入准备提交 PR，尚未合并/发布。共享 API 已于合并 PR #23 后部署成功（Actions 34346766280），前端固定使用 https://api.ziliang.ninja，transport 追加 /v1/loan-explanations。前端尚未发布，不能将本地代码更新称为页面已上线。三个 HTTPS 域名受后端 CORS 支持；localhost 只在 Cognito callback 白名单中，真实 API 不允许 localhost CORS。

## 验证

`npm run check:ai` 运行客户端协议/PKCE 测试，并已加入 npm run verify。

无真实网络的浏览器联调：

```sh
npm run build
node scripts/check-ai-browser.mjs
```

构建使用正式 API 地址，测试脚本拦截请求并检查完整地址，所有接口响应都来自本地夹具。脚本用本地 Chrome 拦截站点、Cognito 和模型 API 的所有请求；不使用真实账户，也不产生推理费用。覆盖双语登录往返、输入恢复、token 不落盘、无登录后自动请求、401/429/503、取消、纯文本展示、退出与窄屏。

真实公开接口验收已通过：三个站点 Origin 的 OPTIONS 返回 204 并允许 Authorization/Content-Type，未登录 POST 返回 401 且 CORS Origin 正确。仍待真实 Cognito 注册/登录/退出、一次真实解释、额度扣减和 CloudWatch 交付。不得把夹具结果视为已登录云端验证。
