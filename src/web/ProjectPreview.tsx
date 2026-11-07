import React from 'react';
import {Player} from '@remotion/player';
import type {BrandProfile,Storyboard} from '../domain';
import {MasterDocumentary} from '../video/MasterDocumentary';

export const ProjectPreview:React.FC<{brand:BrandProfile;title:string;storyboard?:Storyboard}> = ({brand,title,storyboard})=>{
  const scenes=storyboard?.scenes??[];
  const videoScenes=scenes.map(scene=>({id:scene.id,text:scene.narration,label:scene.onScreenText,durationSeconds:scene.estimatedDurationSeconds}));
  const durationInFrames=Math.max(30,videoScenes.reduce((total,scene)=>total+Math.round(scene.durationSeconds*30),0));
  if(!videoScenes.length)return <div className="preview-empty">Approve a script and prepare the storyboard to preview its motion.</div>;
  return <Player component={MasterDocumentary} durationInFrames={durationInFrames} compositionWidth={1920} compositionHeight={1080} fps={30} inputProps={{brand,title,scenes:videoScenes}} controls clickToPlay loop style={{width:'100%',aspectRatio:'16 / 9',background:brand.backgroundColor}} />;
};
