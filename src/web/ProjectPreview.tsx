import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Player,type PlayerRef} from '@remotion/player';
import type {BrandProfile,Storyboard} from '../domain';
import {MasterDocumentary} from '../video/MasterDocumentary';
import {getProjectVideoMetadata,type VideoFormat} from '../video/metadata';

export const ProjectPreview:React.FC<{brand:BrandProfile;title:string;format:VideoFormat;storyboard?:Storyboard}> = ({brand,title,format,storyboard})=>{
  const scenes=storyboard?.scenes??[];
  const videoScenes=scenes.map(scene=>({id:scene.id,text:scene.narration,label:scene.onScreenText,durationSeconds:scene.estimatedDurationSeconds,animation:scene.animation,sceneType:scene.sceneType,visualDescription:scene.visualDescription,sourceReferences:scene.sourceReferences,camera:scene.camera,animationConfig:scene.animationConfig,animationPresetId:scene.animationPresetId,transition:scene.transition,audio:scene.audio,assetPath:scene.assetPath,parallaxLayers:scene.parallaxLayers,geoJson:scene.geoJson,comparisonData:scene.comparisonData,mapData:scene.mapData,videoAsset:scene.videoAsset,chartData:scene.chartData,historyData:scene.historyData,softwareData:scene.softwareData}));
  if(!videoScenes.length)return <div className="preview-empty">Approve a script and prepare the storyboard to preview its motion.</div>;
  const metadata=getProjectVideoMetadata(format,storyboard!);
  return <SynchronizedPreview brand={brand} title={title} format={format} storyboard={storyboard!} scenes={videoScenes} metadata={metadata}/>;
};

const SynchronizedPreview:React.FC<{brand:BrandProfile;title:string;format:VideoFormat;storyboard:Storyboard;scenes:any[];metadata:ReturnType<typeof getProjectVideoMetadata>}> = ({brand,title,format,storyboard,scenes,metadata})=>{
  const player=useRef<PlayerRef>(null);const [frame,setFrame]=useState(0);
  const starts=useMemo(()=>metadata.sceneFrames.map((_,index)=>metadata.sceneFrames.slice(0,index).reduce((sum,count)=>sum+count,0)),[metadata.sceneFrames]);
  const activeIndex=Math.max(0,starts.findIndex((start,index)=>frame>=start&&(index===starts.length-1||frame<starts[index+1])));
  const activeScene=storyboard.scenes[activeIndex];
  useEffect(()=>{const instance=player.current;if(!instance)return;const onFrame=({detail}:{detail:{frame:number}})=>setFrame(detail.frame);instance.addEventListener('frameupdate',onFrame);return()=>instance.removeEventListener('frameupdate',onFrame)},[]);
  return <>
    <Player ref={player} component={MasterDocumentary} durationInFrames={metadata.durationInFrames} compositionWidth={metadata.width} compositionHeight={metadata.height} fps={metadata.fps} inputProps={{brand,title,language:storyboard.language,scenes}} controls clickToPlay loop style={{width:'100%',aspectRatio:`${metadata.width} / ${metadata.height}`,background:brand.backgroundColor}}/>
    <div className="timeline" aria-label="Storyboard timeline">
      <div className="timeline-heading"><div><span className="eyebrow">TIMELINE</span><strong>{activeScene?`Scene ${activeIndex+1} · ${activeScene.narration}`:'Storyboard timeline'}</strong></div><span className="timeline-time">{(frame/metadata.fps).toFixed(1)}s / {(metadata.durationInFrames/metadata.fps).toFixed(1)}s</span></div>
      <div className="timeline-track" role="group" aria-label="Jump to scene">
        {storyboard.scenes.map((scene,index)=>{const seconds=metadata.sceneFrames[index]/metadata.fps;return <button key={scene.id} type="button" className={`timeline-clip ${index===activeIndex?'current':''}`} style={{flexGrow:metadata.sceneFrames[index],flexBasis:0}} title={`Scene ${index+1}: ${seconds.toFixed(1)} seconds`} aria-label={`Jump to scene ${index+1}, ${seconds.toFixed(1)} seconds`} aria-current={index===activeIndex?'step':undefined} onClick={()=>{player.current?.seekTo(starts[index]);setFrame(starts[index])}}><span>{String(index+1).padStart(2,'0')}</span><b>{seconds.toFixed(1)}s</b><i className={`transition-mark ${scene.transition?.type??'cut'}`}/></button>})}
        <span className="timeline-playhead" style={{left:`${Math.min(100,frame/metadata.durationInFrames*100)}%`}}/>
      </div>
      <div className="timeline-legend"><span>{format.toUpperCase()} · {metadata.width} × {metadata.height}</span><span>Scene length follows narration when it runs longer</span></div>
    </div>
  </>;
};
