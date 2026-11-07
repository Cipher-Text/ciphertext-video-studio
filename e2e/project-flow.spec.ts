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
