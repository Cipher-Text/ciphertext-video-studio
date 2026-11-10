import React from 'react';
import {AbsoluteFill,interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import type {BrandProfile,Scene} from '../domain';
import type {AnimationPreset} from '../animations/catalog';
import {sceneRegistry} from './sceneRegistry';

export type PresetPreviewProps={brand:BrandProfile;title:string;preset:AnimationPreset};

export const PresetPreviewVideo:React.FC<PresetPreviewProps>=({brand,title,preset})=>{
 const frame=useCurrentFrame();const {fps,width,height}=useVideoConfig();const duration=Math.max(1,Math.round(fps*6));const progress=frame/(duration-1);
 const cameraMode=preset.rendererKey==='shared-camera'?'camera-only':preset.rendererKey==='shared-parallax'?'layered-parallax':undefined;
 const scene={id:`preview-${preset.id.replace(/[^A-Za-z0-9_-]/g,'-')}`,order:0,sceneType:preset.rendererKey==='battlefield-map'?'historical-map':'cinematic-image',narration:'',onScreenText:preset.name,estimatedDurationSeconds:6,visualDescription:'',animation:'zoom-in',approvalStatus:'draft',sourceReferences:[],animationPresetId:preset.id,animationConfig:cameraMode?{mode:cameraMode,camera:{movement:cameraMode==='layered-parallax'?'zoom-in':'pan-left',intensity:.12},settings:preset.defaults}:undefined} as Scene;
 const Component=sceneRegistry[scene.sceneType];
 const camera=cameraMode==='camera-only'?'pan-left':undefined;const strength=.12;const shift=interpolate(frame,[0,duration-1],[0,strength*100],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});const scale=interpolate(frame,[0,duration-1],[1,1+strength],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const transform=camera==='pan-left'?`translate(${-shift}px,0) scale(${scale})`:`scale(${scale})`;
 return <AbsoluteFill style={{overflow:'hidden',background:brand.backgroundColor}}><AbsoluteFill style={{transform,transformOrigin:'center'}}><Component brand={brand} scene={scene} progress={progress} title={title} aspect={height>width*1.15?'portrait':width>height*1.15?'landscape':'square'}/></AbsoluteFill></AbsoluteFill>;
};
