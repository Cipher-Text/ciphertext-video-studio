import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {SceneSchema} from '../src/domain';

describe('documentary scene templates',()=>{
  it('keeps example scenes compatible with the existing strict scene schema',()=>{
    const fixture=JSON.parse(readFileSync(new URL('../examples/scene-templates.json',import.meta.url),'utf8')) as {scenes:unknown[]};
    expect(fixture.scenes).toHaveLength(5);
    for(const scene of fixture.scenes)expect(SceneSchema.safeParse(scene).success).toBe(true);
  });
});
