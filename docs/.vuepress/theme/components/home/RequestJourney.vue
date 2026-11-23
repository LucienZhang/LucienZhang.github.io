<script setup>
import { computed } from 'vue';
const props = defineProps({ zh: Boolean });
const t = (en, cn) => props.zh ? cn : en;
const stops = computed(() => [
  { tag: 'BROWSER', title: t('Sign in', '登录'), detail: t('Cognito authorisation code + PKCE (S256). Token kept in memory only.', 'Cognito 授权码 + PKCE（S256），token 只存在内存里。') },
  { tag: 'API GATEWAY', title: t('Verify at the edge', '入口验签'), detail: t('JWT checked before any code runs. AI route limited to 5 req/s, burst 10.', '代码运行前先验 JWT；AI 路由每秒 5 次、突发 10 次。') },
  { tag: 'LAMBDA', title: t('Recompute, don’t trust', '重算，不轻信'), detail: t('Validates the numbers and recalculates the loan deterministically. The prompt never leaves the backend.', '校验参数并确定性重算贷款；提示词只在后端，不下发浏览器。') },
  { tag: 'DYNAMODB', title: t('Daily quota', '每日额度'), detail: t('20 explanations per user per day, conditional writes, reset at midnight Tokyo.', '每人每天 20 次，条件写入计数，东京零点重置。') },
  { tag: 'CLAUDE API', title: t('Model call', '调用模型'), detail: t('Claude Opus 5.5 at low effort, via workload identity federation: a short-lived AWS token, no stored API key. Explains the numbers; never changes them.', 'Claude Opus 5.5，低思考强度；用工作负载身份联合换取短期令牌，不存 API key。只解释数字，不改数字。') },
  { tag: 'PAGE', title: t('Render safely', '安全呈现'), detail: t('Plain text only — no HTML, no Markdown links — beside the calculator, never over it.', '只渲染纯文本，不执行 HTML 或 Markdown 链接；放在计算结果旁边，不覆盖它。') },
]);
const guards = computed(() => [
  t('Timeouts 24 → 28 → 29 → 30 s', '超时链 24 → 28 → 29 → 30 秒'),
  t('Reserved concurrency 10', '预留并发 10'),
  t('No prompts or answers in logs', '日志不记录请求和回答正文'),
  t('7-day log retention', '日志保留 7 天'),
  t('No anonymous access', '不开放匿名调用'),
  t('No API keys stored', '不存任何 API key'),
]);
</script>

<template>
  <div class="journey">
    <ol class="stops">
      <li v-for="(stop, i) in stops" :key="stop.tag" :class="{ pending: stop.pending }" :style="{ '--i': i }">
        <span class="node" aria-hidden="true"><span>{{ String(i + 1).padStart(2, '0') }}</span></span>
        <p class="tag">{{ stop.tag }}<span v-if="stop.pending" class="chip">{{ t('going live', '接入中') }}</span></p>
        <h3>{{ stop.title }}</h3>
        <p class="detail">{{ stop.detail }}</p>
      </li>
    </ol>
    <ul class="guards" :aria-label="t('Guardrails', '护栏')">
      <li v-for="guard in guards" :key="guard">{{ guard }}</li>
    </ul>
  </div>
</template>

<style scoped>
.journey { min-width: 0; }
.stops { position: relative; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 20px; margin: 0; padding: 0; list-style: none; }
.stops::before, .stops::after { content: ''; position: absolute; top: 23px; left: 24px; right: 24px; height: 2px; }
.stops::before { background: repeating-linear-gradient(90deg, rgb(239 234 224 / 22%) 0 6px, transparent 6px 12px); }
.stops::after { background: linear-gradient(90deg, transparent, #ff7a5c) no-repeat -96px 0 / 96px 2px; filter: drop-shadow(0 0 6px rgb(232 85 58 / 90%)); animation: pulse-x 4.5s cubic-bezier(.6, 0, .4, 1) infinite; }
@keyframes pulse-x { from { background-position: -96px 0; } to { background-position: calc(100% + 96px) 0; } }
.stops li { position: relative; min-width: 0; }
.node { position: relative; z-index: 1; display: grid; place-items: center; width: 48px; height: 48px; border-radius: 50%; background: #1a1916; border: 1px solid rgb(239 234 224 / 22%); font: 600 13px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: #efeae0; }
.pending .node { border-color: #d9a441; color: #f2cf86; box-shadow: 0 0 0 4px rgb(217 164 65 / 14%); }
.tag { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 16px 0 6px; font: 600 12px/16px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: .08em; color: #f08d77; }
.chip { padding: 2px 8px; border-radius: 999px; background: rgb(217 164 65 / 16%); color: #f2cf86; letter-spacing: 0; }
h3 { margin: 0; color: #efeae0 !important; font-size: 18px !important; line-height: 26px !important; }
.detail { margin: 6px 0 0; font-size: 14px; line-height: 21px; color: #b9b4a8; }
.guards { display: flex; flex-wrap: wrap; gap: 8px; margin: 40px 0 0; padding: 0; list-style: none; }
.guards li { padding: 8px 14px; border-radius: 999px; border: 1px solid rgb(239 234 224 / 14%); background: rgb(239 234 224 / 4%); font: 13px/18px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: #d8d3c7; }
.guards li::before { content: '✓ '; color: #f08d77; }
@media (max-width: 1023px) {
  .stops { grid-template-columns: 1fr 1fr; row-gap: 32px; }
  .stops::before, .stops::after { display: none; }
}
@media (max-width: 559px) {
  .stops { grid-template-columns: 1fr; row-gap: 0; }
  .stops li { display: grid; grid-template-columns: 48px minmax(0, 1fr); column-gap: 16px; padding-bottom: 24px; }
  .stops li::before { content: ''; position: absolute; left: 23px; top: 48px; bottom: 0; width: 2px; background: repeating-linear-gradient(rgb(239 234 224 / 22%) 0 6px, transparent 6px 12px); }
  .stops li:last-child::before { display: none; }
  .node { grid-row: span 3; }
  .tag { margin-top: 4px; }
}
@media (prefers-reduced-motion: reduce) { .stops::after { display: none; } }
</style>
