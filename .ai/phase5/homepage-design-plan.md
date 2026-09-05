> 最新决策（2026-09-05）：A v2 已获确认；以 [设计规格](./homepage-design-spec.md)、[验收清单](./homepage-acceptance.md) 和 [实现交接](./homepage-implementation-handoff.md) 为当前执行依据。下文早期停止点保留为阶段历史。

# Phase 5A 主页设计与实现交接计划

> 状态：用户已确认 A v2 完整设计，并授权提交设计成果、另开任务制作隔离 Vue 原型。Phase 5A.3 交接规格已整理，正式主页替换仍未授权。入口：[实现交接](./homepage-implementation-handoff.md)。
> 编写日期：2026-09-05
> 起点：`main` 已完成 Phase 0–4.5 维护升级；commit `740de38` 已部署并通过 GitHub Actions run `33945849908`

## 1. 目标

将当前个人主页重新设计为具有明确原创感的 **Programming × AI showcase**。新主页应让访客迅速理解张子良的技术定位，通过真实项目、知识内容和可体验能力证明编程与 AI 技能，并为后续能够与页面内容互动的 chatbot 建立统一的产品入口。

这不是单纯的换色、套模板或增加聊天浮窗。目标是形成一套可持续扩展的内容结构和视觉语言，使未来的工具页面、AI demo 和 chatbot 能自然进入同一个体验。

## 2. 产品原则

1. **能力以证据展示。** 项目、技术取舍、交互 demo 和结果优先于技术 logo 墙。
2. **创意服务于叙事。** 至少有一个令人记住的原创交互，但不能牺牲可读性、导航和性能。
3. **Chatbot 是增强层。** 它可以回答问题、定位或强调页面内容，但不能成为访问作品和联系方式的唯一入口。
4. **中英文均为一等体验。** 不能只完成英文视觉后机械套用中文。
5. **渐进增强。** JavaScript、动画或 chatbot 后端不可用时，核心 showcase 仍完整可访问。
6. **保持 Vue 技术路线。** 本阶段不迁移 React，不引入 MUI，也不让 Ant Design Vue 接管主页视觉。
7. **先选择，再实现。** 设计方向、内容结构和 chatbot 角色未经用户确认前，不修改正式主页。

## 3. 当前基线与必须先读的文件

新任务开始时必须完整阅读：

- `.ai/PROJECT_PLAN.md`
- `.ai/phase4.5/2026-09-05.md`
- `.ai/phase3.5/2026-09-04-home.md`
- 本文件
- `docs/.vuepress/theme/index.ts`
- `docs/.vuepress/theme/components/Home.vue`
- `docs/.vuepress/theme/components/assets/css/home.css`
- `docs/.vuepress/theme/components/assets/css/fontawesome-all.min.css`
- `docs/.vuepress/theme/components/assets/css/source-sans-pro.css`
- `docs/.vuepress/styles/index.scss`
- `docs/.vuepress/config.ts`
- `package.json`

同时遵循任务环境注入的 `AGENTS.md` instructions；当前仓库根目录没有实体 `AGENTS.md`，不得因此中断审计。

当前实现的重要事实：

- VuePress 默认主题通过 `@theme/VPHome.vue` alias 覆盖为自定义 `Home.vue`。
- 主页仍源自旧 HTML5 UP 视觉体系，使用独立 `home.css`、Font Awesome webfonts、背景图和头像等资产。
- 中英文共享同一个 Vue 组件，由 locale 决定文案、路径和 Typed 字符串。
- 当前交互包含 Typed 动画、响应式布局、社交链接和微信二维码 Modal。
- Phase 3.5 已修复非法 `<body>` 嵌套和 hydration mismatch；重新设计不得引入同类问题。
- `Home.vue` 的 `aria-labelledby="main-title"` 尚缺对应 id，应随新结构修复。
- 现有自动基线是构建 50 页、内部链接和关键产物检查、安全 fixture、7 路由 Chromium smoke。
- MathJax、BIM、Font Awesome 和部分旧组件仍有大 chunk；Font Awesome 与旧主页 CSS 在本阶段评估，其他对象不顺带重写。

## 4. 建议的信息架构

以下是探索起点，不是已经批准的最终布局：

1. **Hero / identity**：姓名、技术定位、核心主张和首要行动。
2. **Featured work**：4–6 个最能证明能力的项目或案例，呈现问题、方法、技术取舍和结果。
3. **Capability map**：将编程、系统、AI、数据和产品能力组织成可理解的能力体系，而非堆叠图标。
4. **AI lab / tools**：现有交互 demo、后续工具页和实验项目入口。
5. **Knowledge**：编程、算法、ML 等内容的精选入口。
6. **About / contact**：个人背景、协作方式和联系方式。
7. **Conversational layer**：允许访客通过自然语言探索以上内容。

设计阶段必须重新确认：目标受众、首要行动、展示内容及排序；不能未经确认就把这份建议直接实现。

## 5. Chatbot 与主页的关系

### 5.1 建议定位

Chatbot 应是“交互式作品导航员”，而不是孤立客服窗口。可能的用户入口包括：

- Ask what I build with AI.
- Show me backend and architecture work.
- Which projects demonstrate production engineering?
- What can I try on this site?

回答可以引用项目或文章，并触发页面滚动、聚焦或展开对应区块。所有被引用内容同时必须能通过普通页面结构访问。

### 5.2 Phase 5A 只定义并模拟的状态

- 欢迎和关闭状态
- 推荐问题
- 输入、发送和取消
- 模拟流式回答
- 项目/文章引用
- 页面区块聚焦
- 空输入、网络错误、超时和限流展示
- 移动端展开方式
- reduced-motion 行为

本阶段使用静态 fixture 或 mock adapter，不调用真实模型，不加入 API key，不新增 chatbot 后端。真实模型、检索、流式协议、限流、观测和滥用控制属于后续独立阶段。

## 6. 从设计到上线的任务拆分

### Phase 5A.0 — 产品与内容审计

目标：先确定要传达什么。

工作：

- 捕获当前中英文主页的桌面与移动基线。
- 审计页面结构、内容、图片、字体、图标、动画、外链和 bundle 归属。
- 盘点可展示的项目、AI 能力、编程能力、文章和 demo；缺少事实时列为用户输入，不编造经历或成果。
- 定义主要受众、希望形成的第一印象和首要行动。
- 标记必须保留、可以重构、可以删除和需要用户决定的内容。

产物：更新本文件或增加 `.ai/phase5/homepage-audit.md`。

方式：Codex Plan 模式；不使用 `/goal`；不修改正式主页。

停止点：让用户确认受众、内容重点、项目清单和首要行动。

### Phase 5A.1 — 信息架构与交互模型

目标：确定页面叙事和 chatbot 如何参与。

工作：

- 给出内容层级、页面区块和桌面/移动信息流。
- 给出 chatbot 状态机、页面联动和无后端 fallback。
- 给出低保真 wireframe 或可读的结构原型。
- 明确导航、普通链接和 chatbot 探索三者的关系。

产物：`.ai/phase5/homepage-ia.md`，以及必要的线框图或原型。

方式：Codex Plan 模式；需要用户持续审阅。

停止点：信息架构和 chatbot 角色得到用户确认。

### Phase 5A.2 — 三个创意方向

目标：比较真正不同的体验，而不是只比较配色。

每个方向至少给出：

- 核心隐喻与一句话设计主张
- 桌面首屏和移动首屏
- 内容如何展开
- 代表性交互
- chatbot 如何进入和影响页面
- 字体、色彩、图形和动效方向
- 技术复杂度、性能与无障碍风险
- 与个人定位的适配理由

可从但不限于以下方向展开：

- AI Observatory：研究观察站、能力节点与数据流。
- Living Portfolio：回答和访客意图会重新强调作品的动态作品集。
- Personal AI Workspace：有工作台或命令界面气质，但保留清晰的视觉内容层。

不要把常见紫蓝渐变、玻璃卡片或终端外壳本身当作创意。差异必须体现在叙事、布局和交互机制。

工具：

- ImageGen 可用于 moodboard、视觉概念、纹理和高保真 mock。
- 需要实时交互的主视觉优先用 HTML/CSS/SVG/Canvas 小型原型验证。
- 可使用 Web Search 做定向参考；除非用户明确要求系统性趋势研究，否则不使用 Deep Research。

方式：交互式任务，不使用长时间 `/goal`。

停止点一：用户选定总体方向。

停止点二：用户确认该方向的桌面和移动高保真稿。

### Phase 5A.3 — 设计系统与实施规格

目标：把选中的效果变成可执行规则。

至少定义：

- 颜色及语义色
- 中英文字体、字号和排版层级
- 布局网格、内容宽度和响应式断点
- 间距、边框、圆角、阴影和层级
- hover、focus、active、loading、error 状态
- 动效时长、easing、进入/退出和 reduced-motion
- 浅色/深色策略
- chatbot 各状态的视觉规则
- 资产格式、加载策略和替代文本
- 旧 CSS、Font Awesome、字体和图片的迁移/删除清单

产物：`.ai/phase5/homepage-design-spec.md` 和 `.ai/phase5/homepage-acceptance.md`。

方式：Codex Plan 模式。

停止点：规格和验收条件得到用户确认，才可进入正式实现。

### Phase 5A.4 — 可运行原型

目标：用最小真实代码验证选定方向在浏览器中成立。

范围建议：

- Hero 和核心背景/动效
- 一张代表项目卡
- 一个能力区块
- chatbot 入口、推荐问题及一段 mock 对话
- 桌面和移动布局

原型不迁移全部内容，不先删除旧主页。它必须回答：视觉是否适合真实浏览器、动效是否干扰阅读、chatbot 是否融入叙事。

方式：普通 Codex 交互任务，在 Worktree 内实现；用户通过截图和浏览器频繁审阅，不使用 `/goal`。

停止点：用户明确批准进入生产实现，或要求返回设计阶段。

### Phase 5A.5 — 正式实现

目标：依据已批准规格完成可上线主页。

此阶段适合一个独立 `/goal`，目标必须包含：

- 中英文完整实现
- 响应式、键盘访问、语义结构和 reduced-motion
- chatbot mock adapter 及未来真实 adapter 的清晰边界
- SSR/hydration、生命周期和资源清理
- 旧主页资产清理
- 自动验证、浏览器验证和体积对比
- Phase 5 文档更新
- 完成后停在未提交状态，等待用户审阅

不得顺带实现真实 chatbot 后端、升级 BIM/Three/MathJax 或修改文章内容。

### Phase 5A.6 — 独立审阅与上线

1. 用户检查真实浏览器效果。
2. 使用 `/review` 审阅相对基线分支的完整 diff。
3. 修复确认合理的问题并重新验证。
4. 用户授权后提交、push、创建/合并 PR。
5. 跟踪 Pages workflow 并验收线上中英文首页、静态资源、404 和 chatbot fallback。

## 7. 验收标准

### 7.1 产品与设计

- 首屏 5–10 秒内能够识别 Programming × AI 定位。
- 项目展示问题、方法、技术判断或结果，而非只有技术名称。
- 至少一个原创交互具有记忆点，同时不妨碍阅读和导航。
- Chatbot 与页面内容联动，不是孤立浮窗，也不垄断内容访问。
- 中英文文案长度变化不会破坏版式。
- 桌面和移动端都有经过设计的结构，不是简单等比缩放。
- 不呈现为 MUI、Ant Design 或通用 AI 模板。

### 7.2 功能与兼容

- `/` 和 `/zh/` SSR 正常，无新增 hydration、warning 或 error。
- locale、导航、外链、Modal 和普通内容访问正常。
- Chatbot mock 覆盖推荐问题、输入、模拟流式、引用、错误和恢复。
- Chatbot/JavaScript 不可用时，核心内容仍可访问。
- 页面所有主要操作可用键盘完成，焦点可见。
- 动画支持 `prefers-reduced-motion`。
- 组件卸载后不存在遗留 timer、listener、animation frame 或网络任务。

### 7.3 视觉矩阵

至少保存并审阅：

- 1440px 桌面
- 1280px 笔记本
- 768px 平板
- 390px 手机
- 英文和中文
- 正常动画和 reduced-motion
- 浅色/深色（仅在设计选择双主题时）

视觉验收既要与批准的 mock 对比，也要检查真实内容溢出、滚动、hover、focus、Modal 和 chatbot 展开状态。

### 7.4 工程与性能

- `npm run verify`
- `git diff --check`
- 浏览器控制台无新增错误
- 自动检查保持 50 路由与关键静态产物基线
- 记录改造前后首页 JS、CSS、字体和图片传输/压缩体积
- 首页专属视觉代码不进入所有文章页面的公共大 chunk
- 删除的旧 CSS、Font Awesome 或图片不再被源码和产物引用
- 至少完成 Chromium 自动验证以及 Firefox/Safari 人工验收记录

性能预算在 Phase 5A.0 获得真实首页基线后确定，不以提高 chunk warning 阈值代替优化。

## 8. 新任务与工具选择

### 设计任务

- 在当前本地项目中新建 Codex 任务。
- 使用 Worktree，从最新 `main` 开始。
- 建议任务名：`Phase 5A homepage design`。
- 先使用 Plan 模式，不启动 `/goal`。
- 需要图片概念时使用 ImageGen；需要交互判断时优先构建小型浏览器原型。
- 设计选择由一个主任务保持一致性；可将资源、性能、无障碍等客观审计交给 sub-agent，但不让多个代理独立拼接最终审美。

### 实现任务

- 设计规格获批后另开 Worktree 任务。
- 使用 `/goal` 执行 Phase 5A.5。
- 目标只包含一个可验证结果，不混入工具页、真实 chatbot 后端或大型业务依赖升级。

### 审阅任务

- 实现完成后使用 `/review` 或独立审阅任务检查完整分支 diff。
- 审阅不应直接替代用户的视觉验收。

## 9. 新设计任务启动提示词

```text
遵循任务环境注入的 AGENTS.md instructions，并完整阅读：

- .ai/PROJECT_PLAN.md
- .ai/phase4.5/2026-09-05.md
- .ai/phase3.5/2026-09-04-home.md
- .ai/phase5/homepage-design-plan.md
- 当前中英文主页、主题和样式实现

本任务执行 Phase 5A 的设计探索阶段。

主页的核心目标是展示我的编程能力和 AI 相关能力，并为以后能够与页面内容互动的 chatbot 建立统一体验。先完成 Phase 5A.0 的内容、视觉资产、响应式、性能和技术约束审计，再进入信息架构与创意方向探索。

设计选择未经我确认前，不要修改正式主页。提出三个方案时，必须让它们在信息架构、视觉语言和交互机制上真正不同，而不只是换颜色。可以使用 ImageGen 制作视觉概念，也可以做隔离的小型交互原型。

保持 VuePress/Vue 架构，不迁移 React/MUI，不让 Ant Design Vue 接管主页，不接入真实 chatbot 后端，不把密钥放进前端，不修改文章和既有业务组件。

把审计和设计决策持续写入 .ai/phase5/。遇到目标受众、内容重点、代表项目、首要行动和视觉方向等主观决策时停下来让我选择；不要在设计未批准时启动 /goal 或进入生产实现。
```

## 10. 当前交接状态

- 维护升级和部署验证已经完成。
- 本文件是 Phase 5A 的流程与约束来源，不代表创意方向已经选定。
- [Phase 5A.0 审计](./homepage-audit.md) 已记录用户决策：AI 应用优先，贷款比较为首个体验，筛股器为后续重点作品，Gmail 为联系入口。
- [Phase 5A.1 信息架构](./homepage-ia.md) 已获用户确认。
- [Phase 5A.2 三套视觉方向](./homepage-visual-directions.md) 已生成，含英文桌面、中文移动与解释状态；待用户选择后继续细化。
- 当前没有批准修改正式主页、引入新依赖或实现真实 chatbot。
