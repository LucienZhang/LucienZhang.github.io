<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { inHoverCorridor } from './hover-corridor.mjs';
defineProps({ id: String, label: String });
const visible = ref(false);
const pinned = ref(false);
const helpButton = ref(null);
const helpRoot = ref(null);
const helpPanel = ref(null);
let closeTimer;
function cancelClose() { clearTimeout(closeTimer); closeTimer = undefined; }
function hasFocus() { return helpRoot.value?.contains(document.activeElement); }
function showHelp() { cancelClose(); visible.value = true; }
function closeHelp(event) {
  cancelClose(); visible.value = false; pinned.value = false;
  if (event?.type === 'keydown') { event.preventDefault(); helpButton.value?.focus(); visible.value = false; }
}
function deferClose() {
  if (pinned.value || hasFocus()) return;
  cancelClose();
  closeTimer = setTimeout(() => { if (!pinned.value && !hasFocus()) closeHelp(); }, 280);
}
function pointerMove(event) {
  if (!visible.value || event.pointerType !== 'mouse') return;
  if (inHoverCorridor([event.clientX, event.clientY], helpButton.value.getBoundingClientRect(), helpPanel.value.getBoundingClientRect())) cancelClose();
  else if (!closeTimer) deferClose();
}
function pointerDown(event) { if (visible.value && !helpRoot.value?.contains(event.target)) closeHelp(); }
function focusOut(event) { if (!event.currentTarget.contains(event.relatedTarget)) closeHelp(); }
onMounted(() => { document.addEventListener('pointermove', pointerMove); document.addEventListener('pointerdown', pointerDown); });
onBeforeUnmount(() => { cancelClose(); document.removeEventListener('pointermove', pointerMove); document.removeEventListener('pointerdown', pointerDown); });
</script>
<template>
  <div ref="helpRoot" class="field-help-control" @pointerenter="$event.pointerType === 'mouse' && showHelp()" @pointerleave="deferClose" @focusin="showHelp" @focusout="focusOut" @keydown.esc="closeHelp">
    <button ref="helpButton" type="button" class="help-button" :aria-label="label" :aria-expanded="visible" :aria-controls="id" @click="pinned ? closeHelp() : (pinned = true, visible = true)"><span aria-hidden="true">?</span></button>
    <div ref="helpPanel" v-show="visible" :id="id" class="help-popup"><slot /></div>
  </div>
</template>
<style scoped>
.field-help-control { flex: 0 0 24px; width: 24px; }
.field-help-control .help-button { display: flex; align-items: center; justify-content: flex-start; width: 24px; height: 44px; min-height: 44px; padding: 0; border: 0; background: transparent; cursor: pointer; color: #64665f; }
.help-button span { display: grid; place-items: center; width: 20px; height: 20px; border: 1px solid currentColor; border-radius: 50%; font: 600 13px/1 sans-serif; }
.help-popup { position: absolute; z-index: 10; top: 100%; inset-inline: 0; max-height: min(70vh, 32rem); overflow-y: auto; overscroll-behavior: contain; background: #fffdf8; color: #20231f; border: 1px solid #797b71; border-top: 3px solid #b63824; padding: 16px; box-shadow: 0 4px 12px #20231f18; font-size: 14px; font-weight: 400; }
.help-popup :deep(p) { color: #64665f; margin: 8px 0; line-height: 1.6; }
.help-popup :deep(a) { display: inline-block; min-height: 44px; align-content: center; color: #b63824; text-decoration: underline; }
.help-button:focus-visible { outline: 2px solid #b63824; outline-offset: 3px; }
</style>
