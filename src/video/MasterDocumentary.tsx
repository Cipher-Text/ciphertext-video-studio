import React,{useMemo} from 'react';
import {AbsoluteFill,Audio,interpolate,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {linearTiming,TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {wipe} from '@remotion/transitions/wipe';
import type {BrandProfile,Scene,SceneType} from '../domain';
import {sceneRegistry} from './sceneRegistry';
import {buildCaptionSegments} from './captions';
import {transitionFrameDurations} from './metadata';
import type {SceneAnimationConfig} from '../domain';
import {cinematicCameraProgress} from './motionSystem';

export type VideoScene={id:string;text:string;label:string;durationSeconds?:number;sceneType?:SceneType;animation?:'zoom-in'|'pan-left'|'fade'|'rise';visualDescription?:string;sourceReferences?:string[];camera?:{movement:'zoom-in'|'zoom-out'|'pan-left'|'pan-right'|'rise'|'none';intensity:number};animationConfig?:SceneAnimationConfig;animationPresetId?:string;transition?:{type:'cut'|'fade'|'wipe';durationSeconds:number};audio?:{src:string;durationSeconds:number;voice:string;cacheKey:string};assetPath?:string;parallaxLayers?:{assetPath:string;depth:number;opacity:number}[];geoJson?:Scene['geoJson'];comparisonData?:Scene['comparisonData'];mapData?:Scene['mapData'];videoAsset?:{src:string;trimStartSeconds:number;trimEndSeconds:number;fit:'cover'|'contain';positionX:number;positionY:number};chartData?:{chartType:'bar'|'line';unit:string;period:string;source:string;points:{label:string;value:number}[]};historyData?:{events:{date:string;title:string;description:string;source:string;assetPath?:string;illustrative:boolean}[]};softwareData?:{callouts:{text:string;startSeconds:number;endSeconds:number;targetX:number;targetY:number;labelX:number;labelY:number}[]}};
export type VideoProps={brand:BrandProfile;title:string;language?:'en'|'bn';scenes:VideoScene[];musicSrc?:string};

const AnimatedScene:React.FC<{brand:BrandProfile;title:string;language:'en'|'bn';scene:VideoScene;durationInFrames:number;index:number}>=({brand,title,language,scene,durationInFrames,index})=>{
  const frame=useCurrentFrame();const {fps,width,height}=useVideoConfig();
  const captionSegments=useMemo(()=>scene.audio?buildCaptionSegments(scene.text,scene.audio.durationSeconds):[],[scene.text,scene.audio?.durationSeconds,scene.audio?.cacheKey]);
  const elapsedSeconds=frame/fps;const caption=scene.audio?captionSegments.find(segment=>elapsedSeconds>=segment.startSeconds&&elapsedSeconds<segment.endSeconds)?.text:scene.text;
  const legacyMovement=scene.animation==='pan-left'?'pan-left':scene.animation==='rise'?'rise':scene.animation==='fade'?'none':'zoom-in';
  const movement=scene.animationConfig?.camera?.movement??scene.camera?.movement??legacyMovement;const intensity=scene.animationConfig?.camera?.intensity??scene.camera?.intensity??0.08;
  const cameraProgress=cinematicCameraProgress(frame,durationInFrames);
  const endpoints=movement==='zoom-out'?[1+intensity,1]:movement==='none'?[1,1]:[1,1+intensity];
  const scale=interpolate(cameraProgress,[0,1],endpoints,{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const shift=interpolate(cameraProgress,[0,1],[0,intensity*100],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const trackDirection=(scene.animationConfig?.camera?.subject??'pt76')==='pt76'?1:-1;
  const trackOffset=movement==='track-subject'?interpolate(cameraProgress,[0,1],[trackDirection*width*.12,-trackDirection*width*.12],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}):0;
  const transition=scene.transition??(scene.animation==='fade'?{type:'fade' as const,durationSeconds:.4}:undefined);
  const alpha=1;
  const Component=sceneRegistry[scene.sceneType??'cinematic-image'];
  const parsedScene={id:scene.id,order:index,sceneType:scene.sceneType??'cinematic-image',narration:scene.text,onScreenText:scene.label,estimatedDurationSeconds:durationInFrames/fps,visualDescription:scene.visualDescription??'',animation:scene.animation??'zoom-in',approvalStatus:'draft',sourceReferences:scene.sourceReferences??[],camera:scene.camera,animationConfig:scene.animationConfig,animationPresetId:scene.animationPresetId,transition,audio:scene.audio,assetPath:scene.assetPath,parallaxLayers:scene.parallaxLayers,geoJson:scene.geoJson,comparisonData:scene.comparisonData,mapData:scene.mapData,videoAsset:scene.videoAsset,chartData:scene.chartData,historyData:scene.historyData,softwareData:scene.softwareData} as const;
  const cameraTransform=movement==='pan-left'?`translate(${-shift}px,0) scale(${scale})`:movement==='pan-right'?`translate(${shift}px,0) scale(${scale})`:movement==='rise'?`translate(0,${-shift}px) scale(${scale})`:movement==='track-subject'?`translate(${trackOffset}px,0) scale(${scale})`:`scale(${scale})`;
  return <AbsoluteFill style={{overflow:'hidden',background:brand.backgroundColor,opacity:alpha}}>
    {scene.audio&&<Audio src={staticFile(scene.audio.src)} volume={1} />}
    <AbsoluteFill style={{transform:cameraTransform,transformOrigin:'center'}}><Component brand={brand} scene={parsedScene} progress={frame/Math.max(1,durationInFrames-1)} title={title} aspect={height>width*1.15?'portrait':width>height*1.15?'landscape':'square'}/></AbsoluteFill>
    {caption&&<div lang={language==='bn'?'bn':'en'} style={{position:'absolute',left:'8%',right:'8%',bottom:66,textAlign:'center',fontFamily:'Arial,sans-serif',fontSize:25,lineHeight:1.4,color:'#fff',textShadow:'0 2px 12px #000',background:'rgba(0,0,0,.62)',padding:'10px 18px',borderRadius:4}}>{caption}</div>}
    <div style={{position:'absolute',bottom:24,left:32,right:32,display:'flex',justifyContent:'space-between',fontFamily:'Arial,sans-serif',fontSize:14,letterSpacing:2,color:brand.secondaryColor,textShadow:'0 2px 8px #000'}}><span>{brand.name.toUpperCase()}</span><span>{scene.sourceReferences?.length?'SOURCE REFERENCED':'ILLUSTRATIVE / SOURCE NOT ATTACHED'}</span></div>
  </AbsoluteFill>;
};

export const MasterDocumentary:React.FC<VideoProps>=({brand,title,language='en',scenes,musicSrc})=>{
  const {fps}=useVideoConfig();const normalized=scenes.length?scenes:[{id:'fallback',text:'Add scenes to begin your story.',label:'STORYBOARD',durationSeconds:5}];
  const durations=normalized.map(scene=>Math.max(1,Math.ceil(Math.max(scene.audio?.durationSeconds??0,scene.durationSeconds??15/normalized.length,scene.videoAsset?scene.videoAsset.trimEndSeconds-scene.videoAsset.trimStartSeconds:0)*fps)));
  const storyboard={scenes:normalized.map((scene,index)=>({estimatedDurationSeconds:durations[index]/fps,transition:scene.transition??(scene.animation==='fade'?{type:'fade' as const,durationSeconds:.4}:undefined),videoAsset:scene.videoAsset}))} as Parameters<typeof transitionFrameDurations>[0];
  const transitions=transitionFrameDurations(storyboard,fps);
  const elements:React.ReactNode[]=[];
  normalized.forEach((scene,index)=>{
    const incoming=index>0?Math.ceil(transitions[index-1]/2):0;
    const outgoing=index<transitions.length?Math.floor(transitions[index]/2):0;
    const duration=durations[index]+incoming+outgoing;
    elements.push(<TransitionSeries.Sequence key={`scene-${scene.id}`} durationInFrames={duration}><AnimatedScene brand={brand} title={title} language={language} scene={scene} durationInFrames={duration} index={index}/></TransitionSeries.Sequence>);
    if(transitions[index]){
      const type=storyboard.scenes[index].transition?.type;
      if(type==='wipe')elements.push(<TransitionSeries.Transition key={`transition-${scene.id}`} presentation={wipe()} timing={linearTiming({durationInFrames:transitions[index]})}/>);
      else elements.push(<TransitionSeries.Transition key={`transition-${scene.id}`} presentation={fade()} timing={linearTiming({durationInFrames:transitions[index]})}/>);
    }
  });
  return <AbsoluteFill style={{background:brand.backgroundColor}}>{musicSrc&&<Audio src={staticFile(musicSrc)} volume={0.18}/>}<TransitionSeries>{elements}</TransitionSeries></AbsoluteFill>;
};
