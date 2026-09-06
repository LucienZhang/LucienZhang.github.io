<script setup>
import { computed } from 'vue';
const props = defineProps({ id:String, modelValue:String, min:String, max:String, label:String, lang:String, disabled:Boolean });
const emit = defineEmits(['update:modelValue']);
const zh = computed(()=>props.lang==='zh');
const year = computed(()=>props.modelValue?.split('-')[0] || '');
const month = computed(()=>props.modelValue?.split('-')[1] || '');
const years = computed(()=>Array.from({length:Number(props.max.slice(0,4))-Number(props.min.slice(0,4))+1},(_,i)=>String(Number(props.min.slice(0,4))+i)));
const names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function unavailable(m) {
  if(!year.value) return false;
  const value=year.value+'-'+m;
  return value<props.min || value>props.max;
}
function update(y,m) {
  if(!y || !m) { emit('update:modelValue',''); return; }
  const value=y+'-'+m;
  emit('update:modelValue',value<props.min ? props.min : value>props.max ? props.max : value);
}
</script>
<template>
  <div :id="id" class="month-picker" role="group" :aria-label="label" :data-value="modelValue" :lang="lang">
    <select :id="id+'-year'" :value="year" :disabled="disabled" :aria-label="label+' · '+(zh?'年份':'Year')" @change="update($event.target.value,month || '01')"><option value="">{{ zh?'年份':'Year' }}</option><option v-for="y in years" :key="y" :value="y">{{ zh?y+'年':y }}</option></select>
    <select :id="id+'-month'" :value="month" :disabled="disabled" :aria-label="label+' · '+(zh?'月份':'Month')" @change="update(year || min.slice(0,4),$event.target.value)"><option value="">{{ zh?'月份':'Month' }}</option><option v-for="(name,i) in names" :key="name" :value="String(i+1).padStart(2,'0')" :disabled="unavailable(String(i+1).padStart(2,'0'))">{{ zh?(i+1)+'月':name }}</option></select>
  </div>
</template>
<style scoped>
.month-picker{display:flex;gap:8px;flex-wrap:wrap;max-width:100%;min-width:0}.month-picker select{box-sizing:border-box;font:inherit;color:#20231f;background:#fffcf6;border:1px solid #77786c;border-radius:3px;min-height:44px;padding:8px 28px 8px 10px;max-width:100%}.month-picker select:first-child{width:106px}.month-picker select:last-child{width:156px}.month-picker select:focus-visible{outline:2px solid #99301f;outline-offset:3px}
.month-picker[lang="zh"] select:first-child{width:128px;flex-shrink:0}
.month-picker[lang="zh"] select:last-child{width:96px;flex-shrink:0}
</style>
