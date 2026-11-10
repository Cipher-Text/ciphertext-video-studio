import {z} from 'zod';

export const projectIdSchema = z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);
const geoPosition=z.tuple([z.number().finite().min(-180).max(180),z.number().finite().min(-90).max(90)]).rest(z.number().finite());
const geoLine=z.array(geoPosition).min(2).max(10000),geoPolygon=z.array(geoLine).min(1).max(1000);
const geoGeometry=z.discriminatedUnion('type',[
  z.object({type:z.literal('Point'),coordinates:geoPosition}).strict(),z.object({type:z.literal('MultiPoint'),coordinates:z.array(geoPosition).min(1).max(10000)}).strict(),
  z.object({type:z.literal('LineString'),coordinates:geoLine}).strict(),z.object({type:z.literal('MultiLineString'),coordinates:z.array(geoLine).min(1).max(1000)}).strict(),
  z.object({type:z.literal('Polygon'),coordinates:geoPolygon}).strict(),z.object({type:z.literal('MultiPolygon'),coordinates:z.array(geoPolygon).min(1).max(1000)}).strict(),
]);
const geoFeature=z.object({type:z.literal('Feature'),geometry:geoGeometry,properties:z.record(z.string(),z.unknown()).optional(),id:z.union([z.string(),z.number()]).optional()}).strict();
const animationConfig=z.object({
  mode:z.enum(['battlefield-intro','troop-advance','tank-battle','tank-retreat','battle-map','brand-outro','layered-parallax','camera-only']),
  camera:z.object({movement:z.enum(['zoom-in','zoom-out','pan-left','pan-right','track-subject','none']),intensity:z.number().min(0).max(1),subject:z.enum(['pt76','m24']).optional()}).strict().optional(),
  layers:z.array(z.object({id:z.enum(['background','midground','foreground']),depth:z.number().min(-1).max(1),offsetX:z.number().min(-500).max(500).optional(),offsetY:z.number().min(-500).max(500).optional(),scale:z.number().min(.8).max(1.4).optional(),opacity:z.number().min(0).max(1).optional()}).strict()).max(3).optional(),
  settings:z.object({intensity:z.number().min(0).max(1).optional(),speed:z.number().min(.1).max(4).optional(),labels:z.array(z.string().max(60)).max(3).optional(),sourceLabel:z.string().max(180).optional(),status:z.enum(['allegation','finding','unresolved','context']).optional()}).strict().optional(),
}).strict();
export const sceneSchema = z.object({
  id:projectIdSchema, order:z.number().int().min(0).max(999),
  sceneType:z.enum(['cinematic-image','parallax','historical-map','history-timeline','data-chart','news-headline','evidence-timeline','medical-explainer','software-demo','document-highlight','quote','intro','outro']),
  narration:z.string().max(20000), onScreenText:z.string().max(4000), estimatedDurationSeconds:z.number().positive().max(600),
  visualDescription:z.string().max(20000), animation:z.enum(['zoom-in','pan-left','fade','rise']), approvalStatus:z.enum(['draft','approved']), sourceReferences:z.array(z.string().max(2000)).max(100),
  camera:z.object({movement:z.enum(['zoom-in','zoom-out','pan-left','pan-right','rise','none']),intensity:z.number().min(0).max(1)}).strict().optional(),
  animationConfig:animationConfig.optional(),
  animationPresetId:z.string().min(1).max(100).regex(/^[a-z0-9.-]+$/).optional(),
  transition:z.object({type:z.enum(['cut','fade','wipe']),durationSeconds:z.number().min(0).max(2)}).strict().optional(),
  audio:z.object({src:z.string().max(500).regex(/^(?:assets|generated-audio)\/[A-Za-z0-9._/-]+$/).refine(path=>!path.split('/').includes('..')),durationSeconds:z.number().positive().max(600),voice:z.string().max(100),provider:z.enum(['azure','elevenlabs']).optional(),model:z.string().max(100).optional(),cacheKey:z.string().regex(/^[a-f0-9]{64}$/)}).strict().optional(),
  assetPath:z.string().max(500).regex(/^assets\/[A-Za-z0-9._/-]+$/).refine(path=>!path.split('/').includes('..'),{message:'Asset path must stay inside the public asset directory'}).optional(),
  parallaxLayers:z.array(z.object({assetPath:z.string().max(500).regex(/^assets\/[A-Za-z0-9._/-]+$/).refine(path=>!path.split('/').includes('..')),depth:z.number().min(-1).max(1),opacity:z.number().min(0).max(1)}).strict()).max(8).optional(),
  geoJson:z.object({type:z.literal('FeatureCollection'),source:z.string().min(1).max(500),features:z.array(geoFeature).min(1).max(1000)}).strict().optional(),
  videoAsset:z.object({src:z.string().max(500).regex(/^assets\/[A-Za-z0-9._/-]+$/).refine(path=>!path.split('/').includes('..')),trimStartSeconds:z.number().min(0).max(36000),trimEndSeconds:z.number().positive().max(36000),fit:z.enum(['cover','contain']),positionX:z.number().min(0).max(100),positionY:z.number().min(0).max(100)}).strict().superRefine((media,ctx)=>{if(media.trimEndSeconds<=media.trimStartSeconds)ctx.addIssue({code:'custom',path:['trimEndSeconds'],message:'Video trim end must be after trim start'})}).optional(),
  chartData:z.object({chartType:z.enum(['bar','line']),unit:z.string().max(24),period:z.string().max(80),source:z.string().max(500),points:z.array(z.object({label:z.string().max(48),value:z.number().finite().min(0).max(1e15)}).strict()).min(2).max(12)}).strict().optional(),
  historyData:z.object({events:z.array(z.object({date:z.string().max(40),title:z.string().max(140),description:z.string().max(800),source:z.string().max(500),assetPath:z.string().max(500).regex(/^assets\/[A-Za-z0-9._/-]+$/).refine(path=>!path.split('/').includes('..')).optional(),illustrative:z.boolean()}).strict()).min(2).max(8)}).strict().optional(),
  softwareData:z.object({callouts:z.array(z.object({text:z.string().max(120),startSeconds:z.number().min(0).max(600),endSeconds:z.number().positive().max(600),targetX:z.number().min(0).max(100),targetY:z.number().min(0).max(100),labelX:z.number().min(0).max(100),labelY:z.number().min(0).max(100)}).strict()).max(8)}).strict().superRefine((data,ctx)=>data.callouts.forEach((callout,index)=>{if(callout.endSeconds<=callout.startSeconds)ctx.addIssue({code:'custom',path:['callouts',index,'endSeconds'],message:'Callout end must be after its start'})})).optional(),
}).strict();
export const storyboardSchema=z.object({version:z.literal(1),title:z.string().max(300),language:z.enum(['en','bn']),targetDurationSeconds:z.number().positive().max(7200),scenes:z.array(sceneSchema).min(1).max(200)}).strict().superRefine((storyboard,ctx)=>{
  const ids=new Set(); storyboard.scenes.forEach((scene,index)=>{
    if(ids.has(scene.id))ctx.addIssue({code:'custom',path:['scenes',index,'id'],message:'Scene IDs must be unique'}); ids.add(scene.id);
    if(scene.order!==index)ctx.addIssue({code:'custom',path:['scenes',index,'order'],message:'Scene order must match its position'});
  });
  const duration=storyboard.scenes.reduce((sum,scene)=>sum+Math.max(scene.estimatedDurationSeconds,scene.audio?.durationSeconds??0,scene.videoAsset?scene.videoAsset.trimEndSeconds-scene.videoAsset.trimStartSeconds:0),0);
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
