<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{ locale: 'en' | 'zh' }>();
const zh = computed(() => props.locale === 'zh');
const copy = computed(() => zh.value ? {
  brand: '张本人', home: '返回首页', language: 'English', languageLabel: '切换至英文；输入草稿不会保留',
  eyebrow: '工具探索', status: '规划中', title: 'AI 筛股器',
  intro: '从你的筛选想法出发，探索更清晰的选股过程。',
  notice: '目前仅为页面预览。筛选与 AI 功能尚未实现，未连接市场数据。',
  intent: '你想如何筛选？', label: '筛选意图草稿', placeholder: '写下你希望探索的筛选想法……',
  help: '仅供试写，不解析、不发送、不保存。刷新或切换语言后清空。',
  criteria: '筛选条件', criteriaTitle: '条件区域待设计', criteriaBody: '这里将用于确认筛选条件。支持的市场与条件范围尚未确定；输入草稿不会生成条件。',
  results: '筛选结果', emptyTitle: '尚未运行筛选', emptyBody: '结果区域目前为空。页面尚不支持筛选，也没有接入证券或行情数据。',
  emptyNote: '空状态预览 · 并非“没有符合条件的证券”',
  next: '接下来要明确的方向', steps: [
    ['描述想法', '探索如何表达筛选意图，具体输入方式待设计。'],
    ['确认条件', '确定市场范围与可用条件，再设计确认方式。'],
    ['查看结果', '数据来源与展示方式明确后，再实现结果区域。'],
  ], footer: '页面设计预览 · 功能待实现',
} : {
  brand: 'Ziliang', home: 'Back to home', language: '中文', languageLabel: 'Switch to Chinese; the draft will be cleared',
  eyebrow: 'Tool exploration', status: 'In planning', title: 'AI stock screener',
  intro: 'Start with an idea. Explore a clearer way to screen stocks.',
  notice: 'Page preview only. Screening and AI are not implemented. No market data is connected.',
  intent: 'What would you like to explore?', label: 'Screening intent draft', placeholder: 'Write down what you would like to explore…',
  help: 'For trying the input only. Not parsed, sent, or saved. Cleared on refresh or language change.',
  criteria: 'Screening criteria', criteriaTitle: 'Criteria area to be designed', criteriaBody: 'A place to review screening criteria. Markets and supported conditions are still undecided; your draft does not generate criteria.',
  results: 'Screening results', emptyTitle: 'No screening has been run', emptyBody: 'This area is empty. Screening is not available yet, and no securities or market data are connected.',
  emptyNote: 'Empty-state preview · This does not mean “no matches”',
  next: 'What comes next', steps: [
    ['Describe an idea', 'Explore how to express screening intent. The input approach is still to be designed.'],
    ['Review criteria', 'Define markets and supported conditions, then design how to confirm them.'],
    ['Explore results', 'Implement this area once data sources and the presentation approach are defined.'],
  ], footer: 'Page design preview · Functionality to come',
});
</script>

<template>
  <div class="stock-shell" :lang="zh ? 'zh-CN' : 'en-US'">
    <a class="skip-link" href="#stock-content">{{ zh ? '跳至页面内容' : 'Skip to content' }}</a>
    <header class="stock-header">
      <a class="brand" :class="{ chinese: zh }" :href="zh ? '/zh/' : '/'" :aria-label="`${copy.brand} — ${copy.home}`">{{ copy.brand }}</a>
      <a class="language" :href="zh ? '/tools/stock-screener.html' : '/zh/tools/stock-screener.html'" :lang="zh ? 'en' : 'zh-CN'" :aria-label="copy.languageLabel">{{ copy.language }} <span aria-hidden="true">↗</span></a>
    </header>
    <div id="stock-content" class="stock-content" tabindex="-1">
      <section class="hero" aria-labelledby="stock-title">
        <div class="eyebrow"><span>{{ copy.eyebrow }}</span><span class="status">{{ copy.status }}</span></div>
        <h1 id="stock-title">{{ copy.title }}</h1>
        <p class="intro">{{ copy.intro }}</p>
        <p class="notice">{{ copy.notice }}</p>
      </section>
      <div class="workspace">
        <div class="input-column">
          <section aria-labelledby="intent-title">
            <h2 id="intent-title">{{ copy.intent }}</h2>
            <label for="stock-intent">{{ copy.label }}</label>
            <textarea id="stock-intent" rows="4" :placeholder="copy.placeholder" aria-describedby="intent-help" autocomplete="off" spellcheck="false"></textarea>
            <p id="intent-help" class="small">{{ copy.help }}</p>
          </section>
          <section class="criteria" aria-labelledby="criteria-title">
            <h2 id="criteria-title">{{ copy.criteria }}</h2>
            <div class="criteria-placeholder"><h3>{{ copy.criteriaTitle }}</h3><p>{{ copy.criteriaBody }}</p></div>
          </section>
        </div>
        <section class="results" aria-labelledby="results-title">
          <h2 id="results-title">{{ copy.results }}</h2>
          <div class="empty-state">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true"><rect x="11" y="9" width="42" height="46" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M20 22h24M20 32h16M20 42h21" stroke="currentColor" stroke-width="1.5"/></svg>
            <h3>{{ copy.emptyTitle }}</h3><p>{{ copy.emptyBody }}</p><p class="small empty-note">{{ copy.emptyNote }}</p>
          </div>
        </section>
      </div>
      <section class="next" aria-labelledby="next-title">
        <h2 id="next-title">{{ copy.next }}</h2>
        <div class="directions"><div v-for="step in copy.steps" :key="step[0]"><h3>{{ step[0] }}</h3><p>{{ step[1] }}</p></div></div>
      </section>
    </div>
    <footer><span>© 2026 Ziliang Zhang</span><span>{{ copy.footer }}</span></footer>
  </div>
</template>

<style scoped>
/* Only this route's theme wrapper is adjusted; all visual rules live below the tool root. */
:global(.stock-screener-page .vp-page) { padding: 0; }
:global(.stock-screener-page .vp-page [vp-content]) { max-width: none; padding: 0; margin: 0; }
:global(.stock-screener-page .vp-page-meta), :global(.stock-screener-page .vp-page-nav) { display: none; }
.stock-shell { color-scheme: light; background: #f7f4ed; color: #20231f; min-height: 100vh; font: 16px/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.stock-shell * { box-sizing: border-box; }
.stock-header, .stock-content, footer { max-width: 1280px; margin: 0 auto; padding-inline: 40px; }
.stock-header { min-height: 96px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #cbc7bd; }
.stock-shell a { color: #b63824; text-decoration: none; }
.stock-shell a:hover { text-decoration: underline; }
.stock-shell a:focus-visible, textarea:focus-visible, #stock-content:focus-visible { outline: 2px solid #b63824; outline-offset: 3px; }
.stock-shell .brand { font-family: Sacramento, cursive; font-size: 1.8rem; font-weight: 400; color: #20231f; min-height: 44px; }
.stock-shell .brand.chinese { font-family: Slidefu, serif; font-size: 2rem; }
.language { display: inline-flex; align-items: center; gap: 12px; min-height: 44px; padding: 8px; }
.skip-link { position: absolute; top: 8px; left: 16px; padding: 12px; background: #f7f4ed; z-index: 5; transform: translateY(-200%); }
.skip-link:focus { transform: none; }
.hero { padding-block: 56px 40px; }
.eyebrow { display: flex; align-items: center; gap: 16px; color: #64665f; font-size: 14px; }
.status { color: #b63824; border: 1px solid #b63824; padding: 2px 10px; border-radius: 3px; }
.stock-shell h1 { font: 400 clamp(40px, 4vw, 60px)/1.15 Georgia, 'Times New Roman', serif; margin: 20px 0 16px; border: 0; padding: 0; }
.stock-shell[lang='zh-CN'] h1 { font-family: 'Songti SC', 'Noto Serif CJK SC', serif; line-height: 1.35; }
.stock-shell h2 { font-size: 24px; line-height: 1.35; margin: 0 0 24px; border: 0; padding: 0; font-weight: 600; }
.stock-shell h3 { font-size: 18px; line-height: 1.5; margin: 0 0 8px; padding: 0; font-weight: 600; }
.stock-shell p { margin: 0; }
.intro { font-size: 20px; max-width: 720px; }
.stock-shell .notice { margin-top: 24px; padding-left: 16px; border-left: 2px solid #b63824; color: #64665f; max-width: 800px; }
.workspace { border-top: 1px solid #cbc7bd; padding-top: 32px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); gap: 48px; }
label { display: block; font-size: 14px; margin-bottom: 8px; }
textarea { display: block; resize: vertical; width: 100%; min-height: 140px; border: 1px solid #77786e; border-radius: 3px; padding: 14px 16px; background: #fffcf6; color: #20231f; font: inherit; }
textarea::placeholder { color: #64665f; opacity: 1; }
.stock-shell .small { font-size: 14px; color: #64665f; line-height: 1.6; }
.stock-shell #intent-help { margin-top: 12px; }
.criteria { margin-top: 32px; }
.criteria-placeholder { border: 1px dashed #aaa69b; padding: 20px; }
.criteria-placeholder p, .directions p { color: #64665f; }
.results { border-left: 1px solid #cbc7bd; padding-left: 48px; display: flex; flex-direction: column; }
.empty-state { flex: 1; min-height: 320px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 32px 16px; }
.empty-state svg { color: #8a8475; margin-bottom: 24px; }
.empty-state p { max-width: 370px; color: #64665f; }
.stock-shell .empty-note { margin-top: 24px; }
.next { margin-block: 56px; padding-top: 32px; border-top: 1px solid #cbc7bd; }
.directions { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 40px; }
footer { display: flex; justify-content: space-between; gap: 16px; border-top: 1px solid #cbc7bd; padding-block: 24px; font-size: 14px; color: #64665f; }
@media (max-width: 900px) { .workspace { grid-template-columns: 1fr; gap: 32px; } .results { border-left: 0; border-top: 1px solid #cbc7bd; padding: 32px 0 0; } .empty-state { min-height: 280px; } }
@media (max-width: 767px) { .stock-header, .stock-content, footer { padding-inline: 24px; } .stock-header { min-height: 80px; } .hero { padding-block: 40px 32px; } .stock-shell h1 { font-size: 36px; } .stock-shell h2 { font-size: 22px; } .intro { font-size: 18px; } .directions { grid-template-columns: 1fr; gap: 24px; } .next { margin-block: 40px; } footer { flex-direction: column; gap: 8px; } }
@media (max-width: 389px) { .stock-header, .stock-content, footer { padding-inline: 20px; } .stock-shell h1 { font-size: 32px; } }
</style>
