import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {spawn} from 'node:child_process';
import {createReadStream} from 'node:fs';
import {mkdir, readFile, readdir, stat, unlink, writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {join, dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {projectSchema,decodeRouteId} from './validation.mjs';
import {checkRequestOrigin,isSafeRenderPath,parseJsonBody,consumeRequestBody,consumeRequestBytes} from './security.mjs';
import {createAzureSpeechProvider,bnBdVoices} from './azureSpeech.mjs';
import {createElevenLabsSpeechProvider} from './elevenLabsSpeech.mjs';
import {createStoryboardDirector} from './storyboardDirector.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
try{process.loadEnvFile(join(root,'.env'))}catch{}
const dataDir = resolve(process.env.CIPHERTEXT_DATA_DIR || join(root, 'data'));
const dbPath = join(dataDir, 'ciphertext.sqlite');
await mkdir(dataDir, {recursive: true});
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
db.exec(await readFile(join(root, 'migrations/001_projects.sql'), 'utf8'));
db.exec(await readFile(join(root, 'migrations/002_render_jobs.sql'), 'utf8'));
db.exec(await readFile(join(root, 'migrations/003_media_assets.sql'), 'utf8'));
db.exec(await readFile(join(root, 'migrations/004_animation_presets.sql'), 'utf8'));
db.exec(await readFile(join(root, 'migrations/005_animation_quality_metadata.sql'), 'utf8'));

const animationPresetCatalog=JSON.parse(await readFile(join(root,'src/animations/catalog.json'),'utf8'));
const saveAnimationPreset=db.prepare('INSERT INTO animation_presets(id,brand_id,name,category,description,renderer_key,version,tags_json,defaults_json,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET brand_id=excluded.brand_id,name=excluded.name,category=excluded.category,description=excluded.description,renderer_key=excluded.renderer_key,version=excluded.version,tags_json=excluded.tags_json,defaults_json=excluded.defaults_json,updated_at=excluded.updated_at');
const saveAnimationQualityConfig=db.prepare('INSERT INTO animation_preset_quality_config(preset_id,config_json,updated_at) VALUES(?,?,?) ON CONFLICT(preset_id) DO UPDATE SET config_json=excluded.config_json,updated_at=excluded.updated_at');
const now=new Date().toISOString();
for(const preset of animationPresetCatalog){saveAnimationPreset.run(preset.id,preset.brandId,preset.name,preset.category,preset.description,preset.rendererKey,preset.version,JSON.stringify(preset.tags),JSON.stringify(preset.defaults),now);saveAnimationQualityConfig.run(preset.id,JSON.stringify(preset),now)}
const listAnimationPresets=db.prepare('SELECT p.id,p.brand_id AS brandId,p.name,p.category,p.description,p.renderer_key AS rendererKey,p.version,p.tags_json AS tagsJson,p.defaults_json AS defaultsJson,q.config_json AS configJson FROM animation_presets p LEFT JOIN animation_preset_quality_config q ON q.preset_id=p.id WHERE p.brand_id IS NULL OR p.brand_id=? ORDER BY p.category,p.name');

const fields = 'id, brand_id AS brandId, title, language, format, script, script_approved AS scriptApproved, status, updated_at AS updatedAt, storyboard_json AS storyboard';
const decode = (row) => row && ({...row, scriptApproved: Boolean(row.scriptApproved), storyboard: row.storyboard ? JSON.parse(row.storyboard) : undefined});
const list = db.prepare(`SELECT ${fields} FROM projects ORDER BY updated_at DESC`);
const get = db.prepare(`SELECT ${fields} FROM projects WHERE id=?`);
const put = db.prepare(`INSERT INTO projects(id,brand_id,title,language,format,script,script_approved,status,updated_at,storyboard_json) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET brand_id=excluded.brand_id,title=excluded.title,language=excluded.language,format=excluded.format,script=excluded.script,script_approved=excluded.script_approved,status=excluded.status,updated_at=excluded.updated_at,storyboard_json=excluded.storyboard_json`);
const remove = db.prepare('DELETE FROM projects WHERE id=?');
const createJob=db.prepare("INSERT INTO render_jobs(id,project_id,status,progress,attempt,max_attempts,created_at,updated_at) VALUES(?,?,'queued',0,0,3,?,?)");
const getJob=db.prepare('SELECT id,project_id AS projectId,status,progress,attempt,max_attempts AS maxAttempts,output_path AS outputPath,metadata_json AS metadata,error_code AS errorCode,error_message AS errorMessage,created_at AS createdAt,updated_at AS updatedAt,started_at AS startedAt,finished_at AS finishedAt,cancel_requested AS cancelRequested FROM render_jobs WHERE id=?');
const projectJobs=db.prepare('SELECT id,project_id AS projectId,status,progress,attempt,max_attempts AS maxAttempts,output_path AS outputPath,metadata_json AS metadata,error_code AS errorCode,error_message AS errorMessage,created_at AS createdAt,updated_at AS updatedAt,started_at AS startedAt,finished_at AS finishedAt,cancel_requested AS cancelRequested FROM render_jobs WHERE project_id=? ORDER BY created_at DESC LIMIT 25');
const retryJob=db.prepare("UPDATE render_jobs SET status='queued',progress=0,max_attempts=attempt+3,cancel_requested=0,error_code=NULL,error_message=NULL,updated_at=?,finished_at=NULL WHERE id=? AND status='failed'");
const cancelQueued=db.prepare("UPDATE render_jobs SET status='cancelled',cancel_requested=1,updated_at=?,finished_at=? WHERE id=? AND status='queued'");
const requestCancel=db.prepare("UPDATE render_jobs SET cancel_requested=1,updated_at=? WHERE id=? AND status='running'");
const defaultOrigins=['http://127.0.0.1:5173','http://localhost:5173','http://127.0.0.1:4173','http://localhost:4173'];
const allowedOrigins=new Set((process.env.CIPHERTEXT_FRONTEND_ORIGINS||defaultOrigins.join(',')).split(',').map(x=>x.trim()).filter(Boolean));
for(const origin of allowedOrigins){let parsed;try{parsed=new URL(origin)}catch{throw new Error('Invalid CIPHERTEXT_FRONTEND_ORIGINS entry')};if(!['http:','https:'].includes(parsed.protocol)||!['localhost','127.0.0.1','[::1]'].includes(parsed.hostname))throw new Error('Frontend origins must be local loopback origins')}
const send = (res, status, data, origin) => { const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','vary':'Origin'};if(origin&&allowedOrigins.has(origin))headers['access-control-allow-origin']=origin;res.writeHead(status,headers);res.end(JSON.stringify(data)); };
const fail = (res,status,code,message,origin)=>send(res,status,{error:{code,message}},origin);
const body = (req) => parseJsonBody(req);
const persist = (p) => {
  const parsed=projectSchema.safeParse(p);if(!parsed.success){const details=parsed.error.issues.map(issue=>`${issue.path.join('.')||'project'}: ${issue.message}`).join('; ');throw Object.assign(new Error(`Project validation failed: ${details}`),{status:400,code:'INVALID_PROJECT'})}p=parsed.data;
  put.run(p.id,p.brandId,p.title,p.language,p.format,p.script,p.scriptApproved?1:0,String(p.status || 'Script draft'),p.updatedAt || new Date().toISOString(),p.storyboard ? JSON.stringify(p.storyboard) : null);
  return decode(get.get(p.id));
};
let worker,shuttingDown=false;
const startWorker=()=>{worker=spawn(process.execPath,[join(root,'src/server/render-worker.mjs')],{cwd:root,stdio:['ignore','inherit','inherit','ipc']});worker.on('error',error=>console.error('Render worker process error:',error.message));worker.on('exit',code=>{if(shuttingDown)return;console.error(`Render worker exited (${code}); restarting it`);setTimeout(startWorker,500)})};
startWorker();
const speech=createAzureSpeechProvider({key:process.env.AZURE_SPEECH_KEY,region:process.env.AZURE_SPEECH_REGION,cacheDir:join(root,'public/generated-audio')});
const elevenLabs=createElevenLabsSpeechProvider({key:process.env.ELEVENLABS_API_KEY,cacheDir:join(root,'public/generated-audio')});
const storyboardDirector=createStoryboardDirector();
const assetsDir=join(root,'public/assets');
const mediaMeta=db.prepare('SELECT path,media_type AS type,bytes,credit,license,created_at AS createdAt,updated_at AS updatedAt FROM media_assets WHERE path=?');
const saveMediaMeta=db.prepare('INSERT INTO media_assets(path,media_type,bytes,created_at,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(path) DO NOTHING');
const updateMediaMeta=db.prepare('UPDATE media_assets SET credit=?,license=?,updated_at=? WHERE path=?');
const deleteMediaMeta=db.prepare('DELETE FROM media_assets WHERE path=?');
const projectRows=db.prepare('SELECT id,title,storyboard_json FROM projects WHERE storyboard_json IS NOT NULL');
const mediaTypeFor=(name)=>/\.(?:png|jpe?g|webp)$/i.test(name)?'image':/\.(?:mp4|mov|webm)$/i.test(name)?'video':null;
const referencesTo=(value,path)=>value===path?1:Array.isArray(value)?value.reduce((sum,item)=>sum+referencesTo(item,path),0):value&&typeof value==='object'?Object.values(value).reduce((sum,item)=>sum+referencesTo(item,path),0):0;
const listMedia=async()=>{let names=[];try{names=await readdir(assetsDir)}catch(e){if(e.code!=='ENOENT')throw e}const items=[];for(const name of names){if(!/^[a-f0-9-]+\.(?:png|jpe?g|webp|mp4|mov|webm)$/i.test(name))continue;const type=mediaTypeFor(name);if(!type)continue;const path=`assets/${name}`;const info=await stat(join(assetsDir,name));const now=new Date().toISOString();saveMediaMeta.run(path,type,info.size,now,now);const metadata=mediaMeta.get(path);const usageCount=projectRows.all().reduce((sum,row)=>sum+referencesTo(row.storyboard_json?JSON.parse(row.storyboard_json):null,path),0);items.push({...metadata,src:path,bytes:info.size,usageCount})}return items.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))};

const server = createServer(async (req,res) => {
  const origin=req.headers.origin;
  const originCheck=checkRequestOrigin(req.method||'',origin,allowedOrigins);
  if(!originCheck.ok){req.resume();return fail(res,originCheck.status,originCheck.code,originCheck.message)}
  if (req.method === 'OPTIONS') { if(!origin||!allowedOrigins.has(origin))return fail(res,403,'ORIGIN_DENIED','Origin is not allowed');res.writeHead(204, {'access-control-allow-origin':origin,'access-control-allow-methods':'GET,POST,PUT,DELETE,OPTIONS','access-control-allow-headers':'content-type','vary':'Origin'}); return res.end(); }
  const rawPath=(req.url||'/').split('?')[0];
  if(/%(?:2f|5c|00)/i.test(rawPath)||rawPath.includes('\\')){req.resume();return fail(res,400,'INVALID_PATH','Invalid route path',origin)}
  let url;try{url=new URL(req.url||'/', 'http://localhost')}catch{req.resume();return fail(res,400,'INVALID_PATH','Invalid route path',origin)}
  const params=rawPath.split('/');
  const routeProjectId=(raw)=>decodeRouteId(raw);
  try {
    let requestBody,uploadBytes;
    if(['POST','PUT','PATCH','DELETE'].includes(req.method||'')){
      if(req.method==='POST'&&rawPath==='/api/assets'&&String(req.headers['content-type']||'').toLowerCase().startsWith('image/'))uploadBytes=await consumeRequestBytes(req,15*1024*1024);
      else if(req.method==='POST'&&rawPath==='/api/video-assets'&&String(req.headers['content-type']||'').toLowerCase().startsWith('video/'))uploadBytes=await consumeRequestBytes(req,100*1024*1024);
      else if(String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))requestBody=await body(req);
      else if(Number(req.headers['content-length']||0)>0||req.headers['transfer-encoding'])await consumeRequestBody(req);
    }
    if (url.pathname === '/api/health') return send(res,200,{ok:true},origin);
    if(url.pathname==='/api/animation-presets'&&req.method==='GET'){
      const brandId=url.searchParams.get('brandId');
      const presets=(brandId?listAnimationPresets.all(brandId):db.prepare('SELECT p.id,p.brand_id AS brandId,p.name,p.category,p.description,p.renderer_key AS rendererKey,p.version,p.tags_json AS tagsJson,p.defaults_json AS defaultsJson,q.config_json AS configJson FROM animation_presets p LEFT JOIN animation_preset_quality_config q ON q.preset_id=p.id ORDER BY COALESCE(p.brand_id,\'\'),p.category,p.name').all()).map(preset=>({...JSON.parse(preset.configJson||'{}'),id:preset.id,brandId:preset.brandId,name:preset.name,category:preset.category,description:preset.description,rendererKey:preset.rendererKey,version:preset.version,tags:JSON.parse(preset.tagsJson),defaults:JSON.parse(preset.defaultsJson),tagsJson:undefined,defaultsJson:undefined,configJson:undefined}));
      return send(res,200,{presets},origin);
    }
    if(req.method==='GET'&&params.length===3&&params[1]==='assets'){
      const name=params[2];if(!/^[a-f0-9-]{36}\.(?:png|jpe?g|webp|mp4|mov|webm)$/i.test(name))return fail(res,404,'MEDIA_NOT_FOUND','Media asset not found',origin);
      const path=join(assetsDir,name);let info;try{info=await stat(path)}catch(error){if(error.code==='ENOENT')return fail(res,404,'MEDIA_NOT_FOUND','Media asset not found',origin);throw error}
      const extension=name.split('.').pop().toLowerCase(),contentType={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',mp4:'video/mp4',mov:'video/quicktime',webm:'video/webm'}[extension];
      let start=0,end=info.size-1,status=200;const range=req.headers.range;
      if(range){const match=/^bytes=(\d*)-(\d*)$/.exec(range);if(!match||(!match[1]&&!match[2])){res.writeHead(416,{'content-range':`bytes */${info.size}`,'cache-control':'no-store'});return res.end()}
        if(!match[1]){const suffix=Number(match[2]);start=Math.max(0,info.size-suffix)}else{start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),info.size-1):info.size-1}
        if(start>=info.size||start>end){res.writeHead(416,{'content-range':`bytes */${info.size}`,'cache-control':'no-store'});return res.end()}status=206;
      }
      const headers={'content-type':contentType,'content-length':String(end-start+1),'accept-ranges':'bytes','cache-control':'no-store','x-content-type-options':'nosniff'};if(status===206)headers['content-range']=`bytes ${start}-${end}/${info.size}`;res.writeHead(status,headers);const stream=createReadStream(path,{start,end});stream.on('error',()=>res.destroy());return stream.pipe(res);
    }
    if(url.pathname==='/api/storyboard/director'&&req.method==='GET')return send(res,200,{configured:storyboardDirector.configured,provider:storyboardDirector.provider},origin);
    if(url.pathname==='/api/storyboard/director'&&req.method==='POST'){
      if(!requestBody)return fail(res,400,'INVALID_DIRECTOR_REQUEST','A JSON storyboard request is required',origin);
      try{return send(res,200,{plan:await storyboardDirector.generate(requestBody)},origin)}
      catch(error){return fail(res,error.status||400,error.code||'INVALID_DIRECTOR_REQUEST',error.message||'Storyboard generation failed',origin)}
    }
    if(url.pathname==='/api/media'&&req.method==='GET')return send(res,200,{assets:await listMedia()},origin);
    if(url.pathname==='/api/assets'&&req.method==='GET')return send(res,200,{assets:(await listMedia()).filter(asset=>asset.type==='image').map(asset=>({src:asset.path}))},origin);
    if(url.pathname==='/api/video-assets'&&req.method==='GET')return send(res,200,{assets:(await listMedia()).filter(asset=>asset.type==='video').map(asset=>({src:asset.path}))},origin);
    if(params.length===4&&params[1]==='api'&&params[2]==='media'&&['PUT','DELETE'].includes(req.method||'')){
      const name=params[3];if(!/^[a-f0-9-]{36}\.(?:png|jpe?g|webp|mp4|mov|webm)$/i.test(name))return fail(res,400,'INVALID_MEDIA_ID','Invalid media filename',origin);
      const path=`assets/${name}`;let info;try{info=await stat(join(assetsDir,name))}catch(e){if(e.code==='ENOENT')return fail(res,404,'MEDIA_NOT_FOUND','Media asset not found',origin);throw e}
      if(req.method==='PUT'){
        const credit=requestBody?.credit,license=requestBody?.license;if(typeof credit!=='string'||credit.length>1000||typeof license!=='string'||license.length>500)return fail(res,400,'INVALID_MEDIA_METADATA','Credit must be up to 1,000 characters and license up to 500 characters',origin);
        const now=new Date().toISOString();saveMediaMeta.run(path,mediaTypeFor(name),info.size,now,now);updateMediaMeta.run(credit.trim(),license.trim(),now,path);return send(res,200,{asset:mediaMeta.get(path)},origin)
      }
      const users=[];for(const row of projectRows.all()){const count=referencesTo(row.storyboard_json?JSON.parse(row.storyboard_json):null,path);if(count)users.push({id:row.id,title:row.title,references:count})}
      if(users.length)return send(res,409,{error:{code:'MEDIA_IN_USE',message:'Remove or replace this asset in the listed project scenes before deleting it',projects:users}},origin);
      await unlink(join(assetsDir,name));deleteMediaMeta.run(path);return send(res,200,{ok:true,path},origin)
    }
    if(url.pathname==='/api/assets'&&req.method==='POST'){
      if(!uploadBytes?.length)return fail(res,400,'EMPTY_IMAGE','Choose a non-empty PNG, JPEG, or WebP image',origin);
      let extension;if(uploadBytes.length>=8&&uploadBytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))extension='png';else if(uploadBytes.length>=3&&uploadBytes[0]===0xff&&uploadBytes[1]===0xd8&&uploadBytes[2]===0xff)extension='jpg';else if(uploadBytes.length>=12&&uploadBytes.toString('ascii',0,4)==='RIFF'&&uploadBytes.toString('ascii',8,12)==='WEBP')extension='webp';else return fail(res,415,'UNSUPPORTED_IMAGE','Only valid PNG, JPEG, and WebP images are supported',origin);
      await mkdir(assetsDir,{recursive:true});const name=`${randomUUID()}.${extension}`;await writeFile(join(assetsDir,name),uploadBytes,{flag:'wx'});const now=new Date().toISOString();saveMediaMeta.run(`assets/${name}`,'image',uploadBytes.length,now,now);return send(res,201,{asset:{src:`assets/${name}`,bytes:uploadBytes.length}},origin);
    }
    if(url.pathname==='/api/video-assets'&&req.method==='POST'){
      if(!uploadBytes?.length)return fail(res,400,'EMPTY_VIDEO','Choose a non-empty MP4, MOV, or WebM video',origin);
      let extension;if(uploadBytes.length>=12&&uploadBytes.toString('ascii',4,8)==='ftyp')extension=uploadBytes.toString('ascii',8,12)==='qt  '?'mov':'mp4';else if(uploadBytes.length>=4&&uploadBytes.readUInt32BE(0)===0x1a45dfa3)extension='webm';else return fail(res,415,'UNSUPPORTED_VIDEO','Only valid MP4, MOV, and WebM video files are supported',origin);
      await mkdir(assetsDir,{recursive:true});const name=`${randomUUID()}.${extension}`;await writeFile(join(assetsDir,name),uploadBytes,{flag:'wx'});const now=new Date().toISOString();saveMediaMeta.run(`assets/${name}`,'video',uploadBytes.length,now,now);return send(res,201,{asset:{src:`assets/${name}`,bytes:uploadBytes.length}},origin);
    }
    if(url.pathname==='/api/speech/status'&&req.method==='GET')return send(res,200,{providers:[{id:'azure',name:'Azure Speech',configured:speech.enabled,voices:bnBdVoices,models:[{id:'azure-neural',name:'Azure Neural'}]},{id:'elevenlabs',name:'ElevenLabs',configured:elevenLabs.enabled,voices:[],models:[]} ]},origin);
    if(url.pathname==='/api/speech/catalog'&&req.method==='GET'){const provider=url.searchParams.get('provider');if(provider==='elevenlabs')return send(res,200,await elevenLabs.catalog(),origin);if(provider==='azure')return send(res,200,{voices:bnBdVoices,models:[{id:'azure-neural',name:'Azure Neural'}]},origin);return fail(res,400,'INVALID_PROVIDER','Select Azure or ElevenLabs',origin)}
    if(url.pathname==='/api/speech/test'&&req.method==='POST'){const provider=requestBody?.provider;if(provider==='elevenlabs'){const catalog=await elevenLabs.catalog();return send(res,200,{ok:true,provider,voiceCount:catalog.voices.length,modelCount:catalog.models.length},origin)}if(provider==='azure'){if(!speech.enabled)throw Object.assign(new Error('Azure Speech is not configured'),{code:'SPEECH_NOT_CONFIGURED'});await speech.synthesize('বাংলাদেশের গল্প।','bn-BD-NabanitaNeural',{cache:false});return send(res,200,{ok:true,provider},origin)}return fail(res,400,'INVALID_PROVIDER','Select Azure or ElevenLabs',origin)}
    if(url.pathname==='/api/speech/preview'&&req.method==='POST'){
      const data=requestBody,provider=data?.provider||'azure';if(typeof data?.text!=='string'||!data.text.trim()||data.text.length>1000)return fail(res,400,'INVALID_SPEECH_REQUEST','Provide up to 1,000 characters',origin);
      if(provider==='elevenlabs'){if(!data.voice||!data.model)return fail(res,400,'INVALID_SPEECH_REQUEST','Select an ElevenLabs voice and model',origin);const result=await elevenLabs.synthesize(data.text,data.voice,data.model,{cache:false});res.writeHead(200,{'content-type':'audio/mpeg','cache-control':'no-store','vary':'Origin'});return res.end(result.audio)}
      if(provider!=='azure'||!bnBdVoices.some(v=>v.id===data.voice))return fail(res,422,'VOICE_NOT_SUPPORTED','Select a supported voice for the selected provider',origin);
      const result=await speech.synthesize(data.text,data.voice,{cache:false});res.writeHead(200,{'content-type':'audio/wav','cache-control':'no-store','vary':'Origin'});return res.end(result.audio);
    }
    if (url.pathname === '/api/projects' && req.method === 'GET') return send(res,200,list.all().map(decode),origin);
    if (url.pathname === '/api/projects' && req.method === 'POST') return send(res,201,persist(requestBody),origin);
    if(params.length===4&&params[1]==='api'&&params[2]==='projects'&&['PUT','DELETE'].includes(req.method||'')){
      const id=routeProjectId(params[3]);if(!id)return fail(res,400,'INVALID_PROJECT_ID','Invalid project ID',origin);
      if(req.method==='PUT'){const project=persist({...requestBody,id});return send(res,200,project,origin)}
      remove.run(id);return send(res,200,{ok:true},origin);
    }
    if(params.length===5&&params[1]==='api'&&params[2]==='projects'&&params[4]==='render'&&req.method==='POST'){
      const id=routeProjectId(params[3]);if(!id)return fail(res,400,'INVALID_PROJECT_ID','Invalid project ID',origin);
      const project=decode(get.get(id));if(!project)return fail(res,404,'PROJECT_NOT_FOUND','Project not found',origin);
      if(!project.storyboard?.scenes?.length)return fail(res,409,'STORYBOARD_REQUIRED','Prepare a storyboard before rendering',origin);
      const incompleteChart=project.storyboard.scenes.some(scene=>scene.sceneType==='data-chart'&&(!scene.chartData||scene.chartData.points.length<2||scene.chartData.points.some(point=>!point.label.trim())||!scene.chartData.source.trim()));
      if(incompleteChart)return fail(res,409,'CHART_DATA_INCOMPLETE','Add at least two labeled values and a source to every data chart before rendering',origin);
      const incompleteHistory=project.storyboard.scenes.some(scene=>scene.sceneType==='history-timeline'&&(!scene.historyData||scene.historyData.events.length<2||scene.historyData.events.some(event=>!event.date.trim()||!event.title.trim()||!event.source.trim())));
      if(incompleteHistory)return fail(res,409,'HISTORY_DATA_INCOMPLETE','Add at least two dated events with titles and citations to every history timeline before rendering',origin);
      if(project.status!=='Storyboard approved'||project.storyboard.scenes.some(scene=>scene.approvalStatus!=='approved'))return fail(res,409,'STORYBOARD_NOT_APPROVED','Approve every scene and the storyboard before rendering',origin);
      const now=new Date().toISOString(),jobId=randomUUID();createJob.run(jobId,id,now,now);return send(res,202,{job:getJob.get(jobId)},origin);
    }
    if(params.length===7&&params[1]==='api'&&params[2]==='projects'&&params[4]==='scenes'&&params[6]==='audio'&&req.method==='POST'){
      const id=routeProjectId(params[3]),sceneId=routeProjectId(params[5]);if(!id||!sceneId)return fail(res,400,'INVALID_SCENE_ID','Invalid project or scene ID',origin);
      const project=decode(get.get(id));if(!project)return fail(res,404,'PROJECT_NOT_FOUND','Project not found',origin);if(!project.storyboard)return fail(res,409,'STORYBOARD_REQUIRED','Prepare a storyboard first',origin);
      const data=requestBody||{},provider=data.provider||'azure',voice=data.voice||(provider==='azure'?'bn-BD-NabanitaNeural':'');if(provider!=='azure'&&provider!=='elevenlabs')return fail(res,422,'INVALID_PROVIDER','Select Azure or ElevenLabs',origin);
      const scene=project.storyboard.scenes.find(item=>item.id===sceneId);if(!scene)return fail(res,404,'SCENE_NOT_FOUND','Scene not found',origin);if(!scene.narration.trim())return fail(res,422,'NARRATION_REQUIRED','Add scene narration before generating speech',origin);
      const model=provider==='azure'?'azure-neural':data.model;if(provider==='azure'&&!bnBdVoices.some(v=>v.id===voice))return fail(res,422,'VOICE_NOT_SUPPORTED','Select a supported Azure voice',origin);if(provider==='elevenlabs'&&(!voice||!model))return fail(res,422,'INVALID_SPEECH_REQUEST','Select an ElevenLabs voice and model',origin);
      const result=provider==='azure'?await speech.synthesize(scene.narration,voice,{model}):await elevenLabs.synthesize(scene.narration,voice,model);const durationSeconds=result.durationSeconds,extension=provider==='azure'?'wav':'mp3';
      const scenes=project.storyboard.scenes.map(item=>item.id===sceneId?{...item,approvalStatus:'draft',estimatedDurationSeconds:Math.max(item.estimatedDurationSeconds,durationSeconds),audio:{src:`generated-audio/${result.cacheKey}.${extension}`,durationSeconds,voice:result.voice,provider,model,cacheKey:result.cacheKey}}:item);
      const saved=persist({...project,status:'Storyboard draft',updatedAt:new Date().toISOString(),storyboard:{...project.storyboard,scenes,targetDurationSeconds:scenes.reduce((total,item)=>total+Math.max(item.estimatedDurationSeconds,item.audio?.durationSeconds??0),0)}});
      return send(res,200,{project:saved,audio:{cached:result.cached,durationSeconds,voice,provider,model}},origin);
    }
    if(params.length===5&&params[1]==='api'&&params[2]==='projects'&&params[4]==='render-jobs'&&req.method==='GET'){
      const id=routeProjectId(params[3]);if(!id)return fail(res,400,'INVALID_PROJECT_ID','Invalid project ID',origin);
      if(!get.get(id))return fail(res,404,'PROJECT_NOT_FOUND','Project not found',origin);
      return send(res,200,projectJobs.all(id).map(job=>({...job,metadata:job.metadata?JSON.parse(job.metadata):null,cancelRequested:Boolean(job.cancelRequested)})),origin);
    }
    if(params.length===4&&params[1]==='api'&&params[2]==='render-jobs'&&req.method==='GET'){
      const id=routeProjectId(params[3]);if(!id)return fail(res,400,'INVALID_RENDER_JOB_ID','Invalid render job ID',origin);
      const job=getJob.get(id);if(!job)return fail(res,404,'RENDER_JOB_NOT_FOUND','Render job not found',origin);
      return send(res,200,{...job,metadata:job.metadata?JSON.parse(job.metadata):null,cancelRequested:Boolean(job.cancelRequested)},origin);
    }
    if(params.length===5&&params[1]==='api'&&params[2]==='render-jobs'&&req.method==='POST'&&params[4]==='retry'){
      const id=routeProjectId(params[3]);if(!id)return fail(res,400,'INVALID_RENDER_JOB_ID','Invalid render job ID',origin);
      const now=new Date().toISOString();if(!retryJob.run(now,id).changes)return fail(res,409,'RETRY_NOT_AVAILABLE','Only failed jobs can be retried',origin);
      return send(res,202,{...getJob.get(id),metadata:null,cancelRequested:false},origin);
    }
    if(params.length===4&&params[1]==='api'&&params[2]==='render-jobs'&&req.method==='DELETE'){
      const id=routeProjectId(params[3]);if(!id)return fail(res,400,'INVALID_RENDER_JOB_ID','Invalid render job ID',origin);
      const now=new Date().toISOString();const queued=cancelQueued.run(now,now,id).changes;if(!queued){const running=requestCancel.run(now,id).changes;if(!running){const job=getJob.get(id);if(!job)return fail(res,404,'RENDER_JOB_NOT_FOUND','Render job not found',origin);return fail(res,409,'CANCEL_NOT_AVAILABLE','Render job is already finished',origin)}worker.send({type:'cancel',jobId:id})}
      return send(res,202,{...getJob.get(id),metadata:null,cancelRequested:true},origin);
    }
    if(params.length===4&&params[1]==='api'&&params[2]==='renders'&&req.method==='GET'){
      const id=routeProjectId(params[3]);if(!id)return fail(res,400,'INVALID_RENDER_ID','Invalid render ID',origin);
      const job=getJob.get(id);const output=job?.outputPath?resolve(job.outputPath):resolve(root,'out',id,'video.mp4');if(!isSafeRenderPath(resolve(root,'out'),output))return fail(res,400,'INVALID_RENDER_ID','Invalid render ID',origin);
      if(!existsSync(output))return fail(res,404,'RENDER_NOT_FOUND','Render not found',origin);const headers={'content-type':'video/mp4','content-disposition':'attachment; filename="video.mp4"','cache-control':'no-store','vary':'Origin'};if(origin&&allowedOrigins.has(origin))headers['access-control-allow-origin']=origin;res.writeHead(200,headers);return createReadStream(output).pipe(res);
    }
    return fail(res,404,'NOT_FOUND','Route not found',origin);
  } catch (error) {if(error?.code&&error?.status)return fail(res,error.status,error.code,error.message,origin);if(error?.code==='SPEECH_NOT_CONFIGURED')return fail(res,503,error.code,'Configure provider credentials in the local server environment',origin);if(error?.code==='VOICE_NOT_SUPPORTED')return fail(res,422,error.code,'Select a supported voice for the selected provider',origin);if(error?.code==='SPEECH_QUOTA_LIMIT')return fail(res,429,error.code,error.message,origin);if(error?.code==='SPEECH_PROVIDER_ERROR')return fail(res,502,error.code,error.message||'Speech provider request failed; check configuration and try again',origin);console.error('Local API request failed:',error);return fail(res,500,'INTERNAL_ERROR','The local request could not be completed',origin);}
});
const port = Number(process.env.CIPHERTEXT_API_PORT || 4174);
server.listen(port,'127.0.0.1',()=>console.log(`CipherText API listening on http://127.0.0.1:${port}`));
const shutdown=()=>{if(shuttingDown)return;shuttingDown=true;if(worker?.connected&&worker.exitCode===null)worker.send({type:'shutdown'},()=>{});db.close();server.close();};
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
