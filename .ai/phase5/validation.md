# 验证摘要与复现

更新：2026-09-07。PR #14 已合并并部署；下方各历史轮次结果保留当时语境。本轮结论见末节，不代表真实设备验收完成。

## 可复现命令

Node >=22.18，按 package-lock 安装。完整链 `npm run verify` 包含生产构建、内部链接、精确路由/关键产物、安全、9 路由 browser smoke、正式主页浏览器检查、主页独立贷款 oracle 、房贷 120 组边界场景及税务回归。浏览器检查需要本地监听权限及 Chrome/Chromium，可用 CHROME_BIN 指定。

- `npm run check:home`：默认中英主页断言，不写截图；`HOMEPAGE_CAPTURE=1 npm run check:home` 输出截图及原始数据到 `.ai/artifacts/homepage/`。
- `npm run check:mortgage`：房贷数值、交点、日期验证。
- `node scripts/check-mortgage-browser.mjs`：已构建站点的双语工具交互、SSR、焦点/无障碍树、布局和截图，写入 `.ai/artifacts/mortgage/`。
- `node scripts/measure-homepage-assets.mjs`：构建产物的去重脚本/样式 gzip 体积，写入 `.ai/artifacts/homepage/assets.json`。
- `node scripts/measure-homepage.mjs`（无头页面为hidden时使用`HOMEPAGE_HEADED=1`）：独立可见页面性能采样，写入 `.ai/artifacts/homepage/timing.json`。综合交互测试经过无 JS 模拟后页面可能 hidden，不使用其中空 LCP 作为性能结论。
- `PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs PREVIEW_ORIGIN=http://127.0.0.1:4387 node scripts/check-stock-screener-browser.mjs`：可选的筛股器专项检查，需已有 Playwright 安装及自行启动的构建目录 HTTP 服务器；不会向仓库添加依赖。产物在 `.ai/artifacts/stock-screener/`。常规 verify 的 smoke 已包含两条筛股器路由。

## 上一轮主页清理验证

清理后 `npm run verify` 退出 0：54 页构建、3018 内部引用、15 项关键产物及精确路由、安全检查、9 路由 smoke、正式主页与两套数值测试通过。`node scripts/check-mortgage-browser.mjs` 退出 0，双语桌面/移动、视图配置、月份联动、焦点/无障碍树、SSR 及页面宽度隔离通过，产物写入忽略目录。

脚本语法、文档内部链接、资源报告生成和 `git diff --check` 通过。首次构建暴露清理时误移除版权年份所需的 page 数据，恢复该依赖后重新执行完整链通过；最终构建无该 SSR 错误。

本轮最终差异包含 9 个新增或修改的 .ai 文件（约 50 KiB，含既有项目计划），没有 PNG；74 张原截图及原报告已完整保存在本地忽略备份。主页两条旧 preview URL 不再生成。

## 已有验证及限制

cc817a8 集成时：56 页构建、3068 内部引用、9 路由 smoke、正式双语主页检查、房贷 120 组数值与双语 1440/390/320px 工具浏览器检查全部通过。当前清理删除两条重复主页路由，预期构建为 54 页；两条房贷工具仍显式要求 noindex，筛股器保留既有严格基线。

数值验证包含独立 PV oracle、闭式公式、零/微小/高利率、金额守恒、结清、1–600 月边界、167/168 期交点、相等与反转、不同期限补零及无效输入。UI 验证包含双语宽度、数据表、参数/解释快照联动、取消/过期、菜单键盘、焦点、SSR/无 JS、SPA 及 reduced-motion。工具图表的按钮在无障碍树中可访问。

4d57c1d 迁移时的历史资源测量：首页 JS gzip 英/中约 99.63/99.70 KiB，公共 CSS 19.55 KiB；候选预算为 160/36 KiB。当时独立可见页面受控 LCP 为 1196/944/920ms，中位 944ms，CLS 约 0.0161（1440×900、CPU 4×、40ms、10Mbps）。这些是旧构建本地测量，不是当前线上用户 p75，也不作为清理后的性能数字。

Chrome 自动化不能替代 Safari、实际触屏和人工 VoiceOver/NVDA。200% 项为 640 CSS px / 2× raster 重排等效检查。既有大型 chunk 和中文项目 sidebar 配置提示没有通过调高阈值或删检查掩盖。真实 AI、变动利率、税务和后台不在当前验收范围。

截图是人工审阅证据，不是自动图片对比测试基准；原始产物不进入源码 PR。早期报告/效果图可查 cc817a8 历史，旧结果不能当作最新构建结果。

## 日本税务工具集成（2026-09-06）

来源70a9aa1；适用2025工资收入/2026住民税的限定场景。集成审查重新查阅NTA2025工资精确表、所得金額調整控除及西东京/京都抵扣说明，与当前实现核对；并非完整税务认证。保留手填扣除和故乡税边际税率代用的概算边界，没有扩展为2026收入算法。

`npm run verify` 退出0：56页、3246内部引用、15关键产物、严格基线及新增税务路由、安全、9路由smoke、主页浏览器、房贷和税务断言通过。税务包含283项数值、19项金额格式、104项鼠标走廊断言。Node对既有amount-format.js的ES模块自动识别给出非失败提示，未为此修改全仓模块模式。

复现：`npm run check:tax`；先构建，再分别运行 `TAX_FULL_AUDIT=1 TAX_LOCALE=en node scripts/check-japan-tax-browser.mjs` 和 zh 版本。输出分别在 .ai/artifacts/japan-tax/en/、zh/，推荐顺序执行，避免多个浏览器争用前台鼠标焦点。中英文各1440/390/320px最终退出0，包含填值/清空、所得和结算、扣除开关、帮助鼠标与键盘、来源、SSR/语言及无溢出。英文首次通过；中文并行首轮悬停等待超时，未修改页面，独立重跑全部通过，尚不能确定首次超时原因。无页面异常和外部请求。人工查看英文结算桌面、中文手机截图。

原测试移至 scripts/japan-tax/，有效公式和来源保留于 .ai/tools/japan-tax/；历史交接、重复审查及source-link-audit.json转本地忽略备份，不提交截图。主页demo未修改，更新提案记录于remaining-work.md，待用户批准。

## 主页单图 demo 与完整工具对齐（2026-09-06—07）

用户批准并实施：JPY50,000,000 / 1.5% / 35年，金额整数日元、期限1–50年；共享 MortgageChart compact 模式与计算核心。保留单月供图、首月/总利息摘要和次级示例解释，删除主页全期表格。主入口与贷款卡片携带共同参数进入对应语言工具。

最终 `HOMEPAGE_CAPTURE=1 npm run verify` 退出0：56页、3250内部引用、产物/精确路由、安全、9路由smoke、双语主页、独立贷款oracle、房贷120场景与税务7组测试全部通过。新增 handoff 测试覆盖语言路由、完整有效参数、零/微小利率、重复数组/缺失/越界/非法值回退；真实浏览器核对进入工具页后两方案金额、利率、期限一致。

主页覆盖1440/1280/768/390/320、首屏控件、窄屏/重排、键盘逐期查看、零利率无伪交点、100亿/50年上界、解释快照、SSR和SPA默认35年。手机图表去除多行常驻读数，改为单行简写读数并调整留白；完整工具使用原图表模式。挂载时立即测量宽度，随后由 ResizeObserver 更新；测试等待图表达到实际容器宽度后检查首屏，不放宽尺寸断言。

截图仅在 .ai/artifacts/homepage/，已人工查看英文桌面及中文手机。完整房贷专项浏览器退出0，中英文桌面/移动、多视图、日期、焦点及SSR均通过；资源报告脚本和 git diff --check 通过。已有跨浏览器/真机/人工读屏限制不变；本轮不声称最新线上性能，也不开放工具搜索索引。

## 上线收尾（2026-09-07，c4184ee 后独立 worktree）

### 基线与本轮范围

HEAD、本地 main、origin/main 与 `git ls-remote origin refs/heads/main` 均为 c4184eed10b1cd879cd921fcb2c94ba5dbae4e76。GitHub Pages [run 34072025368](https://github.com/LucienZhang/LucienZhang.github.io/actions/runs/34072025368) 成功；GitHub 域名跳转到 https://ziliang.red/。这确认 PR #14 已合并发布，本轮入口文案及筛股器键盘修复尚未发布。分支 codex/homepage-launch-closeout，仅本地提交，不 push/PR/合并/部署。

房贷卡标可使用并注明固定利率；税务卡标可试用、限定年度与扣除输入范围并加入对应语言入口；筛股器仍规划中、明确无筛选/AI且无入口。没有修改计算逻辑、共享图表、默认参数、路由或robots。线上窄屏键盘检查发现筛股器隐藏的默认主题侧栏仍可聚焦；本轮只在该工具pageClass下隐藏侧栏与遮罩，并补各宽度焦点顺序断言。首版局部样式被默认主题更高优先级规则覆盖，新增回归确实失败；修正选择器后通过，没有放宽断言。

### 本地最终构建验证

- `npm ci`、`npm ls --depth=0`、最终 `HOMEPAGE_CAPTURE=1 npm run verify` 退出0：56页、3252内部引用、15关键产物、严格路由/安全、9路由smoke、双语主页、独立贷款oracle、参数handoff、120房贷场景和税务7组测试。依旧有大chunk及中文项目sidebar配置提示，未调高阈值。税务数值合计283项、金额格式19项、鼠标走廊104项断言通过。
- `node scripts/check-mortgage-browser.mjs`；`TAX_FULL_AUDIT=1 TAX_LOCALE=en node scripts/check-japan-tax-browser.mjs` 与zh版本均退出0。房贷、税务专项在本轮首个构建执行；其后仅修复筛股器局部CSS，最终构建重新执行完整verify。
- 启动 `python3 -m http.server 4387 --bind 127.0.0.1 --directory docs/.vuepress/dist`，再执行 `PLAYWRIGHT_MODULE=/Users/lucien/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs PREVIEW_ORIGIN=http://127.0.0.1:4387 node scripts/check-stock-screener-browser.mjs` 退出0。双语1440/1280/768/390/320px全部覆盖焦点顺序、无溢出；输入不请求、语言切换清空、skip link、深色偏好、字号重排与SSR通过。Playwright路径因机器而异，不新增仓库依赖。
- 新税务链接补充键盘Enter跳转验证：中英入口各到对应工具，robots仍noindex/nofollow。已查看英文桌面、中文手机首页截图；截图与日志均在忽略目录 `.ai/artifacts/`，不是自动图片差异基准。
- `node --check scripts/measure-homepage.mjs`、`node --check scripts/check-stock-screener-browser.mjs`、修改文档相对链接检查与 `git diff --check` 通过。

### 线上检查与限制

- 八条路径：`/`、`/zh/`，以及两语言的`/tools/mortgage.html`、`/tools/japan-tax.html`、`/tools/stock-screener.html`，全部HTTP200；HTML引用的28个去重初始assets返回200，六个工具页robots均为`noindex, nofollow`。初始资源检查不等于全站所有动态资源审计。
- 对公开站点运行现有首页/房贷/税务浏览器脚本的临时副本，仅将origin替换为`https://ziliang.red`、root固定为当前checkout、输出移至`.ai/artifacts/launch/online-*`。首页、房贷、中英税务均退出0，覆盖两语言参数跳转、布局/键盘/SSR；税务报告无页面异常和外部请求。可复现方式：从对应`scripts/check-*.mjs`生成上述替换的临时副本，按本地命令顺序运行，避免税务测试争用鼠标焦点。
- In-app Browser实查线上首页中英切换、筛股器中英切换与320px布局。线上筛股器隐藏导航焦点缺陷已在本地修复，须在后续合并部署后复核；新税务首页入口同样尚待发布后检查。
- Safari虽然本机安装，但当前浏览器工具未提供Safari控制；未完成Safari、实际手机触控、人工VoiceOver/NVDA或真实浏览器200%缩放。自动无障碍树与CSS重排检查不能代替这些人工项目。未取得CrUX/RUM用户p75，不声称线上用户性能达标。

### 最终资源与性能

复现：`node scripts/measure-homepage-assets.mjs` 和独立运行 `node scripts/measure-homepage.mjs`。后者现分别对中英首页采样3次，导航后bringToFront，并强制要求visible且LCP为正有限数。无头Chrome两次遇到hidden而被断言拒绝，没有将空值当成绩；最终使用`HOMEPAGE_HEADED=1 node scripts/measure-homepage.mjs`打开独立可见窗口完成采样。原始数据保存在`.ai/artifacts/homepage/assets.json`和`timing.json`。

最终构建初始script/modulepreload去重gzip（level 9）英文90.17 KiB、中文90.24 KiB；公共CSS23.22 KiB，另列异步Home模块8.93 KiB。该口径不是整个运行期依赖图或真实网络传输量；初始JS/CSS低于既有160/36 KiB候选预算，不改变预算。

本地受控条件：Chrome152.0.7977.76，1440×900，CPU4×、网络40ms/10Mbps、每次清浏览器缓存，每语言3次。英文LCP1440/952/980ms，中位980ms；中文1136/848/876ms，中位876ms；六次CLS均约0.0160842，全部visible且LCP非空。未采集线上用户性能数据；不将线上功能回归中的hidden/lcp:null记录用于性能结论。

## 后续首页品牌微调（用户追加要求）

移除中英主标题上方姓名，在导航品牌字样左侧加入原有`/logo.png`，固定2:1比例及移动尺寸；保留文字作为链接可访问名称，图像使用空alt避免重复朗读。原图不替换，三种logo优化图仅为待选概念，不是生产矢量稿。

初版`HOMEPAGE_CAPTURE=1 npm run verify`通过；修正320px导航换行后重新`npm run build`及`HOMEPAGE_CAPTURE=1 npm run check:home`通过。额外检查中英1440/390/320px：图像实际加载、无主标题姓名、无横向溢出，手机品牌/语言/菜单同排；查看320px中文导航截图。`git diff --check`通过。此前资源与LCP数值属于加入logo前的收尾构建，不是本次微调后的性能成绩。生成的logo对比图与截图不纳入生产源码。

用户随后选择 C 方案放入首页预览：新增朱红纯色`logo-infinity-c.svg`，仅首页导航引用，原PNG保留。重新构建56页通过；双语1440/390/320px实际浏览器检查图像加载、无横向溢出及手机导航同排均通过。桌面和手机截图见忽略目录`.ai/artifacts/homepage/logo-c-zh-*.png`；本轮未发布。

用户追加比较A形状＋C朱红色：新增`logo-infinity-a-vermilion.svg`并切换首页引用，保留上一版C及原PNG。构建56页通过，双语1440/390/320px图像加载、无横向溢出和手机导航同排检查通过。实际截图保存于`.ai/artifacts/homepage/logo-a-red-zh-*.png`；仍为未发布预览。

## 确认图的 SVG 定稿与尺寸适配

用户确认`exec-6041eabf-2c13-49b0-a570-c11ef504a74f.png`的轮廓，并允许轻微几何规整。沿图形分色边界描摹，优化三次贝塞尔曲线，保留粗细变化、内外弧度和斜切口；不再使用此前手画的等宽曲线路径。路径优化容差从0.15调整为0.6，以消除微小栅格起伏并精简节点。原图二值轮廓与矢量回栅格的面积交并比约99.82%，仅用于证明未显著改变形状，不是严格数学对称认证。

`logo-infinity-a-vermilion.svg`为单一复合path、朱红#B63824、透明背景，2968字节，无位图内嵌、脚本、外部依赖或遮罩。viewBox保留约1.825:1比例，桌面48px、手机40px、低于390px时32px宽，高度自动计算。原PNG保留，未采用的C版SVG移到忽略产物目录。最终构建56页、3254内部引用、严格路由/产物检查通过；中英1440/390/320px加载及同排布局检查通过，已查看手机截图。原始描摹脚本/对比结果及截图仅在`.ai/artifacts/`。本次未提交或发布。

最终`HOMEPAGE_CAPTURE=1 npm run check:home`退出0，包含贷款oracle、参数handoff及双语主页浏览器回归；`git diff --check`通过。

## 严格对称几何候选

按用户最新约束新增独立`logo-infinity-symmetric.svg`；保持首页引用的描摹版，未发布候选。通过`node scripts/check-logo-geometry.mjs`：8段三次贝塞尔曲线的左右/上下/中心变换严格匹配；每个中心线接点切线和曲率连续；每段1001点采样最小曲率半径39.70，大于笔画半宽14。采样用于偏移弧余量检查，不替代解析证明；精确对称及端点连续性直接检查控制点。中央交叉轮廓有刻意保留的对称角点，与两侧环弧平滑性区分。已查看独立SVG渲染，临时截图留在忽略目录。

候选加入后生产构建56页通过，既有大chunk及中文sidebar提示不变；已检查48/40/32px独立尺寸样张。首页未替换，因此未重复执行未改动的交互回归。`git diff --check`通过。

## 保留切口的局部几何修正

用户澄清对称仅约束弧度，原交叠切口必须保留，并否定前轮无切口版本。本轮从已确认描摹版的尺寸与轮廓出发新增独立候选`logo-infinity-refined.svg`，首页引用未改变。八段内外椭圆近似半环按镜像配对，过渡贝塞尔段按切线及端点曲率约束构造，沿原切口附近的对称直线交点截取。整体中心对称，半环弧线左右/上下镜像，切口参与中心对称，不强求完整图形的左右/上下镜像。

`node scripts/check-logo-geometry.mjs`通过：16段曲线、2条切口直线，14处平滑接点最大切线方向误差约4.42e-9弧度、最大曲率跳差约3.20e-10，均来自SVG坐标小数序列化。二值轮廓与上一版居中对齐交并比97.47%，仅作变化尺度记录。已查看独立SVG及前后等比例对比图；XML解析和`git diff --check`通过。文件852字节，无嵌入图片/遮罩/脚本/外部依赖。无切口候选和旧检查脚本移入忽略目录；本轮未改首页交互，未重复完整站点回归，未提交/发布。

## Logo最终版确认

用户确认保留切口的精修版为最终版，统一文件名`docs/.vuepress/public/logo.svg`，首页改为引用`/logo.svg`，宽高属性同步1366×748；沿用48/40/32px响应式宽度。未采用SVG移出public至忽略产物目录，其他页面使用的既有logo.png保留。几何检查已接入`check:home`。

最终`HOMEPAGE_CAPTURE=1 npm run verify`退出0，覆盖56页构建、3254内部引用、严格路由/产物/安全、9路由smoke、Logo几何约束、双语主页及贷款/房贷/税务回归。补充中英1440/390/320px检查确认实际加载`/logo.svg`，窄屏导航同排、无横向溢出；截图在`.ai/artifacts/homepage/logo-final-zh-*.png`。文档相对链接及`git diff --check`通过。本轮仅本地提交，未push/PR/部署。

### 最终品牌资产清理与 favicon 同步（2026-09-07）

- 全站默认导航统一引用 `/logo.svg`，删除已无运行时引用的旧 `logo.png`。
- 启用全站 favicon head 配置；`favicon.svg`复用最终 logo 的完整路径，仅改为正方形画布；`favicon.ico`包含16/32/48px透明图标。
- 本地构建通过；56页3366处内部引用、关键产物与路由基线、logo几何检查通过。逐页确认 SVG/ICO 图标链接存在且无旧 PNG 引用，favicon 与 logo 路径完全相同。9条路由浏览器冒烟通过。
- 尚未推送或发布。
