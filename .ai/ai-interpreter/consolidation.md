# Personal-site 合并记录

aws_sam PR #23 已合并；Actions 34346766280 部署成功。用户已删除旧 personal-site-ai-dev stack 及保留表 personal-site-ai-dev-Ledger-1OESUKDJC692W。

当前只更新现有 personal-site stack，复用 PersonalSiteApi 和 /v1 域名映射。AI 代码仍在 personal-site/ai，资源定义在 personal-site/template.yaml。三个函数均 arm64，Python 3.13 与 Node.js 22 分别按 CodeUri 构建。AI 内部路由 /loan-explanations，外部地址 /v1/loan-explanations。

仅 AI event 配置 Cognito 和路由限流，原 MNIST/proxy 保持公开访问规则。统一 API CORS 与访问日志。新建 AI Lambda、专属 IAM role 和 AiQuotaTable，配额重新开始；旧表无需迁移。

统一 personal-site workflow 先运行 Python/Node 测试，再调用 bitinker/sam-action@main。PR 只创建不执行的 changeset；main push 或手动触发部署所选分支，config-env Prod。复用 dev Cognito 不受 Prod 配置名影响。

PR plan 确认现有 API/Stage/两个 Python 函数 Replacement=False，无资源删除；三个 arm64 构建成功，4 项 Python/19 项 Node 测试通过。仍需真实旧接口及 AI 运行验收，plan/build 不是 native library 实际加载或模型调用的证明。

参考：[合并 PR](https://github.com/bitinker/aws_sam/pull/23)、[部署](https://github.com/bitinker/aws_sam/actions/runs/34346766280)、[SAM Globals](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-specification-template-anatomy-globals.html)。禁止本地运行 SAM、Terraform、aws 命令。

## 已合并资源命名调整

Terraform PR #155、SAM PR #24 已合并；最新 SAM 部署 Actions 34443485105 成功。用户确认 dev-site client ID 仍为 44vib0bmejkp82ghvfsvffiio1，前后端无需变更 ID。

直接修改现有 `aws_cognito_user_pool_client.personal_site`，名称改为 `dev-site`；不将保留 client ID 作为约束，若部署结果改变 ID 则同步 SAM 和前端配置，合入旧 BIM 客户端的 localhost:3000 根回调、profile scope 和密码登录方式，删除旧 BIM client。用户仍在同一个 pool；使用旧 BIM client ID 的外部应用需切换到共享客户端 ID，旧客户端会话需重新登录。仓库文本检查未发现旧资源引用，不能证明所有外部应用都未使用旧 ID。

SAM `AiQuotaTable.TableName` 使用 `${AWS::StackName}-ai-quota`，当前 stack 对应 `personal-site-ai-quota`。现有随机名称表会被替换，用户确认旧表为空，`UpdateReplacePolicy: Delete` 在替换成功后删除旧表。Lambda 环境变量和 IAM 继续引用资源，自动切换到新表；新表为空，因此当天额度重新开始计数。不做数据迁移；现有 `DeletionPolicy: Retain` 仍用于未来删除整个 stack 时保护当前表。
