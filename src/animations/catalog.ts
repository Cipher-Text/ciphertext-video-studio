import catalogJson from './catalog.json';
import type {BrandId,Scene,SceneAnimationConfig} from '../domain';

export type AnimationPreset={
  id:string;brandId:BrandId|null;name:string;category:string;description:string;
  rendererKey:string;version:number;tags:string[];defaults:Record<string,unknown>;
  requiredInputs?:string[];optionalInputs?:string[];assetRequirements?:string[];
  cameraSettings?:{defaultMovement:string;intensity:number;editable:boolean};motionParameters?:Record<string,number|string>;
  sceneTreatment?:string;transitionStyle?:string;atmosphereStyle?:string;textAnimation?:string;
  supportedAspectRatios?:Array<'portrait'|'landscape'|'square'>;estimatedRenderCost?:'low'|'medium'|'high';
  previewConfiguration?:{durationSeconds:number;aspectRatio:string;posterFrame:number};qualityCriteria?:string[];
};

export const animationPresets=catalogJson as AnimationPreset[];
export const animationPresetById=new Map(animationPresets.map(preset=>[preset.id,preset]));

const legacyModePreset:Record<NonNullable<SceneAnimationConfig['mode']>,string>={
  'battlefield-intro':'bengal.battlefield-intro',
  'troop-advance':'bengal.troop-advance',
  'tank-battle':'bengal.tank-battle',
  'tank-retreat':'bengal.tank-retreat',
  'battle-map':'bengal.battle-map',
  'brand-outro':'bengal.brand-outro',
  'layered-parallax':'shared.layered-parallax',
  'camera-only':'shared.camera-drift',
};

export const presetIdForScene=(scene:Pick<Scene,'animationPresetId'|'animationConfig'>):string|undefined=>
  scene.animationPresetId??(scene.animationConfig?.mode?legacyModePreset[scene.animationConfig.mode]:undefined);

