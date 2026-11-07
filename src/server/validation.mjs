import {z} from 'zod';

export const projectIdSchema = z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);
export const sceneSchema = z.object({
  id:projectIdSchema, order:z.number().int().min(0).max(999),
  sceneType:z.enum(['cinematic-image','parallax','historical-map','data-chart','news-headline','evidence-timeline','medical-explainer','software-demo','document-highlight','quote','intro','outro']),
  narration:z.string().max(20000), onScreenText:z.string().max(4000), estimatedDurationSeconds:z.number().positive().max(600),
  visualDescription:z.string().max(20000), animation:z.enum(['zoom-in','pan-left','fade','rise']), approvalStatus:z.enum(['draft','approved']), sourceReferences:z.array(z.string().max(2000)).max(100),
  camera:z.object({movement:z.enum(['zoom-in','zoom-out','pan-left','pan-right','rise','none']),intensity:z.number().min(0).max(1)}).strict().optional(),
  transition:z.object({type:z.enum(['cut','fade','wipe']),durationSeconds:z.number().min(0).max(2)}).strict().optional(),
  audio:z.object({src:z.string().max(500).regex(/^(?:assets|generated-audio)\/[A-Za-z0-9._/-]+$/).refine(path=>!path.split('/').includes('..')),durationSeconds:z.number().positive().max(600),voice:z.string().max(100),provider:z.enum(['azure','elevenlabs']).optional(),model:z.string().max(100).optional(),cacheKey:z.string().regex(/^[a-f0-9]{64}$/)}).strict().optional(),
  assetPath:z.string().max(500).regex(/^assets\/[A-Za-z0-9._/-]+$/).refine(path=>!path.split('/').includes('..'),{message:'Asset path must stay inside the public asset directory'}).optional(),
}).strict();
export const storyboardSchema=z.object({version:z.literal(1),title:z.string().max(300),language:z.enum(['en','bn']),targetDurationSeconds:z.number().positive().max(7200),scenes:z.array(sceneSchema).min(1).max(200)}).strict().superRefine((storyboard,ctx)=>{
  const ids=new Set(); storyboard.scenes.forEach((scene,index)=>{
    if(ids.has(scene.id))ctx.addIssue({code:'custom',path:['scenes',index,'id'],message:'Scene IDs must be unique'}); ids.add(scene.id);
    if(scene.order!==index)ctx.addIssue({code:'custom',path:['scenes',index,'order'],message:'Scene order must match its position'});
  });
  const duration=storyboard.scenes.reduce((sum,scene)=>sum+Math.max(scene.estimatedDurationSeconds,scene.audio?.durationSeconds??0),0);
  if(Math.abs(duration-storyboard.targetDurationSeconds)>0.01)ctx.addIssue({code:'custom',path:['targetDurationSeconds'],message:'Storyboard target duration must equal its scene durations'});
});
export const projectSchema=z.object({
  id:projectIdSchema,brandId:z.enum(['bengal-unfolded','factlens','kalokhata','delta-signal','open-care','ciphertext-labs']),
  title:z.string().trim().min(1).max(300),language:z.enum(['en','bn']),format:z.enum(['landscape','portrait','square']),
  script:z.string().max(1_000_000),scriptApproved:z.boolean(),status:z.enum(['Script draft','Script approved','Storyboard draft','Storyboard approved']),
  updatedAt:z.string().datetime({offset:true}),storyboard:storyboardSchema.optional(),
}).strict().superRefine((project,ctx)=>{
  if(project.storyboard&&(project.storyboard.title!==project.title||project.storyboard.language!==project.language))ctx.addIssue({code:'custom',path:['storyboard'],message:'Storyboard title and language must match the project'});
});

export function decodeRouteId(rawSegment){
  let decoded;try{decoded=decodeURIComponent(rawSegment)}catch{return null}
  if(decoded.includes('/')||decoded.includes('\\')||decoded==='.'||decoded==='..')return null;
  return projectIdSchema.safeParse(decoded).success?decoded:null;
}
