import {Readable} from 'node:stream';
import {describe,expect,it} from 'vitest';
import {projectSchema,storyboardSchema,decodeRouteId} from '../src/server/validation.mjs';
import {checkRequestOrigin,isSafeRenderPath,parseJsonBody} from '../src/server/security.mjs';

const validProject=()=>({id:'test_project-1',brandId:'kalokhata',title:'Records review',language:'bn',format:'portrait',script:'নথি পর্যালোচনা।',scriptApproved:false,status:'Script draft',updatedAt:new Date().toISOString()});

describe('local API validation and origin rules',()=>{
  it('requires a configured local Origin for state-changing requests',()=>{
    const origins=new Set(['http://127.0.0.1:4173']);
    expect(checkRequestOrigin('POST','http://evil.example',origins)).toMatchObject({ok:false,status:403,code:'ORIGIN_DENIED'});
    expect(checkRequestOrigin('DELETE',undefined,origins)).toMatchObject({ok:false,status:403,code:'ORIGIN_REQUIRED'});
    expect(checkRequestOrigin('POST','http://127.0.0.1:4173',origins)).toEqual({ok:true});
  });
  it('rejects invalid and encoded traversal identifiers',()=>{
    for(const raw of ['..','%2e%2e','%252e%252e','bad%2Fid','x%5cy','%00'])expect(decodeRouteId(raw)).toBeNull();
    expect(decodeRouteId('valid_123-abc')).toBe('valid_123-abc');
  });
  it('validates all project fields and nested storyboard fields before writes',()=>{
    expect(projectSchema.safeParse(validProject()).success).toBe(true);
    expect(projectSchema.safeParse({...validProject(),format:'panorama'}).success).toBe(false);
    const bad={...validProject(),storyboard:{version:1,title:'Wrong title',language:'bn',targetDurationSeconds:4,scenes:[{id:'1',order:0,sceneType:'historical-map',narration:'x',onScreenText:'x',estimatedDurationSeconds:4,visualDescription:'x',animation:'fade',approvalStatus:'draft',sourceReferences:[]}]}};
    expect(projectSchema.safeParse(bad).success).toBe(false);
    expect(storyboardSchema.safeParse(bad.storyboard).success).toBe(true);
    expect(storyboardSchema.safeParse({...bad.storyboard,scenes:[{...bad.storyboard.scenes[0],order:1}]}).success).toBe(false);
  });
  it('rejects oversized and malformed JSON bodies',async()=>{
    const request=(body)=>Object.assign(Readable.from([body]),{headers:{'content-type':'application/json'}});
    await expect(parseJsonBody(request('{bad json'))).rejects.toMatchObject({status:400,code:'INVALID_JSON'});
    await expect(parseJsonBody(request(Buffer.alloc(2*1024*1024+1)))).rejects.toMatchObject({status:413,code:'BODY_TOO_LARGE'});
  });
  it('keeps render downloads inside the output directory',()=>{
    expect(isSafeRenderPath('/app/out','/app/out/project/render.mp4')).toBe(true);
    expect(isSafeRenderPath('/app/out','/app/outside/render.mp4')).toBe(false);
  });
});
