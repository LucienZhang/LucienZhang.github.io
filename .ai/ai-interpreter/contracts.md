# AI 解释器 API v2

`POST /v1/loan-explanations`，Authorization Bearer Cognito access token，Content-Type application/json。HTTP API 内置 JWT authorizer 配置 pool issuer、本站 client audience，并要求 openid scope；业务代码检查网关 requestContext.authorizer.jwt.claims 的本站 client_id，将已知 issuer 与 sub 映射成 bt-dev-<sub>，缺失则拒绝；签名、issuer、scope 和有效期由网关负责。CORS 固定允许 https://lucienzhang.github.io、https://ziliang.red、https://www.ziliang.red，OPTIONS 与 CORS 响应头由 HTTP API 内置处理，Lambda 不读取请求头、不返回 CORS 头。客户端照常发送 JSON Content-Type；后端直接 JSON.parse，解析失败返回 400，解码后体积上限仍为 8 KB。

请求：

```json
{"apiVersion":"2","locale":"zh-CN","intent":"curves","input":{"currency":"JPY","amount":50000000,"annualRatePct":1.5,"months":420}}
```

只接受以上字段。locale 为 zh-CN/en-US；intent 为 curves/term/assumptions。JPY 本金为整数 1–10^10；年利率为有限数 0–20；月数为 12–600 且为 12 的倍数。请求最多 8 KiB。不接受任意提示词、结果、历史对话或用户 ID；账户身份仅来自网关。

成功响应：

```json
{"apiVersion":"2","explanation":"模型生成的完整解释文本","quota":{"limit":20,"remaining":19,"resetAt":"2030-01-01T15:00:00.000Z"}}
```

remaining 是该次计数更新后的值；并发请求可能使其随后变化。resetAt 为下次东京零点的 UTC 表示。响应 Content-Type application/json、Cache-Control no-store。v1 快照/事件协议不再支持，前后端需一起更新。

业务错误为 `{apiVersion:"2",error:{code,traceId}}`。401 重新登录、429 当日额度用尽、400 参数错误、503 配置错误/服务或计数不可用、502 模型响应错误或截断、504 模型超时。网关错误正文格式可能不同，前端按 HTTP 状态处理。

每次获得模型调用资格扣一次，无退款、模型自动重试或去重；额度写入只在明确条件失败时进行有限的跨日初始化/并发重试。服务端模型等待上限 24 秒，Lambda 28 秒；前端最多等待 30 秒。停止等待会使本地请求失效，但不能保证后端停止或不计额度。修改输入、退出或切换语言使旧响应失效。

输出为自由解释，不承诺每个模型数字正确，页面计算结果仍以计算器为准。模型失败显示错误，不再伪装成模型输出的固定文案降级。
