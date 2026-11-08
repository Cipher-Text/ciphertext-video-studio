import {describe,expect,it,vi} from 'vitest';
import {createStoryboardDirector,DirectorInputSchema,DirectorOutputSchema} from '../src/server/storyboardDirector.mjs';

const input={brand:'Delta Signal',topic:'River levels',audience:'general audience',language:'en',durationSeconds:30,format:'portrait',availableMedia:[]};
const generated={narrativeStructure:['Hook','Explain','Close'],scenes:[{narration:'River levels change.',visualDescription:'A sourced river gauge.',recommendedSceneType:'data-chart',cameraMovement:'none',animationPreset:'rise',assetSuggestions:[],approximateDurationSeconds:30,sourceRequirements:['Cite the monitoring dataset.']}]};
const providerResponse=(value)=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(value)}}]}),{status:200});

describe('provider-independent storyboard director',()=>{
  it('validates complete requests and generated plans with Zod',()=>{
    expect(DirectorInputSchema.parse(input).durationSeconds).toBe(30);
    expect(DirectorOutputSchema.parse(generated).scenes[0].recommendedSceneType).toBe('data-chart');
    expect(()=>DirectorInputSchema.parse({...input,durationSeconds:0})).toThrow();
    expect(()=>DirectorOutputSchema.parse({...generated,scenes:[{...generated.scenes[0],cameraMovement:'orbit'}]})).toThrow();
  });
  it('uses an OpenAI-compatible local endpoint without remote credentials',async()=>{
    const fetchImpl=vi.fn(async(url,init)=>{expect(url).toBe('http://127.0.0.1:1234/v1/chat/completions');expect(init.headers.authorization).toBeUndefined();return providerResponse(generated)});
    const director=createStoryboardDirector({env:{STORYBOARD_LLM_LOCAL_BASE_URL:'http://127.0.0.1:1234/v1',STORYBOARD_LLM_LOCAL_MODEL:'qwen'},fetchImpl});
    expect(director.configured).toBe(true);expect(director.provider).toBe('local');
    expect(await director.generate(input)).toEqual(generated);
  });
  it('requires explicit remote configuration, validates duration, and keeps the key server-side',async()=>{
    const missing=createStoryboardDirector({env:{}});await expect(missing.generate(input)).rejects.toMatchObject({code:'STORYBOARD_LLM_NOT_CONFIGURED'});
    const fetchImpl=vi.fn(async(_url,init)=>{expect(init.headers.authorization).toBe('Bearer secret');return providerResponse({...generated,scenes:[{...generated.scenes[0],approximateDurationSeconds:12}]})});
    const director=createStoryboardDirector({env:{STORYBOARD_LLM_REMOTE_BASE_URL:'https://llm.example/v1',STORYBOARD_LLM_REMOTE_MODEL:'model',STORYBOARD_LLM_REMOTE_API_KEY:'secret'},fetchImpl});
    await expect(director.generate(input)).rejects.toMatchObject({code:'STORYBOARD_DURATION_MISMATCH'});
  });
});
