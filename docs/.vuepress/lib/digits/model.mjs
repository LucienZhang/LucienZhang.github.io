// In-browser handwritten digit model: MNIST-style preprocessing + int8 MLP inference.
// Weight layout is produced by scripts/digits/train.py.
export const INPUT = 784, HIDDEN = 128, CLASSES = 10;

export function parseWeights(buffer) {
  const bytes = buffer instanceof ArrayBuffer ? buffer : buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const expected = HIDDEN * INPUT + CLASSES * HIDDEN + 4 * (2 * HIDDEN + 2 * CLASSES);
  if (bytes.byteLength !== expected) throw new Error(`Unexpected digit model size ${bytes.byteLength}`);
  let offset = 0;
  const take = (Type, length) => {
    const view = new Type(bytes, offset, length);
    offset += length * Type.BYTES_PER_ELEMENT;
    return view;
  };
  const w1 = take(Int8Array, HIDDEN * INPUT), w2 = take(Int8Array, CLASSES * HIDDEN);
  const floats = new Float32Array(bytes.slice(offset));
  const s1 = floats.subarray(0, HIDDEN), b1 = floats.subarray(HIDDEN, 2 * HIDDEN);
  const s2 = floats.subarray(2 * HIDDEN, 2 * HIDDEN + CLASSES), b2 = floats.subarray(2 * HIDDEN + CLASSES);
  return { w1, w2, s1, b1, s2, b2 };
}

export function predict(model, input) {
  const hidden = new Float32Array(HIDDEN);
  for (let j = 0; j < HIDDEN; j++) {
    let sum = 0;
    const row = j * INPUT;
    for (let i = 0; i < INPUT; i++) if (input[i]) sum += model.w1[row + i] * input[i];
    hidden[j] = Math.max(0, sum * model.s1[j] + model.b1[j]);
  }
  const logits = new Float32Array(CLASSES);
  for (let k = 0; k < CLASSES; k++) {
    let sum = 0;
    const row = k * HIDDEN;
    for (let j = 0; j < HIDDEN; j++) sum += model.w2[row + j] * hidden[j];
    logits[k] = sum * model.s2[k] + model.b2[k];
  }
  const max = Math.max(...logits);
  const exp = logits.map(v => Math.exp(v - max));
  const total = exp.reduce((a, b) => a + b, 0);
  return Array.from(exp, v => v / total);
}

// Ink is an array of grayscale values (0–1) in a square canvas of `size` pixels.
// Mirrors how MNIST was made: fit the stroke bounding box into 20×20, keep the aspect
// ratio, then shift so the centre of mass sits at the centre of a 28×28 image.
export function normalise(ink, size) {
  let minX = size, minY = size, maxX = -1, maxY = -1;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (ink[y * size + x] > 0.05) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  }
  if (maxX < 0) return null;
  const w = maxX - minX + 1, h = maxY - minY + 1, scale = 20 / Math.max(w, h);
  const box = new Float32Array(28 * 28);
  // Area-average the bounding box into a scaled grid placed at the top-left.
  const sw = Math.max(1, Math.round(w * scale)), sh = Math.max(1, Math.round(h * scale));
  for (let ty = 0; ty < sh; ty++) for (let tx = 0; tx < sw; tx++) {
    const x0 = minX + tx / scale, x1 = minX + (tx + 1) / scale, y0 = minY + ty / scale, y1 = minY + (ty + 1) / scale;
    let sum = 0, area = 0;
    for (let y = Math.floor(y0); y < Math.ceil(y1); y++) for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
      const cover = (Math.min(x + 1, x1) - Math.max(x, x0)) * (Math.min(y + 1, y1) - Math.max(y, y0));
      if (cover <= 0) continue;
      sum += (x <= maxX && y <= maxY ? ink[y * size + x] : 0) * cover; area += cover;
    }
    box[ty * 28 + tx] = area ? sum / area : 0;
  }
  let mass = 0, cx = 0, cy = 0;
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) { const v = box[y * 28 + x]; mass += v; cx += v * x; cy += v * y; }
  if (!mass) return null;
  const dx = Math.round(13.5 - cx / mass), dy = Math.round(13.5 - cy / mass);
  const out = new Float32Array(INPUT);
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
    const nx = x + dx, ny = y + dy;
    if (nx >= 0 && nx < 28 && ny >= 0 && ny < 28) out[ny * 28 + nx] = Math.min(1, box[y * 28 + x]);
  }
  return out;
}
