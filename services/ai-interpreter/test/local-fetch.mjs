import {ApiError} from '../lib/errors.mjs';
// Local UI fixture only; no AWS authentication, inference or quota ledger.
export function createLocalFixture() {
  let mode='signed-out';
  const control={scenario:'success',requests:0};
  const session={get mode(){return mode;},async login(){mode='user';},clear(){mode='signed-out';},rejectCredential(){mode='expired';},
    async accessToken(signal){signal?.throwIfAborted();if(mode!=='user')throw new ApiError(mode==='expired'?'SESSION_EXPIRED':'LOGIN_REQUIRED',401);return 'local-fixture-user';}};
  async function fetchImpl(url,options) {
    if(url!=='https://local-fixture.invalid/v1/loan-explanations')throw new Error('External network forbidden');
    control.requests++;options.signal?.throwIfAborted();
    if(control.scenario==='auth')return new Response('',{status:401});
    if(control.scenario==='quota')return new Response('',{status:429});
    if(control.scenario==='failure')return new Response('',{status:502});
    if(control.scenario==='pending')return new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(options.signal.reason),{once:true}));
    const {locale}=JSON.parse(options.body);
    return Response.json({apiVersion:'2',explanation:locale==='zh-CN'
      ?'这是本地模拟响应，尚未调用模型。\n\n等额本息的月供基本固定；等额本金较早偿还本金，因此在正利率下，后续利息随剩余本金减少。真实 AI 接入后，会结合本次参数和后端计算结果生成解释。'
      :'This is a local test response; no model was called.\n\nEqual-payment loans have mostly constant monthly payments. Equal-principal loans repay principal earlier, reducing subsequent interest at a positive rate. The real model will explain the supplied parameters and server-calculated results.',quota:{limit:20,remaining:19,resetAt:'2099-01-01T15:00:00.000Z'}});
  }
  return {session,control,fetchImpl,apiBase:'https://local-fixture.invalid'};
}
