import React from 'react';
import {Player} from '@remotion/player';
import type {BrandProfile,Storyboard} from '../domain';
import {MasterDocumentary} from '../video/MasterDocumentary';
import {getProjectVideoMetadata,type VideoFormat} from '../video/metadata';

export const ProjectPreview:React.FC<{brand:BrandProfile;title:string;format:VideoFormat;storyboard?:Storyboard}> = ({brand,title,format,storyboard})=>{
  const scenes=storyboard?.scenes??[];
  const videoScenes=scenes.map(scene=>({id:scene.id,text:scene.narration,label:scene.onScreenText,durationSeconds:scene.estimatedDurationSeconds,animation:scene.animation,sceneType:scene.sceneType,visualDescription:scene.visualDescription,sourceReferences:scene.sourceReferences,camera:scene.camera,transition:scene.transition,audio:scene.audio,assetPath:scene.assetPath}));
  if(!videoScenes.length)return <div className="preview-empty">Approve a script and prepare the storyboard to preview its motion.</div>;
  const metadata=getProjectVideoMetadata(format,storyboard!);
  return <Player component={MasterDocumentary} durationInFrames={metadata.durationInFrames} compositionWidth={metadata.width} compositionHeight={metadata.height} fps={metadata.fps} inputProps={{brand,title,language:storyboard!.language,scenes:videoScenes}} controls clickToPlay loop style={{width:'100%',aspectRatio:`${metadata.width} / ${metadata.height}`,background:brand.backgroundColor}} />;
};
