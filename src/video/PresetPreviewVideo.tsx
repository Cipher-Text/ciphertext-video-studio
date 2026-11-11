import React from 'react';
import {AbsoluteFill,Easing,interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import type {BrandProfile,Scene} from '../domain';
import type {AnimationPreset} from '../animations/catalog';
import {sceneRegistry} from './sceneRegistry';

export type PresetPreviewProps={brand:BrandProfile;title:string;preset:AnimationPreset;cameraMovement?:'zoom-in'|'zoom-out'|'pan-left'|'pan-right'|'rise'|'none'|'track-subject';intensity?:number};

export const PresetPreviewVideo:React.FC<PresetPreviewProps>=({brand,title,preset,cameraMovement='zoom-in',intensity=.08})=>{
 const frame=useCurrentFrame();const {fps,width,height}=useVideoConfig();const duration=Math.max(1,Math.round(fps*6));const progress=frame/(duration-1);
 const cameraMode=preset.rendererKey==='shared-camera'?'camera-only':preset.rendererKey==='shared-parallax'?'layered-parallax':undefined;
 const scene={id:`preview-${preset.id.replace(/[^A-Za-z0-9_-]/g,'-')}`,order:0,sceneType:preset.rendererKey==='campaign-map'?'historical-map':'cinematic-image',narration:'',onScreenText:preset.name,estimatedDurationSeconds:6,visualDescription:'',animation:'zoom-in',approvalStatus:'draft',sourceReferences:[],animationPresetId:preset.id,animationConfig:{...(cameraMode?{mode:cameraMode}:{}),camera:{movement:cameraMovement,intensity},settings:{...preset.defaults,intensity}}} as Scene;
 const Component=sceneRegistry[scene.sceneType];
 const ease=Easing.inOut(Easing.cubic);const frames=[0,duration-1];const shift=interpolate(frame,frames,[0,intensity*Math.min(width,height)*.16],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:ease});const zoom=interpolate(frame,frames,cameraMovement==='zoom-out'?[1+intensity,1]:[1,1+intensity],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:ease});
 const x=cameraMovement==='pan-left'||cameraMovement==='track-subject'?-shift:cameraMovement==='pan-right'?shift:0;const y=cameraMovement==='rise'?-shift:0;const transform=`translate(${x}px,${y}px) scale(${cameraMovement==='none'?1:zoom})`;
 return <AbsoluteFill style={{overflow:'hidden',background:brand.backgroundColor}}><AbsoluteFill style={{transform,transformOrigin:'center'}}><Component brand={brand} scene={scene} progress={progress} title={title} aspect={height>width*1.15?'portrait':width>height*1.15?'landscape':'square'}/></AbsoluteFill></AbsoluteFill>;
};
