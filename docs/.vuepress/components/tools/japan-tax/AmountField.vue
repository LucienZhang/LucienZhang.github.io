<script setup>
import { computed, nextTick } from 'vue';
import HelpPopover from './HelpPopover.vue';
import { formatAmount, amountScale } from './amount-format.js';
const props = defineProps({ field: Object, modelValue: String, zh: Boolean });
const emit = defineEmits(['update:modelValue']);
const invalid = value => value !== '' && !/^\d{1,16}$/.test(value ?? '');
const scale = computed(() => amountScale(props.modelValue, props.zh));
async function inputAmount(event) {
  if (event.isComposing) return;
  const input = event.target;
  const prefix = input.value.slice(0, input.selectionStart).replaceAll(',', '');
  const raw = input.value.replaceAll(',', '');
  emit('update:modelValue', raw);
  await nextTick();
  const formatted = formatAmount(raw);
  input.value = formatted;
  let caret = 0, count = 0;
  while (caret < formatted.length && count < prefix.length) { if (formatted[caret] !== ',') count++; caret++; }
  input.setSelectionRange(caret, caret);
}
</script>
<template>
  <div class="money-field">
    <div class="field-heading">
      <label :for="`tax-${field.id}`"><span lang="ja">{{ field.jp }}</span></label>
      <HelpPopover :id="`${field.id}-help`" :label="`${field.jp}：${zh ? '定义与票据位置' : 'definition and slip location'}`">
        <strong>{{ zh ? '定义与票据位置' : 'Definition & slip location' }}</strong>
        <p>{{ zh ? field.zhHelp : field.enHelp }}</p>
        <p>{{ field.zhWhere ? (zh ? field.zhWhere : field.enWhere) : (zh ? '请核对扣除证明或申报明细；源泉徴収票未必单列此项。' : 'Check deduction certificates or filing records; the slip may not list this separately.') }}</p>
        <a :href="field.source" target="_blank" rel="noopener noreferrer">{{ zh ? '官方说明（日文）↗' : 'Official guidance (Japanese) ↗' }}</a>
        <a v-for="[href, cn, en] in field.references || []" :key="href" :href="href" target="_blank" rel="noopener noreferrer">{{ zh ? cn : en }} ↗</a>
      </HelpPopover>
    </div>
    <small :id="`${field.id}-description`" class="field-subtitle">{{ zh ? field.zh : field.en }}</small>
    <div class="amount-row"><div class="money-control"><span aria-hidden="true">¥</span><input :id="`tax-${field.id}`" :value="formatAmount(modelValue)" @input="inputAmount" @compositionend="inputAmount" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" :aria-invalid="invalid(modelValue)" :aria-describedby="`${field.id}-description ${field.id}-scale${invalid(modelValue) ? ` ${field.id}-error` : ''}`" :placeholder="zh ? '输入日元金额' : 'Amount in yen'" /></div><span :id="`${field.id}-scale`" class="amount-scale">{{ scale }}</span></div>
    <p v-if="invalid(modelValue)" :id="`${field.id}-error`" class="field-error" role="alert">{{ zh ? '请填最多16位的非负整数日元，可使用千位逗号。' : 'Use up to 16 digits of non-negative whole yen; grouping commas are allowed.' }}</p>
  </div>
</template>
<style scoped>
.money-field { position: relative; margin: 0 0 24px; }
.field-heading { position: relative; display: flex; align-items: baseline; gap: 4px; }
.money-field label { min-width: 0; font-weight: 600; margin: 0; }
.field-subtitle { display: block; margin-bottom: 8px; font-size: 13px; color: #64665f; font-weight: 400; }
.amount-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 12px; }
.money-control { flex: 1 1 190px; min-width: 0; display: flex; align-items: center; background: #fffdf8; border: 1px solid #797b71; border-radius: 3px; }
.money-control > span:first-child { padding: 0 12px; color: #64665f; }
.money-control input { font: inherit; color: #20231f; font-size: 19px; background: transparent; width: 100%; min-width: 0; min-height: 48px; border: 0; padding: 10px 4px 10px 0; border-radius: 3px; }
.amount-scale { color: #64665f; font-size: 14px; overflow-wrap: anywhere; max-width: 100%; }
.money-control input::placeholder { color: #64665f; }
.field-error { color: #922813; font-size: 14px; }
.money-field :is(input, button, a):focus-visible { outline: 2px solid #b63824; outline-offset: 3px; }
@media (max-width: 400px) { .money-control input { font-size: 16px; } }
</style>
