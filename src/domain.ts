import {z} from 'zod';

export const brandIds = ['bengal-unfolded', 'factlens', 'kalokhata', 'delta-signal', 'open-care', 'ciphertext-labs'] as const;
export type BrandId = (typeof brandIds)[number];
export type BrandProfile = {
  id: BrandId; name: string; description: string; primaryColor: string; secondaryColor: string;
  backgroundColor: string; defaultLanguage: 'en' | 'bn'; narrationStyle: string; policy: string;
};

export const brands: BrandProfile[] = [
  {id:'bengal-unfolded',name:'Bengal Unfolded',description:'History, memory and the stories that shaped Bengal.',primaryColor:'#db9b62',secondaryColor:'#e6d4b8',backgroundColor:'#151412',defaultLanguage:'en',narrationStyle:'Cinematic, researched, adventurous',policy:'Separate fact from interpretation. Mark AI reconstructions.'},
  {id:'factlens',name:'FactLens',description:'News and context, made clear.',primaryColor:'#e85e4f',secondaryColor:'#f4e7cf',backgroundColor:'#151312',defaultLanguage:'en',narrationStyle:'Clear, editorial, professional',policy:'Verify current events. Do not present speculation as fact.'},
  {id:'kalokhata',name:'KaloKhata',description:'Public records and accountability, carefully told.',primaryColor:'#c1a16a',secondaryColor:'#ddd5c6',backgroundColor:'#141412',defaultLanguage:'bn',narrationStyle:'Neutral, restrained, documentary',policy:'Distinguish allegations from findings. Never fabricate evidence.'},
  {id:'delta-signal',name:'Delta Signal',description:'The signals shaping a changing delta.',primaryColor:'#73c7a4',secondaryColor:'#c8e4dc',backgroundColor:'#101817',defaultLanguage:'en',narrationStyle:'Scientific, informative, visual',policy:'Show timestamps, units, sources and uncertainty.'},
  {id:'open-care',name:'Open Care',description:'Practical health knowledge with care.',primaryColor:'#e9928a',secondaryColor:'#f0d9d5',backgroundColor:'#191314',defaultLanguage:'bn',narrationStyle:'Warm, trustworthy, clean',policy:'Flag claims needing medical review. No personalized diagnosis.'},
  {id:'ciphertext-labs',name:'CipherText Labs',description:'Technology, tools and a more capable future.',primaryColor:'#9e9aff',secondaryColor:'#d4d3fa',backgroundColor:'#11111a',defaultLanguage:'en',narrationStyle:'Modern, professional, energetic',policy:'Distinguish conceptual illustrations from real product screens.'},
];

const GeoPosition=z.tuple([z.number().finite().min(-180).max(180),z.number().finite().min(-90).max(90)]).rest(z.number().finite());
const GeoLine=z.array(GeoPosition).min(2).max(10000);
const GeoPolygon=z.array(GeoLine).min(1).max(1000);
const GeoGeometry=z.discriminatedUnion('type',[
  z.object({type:z.literal('Point'),coordinates:GeoPosition}).strict(),
  z.object({type:z.literal('MultiPoint'),coordinates:z.array(GeoPosition).min(1).max(10000)}).strict(),
  z.object({type:z.literal('LineString'),coordinates:GeoLine}).strict(),
  z.object({type:z.literal('MultiLineString'),coordinates:z.array(GeoLine).min(1).max(1000)}).strict(),
  z.object({type:z.literal('Polygon'),coordinates:GeoPolygon}).strict(),
  z.object({type:z.literal('MultiPolygon'),coordinates:z.array(GeoPolygon).min(1).max(1000)}).strict(),
]);
const GeoFeature=z.object({type:z.literal('Feature'),geometry:GeoGeometry,properties:z.record(z.string(),z.unknown()).optional(),id:z.union([z.string(),z.number()]).optional()}).strict();
export const SceneSchema = z.object({
  id:z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/), order:z.number().int().nonnegative(), sceneType:z.enum(['cinematic-image','parallax','historical-map','history-timeline','data-chart','news-headline','evidence-timeline','medical-explainer','software-demo','document-highlight','quote','intro','outro']),
  narration:z.string(), onScreenText:z.string(), estimatedDurationSeconds:z.number().positive(), visualDescription:z.string(), animation:z.enum(['zoom-in','pan-left','fade','rise']), approvalStatus:z.enum(['draft','approved']), sourceReferences:z.array(z.string()),
  camera:z.object({movement:z.enum(['zoom-in','zoom-out','pan-left','pan-right','rise','none']),intensity:z.number().min(0).max(1)}).optional(),
  transition:z.object({type:z.enum(['cut','fade','wipe']),durationSeconds:z.number().min(0).max(2)}).optional(),
  audio:z.object({src:z.string().regex(/^(?:assets|generated-audio)\/[A-Za-z0-9._/-]+$/).refine(path=>!path.split('/').includes('..')),durationSeconds:z.number().positive(),voice:z.string(),provider:z.enum(['azure','elevenlabs']).optional(),model:z.string().optional(),cacheKey:z.string().regex(/^[a-f0-9]{64}$/)}).optional(),
  assetPath:z.string().regex(/^assets\/[A-Za-z0-9._/-]+$/).refine(path=>!path.split('/').includes('..')).optional(),
  parallaxLayers:z.array(z.object({assetPath:z.string().regex(/^assets\/[A-Za-z0-9._/-]+$/).refine(path=>!path.split('/').includes('..')),depth:z.number().min(-1).max(1),opacity:z.number().min(0).max(1)}).strict()).max(8).optional(),
  geoJson:z.object({type:z.literal('FeatureCollection'),source:z.string().min(1).max(500),features:z.array(GeoFeature).min(1).max(1000)}).strict().optional(),
  videoAsset:z.object({src:z.string().regex(/^assets\/[A-Za-z0-9._/-]+$/).refine(path=>!path.split('/').includes('..')),trimStartSeconds:z.number().min(0),trimEndSeconds:z.number().positive(),fit:z.enum(['cover','contain']),positionX:z.number().min(0).max(100),positionY:z.number().min(0).max(100)}).refine(media=>media.trimEndSeconds>media.trimStartSeconds,{message:'Video trim end must be after trim start'}).optional(),
  chartData:z.object({chartType:z.enum(['bar','line']),unit:z.string().max(24),period:z.string().max(80),source:z.string().max(500),points:z.array(z.object({label:z.string().max(48),value:z.number().finite().min(0).max(1e15)})).min(2).max(12)}).optional(),
  historyData:z.object({events:z.array(z.object({date:z.string().max(40),title:z.string().max(140),description:z.string().max(800),source:z.string().max(500),assetPath:z.string().regex(/^assets\/[A-Za-z0-9._/-]+$/).refine(path=>!path.split('/').includes('..')).optional(),illustrative:z.boolean()})).min(2).max(8)}).optional(),
  softwareData:z.object({callouts:z.array(z.object({text:z.string().max(120),startSeconds:z.number().min(0),endSeconds:z.number().positive(),targetX:z.number().min(0).max(100),targetY:z.number().min(0).max(100),labelX:z.number().min(0).max(100),labelY:z.number().min(0).max(100)})).max(8)}).optional().refine(data=>!data||data.callouts.every(callout=>callout.endSeconds>callout.startSeconds),{message:'Callout end must be after its start'}),
}).strict();
export const StoryboardSchema = z.object({version:z.literal(1),title:z.string(),language:z.enum(['en','bn']),targetDurationSeconds:z.number().positive(),scenes:z.array(SceneSchema).min(1)});
export type Scene = z.infer<typeof SceneSchema>;
export type SceneType = Scene['sceneType'];
export type Storyboard = z.infer<typeof StoryboardSchema>;
export type StudioProject = {id:string;brandId:BrandId;title:string;language:'en'|'bn';format:'landscape'|'portrait'|'square';script:string;scriptApproved:boolean;status:string;updatedAt:string;storyboard?:Storyboard};

export function makeStoryboard(title:string, script:string, language:'en'|'bn', brandId:BrandId):Storyboard {
  const chunks = script.split(/(?<=[.!?।])\s+/u).map(s=>s.trim()).filter(Boolean);
  const sentences = chunks.length ? chunks : [script.trim() || `An introduction to ${title}.`];
  const brand = brands.find(b=>b.id===brandId)!;
  const scenes:Scene[] = sentences.map((narration,i)=>({id:crypto.randomUUID(),order:i,sceneType:i===0?'intro':i===sentences.length-1?'outro':brandId==='delta-signal'?'data-chart':brandId==='kalokhata'?'evidence-timeline':brandId==='open-care'?'medical-explainer':brandId==='ciphertext-labs'?'software-demo':brandId==='factlens'?'news-headline':'cinematic-image',narration,onScreenText:i===0?title:narration.split(/\s+/).slice(0,7).join(' '),estimatedDurationSeconds:Math.max(4,Math.ceil(narration.split(/\s+/).length/2.5)),visualDescription:`Illustrative visual for ${brand.name}: ${narration}`,animation:i%3===0?'zoom-in':i%3===1?'pan-left':'rise',approvalStatus:'draft',sourceReferences:[]}));
  return StoryboardSchema.parse({version:1,title,language,targetDurationSeconds:scenes.reduce((t,s)=>t+s.estimatedDurationSeconds,0),scenes});
}
