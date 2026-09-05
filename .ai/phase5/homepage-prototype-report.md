# A v2 隔离 Vue 原型交付

2026-09-05。设计基线 `14c3cae6093196cc6ef7d4c1583110da30e3da58` 已通过 `git merge-base --is-ancestor` 确认包含于当前 HEAD；工作目录为 `/Users/lucien/.codex/worktrees/7909/LucienZhang.github.io`。用户已确认视觉与使用感受，技术审阅完成后已授权保存本地提交；未推送或部署，正式主页替换仍是后续步骤。

## 试用入口

- [中文预览](http://127.0.0.1:4175/zh/preview/home.html)
- [English preview](http://127.0.0.1:4175/preview/home.html)

本任务保留了绑定 `127.0.0.1:4175` 的静态服务。如果进程关闭，在本 worktree 中运行 `python3 -m http.server 4175 --bind 127.0.0.1 --directory docs/.vuepress/dist`。需要重新构建时，使用 Node 22.18.0，运行 `npm ci`、`npm run build`。开发模式也可运行 `npm run dev`，访问相同两个路径。

先调年限，随后展开“更多参数与图表明细”修改金额或利率，或选某年的首月查看图中节点。点击“解释差异”，选择推荐问题；改变参数后旧回答会标记过期，主动点击更新才重新生成。输入框仅接受三个推荐问题的完整文本，其余问题显示范围外提示。展开“原型审阅：模拟状态”可选择网络错误、超时或限流，然后再次选择问题触发；成功模式下可重试恢复。完整月度表格使用原生 details 展开，并允许局部横向滚动。

## 实现与边界

- 两个 Markdown 页面使用独立 `HomepagePrototype` 布局，布局通过 Vue async component 懒加载；两个页面均为 `noindex, nofollow`，未加入正式 navbar。版权年份由 `extendsPage` 在构建时写入页面数据，SSR 与客户端使用同一值。
- 正式 `/`、`/zh/`、文章、Home.vue、全站样式源码、旧图片/字体/二维码及依赖版本均保留。唯一现有配置改动是针对本布局的版权年份；产物检查保留原 50 路由基线，并额外要求精确两个 noindex 预览。
- 暖白、朱红、衬线主标题、无衬线区块标题、开放式 SVG、五区块与 copyright 均已实现。品牌沿用 Sacramento / Slidefu；英文 Ziliang、中文张本人，个人姓名为 Ziliang Zhang / 张子良。
- 中文算法和 API 标“英文内容”，MNIST 链接中文页。Gmail、GitHub、LinkedIn、Goto、VuePress 贡献均使用交接指定链接。Goto 与 VuePress PR 本轮只读 HTTP 核验为 200；不声称项目运行状态已测试。
- 工程内容为历史经历概括，不陈述当前职位或虚构绩效。筛股器与日本税务工具仅为规划，无假按钮或数据。
- 解释是本地定时 mock，不联网、不调用模型，不持有 API key。回答消费同一个计算结果快照，不能改变数值；取消、关闭、参数编辑、locale 变化及卸载会清理定时任务。
- 与效果图的有意调整：摘要采用两个还款方式并列的数字列表，最窄屏自动堆叠；解释入口紧接年限，保证矮桌面首屏可发现；完整版数据表放在原生展开区，防止 300–480 期数据撑满首屏。无装饰编号。

## 计算依据与示例约定

2026-09-05 核对 [工商银行个人借款合同第 6.1 节 A/B](https://media.icbc.com.cn/agreement/1085412055102394374.html)：按月等额本息及等额本金公式。页面“如何实现”亦链接其公开公式 PDF。[VuePress frontmatter](https://vuepress.vuejs.org/reference/frontmatter.html)、[client config](https://vuepress.vuejs.org/advanced/cookbook/usage-of-client-config)、[Vue async components](https://vuejs.org/guide/components/async) 用于独立布局集成；浏览器检查沿用仓库 CDP harness，并核对 [Emulation](https://chromedevtools.github.io/devtools-protocol/tot/Emulation/)、[Page](https://chromedevtools.github.io/devtools-protocol/tot/Page/) 与 [Network](https://chromedevtools.github.io/devtools-protocol/tot/Network/) 官方协议。

用 P 表示本金，r = 年利率百分数 / 1200，n = 年数 × 12：

- 等额本息 A = P × r / (1 − (1+r)^−n)；零利率 A = P/n。实现使用 log1p/expm1 避免很小利率下的相消。
- 等额本金：每期本金 P/n，当期利息为期初余额 × r；每期还款为本金加利息。
- 最后一期归还所有剩余本金，使余额精确为零。内部用双精度数值，不逐月舍入；UI 四舍五入显示两位小数。因此显示行相加可能与显示总值差几分，不模拟任何特定银行逐期舍入制度。
- USD 仅为清晰一致的示例单位，不代表美国或任何地区的具体贷款产品。初始本金 300,000、固定名义年利率 4%、25 年。金额范围 1,000–10,000,000，最多两位小数；利率 0–20%；整数年限 1–40。范围是原型交互约束，不是银行资格、报价或推荐。
- 固定月末还款；不含实际日数计息、税费、保险、浮动利率、提前还款或真实银行条件。不是金融建议。

默认结果（USD，展示精度）：

| 方式 | 首月 | 末月 | 总利息 |
| --- | ---: | ---: | ---: |
| 等额本息 | 1,583.51 | 1,583.51 | 175,053.16 |
| 等额本金 | 2,000.00 | 1,003.33 | 150,500.00 |

独立测试使用逐项现金流折现 + 二分求解月供作为 oracle，并用手工可算的 12,000 / 12% / 12 期验证等额本金首月 1,120、末月 1,010、总利息 780。覆盖零利率、极小利率、最高本金/利率/年限、末期清偿、本金守恒、小数本金、NaN/Infinity/字符串/越界/非法精度；没有把实现公式复制为唯一 expected。

## 验证结果

运行环境：macOS，Node 22.18.0，Chrome 152.0.7977.76。初次 `npm ci --offline` 使用本地缓存完成，package-lock 未变化。完整验证及证据如下：

- `npm run verify` 通过：52 页构建、2,864 个内部引用、15 项关键产物、原 50 路由加 2 个 noindex 预览、Phase 4 security fixture、7 路由 Chromium smoke。初轮在沙箱中因 localhost 监听 EPERM 中止，取得执行权限后完整通过。
- `node scripts/check-prototype-loan.mjs` 通过。
- `node scripts/check-homepage-prototype.mjs` 通过：双语 × 1440×900 / 1280×720 / 768×1024 / 390×844 / 320×844；展开菜单/参数/解释/数据表无整页横向溢出；最高本金、利率、年限也不溢出。
- 验证 range 方向键、菜单 Esc 返回、解释进入/关闭返回、数据引用焦点、无效字段关联提示、按钮/输入名称、aria-labelledby 引用、唯一 main/h1。AX 树包含具名 Term slider。原生表格滚动容器可聚焦，无焦点陷阱。
- 覆盖 mock 就绪/生成/完成/取消/范围外/旧参数/错误/超时/限流/重试。参数变化取消生成，旧引用禁用，不自动生成新解释。SPA 经文章页面离开再进入中文原型，示例恢复且 main 不重复。
- 关闭 JS 的生产页面保留身份、SVG、数字、表格、工具、工程、笔记、邮箱与说明；控件禁用。修复了初版 noscript 导致的 HTML 解析差异后，最终首次加载及 SPA 检查 warning/error 为零。
- reduced-motion 下无过渡或动画、定位使用 instant；深色偏好下原型仍使用独立 light 色板。200% 采用 1280 物理宽度对应 640 CSS px、2× raster 的重排等效检查；没有声称操作了浏览器原生缩放菜单。
- 对比度：正文 14.47:1、辅助字 5.30:1、朱红 5.34:1、第二曲线 5.24:1、控件边界 3.91:1（相对暖白）。主按钮白字约 5.9:1。图线另以实线/虚线、图例、数据表区分。主要按钮、输入、菜单、导航及语言切换按至少 44px 触控区域设置。
- `git diff --check` 通过。已知大 chunk warning 仍保留，不修改阈值掩盖问题。

[机器检查与几何记录](./prototype-evidence/checks.json)。1440 下解释按钮底部约 714px；1280 下约 691px；390 英文年限控件底部约 829px，中文约 754px。320 英文年限需小幅滚动，仍保持可读字号，不强塞首屏。

Firefox、Safari、真实触屏设备和 VoiceOver/NVDA 人工读屏未测；200% 是重排等效测试，仍建议用户在常用浏览器实际缩放试用。这些项目不标记为跨浏览器或完整无障碍认证。

## 截图

截图为真实生产页面，全页高度随内容变化；文件名为视口宽度（浏览器垂直滚动条可能占用 15px 内容宽度）。全部文件位于 [prototype-evidence](./prototype-evidence/)，没有复制到 docs/public 或网站产物。

| 语言 | 桌面 | 手机 | 展开状态 |
| --- | --- | --- | --- |
| English | [1440](./prototype-evidence/en-1440.png) / [1280](./prototype-evidence/en-1280.png) | [390](./prototype-evidence/en-390.png) / [320](./prototype-evidence/en-320.png) | [390 expanded](./prototype-evidence/en-390-expanded.png) |
| 中文 | [1440](./prototype-evidence/zh-1440.png) / [1280](./prototype-evidence/zh-1280.png) | [390](./prototype-evidence/zh-390.png) / [320](./prototype-evidence/zh-320.png) | [390 expanded](./prototype-evidence/zh-390-expanded.png) |

另外保留双语 768px、桌面展开、无 JS 与 200% 重排截图。

## 资源与时间性能

[资源清单](./prototype-evidence/assets.json) 使用 gzip level 9、本地文件字节，去重 script/modulepreload，异步布局另加一次；不是网络 observed transferred size。

- 英文初始公共/页面 JS 为 154,663 B gzip；异步原型布局约 10,309 B，总计约 **161.1 KiB**，略高于 160 KiB 候选目标。中文相差约几十字节。
- 公共 CSS 约 **37.6 KiB gzip**，高于 36 KiB 候选目标。当前 VuePress 产物仍将 scoped CSS 合并到公共 stylesheet；新样式虽仅作用于原型根元素，仍增加共享下载成本。没有为了原型改变全站 CSS 打包策略。
- 原审计既存产物公共 CSS 为 36,053 B gzip，本轮约 38,535 B，约增加 2.4 KiB；其构建时间与分块不同，只作透明成本参考，不把差值伪称同轮控制实验。
- 旧 Home/Modal、旧主页样式及全站组件仍存在，造成共享成本；原型 JS 独立 chunk，无新图表库、图标字体、大中文字体、背景图片或新依赖。设计 PNG 不进入站点产物。VuePress 的后台预取与初始必需代码分开，不将所有预取当首屏执行成本。

[独立时序采样](./prototype-evidence/timing.json)：同一 Chrome 152、生产静态服务、1440×900、CPU 4× slowdown、40ms latency、下载 1,250,000 B/s（10 Mbps）、上传 625,000 B/s，每次清浏览器 HTTP cache，三次运行，在加载与可交互就绪后追加 2.5 秒观察。系统文件缓存和连接不承诺彻底冷启动。

三次 LCP 1,552 / 1,128 / 1,236 ms，中位数 **1,236 ms**；DCL 中位数约 **1,119 ms**；load 中位数约 **1,168 ms**；CLS 三次约 **0.0161**。早期综合检查的 LCP 0 表示未收到有效 paint 样本，不采信；独立采样验证文档 visible、控件完成 hydration，并获得有效 paint 数据。只作为可重复本地实验，不能代替线上 p75 或真实用户性能结论。

## 审阅停止点

原型可以试用；当前授权未包含正式主页替换、全站主题协调或上线。本轮没有真实模型、股票/税务服务、旧资产删除、提交、推送、部署或 /goal。后续是否采用当前摘要布局、首屏按钮位置，以及处理共享 CSS/JS 预算，留待本轮体验后决定。
