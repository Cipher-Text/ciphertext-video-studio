import {expect,test} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const frontendOrigin=process.env.CIPHERTEXT_E2E_ORIGIN||'http://127.0.0.1:4383';
const apiBase=frontendOrigin;

test('creates a branded manual project and prepares an editable storyboard',async({page})=>{
  await page.goto('/');
  await expect(page.getByRole('heading',{name:/Stories worth telling/})).toBeVisible();
  await page.getByLabel('Project title').fill('River levels, explained');
  await page.getByLabel('Brand').selectOption('delta-signal');
  await page.getByLabel('Language').selectOption('en');
  await page.getByLabel('Script or source notes').fill('The river level is changing. Readings are collected at stations. This illustrative explainer shows how the measurements are tracked.');
  await page.getByRole('button',{name:'Create project'}).click();
  await expect(page.getByRole('heading',{name:'River levels, explained'})).toBeVisible();
  await page.getByRole('button',{name:'Approve script'}).click();
  await page.getByRole('button',{name:'Prepare storyboard'}).click();
  await expect(page.getByText('DATA CHART',{exact:true})).toBeVisible();
  await expect(page.getByLabel('Scene 2 narration')).toHaveValue('Readings are collected at stations.');
  await page.getByLabel('Scene 2 data label 1').fill('North');
  await page.getByLabel('Scene 2 data value 1').fill('12');
  await page.getByLabel('Scene 2 data label 2').fill('South');
  await page.getByLabel('Scene 2 data value 2').fill('18');
  await page.getByLabel('Scene 2 chart source').fill('Test river monitoring dataset, 2026');
  await expect(page.getByRole('button',{name:'Approve storyboard'})).toBeDisabled();
  await page.getByRole('button',{name:'Approve',exact:true}).nth(0).click();
  await page.getByRole('button',{name:'Approve',exact:true}).nth(0).click();
  await page.getByRole('button',{name:'Approve',exact:true}).nth(0).click();
  await page.getByRole('button',{name:'Approve storyboard'}).click();
  await expect(page.getByText('Storyboard approved')).toBeVisible();
  await expect(page.getByRole('button',{name:'Render MP4'})).toBeEnabled();
  await page.getByLabel('Scene 1 narration').fill('The river levels continue to change.');
  await expect(page.getByRole('button',{name:'Approve storyboard'})).toBeDisabled();
  await expect(page.getByRole('button',{name:'Render MP4'})).toBeDisabled();
  await expect(page.getByText('Approve each scene, then approve the storyboard to enable rendering.')).toBeVisible();
});

test('project import shows field-level validation feedback',async({page})=>{
  await page.goto('/');
  const invalidProject={id:'invalid_import_format',brandId:'kalokhata',title:'Import validation',language:'bn',format:'short',script:'নথি পর্যালোচনা।',scriptApproved:false,status:'Script draft',updatedAt:new Date().toISOString()};
  await page.locator('input[type="file"][accept="application/json"]').setInputFiles({name:'invalid-project.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(invalidProject))});
  await expect(page.getByRole('status')).toContainText('format:');
  await expect(page.getByRole('status')).not.toContainText('Could not import this project JSON.');
});

test('project workspace fits a mobile viewport without horizontal overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await expect(page.getByRole('heading',{name:/Stories worth telling/})).toBeVisible();
  await expect(page.getByRole('button',{name:'Import JSON'})).toBeVisible();
  await expect(page.getByLabel('Project title')).toBeVisible();
  const dimensions=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,content:document.documentElement.scrollWidth}));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
});

test('project save indicator reports a failed write',async({page})=>{
  await page.route('**/api/projects/*',async route=>{
    if(route.request().method()==='PUT')return route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({error:{message:'Simulated save failure'}})});
    return route.continue();
  });
  await page.goto('/');
  await page.getByLabel('Project title').fill('Save status check');
  await page.getByLabel('Script or source notes').fill('A small save-status regression check.');
  await page.getByRole('button',{name:'Create project'}).click();
  await expect(page.locator('.save-state')).toHaveText('● Saved locally');
  await page.getByRole('button',{name:'Approve script'}).click();
  await expect(page.locator('.save-state')).toHaveText('● Save failed');
  await expect(page.getByRole('status').filter({hasText:'Could not save project: Simulated save failure'})).toBeVisible();
});

test('API rejects cross-origin writes, malformed project IDs and encoded render traversal',async({request})=>{
  const api=apiBase;
  const project={id:'../escape',brandId:'bengal-unfolded',title:'Invalid',language:'en',format:'landscape',script:'',scriptApproved:false,status:'Script draft',updatedAt:new Date().toISOString()};
  const crossOrigin=await request.post(`${api}/api/projects`,{headers:{origin:'http://evil.example'},data:project});
  expect(crossOrigin.status()).toBe(403);
  expect((await crossOrigin.json()).error.code).toBe('ORIGIN_DENIED');
  expect(crossOrigin.headers()['access-control-allow-origin']).toBeUndefined();
  const missingOrigin=await request.delete(`${api}/api/projects/valid-id`);
  expect(missingOrigin.status()).toBe(403);
  const malformedId=await request.post(`${api}/api/projects`,{headers:{origin:frontendOrigin},data:project});
  expect(malformedId.status()).toBe(400);
  const traversal=await request.get(`${api}/api/renders/%2e%2e`,{headers:{origin:frontendOrigin}});
  expect([400,404]).toContain(traversal.status());
  const encodedSlash=await request.get(`${api}/api/renders/a%2Fb`,{headers:{origin:frontendOrigin}});
  expect(encodedSlash.status()).toBe(400);
});

test('persistent render job can be queued, cancelled and inspected',async({request})=>{
  const api=apiBase,origin={origin:frontendOrigin};
  const project={id:'cancel_job_project',brandId:'bengal-unfolded',title:'Cancellation test',language:'en',format:'square',script:'A short test script.',scriptApproved:true,status:'Storyboard approved',updatedAt:new Date().toISOString(),storyboard:{version:1,title:'Cancellation test',language:'en',targetDurationSeconds:3,scenes:[{id:'cancel_job_scene',order:0,sceneType:'intro',narration:'A short render cancellation test.',onScreenText:'CANCEL TEST',estimatedDurationSeconds:3,visualDescription:'Test placeholder',animation:'zoom-in',approvalStatus:'approved',sourceReferences:[]}]}};
  expect((await request.post(`${api}/api/projects`,{headers:origin,data:project})).status()).toBe(201);
  const accepted=await request.post(`${api}/api/projects/${project.id}/render`,{headers:origin,data:{}});expect(accepted.status()).toBe(202);
  const {job}=await accepted.json();
  const cancelled=await request.delete(`${api}/api/render-jobs/${job.id}`,{headers:origin});expect(cancelled.status()).toBe(202);
  let finalJob=await cancelled.json();
  for(let n=0;n<30&&finalJob.status!=='cancelled';n++){await new Promise(resolve=>setTimeout(resolve,250));finalJob=await (await request.get(`${api}/api/render-jobs/${job.id}`,{headers:origin})).json()}
  expect(finalJob.status).toBe('cancelled');
  const history=await request.get(`${api}/api/projects/${project.id}/render-jobs`,{headers:origin});expect(history.status()).toBe(200);expect((await history.json())[0].id).toBe(job.id);
});

test('render API requires approved storyboard and approved scenes',async({request})=>{
  const api=apiBase,origin={origin:frontendOrigin};
  const project={id:'unapproved_render_project',brandId:'bengal-unfolded',title:'Approval gate',language:'en',format:'landscape',script:'Review before render.',scriptApproved:true,status:'Storyboard draft',updatedAt:new Date().toISOString(),storyboard:{version:1,title:'Approval gate',language:'en',targetDurationSeconds:4,scenes:[{id:'unapproved_render_scene',order:0,sceneType:'intro',narration:'Review before render.',onScreenText:'REVIEW',estimatedDurationSeconds:4,visualDescription:'Test placeholder',animation:'zoom-in',approvalStatus:'draft',sourceReferences:[]}]}};
  expect((await request.post(`${api}/api/projects`,{headers:origin,data:project})).status()).toBe(201);
  const response=await request.post(`${api}/api/projects/${project.id}/render`,{headers:origin,data:{}});
  expect(response.status()).toBe(409);
  expect((await response.json()).error).toMatchObject({code:'STORYBOARD_NOT_APPROVED'});
});

test('video upload is listed in the media library and plays in the browser',async({request,page})=>{
  const fixture=await readFile(new URL('../examples/assets/video-playback-fixture.webm',import.meta.url));
  const upload=await request.post(`${apiBase.replace(':4383',':4384')}/api/video-assets`,{headers:{Origin:frontendOrigin,'content-type':'video/webm'},data:fixture});
  expect(upload.status()).toBe(201);
  const {asset}=await upload.json();
  try{
    const media=await request.get(`${apiBase.replace(':4383',':4384')}/api/media`,{headers:{Origin:frontendOrigin}});
    expect((await media.json()).assets.some((item:{path:string;type:string})=>item.path===asset.src&&item.type==='video')).toBe(true);
    const playbackUrl=new URL(`/${asset.src}`,frontendOrigin).href;
    const playbackResponse=await page.request.get(playbackUrl);
    expect(playbackResponse.status()).toBe(200);
    expect(playbackResponse.headers()['content-type']).toContain('video/webm');
    await page.goto(frontendOrigin);
    await page.setContent(`<video controls muted preload="auto" src="${playbackUrl}"></video>`);
    const player=page.locator('video');
    await expect(player).toBeVisible();
    await expect.poll(()=>player.evaluate((video:HTMLVideoElement)=>video.error?-video.error.code:video.readyState)).toBeGreaterThanOrEqual(2);
  }finally{
    const name=asset.src.split('/').at(-1);
    await request.delete(`${apiBase.replace(':4383',':4384')}/api/media/${name}`,{headers:{Origin:frontendOrigin}});
  }
});

test('animation library previews independently of projects',async({page})=>{
  await page.goto(frontendOrigin);
  await page.getByRole('button',{name:/Animations/}).click();
  await expect(page.getByRole('heading',{name:'Browse animations'})).toBeVisible();
  await expect(page.getByText('SHARED MOTION LIBRARY')).toBeVisible();
  await expect(page.getByLabel('Optional project scene')).toHaveValue('');
  const card=page.getByRole('article').filter({hasText:'Funds flow diagram'});
  await card.getByRole('button',{name:'Preview'}).click();
  const dialog=page.getByRole('dialog',{name:'Preview Funds flow diagram'});
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/CONCEPTUAL FLOW · NOT A CASE CLAIM/)).toBeVisible();
  await expect(dialog.getByRole('button',{name:'Pause preview'})).toBeVisible();
  await expect(dialog.getByRole('button',{name:'Open a project to apply'})).toBeDisabled();
});
