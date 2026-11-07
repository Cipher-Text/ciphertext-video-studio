import {describe,expect,it} from 'vitest';
import {createAzureSpeechProvider,wavDurationSeconds} from '../src/server/azureSpeech.mjs';

function oneSecondWav(){const audioBytes=48000,buffer=Buffer.alloc(44+audioBytes);buffer.write('RIFF',0);buffer.writeUInt32LE(buffer.length-8,4);buffer.write('WAVE',8);buffer.write('fmt ',12);buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(1,22);buffer.writeUInt32LE(24000,24);buffer.writeUInt32LE(48000,28);buffer.writeUInt16LE(2,32);buffer.writeUInt16LE(16,34);buffer.write('data',36);buffer.writeUInt32LE(audioBytes,40);return buffer}

describe('Azure Speech audio adapter',()=>{
  it('detects WAV duration from sample rate, channels and bit depth',()=>expect(wavDurationSeconds(oneSecondWav())).toBe(1));
  it('uses an interchangeable provider contract and Bengali voice in SSML',async()=>{
    const calls=[];const audio=oneSecondWav();const provider=createAzureSpeechProvider({key:'local-test-key',region:'eastus',cacheDir:'/tmp/ciphertext-speech-test',fetchImpl:async(url,options)=>{calls.push({url:String(url),options});return String(url).includes('issueToken')?new Response('temporary-token'):new Response(audio,{status:200,headers:{'content-type':'audio/wav'}})}});
    const result=await provider.synthesize('নদী & ইতিহাস','bn-BD-NabanitaNeural',{cache:false});
    expect(result.durationSeconds).toBe(1);expect(provider.id).toBe('azure-speech');expect(calls[1].options.body).toContain('name="bn-BD-NabanitaNeural"');expect(calls[1].options.body).toContain('নদী &amp; ইতিহাস');
    await expect(provider.synthesize('text','en-US-JennyNeural',{cache:false})).rejects.toMatchObject({code:'VOICE_NOT_SUPPORTED'});
  });
});
