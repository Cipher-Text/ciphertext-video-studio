import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {spawn} from 'node:child_process';
import {createReadStream} from 'node:fs';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {join, dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

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
const send = (res, status, data) => { res.writeHead(status, {'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*'}); res.end(JSON.stringify(data)); };
const body = async (req) => { let raw=''; for await (const chunk of req) raw += chunk; return JSON.parse(raw || '{}'); };
const persist = (p) => {
  if (!p || typeof p.id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(p.id) || typeof p.title !== 'string' || !p.title.trim() || !['bengal-unfolded','factlens','kalokhata','delta-signal','open-care','ciphertext-labs'].includes(p.brandId) || !['en','bn'].includes(p.language) || !['landscape','portrait','square'].includes(p.format) || typeof p.script !== 'string') throw new Error('Invalid project');
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
  if (req.method === 'OPTIONS') { res.writeHead(204, {'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,PUT,DELETE,OPTIONS','access-control-allow-headers':'content-type'}); return res.end(); }
  const url = new URL(req.url || '/', 'http://localhost');
  try {
    if (url.pathname === '/api/health') return send(res,200,{ok:true,database:dbPath});
    if (url.pathname === '/api/projects' && req.method === 'GET') return send(res,200,list.all().map(decode));
    if (url.pathname === '/api/projects' && req.method === 'POST') return send(res,201,persist(await body(req)));
    const match = url.pathname.match(/^\/api\/projects\/([^/]+)$/);
    if (match && req.method === 'PUT') { const project=persist({...await body(req),id:decodeURIComponent(match[1])}); return send(res,200,project); }
    if (match && req.method === 'DELETE') { remove.run(decodeURIComponent(match[1])); return send(res,200,{ok:true}); }
    const renderMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/render$/);
    if (renderMatch && req.method === 'POST') { const project=decode(get.get(decodeURIComponent(renderMatch[1]))); if (!project) return send(res,404,{error:'Project not found'}); const result=await runRender(project); return send(res,200,{...result,url:`/api/renders/${encodeURIComponent(project.id)}`}); }
    const fileMatch=url.pathname.match(/^\/api\/renders\/([^/]+)$/);
    if(fileMatch&&req.method==='GET'){const output=join(root,'out',decodeURIComponent(fileMatch[1]),'video.mp4');if(!existsSync(output))return send(res,404,{error:'Render not found'});res.writeHead(200,{'content-type':'video/mp4','content-disposition':'attachment; filename="video.mp4"'});return createReadStream(output).pipe(res);}
    return send(res,404,{error:'Not found'});
  } catch (error) { return send(res, error.message==='Invalid project'?400:500, {error:error.message || 'Server error'}); }
});
const port = Number(process.env.CIPHERTEXT_API_PORT || 4174);
server.listen(port,'127.0.0.1',()=>console.log(`CipherText API listening on http://127.0.0.1:${port}`));
process.on('SIGTERM',()=>{db.close();server.close();});
