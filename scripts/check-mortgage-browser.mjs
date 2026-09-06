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

    const output = path.join(root, '.ai/artifacts/mortgage');
    fs.mkdirSync(output,{recursive:true});
    const evaluate = async expression => {
      const response=await cdp.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
      if(response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
      return response.result.value;
    };
    const input=async(selector,value)=>{
      if(['#calendar-start','#view-month'].includes(selector)) {
        const [year,month]=value.split('-');
        await input(selector+'-year',year || '');
        if(month) await input(selector+'-month',month);
        return;
      }
      await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await delay(100);
    };
    const screenshot=async name=>{const metrics=await cdp.send('Page.getLayoutMetrics');const shot=await Promise.race([cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:metrics.cssContentSize.width,height:metrics.cssContentSize.height,scale:1}}),delay(20000).then(()=>{throw new Error('Screenshot timed out: '+name)})]);fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(shot.data,'base64'));};
    const resetInputs=async()=>{await input('#amount','50000000');for(const id of ['a','b']) { await input('#'+id+'-rate','1.5');await input('#'+id+'-months','420'); }};
    const records=[];
    await navigate(cdp,origin+'/tools/mortgage.html');
    await waitFor(cdp,"document.querySelector('.controls') && !document.querySelector('.controls').disabled",10000);
    await evaluate("document.querySelector('#app').__vue_app__.config.globalProperties.$router.push('/misc/apis.html')");
    await waitFor(cdp,"!document.querySelector('.mortgage')",10000);
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.vp-theme-container')).getPropertyValue('--content-width').trim()"),'740px');
    for(const lang of ['en','zh']) {
      const route=lang==='en'?'/tools/mortgage.html':'/zh/tools/mortgage.html';
      for(const width of [1440,390,320]) {
        await cdp.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
        await navigate(cdp,origin+route);
        await waitFor(cdp,"document.querySelector('.controls') && !document.querySelector('.controls').disabled",10000);
        assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'),'overflow '+lang+width);
        assert.equal(await evaluate("document.querySelectorAll('h1').length"),1);
        assert.ok(await evaluate("!!document.querySelector('.vp-navbar')"));
        assert.equal(await evaluate("getComputedStyle(document.querySelector('.vp-theme-container')).getPropertyValue('--content-width').trim()"),'1200px');
        if(width===1440) {
          assert.ok(await evaluate("document.querySelector('.mortgage').getBoundingClientRect().width>=1100"));
          assert.equal(await evaluate("getComputedStyle(document.querySelector('.method-field')).flexDirection"),'row');
          assert.equal(await evaluate("document.querySelector('#a-method').getBoundingClientRect().width"),lang==='en'?200:280);
        }
        assert.equal(await evaluate("document.querySelectorAll('.mortgage header,.mortgage footer').length"),0);
        assert.equal(await evaluate("document.querySelector('#amount').value"),'50,000,000');
        assert.equal(await evaluate("document.querySelector('#a-months').value"),'420');
        assert.equal(await evaluate("document.querySelector('#b-months').value"),'420');
        assert.equal(await evaluate("document.querySelectorAll('.presets,input[type=range],#month-number').length"),0);
        assert.ok(await evaluate("document.querySelector('.muted').textContent.match(/JPY example|日元示例/)!==null"));
        assert.ok(await evaluate("!document.querySelector('#amount-scale').textContent.match(/JPY|日元/)"));
        assert.ok(await evaluate("document.querySelector('.callout-value').textContent.includes('153,092')"));
        assert.equal(await evaluate("document.querySelectorAll('.chart svg').length"),2);
        assert.equal(await evaluate("document.querySelectorAll('.finding').length"),0);
        const clippedSelects=await evaluate(`(()=>{const c=document.createElement('canvas').getContext('2d');return [...document.querySelectorAll('.mortgage select')].filter(e=>{const s=getComputedStyle(e);c.font=s.font;return e.clientWidth<Math.max(...[...e.options].map(o=>c.measureText(o.textContent).width))+40}).map(e=>e.id);})()`);
        assert.deepEqual(clippedSelects,[],'select text clipping '+lang+' '+width);
        assert.equal(await evaluate("document.querySelector('#calendar-start-month').selectedOptions[0].textContent"),lang==='en'?'September':'9月');
        assert.equal(await evaluate("document.querySelector('#view-month-month').selectedOptions[0].textContent"),lang==='en'?'August':'8月');
        assert.equal(await evaluate("document.querySelectorAll('input[type=month]').length"),0);
        assert.ok(await evaluate(`(()=>{const e=document.querySelector('#a-method');const c=document.createElement('canvas').getContext('2d');c.font=getComputedStyle(e).font;return e.clientWidth>=Math.max(...[...e.options].map(o=>c.measureText(o.textContent).width))+40;})()`),'repayment method text clipped '+lang+' '+width);
        assert.ok(await evaluate("document.querySelector('.totals').textContent.includes('14,298,732.34')"));
        await evaluate('document.fonts.ready');
        await screenshot(lang+'-'+width);
        const overlaps=await evaluate(`(()=>{const charts=[...document.querySelectorAll('.chart svg')];return charts.some(svg=>{const boxes=[...svg.querySelectorAll('.point-callout rect')].map(e=>e.getBBox());return boxes.some((a,i)=>boxes.slice(i+1).some(b=>a.x<b.x+b.width && a.x+a.width>b.x && a.y<b.y+b.height && a.y+a.height>b.y));});})()`);
        assert.equal(overlaps,false,'callout overlap');
        assert.equal(await evaluate("document.querySelectorAll('.point-callout').length"),0);
        await evaluate("document.querySelector('.point-marker').dispatchEvent(new PointerEvent('pointerenter'))");await delay(80);
        assert.equal(await evaluate("document.querySelectorAll('.point-callout').length"),1);
        await evaluate("document.querySelector('.point-marker').dispatchEvent(new PointerEvent('pointerleave'))");await delay(80);
        assert.equal(await evaluate("document.querySelectorAll('.point-callout').length"),0);
        await evaluate("document.querySelector('.point-marker').focus()");await delay(80);
        assert.equal(await evaluate("document.querySelectorAll('.point-callout').length"),1);
        const ax = await cdp.send('Accessibility.getFullAXTree');
        assert.ok(ax.nodes.some(node => !node.ignored && node.role?.value === 'button' && /JPY|日元/.test(node.name?.value || '')), 'Chart markers must be exposed as accessible buttons');
        await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await delay(80);
        assert.equal(await evaluate("document.querySelectorAll('.point-callout').length"),0);
        await evaluate("document.querySelector('.formulas').open=true");
        assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'));
        assert.ok(await evaluate("document.querySelector('.formulas').textContent.includes('0.00125')"));
        if(width===390 || width===1440) {
          await evaluate("document.documentElement.style.scrollBehavior='auto';window.scrollTo({top:0,behavior:'instant'})");
          await screenshot(lang+'-'+width+'-formulas');
        }
        const gap=await evaluate("(()=>{const a=document.querySelector('.formulas summary').getBoundingClientRect(),b=document.querySelector('.formulas h3').getBoundingClientRect();return b.top-a.bottom;})()");
        assert.ok(gap>=0 && gap<24,'unexpected gap before symbol heading');
        await evaluate("document.querySelector('.formulas').open=false");
        records.push({lang,width,fit:true});
      }
      const expected=['payment','interest','interest-difference','cumulative-difference','cumulative','balance'];
      for(const id of ['view-1','view-2']) assert.deepEqual(await evaluate(`[...document.querySelector('#${id}-mode').options].map(o=>o.value)`),expected);
      for(const value of expected) {
        await input('#view-1-mode',value);
        assert.equal(await evaluate("document.querySelector('#view-2-mode').value"),'cumulative-difference');
        assert.equal(await evaluate("document.querySelector('.chart svg').querySelectorAll('polyline').length"),value.includes('difference')?1:2);
      }
      await input('#view-1-mode','payment');
      for(let i=0;i<4;i++) { await evaluate("document.querySelector('#add-view').click()");await delay(100); }
      assert.equal(await evaluate("document.querySelectorAll('.chart').length"),6);
      assert.equal(await evaluate("document.querySelector('#add-view').disabled"),true);
      await evaluate("document.querySelector('#add-view').click()");await delay(80);
      assert.equal(await evaluate("document.querySelectorAll('.chart').length"),6);
      await screenshot(lang+'-six-views');
      for(let i=0;i<5;i++) { await evaluate("[...document.querySelectorAll('.remove-view')].at(-1).click()");await delay(80); }
      assert.equal(await evaluate("document.querySelectorAll('.chart').length"),1);
      assert.equal(await evaluate("document.querySelector('.remove-view').disabled"),true);
      assert.equal(await evaluate("document.activeElement.id"),'view-1-mode');
      await evaluate("document.querySelector('#add-view').click()");await delay(100);
      assert.equal(await evaluate("document.querySelectorAll('.chart').length"),2);
      // Restore the original stable IDs with a fresh page for the existing regression checks.
      await navigate(cdp,origin+route);
      await waitFor(cdp,"document.querySelector('.controls') && !document.querySelector('.controls').disabled",10000);
      for(const id of ['a','b']) {
        await evaluate(`document.querySelector('#${id}-rate').focus()`);
        await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowUp',code:'ArrowUp',windowsVirtualKeyCode:38});await delay(80);
        assert.equal(await evaluate(`document.querySelector('#${id}-rate').value`),'1.6');
        await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40});await delay(80);
        assert.equal(await evaluate(`document.querySelector('#${id}-rate').value`),'1.5');
      }
      const unnamed=await evaluate("[...document.querySelectorAll('.mortgage input,.mortgage select,.mortgage button')].filter(e=>!(e.labels?.length || e.textContent.trim() || e.getAttribute('aria-label'))).length");
      assert.equal(unnamed,0);
      await input('#amount','10000000000');await input('#a-rate','20');await input('#a-months','600');
      assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'));
      await screenshot(lang+'-extreme');
      await resetInputs();
      await evaluate(`(()=>{const svg=document.querySelector('.chart svg');const box=svg.getBoundingClientRect();const w=svg.viewBox.baseVal.width;const x=64+(100-1)/(420-1)*(w-80);svg.dispatchEvent(new PointerEvent('pointerdown',{clientX:box.left+x/w*box.width,bubbles:true}));})()`);
      await delay(100);
      assert.equal(await evaluate("document.querySelector('#view-month').dataset.value"),'2034-12');
      await input('#calendar-start','2024-12');
      await input('#view-month','2025-01');
      assert.ok(await evaluate("document.querySelector('.selection-summary').textContent.includes('2025-01')"));
      assert.ok(await evaluate("document.querySelector('.totals').textContent.includes('14,298,732.34')"));
      await input('#calendar-start','');
      assert.equal(await evaluate("document.querySelector('#calendar-start').getAttribute('aria-invalid')"),'true');
      await input('#calendar-start','2026-09');
      await input('#view-month','2040-07');
      assert.equal(await evaluate("document.querySelector('#view-month').dataset.value"),'2040-07');
      await input('#view-month','');
      assert.equal(await evaluate("document.querySelector('#view-month').getAttribute('aria-invalid')"),'true');
      await input('#view-month','2040-08');
      await input('#amount','10,000,000,000');
      assert.equal(await evaluate("document.querySelector('#amount').value"),'10,000,000,000');
      await input('#amount','50000000');
      await input('#amount','');
      assert.equal(await evaluate("document.querySelector('#amount').getAttribute('aria-invalid')"),'true');
      assert.ok(await evaluate("!!document.querySelector('[role=alert]')"));
      assert.ok(await evaluate("document.querySelector('.totals').textContent.includes('14,298,732.34')"));
      await input('#amount','50000000');
      await input('#a-rate','0'); await input('#b-rate','0');
      assert.ok(await evaluate("document.querySelector('.totals').textContent.includes('0.00')"));
      await input('#a-months','1');await input('#b-months','2');
      await input('#view-month','2026-10');
      assert.ok(await evaluate("document.querySelector('.readout').textContent.includes('A: 0.00')"));
      await input('#view-2-mode','balance');
      assert.ok(await evaluate("document.querySelector('#view-2-heading').textContent.match(/Remaining principal|剩余本金/) !== null"));
      await input('#view-1-mode','interest-difference');
      await resetInputs();
      await input('#view-month','2026-10');
      await evaluate("document.querySelector('#view-month-year').focus()");
      assert.equal(await evaluate("document.activeElement.id"),'view-month-year');
      await evaluate("document.querySelector('.data').open=true");
      await evaluate("document.querySelector('.paging button:last-child').click()"); await delay(100);
      assert.equal(await evaluate("document.querySelector('tbody th').textContent.split(' · ')[0]"),'24');
      assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'));
      await screenshot(lang+'-table');
      await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'},{name:'prefers-color-scheme',value:'dark'}]});
      assert.equal(await evaluate("getComputedStyle(document.querySelector('.mortgage')).colorScheme"),'light');
      assert.equal(await evaluate("getComputedStyle(document.querySelector('.mortgage button')).transitionDuration"),'0s');
      await screenshot(lang+'-dark-reduced');
      await cdp.send('Emulation.setDeviceMetricsOverride',{width:640,height:450,deviceScaleFactor:2,mobile:false});
      assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'));
      await cdp.send('Emulation.setEmulatedMedia',{features:[]});
      await cdp.send('Emulation.setScriptExecutionDisabled',{value:true});await navigate(cdp,origin+route);
      assert.ok(await evaluate("document.querySelector('.controls').disabled"));
      assert.ok(await evaluate("document.querySelector('svg polyline').getAttribute('points').length>100"));
      assert.ok(await evaluate("document.querySelector('meta[name=robots]').content.includes('noindex')"));
      await screenshot(lang+'-ssr');
      await cdp.send('Emulation.setScriptExecutionDisabled',{value:false});
    }
    fs.writeFileSync(path.join(output,'checks.json'),JSON.stringify({records,runtimeErrors,forbiddenRemoteRequests},null,2));
    assert.deepEqual(runtimeErrors,[]);
    assert.deepEqual(forbiddenRemoteRequests,[]);
    await cdp.close();
    console.log('Mortgage browser checks passed; evidence in .ai/artifacts/mortgage.');
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
