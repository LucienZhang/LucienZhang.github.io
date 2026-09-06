import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
const dist = path.resolve('docs/.vuepress/dist');
const serveNotebookFixture = false;
const output = path.resolve('.ai/tools/japan-tax');
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
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { this.pending.delete(id); reject(new Error('CDP timeout: ' + method + ' ' + (params.expression ?? ''))); }, 30000);
      this.pending.set(id, { resolve: value => { clearTimeout(timeout); resolve(value); }, reject: error => { clearTimeout(timeout); reject(error); } });
    });
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


const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'japan-tax-browser-'));
const server = http.createServer(serveDist);
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const chromeLog = path.join(profile, 'chrome.log');
const fd = fs.openSync(chromeLog, 'w');
const browser = spawn(findChrome(), ['--headless=new', '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--no-sandbox', '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', fd, fd] });
let cdp;
const report = { views: [], errors: [], externalRequests: [] };
try {
  const port = await readDebugPort(profile, browser, chromeLog);
  const target = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' }).then(r => r.json());
  cdp = new CdpClient(target.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Network.enable');
  cdp.on('Runtime.exceptionThrown', e => report.errors.push(e.exceptionDetails.text));
  cdp.on('Runtime.consoleAPICalled', e => { if (e.type === 'error') report.errors.push(e.args.map(a => a.value ?? a.description).join(' ')); });
  cdp.on('Network.requestWillBeSent', e => { if (/^https?:/.test(e.request.url) && !e.request.url.startsWith(origin)) report.externalRequests.push(e.request.url); });
  const evaluate = async expression => (await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
  for (const locale of ['en', 'zh'].filter(value => !process.env.TAX_LOCALE || process.env.TAX_LOCALE === value)) {
    for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844], ['narrow', 320, 700]]) {
      if (process.env.TAX_VIEW && process.env.TAX_VIEW !== name) continue;
      console.log('Checking', locale, name);
      await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
      await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
      await navigate(cdp, origin + (locale === 'zh' ? '/zh' : '') + '/tools/japan-tax.html');
      await waitFor(cdp, "document.querySelector('.tax-shell input') !== null", 10000);
      await evaluate('document.fonts.ready.then(() => true)');
      await delay(250);
      const facts = await evaluate(`({ overflow: document.documentElement.scrollWidth > innerWidth, robots: document.querySelector('meta[name="robots"]').content, background: getComputedStyle(document.querySelector('.tax-shell')).backgroundColor, lang: document.querySelector('.tax-shell').lang, inputs: document.querySelectorAll('.tax-shell input').length })`);
      const layout = await evaluate(`({ navbar: !!document.querySelector('.vp-navbar'), footer: !!document.querySelector('.vp-page-meta'), standalone: !!document.querySelector('.tax-header, .tax-shell footer'), maxWidth: getComputedStyle(document.querySelector('.vp-theme-container')).getPropertyValue('--content-width').trim(), width: document.querySelector('.tax-shell').getBoundingClientRect().width })`);
      assert.equal(layout.navbar, true); assert.equal(layout.footer, true); assert.equal(layout.standalone, false); assert.equal(layout.maxWidth, '1200px'); assert.ok(layout.width <= 1200);
      assert.equal(facts.overflow, false); assert.equal(facts.robots, 'noindex, nofollow'); assert.equal(facts.background, 'rgb(247, 244, 237)');
      const helpPositions = await evaluate(`Array.from(document.querySelectorAll('.field-heading, .help-heading')).filter(h => h.getBoundingClientRect().height && h.querySelector('.help-button')).map(h => { const t=h.firstElementChild.getBoundingClientRect(), b=h.querySelector('.help-button span').getBoundingClientRect(); return {title:h.firstElementChild.textContent.trim(), gap:b.left-t.right, orphan:b.top>=t.bottom}; })`);
      for (const position of helpPositions) { assert.equal(position.orphan, false, JSON.stringify(position)); assert.ok(position.gap>=0 && position.gap<=8, JSON.stringify(position)); }
      const rateHelpX = await evaluate("document.querySelector('#result-rate-help').previousElementSibling.getBoundingClientRect().x");
      if (name !== 'narrow') {
        const metrics = await cdp.send('Page.getLayoutMetrics');
        const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: metrics.cssContentSize.height, scale: 1 } });
        fs.writeFileSync(path.join(output, `${name}-${locale}.png`), Buffer.from(shot.data, 'base64'));
      }
      if (process.env.TAX_LAYOUT_ONLY === '1' || process.env.TAX_FULL_AUDIT === '1') {
        const flow = await evaluate(`['.inputs', '.results', '#furusato-limit', '.furusato-input', '.refund', '#monthly-details'].map(selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { selector, top: r.top, bottom: r.bottom }; })`);
        for (let n = 1; n < flow.length; n++) assert.ok(flow[n].top >= flow[n - 1].bottom, JSON.stringify(flow));
        await evaluate("document.querySelector('#tax-salary').value='10000000'; document.querySelector('#tax-salary').dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('#tax-total').value='1050000'; document.querySelector('#tax-total').dispatchEvent(new Event('input',{bubbles:true})); true");
        await waitFor(cdp, "document.querySelector('#result-tax').textContent.includes('974,000')", 3000);
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false);
        await evaluate("document.querySelector('#tax-resident-total').value='1000000'; document.querySelector('#tax-resident-total').dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('#tax-adjustment').value='2500'; document.querySelector('#tax-adjustment').dispatchEvent(new Event('input',{bubbles:true})); true");
        await waitFor(cdp, "document.querySelector('#resident-result-levy').textContent.includes('702,500')", 3000);
        assert.ok((await evaluate("document.querySelector('#result-tax').textContent")).includes('974,000'));
        assert.equal(await evaluate("document.querySelector('#furusato-limit-value').textContent.trim()"), '213,224 JPY');
        await evaluate("for(const [id,value] of [['tax-withheld','1000000'],['tax-furusato','100000']]) {const el=document.getElementById(id); el.value=value; el.dispatchEvent(new Event('input',{bubbles:true}));} document.querySelector('#filing-method').value='return'; document.querySelector('#filing-method').dispatchEvent(new Event('change',{bubbles:true})); true");
        await waitFor(cdp, "document.querySelector('#refund-value').textContent.trim() === '27,090 JPY'", 3000);
        assert.equal(await evaluate("document.querySelector('#final-resident-annual').textContent.trim()"),'632,500 JPY');
        assert.equal(await evaluate("document.querySelector('#final-resident-june').textContent.trim()"),'52,800 JPY');
        assert.equal(await evaluate("document.querySelector('#final-resident-monthly').textContent.trim()"),'52,700 JPY');
        assert.equal(await evaluate("document.querySelector('#furusato-limit-value').textContent.trim()"),'213,224 JPY');
        await evaluate("document.querySelector('#monthly-details').open=true; document.querySelectorAll('.settlement-details').forEach(el=>el.open=true); true");
        assert.equal(await evaluate("Array.from(document.querySelectorAll('.months tbody td')).reduce((sum,el)=>sum+Number(el.textContent.replaceAll(',','')),0)"),632500);
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'),false);
        if (name !== 'narrow') {
          const metrics = await cdp.send('Page.getLayoutMetrics');
          const shot = await cdp.send('Page.captureScreenshot', {format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height:metrics.cssContentSize.height,scale:1}});
          fs.writeFileSync(path.join(output, `settlement-${locale}-${name}.png`),Buffer.from(shot.data,'base64'));
        }
        await evaluate("document.querySelector('#filing-method').value='one-stop'; document.querySelector('#filing-method').dispatchEvent(new Event('change',{bubbles:true})); true");
        await waitFor(cdp, "document.querySelector('#refund-value').textContent.trim() === '0 JPY'", 3000);
        assert.equal(await evaluate("document.querySelector('#final-resident-annual').textContent.trim()"),'609,300 JPY');
        await evaluate("document.querySelector('#filing-method').value='return'; document.querySelector('#filing-method').dispatchEvent(new Event('change',{bubbles:true})); document.querySelector('#tax-withheld').value='0'; document.querySelector('#tax-withheld').dispatchEvent(new Event('input',{bubbles:true})); true");
        await waitFor(cdp, "document.querySelector('#refund-value').textContent.trim() === '972,900 JPY'", 3000);
        assert.equal(await evaluate("document.querySelector('#refund-title').textContent.trim()"),locale==='zh'?'预计补缴':'Estimated payment due');
        await evaluate("document.querySelector('#tax-furusato').value=''; document.querySelector('#tax-furusato').dispatchEvent(new Event('input',{bubbles:true})); true");
        await waitFor(cdp, "document.querySelector('#refund-value').textContent.includes('—') && document.querySelector('#final-resident-annual').textContent.includes('—')",3000);
        await evaluate("document.querySelector('#tax-adjustment').value=''; document.querySelector('#tax-adjustment').dispatchEvent(new Event('input',{bubbles:true})); true");
        await waitFor(cdp, "document.querySelector('#resident-result-levy').textContent.includes('—') && document.querySelector('#furusato-limit-value').textContent.includes('—')", 3000);
        await evaluate("document.querySelector('input[value=items]').click(); true");
        await waitFor(cdp, "!!document.querySelector('#deduction-select')", 3000);
        await evaluate("document.querySelector('#deduction-select').value='basic'; document.querySelector('#deduction-select').dispatchEvent(new Event('change',{bubbles:true})); true");
        await evaluate("document.querySelector('#add-deduction').click(); true");
        await waitFor(cdp, "!!document.querySelector('#tax-resident-basic')", 3000);
        await evaluate("for (const [id,value] of [['tax-basic','1050000'],['tax-resident-basic','1000000'],['tax-adjustment','2500']]) {const el=document.getElementById(id);el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));} true");
        await waitFor(cdp, "document.querySelector('#resident-result-levy').textContent.includes('702,500') && document.querySelector('#result-tax').textContent.includes('974,000')", 3000);
        await evaluate("document.querySelector('input[value=total]').click(); true");
        await waitFor(cdp, "document.querySelector('#tax-resident-total')?.value === '1,000,000'", 3000);
        await evaluate("document.querySelector('#clear-inputs').click(); true");
        await waitFor(cdp, "document.querySelector('#tax-adjustment').value === '' && document.querySelector('#resident-result-levy').textContent.includes('—')", 3000);
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false);
        report.views.push({locale, name, width, height, ...facts, flow, verticalOrder:'passed', liveCalculation:'passed', residentInputs:'passed', settlement:'passed'});
        if (process.env.TAX_FULL_AUDIT !== '1') continue;
      }
      console.log('Checking new credits');
      await evaluate("for(const [id,value] of [['tax-salary','10000000'],['tax-total','1000000'],['tax-resident-total','1000000'],['tax-adjustment','2500'],['tax-withheld','100000'],['tax-furusato','0']]) {const el=document.getElementById(id);el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));} document.querySelector('#income-adjustment').click(); true");
      await waitFor(cdp,"document.querySelector('#result-income').textContent.includes('7,900,000') && document.querySelector('#result-incomeAdjustmentAmount').textContent.includes('150,000')",3000);
      assert.equal(await evaluate("document.querySelector('#resident-result-taxable').textContent.trim()"),'6,900,000 JPY');
      await evaluate("document.querySelector('#tax-salary').value='5000000';document.querySelector('#tax-salary').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#housing-enabled').click();true");
      await waitFor(cdp,"!!document.querySelector('#tax-housing-amount') && document.querySelector('#result-tax').textContent.includes('—')",3000);
      await evaluate("document.querySelector('#tax-housing-amount').value='400000';document.querySelector('#tax-housing-amount').dispatchEvent(new Event('input',{bubbles:true}));for(const [id,value] of [['housing-income-limit','20000000'],['housing-resident-band','standard'],['housing-stage','continuing'],['filing-method','return']]) {const el=document.getElementById(id);el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));}document.querySelector('#housing-eligible').click();true");
      await waitFor(cdp,"document.querySelector('#refund-value').textContent.trim() === '100,000 JPY'",3000);
      assert.equal(await evaluate("document.querySelector('#result-tax').textContent.trim()"),'0 JPY');
      assert.equal(await evaluate("document.querySelector('#result-housingUsed').textContent.trim()"),'158,500 JPY');
      assert.equal(await evaluate("document.querySelector('#final-resident-annual').textContent.trim()"),'161,000 JPY');
      await evaluate("document.querySelectorAll('.settlement-details').forEach(el=>el.open=true); true");
      assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'),false);
      if(name==='mobile') {
        await evaluate("document.querySelector('.housing-input').scrollIntoView({block:'start',behavior:'instant'});true");
        const shot=await cdp.send('Page.captureScreenshot',{format:'png'});
        fs.writeFileSync(path.join(output,`credits-${locale}.png`),Buffer.from(shot.data,'base64'));
        await evaluate("scrollTo({top:0,behavior:'instant'});true");
        await delay(100);
        const groupClip=await evaluate("(() => {const r=document.querySelector('.deduction-group').getBoundingClientRect();return {x:0,y:r.top+scrollY,width:innerWidth,height:r.height,scale:1};})()");
        const groupShot=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:groupClip});
        fs.writeFileSync(path.join(output,`deduction-group-${locale}.png`),Buffer.from(groupShot.data,'base64'));

      }
      await cdp.send('Page.bringToFront');
      for (const helpId of ['income-adjustment-help','housing-amount-help','housing-regime-help']) {
        await evaluate(`document.querySelector('[aria-controls="${helpId}"]').focus(); true`);
        await waitFor(cdp,`document.querySelector('[aria-controls="${helpId}"]').getAttribute('aria-expanded') === 'true'`,3000);
        const bounds=await evaluate(`(()=>{const r=document.getElementById('${helpId}').getBoundingClientRect();return {left:r.left,right:r.right,height:r.height};})()`);
        assert.ok(bounds.left>=0 && bounds.right<=width && bounds.height<=height*.7+1,JSON.stringify(bounds));
        await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
      }
      await evaluate("document.querySelector('#housing-stage').value='first';document.querySelector('#housing-stage').dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#filing-method').value='one-stop';document.querySelector('#filing-method').dispatchEvent(new Event('change',{bubbles:true}));true");
      await waitFor(cdp,"document.querySelector('#refund-value').textContent.includes('—')",3000);
      await evaluate("document.querySelector('#filing-method').value='return';document.querySelector('#filing-method').dispatchEvent(new Event('change',{bubbles:true}));true");
      await waitFor(cdp,"document.querySelector('#refund-value').textContent.includes('100,000')",3000);
      await evaluate("document.querySelector('#tax-housing-amount').value='';document.querySelector('#tax-housing-amount').dispatchEvent(new Event('input',{bubbles:true}));true");
      await waitFor(cdp,"document.querySelector('#refund-value').textContent.includes('—') && document.querySelector('#final-resident-annual').textContent.includes('—')",3000);
      await evaluate("document.querySelector('#housing-enabled').click();true");
      await waitFor(cdp,"document.querySelector('#result-tax').textContent.includes('158,500')",3000);
      await evaluate("document.querySelector('#clear-inputs').click();true");
      assert.ok(await evaluate("!document.querySelector('#income-adjustment').checked && !document.querySelector('#housing-enabled').checked && !document.querySelector('#tax-housing-amount')"));
      await evaluate("document.querySelector('#tax-withheld').value='12345678901234567'; document.querySelector('#tax-withheld').dispatchEvent(new Event('input',{bubbles:true})); true");
      await waitFor(cdp, "document.querySelector('#tax-withheld').getAttribute('aria-invalid') === 'true' && !!document.querySelector('#withheld-error')",3000);
      await evaluate(`document.querySelector('#tax-salary').value = '-1'; document.querySelector('#tax-salary').dispatchEvent(new Event('input', { bubbles: true }))`);
      await waitFor(cdp, "document.querySelector('#salary-error') !== null", 3000);
      await evaluate(`document.querySelector('#clear-inputs').click()`);
      await waitFor(cdp, "document.querySelector('#tax-salary').value === '' && !document.querySelector('#salary-error')", 3000);
      await evaluate(`document.querySelector('#tax-salary').value = '5000000'; document.querySelector('#tax-salary').dispatchEvent(new Event('input', { bubbles: true }))`);
      console.log('Itemized mode');
      assert.equal(await evaluate("document.querySelector('#tax-salary').value"), '5,000,000');
      await cdp.send('Page.bringToFront');
      await delay(100); // Allow Vue to apply input-dependent layout before locating the pointer target.
      await evaluate("document.querySelector('.help-button').scrollIntoView({ block: 'center', behavior: 'instant' }); true");
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1 });
      const boxes = await evaluate(`(() => { const b = document.querySelector('.help-button').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()`);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: boxes.x, y: boxes.y });
      await waitFor(cdp, "document.querySelector('.help-button').getAttribute('aria-expanded') === 'true'", 3000);
      const popup = await evaluate(`(() => { const r = document.querySelector('#salary-help').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width }; })()`);
      // A slow diagonal path intentionally outside the button and above the panel.
      for (let step = 1; step <= 8; step++) {
        await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: boxes.x + (popup.x + 20 - boxes.x) * step / 8, y: boxes.y + (popup.y + 25 - boxes.y) * step / 8 });
        await delay(80);
        assert.equal(await evaluate("document.querySelector('.help-button').getAttribute('aria-expanded')"), 'true');
      }
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1 });
      await waitFor(cdp, "document.querySelector('.help-button').getAttribute('aria-expanded') === 'false'", 3000);
      await evaluate("document.querySelector('.help-button').focus()");
      await waitFor(cdp, "document.querySelector('.help-button').getAttribute('aria-expanded') === 'true'", 3000);
      assert.equal(await evaluate("document.querySelector('#salary-help a').href.includes('2-2-3.htm')"), true);
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await waitFor(cdp, "document.querySelector('.help-button').getAttribute('aria-expanded') === 'false'", 3000);
      await evaluate("document.querySelector('.help-button').click()");
      await waitFor(cdp, "document.querySelector('.help-button').getAttribute('aria-expanded') === 'true'", 3000);
      assert.equal(await evaluate("document.documentElement.scrollWidth > innerWidth"), false);
      if (name === 'mobile') {
        await evaluate("scrollTo({ top: Math.max(0, document.querySelector('#tax-salary').getBoundingClientRect().top + scrollY - 170), behavior: 'instant' }); true");
        const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(output, `help-${locale}.png`), Buffer.from(shot.data, 'base64'));
      }
      await evaluate("document.querySelector('.help-button').click()");
      console.log('Checking help popovers');
      for (const helpId of ['result-rate-help', 'resident-scope-help', 'filing-method-help', 'refund-help', 'monthly-help']) {
        await evaluate(`document.querySelector('[aria-controls="${helpId}"]').focus(); true`);
        await waitFor(cdp, `document.querySelector('[aria-controls="${helpId}"]').getAttribute('aria-expanded') === 'true'`, 3000);
        const bounds = await evaluate(`(() => {const r=document.getElementById('${helpId}').getBoundingClientRect(); return {left:r.left,right:r.right,width:r.width};})()`);
        assert.ok(bounds.left >= 0 && bounds.right <= width && bounds.width > 200, `${helpId}: ${JSON.stringify(bounds)}`);
        await evaluate(`document.querySelector('#${helpId} a').focus(); true`);
        assert.equal(await evaluate(`document.querySelector('[aria-controls="${helpId}"]').getAttribute('aria-expanded')`), 'true');
        await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
        await waitFor(cdp, `document.querySelector('[aria-controls="${helpId}"]').getAttribute('aria-expanded') === 'false'`, 3000);
      }
      await evaluate("document.querySelectorAll('.sources details').forEach(el => el.open=true); true");
      assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false);
      assert.equal(await evaluate("document.querySelectorAll('.source-grid a').length"), 21);
      await evaluate("document.querySelectorAll('.sources details').forEach(el => el.open=false); true");
      await evaluate("document.querySelector('#tax-salary').focus(); document.querySelector('#tax-salary').setSelectionRange(2, 2)");
      await cdp.send('Input.insertText', { text: '9' });
      await waitFor(cdp, "document.querySelector('#tax-salary').value === '59,000,000'", 3000);
      assert.equal(await evaluate("document.querySelector('#tax-salary').selectionStart"), 2);
      await evaluate("document.querySelector('#tax-salary').value = '5,000,000'; document.querySelector('#tax-salary').dispatchEvent(new Event('input', { bubbles: true }))");

      await evaluate("document.querySelector('input[value=items]').click()");
      await waitFor(cdp, "document.querySelector('#deduction-select') !== null", 3000);
      await evaluate("document.querySelector('#deduction-select').value = 'life'; document.querySelector('#deduction-select').dispatchEvent(new Event('change', { bubbles: true }))");
      await delay(100);
      await evaluate("document.querySelector('#add-deduction').click()");
      await waitFor(cdp, "document.activeElement.id === 'tax-life'", 3000);
      await evaluate("document.querySelector('#tax-life').value = '40000'; document.querySelector('#tax-life').dispatchEvent(new Event('input', { bubbles: true }))");
      await evaluate("document.querySelector('input[value=total]').click()");
      await waitFor(cdp, "document.querySelector('#tax-total') !== null", 3000);
      console.log('Itemized mode');
      await evaluate("document.querySelector('input[value=items]').click()");
      await waitFor(cdp, "document.querySelector('#tax-life')?.value === '40,000'", 3000);
      assert.equal(await evaluate("document.querySelector('#tax-total') === null"), true);
      assert.equal(await evaluate("document.querySelector('#furusato-basis') === null"), true);
      assert.ok(await evaluate("document.querySelector('#furusato-help').textContent.includes('2025')"));
      await evaluate("document.querySelector('.slip-guide').open = true; document.querySelector('#monthly-details').open = true");
      assert.equal(await evaluate("document.querySelectorAll('.months tbody tr').length"), 12);
      assert.equal(await evaluate("document.documentElement.scrollWidth > innerWidth"), false);
      if (name === 'mobile') {
        await evaluate("document.activeElement.blur(); scrollTo({ top: 0, behavior: 'instant' }); true");
        const metrics = await cdp.send('Page.getLayoutMetrics');
        const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: metrics.cssContentSize.height, scale: 1 } });
        fs.writeFileSync(path.join(output, `itemized-${locale}.png`), Buffer.from(shot.data, 'base64'));
      }
      for (const fieldId of ['social', 'pension', 'dependants']) {
        await evaluate(`document.querySelector('#deduction-select').value='${fieldId}'; document.querySelector('#deduction-select').dispatchEvent(new Event('change',{bubbles:true})); true`);
        await evaluate("document.querySelector('#add-deduction').click(); true");
        await waitFor(cdp, `!!document.querySelector('#tax-${fieldId}')`, 3000);
        await evaluate(`document.querySelector('[aria-controls="${fieldId}-help"]').focus(); true`);
        await waitFor(cdp, `document.querySelector('[aria-controls="${fieldId}-help"]').getAttribute('aria-expanded') === 'true'`, 3000);
        const fieldPopup = await evaluate(`(() => { const r=document.getElementById('${fieldId}-help').getBoundingClientRect();return {left:r.left,right:r.right,height:r.height}; })()`);
        assert.ok(fieldPopup.left >= 0 && fieldPopup.right <= width && fieldPopup.height <= height * .7 + 1, JSON.stringify(fieldPopup));
        assert.ok(await evaluate(`document.querySelectorAll('#${fieldId}-help a').length >= 2`));
        await evaluate(`document.querySelector('#tax-${fieldId}').closest('.deduction-item').querySelector('.remove').click(); true`);
        await waitFor(cdp, `!document.querySelector('#tax-${fieldId}')`, 3000);
      }
      const catalogueText = await evaluate("Array.from(document.querySelectorAll('#deduction-select option')).map(option => option.textContent).join(' ')");
      for (const required of ['社会保険料控除', 'DC', '扶養控除']) assert.ok(catalogueText.includes(required), required);
      assert.ok(await evaluate("document.querySelector('#tax-life').closest('.money-field').textContent.includes('生命保険料控除')"));
      assert.ok(await evaluate("document.querySelector('.preview-note').textContent.includes('2026-09-06') && !document.querySelector('.preview-note').textContent.includes('2025')"));
      await evaluate("document.querySelector('.deduction-scope').open = true; true");
      assert.equal(await evaluate("document.querySelectorAll('.deduction-scope a').length"), 1);
      assert.equal(await evaluate("document.documentElement.scrollWidth > innerWidth"), false);
      await evaluate("document.querySelector('#deduction-select').value='donation'; document.querySelector('#deduction-select').dispatchEvent(new Event('change',{bubbles:true})); true");
      await evaluate("document.querySelector('#add-deduction').click(); true");
      await waitFor(cdp,"!!document.querySelector('#tax-donation')",3000);
      assert.equal(await evaluate("!!document.querySelector('#tax-resident-donation')"),false);
      await evaluate("document.querySelector('#tax-donation').value='10000'; document.querySelector('#tax-donation').dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('#tax-furusato').value='10000'; document.querySelector('#tax-furusato').dispatchEvent(new Event('input',{bubbles:true})); true");
      await waitFor(cdp,"document.querySelector('#furusato-limit-value').textContent.includes('—') && document.querySelector('#refund-value').textContent.includes('—')",3000);
      await evaluate("document.querySelector('#tax-donation').closest('.deduction-item').querySelector('.remove').click(); true");
      await evaluate("document.querySelector('.remove').click()");
      await waitFor(cdp, "!document.querySelector('#tax-life') && document.activeElement.id === 'deduction-select'", 3000);
      await evaluate("document.querySelector('#clear-inputs').click()");
      await waitFor(cdp, "document.querySelector('#tax-furusato').value === '' && document.querySelector('input[value=total]').checked", 3000);
      await evaluate("document.querySelector('#tax-salary').value = '5000000'; document.querySelector('#tax-salary').dispatchEvent(new Event('input', { bubbles: true }))");
      await cdp.send('Page.reload'); await delay(400);
      assert.equal(await evaluate("document.querySelector('#tax-salary').value"), '');
      await cdp.send('Page.bringToFront');
      await evaluate("document.querySelector('summary').focus()");
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
      await waitFor(cdp, "document.querySelector('details').open", 3000);
      const expectedLanguagePath = locale === 'zh' ? '/tools/japan-tax.html' : '/zh/tools/japan-tax.html';
      const languagePath = await evaluate(`document.querySelector('.vp-navbar a[href="${expectedLanguagePath}"], .vp-sidebar a[href="${expectedLanguagePath}"]').getAttribute('href')`);
      assert.equal(languagePath, locale === 'zh' ? '/tools/japan-tax.html' : '/zh/tools/japan-tax.html');
      assert.equal((await fetch(origin + languagePath)).status, 200);
      const setMoney = async (id, value) => {
        await evaluate(`document.getElementById('${id}').value = '${value}'; document.getElementById('${id}').dispatchEvent(new Event('input', { bubbles: true })); true`);
      };
      await setMoney('tax-salary', '10000000'); await setMoney('tax-total', '1050000');
      await waitFor(cdp, "document.querySelector('#result-tax').textContent.includes('974,000')", 3000);
      const results = await evaluate("Object.fromEntries(['income','taxable','rate','tax','reconstruction'].map(id => [id, document.getElementById('result-'+id).textContent.trim()]))");
      assert.deepEqual(results, { income:'8,050,000 JPY', taxable:'7,000,000 JPY', rate:'23 %', tax:'974,000 JPY', reconstruction:'20,454 JPY' });
      assert.equal(await evaluate("document.querySelector('#result-rate-help').previousElementSibling.getBoundingClientRect().x"), rateHelpX, 'Result digits must not move the help icon');
      assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false);
      await setMoney('tax-total', '1050001');
      await waitFor(cdp, "document.querySelector('#result-taxable').textContent.includes('6,999,000')", 3000);
      await setMoney('tax-total', '');
      await waitFor(cdp, "document.querySelector('#result-tax').textContent.includes('—')", 3000);
      await setMoney('tax-total', '1050000');
      await evaluate("document.querySelector('input[value=items]').click(); true");
      await waitFor(cdp, "document.querySelector('#deduction-select') !== null", 3000);
      assert.ok((await evaluate("document.querySelector('#result-tax').textContent")).includes('—'));
      await evaluate("document.querySelector('#deduction-select').value = 'basic'; document.querySelector('#deduction-select').dispatchEvent(new Event('change', { bubbles: true })); true");
      await evaluate("document.querySelector('#add-deduction').click(); true");
      await waitFor(cdp, "document.querySelector('#tax-basic') !== null", 3000);
      await setMoney('tax-basic', '1050000');
      await waitFor(cdp, "document.querySelector('#result-tax').textContent.includes('974,000')", 3000);
      await setMoney('tax-salary', '-1');
      await waitFor(cdp, "document.querySelector('#result-income').textContent.includes('—') && document.querySelector('#result-tax').textContent.includes('—')", 3000);
      await evaluate("document.querySelector('#clear-inputs').click(); true");
      report.views.push({ liveCalculation: 'passed', themeLayout: layout, groupedAmount: 'passed', safePolygonTraversal: 'passed', pointerLeaveCloses: 'passed', questionHelp: 'passed', itemizedAddRemove: 'passed', modeDraftPreserved: 'passed', donationInput: 'passed', monthlyRows: 12, expandedOverflow: false, keyboardDetails: 'passed', languageTarget: 'passed', locale, name, width, height, ...facts, inputValidation: 'passed', clear: 'passed', reloadClears: 'passed' });
    }
  }
  assert.deepEqual(report.errors, []); assert.deepEqual(report.externalRequests, []);
  fs.writeFileSync(path.join(output, 'browser-results.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  cdp?.close(); await stopBrowser(browser); server.close(); fs.closeSync(fd); removeBrowserProfile(profile);
}
