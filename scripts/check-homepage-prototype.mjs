import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

let dist;
let serveNotebookFixture = false;

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  dist = path.join(root, "docs/.vuepress/dist");
  const chrome = findChrome();
  assert.ok(chrome, "Chrome/Chromium was not found. Set CHROME_BIN to run the browser smoke test.");
  assert.ok(fs.existsSync(path.join(dist, "index.html")), "Build output is missing; run npm run build first.");

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "vuepress-smoke-"));
  const server = http.createServer(serveDist);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const chromeLog = path.join(profile, "chrome-stderr.log");
  const chromeLogFd = fs.openSync(chromeLog, "w");
  const browser = spawn(chrome, [
    "--headless=new",
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--disable-background-networking",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "about:blank",
  ], { stdio: ["ignore", "ignore", chromeLogFd] });
  fs.closeSync(chromeLogFd);

  try {
    const debugPort = await readDebugPort(profile, browser, chromeLog);
    const target = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, {
      method: "PUT",
    }).then((response) => response.json());
    const cdp = new CdpClient(target.webSocketDebuggerUrl);
    await cdp.open();
    await cdp.send("Page.enable");
    await cdp.send("Page.bringToFront");
    await cdp.send("Runtime.enable");
    await cdp.send("Network.enable");
    await cdp.send("Network.setBlockedURLs", { urls: ["*api.ziliang.ninja*"] });

    const runtimeErrors = [];
    const forbiddenRemoteRequests = [];
    cdp.on("Network.requestWillBeSent", (event) => {
      const hostname = new URL(event.request.url).hostname;
      if (["cdn.jsdelivr.net", "cdnjs.cloudflare.com"].includes(hostname)) {
        forbiddenRemoteRequests.push(event.request.url);
      }
    });
    cdp.on("Runtime.exceptionThrown", (event) => runtimeErrors.push(event.exceptionDetails.text));
    cdp.on("Runtime.consoleAPICalled", (event) => {
      if (["error", "warning"].includes(event.type)) {
        runtimeErrors.push(event.args.map((arg) => arg.value ?? arg.description).join(" "));
      }
    });

    const output = path.join(root, '.ai/phase5/prototype-evidence');
    fs.mkdirSync(output, { recursive: true });
    const evaluate = async expression => {
      const response = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (response.exceptionDetails) throw new Error(response.exceptionDetails.text + JSON.stringify(response.exceptionDetails));
      return response.result.value;
    };
    const click = async selector => { await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); await delay(80); };
    const input = async (selector, value) => { await evaluate(`(() => {const el = document.querySelector(${JSON.stringify(selector)}); el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true}));})()`); await delay(80); };
    const screenshot = async name => {
      const metrics = await cdp.send('Page.getLayoutMetrics');
      const capture = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: {x:0,y:0,width:metrics.cssContentSize.width,height:metrics.cssContentSize.height,scale:1} });
      fs.writeFileSync(path.join(output, name + '.png'), Buffer.from(capture.data, 'base64'));
    };
    const assertFit = async () => assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), 'horizontal page overflow');
    const records = [];
    for (const language of ['en', 'zh']) {
      const route = language === 'en' ? '/preview/home.html' : '/zh/preview/home.html';
      for (const [width, height] of [[1440,900],[1280,720],[768,1024],[390,844],[320,844]]) {
        await cdp.send('Emulation.setDeviceMetricsOverride', {width,height,deviceScaleFactor:1,mobile:false});
        await navigate(cdp, origin + route);
        await waitFor(cdp, "document.querySelector('#loan-years') && !document.querySelector('.term-controls').disabled", 10000);
        await evaluate('document.fonts.ready');
        await assertFit();
        assert.equal(await evaluate("document.querySelectorAll('main').length"), 1);
        assert.equal(await evaluate("document.querySelectorAll('h1').length"), 1);
        const geometry = await evaluate(`({termBottom:document.querySelector('.term-controls').getBoundingClientRect().bottom, explainBottom:document.querySelector('.primary').getBoundingClientRect().bottom, font:getComputedStyle(document.querySelector('.brand')).fontFamily})`);
        records.push({language,width,height,...geometry});
        if (width >= 1280) assert.ok(geometry.explainBottom <= height, 'desktop explanation CTA below fold');
        if (width === 390) assert.ok(geometry.termBottom <= height, 'mobile term below fold');
        await screenshot(`${language}-${width}`);
        await click('.parameters summary');
        await click('.data > summary');
        await click('.data details summary');
        await click('.primary');
        assert.equal(await evaluate('document.activeElement.id'), 'explanation-title');
        if (width < 768) await click('.menu-button');
        await assertFit();
        if (width === 390 || width === 1440) await screenshot(`${language}-${width}-expanded`);
      }
      await click('.questions button');
      await waitFor(cdp, "document.querySelector('[role=status]').textContent.includes('ready') || document.querySelector('[role=status]').textContent.includes('完成')", 3000);
      await click('.explanation .actions button');
      assert.equal(await evaluate('document.activeElement.id'), 'payment-first');
      await input('#loan-years', '20');
      assert.ok(await evaluate("document.querySelector('.explanation .notice') !== null"));
      assert.ok(await evaluate("document.querySelector('.explanation .actions button').disabled"));
      await input('#loan-amount', '');
      assert.equal(await evaluate("document.querySelector('#loan-amount').getAttribute('aria-invalid')"), 'true');
      assert.ok(await evaluate("document.querySelector('.questions button').disabled"));
      await input('#loan-amount', '300000');
      await input('#loan-rate', '0');
      assert.equal(await evaluate("document.querySelector('#payment-interest dd').textContent"), '0.00');
      await click('.questions button');
      await click('.explanation > button');
      assert.ok(await evaluate("document.querySelector('.explanation [role=status]').textContent.match(/Cancelled|已取消/) !== null"));
      for (const state of ['error', 'timeout', 'limited']) {
        await input('#mock-fixture', state);
        await click('.questions button');
        await waitFor(cdp, "document.querySelector('.explanation [role=status]').textContent.match(/Simulated|模拟/) !== null", 5000);
        assert.ok(await evaluate(`document.querySelector('.explanation [role=status]').textContent.match(/Simulated|模拟/) !== null`));
      }
      await input('#mock-fixture', 'success');
      await click('.explanation > button');
      await delay(800);
      await input('#mock-question', 'Tell me a stock to buy');
      await click('.question-input button');
      assert.ok(await evaluate("document.querySelector('.explanation [role=status]').textContent.match(/three suggested|三个推荐/) !== null"));
      await evaluate("document.querySelector('#mock-question').focus()");
      await cdp.send('Input.dispatchKeyEvent', {type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
      assert.ok(await evaluate("document.activeElement.classList.contains('primary')"));
      await evaluate("document.querySelector('#loan-years').focus()");
      const old = await evaluate("document.querySelector('#loan-years').value");
      await cdp.send('Input.dispatchKeyEvent', {type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
      assert.equal(Number(await evaluate("document.querySelector('#loan-years').value")), Number(old)+1);
      // Parameter edits during generation must cancel the old snapshot.
      await click('.primary'); await click('.questions button'); await input('#loan-rate', '5'); await delay(800);
      assert.ok(await evaluate("document.querySelector('.explanation [role=status]').textContent.match(/Cancelled|已取消/) !== null"));
      await cdp.send('Emulation.setEmulatedMedia', {features:[{name:'prefers-reduced-motion',value:'reduce'},{name:'prefers-color-scheme',value:'dark'}]});
      await assertFit();
      assert.equal(await evaluate("getComputedStyle(document.querySelector('.prototype')).colorScheme"), 'light');
      assert.equal(await evaluate("getComputedStyle(document.querySelector('.primary')).transitionDuration"), '0s');
      // 200% reflow equivalent: 1280 physical width -> 640 CSS pixels, 2x raster scale.
      await cdp.send('Emulation.setDeviceMetricsOverride', {width:640,height:450,deviceScaleFactor:2,mobile:false});
      await assertFit(); await screenshot(`${language}-200pct-reflow`);
      await cdp.send('Emulation.setEmulatedMedia', {features:[]});
      // Full SSR fallback with JavaScript disabled.
      await cdp.send('Emulation.setScriptExecutionDisabled', {value:true});
      await navigate(cdp, origin + route);
      assert.ok(await evaluate("document.querySelector('.term-controls').disabled"));
      assert.ok(await evaluate("document.querySelector('#contact .email').textContent.includes('lucienzhangzl@gmail.com')"));
      assert.ok(await evaluate("document.querySelector('svg polyline').getAttribute('points').length > 100"));
      await screenshot(`${language}-nojs`);
      await cdp.send('Emulation.setScriptExecutionDisabled', {value:false});
    }
    await navigate(cdp, origin + '/preview/home.html');
    await waitFor(cdp, "document.querySelector('#loan-years') && !document.querySelector('.term-controls').disabled", 10000);
    await click('.parameters summary');
    await input('#loan-amount', '10000000'); await input('#loan-rate', '20'); await input('#loan-years', '40');
    await cdp.send('Emulation.setDeviceMetricsOverride', {width:390,height:844,deviceScaleFactor:1,mobile:false});
    await assertFit();
    await click('.menu-button');
    await evaluate("document.querySelector('#prototype-nav a').focus()");
    await cdp.send('Input.dispatchKeyEvent', {type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    assert.ok(await evaluate("document.activeElement.classList.contains('menu-button')"));
    const unnamed = await evaluate("[...document.querySelectorAll('.prototype button, .prototype input, .prototype select')].filter(e => !(e.getAttribute('aria-label') || e.textContent.trim() || e.labels?.length)).map(e=>e.id)");
    assert.deepEqual(unnamed, []);
    const brokenLabels = await evaluate("[...document.querySelectorAll('.prototype [aria-labelledby]')].filter(e => e.getAttribute('aria-labelledby').split(' ').some(id => !document.getElementById(id))).length");
    assert.equal(brokenLabels, 0);
    // Use Vue Router directly to exercise unmount/remount (ordinary links remain usable without JS).
    await evaluate("document.querySelector('#app').__vue_app__.config.globalProperties.$router.push('/misc/apis.html')");
    await waitFor(cdp, "!document.querySelector('.prototype')", 10000);
    await evaluate("document.querySelector('#app').__vue_app__.config.globalProperties.$router.push('/zh/preview/home.html')");
    await waitFor(cdp, "document.querySelector('.prototype.chinese') && !document.querySelector('.term-controls').disabled", 10000);
    assert.equal(await evaluate("document.querySelectorAll('main').length"), 1);
    assert.equal(await evaluate("document.querySelector('#loan-years').value"), '25');
    // Consistent, repeated local measurements; never represented as field performance.
    await cdp.send('Emulation.setDeviceMetricsOverride', {width:1440,height:900,deviceScaleFactor:1,mobile:false});
    await cdp.send('Emulation.setCPUThrottlingRate', {rate:4});
    await cdp.send('Network.emulateNetworkConditions', {offline:false,latency:40,downloadThroughput:1250000,uploadThroughput:625000});
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', {source:"window.__lcp=0;window.__cls=0;new PerformanceObserver(l=>{window.__lcp=l.getEntries().at(-1).startTime}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__cls+=e.value}).observe({type:'layout-shift',buffered:true});"});
    const performanceRuns = [];
    for(let i=0;i<3;i++) {
      await cdp.send('Network.clearBrowserCache');
      await navigate(cdp, origin + '/preview/home.html');
      await waitFor(cdp, "document.querySelector('#loan-years') && !document.querySelector('.term-controls').disabled", 15000);
      await delay(2500);
      performanceRuns.push(await evaluate(`(() => {const n=performance.getEntriesByType('navigation')[0];return {lcp:window.__lcp || null,cls:window.__cls,domContentLoaded:n.domContentLoadedEventEnd,load:n.loadEventEnd,responseEnd:n.responseEnd,visibility:document.visibilityState,paints:performance.getEntriesByType('paint').map(p=>({name:p.name,time:p.startTime}))}})()`));
    }
    const version = await cdp.send('Browser.getVersion');
    const ax = await cdp.send('Accessibility.getFullAXTree');
    assert.ok(ax.nodes.some(n => n.role?.value === 'slider' && n.name?.value === 'Term'));
    fs.writeFileSync(path.join(output, 'checks.json'), JSON.stringify({version,records,performanceRuns,errors:runtimeErrors}, null, 2));
    assert.deepEqual(runtimeErrors, [], `Browser runtime errors:\n${runtimeErrors.join("\n")}`);
    assert.deepEqual(
      forbiddenRemoteRequests,
      [],
      `Unexpected runtime CDN requests:\n${forbiddenRemoteRequests.join("\n")}`,
    );
    await cdp.close();
    console.log('Prototype browser checks passed; evidence in .ai/phase5/prototype-evidence.');
  } finally {
    await stopBrowser(browser);
    await new Promise((resolve) => server.close(resolve));
    removeBrowserProfile(profile);
  }
}

async function stopBrowser(browser) {
  if (browser.exitCode !== null || browser.signalCode !== null) return;

  const exited = new Promise((resolve) => browser.once("exit", resolve));
  browser.kill("SIGTERM");
  await Promise.race([exited, delay(2_000)]);
  if (browser.exitCode !== null || browser.signalCode !== null) return;

  browser.kill("SIGKILL");
  await Promise.race([exited, delay(2_000)]);
}

function removeBrowserProfile(profile) {
  try {
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  } catch (error) {
    if (!["EBUSY", "ENOTEMPTY"].includes(error.code)) throw error;
    console.warn(`Chrome profile cleanup deferred (${error.code}): ${profile}`);
  }
}

function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function serveDist(request, response) {
  const url = new URL(request.url, "http://localhost");
  if (serveNotebookFixture && url.pathname.startsWith("/static/jupyter/nb/")) {
    const body = "<!doctype html><html><body data-notebook-fixture>Notebook fixture</body></html>";
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(request.method === "HEAD" ? undefined : body);
    return;
  }
  let relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  if (!relativePath || relativePath.endsWith("/")) relativePath += "index.html";
  const file = path.resolve(dist, relativePath);
  if (!file.startsWith(dist + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404).end("Not found");
    return;
  }
  const types = {
    ".css": "text/css",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".wasm": "application/wasm",
  };
  response.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(response);
}

async function readDebugPort(directory, browser, chromeLog) {
  const file = path.join(directory, "DevToolsActivePort");
  let stderr = "";

  for (let attempt = 0; attempt < 300; attempt += 1) {
    stderr = fs.readFileSync(chromeLog, "utf8").slice(-8_000);
    const outputMatch = stderr.match(/DevTools listening on ws:\/\/[^:]+:(\d+)\//);
    if (outputMatch) return Number(outputMatch[1]);
    if (fs.existsSync(file)) return Number(fs.readFileSync(file, "utf8").split("\n")[0]);
    if (browser.exitCode !== null || browser.signalCode !== null) {
      throw new Error(`Chrome exited before exposing a DevTools port.${formatBrowserStderr(stderr)}`);
    }
    await delay(100);
  }

  throw new Error(`Chrome did not expose a DevTools port within 30 seconds.${formatBrowserStderr(stderr)}`);
}

function formatBrowserStderr(stderr) {
  const output = stderr.trim();
  return output ? `\nChrome stderr:\n${output}` : "";
}

async function navigate(cdp, url) {
  const loaded = cdp.once("Page.loadEventFired");
  await cdp.send("Page.navigate", { url });
  await Promise.race([loaded, delay(10_000).then(() => { throw new Error(`Navigation timed out: ${url}`); })]);
}

async function waitFor(cdp, expression, timeout) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const result = await cdp.send("Runtime.evaluate", { expression, returnByValue: true });
    if (result.result.value) return;
    await delay(100);
  }
  throw new Error(`Browser condition timed out: ${expression}`);
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

class CdpClient {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }

  open() {
    return new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
      this.socket.addEventListener("message", (message) => this.receive(message));
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) ?? [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }

  once(method) {
    return new Promise((resolve) => {
      const listener = (params) => {
        this.listeners.set(method, (this.listeners.get(method) ?? []).filter((item) => item !== listener));
        resolve(params);
      };
      this.on(method, listener);
    });
  }

  receive(message) {
    const payload = JSON.parse(message.data);
    if (payload.id) {
      const pending = this.pending.get(payload.id);
      this.pending.delete(payload.id);
      if (payload.error) pending?.reject(new Error(payload.error.message));
      else pending?.resolve(payload.result);
      return;
    }
    for (const listener of this.listeners.get(payload.method) ?? []) listener(payload.params);
  }

  close() {
    this.socket.close();
  }
}

await main();
