import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {ElevenLabsClient} from '@elevenlabs/elevenlabs-js';

export function mp3DurationSeconds(buffer){
  let offset=buffer.subarray(0,3).toString()==='ID3'?10+buffer[6]*0x200000+buffer[7]*0x4000+buffer[8]*0x80+buffer[9]:0;
  const rates=[44100,48000,32000],bitrates=[0,32,40,48,56,64,80,96,112,128,160,192,224,256,320];let duration=0,frames=0;
  for(;offset+4<=buffer.length;){const h=buffer.readUInt32BE(offset);if(((h>>>21)&0x7ff)!==0x7ff){offset++;continue}const version=(h>>>19)&3,layer=(h>>>17)&3,bi=(h>>>12)&15,ri=(h>>>10)&3;if(version===1||layer!==1||bi===0||bi===15||ri===3){offset++;continue}const rate=rates[ri]/(version===3?1:version===2?2:4),kbps=bitrates[bi],length=Math.floor((version===3?144:72)*kbps*1000/rate)+((h>>>9)&1);if(offset+length>buffer.length)break;duration+=(version===3?1152:576)/rate;frames++;offset+=length}
  if(!frames)throw Object.assign(new Error('ElevenLabs returned invalid MP3 audio'),{code:'SPEECH_PROVIDER_ERROR'});return duration;
}

export function createElevenLabsSpeechProvider({key,cacheDir,client=new ElevenLabsClient({apiKey:key||'not-configured'})}){
  const enabled=Boolean(key);
  const ensure=()=>{if(!enabled)throw Object.assign(new Error('ElevenLabs is not configured'),{code:'SPEECH_NOT_CONFIGURED'})};
  const providerError=(error)=>{if(error?.status===429)return Object.assign(new Error('ElevenLabs quota or rate limit reached'),{code:'SPEECH_QUOTA_LIMIT',status:429});return Object.assign(new Error(error?.message||'ElevenLabs request failed'),{code:'SPEECH_PROVIDER_ERROR',status:error?.status})};
  async function catalog(){ensure();try{const [voiceResponse,modelResult]=await Promise.allSettled([client.voices.search({pageSize:100}),client.models.list()]);if(voiceResponse.status==='rejected')throw voiceResponse.reason;const voices=(voiceResponse.value.voices||[]).map(v=>({id:v.voiceId,name:v.name,gender:v.labels?.gender||'Unspecified',labels:v.labels||{}}));if(modelResult.status==='rejected')return {voices,models:[{id:'eleven_v3',name:'Eleven v3 · Bengali capable',languages:['Bengali']}],modelCatalogLimited:true};const compatible=modelResult.value.filter(m=>m.canDoTextToSpeech&&(m.languages||[]).some(l=>/bengali/i.test(l.name)||/^bn$/i.test(l.languageId))).map(m=>({id:m.modelId,name:m.name,languages:m.languages?.map(x=>x.name)||[]}));return {voices,models:compatible,modelCatalogLimited:false}}catch(e){throw providerError(e)}}
  async function synthesize(text,voiceId,modelId,{cache=true}={}){ensure();const cacheKey=createHash('sha256').update(`elevenlabs|${voiceId}|${modelId}|${text}`).digest('hex'),path=join(cacheDir,`${cacheKey}.mp3`);if(cache){try{const audio=await readFile(path);return {audio,durationSeconds:mp3DurationSeconds(audio),cacheKey,path,voice:voiceId,model:modelId,cached:true}}catch(e){if(e.code!=='ENOENT')throw e}}
    try{const stream=await client.textToSpeech.convert(voiceId,{text,modelId,languageCode:modelId==='eleven_v3'?'bn':undefined,outputFormat:'mp3_44100_128'});const audio=Buffer.from(await new Response(stream).arrayBuffer());const durationSeconds=mp3DurationSeconds(audio);if(cache){await mkdir(cacheDir,{recursive:true});try{await writeFile(path,audio,{flag:'wx'})}catch(e){if(e.code!=='EEXIST')throw e}const saved=await readFile(path);return {audio:saved,durationSeconds:mp3DurationSeconds(saved),cacheKey,path,voice:voiceId,model:modelId,cached:false}}return {audio,durationSeconds,cacheKey,path:null,voice:voiceId,model:modelId,cached:false}}catch(e){throw providerError(e)}
  }
  return {id:'elevenlabs',enabled,catalog,synthesize};
}
