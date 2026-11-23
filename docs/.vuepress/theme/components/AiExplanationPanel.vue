<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
const props = defineProps({ input: { type: Object, required: true }, invalid: Boolean, locale: { type: String, required: true }, client: { type: Object, default: null } });
const emit = defineEmits(['close']);
const heading = ref(null), dialog = ref(null), answerCard = ref(null), status = ref('ready'), answer = ref(''), stale = ref(false), quota = ref(null), asked = ref('');
const identity = ref(props.client?.session.mode ?? 'signed-out');
let revision = 0;
const busy = computed(() => status.value === 'waiting');
const t = (en, zh) => props.locale === 'zh-CN' ? zh : en;
const available = computed(() => props.client?.configured);
const questions = computed(() => [
  ['curves', t('Why do the curves differ?', '为什么月供曲线不同？')],
  ['term', t('What does the term change?', '期限变化影响了什么？')],
  ['assumptions', t('What are the assumptions?', '这个例子有哪些假设？')],
]);
const message = computed(() => ({
  ready: !available.value ? t('AI is temporarily unavailable. The calculator still works.', 'AI 暂时不可用，贷款计算仍可正常使用。') : identity.value === 'user' ? t('Select a question about these results.', '请选择一个关于当前结果的问题。') : t('Sign in to use AI. New users can register on the sign-in page.', '登录后即可使用 AI，新用户可在登录页注册。'),
  waiting: t('Generating an explanation…', '正在生成解释…'),
  complete: t('Explanation complete.', '解释已完成。'),
  expired: t('Session expired. Sign in again.', '会话已过期，请重新登录。'),
  limited: t('Request limit reached. Try again later; the daily allowance resets at midnight in Tokyo.', '请求已达限制，请稍后重试；每日额度在东京时间零点重置。'),
  failed: t('The explanation could not be completed. Please try again later.', '未能完成解释，请稍后重试。'),
  'login-failed': t('Unable to start sign-in. Check that browser storage is available, then try again.', '无法开始登录，请确认浏览器允许存储后重试。'),
  redirecting: t('Opening the sign-in page…', '正在打开登录页面…'),
  cancelled: t('Stopped waiting. A request already accepted by the server still counts.', '已停止等待，后端已接纳的请求仍计入额度。'),
}[status.value]));
function invalidate() {
  revision++;
  props.client?.transport.cancel();
  if (answer.value) stale.value = true;
  if (busy.value) status.value = 'cancelled';
}
defineExpose({ invalidate, focus: () => heading.value?.focus() });
watch([() => props.input.currency, () => props.input.amount, () => props.input.annualRatePct, () => props.input.months, () => props.invalid], invalidate, { flush: 'sync' });
watch(() => props.locale, () => { invalidate(); answer.value = ''; stale.value = false; status.value = 'ready'; });
async function explain(intent) {
  if (props.invalid || busy.value || !available.value || props.client.session.mode !== 'user') return;
  invalidate();
  const current = revision;
  answer.value = ''; stale.value = false; status.value = 'waiting'; quota.value = null; asked.value = intent;
  try {
    const result = await props.client.transport.explain({ ...props.input }, props.locale, intent);
    if (current !== revision) return;
    answer.value = result.explanation; status.value = 'complete';
    await nextTick();
    answerCard.value?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    if (Number.isInteger(result.quota?.remaining) && result.quota.remaining >= 0 && result.quota.remaining <= 20) quota.value = result.quota.remaining;
  } catch (error) {
    if (current !== revision) return;
    identity.value = props.client.session.mode;
    status.value = error.code === 'SESSION_EXPIRED' ? 'expired' : error.code === 'RATE_LIMITED' ? 'limited' : 'failed';
  }
}
async function login() {
  invalidate(); status.value = 'redirecting';
  try { await props.client.login({ ...props.input }, props.locale); }
  catch { status.value = 'login-failed'; }
}
function signOut() {
  invalidate(); answer.value = ''; quota.value = null; identity.value = 'signed-out';
  try { props.client.logout(props.locale); }
  catch { props.client.session.clear(); status.value = 'ready'; }
}
const numberFormat = computed(() => new Intl.NumberFormat(props.locale, { notation: 'compact', maximumFractionDigits: 2 }));
const chips = computed(() => [
  `${numberFormat.value.format(Number(props.input.amount) || 0)} ${t('JPY', '日元')}`,
  `${props.input.annualRatePct}% ${t('fixed', '固定利率')}`,
  `${props.input.months / 12} ${t('years', '年')}`,
]);
const tone = computed(() => ({ expired: 'warn', limited: 'warn', failed: 'error', 'login-failed': 'error', cancelled: 'warn' }[status.value] ?? 'info'));
// Modal drawer: keep focus inside, lock page scroll, restore both on close.
let previousOverflow = '';
function trap(event) {
  if (event.key !== 'Tab') return;
  const items = [...dialog.value.querySelectorAll('button:not(:disabled), a[href], [tabindex="0"]')];
  if (!items.length) return;
  const first = items[0], last = items.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}
onMounted(async () => {
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  await nextTick(); heading.value?.focus();
});
onBeforeUnmount(() => { invalidate(); document.body.style.overflow = previousOverflow; });
</script>
<template>
  <Teleport to="body">
    <div class="ai-drawer-root" :lang="locale">
      <div class="ai-backdrop" aria-hidden="true" @click="emit('close')" />
      <section id="explanation" ref="dialog" class="explanation" role="dialog" aria-modal="true" aria-labelledby="explanation-title" @keydown.esc.stop="emit('close')" @keydown="trap">
        <header class="panel-heading">
          <button type="button" class="close" :aria-label="t('Close', '关闭')" @click="emit('close')"><span aria-hidden="true">×</span></button>
          <p class="kicker"><span class="spark" aria-hidden="true">✦</span>{{ t('Ask about this loan', '问问这笔贷款') }}</p>
          <h3 id="explanation-title" ref="heading" tabindex="-1">{{ t('AI explanation', 'AI 解释') }}</h3>
          <div class="meta">
            <span class="model">Claude Opus 5.5</span>
            <span v-if="quota !== null" class="quota">{{ t(`Remaining ${quota} / 20 today`, `今日剩余 ${quota} / 20`) }}</span>
          </div>
          <ul class="chips" :aria-label="t('Current inputs', '当前参数')"><li v-for="chip in chips" :key="chip">{{ chip }}</li></ul>
        </header>

        <div class="panel-body">
          <div v-if="identity !== 'user'" class="signin">
            <p class="signin-title">{{ t('Sign in to ask', '登录后即可提问') }}</p>
            <p class="signin-text">{{ t('Free, up to 20 explanations a day. New users can register on the sign-in page.', '免费使用，每日最多 20 次。新用户可在登录页注册。') }}</p>
            <button type="button" class="ai-login primary" :disabled="!available || status === 'redirecting'" @click="login">{{ t('Sign in / Register', '登录 / 注册') }}</button>
          </div>

          <p class="section-label">{{ t('Pick a question', '选一个问题') }}</p>
          <div class="questions">
            <button v-for="[intent, label] in questions" :key="intent" type="button" :class="{ active: asked === intent && (busy || answer) }" :disabled="invalid || busy || !available || identity !== 'user'" @click="explain(intent)"><span>{{ label }}</span><span class="arrow" aria-hidden="true">→</span></button>
          </div>

          <p role="status" aria-live="polite" :data-ai-status="status" class="status" :class="[tone, { waiting: busy, quiet: (status === 'ready' && available) || status === 'complete' }]"><span v-if="busy" class="dots" aria-hidden="true"><i /><i /><i /></span>{{ message }}</p>
          <button v-if="busy" type="button" class="stop" @click="invalidate">{{ t('Stop waiting', '停止等待') }}</button>
          <p v-if="stale" class="notice">{{ t('This explanation uses previous inputs. Ask again for the current results.', '此解释基于之前的参数，请重新提问以解释当前结果。') }}</p>
          <article v-if="answer" ref="answerCard" class="ai-answer-card" :class="{ stale }"><p class="ai-answer">{{ answer }}</p></article>
        </div>

        <footer class="panel-foot">
          <p class="fine">{{ t('Only the loan amount, rate, term and your question are sent. Accepted requests count even if the model fails or you stop waiting. AI can be wrong; the calculator’s numbers are authoritative.', '只发送贷款金额、利率、期限和所选问题。后端已接纳的请求即使失败或停止等待也计入额度。AI 可能出错，数值以计算器为准。') }}</p>
          <button v-if="identity === 'user'" type="button" class="ai-logout link" @click="signOut">{{ t('Sign out', '退出登录') }}</button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>
<style scoped>
.ai-drawer-root { position: fixed; inset: 0; z-index: 200; font: 16px/1.55 system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; color-scheme: dark; }
.ai-backdrop { position: absolute; inset: 0; background: rgb(18 17 15 / 55%); -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); animation: fade .2s ease-out; }
.explanation { position: absolute; top: 0; right: 0; bottom: 0; width: min(480px, 100%); display: flex; flex-direction: column; background: radial-gradient(90% 40% at 100% 0, rgb(182 56 36 / 30%), transparent 70%), #12110f; color: #efeae0; box-shadow: -24px 0 60px -20px rgb(0 0 0 / 60%); border-left: 1px solid rgb(239 234 224 / 10%); animation: slide-in .28s cubic-bezier(.2, .8, .2, 1); }
.explanation * { box-sizing: border-box; }
.panel-heading { position: relative; padding: 24px 24px 18px; border-bottom: 1px solid rgb(239 234 224 / 10%); }
.kicker { display: flex; align-items: center; gap: 8px; margin: 0 0 6px; font: 600 12px/16px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: .1em; text-transform: uppercase; color: #f08d77; }
.spark { color: #ff7a5c; }
h3 { margin: 0; padding: 0; border: 0; font-size: 26px; line-height: 1.2; font-weight: 700; letter-spacing: -.02em; color: #efeae0; }
h3:focus { outline: none; }
h3:focus-visible { outline: 2px solid #e8553a; outline-offset: 4px; }
.meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.meta span { padding: 3px 10px; border-radius: 999px; font: 12px/18px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.model { background: rgb(232 85 58 / 16%); color: #ffb39c; }
.quota { background: rgb(239 234 224 / 8%); color: #d8d3c7; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 14px 0 0; padding: 0; list-style: none; }
.chips li { padding: 4px 10px; border-radius: 8px; border: 1px solid rgb(239 234 224 / 14%); font-size: 13px; line-height: 20px; color: #c9c4b8; font-variant-numeric: tabular-nums; }
.close { position: absolute; top: 16px; right: 16px; display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border-radius: 50%; border: 1px solid rgb(239 234 224 / 18%); background: transparent; color: #efeae0; font-size: 24px; line-height: 1; cursor: pointer; }
.close:hover { background: rgb(239 234 224 / 10%); }
.panel-body { flex: 1; overflow-y: auto; overscroll-behavior: contain; padding: 20px 24px; }
.signin { margin-bottom: 22px; padding: 18px; border-radius: 14px; background: rgb(239 234 224 / 5%); border: 1px solid rgb(239 234 224 / 12%); }
.signin-title { margin: 0; font-size: 17px; font-weight: 650; }
.signin-text { margin: 4px 0 14px; font-size: 14px; line-height: 21px; color: #b9b4a8; }
.section-label { margin: 0 0 10px; font: 600 12px/16px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: .1em; text-transform: uppercase; color: #a8a397; }
.questions { display: grid; gap: 8px; }
button { font: inherit; cursor: pointer; }
.questions button { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 52px; padding: 12px 16px; border-radius: 12px; border: 1px solid rgb(239 234 224 / 16%); background: rgb(239 234 224 / 4%); color: #efeae0; text-align: left; transition: border-color .15s, background .15s, transform .15s; }
.questions button:hover:not(:disabled) { border-color: #e8553a; background: rgb(232 85 58 / 10%); transform: translateX(2px); }
.questions button.active { border-color: #e8553a; background: rgb(232 85 58 / 16%); }
.questions button:disabled { opacity: .45; cursor: default; }
.arrow { color: #f08d77; }
.primary { width: 100%; min-height: 48px; padding: 10px 16px; border: 0; border-radius: 999px; background: linear-gradient(120deg, #e8553a, #b63824); color: #fff; font-weight: 650; box-shadow: 0 10px 30px -12px rgb(232 85 58 / 80%); }
.primary:disabled { opacity: .55; cursor: default; }
.status { display: flex; align-items: center; gap: 10px; margin: 18px 0 0; padding: 10px 14px; border-radius: 10px; font-size: 14px; line-height: 20px; background: rgb(239 234 224 / 5%); color: #c9c4b8; }
.status.quiet { position: absolute; width: 1px; height: 1px; margin: 0; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.status.warn { background: rgb(217 164 65 / 14%); color: #f2cf86; }
.status.error { background: rgb(232 85 58 / 16%); color: #ffb39c; }
.dots { display: inline-flex; gap: 4px; }
.dots i { width: 6px; height: 6px; border-radius: 50%; background: #ff7a5c; animation: bounce 1s infinite ease-in-out; }
.dots i:nth-child(2) { animation-delay: .15s; } .dots i:nth-child(3) { animation-delay: .3s; }
.stop { margin-top: 10px; min-height: 40px; padding: 6px 14px; border-radius: 999px; border: 1px solid rgb(239 234 224 / 22%); background: transparent; color: #efeae0; }
.notice { margin: 14px 0 0; padding: 10px 14px; border-left: 3px solid #d9a441; background: rgb(217 164 65 / 10%); font-size: 14px; line-height: 21px; color: #f2cf86; }
.ai-answer-card { scroll-margin-top: 12px; margin-top: 16px; padding: 20px 22px; border-radius: 14px; background: #f7f4ed; color: #20231f; box-shadow: inset 4px 0 0 #b63824, 0 18px 40px -24px rgb(0 0 0 / 70%); animation: rise .3s ease-out; }
.ai-answer-card.stale { opacity: .6; }
.ai-answer { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 17px; line-height: 1.8; }
.panel-foot { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 14px 24px calc(14px + env(safe-area-inset-bottom)); border-top: 1px solid rgb(239 234 224 / 10%); }
.fine { margin: 0; font-size: 12px; line-height: 18px; color: #8f8a7f; }
.link { flex: none; min-height: 36px; padding: 4px 0; border: 0; background: none; color: #f08d77; text-decoration: underline; text-underline-offset: 3px; }
.explanation :focus-visible { outline: 2px solid #e8553a; outline-offset: 3px; }
@keyframes slide-in { from { transform: translateX(40px); opacity: 0; } }
@keyframes slide-up { from { transform: translateY(40px); opacity: 0; } }
@keyframes fade { from { opacity: 0; } }
@keyframes rise { from { transform: translateY(8px); opacity: 0; } }
@keyframes bounce { 0%, 80%, 100% { transform: translateY(0); opacity: .4; } 40% { transform: translateY(-4px); opacity: 1; } }
@media (max-width: 719px) {
  .explanation { top: auto; left: 0; width: 100%; max-height: 88vh; border-left: 0; border-top: 1px solid rgb(239 234 224 / 12%); border-radius: 20px 20px 0 0; box-shadow: 0 -24px 60px -20px rgb(0 0 0 / 60%); animation-name: slide-up; }
  .panel-heading { padding: 20px 20px 14px; }
  .panel-heading::before { content: ''; position: absolute; top: 8px; left: 50%; width: 40px; height: 4px; margin-left: -20px; border-radius: 2px; background: rgb(239 234 224 / 25%); }
  h3 { font-size: 22px; }
  .panel-body { padding: 16px 20px; }
  .panel-foot { padding-inline: 20px; }
}
@media (prefers-reduced-motion: reduce) {
  .ai-backdrop, .explanation, .ai-answer-card, .dots i { animation: none; }
  .questions button { transition: none; }
}
</style>
