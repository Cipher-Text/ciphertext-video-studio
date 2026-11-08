import {readdir,readFile} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe,expect,it} from 'vitest';
import {projectSchema} from '../src/server/validation.mjs';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
describe('brand example projects',()=>{
  it('contains six schema-valid editable projects with unique brand coverage',async()=>{
    const files=(await readdir(join(root,'examples/projects'))).filter(name=>name.endsWith('.json'));
    const projects=await Promise.all(files.map(async name=>JSON.parse(await readFile(join(root,'examples/projects',name),'utf8'))));
    expect(projects).toHaveLength(6);
    for(const project of projects)expect(projectSchema.safeParse(project).success).toBe(true);
    expect(new Set(projects.map(project=>project.brandId)).size).toBe(6);
  });
});
