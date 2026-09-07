// Use an existing Playwright installation; no project dependency is required.
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE));
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const root=path.resolve('docs/.vuepress/dist');
const server=http.createServer((req,res)=>{let name=new URL(req.url,'http://localhost').pathname;if(name.endsWith('/'))name+='index.html';const file=path.join(root,name);try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chrome',headless:true});
const routes=['/','/zh/','/tools/mortgage.html','/zh/tools/japan-tax.html','/tools/stock-screener.html','/zh/tools/stock-screener.html','/programming/algorithms/tree-misc.html','/programming/algorithms/k-center.html','/zh/ml/overview.html','/zh/projects/werewolf.html'];
try {for(const route of routes) for(const width of [1440,768,390,320]) {
 const page=await browser.newPage({viewport:{width,height:900}});page.setDefaultTimeout(10000);
 await page.goto(`http://127.0.0.1:${server.address().port}${route}`,{waitUntil:'networkidle'});
 await page.evaluate(()=>document.fonts.ready);
 const zh=route.startsWith('/zh/');
 assert.equal(await page.locator('.vp-navbar').count(),1);
 assert.equal(await page.locator('.vp-navbar .language').count(),1);
 const header=await page.locator('.vp-navbar').boundingBox();assert.equal(header.height,64);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+' overflow');
 assert(await page.locator('.vp-site-name').isVisible());
 const article=route.includes('/programming/')||route.includes('/ml/')||route.includes('/projects/');
 if(width<720) {
  const toggle=page.locator('.vp-toggle-sidebar-button');await toggle.focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelector('.vp-theme-container').classList.contains('sidebar-open'));
  assert.equal(await toggle.getAttribute('aria-expanded'),'true');
  const sidebar=page.locator('.vp-sidebar');assert(await sidebar.isVisible());
  await toggle.focus();await page.keyboard.press('Shift+Tab');assert(await sidebar.evaluate(el=>el.contains(document.activeElement)));await page.keyboard.press('Tab');assert(await toggle.evaluate(el=>el===document.activeElement));
  assert.equal(await sidebar.locator('.directory-title').count(),article?1:0);
  assert.equal(await sidebar.locator('.site-nav-title').innerText(),zh?'全站导航':'Site navigation');
  assert.deepEqual(await sidebar.locator('.vp-navbar-item').evaluateAll(els=>els.map(el=>el.querySelector('button,a').textContent.trim())),zh?['工具','笔记','工程','联系']:['Tools','Notes','Engineering','Contact']);
  if(article) assert(await sidebar.locator('.vp-sidebar-items .route-link-active').count()>0,route+' active directory');
  if(article&&width===320&&process.env.NAV_CAPTURE==='1')await page.screenshot({path:'.ai/artifacts/homepage/nav-directory-'+(zh?'zh':'en')+'.png',animations:'disabled'});
  await sidebar.getByRole('button',{name:zh?'工具':'Tools',exact:true}).click();
  const tax=sidebar.getByRole('link',{name:zh?'日本税务计算器':'Japan tax calculator',exact:true});await tax.waitFor({state:'visible'});await tax.focus();await page.keyboard.press('Escape');
  assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert(await toggle.evaluate(el=>el===document.activeElement));
  assert(await sidebar.evaluate(el=>el.inert));
  for(let i=0;i<12;i++){await page.keyboard.press('Tab');assert(!await page.evaluate(()=>document.activeElement.closest('.vp-sidebar')),route+' hidden sidebar focus');}
 } else {
  assert.deepEqual(await page.locator('.vp-navbar .vp-navbar-item').evaluateAll(els=>els.map(el=>el.querySelector('button,a').textContent.trim())),zh?['工具','笔记','工程','联系']:['Tools','Notes','Engineering','Contact']);
  assert.equal(await page.locator('.vp-sidebar').isVisible(),article);
  if(article)assert(await page.locator('.vp-sidebar-items a.route-link-active').first().evaluate(el=>{const a=el.getBoundingClientRect(),s=el.closest('.vp-sidebar').getBoundingClientRect();return a.top>=s.top&&a.bottom<=s.bottom;}),route+' active article outside sidebar viewport');
 }
 if(process.env.NAV_CAPTURE==='1'&&(width===320||width===1440))await page.screenshot({path:'.ai/artifacts/homepage/nav-'+route.replaceAll('/','_')+'-'+width+'.png',animations:'disabled'});
 console.log('PASS',route,width);await page.close();
}
 for(const prefix of ['', '/zh']) {
  const page=await browser.newPage({viewport:{width:390,height:900}});
  const origin=`http://127.0.0.1:${server.address().port}`;
  await page.goto(origin+prefix+'/ml/overview.html',{waitUntil:'networkidle'});
  await page.locator('.menu-button').click();
  await page.locator('.vp-sidebar').getByRole('link',{name:prefix?'工程':'Engineering',exact:true}).click();
  await page.waitForURL('**'+prefix+'/#engineering');await page.locator('#engineering').waitFor();
  assert.equal(await page.locator('.menu-button').getAttribute('aria-expanded'),'false');
  assert(await page.locator('#engineering').evaluate(el=>el.getBoundingClientRect().top>=63),'Anchor hidden by fixed navbar');
  await page.close();
 }
} finally {await browser.close();await new Promise(r=>server.close(r));}
