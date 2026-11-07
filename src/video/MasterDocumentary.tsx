import React,{useMemo} from 'react';
import {AbsoluteFill,Audio,Sequence,interpolate,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import type {BrandProfile,SceneType} from '../domain';
import {sceneRegistry} from './sceneRegistry';
import {buildCaptionSegments} from './captions';

export type VideoScene={id:string;text:string;label:string;durationSeconds?:number;sceneType?:SceneType;animation?:'zoom-in'|'pan-left'|'fade'|'rise';visualDescription?:string;sourceReferences?:string[];camera?:{movement:'zoom-in'|'zoom-out'|'pan-left'|'pan-right'|'rise'|'none';intensity:number};transition?:{type:'cut'|'fade'|'wipe';durationSeconds:number};audio?:{src:string;durationSeconds:number;voice:string;cacheKey:string};assetPath?:string;videoAsset?:{src:string;trimStartSeconds:number;trimEndSeconds:number;fit:'cover'|'contain';positionX:number;positionY:number};chartData?:{chartType:'bar'|'line';unit:string;period:string;source:string;points:{label:string;value:number}[]};historyData?:{events:{date:string;title:string;description:string;source:string;assetPath?:string;illustrative:boolean}[]};softwareData?:{callouts:{text:string;startSeconds:number;endSeconds:number;targetX:number;targetY:number;labelX:number;labelY:number}[]}};
export type VideoProps={brand:BrandProfile;title:string;language?:'en'|'bn';scenes:VideoScene[];musicSrc?:string};

const AnimatedScene:React.FC<{brand:BrandProfile;title:string;language:'en'|'bn';scene:VideoScene;durationInFrames:number;index:number}>=({brand,title,language,scene,durationInFrames,index})=>{
  const frame=useCurrentFrame();const {fps}=useVideoConfig();
  const captionSegments=useMemo(()=>scene.audio?buildCaptionSegments(scene.text,scene.audio.durationSeconds):[],[scene.text,scene.audio?.durationSeconds,scene.audio?.cacheKey]);
  const elapsedSeconds=frame/fps;const caption=scene.audio?captionSegments.find(segment=>elapsedSeconds>=segment.startSeconds&&elapsedSeconds<segment.endSeconds)?.text:scene.text;
  const legacyMovement=scene.animation==='pan-left'?'pan-left':scene.animation==='rise'?'rise':scene.animation==='fade'?'none':'zoom-in';
  const movement=scene.camera?.movement??legacyMovement;const intensity=scene.camera?.intensity??0.08;
  const endpoints=movement==='zoom-out'?[1+intensity,1]:movement==='none'?[1,1]:[1,1+intensity];
  const scale=interpolate(frame,[0,Math.max(1,durationInFrames-1)],endpoints,{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const shift=interpolate(frame,[0,Math.max(1,durationInFrames-1)],[0,intensity*100],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const enterFrames=Math.min(Math.round(fps*.45),Math.max(1,Math.floor(durationInFrames*.12)));
  const transition=scene.transition??(scene.animation==='fade'?{type:'fade' as const,durationSeconds:.4}:undefined);
  const transitionFrames=Math.min(Math.round((transition?.durationSeconds??0)*fps),Math.floor(durationInFrames/3));
  const alpha=transition?.type==='fade'&&transitionFrames?interpolate(frame,[0,transitionFrames,durationInFrames-transitionFrames,durationInFrames],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}):interpolate(frame,[0,enterFrames],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const Component=sceneRegistry[scene.sceneType??'cinematic-image'];
  const parsedScene={id:scene.id,order:index,sceneType:scene.sceneType??'cinematic-image',narration:scene.text,onScreenText:scene.label,estimatedDurationSeconds:durationInFrames/fps,visualDescription:scene.visualDescription??'',animation:scene.animation??'zoom-in',approvalStatus:'draft',sourceReferences:scene.sourceReferences??[],camera:scene.camera,transition,audio:scene.audio,assetPath:scene.assetPath,videoAsset:scene.videoAsset,chartData:scene.chartData,historyData:scene.historyData,softwareData:scene.softwareData} as const;
  const cameraTransform=movement==='pan-left'?`translate(${-shift}px,0) scale(${scale})`:movement==='pan-right'?`translate(${shift}px,0) scale(${scale})`:movement==='rise'?`translate(0,${-shift}px) scale(${scale})`:`scale(${scale})`;
  const wipe=transition?.type==='wipe'&&transitionFrames?`inset(0 ${Math.max(0,100-frame/transitionFrames*100)}% 0 0)`:'none';
  return <AbsoluteFill style={{overflow:'hidden',background:brand.backgroundColor,opacity:alpha,clipPath:wipe}}>
    {scene.audio&&<Audio src={staticFile(scene.audio.src)} volume={1} />}
    <AbsoluteFill style={{transform:cameraTransform,transformOrigin:'center'}}><Component brand={brand} scene={parsedScene} progress={frame/Math.max(1,durationInFrames-1)} title={title}/></AbsoluteFill>
    {caption&&<div lang={language==='bn'?'bn':'en'} style={{position:'absolute',left:'8%',right:'8%',bottom:66,textAlign:'center',fontFamily:'Arial,sans-serif',fontSize:25,lineHeight:1.4,color:'#fff',textShadow:'0 2px 12px #000',background:'rgba(0,0,0,.62)',padding:'10px 18px',borderRadius:4}}>{caption}</div>}
    <div style={{position:'absolute',bottom:24,left:32,right:32,display:'flex',justifyContent:'space-between',fontFamily:'Arial,sans-serif',fontSize:14,letterSpacing:2,color:brand.secondaryColor,textShadow:'0 2px 8px #000'}}><span>{brand.name.toUpperCase()}</span><span>{scene.sourceReferences?.length?'SOURCE REFERENCED':'ILLUSTRATIVE / SOURCE NOT ATTACHED'}</span></div>
  </AbsoluteFill>;
};

export const MasterDocumentary:React.FC<VideoProps>=({brand,title,language='en',scenes,musicSrc})=>{
  const {fps}=useVideoConfig();const normalized=scenes.length?scenes:[{id:'fallback',text:'Add scenes to begin your story.',label:'STORYBOARD',durationSeconds:5}];let cursor=0;
  const intervals=normalized.map((scene,index)=>{const videoDuration=scene.videoAsset?scene.videoAsset.trimEndSeconds-scene.videoAsset.trimStartSeconds:0;const duration=Math.max(1,Math.ceil(Math.max(scene.audio?.durationSeconds??0,scene.durationSeconds??15/normalized.length,videoDuration)*fps));const from=cursor;cursor+=duration;return{scene,index,from,duration}});
  return <AbsoluteFill style={{background:brand.backgroundColor}}>{musicSrc&&<Audio src={staticFile(musicSrc)} volume={0.18}/ >}{intervals.map(({scene,index,from,duration})=><Sequence key={scene.id} from={from} durationInFrames={duration} premountFor={fps}><AnimatedScene brand={brand} title={title} language={language} scene={scene} durationInFrames={duration} index={index}/></Sequence>)}</AbsoluteFill>;
};
