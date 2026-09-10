<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
const props = defineProps({ input: { type: Object, required: true }, invalid: Boolean, locale: { type: String, required: true }, client: { type: Object, default: null } });
const emit = defineEmits(['close']);
const heading = ref(null), status = ref('ready'), answer = ref(''), stale = ref(false), quota = ref(null);
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
  answer.value = ''; stale.value = false; status.value = 'waiting'; quota.value = null;
  try {
    const result = await props.client.transport.explain({ ...props.input }, props.locale, intent);
    if (current !== revision) return;
    answer.value = result.explanation; status.value = 'complete';
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
onMounted(async () => { await nextTick(); heading.value?.focus(); });
onBeforeUnmount(invalidate);
</script>
<template>
  <section id="explanation" class="explanation" aria-labelledby="explanation-title" @keydown.esc.stop="emit('close')">
    <div class="panel-heading"><h3 id="explanation-title" ref="heading" tabindex="-1">{{ t('AI explanation', 'AI 解释') }}</h3><button @click="emit('close')">{{ t('Close', '关闭') }}</button></div>
    <p>{{ t('When you ask, the loan amount, rate, term and selected question are sent to our AI service on AWS. No question is sent automatically after sign-in.', '提问时，贷款金额、利率、期限和所选问题会发送至 AWS 上的 AI 服务。登录后不会自动发起提问。') }}</p>
    <div class="actions">
      <span>{{ identity === 'user' ? t('Signed in · up to 20 requests/day', '已登录 · 每日最多 20 次') : t('Sign-in required · up to 20 requests/day', '需登录 · 每日最多 20 次') }}</span>
      <button v-if="identity !== 'user'" class="ai-login" :disabled="!available || status === 'redirecting'" @click="login">{{ t('Sign in / Register', '登录 / 注册') }}</button>
      <button v-else class="ai-logout" @click="signOut">{{ t('Sign out', '退出登录') }}</button>
    </div>
    <p v-if="quota !== null" class="quota">{{ t(`Remaining after this response: ${quota} / 20. Resets at midnight in Tokyo.`, `本次响应后剩余 ${quota} / 20 次，东京时间零点重置。`) }}</p>
    <div class="questions"><button v-for="[intent, label] in questions" :key="intent" :disabled="invalid || busy || !available || identity !== 'user'" @click="explain(intent)">{{ label }}</button></div>
    <p role="status" aria-live="polite" :data-ai-status="status">{{ message }}</p>
    <button v-if="busy" @click="invalidate">{{ t('Stop waiting', '停止等待') }}</button>
    <p v-if="stale" class="notice">{{ t('This explanation uses previous inputs. Ask again for the current results.', '此解释基于之前的参数，请重新提问以解释当前结果。') }}</p>
    <p v-if="answer" class="ai-answer">{{ answer }}</p>
    <p class="fine">{{ t('Accepted requests count even if the model fails or you stop waiting. AI explanations may contain errors; refer to the calculator for numerical results.', '后端已接纳的请求，即使模型失败或停止等待也会计入额度。AI 解释可能有误，数值结果请以计算器为准。') }}</p>
  </section>
</template>
<style scoped>
.explanation { border-top: 3px solid #287a68; margin-top: 24px; padding: 20px; background: #f0eade; }
.panel-heading, .actions, .questions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.panel-heading { justify-content: space-between; }
.panel-heading h3 { margin: 0; }
button { padding: 8px 12px; font: inherit; cursor: pointer; border: 1px solid #76756c; border-radius: 4px; background: #fffdf7; color: #24352f; }
button:disabled { opacity: .55; cursor: default; }
button:focus-visible { outline: 3px solid #287a68; outline-offset: 3px; }
.questions { margin-top: 16px; }
.ai-answer { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.8; }
.notice { border-left: 3px solid #947024; padding-left: 12px; }
.fine { font-size: 13px; line-height: 1.6; }
</style>
