import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {spawn} from 'node:child_process';
import {createReadStream} from 'node:fs';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {join, dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {projectSchema,decodeRouteId} from './validation.mjs';
import {checkRequestOrigin,isSafeRenderPath} from './security.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const dataDir = resolve(process.env.CIPHERTEXT_DATA_DIR || join(root, 'data'));
const dbPath = join(dataDir, 'ciphertext.sqlite');
await mkdir(dataDir, {recursive: true});
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
const migration = await readFile(join(root, 'migrations/001_projects.sql'), 'utf8');
db.exec(migration);

const fields = 'id, brand_id AS brandId, title, language, format, script, script_approved AS scriptApproved, status, updated_at AS updatedAt, storyboard_json AS storyboard';
const decode = (row) => row && ({...row, scriptApproved: Boolean(row.scriptApproved), storyboard: row.storyboard ? JSON.parse(row.storyboard) : undefined});
const list = db.prepare(`SELECT ${fields} FROM projects ORDER BY updated_at DESC`);
const get = db.prepare(`SELECT ${fields} FROM projects WHERE id=?`);
const put = db.prepare(`INSERT INTO projects(id,brand_id,title,language,format,script,script_approved,status,updated_at,storyboard_json) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET brand_id=excluded.brand_id,title=excluded.title,language=excluded.language,format=excluded.format,script=excluded.script,script_approved=excluded.script_approved,status=excluded.status,updated_at=excluded.updated_at,storyboard_json=excluded.storyboard_json`);
const remove = db.prepare('DELETE FROM projects WHERE id=?');
const defaultOrigins=['http://127.0.0.1:5173','http://localhost:5173','http://127.0.0.1:4173','http://localhost:4173'];
const allowedOrigins=new Set((process.env.CIPHERTEXT_FRONTEND_ORIGINS||defaultOrigins.join(',')).split(',').map(x=>x.trim()).filter(Boolean));
for(const origin of allowedOrigins){let parsed;try{parsed=new URL(origin)}catch{throw new Error('Invalid CIPHERTEXT_FRONTEND_ORIGINS entry')};if(!['http:','https:'].includes(parsed.protocol)||!['localhost','127.0.0.1','[::1]'].includes(parsed.hostname))throw new Error('Frontend origins must be local loopback origins')}
const send = (res, status, data, origin) => { const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','vary':'Origin'};if(origin&&allowedOrigins.has(origin))headers['access-control-allow-origin']=origin;res.writeHead(status,headers);res.end(JSON.stringify(data)); };
const fail = (res,status,code,message,origin)=>send(res,status,{error:{code,message}},origin);
const body = async (req) => { if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))throw Object.assign(new Error('Expected application/json'),{status:415,code:'UNSUPPORTED_MEDIA_TYPE'});let raw='',size=0;for await(const chunk of req){size+=chunk.length;if(size>2*1024*1024)throw Object.assign(new Error('Request body exceeds the 2 MiB limit'),{status:413,code:'BODY_TOO_LARGE'});raw+=chunk.toString('utf8')}try{return JSON.parse(raw||'{}')}catch{throw Object.assign(new Error('Malformed JSON body'),{status:400,code:'INVALID_JSON'})} };
const persist = (p) => {
  const parsed=projectSchema.safeParse(p);if(!parsed.success)throw Object.assign(new Error('Project validation failed'),{status:400,code:'INVALID_PROJECT'});p=parsed.data;
  put.run(p.id,p.brandId,p.title,p.language,p.format,p.script,p.scriptApproved?1:0,String(p.status || 'Script draft'),p.updatedAt || new Date().toISOString(),p.storyboard ? JSON.stringify(p.storyboard) : null);
  return decode(get.get(p.id));
};
const runRender = (project) => new Promise((resolveRun, reject) => {
  if (!project.storyboard?.scenes?.length) return reject(new Error('Prepare a storyboard before rendering.'));
  const videoProps = {brandId:project.brandId,title:project.title,format:project.format,storyboard:project.storyboard};
  const propsPath = join(dataDir, `${project.id}.render-props.json`);
  const outputDir = join(root, 'out', project.id);
  const outputPath = join(outputDir, 'video.mp4');
  mkdir(outputDir, {recursive:true}).then(() => writeFile(propsPath, JSON.stringify(videoProps))).then(() => {
    const cli = join(root, 'node_modules/.bin/remotion');
    const child = spawn(cli, ['render','src/video/index.tsx','CipherTextProject',outputPath,`--props=${propsPath}`], {cwd:root,stdio:['ignore','pipe','pipe']});
    let stderr=''; child.stderr.on('data', chunk => stderr += chunk.toString()); child.stdout.on('data', chunk => stderr += chunk.toString());
    child.on('error', reject); child.on('exit', code => code === 0 ? resolveRun({path:outputPath}) : reject(new Error(stderr.slice(-5000) || `Renderer exited with ${code}`)));
  }).catch(reject);
});

const server = createServer(async (req,res) => {
  const origin=req.headers.origin;
  const originCheck=checkRequestOrigin(req.method||'',origin,allowedOrigins);
  if(!originCheck.ok)return fail(res,originCheck.status,originCheck.code,originCheck.message);
  if (req.method === 'OPTIONS') { if(!origin||!allowedOrigins.has(origin))return fail(res,403,'ORIGIN_DENIED','Origin is not allowed');res.writeHead(204, {'access-control-allow-origin':origin,'access-control-allow-methods':'GET,POST,PUT,DELETE,OPTIONS','access-control-allow-headers':'content-type','vary':'Origin'}); return res.end(); }
  const rawPath=(req.url||'/').split('?')[0];
  if(/%(?:2f|5c|00)/i.test(rawPath)||rawPath.includes('\\'))return fail(res,400,'INVALID_PATH','Invalid route path',origin);
  let url;try{url=new URL(req.url||'/', 'http://localhost')}catch{return fail(res,400,'INVALID_PATH','Invalid route path',origin)}
  const params=rawPath.split('/');
  const routeProjectId=(raw)=>decodeRouteId(raw);
  try {
    if (url.pathname === '/api/health') return send(res,200,{ok:true},origin);
    if (url.pathname === '/api/projects' && req.method === 'GET') return send(res,200,list.all().map(decode),origin);
    if (url.pathname === '/api/projects' && req.method === 'POST') return send(res,201,persist(await body(req)),origin);
    if(params.length===4&&params[1]==='api'&&params[2]==='projects'&&['PUT','DELETE'].includes(req.method||'')){
      const id=routeProjectId(params[3]);if(!id)return fail(res,400,'INVALID_PROJECT_ID','Invalid project ID',origin);
      if(req.method==='PUT'){const project=persist({...await body(req),id});return send(res,200,project,origin)}
      remove.run(id);return send(res,200,{ok:true},origin);
    }
    if(params.length===5&&params[1]==='api'&&params[2]==='projects'&&params[4]==='render'&&req.method==='POST'){
      const id=routeProjectId(params[3]);if(!id)return fail(res,400,'INVALID_PROJECT_ID','Invalid project ID',origin);
      const project=decode(get.get(id));if(!project)return fail(res,404,'PROJECT_NOT_FOUND','Project not found',origin);
      const result=await runRender(project);return send(res,200,{...result,url:`/api/renders/${encodeURIComponent(project.id)}`},origin);
    }
    if(params.length===4&&params[1]==='api'&&params[2]==='renders'&&req.method==='GET'){
      const id=routeProjectId(params[3]);if(!id)return fail(res,400,'INVALID_RENDER_ID','Invalid render ID',origin);
      const output=resolve(root,'out',id,'video.mp4');if(!isSafeRenderPath(resolve(root,'out'),output))return fail(res,400,'INVALID_RENDER_ID','Invalid render ID',origin);
      if(!existsSync(output))return fail(res,404,'RENDER_NOT_FOUND','Render not found',origin);res.writeHead(200,{'content-type':'video/mp4','content-disposition':'attachment; filename="video.mp4"','cache-control':'no-store'});return createReadStream(output).pipe(res);
    }
    return fail(res,404,'NOT_FOUND','Route not found',origin);
  } catch (error) {if(error?.code&&error?.status)return fail(res,error.status,error.code,error.message,origin);if(error?.code==='INVALID_PROJECT')return fail(res,400,'INVALID_PROJECT','Project data is invalid',origin);console.error('Local API request failed:',error);return fail(res,500,'INTERNAL_ERROR','The local request could not be completed',origin);}
});
const port = Number(process.env.CIPHERTEXT_API_PORT || 4174);
server.listen(port,'127.0.0.1',()=>console.log(`CipherText API listening on http://127.0.0.1:${port}`));
process.on('SIGTERM',()=>{db.close();server.close();});
