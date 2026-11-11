import {describe,expect,it} from 'vitest';
import {brands} from '../src/domain';
import {brandThemes} from '../src/video/brandThemes';
import {cameraTransformAtFrame} from '../src/video/motionSystem';

describe('frame-driven motion contracts',()=>{
  it('maps the same camera frame to the same transform',()=>{
    const first=cameraTransformAtFrame(12,60,1080,'track-subject',.08,'pt76');
    expect(first).toEqual(cameraTransformAtFrame(12,60,1080,'track-subject',.08,'pt76'));
    expect(first.progress).toBeGreaterThan(0);
  });
  it('keeps camera start and end poses bounded and deterministic',()=>{
    expect(cameraTransformAtFrame(0,60,1080,'zoom-in',.08).transform).toContain('scale(1)');
    expect(cameraTransformAtFrame(59,60,1080,'zoom-in',.08).transform).toContain('scale(1.08)');
    expect(cameraTransformAtFrame(59,60,1080,'zoom-out',.08).transform).toContain('scale(1)');
  });
  it('defines a complete style theme for every existing brand without changing project JSON',()=>{
    expect(Object.keys(brandThemes).sort()).toEqual(brands.map(brand=>brand.id).sort());
    expect(Object.values(brandThemes).every(theme=>theme.motionGuidance.cameraIntensity<=.1)).toBe(true);
  });
});
