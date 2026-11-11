import {describe,expect,it} from 'vitest';
import {StoryboardSchema,type StudioProject} from '../src/domain';
import garibpur from '../examples/garibpur-1971.project.json';
import {buildCaptionSegments} from '../src/video/captions';
import {getProjectVideoMetadata,sceneDurationSeconds} from '../src/video/metadata';

describe('Garibpur animation storyboard',()=>{
  it('accepts the advanced animation extension while keeping legacy animation values',()=>{
    const project=garibpur as StudioProject;
    const storyboard=StoryboardSchema.parse(project.storyboard);
    expect(storyboard.scenes.every(scene=>['zoom-in','pan-left','fade','rise'].includes(scene.animation))).toBe(true);
    expect(storyboard.scenes.find(scene=>scene.id==='garibpur-clash')?.animationConfig?.mode).toBe('tank-battle');
    expect(storyboard.scenes.find(scene=>scene.id==='garibpur-map')?.animationConfig?.mode).toBe('battle-map');
    expect(storyboard.scenes.find(scene=>scene.id==='garibpur-map')?.mapData?.scale).toBe('schematic-not-to-scale');
    expect(storyboard.targetDurationSeconds).toBe(106);
  });

  it('keeps narration captions within scene timing at portrait 1080x1920 30fps',()=>{
    const storyboard=StoryboardSchema.parse(garibpur.storyboard);
    const metadata=getProjectVideoMetadata('portrait',storyboard);
    expect([metadata.width,metadata.height,metadata.fps]).toEqual([1080,1920,30]);
    expect(metadata.durationInFrames).toBe(3180);
    const scene=storyboard.scenes.find(item=>item.id==='garibpur-clash')!;
    const captions=buildCaptionSegments(scene.narration,scene.estimatedDurationSeconds);
    expect(captions[0]?.startSeconds).toBe(0);
    expect(captions.at(-1)?.endSeconds).toBe(scene.estimatedDurationSeconds);
    scene.audio={src:'generated-audio/garibpur-clash.wav',durationSeconds:12.4,voice:'bn-BD-NabanitaNeural',cacheKey:'b'.repeat(64)};
    const voicedCaptions=buildCaptionSegments(scene.narration,scene.audio.durationSeconds);
    expect(sceneDurationSeconds(scene)).toBe(12.4);
    expect(voicedCaptions.at(-1)?.endSeconds).toBe(scene.audio.durationSeconds);
  });
});
