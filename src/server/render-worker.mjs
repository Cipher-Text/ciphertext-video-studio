import {DatabaseSync} from 'node:sqlite';
import {spawn} from 'node:child_process';
import {mkdir,readFile,stat,open,writeFile} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {failureStatus,recoverInterruptedJobs} from './renderJobs.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const dataDir=resolve(process.env.CIPHERTEXT_DATA_DIR||join(root,'data'));
await mkdir(dataDir,{recursive:true});
const db=new DatabaseSync(join(dataDir,'ciphertext.sqlite'));
db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
db.exec(await readFile(join(root,'migrations/001_projects.sql'),'utf8'));
db.exec(await readFile(join(root,'migrations/002_render_jobs.sql'),'utf8'));
db.exec(await readFile(join(root,'migrations/004_animation_presets.sql'),'utf8'));
recoverInterruptedJobs(db,new Date().toISOString());
const nextJob=db.prepare("SELECT j.*,p.brand_id AS brandId,p.title,p.format,p.storyboard_json AS storyboard FROM render_jobs j JOIN projects p ON p.id=j.project_id WHERE j.status='queued' ORDER BY j.created_at LIMIT 1");
const update=db.prepare('UPDATE render_jobs SET status=?,progress=?,attempt=?,updated_at=?,started_at=COALESCE(started_at,?),finished_at=?,output_path=?,metadata_json=?,error_code=?,error_message=? WHERE id=?');
const get=db.prepare('SELECT * FROM render_jobs WHERE id=?');
let active=null,stopped=false;

function readBoxes(buffer,start=0,end=buffer.length){const boxes=[];for(let offset=start;offset+8<=end;){let size=buffer.readUInt32BE(offset);const type=buffer.toString('ascii',offset+4,offset+8);let header=8;if(size===1){if(offset+16>end)break;size=Number(buffer.readBigUInt64BE(offset+8));header=16}else if(size===0)size=end-offset;if(size<header||offset+size>end)break;boxes.push({type,start:offset,dataStart:offset+header,end:offset+size,size});offset+=size}return boxes}
async function inspectMp4(path){
  const handle=await open(path,'r');try{
    const {size:fileSize}=await handle.stat();let offset=0,moov=null,ftyp=false;
    while(offset+8<fileSize){const head=Buffer.alloc(16);const {bytesRead}=await handle.read(head,0,16,offset);if(bytesRead<8)break;let size=head.readUInt32BE(0);const type=head.toString('ascii',4,8);let header=8;if(size===1){size=Number(head.readBigUInt64BE(8));header=16}else if(size===0)size=fileSize-offset;if(size<header||offset+size>fileSize)throw new Error('Corrupt MP4 box bounds');if(type==='ftyp')ftyp=true;if(type==='moov'){if(size>32*1024*1024)throw new Error('MP4 metadata box is unexpectedly large');moov=Buffer.alloc(size);await handle.read(moov,0,size,offset);break}offset+=size;}
    if(!ftyp||!moov)throw new Error('MP4 is missing required ftyp or moov metadata');
    let movieDurationSeconds=null;const children=readBoxes(moov,8);const mvhd=children.find(x=>x.type==='mvhd');
    if(mvhd){const version=moov[mvhd.dataStart];const timescaleOffset=mvhd.dataStart+(version===1?20:12);const durationOffset=mvhd.dataStart+(version===1?24:16);const timescale=moov.readUInt32BE(timescaleOffset);const duration=version===1?Number(moov.readBigUInt64BE(durationOffset)):moov.readUInt32BE(durationOffset);if(timescale)movieDurationSeconds=duration/timescale}
    const streams=[];
    for(const trak of children.filter(x=>x.type==='trak')){const trakBoxes=readBoxes(moov,trak.dataStart,trak.end);const tkhd=trakBoxes.find(x=>x.type==='tkhd');const mdia=trakBoxes.find(x=>x.type==='mdia');if(!mdia)continue;const mediaBoxes=readBoxes(moov,mdia.dataStart,mdia.end);const hdlr=mediaBoxes.find(x=>x.type==='hdlr');if(!hdlr)continue;const handler=moov.toString('ascii',hdlr.dataStart+8,hdlr.dataStart+12);let width,height;if(tkhd){const version=moov[tkhd.dataStart];const widthOffset=tkhd.dataStart+(version===1?88:76);width=moov.readUInt32BE(widthOffset)/65536;height=moov.readUInt32BE(widthOffset+4)/65536}const minf=mediaBoxes.find(x=>x.type==='minf');let codec;if(minf){const minfBoxes=readBoxes(moov,minf.dataStart,minf.end);const stbl=minfBoxes.find(x=>x.type==='stbl');if(stbl){const stsd=readBoxes(moov,stbl.dataStart,stbl.end).find(x=>x.type==='stsd');if(stsd){const entryOffset=stsd.dataStart+8;if(entryOffset+8<=stsd.end)codec=moov.toString('ascii',entryOffset+4,entryOffset+8)}}}streams.push({type:handler==='vide'?'video':handler==='soun'?'audio':handler,codec,width,height});}
    if(!streams.some(s=>s.type==='video'))throw new Error('Rendered MP4 does not contain a video stream');
    return {fileSize,durationSeconds:movieDurationSeconds,streams};
  }finally{await handle.close()}
}

function setJob(job,status,progress,attempt,extra={}){update.run(status,progress,attempt,new Date().toISOString(),status==='running'?new Date().toISOString():null,status==='succeeded'||status==='failed'||status==='cancelled'?new Date().toISOString():null,extra.outputPath??null,extra.metadata?JSON.stringify(extra.metadata):null,extra.errorCode??null,extra.errorMessage??null,job.id)}
async function processJob(job){
  const project={id:job.project_id,brandId:job.brandId,title:job.title,format:job.format,storyboard:JSON.parse(job.storyboard)};
  const attempt=job.attempt+1;setJob(job,'running',1,attempt);const outputDir=join(root,'out',project.id,'renders');await mkdir(outputDir,{recursive:true});const outputPath=join(outputDir,`${job.id}-attempt-${attempt}.mp4`);const propsPath=join(dataDir,`${job.id}-attempt-${attempt}.props.json`);await writeFile(propsPath,JSON.stringify(project));
  await new Promise((resolveRun)=>{
    const cli=join(root,'node_modules/.bin/remotion');const child=spawn(cli,['render','src/video/index.tsx','CipherTextProject',outputPath,`--props=${propsPath}`],{cwd:root,stdio:['ignore','pipe','pipe']});active={id:job.id,child,attempt,outputPath};let output='';let last=1;
    const consume=(chunk)=>{output=(output+chunk.toString()).slice(-10000);for(const match of output.matchAll(/(?:Rendered|Encoded)\s+(\d+)\/(\d+)/g)){const value=Math.min(95,Math.floor(Number(match[1])/Number(match[2])*90)+5);if(value>last){last=value;const fresh=get.get(job.id);if(fresh?.status==='running')setJob(fresh,'running',value,attempt)}}};child.stdout.on('data',consume);child.stderr.on('data',consume);child.on('error',err=>{active=null;finishFailed(job,attempt,'RENDER_PROCESS_ERROR',err.message);resolveRun()});child.on('exit',async(code,signal)=>{active=null;const fresh=get.get(job.id);if(fresh?.cancel_requested){setJob(fresh,'cancelled',fresh.progress,attempt,{errorCode:'CANCELLED',errorMessage:'Render was cancelled'});resolveRun();return}if(code!==0){finishFailed(job,attempt,signal?'RENDER_CANCELLED':'RENDER_FAILED',output.slice(-1500)||`Renderer exited with code ${code}`);resolveRun();return}try{const info=await stat(outputPath);if(!info.isFile()||info.size<1024)throw new Error('Renderer produced no valid output file');const metadata=await inspectMp4(outputPath);const latest=get.get(job.id);if(latest?.cancel_requested){setJob(latest,'cancelled',latest.progress,attempt,{errorCode:'CANCELLED',errorMessage:'Render was cancelled'});resolveRun();return}setJob(job,'succeeded',100,attempt,{outputPath,metadata});}catch(error){finishFailed(job,attempt,'OUTPUT_VALIDATION_FAILED',error.message)}resolveRun()});
  });
}
function finishFailed(job,attempt,code,message){const latest=get.get(job.id);if(!latest)return;const status=failureStatus(attempt,job.max_attempts);const safeMessage=String(message).replaceAll(root,'<app>').replace(/(?:\/Users\/|\/tmp\/)[^\s]*/g,'<local-path>').slice(0,500);setJob(latest,status,0,attempt,{errorCode:code,errorMessage:safeMessage})}
process.on('message',message=>{if(message?.type==='cancel'&&active?.id===message.jobId)active.child.kill('SIGTERM');if(message?.type==='shutdown')stopped=true});
while(!stopped){if(!active){const job=nextJob.get();if(job){try{await processJob(job)}catch(error){finishFailed(job,job.attempt+1,'WORKER_ERROR',error.message)}}}await new Promise(r=>setTimeout(r,400))}
db.close();process.exit(0);
