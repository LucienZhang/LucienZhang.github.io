# AI 工作文档

- [项目计划](./PROJECT_PLAN.md)：项目各阶段与架构约束；旧阶段条目是历史记录。
- [当前决策](./phase5/homepage-design-plan.md) / [主页规格](./phase5/homepage-design-spec.md)
- [房贷规格及数值契约](./tools/mortgage/spec.md) / [筛股器空壳](./tools/stock-screener/spec.md)
- [日本税务工具](./tools/japan-tax/spec.md)：2025收入 / 2026住民税，规则和来源随规格维护。
- [验证与复现](./phase5/validation.md) / [剩余工作](./phase5/remaining-work.md)

## 保留规则

版本库保留当前规格、必要来源与公式、决策摘要、验证结论及可执行测试。baseline/ 包含构建验证实际读取的基线，不应作为临时输出删除。Phase 0–4.5 已有记录不在本次 PR 精简范围。

截图、生成效果图/提示词、浏览器原始输出与临时日志写入 .ai/artifacts/（gitignored）。它们用于本地审阅，不是自动图片对比测试基准；需要展示时可选择少量附在 PR，而不将全部二进制产物提交到源码仓库。旧版本已完整备份在本地 artifacts/pre-cleanup-cc817a8/，也可从 cc817a8 的 Git 历史恢复；干净克隆不包含这个本地目录。

新的持久文档更新现有规格或验证摘要，避免为每次对话新建重复计划/交接/报告。数值与交互测试放 scripts/。删除历史截图不改写 Git 历史，不等于缩小已有历史对象体积。
