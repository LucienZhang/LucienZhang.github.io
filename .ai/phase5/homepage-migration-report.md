# A v2 正式主页迁移

2026-09-05。用户最新授权：安排独立房贷工具 worktree，并在当前工作树完成正式主页迁移。本报告中的“正式”指 / 与 /zh/ 的代码和构建入口，不表示已经部署。当前分支 codex/phase-5a0，用户已授权保存本次迁移提交；未合并 main、推送或部署。

## 结果与范围

- docs/README.md、docs/zh/README.md 采用 Homepage 自定义布局，保留既有 URL，补双语标题/描述，不继承预览 noindex。
- docs/.vuepress/theme/components/Home.vue 替换为已审阅的 A v2 组件。client.ts 的 Homepage 与 HomepagePrototype 使用同一异步组件；版权年份由构建写入，两种布局 SSR/客户端一致。
- 移除旧 @theme/VPHome.vue override，正式首页由显式自定义布局完整渲染，避免默认主题导航和 main 嵌套。文章仍使用原默认布局。
- /preview/home.html、/zh/preview/home.html 保留 noindex 审阅入口；语言切换在各自的正式/预览路径内对应。正式页不显示错误/超时/限流审阅控制，运行时强制正常本地示例模式。AI 未连接标识和三个预设问题仍保留，不假称真实AI。
- 保留审阅过的 USD 示例和单张月供图；详细日元房贷工具的两方案三图逻辑由独立任务实现。稳定计算模块 docs/.vuepress/prototype/loan.mjs 路径与算法本轮不改，供独立工具参考复用。
- 筛股器仍规划中，没有将空壳提升为已可筛选，也未新增假工具入口。税务工具状态不在本次猜测或合并。

布局注册依据 [VuePress 官方 frontmatter/layout 文档](https://vuepress.vuejs.org/reference/frontmatter.html#layout)，同时核对当前已安装版本的既有 client 配置方式。未升级框架或引入 UI/图表库。

## 旧资源清理

通过 git grep 检查已跟踪源码引用后，删除旧主页专属 assets 目录中26个文件：home.css、Font Awesome CSS和15个字体文件、Source Sans Pro CSS、overlay、背景/头像/微信二维码/旧 Recent Work 图片。其唯一加载入口是被替换的旧 Home.vue。新布局不使用这些样式和图片；其他文章图片与独立组件资产未改。

移除 typed.js 与 breakpoints-js 两项依赖，npm同步移除38条已不可达锁条目；对比所有保留包版本，变化为零。Sacramento、Slidefu 公共品牌字体保留；Ant Design Vue 仍由其他组件使用，不顺带卸载。旧主页字体与Modal代码不再进入首页加载链。

## 验证与证据

环境：macOS，Node26.8.1；Chrome版本记录于 migration-evidence/checks.json。没有声称执行真实手机、Safari/Firefox或人工读屏。

- 离线干净安装 npm ci --offline --no-audit --no-fund 成功；依赖树 npm ls --depth=0 正常，保留包版本无变化。
- HOMEPAGE_CAPTURE=1 npm run verify：54页生产构建、内部链接、关键产物与精确路由、security、9路由smoke、独立贷款数值测试、正式主页双语浏览器矩阵通过。smoke包含两个筛股器页面；文章和BIM/MNIST等原回归保留。
- node scripts/check-homepage-prototype.mjs --ci：保留预览模式通过，包括错误、超时、限流等fixture。
- 干净安装后标准 npm run verify 全链再次退出0，确认默认CI模式可直接运行。
- 新 npm run check:home 纳入 verify：运行独立贷款oracle与正式首页浏览器断言。默认 --ci 不写截图、不做三次性能采样；需要证据时设置 HOMEPAGE_CAPTURE=1。复用同一测试器，不维护两份页面测试。
- 静态产物检查增加正式首页单main/单h1、SSR图表/Gmail、无noindex、语言链接正确、无旧Typed/旧壳/审阅控件断言。
- 浏览器覆盖中英1440/1280/768/390/320、展开状态、焦点/键盘、无JS、SPA切换、200%等效重排、输入/取消/过期快照；console warning/error为零。检查新生成英文桌面与中文移动截图，无阻塞性视觉问题。
- git diff --check 通过。正常的既存大chunk及部分侧栏配置构建提示没有被压制。

实际截图与日志在 [migration-evidence](./migration-evidence/)；正式路由截图为 en-1440.png、zh-1440.png、en-390.png、zh-390.png，展开与无JS等状态也保留。自动测试无法替代实际设备和人工读屏验收。

## 资源与性能

node scripts/measure-homepage-assets.mjs --production：按生产HTML中的script/modulepreload/stylesheet去重，加异步Home布局一次，gzip level9。本次首页 JS 英文99.63KiB、中文99.70KiB；公共CSS19.55KiB，低于160/36KiB候选上限。不是浏览器观察的全部预取或网络transferred字节。

node scripts/measure-homepage-prototype.mjs --production 的独立采样：1440×900，CPU4倍减速、40ms延迟、10Mbps下载，清HTTP缓存，三次有效visible页面 LCP=1196/944/920ms，中位944ms；CLS约0.0161。记录于timing.json，仅为本地受控实验，不是线上p75。

综合交互测试经过无JS/SPA后取得的performanceRuns visibility=hidden，LCP为null，不采信该时序数据；独立采样才用于上述性能结论。原型旧测量来自不同构建，不宣称严格同条件提升百分比。

## 房贷任务与后续

房贷文档/效果图已提交90dfd61；已请求创建“房贷工具页 — 固定利率双方案比较”独立worktree，以该共享基线实现。任务独占mortgage目录、双语工具页面和专属测试；不改主页、client/config、全局样式、其他工具、依赖或路由基线。共享计算核心如需泛化，先写最小集成补丁建议；不并行修改主页依赖。不接真实AI/变动利率，不自动提交或部署。

本轮迁移已获用户授权保存提交。后续根据授权整合main/部署；发布前决定保留noindex预览的范围、补目标浏览器/实际手机与人工读屏。完整工具与真实AI可独立继续，不阻塞当前主页迁移成果。
