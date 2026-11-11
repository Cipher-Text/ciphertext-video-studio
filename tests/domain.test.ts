import {describe,expect,it} from 'vitest';
import {brands,makeStoryboard,StoryboardSchema,SceneSchema} from '../src/domain';

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
  it('accepts backwards-compatible sourced GeoJSON and bounded parallax image layers',()=>{
    const scene=makeStoryboard('Geography','A mapped river reach.','en','delta-signal').scenes[0]!;
    scene.parallaxLayers=[{assetPath:'assets/background.png',depth:-.6,opacity:1},{assetPath:'assets/foreground.png',depth:.4,opacity:.8}];
    scene.geoJson={type:'FeatureCollection',source:'Example GeoJSON source',features:[{type:'Feature',geometry:{type:'LineString',coordinates:[[90,22],[91,23]]}}]};
    expect(SceneSchema.safeParse(scene).success).toBe(true);
    scene.parallaxLayers[0]!.assetPath='assets/../outside.png';
    expect(SceneSchema.safeParse(scene).success).toBe(false);
  });
  it('keeps SVG as the old-map default and validates explicit offline MapLibre inputs',()=>{
    const scene=makeStoryboard('Map','A sourced river route.','en','delta-signal').scenes[0]!;
    scene.sceneType='historical-map';
    scene.geoJson={type:'FeatureCollection',source:'Reviewed local geometry',features:[{type:'Feature',geometry:{type:'LineString',coordinates:[[90,22],[91,23]]}}]};
    expect(scene.mapEngine).toBeUndefined();
    expect(SceneSchema.safeParse(scene).success).toBe(true);
    scene.mapEngine='maplibre';
    expect(SceneSchema.safeParse(scene).success).toBe(true);
    scene.geoJson=undefined;
    expect(SceneSchema.safeParse(scene).success).toBe(false);
  });
  it('keeps existing scene JSON valid and accepts opt-in procedural Three.js scenes',()=>{
    const scene=makeStoryboard('Illustration','A stylized vehicle advances.','en','bengal-unfolded').scenes[0]!;
    expect(SceneSchema.safeParse(scene).success).toBe(true);
    scene.sceneEngine='three';scene.threeConfig={subject:'armored-vehicle',accentColor:'#db9b62'};
    expect(SceneSchema.safeParse(scene).success).toBe(true);
    scene.threeConfig.accentColor='javascript:alert(1)';
    expect(SceneSchema.safeParse(scene).success).toBe(false);
  });
});
