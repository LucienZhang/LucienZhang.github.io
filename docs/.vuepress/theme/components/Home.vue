<script setup>
import { computed } from 'vue';
import { usePageData, useRouteLocale } from 'vuepress/client';
import SiteLayout from './SiteLayout.vue';
import LinkArrow from './LinkArrow.vue';
import HeroLoop from './home/HeroLoop.vue';
import DigitDemo from './home/DigitDemo.vue';
import LoanDemo from './home/LoanDemo.vue';
import RequestJourney from './home/RequestJourney.vue';
import LogoBlueprint from './home/LogoBlueprint.vue';
import digitMeta from '../../lib/digits/meta.json';
const page = usePageData();
const locale = useRouteLocale();
const zh = computed(() => locale.value === '/zh/');
const t = (en, cn) => zh.value ? cn : en;
const other = computed(() => zh.value ? '/' : '/zh/');
const stats = computed(() => page.value.frontmatter.buildStats ?? { specDocs: 0, checks: 0 });
const accuracy = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 }).format(digitMeta.testAccuracy);
const steps = computed(() => [
  { n: '01', title: t('Write the spec', '先写规格'), body: t(`${stats.value.specDocs} spec and decision records: formulas, tax rules, sources, edge cases and what is out of scope — before any code.`, `${stats.value.specDocs} 份规格与决策记录：公式、税务规则、来源、边界情况和“不做什么”，都先于代码写下来。`) },
  { n: '02', title: t('Agents build', 'Agent 实现'), body: t('Coding agents implement one reviewable branch at a time. I steer scope and design; they write most of the code.', '编码 agent 一次实现一个可审阅的分支。我把控范围和设计，大部分代码由它们来写。') },
  { n: '03', title: t('Machines verify', '机器校验'), body: t(`${stats.value.checks} automated checks: browser smoke tests, 120 loan scenarios, tax rules, the AI client contract, even the logo’s curvature.`, `${stats.value.checks} 个自动校验：浏览器冒烟测试、120 个贷款场景、税务规则、AI 客户端协议，连 logo 的曲率都要校验。`) },
  { n: '04', title: t('Review & ship', '审阅上线'), body: t('Every deploy reruns the verification suite in GitHub Actions. Nothing merges on vibes.', '每次部署都在 GitHub Actions 里重跑校验套件。没有“感觉没问题”就合并这回事。') },
]);
</script>

<template>
  <SiteLayout><template #page>
  <div id="homepage-top" class="homepage" :class="{ chinese: zh }" data-homepage="production">
    <a class="skip" href="#lab">{{ t('Skip to live demos', '跳到现场演示') }}</a>
    <main aria-labelledby="homepage-title">
      <section class="hero ink">
        <div class="wrap hero-grid">
          <div class="hero-copy">
            <p class="kicker"><span class="kicker-dot" aria-hidden="true"></span>{{ t('Ziliang Zhang · AI applications · Data · Backend', '张子良 · AI 应用 · 数据 · 后端工程') }}</p>
            <h1 id="homepage-title"><span>{{ t('One human.', '一个人，') }}</span><span class="glow-text">{{ t('Infinite agents.', '无限 Agent。') }}</span></h1>
            <p class="lede">{{ t('AI coding agents write the code; I write the specs, tests and guardrails that keep it honest. The results: a digit recognizer that runs in your browser, an LLM explainer backend with sign-in and quotas, and this site itself — merged only after automated checks.', 'AI 编码 agent 写代码，我写规格、测试和护栏。做出来的东西：在你浏览器里实时运行的手写识别、带登录与额度控制的大模型解释后端，还有这个网站本身——自动校验通过才合并。') }}</p>
            <div class="hero-actions">
              <a class="button solid" href="#lab">{{ t('Try the live demos', '试试现场演示') }} <LinkArrow /></a>
              <a class="button ghost" href="#engineering">{{ t('How this site is built', '看这个网站怎么造出来') }}</a>
            </div>
            <dl class="stats">
              <div><dt>{{ t('spec & decision records', '份规格与决策记录') }}</dt><dd>{{ stats.specDocs }}</dd></div>
              <div><dt>{{ t('automated check scripts', '个自动校验脚本') }}</dt><dd>{{ stats.checks }}</dd></div>
              <div><dt>{{ t('test accuracy, in-browser model', '浏览器内模型测试准确率') }}</dt><dd>{{ accuracy }}</dd></div>
            </dl>
          </div>
          <HeroLoop :zh="zh" />
        </div>
      </section>

      <section id="lab" class="band paper" aria-labelledby="lab-title">
        <div class="wrap">
          <header class="band-head">
            <p class="eyebrow">{{ t('01 · Live demos', '01 · 现场演示') }}</p>
            <h2 id="lab-title">{{ t('Real models, real numbers. Running now.', '真实的模型，真实的计算，此刻就在运行。') }}</h2>
            <p>{{ t('No sign-in, no screenshots. Draw, drag and break things.', '不用登录，也不是截图。随便写、随便拖、随便试。') }}</p>
          </header>
          <div class="lab-grid">
            <DigitDemo class="cell-digit" :zh="zh" />
            <LoanDemo class="cell-loan" :zh="zh" />
            <article class="cell-tool tax-card" aria-labelledby="tax-title">
              <p class="card-kicker">{{ t('Tool · Japan', '工具 · 日本') }}</p>
              <h3 id="tax-title">{{ t('Japan tax calculator', '日本税务计算器') }}</h3>
              <p>{{ t('From the withholding slip to income tax, refund and next year’s monthly resident tax. 2025 salary income / 2026 resident tax.', '从源泉徴収票出发，算清所得税、退税和来年每月住民税。适用 2025 工资收入／2026 住民税。') }}</p>
              <div class="receipt" aria-hidden="true">
                <span lang="ja">給与等の収入金額</span><span>→</span><span lang="ja">課税所得</span><span>→</span><span lang="ja">還付</span><span>+</span><span lang="ja">住民税 / 月</span>
              </div>
              <a class="text-link" :href="zh ? '/zh/tools/japan-tax.html' : '/tools/japan-tax.html'">{{ t('Open the tax calculator', '打开税务计算器') }} <LinkArrow /></a>
            </article>
            <article class="cell-tool screener-card" aria-labelledby="screener-title">
              <p class="card-kicker">{{ t('In design · not built yet', '设计中 · 尚未实现') }}</p>
              <h3 id="screener-title">{{ t('AI stock screener', 'AI 筛股器') }}</h3>
              <p>{{ t('Natural language in, explicit filters out — the model proposes, a schema validates, you confirm. Target behaviour:', '输入自然语言，输出明确的筛选条件：模型提议、schema 校验、由你确认。目标效果：') }}</p>
              <div class="nl-to-filter">
                <p class="prompt">“{{ t('Large Japanese companies with steady dividends for 5 years', '日本大盘股，近 5 年分红稳定') }}”</p>
                <pre aria-label="Example filter"><code>{ "market": "JP",
  "marketCap": { "gte": "1T JPY" },
  "dividend": { "years": 5, "cut": false } }</code></pre>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="ai-service" class="band ink" aria-labelledby="journey-title">
        <div class="wrap">
          <header class="band-head">
            <p class="eyebrow">{{ t('02 · AI service design', '02 · AI 服务架构') }}</p>
            <h2 id="journey-title">{{ t('Anatomy of one AI request.', '一次 AI 请求的旅程。') }}</h2>
            <p>{{ t('The loan explainer’s backend on AWS. Calling a model is one line; the other five stops are what make it safe to put in front of strangers.', '贷款 AI 解释的 AWS 后端。调用模型只是一行代码，另外五站才决定它能不能放心交给陌生人用。') }}</p>
          </header>
          <RequestJourney :zh="zh" />
        </div>
      </section>

      <section id="engineering" class="band paper" aria-labelledby="engineering-title">
        <div class="wrap">
          <header class="band-head">
            <p class="eyebrow">{{ t('03 · How it’s built', '03 · 怎么造出来的') }}</p>
            <h2 id="engineering-title">{{ t('This site is the demo.', '这个网站本身就是作品。') }}</h2>
            <p>{{ t('An AI-native workflow with a human holding the pen on intent and the machines holding the line on correctness.', 'AI 原生的工作流：意图由人来定，正确性由机器把关。') }}</p>
          </header>
          <div class="workflow">
            <ol class="steps">
              <li v-for="step in steps" :key="step.n"><span class="step-n">{{ step.n }}</span><div><h3>{{ step.title }}</h3><p>{{ step.body }}</p></div></li>
            </ol>
            <div class="blueprint-cell">
              <LogoBlueprint :zh="zh" />
              <p class="blueprint-note">{{ t('Even the logo went through the loop: written as geometric constraints, generated by symmetry, and verified for tangent and curvature continuity before it shipped.', '连 logo 也走了一遍这个循环：先写成几何约束，再按对称生成，上线前用脚本校验切线和曲率连续。') }}</p>
            </div>
          </div>
          <div class="background">
            <div class="experience">
              <h3 class="minor-title">{{ t('Before agents', '在 agent 之前') }}</h3>
              <article><h4>{{ t('Data for machine learning', '机器学习数据平台') }}</h4><p>{{ t('Profile data pipelines and data integration supporting recommendation systems.', '支持推荐系统的个人资料数据管道与数据整合。') }}</p></article>
              <article><h4>{{ t('Configuration-driven platforms', '配置驱动的工程') }}</h4><p>{{ t('Data lake pipelines and reusable workflows driven by SQL and YAML.', '数据湖管道，以及由 SQL、YAML 配置驱动的可复用数据流程。') }}</p></article>
              <div class="links"><a href="https://github.com/LucienZhang/goto">Goto · Go CLI <LinkArrow external /></a><a href="https://github.com/vuepress/vuepress-next/pull/460">{{ t('VuePress · contribution', 'VuePress · 开源贡献') }} <LinkArrow external /></a></div>
            </div>
            <div id="notes" class="notes">
              <h3 class="minor-title">{{ t('Notes', '笔记') }}</h3>
              <a class="note-row" href="/programming/algorithms/overview.html"><span>{{ t('Algorithms', '算法笔记') }}</span><small v-if="zh" class="badge">英文内容</small><LinkArrow /></a>
              <a class="note-row" href="/misc/apis.html"><span>{{ t('Web API Design', 'Web API 设计') }}</span><small v-if="zh" class="badge">英文内容</small><LinkArrow /></a>
              <a class="note-row" :href="zh ? '/zh/ml/mnist.html' : '/ml/mnist.html'"><span>{{ t('Handwritten Digit Recognition', '手写数字识别') }}</span><LinkArrow /></a>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" class="band ink contact" aria-labelledby="contact-title">
        <div class="wrap">
          <p class="eyebrow">{{ t('04 · Contact', '04 · 联系') }}</p>
          <h2 id="contact-title" class="contact-title">{{ t('Let’s build something useful.', '一起做些有用的东西。') }}</h2>
          <a class="email" href="mailto:lucienzhangzl@gmail.com">lucienzhangzl@gmail.com <LinkArrow external /></a>
          <div class="links"><a href="https://github.com/LucienZhang">GitHub <LinkArrow external /></a><a href="https://www.linkedin.com/in/zhang-ziliang/">LinkedIn <LinkArrow external /></a></div>
        </div>
      </section>
    </main>
    <footer class="ink">
      <div class="wrap footer-row"><span>© {{ page.frontmatter.copyrightYear }} Ziliang Zhang</span><a :href="other">{{ t('中文', 'EN') }}</a></div>
    </footer>
  </div>
  </template></SiteLayout>
</template>

<style scoped>
.homepage {
  --ink: #12110f; --ink-2: #1a1916; --on-ink: #efeae0; --on-ink-muted: #a8a397; --ink-line: rgb(239 234 224 / 12%);
  --paper: #f7f4ed; --text: #20231f; --muted: #64665f; --line: #cbc7bd;
  --accent: #b63824; --accent-bright: #e8553a; --accent-soft: #f08d77;
  --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace;
  background: var(--paper);
  color: var(--text);
  color-scheme: light;
  min-height: 100vh;
  font: 16px/1.55 system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.homepage :deep(*), .homepage :deep(*::before), .homepage :deep(*::after) { box-sizing: border-box; }
.homepage :deep(:is(h1, h2, h3, h4)) { border: 0; padding: 0; margin: 0; font-weight: 650; letter-spacing: -.01em; text-wrap: balance; color: inherit; }
.homepage :deep(p) { margin: 0; text-wrap: pretty; }
.homepage :deep(a) { color: var(--accent); text-decoration: none; font-weight: 500; }
.homepage :deep(a:hover) { text-decoration: underline; }
.homepage :deep(:is(button, input, select)) { font: inherit; color: var(--text); background: transparent; border: 1px solid #797b72; border-radius: 6px; min-height: 44px; }
.homepage :deep(button) { padding: 8px 12px; cursor: pointer; }
.homepage :deep(button:hover:not(:disabled)) { background: #eee7db; }
.homepage :deep(:is(button:disabled, fieldset:disabled)) { opacity: .55; cursor: default; }
.homepage :deep(:is(input, select)) { padding: 8px; max-width: 100%; width: 100%; }
.homepage :deep(:focus-visible) { outline: 2px solid var(--accent-bright); outline-offset: 4px; }
.homepage :deep([tabindex='-1']:focus) { outline: 2px solid var(--accent); outline-offset: 4px; }
.homepage :deep(summary) { min-height: 44px; padding: 12px 0; cursor: pointer; font-size: 14px; line-height: 20px; }
.homepage :deep(small) { font-size: 13px; line-height: 20px; color: var(--muted); }
.homepage :deep(.sr-only) { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.skip { position: absolute; top: -100px; left: 16px; padding: 12px; background: var(--paper); z-index: 40; }
.skip:focus { top: calc(var(--navbar-height) + 8px); }

.wrap { max-width: 1360px; margin: 0 auto; padding: 0 40px; }
.ink { background: var(--ink); color: var(--on-ink); }
.ink :deep(a) { color: var(--accent-soft); }
.band { padding: 96px 0; scroll-margin-top: var(--navbar-height); }
.band-head { max-width: 760px; margin-bottom: 48px; }
.eyebrow, .kicker, .card-kicker { font: 600 12px/16px var(--mono); letter-spacing: .1em; text-transform: uppercase; }
.eyebrow { color: var(--accent); margin-bottom: 14px !important; }
.ink .eyebrow { color: var(--accent-soft); }
.band-head h2 { font-size: clamp(30px, 3.6vw, 48px); line-height: 1.1; letter-spacing: -.025em; }
.band-head p:last-child { margin-top: 16px; font-size: 18px; line-height: 28px; color: var(--muted); }
.ink .band-head p:last-child { color: #b9b4a8; }

/* Hero */
.hero { position: relative; overflow: hidden; padding: 72px 0 88px; background: radial-gradient(60% 70% at 75% 45%, rgb(182 56 36 / 22%), transparent 70%), radial-gradient(rgb(239 234 224 / 7%) 1px, transparent 1px) 0 0 / 24px 24px, var(--ink); }
.hero-grid { display: grid; grid-template-columns: minmax(0, 8fr) minmax(0, 5fr); gap: 40px; align-items: center; }
.hero-copy { min-width: 0; }
.kicker { display: flex; align-items: center; gap: 10px; color: var(--on-ink-muted); margin-bottom: 28px !important; }
.kicker-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent-bright); box-shadow: 0 0 12px 2px rgb(232 85 58 / 70%); }
.hero h1 { font-size: clamp(44px, 5.6vw, 84px); line-height: 1.02; letter-spacing: -.04em; font-weight: 700; color: var(--on-ink); }
.hero h1 span { display: block; }
.glow-text { background: linear-gradient(100deg, #ffb39c 0%, #ff6a4d 45%, #c93f27 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
.chinese .hero h1 { font-size: clamp(44px, 5.6vw, 84px); line-height: 1.12; letter-spacing: -.01em; }
.lede { max-width: 60ch; margin-top: 28px !important; font-size: 18px; line-height: 30px; color: #c9c4b8; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 36px; }
.button { display: inline-flex; align-items: center; gap: 10px; min-height: 48px; padding: 12px 22px; border-radius: 999px; font-weight: 600; transition: transform .15s ease, box-shadow .15s ease, background .15s ease; }
.button:hover { text-decoration: none !important; transform: translateY(-1px); }
.ink .button.solid { background: linear-gradient(120deg, #e8553a, #b63824); color: #fff; box-shadow: 0 10px 30px -10px rgb(232 85 58 / 80%); }
.ink .button.ghost { color: var(--on-ink); border: 1px solid rgb(239 234 224 / 28%); }
.ink .button.ghost:hover { background: rgb(239 234 224 / 8%); }
.stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; margin: 56px 0 0; padding-top: 28px; border-top: 1px solid var(--ink-line); }
.stats div { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.stats dd { order: -1; margin: 0; font-size: clamp(28px, 3vw, 40px); line-height: 1; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--on-ink); letter-spacing: -.02em; }
.stats dt { font-size: 13px; line-height: 18px; color: var(--on-ink-muted); }

/* Lab */
.lab-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 24px; }
.cell-digit { grid-column: span 7; }
.cell-loan { grid-column: span 5; }
.cell-tool { grid-column: span 6; display: flex; flex-direction: column; gap: 12px; padding: 28px; border-radius: 16px; background: #fffdf8; border: 1px solid #ddd7cc; min-width: 0; }
.card-kicker { color: var(--accent); }
.cell-tool h3 { font-size: 22px; line-height: 30px; }
.cell-tool > p:not(.card-kicker) { color: var(--muted); }
.receipt { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 4px; padding: 14px 16px; border-radius: 10px; border: 1px dashed #c9bfae; background: repeating-linear-gradient(0deg, transparent 0 23px, rgb(32 35 31 / 4%) 23px 24px), #fbf7ef; font-size: 13px; line-height: 20px; }
.receipt span:nth-child(even) { color: var(--accent); font-family: var(--mono); }
.text-link { display: inline-flex; align-items: center; gap: 8px; margin-top: auto; padding: 10px 0; }
.screener-card .card-kicker { color: #8a6d1c; }
.nl-to-filter { display: grid; gap: 8px; margin-top: 4px; }
.prompt { padding: 10px 14px; border-radius: 14px 14px 14px 4px; background: #efe7d8; font-size: 14px; line-height: 20px; justify-self: start; }
.nl-to-filter pre { margin: 0; padding: 12px 14px; border-radius: 10px; background: var(--ink); color: #e6e1d6; font: 12.5px/1.6 var(--mono); overflow-x: auto; white-space: pre; }
.nl-to-filter code { font: inherit; color: inherit; background: none; padding: 0; }

/* Engineering */
.workflow { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); gap: 48px; align-items: start; }
.steps { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; }
.steps li { display: grid; grid-template-columns: 56px minmax(0, 1fr); gap: 16px; padding: 22px 0; border-top: 1px solid var(--line); }
.steps li:last-child { border-bottom: 1px solid var(--line); }
.step-n { font: 700 22px/28px var(--mono); color: var(--accent); }
.steps h3 { font-size: 20px; line-height: 28px; }
.steps p { margin-top: 6px !important; color: var(--muted); }
.blueprint-note { margin-top: 14px !important; font-size: 14px; line-height: 22px; color: var(--muted); }
.background { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 48px; margin-top: 72px; padding-top: 40px; border-top: 1px solid var(--line); }
.minor-title { font: 600 12px/16px var(--mono) !important; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); margin-bottom: 12px !important; }
.experience article { padding: 14px 0; border-bottom: 1px solid var(--line); }
.experience h4 { font-size: 17px; line-height: 26px; }
.experience p { color: var(--muted); margin-top: 4px !important; }
.links { display: flex; flex-wrap: wrap; gap: 4px 24px; margin-top: 12px; }
.links a { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 10px 0; }
.notes { scroll-margin-top: calc(var(--navbar-height) + 16px); }
.note-row { display: flex; gap: 16px; align-items: center; min-height: 56px; padding: 14px 4px; border-bottom: 1px solid var(--line); color: var(--text) !important; }
.note-row:hover { text-decoration: none !important; background: #f0eadf; }
.note-row > span:first-child { margin-right: auto; }
.badge { padding: 2px 8px; border-radius: 999px; background: #eae5d6; color: #605821; font-size: 12px; }

/* Contact & footer */
.contact { padding: 112px 0 72px; background: radial-gradient(50% 80% at 10% 100%, rgb(182 56 36 / 22%), transparent 70%), var(--ink); }
.contact-title { font-size: clamp(36px, 5.6vw, 80px); line-height: 1.04; letter-spacing: -.035em; max-width: 14ch; }
.email { display: inline-flex; align-items: center; gap: 10px; margin-top: 32px; padding: 12px 0; font-size: clamp(18px, 2.2vw, 26px); overflow-wrap: anywhere; color: var(--on-ink) !important; border-bottom: 1px solid rgb(239 234 224 / 30%); }
.email:hover { text-decoration: none !important; border-color: var(--accent-bright); }
.contact .links { margin-top: 16px; }
footer { border-top: 1px solid var(--ink-line); }
.footer-row { display: flex; justify-content: space-between; align-items: center; gap: 24px; padding-top: 8px; padding-bottom: 8px; font-size: 14px; color: var(--on-ink-muted); }
.footer-row a { display: flex; min-width: 44px; min-height: 44px; align-items: center; justify-content: center; }

@media (max-width: 1279px) {
  .cell-digit, .cell-loan { grid-column: span 12; }
}
@media (max-width: 1023px) {
  .hero { padding: 48px 0 64px; }
  .hero-grid { grid-template-columns: 1fr; gap: 32px; }
  .hero :deep(.hero-loop) { max-width: 560px; width: 100%; justify-self: center; }
  .workflow, .background { grid-template-columns: 1fr; gap: 32px; }
  .band { padding: 72px 0; }
}
@media (max-width: 767px) {
  .hero h1, .chinese .hero h1 { font-size: clamp(36px, 10vw, 56px); }
  .wrap { padding: 0 24px; }
  .band { padding: 56px 0; }
  .band-head { margin-bottom: 32px; }
  .band-head p:last-child { font-size: 16px; line-height: 26px; }
  .hero { padding: 36px 0 48px; }
  .kicker { margin-bottom: 20px !important; }
  .lede { font-size: 16px; line-height: 26px; margin-top: 20px !important; }
  .hero-actions { margin-top: 28px; }
  .hero-actions .button { flex: 1 1 auto; justify-content: center; }
  .stats { gap: 16px; margin-top: 36px; padding-top: 20px; }
  .stats dt { font-size: 12px; line-height: 16px; }
  .lab-grid { gap: 16px; }
  .cell-tool { grid-column: span 12; padding: 20px; }
  .contact { padding: 72px 0 48px; }
}
@media (max-width: 389px) {
  .wrap { padding: 0 16px; }
  .hero h1 { font-size: 34px; }
  .chinese .hero h1 { font-size: 32px; }
  .stats { grid-template-columns: 1fr 1fr; }
  .stats div:last-child { grid-column: span 2; }
}
@media (prefers-reduced-motion: reduce) {
  .homepage :deep(*), .homepage :deep(*::before), .homepage :deep(*::after) { scroll-behavior: auto !important; transition: none !important; }
}
</style>

<style>
.site-layout .homepage { padding-top: var(--navbar-height); }
.site-layout:has(.homepage) { color-scheme: light; }
.vp-theme-container.homepage-page .vp-navbar {
  --vp-c-text: #efeae0; --vp-c-text-mute: #a8a397; --vp-c-bg: #12110f; --vp-c-bg-elv: #1f1d1a; --vp-c-bg-alt: #1a1916;
  --vp-c-border: rgb(239 234 224 / 18%); --vp-c-divider: rgb(239 234 224 / 12%); --vp-c-accent: #f08d77; --vp-c-control-hover: rgb(239 234 224 / 10%);
  background: rgb(18 17 15 / 92%); border-bottom-color: rgb(239 234 224 / 10%); color: #efeae0;
  -webkit-backdrop-filter: saturate(140%) blur(10px); backdrop-filter: saturate(140%) blur(10px);
}
.vp-theme-container.homepage-page .vp-navbar .arrow { filter: invert(1); }
</style>
