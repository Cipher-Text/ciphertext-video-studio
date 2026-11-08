import {describe,expect,it} from 'vitest';
import {makeStoryboard} from '../src/domain';
import {getProjectVideoMetadata,transitionFrameDurations} from '../src/video/metadata';
import {buildCaptionSegments} from '../src/video/captions';

describe('shared preview and render metadata',()=>{
  it('uses matching composition dimensions for each project format',()=>{
    const storyboard=makeStoryboard('Story','প্রথম বাক্য। দ্বিতীয় বাক্য।','bn','kalokhata');
    const expected={landscape:[1920,1080],portrait:[1080,1920],square:[1080,1080]} as const;
    for(const [format,[width,height]] of Object.entries(expected) as [keyof typeof expected,readonly [number,number]][]){
      const metadata=getProjectVideoMetadata(format,storyboard);
      expect([metadata.width,metadata.height]).toEqual([width,height]);
      expect(metadata.sceneFrames).toHaveLength(storyboard.scenes.length);
      expect(metadata.durationInFrames).toBe(metadata.sceneFrames.reduce((sum,frames)=>sum+frames,0));
    }
  });
  it('extends scene timing to fit generated speech audio',()=>{
    const storyboard=makeStoryboard('Audio','শব্দ।','bn','open-care');
    storyboard.scenes[0]!.estimatedDurationSeconds=2;
    storyboard.scenes[0]!.audio={src:'generated-audio/test.wav',durationSeconds:3.25,voice:'bn-BD-NabanitaNeural',cacheKey:'a'.repeat(64)};
    const metadata=getProjectVideoMetadata('portrait',storyboard);
    expect(metadata.durationInFrames).toBe(98);
  });
  it('allocates real transition overlap without changing total output duration',()=>{
    const storyboard=makeStoryboard('Transitions','Scene one. Scene two.','en','factlens');
    storyboard.scenes.forEach(scene=>{scene.estimatedDurationSeconds=4});
    storyboard.scenes[0]!.transition={type:'fade',durationSeconds:.6};
    const meta=getProjectVideoMetadata('landscape',storyboard);
    const edges=transitionFrameDurations(storyboard);
    const extendedFrames=meta.sceneFrames.reduce((sum,frames,index)=>sum+frames+(index>0?Math.ceil(edges[index-1]/2):0)+(index<edges.length?Math.floor(edges[index]/2):0),0);
    expect(edges).toEqual([18]);
    expect(extendedFrames-edges.reduce((sum,frames)=>sum+frames,0)).toBe(meta.durationInFrames);
  });
  it('paces phrase captions across the measured narration duration',()=>{
    const segments=buildCaptionSegments('First phrase has several words. A short ending.',2.5,4);
    expect(segments.length).toBeGreaterThan(2);
    expect(segments[0]!.startSeconds).toBe(0);
    expect(segments.at(-1)!.endSeconds).toBe(2.5);
    expect(segments.every((segment,index)=>segment.endSeconds>segment.startSeconds&&(index===0||segment.startSeconds===segments[index-1]!.endSeconds))).toBe(true);
  });
});
