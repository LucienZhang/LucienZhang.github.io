// Checks the committed in-browser digit model against 100 MNIST test digits.
// Also re-runs the browser preprocessing on upscaled copies to mimic canvas drawings.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';
import { parseWeights, predict, normalise } from '../../docs/.vuepress/lib/digits/model.mjs';

const model = parseWeights(fs.readFileSync(new URL('../../docs/.vuepress/public/static/models/digits-mlp.bin', import.meta.url)));
const data = zlib.gunzipSync(fs.readFileSync(new URL('./mnist-test-100.bin.gz', import.meta.url)));
const labels = data.subarray(0, 100), images = data.subarray(100);
let direct = 0, drawn = 0;
const size = 140;
for (let n = 0; n < 100; n++) {
  const pixels = Float32Array.from(images.subarray(n * 784, (n + 1) * 784), v => v / 255);
  const best = p => p.indexOf(Math.max(...p));
  if (best(predict(model, pixels)) === labels[n]) direct++;
  // Nearest-neighbour upscale into a 140px "canvas", offset off-centre, then normalise back.
  const canvas = new Float32Array(size * size);
  for (let y = 0; y < 28 * 4; y++) for (let x = 0; x < 28 * 4; x++) canvas[(y + 6) * size + x + 20] = pixels[Math.floor(y / 4) * 28 + Math.floor(x / 4)];
  if (best(predict(model, normalise(canvas, size))) === labels[n]) drawn++;
}
assert.ok(direct >= 97, `direct accuracy ${direct}/100`);
assert.ok(drawn >= 95, `canvas-normalised accuracy ${drawn}/100`);
assert.equal(normalise(new Float32Array(size * size), size), null, 'blank canvas has no prediction');
console.log(`Digit model passed: ${direct}/100 direct, ${drawn}/100 after canvas normalisation.`);
