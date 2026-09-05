# 新任务入口 — A v2 隔离 Vue 原型

2026-09-05。用户已明确认可 A v2，随后同意“先提交设计成果，再另开 session 实现”的流程。当前任务只提交设计文档与图片；新任务负责 Phase 5A.4 隔离原型。不要重新征询 A/B/C、受众、邮箱、宠物或首个 demo。

## 阅读顺序

1. .ai/PROJECT_PLAN.md、.ai/phase4.5/2026-09-05.md、.ai/phase3.5/2026-09-04-home.md。
2. homepage-design-plan.md、homepage-audit.md、homepage-ia.md。
3. homepage-a-refinement.md，查看 a-refinement 下三个 *-v2.png；忽略图片内已记录的生成错误。
4. homepage-design-spec.md、homepage-acceptance.md；最后检查实际 theme、Home.vue、全局样式、locale、package.json 和测试脚本。

用户授权：无需再次确认即可实现可点击中英文隔离预览、确定性贷款计算和本地 AI mock，运行必要验证并迭代。保留 Vue 技术路线；不启动 /goal，不运行 SAM/Terraform/aws；外部 API/库和计算公式查官方资料，不猜签名。不要求新增 sub-agent。

## 第一个实现切片

在新 worktree 核对本设计提交已包含在 HEAD 历史中。若工作区没有这些文件，先找回本提交，不能从空白 main 重做设计。选择两个成对隔离预览入口（路径由实现任务按 VuePress 约定确定并记录），不覆盖正式主页或导航。以当前 VuePress SSR 构建方式集成，样式严格作用于预览；预览路由不加入正式站点菜单，设 noindex，不部署。

先贯通完整页面与中英文，再实现可独立测试的计算模块、SVG/表格、参数和内联 mock。默认场景与舍入先记录依据；示例不是金融推荐。随后完成验收清单，保存真实浏览器截图与实现日志 .ai/phase5/homepage-prototype-report.md。

## 明确不做

不替换正式 / 与 /zh/；不改文章导航、全站配色；不删除旧资产；不引入真实 AI、API key、股票数据或税务服务；不将效果图当生产页面。不自动提交、推送、合并或部署新原型代码。当前用户批准的是设计成果提交，原型交付后停在审阅点。

## 必须保留的视觉修订

品牌英文 Ziliang（Sacramento）、中文张本人（Slidefu），只在品牌用手写；去所有装饰编号；适度放大区块标题，导航仍克制。© 年份 Ziliang Zhang 页脚，Gmail lucienzhangzl@gmail.com。中文算法与 API 标英文内容，MNIST 使用中文页面。首屏 CTA 向下聚焦年限，工具贷款链接返回上方。移动工程流程不能丢 AI explanation 或横向溢出。英文语言切换应与导航协调，不照搬图片错位。

完成后报告预览入口、实际截图、验证和待审阅点，等待用户批准正式替换。
