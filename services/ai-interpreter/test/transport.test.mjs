import test from 'node:test';
import assert from 'node:assert/strict';
import {createTransport} from '../client/transport.mjs';
import {createLocalFixture} from './local-fetch.mjs';
const input={currency:'JPY',amount:12000,annualRatePct:12,months:12};
test('signed-out requests never reach backend; login allows a single JSON request',async()=>{
  const f=createLocalFixture(),t=createTransport(f);await assert.rejects(t.explain(input,'en-US','curves'),{code:'LOGIN_REQUIRED'});assert.equal(f.control.requests,0);
  await f.session.login();const r=await t.explain(input,'en-US','curves');assert.ok(r.explanation.includes('local test'));assert.equal(f.control.requests,1);
});
test('401 invalidates the session; errors are never automatically retried',async()=>{
  for(const scenario of ['auth','quota','failure']){
    const f=createLocalFixture();await f.session.login();f.control.scenario=scenario;const t=createTransport(f);
    await assert.rejects(t.explain(input,'zh-CN','curves'));assert.equal(f.control.requests,1);
    if(scenario==='auth'){f.control.scenario='success';await assert.rejects(t.explain(input,'en-US','curves'),{code:'SESSION_EXPIRED'});assert.equal(f.control.requests,1);}
  }
});
test('deadline bounds an unresponsive request; cancellation rejects late answers',async()=>{
  const session={async accessToken(){return 'synthetic';}};
  const timeout=createTransport({apiBase:'https://example.invalid',session,deadlineMs:10,fetchImpl:()=>new Promise(()=>{})});
  await assert.rejects(timeout.explain(input,'en-US','curves'),{code:'UPSTREAM_TIMEOUT'});
  let release;const pending=createTransport({apiBase:'https://example.invalid',session,fetchImpl:()=>new Promise(r=>release=r)});
  const result=pending.explain(input,'en-US','curves');await new Promise(r=>setImmediate(r));pending.cancel();
  release(Response.json({apiVersion:'2',explanation:'late'}));await assert.rejects(result,{code:'REQUEST_CANCELLED'});
});
test('transport submits only parameters and rejects SSE or malformed JSON responses',async()=>{
  for(const response of [new Response('old stream',{headers:{'Content-Type':'text/event-stream'}}),Response.json({apiVersion:'1',explanation:'old'}),Response.json({apiVersion:'2',explanation:''})]){
    const t=createTransport({apiBase:'https://example.invalid',session:{async accessToken(){return 'synthetic';}},fetchImpl:async(url,o)=>{assert.deepEqual(JSON.parse(o.body),{apiVersion:'2',locale:'en-US',intent:'curves',input});return response;}});
    await assert.rejects(t.explain(input,'en-US','curves'),{code:'INVALID_RESPONSE'});
  }
});
