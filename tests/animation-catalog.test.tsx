import {describe,expect,it} from 'vitest';
import {isValidElement,type ReactElement} from 'react';
import {brands,makeStoryboard,SceneSchema} from '../src/domain';
import {animationPresets,presetIdForScene} from '../src/animations/catalog';
import {sceneRegistry} from '../src/video/sceneRegistry';
import {GenericAnimationScene} from '../src/video/genericAnimationScenes';

describe('reusable animation preset catalog',()=>{
  it('ships shared presets and brand-oriented motion packs',()=>{
    for(const brandId of ['bengal-unfolded','kalokhata','delta-signal','factlens','open-care','ciphertext-labs']){
      expect(animationPresets.some(preset=>preset.brandId===brandId)).toBe(true);
    }
    expect(animationPresets.some(preset=>preset.brandId===null)).toBe(true);
    expect(new Set(animationPresets.map(preset=>preset.id)).size).toBe(animationPresets.length);
    for(const preset of animationPresets){
      expect(preset.requiredInputs).toBeDefined();
      expect(preset.supportedAspectRatios).toEqual(expect.arrayContaining(['portrait','landscape','square']));
      expect(preset.previewConfiguration?.durationSeconds).toBeGreaterThan(0);
      expect(preset.qualityCriteria?.length).toBeGreaterThan(0);
    }
  });

  it('preserves existing animationConfig values as preset aliases',()=>{
    expect(presetIdForScene({animationConfig:{mode:'tank-battle'}})).toBe('bengal.tank-battle');
    expect(presetIdForScene({animationConfig:{mode:'battle-map'}})).toBe('bengal.battle-map');
  });

  it('lets an explicit preset override a legacy animation mode',()=>{
    const storyboard=makeStoryboard('Campaign map','A cited campaign map.','en','bengal-unfolded');
    const scene={...storyboard.scenes[0]!,sceneType:'historical-map' as const,animationPresetId:'bengal.battle-map',animationConfig:{mode:'tank-battle' as const}};
    const node=sceneRegistry[scene.sceneType]({brand:brands[0]!,scene,progress:.4,title:storyboard.title,aspect:'landscape'});
    expect((node as ReactElement<{rendererKey:string}>).props.rendererKey).toBe('campaign-map');
  });

  it('validates optional schematic map data and sourced comparison series',()=>{
    const storyboard=makeStoryboard('Source-led map','Map data is sourced.','en','bengal-unfolded');
    const mapScene={...storyboard.scenes[0]!,mapData:{source:'MP-IDSA map, relative placement',date:'November 1971',scale:'schematic-not-to-scale' as const,locations:[{name:'Location A',x:250,y:400}],routes:[{name:'Illustrative axis',points:[[250,400],[700,600]] as [number,number][],status:'illustrative' as const}]}};
    expect(SceneSchema.safeParse(mapScene).success).toBe(true);
    const comparisonScene={...storyboard.scenes[0]!,comparisonData:{source:'Station records',unit:'mm',period:'2025 monsoon',series:[{name:'Observed',values:[{label:'Jul',value:22},{label:'Aug',value:31}]},{name:'Forecast',values:[{label:'Jul',value:24,lower:19,upper:28},{label:'Aug',value:29,lower:23,upper:37}]}]}};
    expect(SceneSchema.safeParse(comparisonScene).success).toBe(true);
  });

  it('routes new brand presets through the shared registry without changing storyboard compatibility',()=>{
    const storyboard=makeStoryboard('Case file','Records are reviewed.','bn','kalokhata');
    const scene={...storyboard.scenes[0]!,animationPresetId:'kalokhata.money-flow'};
    expect(SceneSchema.safeParse(scene).success).toBe(true);
    const node=sceneRegistry[scene.sceneType]({brand:brands.find(item=>item.id==='kalokhata')!,scene,progress:.5,title:storyboard.title,aspect:'portrait'});
    expect(isValidElement(node)).toBe(true);
    expect((node as ReactElement).type).toBe(GenericAnimationScene);
    expect((node as ReactElement<{rendererKey:string}>).props.rendererKey).toBe('kalokhata-flow');
  });

  it('resolves preset defaults and supports a non-graphic Bengal infantry treatment',()=>{
    const storyboard=makeStoryboard('Monsoon record','A cited account describes a movement.','en','delta-signal');
    const deltaScene={...storyboard.scenes[0]!,animationPresetId:'delta.rainfall'};
    const deltaNode=sceneRegistry[deltaScene.sceneType]({brand:brands.find(item=>item.id==='delta-signal')!,scene:deltaScene,progress:.5,title:storyboard.title,aspect:'landscape'});
    expect((deltaNode as ReactElement<{settings:{intensity:number}}>).props.settings.intensity).toBe(.62);

    const bengal=makeStoryboard('Infantry movement','A sourced account describes contact.','en','bengal-unfolded');
    const infantryScene={...bengal.scenes[0]!,animationPresetId:'bengal.infantry-engagement'};
    const infantryNode=sceneRegistry[infantryScene.sceneType]({brand:brands.find(item=>item.id==='bengal-unfolded')!,scene:infantryScene,progress:.5,title:bengal.title,aspect:'landscape'});
    expect((infantryNode as ReactElement<{rendererKey:string}>).props.rendererKey).toBe('bengal-infantry-contact');
  });
});
