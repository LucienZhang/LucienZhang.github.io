// Production bundle with browser-intercepted Cognito/API fixtures. No real login or inference.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { CdpClient, findChrome, readDebugPort, stopBrowser, removeBrowserProfile, navigate, waitFor, delay } from './check-homepage.mjs';
const root = process.cwd(), dist = path.join(root, 'docs/.vuepress/dist');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-browser-'));
const chromeLog = path.join(profile, 'chrome.log');
const fd = fs.openSync(chromeLog, 'w');
const browser = spawn(findChrome(), ['--headless=new', '--no-sandbox', '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', fd] });
fs.closeSync(fd);
let cdp, scenario = 'success', apiCalls = 0, tokenCalls = 0, logoutCalls = 0;
const errors = [], external = [];
try {
  const port = await readDebugPort(profile, browser, chromeLog);
  const target = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {method:'PUT'}).then(r=>r.json());
  cdp = new CdpClient(target.webSocketDebuggerUrl); await cdp.open();
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable');
  cdp.on('Runtime.exceptionThrown', e => errors.push(e.exceptionDetails.text));
  await cdp.send('Fetch.enable', {patterns:[{urlPattern:'*'}]});
  const fulfill = (id, body, type = 'text/html', status = 200, headers = []) => cdp.send('Fetch.fulfillRequest', {requestId:id,responseCode:status,responseHeaders:[{name:'Content-Type',value:type}, ...headers],body:Buffer.from(body).toString('base64')});
  const cors = [{name:'Access-Control-Allow-Origin',value:'https://ziliang.red'},{name:'Access-Control-Allow-Headers',value:'authorization,content-type'},{name:'Access-Control-Allow-Methods',value:'POST,OPTIONS'}];
  cdp.on('Fetch.requestPaused', async ({requestId, request}) => {
    try {
      const url = new URL(request.url);
      if (url.pathname === '/oauth2/authorize') {
        assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
        assert.equal(url.searchParams.get('redirect_uri'), 'https://ziliang.red/callback');
        const callback = new URL(url.searchParams.get('redirect_uri'));
        callback.search = new URLSearchParams({code:'synthetic-code',state:url.searchParams.get('state')});
        await fulfill(requestId,'','text/html',302,[{name:'Location',value:callback.href}]);
      } else if (url.pathname === '/oauth2/token') {
        tokenCalls++;
        const form = new URLSearchParams(request.postData);
        assert.equal(form.get('redirect_uri'),'https://ziliang.red/callback');
        assert.match(form.get('code_verifier'),/^[A-Za-z0-9_-]{43}$/);
        await fulfill(requestId,JSON.stringify({token_type:'Bearer',access_token:'synthetic-access',expires_in:900}),'application/json',200,cors);
      } else if (url.pathname.endsWith('/v1/loan-explanations')) {
        assert.equal(url.href, 'https://api.ziliang.ninja/v1/loan-explanations');
        if (request.method === 'OPTIONS') { await fulfill(requestId,'','text/plain',204,cors); return; }
        apiCalls++;
        assert.equal(request.headers.Authorization ?? request.headers.authorization, 'Bearer synthetic-access');
        const body = JSON.parse(request.postData);
        assert.equal(body.apiVersion,'2'); assert.equal(body.input.currency,'JPY');
        assert.deepEqual(Object.keys(body).sort(),['apiVersion','input','intent','locale']);
        if (scenario === 'pending') return; // Browser cancellation must stop waiting without a reply.
        const status = {auth:401,quota:429,failure:503}[scenario] ?? 200;
        const answer = body.locale === 'zh-CN' ? '浏览器夹具解释。<script>不应执行</script>' : 'Browser fixture explanation. <script>must remain plain text</script>';
        await fulfill(requestId,JSON.stringify(status === 200 ? {apiVersion:'2',explanation:answer,quota:{limit:20,remaining:19}} : {error:{code:'fixture'}}),'application/json',status,cors);
      } else if (url.hostname.includes('amazoncognito.com') && url.pathname === '/logout') {
        logoutCalls++;
        assert.equal(url.searchParams.get('logout_uri'),'https://ziliang.red/logout');
        await fulfill(requestId,'','text/html',302,[{name:'Location',value:url.searchParams.get('logout_uri')}]);
      } else if (url.origin === 'https://ziliang.red') {
        let file = path.resolve(dist, '.' + decodeURIComponent(url.pathname));
        if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
          if (!url.pathname.endsWith('/')) {
            await fulfill(requestId,'','text/html',301,[{name:'Location',value:url.pathname+'/'+url.search}]); return;
          }
          file = path.join(file, 'index.html');
        }
        if (!file.startsWith(dist + '/') || !fs.existsSync(file)) { await fulfill(requestId,'Not found','text/plain',404); return; }
        const type = {'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'}[path.extname(file)] ?? 'application/octet-stream';
        await fulfill(requestId,fs.readFileSync(file),type);
      } else {
        external.push(url.origin); await cdp.send('Fetch.failRequest',{requestId,errorReason:'BlockedByClient'});
      }
    } catch (error) { errors.push(error.message); await cdp.send('Fetch.failRequest',{requestId,errorReason:'Failed'}).catch(()=>{}); }
  });
  const evaluate = async expression => {
    const r = await cdp.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };
  const click = async selector => { await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); await delay(80); };
  const wait = expression => waitFor(cdp,expression,10000);
  const status = value => wait(`document.querySelector('[data-ai-status]')?.dataset.aiStatus === '${value}'`);
  for (const [locale, home] of [['en-US','/'],['zh-CN','/zh/']]) {
    await navigate(cdp, 'https://ziliang.red'+home);
    await wait("document.querySelector('.explain-action') && !document.querySelector('.explain-action').disabled");
    await click('.explain-action');
    assert.equal(await evaluate("document.querySelector('.questions button').disabled"),true);
    assert.equal(await evaluate("document.querySelector('.ai-login').disabled"),false,'API config is required for this fixture test');
    await evaluate("(() => {const input=document.querySelector('#loan-years');input.value=20;input.dispatchEvent(new Event('input',{bubbles:true}));})()");
    const before = apiCalls;
    await click('.ai-login');
    await wait("document.querySelector('.ai-logout') && !document.querySelector('.questions button').disabled");
    assert.equal(apiCalls,before,'Sign-in must not spend quota');
    assert.equal(await evaluate('location.pathname'),home);
    assert.equal(await evaluate("Number(document.querySelector('#loan-years').value)"),20,'Loan parameters survive sign-in');
    assert.equal(await evaluate("location.search.includes('code=')"),false);
    assert.equal(await evaluate("Object.keys(sessionStorage).some(k => sessionStorage.getItem(k).includes('synthetic-access'))"),false);
    scenario='success'; await click('.questions button'); await status('complete');
    assert.equal(await evaluate("document.querySelector('.quota').textContent.includes('19 / 20')"),true);
    assert.equal(await evaluate("document.querySelector('.ai-answer script')"),null);
    await evaluate("(() => {const input=document.querySelector('#loan-rate');input.value=3;input.dispatchEvent(new Event('input',{bubbles:true}));})()");
    assert.ok(await evaluate("document.querySelector('.explanation .notice')"));
    for (const width of [320,390,1440]) {
      await cdp.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false}); await delay(150);
      assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'),`Overflow ${locale} ${width}`);
    }
    for (const [setting, expected] of [['quota','limited'],['failure','failed']]) { scenario=setting; await click('.questions button'); await status(expected); }
    scenario='pending'; await click('.questions button'); await status('waiting');
    await click('.explanation > button'); await status('cancelled');
    scenario='auth'; await click('.questions button'); await status('expired');
    assert.ok(await evaluate("document.querySelector('.questions button').disabled"));
    await click('.ai-login'); await wait("document.querySelector('.ai-logout') && !document.querySelector('.questions button').disabled");
    scenario='success'; await click('.ai-logout');
    await wait("document.querySelector('.explain-action') && !document.querySelector('.explain-action').disabled");
    await click('.explain-action'); assert.ok(await evaluate("document.querySelector('.questions button').disabled"));
  }
  await navigate(cdp,'https://ziliang.red/callback/?code=forged&state=wrong');
  await wait("document.querySelector('.auth-page h1')?.textContent.includes('incomplete')");
  assert.equal(await evaluate('location.search'),'');
  assert.equal(tokenCalls,4); assert.equal(logoutCalls,2);
  assert.deepEqual(errors,[]); assert.deepEqual(external,[]);
  console.log('AI browser fixtures passed: PKCE round trip, parameter return, no automatic inference, plain text, quota, errors, cancel, sign-out, invalid callback and bilingual responsive layout. No real AWS requests.');
} finally {
  cdp?.close(); await stopBrowser(browser); removeBrowserProfile(profile);
}
