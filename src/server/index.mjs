import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {spawn} from 'node:child_process';
import {createReadStream} from 'node:fs';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {join, dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {projectSchema,decodeRouteId} from './validation.mjs';
import {checkRequestOrigin,isSafeRenderPath,parseJsonBody,consumeRequestBody} from './security.mjs';
import {createAzureSpeechProvider,bnBdVoices} from './azureSpeech.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
try{process.loadEnvFile(join(root,'.env'))}catch{}
const dataDir = resolve(process.env.CIPHERTEXT_DATA_DIR || join(root, 'data'));
const dbPath = join(dataDir, 'ciphertext.sqlite');
await mkdir(dataDir, {recursive: true});
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
db.exec(await readFile(join(root, 'migrations/001_projects.sql'), 'utf8'));
db.exec(await readFile(join(root, 'migrations/002_render_jobs.sql'), 'utf8'));

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
  const parsed=projectSchema.safeParse(p);if(!parsed.success)throw Object.assign(new Error('Project validation failed'),{status:400,code:'INVALID_PROJECT'});p=parsed.data;
  put.run(p.id,p.brandId,p.title,p.language,p.format,p.script,p.scriptApproved?1:0,String(p.status || 'Script draft'),p.updatedAt || new Date().toISOString(),p.storyboard ? JSON.stringify(p.storyboard) : null);
  return decode(get.get(p.id));
};
let worker,shuttingDown=false;
const startWorker=()=>{worker=spawn(process.execPath,[join(root,'src/server/render-worker.mjs')],{cwd:root,stdio:['ignore','inherit','inherit','ipc']});worker.on('error',error=>console.error('Render worker process error:',error.message));worker.on('exit',code=>{if(shuttingDown)return;console.error(`Render worker exited (${code}); restarting it`);setTimeout(startWorker,500)})};
startWorker();
const speech=createAzureSpeechProvider({key:process.env.AZURE_SPEECH_KEY,region:process.env.AZURE_SPEECH_REGION,cacheDir:join(root,'public/generated-audio')});
const voiceIds=new Set(bnBdVoices.map(voice=>voice.id));

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
    let requestBody;
    if(['POST','PUT','PATCH','DELETE'].includes(req.method||'')){
      if(String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))requestBody=await body(req);
      else if(Number(req.headers['content-length']||0)>0||req.headers['transfer-encoding'])await consumeRequestBody(req);
    }
    if (url.pathname === '/api/health') return send(res,200,{ok:true},origin);
    if(url.pathname==='/api/speech/status'&&req.method==='GET')return send(res,200,{configured:speech.enabled,provider:speech.id,voices:bnBdVoices},origin);
    if(url.pathname==='/api/speech/preview'&&req.method==='POST'){
      const data=requestBody;if(typeof data?.text!=='string'||!data.text.trim()||data.text.length>1000||!voiceIds.has(data.voice))return fail(res,400,'INVALID_SPEECH_REQUEST','Provide up to 1,000 characters and a supported bn-BD voice',origin);
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
      const now=new Date().toISOString(),jobId=randomUUID();createJob.run(jobId,id,now,now);return send(res,202,{job:getJob.get(jobId)},origin);
    }
    if(params.length===7&&params[1]==='api'&&params[2]==='projects'&&params[4]==='scenes'&&params[6]==='audio'&&req.method==='POST'){
      const id=routeProjectId(params[3]),sceneId=routeProjectId(params[5]);if(!id||!sceneId)return fail(res,400,'INVALID_SCENE_ID','Invalid project or scene ID',origin);
      const project=decode(get.get(id));if(!project)return fail(res,404,'PROJECT_NOT_FOUND','Project not found',origin);if(!project.storyboard)return fail(res,409,'STORYBOARD_REQUIRED','Prepare a storyboard first',origin);
      const data=requestBody||{},voice=data.voice||'bn-BD-NabanitaNeural';if(!voiceIds.has(voice))return fail(res,422,'VOICE_NOT_SUPPORTED','Select a supported bn-BD voice',origin);
      const scene=project.storyboard.scenes.find(item=>item.id===sceneId);if(!scene)return fail(res,404,'SCENE_NOT_FOUND','Scene not found',origin);if(!scene.narration.trim())return fail(res,422,'NARRATION_REQUIRED','Add scene narration before generating speech',origin);
      const result=await speech.synthesize(scene.narration,voice);const durationSeconds=result.durationSeconds;
      const scenes=project.storyboard.scenes.map(item=>item.id===sceneId?{...item,estimatedDurationSeconds:Math.max(item.estimatedDurationSeconds,durationSeconds),audio:{src:`generated-audio/${result.cacheKey}.wav`,durationSeconds,voice:result.voice,cacheKey:result.cacheKey}}:item);
      const saved=persist({...project,updatedAt:new Date().toISOString(),storyboard:{...project.storyboard,scenes,targetDurationSeconds:scenes.reduce((total,item)=>total+Math.max(item.estimatedDurationSeconds,item.audio?.durationSeconds??0),0)}});
      return send(res,200,{project:saved,audio:{cached:result.cached,durationSeconds,voice}},origin);
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
  } catch (error) {if(error?.code&&error?.status)return fail(res,error.status,error.code,error.message,origin);if(error?.code==='SPEECH_NOT_CONFIGURED')return fail(res,503,error.code,'Configure AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in the local server environment',origin);if(error?.code==='VOICE_NOT_SUPPORTED')return fail(res,422,error.code,'Select a supported bn-BD voice',origin);if(error?.code==='SPEECH_PROVIDER_ERROR')return fail(res,502,error.code,'Azure Speech synthesis failed; check service configuration and try again',origin);console.error('Local API request failed:',error);return fail(res,500,'INTERNAL_ERROR','The local request could not be completed',origin);}
});
const port = Number(process.env.CIPHERTEXT_API_PORT || 4174);
server.listen(port,'127.0.0.1',()=>console.log(`CipherText API listening on http://127.0.0.1:${port}`));
const shutdown=()=>{if(shuttingDown)return;shuttingDown=true;if(worker?.connected&&worker.exitCode===null)worker.send({type:'shutdown'},()=>{});db.close();server.close();};
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
