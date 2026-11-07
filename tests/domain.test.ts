import {describe,expect,it} from 'vitest';
import {brands,makeStoryboard,StoryboardSchema} from '../src/domain';

describe('brand-aware storyboard foundation',()=>{
  it('ships all six independent brand profiles',()=>{
    expect(brands.map(b=>b.id)).toHaveLength(6);
    expect(new Set(brands.map(b=>b.id)).size).toBe(6);
  });
  it('creates a valid stable-ID storyboard from a manual script',()=>{
    const storyboard=makeStoryboard('Delta notes','The river is rising. Watch the gauge.', 'en','delta-signal');
    expect(StoryboardSchema.safeParse(storyboard).success).toBe(true);
    expect(storyboard.scenes).toHaveLength(2);
    expect(storyboard.scenes[0]?.sceneType).toBe('intro');
    expect(storyboard.scenes[1]?.sceneType).toBe('outro');
    expect(new Set(storyboard.scenes.map(s=>s.id)).size).toBe(2);
  });
  it('does not invent source references',()=>{
    const storyboard=makeStoryboard('Example','This is illustrative.', 'en','factlens');
    expect(storyboard.scenes.every(s=>s.sourceReferences.length===0)).toBe(true);
  });
});
