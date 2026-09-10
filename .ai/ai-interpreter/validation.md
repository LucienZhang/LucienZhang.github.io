# AI 前端验证

## 已验证

- SAM PR #24 合并后的 Actions 34443485105 部署成功。
- 2026-09-10 再次检查真实 https://api.ziliang.ninja/v1/loan-explanations：三个 HTTPS 站点 Origin 的 OPTIONS 均 204，允许 POST/Authorization/Content-Type；无凭证 POST 均 401，CORS Origin 正确。未登录、未发送有效贷款请求、未调用模型。
- 客户端 9 项测试：PKCE S256、state/重放、token 仅内存、过期、静态托管补斜杠、无匿名调用、JSON 协议、401 清理、超时和取消。
- 浏览器全请求拦截夹具：双语登录往返、贷款参数恢复、登录后不自动请求、纯文本答案、剩余额度、401/429/503、取消、退出、错误 callback、320/390/1440 宽度。检查精确外部 URL，禁止真实网络。
- 最新 main 411192f 的独立 worktree 完整 `npm run verify` 通过：生产构建 58 页、4108 内部引用、路由/产物、安全、smoke、首页、120 个贷款场景、税务、9 项 AI 测试及 AI 浏览器回归。

## 尚未验证

真实 Cognito 用户的注册/登录/退出、已登录模型响应、计数和日志交付；ARM Python 函数实际运行及 MNIST 远程预测。不能用夹具证明以上内容。浏览器头部回调 URL 在 GitHub Pages 的线上重定向仍需发布后核对。

## 复现

- `npm run verify`：现有完整回归，包含 check:ai 和 check:ai:browser。
- `node scripts/check-ai-browser.mjs`：构建后的独立 Chrome 全请求拦截测试，不需要模型凭证，不产生推理费用。

不运行本地 SAM/Terraform/aws 命令。前端合并到 main 会走现有 GitHub Pages workflow；PR/本地验证不等于发布。
