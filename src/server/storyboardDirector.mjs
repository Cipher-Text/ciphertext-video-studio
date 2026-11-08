import {z} from 'zod';

const formatSchema=z.enum(['landscape','portrait','square']);
export const DirectorInputSchema=z.object({
  brand:z.string().min(1).max(120),topic:z.string().min(1).max(20000),audience:z.string().min(1).max(500),
  language:z.enum(['en','bn']),durationSeconds:z.number().int().min(10).max(7200),format:formatSchema,
  availableMedia:z.array(z.object({path:z.string().max(500),type:z.enum(['image','video']),description:z.string().max(1000).default('')})).max(100).default([]),
}).strict();
export const DirectorOutputSchema=z.object({
  narrativeStructure:z.array(z.string().min(1).max(500)).min(3).max(12),
  scenes:z.array(z.object({
    narration:z.string().min(1).max(4000),visualDescription:z.string().min(1).max(2000),
    recommendedSceneType:z.enum(['cinematic-image','parallax','historical-map','history-timeline','data-chart','news-headline','evidence-timeline','medical-explainer','software-demo','document-highlight','quote','intro','outro']),
    cameraMovement:z.enum(['zoom-in','zoom-out','pan-left','pan-right','rise','none']),
    animationPreset:z.enum(['zoom-in','pan-left','fade','rise']),assetSuggestions:z.array(z.string().max(500)).max(8),
    approximateDurationSeconds:z.number().positive().max(600),sourceRequirements:z.array(z.string().max(500)).max(12),
  }).strict()).min(1).max(100),
}).strict();

const responseSchema=z.object({choices:z.array(z.object({message:z.object({content:z.string()})})).min(1)});
const trimBase=(url)=>url.replace(/\/+$/,'');

export function createStoryboardDirector({env=process.env,fetchImpl=fetch}={}){
  const localBase=env.STORYBOARD_LLM_LOCAL_BASE_URL;
  const remoteBase=env.STORYBOARD_LLM_REMOTE_BASE_URL;
  const provider=localBase?'local':remoteBase&&env.STORYBOARD_LLM_REMOTE_API_KEY?'remote':null;
  return {
    configured:Boolean(provider),provider,
    async generate(untrustedInput){
      if(!provider)throw Object.assign(new Error('Configure a local OpenAI-compatible endpoint or a remote LLM endpoint and API key.'),{status:503,code:'STORYBOARD_LLM_NOT_CONFIGURED'});
      const input=DirectorInputSchema.parse(untrustedInput);
      const base=trimBase(provider==='local'?localBase:remoteBase);
      const model=provider==='local'?env.STORYBOARD_LLM_LOCAL_MODEL:env.STORYBOARD_LLM_REMOTE_MODEL;
      if(!model)throw Object.assign(new Error(`Configure STORYBOARD_LLM_${provider==='local'?'LOCAL':'REMOTE'}_MODEL.`),{status:503,code:'STORYBOARD_LLM_MODEL_NOT_CONFIGURED'});
      const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),Math.min(120000,Math.max(5000,Number(env.STORYBOARD_LLM_TIMEOUT_MS)||90000)));
      try{
        const headers={'content-type':'application/json'};
        if(provider==='remote')headers.authorization=`Bearer ${env.STORYBOARD_LLM_REMOTE_API_KEY}`;
        const response=await fetchImpl(`${base}/chat/completions`,{method:'POST',headers,signal:controller.signal,body:JSON.stringify({model,temperature:0.35,response_format:{type:'json_object'},messages:[
          {role:'system',content:'You are a documentary storyboard director. Return only JSON matching the requested schema. Be accurate, do not invent facts, mark citations and source needs explicitly, fit scene durations to the requested total within 1 second, and recommend visuals that can be produced deterministically.'},
          {role:'user',content:JSON.stringify({task:'Create an editable storyboard plan. Do not claim supplied media proves a fact. Include narrative structure and scene fields narration, visualDescription, recommendedSceneType, cameraMovement, animationPreset, assetSuggestions, approximateDurationSeconds, sourceRequirements.',input})},
        ]})});
        if(!response.ok)throw Object.assign(new Error(`Storyboard provider returned HTTP ${response.status}.`),{status:502,code:'STORYBOARD_PROVIDER_ERROR'});
        const payload=responseSchema.parse(await response.json());let generated;
        try{generated=JSON.parse(payload.choices[0].message.content)}catch{throw Object.assign(new Error('Storyboard provider returned invalid JSON.'),{status:502,code:'STORYBOARD_INVALID_JSON'})}
        const output=DirectorOutputSchema.parse(generated);
        const total=output.scenes.reduce((sum,scene)=>sum+scene.approximateDurationSeconds,0);
        if(Math.abs(total-input.durationSeconds)>Math.max(1,input.durationSeconds*.01))throw Object.assign(new Error('Generated scene durations do not match the requested video duration.'),{status:502,code:'STORYBOARD_DURATION_MISMATCH'});
        return output;
      }catch(error){if(error?.name==='AbortError')throw Object.assign(new Error('Storyboard provider timed out.'),{status:504,code:'STORYBOARD_PROVIDER_TIMEOUT'});if(error?.name==='ZodError')throw Object.assign(new Error('Storyboard provider output did not match the required schema.'),{status:502,code:'STORYBOARD_INVALID_OUTPUT'});throw error}
      finally{clearTimeout(timer)}
    },
  };
}
