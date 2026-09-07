// Run against a built local preview. Uses an external Playwright installation, no repo dependency changes.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE));
const origin = process.env.PREVIEW_ORIGIN || 'http://127.0.0.1:4387';
const out = new URL('../.ai/artifacts/stock-screener/', import.meta.url);
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
try {
 for (const locale of ['en', 'zh']) {
  const route = `${locale === 'zh' ? '/zh' : ''}/tools/stock-screener.html`;
  const page = await browser.newPage();
  const errors = [], external = [], badResponses = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('request', req => { if (!req.url().startsWith(origin)) external.push(req.url()); });
  page.on('response', res => { if (res.status() >= 400) badResponses.push(res.url()); });
  for (const [name, width, height] of [['desktop',1440,900],['mobile',390,844],['narrow',320,844],['tablet',768,1024],['compact',1280,720]]) {
   await page.setViewportSize({width,height});
   await page.goto(origin + route, {waitUntil:'networkidle'});
   await page.evaluate(() => document.fonts.ready);
   assert.equal(await page.locator('h1').count(), 1);
   assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex, nofollow');
   assert.equal(await page.locator('.stock-shell button, .stock-shell form').count(), 0);
   assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${locale}/${width} overflow`);
   if (name === 'desktop' || name === 'mobile') await page.screenshot({path: new URL(`${name}-${locale}.png`,out).pathname, fullPage:true});
   results.push({locale,width,height,overflow:false});
  }
  await page.goto(origin+route, {waitUntil:'networkidle'});
  const focusOrder=[];
  for (let i=0;i<4;i++) { await page.keyboard.press('Tab'); focusOrder.push(await page.evaluate(() => document.activeElement.id || [...document.activeElement.classList].sort().join(" "))); }
  assert.deepEqual(focusOrder,['skip-link','brand'+(locale==='zh'?' chinese':''),'language','stock-intent']);
  assert.equal(await page.locator('#stock-intent').evaluate(el => getComputedStyle(el).outlineStyle),'solid');
  assert.ok(await page.locator('#stock-intent').getAttribute('aria-describedby'));
  const requests=[]; const listener=req=>requests.push(req.url()); page.on('request',listener);
  const empty = await page.locator('.empty-state').innerText();
  const criteria = await page.locator('.criteria-placeholder').innerText();
  await page.keyboard.insertText('本地筛选意图 Local idea');
  await page.keyboard.press('Enter');
  assert.match(await page.locator('#stock-intent').inputValue(),/Local idea/);
  assert.equal(await page.locator('.empty-state').innerText(),empty);
  assert.equal(await page.locator('.criteria-placeholder').innerText(),criteria);
  assert.equal(requests.length,0);
  page.off('request',listener);
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Enter');
  await page.waitForURL(origin + (locale==='zh'?'':'/zh') + '/tools/stock-screener.html');
  assert.equal(await page.locator('#stock-intent').inputValue(),'');
  await page.goto(origin+route, {waitUntil:'networkidle'});
  await page.keyboard.press('Tab'); await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'stock-content');
  await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
  assert.equal(await page.locator('.stock-shell').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(247, 244, 237)');
  assert.equal(await page.locator('#stock-intent').evaluate(el=>getComputedStyle(el).color),'rgb(32, 35, 31)');
  await page.evaluate(()=>document.documentElement.style.fontSize='32px');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]); assert.deepEqual(external,[]); assert.deepEqual(badResponses,[]);
  results.push({locale,keyboard:focusOrder,inputRequests:requests.length,languageSwitch:true,skipLink:true,darkPreference:true,rootFont200Percent:true,errors,external,badResponses});
  await page.close();
 }
 const nojs=await browser.newPage({javaScriptEnabled:false});
 await nojs.goto(origin+'/tools/stock-screener.html');
 assert.equal(await nojs.locator('h1').innerText(),'AI stock screener');
 assert.match(await nojs.locator('.notice').innerText(),/not implemented/);
 results.push({serverRenderedContent:true});
 await writeFile(new URL('browser-results.json',out),JSON.stringify(results,null,2)+'\n');
 console.log(JSON.stringify(results,null,2));
} finally {await browser.close();}
