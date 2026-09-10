# AI 解释器架构

2026-09-09。HTTP API 与函数已通过 aws_sam PR #23 合并部署到东京 personal-site stack。复用 api.ziliang.ninja，保留原 MNIST/proxy 路由；AI 是单独的 Node.js 22/arm64/128 MB Lambda。Python 函数是 Python 3.13/arm64。模板和 CI 统一在 aws_sam/personal-site；Terraform 管 dev Cognito，所有 AI 文档留在本仓库。

浏览器 Cognito 授权码 + PKCE 登录 → POST https://api.ziliang.ninja/v1/loan-explanations → HTTP API JWT authorizer → AI Lambda 参数校验和计算 → DDB 每日额度 → Bedrock Converse → 单次 JSON 响应。API 内部路径为 /loan-explanations，域名映射提供 /v1 前缀。

普通计算无需登录，AI 要求登录，可在 Cognito 页面注册。问题类型为曲线、期限、假设，中英文响应。前端只传数值参数和问题类型；提示词、计算摘要、身份和额度判断在私有后端。答案是模型自由生成的纯文本，不覆盖计算器结果，不执行 HTML 或 Markdown 链接。

每天每用户 20 次，以精确 dev issuer 和 sub 映射 bt-dev-<sub>，DDB 每人一行存 day/count。东京零点后的首个请求条件重置，正常请求条件加一。只有明确条件失败才继续有限重试，不重试不确定写入；已接纳的失败或取消仍计数，无退款。每日额度不等于网站总费用上限。

模型 amazon.nova-lite-v1:0，最多 1200 输出 token；模型等待 24 秒、Lambda 28 秒、网关 29 秒、客户端 30 秒。AI 路由独立限流（每秒 5、burst 10），Lambda reserved concurrency 10。API Gateway 负责 JWT 验签与 CORS，Lambda 不读取 HTTP header 做认证或 CORS。

三个 HTTPS 站点允许 CORS；localhost 仅在 Cognito 回调名单。AI Lambda 摘要日志与共享 API 访问日志保留 7 天，不记录请求/模型正文。告警复用 Terraform lambda_Errors，不覆盖已捕获的 HTTP 5xx 或 Lambda throttles。无 VPC、Guardrails、WAF、匿名额度、Secrets Manager、自定义打包、vendor 或流式响应。DDB 使用默认按需计费和静态加密，无 TTL/PITR，删除策略 Retain。

前端状态、测试和仍待真实验收的边界见 [交接](./handoff.md)、[前端](./frontend.md)、[协议](./contracts.md)、[验证](./validation.md)。
