export function checkRequestOrigin(method,origin,allowedOrigins){
  if(origin&&!allowedOrigins.has(origin))return {ok:false,status:403,code:'ORIGIN_DENIED',message:'Origin is not allowed'};
  if(['POST','PUT','PATCH','DELETE'].includes(method||'')&&(!origin||!allowedOrigins.has(origin)))return {ok:false,status:403,code:'ORIGIN_REQUIRED',message:'A configured local Origin is required'};
  return {ok:true};
}

export function isSafeRenderPath(outputRoot,outputPath){
  const root=outputRoot.endsWith('/')?outputRoot:outputRoot+'/';
  return outputPath.startsWith(root);
}
