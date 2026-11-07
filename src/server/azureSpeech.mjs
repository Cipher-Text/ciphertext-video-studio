import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

export const bnBdVoices=[
  {id:'bn-BD-NabanitaNeural',name:'Nabanita · Bengali (Bangladesh)',gender:'Female'},
  {id:'bn-BD-PradeepNeural',name:'Pradeep · Bengali (Bangladesh)',gender:'Male'},
];
const voiceIds=new Set(bnBdVoices.map(voice=>voice.id));
const escapeXml=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');

export function wavDurationSeconds(buffer){
  if(buffer.toString('ascii',0,4)!=='RIFF'||buffer.toString('ascii',8,12)!=='WAVE')throw new Error('Speech provider returned an invalid WAV');
  let offset=12,sampleRate=0,channels=0,bitsPerSample=0,dataBytes=0;
  while(offset+8<=buffer.length){const chunk=buffer.toString('ascii',offset,offset+4),size=buffer.readUInt32LE(offset+4);const start=offset+8;if(chunk==='fmt '&&size>=16){channels=buffer.readUInt16LE(start+2);sampleRate=buffer.readUInt32LE(start+4);bitsPerSample=buffer.readUInt16LE(start+14)}if(chunk==='data'){dataBytes=size===0?buffer.length-start:Math.min(size,buffer.length-start);break}offset=start+size+(size%2)}
  if(!sampleRate||!channels||!bitsPerSample){const fmt=buffer.indexOf('fmt ',12,'ascii');if(fmt>=0&&fmt+24<=buffer.length){const start=fmt+8;channels=buffer.readUInt16LE(start+2);sampleRate=buffer.readUInt32LE(start+4);bitsPerSample=buffer.readUInt16LE(start+14)}}
  if(!dataBytes){const marker=buffer.indexOf('data',12,'ascii');if(marker>=0&&marker+8<=buffer.length){const declared=buffer.readUInt32LE(marker+4);dataBytes=declared===0?buffer.length-marker-8:Math.min(declared,buffer.length-marker-8)}}
  const bytesPerSecond=sampleRate*channels*(bitsPerSample/8);if(!bytesPerSecond||!dataBytes)throw new Error(`Speech provider WAV metadata incomplete (sampleRate=${sampleRate}, channels=${channels}, bits=${bitsPerSample}, payload=${dataBytes}, bytes=${buffer.length})`);return dataBytes/bytesPerSecond;
}

export function createAzureSpeechProvider({key,region,cacheDir,fetchImpl=fetch}){
  const enabled=Boolean(key&&region);
  if(region&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(region))throw new Error('Azure Speech region is invalid');
  let tokenValue='',tokenExpiry=0;
  async function token(){if(tokenValue&&Date.now()<tokenExpiry)return tokenValue;const response=await fetchImpl(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,{method:'POST',headers:{'Ocp-Apim-Subscription-Key':key}});if(!response.ok)throw new Error('Azure Speech authentication failed');tokenValue=await response.text();tokenExpiry=Date.now()+8*60*1000;return tokenValue}
  async function synthesize(text,voiceId,{cache=true,model='azure-neural'}={}){
    if(!enabled)throw Object.assign(new Error('Azure Speech is not configured'),{code:'SPEECH_NOT_CONFIGURED'});
    if(!voiceIds.has(voiceId))throw Object.assign(new Error('Unsupported Bengali voice'),{code:'VOICE_NOT_SUPPORTED'});
    const cacheKey=createHash('sha256').update(`azure|${voiceId}|${model}|${text}`).digest('hex');const path=join(cacheDir,`${cacheKey}.wav`);
    if(cache){try{const audio=await readFile(path);return {audio,durationSeconds:wavDurationSeconds(audio),cacheKey,path,voice:voiceId,model,cached:true}}catch(error){if(error.code!=='ENOENT')throw error}}
    const accessToken=await token();const ssml=`<speak version="1.0" xml:lang="bn-BD"><voice name="${voiceId}">${escapeXml(text)}</voice></speak>`;
    const response=await fetchImpl(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,{method:'POST',headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/ssml+xml','X-Microsoft-OutputFormat':'riff-24khz-16bit-mono-pcm'},body:ssml});
    if(!response.ok)throw Object.assign(new Error('Azure Speech synthesis failed'),{code:'SPEECH_PROVIDER_ERROR'});
    const audio=Buffer.from(await response.arrayBuffer());const durationSeconds=wavDurationSeconds(audio);
    if(cache){await mkdir(cacheDir,{recursive:true});try{await writeFile(path,audio,{flag:'wx'})}catch(error){if(error.code!=='EEXIST')throw error}const cached=await readFile(path);return {audio:cached,durationSeconds:wavDurationSeconds(cached),cacheKey,path,voice:voiceId,model,cached:false}}
    return {audio,durationSeconds,cacheKey,path:null,voice:voiceId,model,cached:false};
  }
  return {id:'azure-speech',enabled,voices:bnBdVoices,synthesize};
}
