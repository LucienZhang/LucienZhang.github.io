# Phase 0 baseline — 2026-09-04

This snapshot records the last known behavior before dependency, CI/runtime, UI-library, or product changes. It is intentionally tied to the existing lockfile.

## Environment and dependency snapshot

- Branch: `codex/vuepress-maintenance-upgrade`
- Node: `v26.8.1`
- npm: `11.19.0`
- `npm ls --depth=0`: saved in `npm-ls-depth-0.txt`
- VuePress integration package: `vuepress-vite@2.0.0-beta.60`
- Resolved Vite: `4.0.4`
- Resolved Vue: `3.2.47`
- Resolved Vue Router: `4.1.6`
- Known dependency inconsistency: the register-components and Shiki plugins resolve to `2.0.0-beta.50-pre.1` while the main VuePress packages resolve primarily to `beta.60`.

This local Node version is newer than both the declared `>=16` and CI Node 18 baselines. Phase 1, not Phase 0, owns changing the supported runtime.

`npm ci` completed from the unchanged lockfile, installed 650 packages, and applied the existing `@babel/runtime@7.20.13` patch successfully. npm 11 reported the existing `sourcemap-codec` and Popper v1 deprecations plus an allowScripts notice for `vue-demi`, `core-js`, `esbuild`, and `fsevents`; no dependency versions were changed. A full `npm run verify` after this clean install passed and rendered the same 50 routes.

## Production build baseline

Command: `/usr/bin/time -p npm run build`

- VuePress build result: success
- VuePress-reported duration: `26.30s`
- Wall-clock duration: `28.65s`
- Rendered HTML routes: `50` (full list in `routes.txt`)
- `docs/.vuepress/dist` disk usage: `15,468 KiB` (`15M` from `du -sh`)
- Warnings:
  - `caniuse-lite` is outdated.
  - Some minified chunks exceed 500 kB.

Largest generated assets measured with `du -k`:

| Asset | Size (KiB) |
| --- | ---: |
| `assets/BIM-e8fe529b.js` | 1,256 |
| `assets/fa-solid-900-4ee1b170.svg` | 820 |
| `assets/fa-brands-400-85eee115.svg` | 676 |
| `assets/Lang-32200e02.js` | 628 |
| `assets/style-eee6b13c.css` | 356 |
| `assets/programming-b275617f.png` | 284 |
| `assets/io-stream-hierarchy-e00158d6.png` | 272 |
| `assets/vertex-cover.html-6ea8840a.js` | 240 |
| `assets/app-9f2fd521.js` | 232 |

Hashed asset names are diagnostic evidence for this build only; verification scripts intentionally check stable routes and public artifact paths instead.

## Manual acceptance record

The Phase 0 browser pass must record the following without changing article content, interactions, or visual design:

| Area | Route | Baseline observation |
| --- | --- | --- |
| English home | `/` | Rendered in `en-US`; Typed text changed over time; Programming and ML cards resolved to valid routes; clicking WeChat displayed the QR image Modal. |
| Chinese home | `/zh/` | Rendered in `zh-CN`; Typed text changed over time; navbar contained only the existing localized ML section; locale and repository links were correct. |
| English content | `/programming/prog-lang/overview.html` | Title, navbar, sidebar, article heading, and locale switch rendered. |
| Chinese content / MNIST | `/zh/ml/mnist.html` | Chinese sidebar and article rendered; one drawing canvas and both localized controls were present. |
| BIM | `/misc/bim.html` | Article and one WebGL canvas rendered; IFC/WASM paths are additionally covered by artifact checks. |
| LeetCode | `/programming/algorithms/overview.html` | Article rendered, but the remote-backed widget still showed one spinner and no chart after 5 seconds. This is the pre-upgrade behavior. |
| Lang/TIOBE | `/programming/prog-lang/overview.html` | Article rendered, but the remote-backed widget still showed two spinners and no table/chart after 5 seconds. This is the pre-upgrade behavior. |
| Jupyter | `/programming/algorithms/misc.html` | iframe rendered with `/static/jupyter/nb/algorithms/misc/python.html`; local docs-only serving cannot supply the deployment-merged notebook artifact. |
| Pseudo | `/programming/algorithms/knapsack.html` | Two rendered `.ps-root` algorithm blocks were present after the component loaded. |

Remote API success, cross-origin iframe content, and WebGL correctness require live services and are recorded separately from static rendering. Phase 0 does not alter those integrations.

The browser session logged one `Hydration completed but contains mismatches.` error for each localized homepage visit. No additional warning/error entries appeared while visiting the content and component routes above. This is a known baseline defect, not introduced or repaired in Phase 0, and must be compared again during the VuePress compatibility spike.

## Navigation policy fixed in Phase 0

Chinese Programming and Misc routes do not exist. Until translated pages are added, those entries are omitted from the Chinese navbar instead of sending visitors to 404 pages. The Chinese homepage's English-only Programming card links explicitly to the existing English page. Existing Chinese ML routes remain localized. The existing `/zh/projects/` content remains directly addressable but is not promoted into navigation without a product decision.

## Re-running the baseline checks

```bash
npm run verify
```

This performs a production build, validates internal `href`/`src` targets in all generated HTML, confirms the exact 50-route snapshot, and checks critical static files for BIM, IFC, D3/NVD3, Pseudo, and fonts.

`/static/jupyter/nb/test.html` is an explicit link-check exception: the Pages workflow generates it from `LucienZhang/website-binder` and merges it after the local VuePress build. Deployment-level verification remains required for that artifact.
