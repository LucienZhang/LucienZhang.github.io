import assert from 'node:assert/strict';
import { inHoverCorridor } from '../../../docs/.vuepress/components/tools/japan-tax/hover-corridor.mjs';
const trigger = { left: 300, right: 344, top: 0, bottom: 44 };
const panel = { left: 0, right: 344, top: 60, bottom: 240 };
for (let i = 0; i <= 100; i++) {
  assert.ok(inHoverCorridor([322 + (20 - 322) * i / 100, 22 + 65 * i / 100], trigger, panel));
}
assert.equal(inHoverCorridor([-40, -40], trigger, panel), false);
assert.equal(inHoverCorridor([400, 100], trigger, panel), false);
assert.equal(inHoverCorridor([100, 260], trigger, panel), false);
console.log('Safe polygon: 101 diagonal positions and 3 outside positions passed.');
