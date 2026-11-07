import {expect,test} from '@playwright/test';

test('creates a branded manual project and prepares an editable storyboard',async({page})=>{
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Your first story starts here.'})).toBeVisible();
  await page.getByLabel('Project title').fill('River levels, explained');
  await page.getByLabel('Brand').selectOption('delta-signal');
  await page.getByLabel('Language').selectOption('en');
  await page.getByLabel('Script or source notes').fill('The river level is changing. Readings are collected at stations. This illustrative explainer shows how the measurements are tracked.');
  await page.getByRole('button',{name:'Create project'}).click();
  await expect(page.getByRole('heading',{name:'River levels, explained'})).toBeVisible();
  await page.getByRole('button',{name:'Approve script'}).click();
  await page.getByRole('button',{name:'Prepare storyboard'}).click();
  await expect(page.getByText('DATA CHART')).toBeVisible();
  await expect(page.getByLabel('Scene 2 narration')).toHaveValue('Readings are collected at stations.');
  await expect(page.getByRole('button',{name:'Approve storyboard'})).toBeDisabled();
  await page.getByRole('button',{name:'Approve',exact:true}).nth(0).click();
  await page.getByRole('button',{name:'Approve',exact:true}).nth(0).click();
  await page.getByRole('button',{name:'Approve',exact:true}).nth(0).click();
  await page.getByRole('button',{name:'Approve storyboard'}).click();
  await expect(page.getByText('Storyboard approved')).toBeVisible();
});

test('API rejects cross-origin writes, malformed project IDs and encoded render traversal',async({request})=>{
  const api='http://127.0.0.1:4174';
  const project={id:'../escape',brandId:'bengal-unfolded',title:'Invalid',language:'en',format:'landscape',script:'',scriptApproved:false,status:'Script draft',updatedAt:new Date().toISOString()};
  const crossOrigin=await request.post(`${api}/api/projects`,{headers:{origin:'http://evil.example'},data:project});
  expect(crossOrigin.status()).toBe(403);
  expect((await crossOrigin.json()).error.code).toBe('ORIGIN_DENIED');
  expect(crossOrigin.headers()['access-control-allow-origin']).toBeUndefined();
  const missingOrigin=await request.delete(`${api}/api/projects/valid-id`);
  expect(missingOrigin.status()).toBe(403);
  const malformedId=await request.post(`${api}/api/projects`,{headers:{origin:'http://127.0.0.1:4173'},data:project});
  expect(malformedId.status()).toBe(400);
  const traversal=await request.get(`${api}/api/renders/%2e%2e`,{headers:{origin:'http://127.0.0.1:4173'}});
  expect([400,404]).toContain(traversal.status());
  const encodedSlash=await request.get(`${api}/api/renders/a%2Fb`,{headers:{origin:'http://127.0.0.1:4173'}});
  expect(encodedSlash.status()).toBe(400);
});

test('persistent render job can be queued, cancelled and inspected',async({request})=>{
  const api='http://127.0.0.1:4174',origin={origin:'http://127.0.0.1:4173'};
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
