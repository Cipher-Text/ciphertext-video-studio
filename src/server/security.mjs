export class RequestInputError extends Error {
  constructor(status,code,message){super(message);this.status=status;this.code=code}
}

export function checkRequestOrigin(method,origin,allowedOrigins){
  if(origin&&!allowedOrigins.has(origin))return {ok:false,status:403,code:'ORIGIN_DENIED',message:'Origin is not allowed'};
  if(['POST','PUT','PATCH','DELETE'].includes(method||'')&&(!origin||!allowedOrigins.has(origin)))return {ok:false,status:403,code:'ORIGIN_REQUIRED',message:'A configured local Origin is required'};
  return {ok:true};
}

export async function consumeRequestBytes(req,maxBytes=2*1024*1024){
  const limitLabel=maxBytes===2*1024*1024?'2 MiB':`${Math.floor(maxBytes/1024/1024)} MiB`;
  const declared=Number(req.headers?.['content-length']||0);if(declared>maxBytes)throw new RequestInputError(413,'BODY_TOO_LARGE',`Request body exceeds the ${limitLabel} limit`);
  const chunks=[];let size=0;for await(const chunk of req){const buffer=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);size+=buffer.length;if(size>maxBytes)throw new RequestInputError(413,'BODY_TOO_LARGE',`Request body exceeds the ${limitLabel} limit`);chunks.push(buffer)}
  return Buffer.concat(chunks);
}
export async function consumeRequestBody(req,maxBytes=2*1024*1024){return (await consumeRequestBytes(req,maxBytes)).toString('utf8')}
export async function parseJsonBody(req,maxBytes=2*1024*1024){
  if(!String(req.headers?.['content-type']||'').toLowerCase().startsWith('application/json'))throw new RequestInputError(415,'UNSUPPORTED_MEDIA_TYPE','Expected application/json');
  const raw=await consumeRequestBody(req,maxBytes);
  try{return JSON.parse(raw||'{}')}catch{throw new RequestInputError(400,'INVALID_JSON','Malformed JSON body')}
}

export function isSafeRenderPath(outputRoot,outputPath){
  const root=outputRoot.endsWith('/')?outputRoot:outputRoot+'/';
  return outputPath.startsWith(root);
}
