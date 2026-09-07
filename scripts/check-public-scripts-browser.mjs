import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE));
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const root=path.resolve('docs/.vuepress/dist');
const server=http.createServer((req,res)=>{let name=new URL(req.url,'http://localhost').pathname;if(name.endsWith('/'))name+='index.html';const file=path.join(root,name);try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chrome',headless:true});
try {for(const origin of [process.env.DEV_ORIGIN,`http://127.0.0.1:${server.address().port}`].filter(Boolean)) {
 for(const failFirst of [false,true]) {
 const page=await browser.newPage();page.setDefaultTimeout(15000);let nvRequests=0;const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://api.ziliang.ninja/**',async route=>{
  const target=route.request().postDataJSON()?.url||'';
  let data={cookies:{}};
  if(target.endsWith('/graphql'))data={text:JSON.stringify({data:target.includes('leetcode.cn')?{userContestRanking:{currentRatingRanking:50}}:{userContestRanking:{globalRanking:100,rating:1700},userContestRankingHistory:[{rating:1600,ranking:100,contest:{title:'Contest one'}},{rating:1700,ranking:80,contest:{title:'Contest two'}}]}})};
  await route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.route('**/static/js/nv.d3.js',route=>{nvRequests++;return failFirst&&nvRequests===1?route.abort():route.continue();});
 await page.goto(origin+'/programming/algorithms/overview.html',{waitUntil:'networkidle'});
 if(failFirst){await page.locator('.leetcode .remote-state button').click();}
 await page.locator('.leetcode svg .nv-line').first().waitFor({state:'attached'});
 assert.equal(await page.evaluate(()=>window.d3.version),'3.5.17');assert(await page.evaluate(()=>typeof window.nv.models.lineChart==='function'));
 assert.equal(await page.locator('script[src="/static/js/d3.js"]').count(),1);assert.equal(await page.locator('script[src="/static/js/nv.d3.js"]').count(),1);
 // SPA revisit must reuse the same libraries, rather than registering them again.
 await page.locator('.vp-sidebar-items a[href="/programming/algorithms/knapsack.html"]').click();
 await page.locator('.pseudo-wrapper .ps-root').first().waitFor({state:'attached'});
 assert.equal(await page.locator('script[src="/static/js/pseudocode.js"]').count(),1);
 await page.locator('.vp-sidebar-items a[href="/programming/algorithms/overview.html"]').click();
 await page.locator('.leetcode svg .nv-line').first().waitFor({state:'attached'});
 assert.equal(await page.locator('script[src="/static/js/d3.js"]').count(),1);assert.equal(nvRequests,failFirst?2:1);assert.deepEqual(errors,[]);
 console.log('PASS',origin,failFirst?'failed load / Retry / SPA':'chart / pseudocode / SPA');await page.close();
 }
}}finally{await browser.close();await new Promise(r=>server.close(r));}
