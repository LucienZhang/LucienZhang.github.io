"""Train the homepage handwritten-digit MLP and export int8 weights.

Reproduce (MNIST idx .gz files in DATA_DIR, never committed):
  python3 -I scripts/digits/train.py DATA_DIR docs/.vuepress/public/static/models/digits-mlp.bin

Architecture: 784 -> 128 (ReLU) -> 10 softmax. Training uses random affine and
stroke-width augmentation so finger/mouse drawings normalised like MNIST
(20px bounding box, centre of mass at 14,14) are recognised in the browser.
Binary layout (little endian), read by docs/.vuepress/lib/digits/model.mjs:
  int8  W1[128*784] row-major, int8 W2[10*128],
  f32   s1[128], b1[128], s2[10], b2[10]   (per-row symmetric scales)
"""
import gzip
import json
import sys
import time
from pathlib import Path

import numpy as np
from scipy import ndimage

rng = np.random.default_rng(20261123)


def load(data_dir, prefix):
    with gzip.open(Path(data_dir) / f"{prefix}-images-idx3-ubyte.gz") as f:
        x = np.frombuffer(f.read(), np.uint8, offset=16).reshape(-1, 28, 28)
    with gzip.open(Path(data_dir) / f"{prefix}-labels-idx1-ubyte.gz") as f:
        y = np.frombuffer(f.read(), np.uint8, offset=8)
    return x.astype(np.float32) / 255.0, y.astype(np.int64)


def augment(images):
    out = np.empty_like(images)
    for i, img in enumerate(images):
        angle = np.deg2rad(rng.uniform(-14, 14))
        scale = rng.uniform(0.82, 1.15)
        shear = rng.uniform(-0.25, 0.25)
        c, s = np.cos(angle), np.sin(angle)
        m = np.array([[c, -s], [s, c]]) @ np.array([[1, shear], [0, 1]]) / scale
        centre = np.array([13.5, 13.5])
        shift = rng.uniform(-2.2, 2.2, size=2)
        offset = centre - m @ (centre + shift)
        a = ndimage.affine_transform(img, m, offset=offset, order=1, mode="constant")
        r = rng.random()
        if r < 0.3:
            a = ndimage.grey_dilation(a, size=(2, 2))
        elif r < 0.42:
            a = ndimage.grey_erosion(a, size=(2, 2)) * 0.5 + a * 0.5
        out[i] = np.clip(a, 0, 1)
    return out


def forward(x, w1, b1, w2, b2):
    h = np.maximum(x @ w1.T + b1, 0)
    z = h @ w2.T + b2
    z -= z.max(1, keepdims=True)
    p = np.exp(z)
    return h, p / p.sum(1, keepdims=True)


def quantise(w):
    scale = np.abs(w).max(1) / 127.0
    scale[scale == 0] = 1.0
    q = np.clip(np.round(w / scale[:, None]), -127, 127).astype(np.int8)
    return q, scale.astype(np.float32)


def main(data_dir, output):
    xtr, ytr = load(data_dir, "train")
    xte, yte = load(data_dir, "t10k")
    hidden, epochs, batch, lr, decay = 128, 24, 128, 1e-3, 1e-5
    w1 = (rng.standard_normal((hidden, 784)) * np.sqrt(2 / 784)).astype(np.float32)
    b1 = np.zeros(hidden, np.float32)
    w2 = (rng.standard_normal((10, hidden)) * np.sqrt(2 / hidden)).astype(np.float32)
    b2 = np.zeros(10, np.float32)
    params = [w1, b1, w2, b2]
    m = [np.zeros_like(p) for p in params]
    v = [np.zeros_like(p) for p in params]
    step = 0
    for epoch in range(epochs):
        t0 = time.time()
        order = rng.permutation(len(xtr))
        xa = augment(xtr[order]).reshape(-1, 784) if epoch < epochs - 2 else xtr[order].reshape(-1, 784)
        ya = ytr[order]
        rate = lr * (0.5 * (1 + np.cos(np.pi * epoch / epochs)))
        for i in range(0, len(xa), batch):
            x, y = xa[i:i + batch], ya[i:i + batch]
            h, p = forward(x, *params)
            g = p.copy()
            g[np.arange(len(y)), y] -= 1
            g /= len(y)
            gw2 = g.T @ h + decay * w2
            gb2 = g.sum(0)
            gh = (g @ w2) * (h > 0)
            gw1 = gh.T @ x + decay * w1
            gb1 = gh.sum(0)
            step += 1
            for k, grad in enumerate([gw1, gb1, gw2, gb2]):
                m[k] = 0.9 * m[k] + 0.1 * grad
                v[k] = 0.999 * v[k] + 0.001 * grad * grad
                mh = m[k] / (1 - 0.9 ** step)
                vh = v[k] / (1 - 0.999 ** step)
                params[k] -= (rate * mh / (np.sqrt(vh) + 1e-8)).astype(np.float32)
        acc = (forward(xte.reshape(-1, 784), *params)[1].argmax(1) == yte).mean()
        print(f"epoch {epoch + 1:2d} test {acc:.4f} lr {rate:.5f} {time.time() - t0:.1f}s", flush=True)

    q1, s1 = quantise(w1)
    q2, s2 = quantise(w2)
    dq = [q1 * s1[:, None], b1, q2 * s2[:, None], b2]
    acc_q = (forward(xte.reshape(-1, 784), *dq)[1].argmax(1) == yte).mean()
    aug_test = augment(xte[:3000]).reshape(-1, 784)
    acc_aug = (forward(aug_test, *dq)[1].argmax(1) == yte[:3000]).mean()
    blob = q1.tobytes() + q2.tobytes() + s1.tobytes() + b1.tobytes() + s2.tobytes() + b2.tobytes()
    Path(output).parent.mkdir(parents=True, exist_ok=True)
    Path(output).write_bytes(blob)
    meta = {"testAccuracy": round(float(acc_q), 4), "augmentedTestAccuracy": round(float(acc_aug), 4),
            "parameters": int(w1.size + b1.size + w2.size + b2.size), "bytes": len(blob)}
    Path(output).with_suffix(".json").write_text(json.dumps(meta) + "\n")
    print(json.dumps(meta))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
