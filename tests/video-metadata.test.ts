import {describe,expect,it} from 'vitest';
import {makeStoryboard} from '../src/domain';
import {getProjectVideoMetadata} from '../src/video/metadata';

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
});
