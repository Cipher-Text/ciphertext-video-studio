import {describe,expect,it} from 'vitest';
import {sceneRegistry,CinematicImageScene,ParallaxScene,HistoricalMapScene,DataChartScene,NewsHeadlineScene,EvidenceTimelineScene,MedicalExplainerScene,SoftwareDemoScene,DocumentHighlightScene} from '../src/video/sceneRegistry';

describe('typed documentary scene registry',()=>{
  it('registers nine distinct visual treatments for the requested scene types',()=>{
    const components=[CinematicImageScene,ParallaxScene,HistoricalMapScene,DataChartScene,NewsHeadlineScene,EvidenceTimelineScene,MedicalExplainerScene,SoftwareDemoScene,DocumentHighlightScene];
    const types=['cinematic-image','parallax','historical-map','data-chart','news-headline','evidence-timeline','medical-explainer','software-demo','document-highlight'];
    expect(types.every(type=>type in sceneRegistry)).toBe(true);
    expect(new Set(components).size).toBe(9);
  });
});
