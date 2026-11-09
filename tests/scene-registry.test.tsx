import {describe,expect,it} from 'vitest';
import {isValidElement} from 'react';
import {brands,makeStoryboard} from '../src/domain';
import {sceneRegistry,CinematicImageScene,ParallaxScene,HistoricalMapScene,DataChartScene,NewsHeadlineScene,EvidenceTimelineScene,MedicalExplainerScene,SoftwareDemoScene,DocumentHighlightScene} from '../src/video/sceneRegistry';
import {AnimatedBattleScene} from '../src/video/garibpurAnimations';

describe('typed documentary scene registry',()=>{
  it('registers nine distinct visual treatments for the requested scene types',()=>{
    const components=[CinematicImageScene,ParallaxScene,HistoricalMapScene,DataChartScene,NewsHeadlineScene,EvidenceTimelineScene,MedicalExplainerScene,SoftwareDemoScene,DocumentHighlightScene];
    const types=['cinematic-image','parallax','historical-map','data-chart','news-headline','evidence-timeline','medical-explainer','software-demo','document-highlight'];
    expect(types.every(type=>type in sceneRegistry)).toBe(true);
    expect(new Set(components).size).toBe(9);
  });

  it('routes advanced opening and closing scenes to their animation component',()=>{
    const storyboard=makeStoryboard('Garibpur','The tanks advance. The brand returns.','bn','bengal-unfolded');
    const intro={...storyboard.scenes[0]!,animationConfig:{mode:'battlefield-intro' as const}};
    const outro={...storyboard.scenes[1]!,animationConfig:{mode:'brand-outro' as const}};
    for(const scene of [intro,outro]){
      const node=sceneRegistry[scene.sceneType]({brand:brands[0]!,scene,progress:.5,title:storyboard.title,aspect:'portrait'});
      expect(isValidElement(node)).toBe(true);
      expect((node as React.ReactElement).type).toBe(AnimatedBattleScene);
    }
  });
});
