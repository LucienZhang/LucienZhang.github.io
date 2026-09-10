import {ApiError} from '../lib/errors.mjs';

export function createTransport({apiBase,session,fetchImpl=fetch,deadlineMs=30000}) {
  let active;
  return {
    cancel(){active?.abort(new ApiError('REQUEST_CANCELLED',499));},
    async explain(input,locale,intent) {
      active?.abort(new ApiError('REQUEST_CANCELLED',499));
      const controller=new AbortController();active=controller;
      let timer,abort;
      const cancelled=new Promise((_,reject)=>{
        abort=()=>reject(controller.signal.reason);
        controller.signal.addEventListener('abort',abort,{once:true});
        timer=setTimeout(()=>controller.abort(new ApiError('UPSTREAM_TIMEOUT',504)),deadlineMs);
      });
      const request=async()=>{
        const token=await session.accessToken(controller.signal);controller.signal.throwIfAborted();
        const response=await fetchImpl(`${apiBase}/v1/loan-explanations`,{method:'POST',credentials:'omit',cache:'no-store',redirect:'error',signal:controller.signal,
          headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
          body:JSON.stringify({apiVersion:'2',locale,intent,input})});
        if(!response.ok) {
          if(response.status===401)session.rejectCredential();
          const codes={400:'INVALID_INPUT',401:'SESSION_EXPIRED',403:'ACCESS_DENIED',429:'RATE_LIMITED',503:'AI_UNAVAILABLE',504:'UPSTREAM_TIMEOUT'};
          throw new ApiError(codes[response.status]??'UPSTREAM_ERROR',response.status);
        }
        if(!response.headers.get('Content-Type')?.startsWith('application/json'))throw new ApiError('INVALID_RESPONSE',502);
        const body=await response.json();controller.signal.throwIfAborted();
        if(body?.apiVersion!=='2' || typeof body.explanation!=='string' || !body.explanation.trim() || body.explanation.length>32768)throw new ApiError('INVALID_RESPONSE',502);
        return body;
      };
      try{return await Promise.race([request(),cancelled]);}
      finally{clearTimeout(timer);controller.signal.removeEventListener('abort',abort);if(active===controller)active=undefined;}
    },
  };
}
