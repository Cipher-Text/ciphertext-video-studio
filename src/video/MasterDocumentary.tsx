import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {BrandProfile} from '../domain';

export type VideoProps={brand:BrandProfile;title:string;scenes:{id:string;text:string;label:string;durationSeconds?:number}[];musicSrc?:string};
const Scene:React.FC<{brand:BrandProfile;title:string;text:string;label:string;index:number}> = ({brand,title,text,label,index})=>{
  const frame=useCurrentFrame(); const {fps}=useVideoConfig();
  const entrance=spring({frame,fps,config:{damping:20,stiffness:65}});
  const zoom=interpolate(frame,[0,150],[1,1.12],{extrapolateRight:'clamp'});
  const opacity=interpolate(frame,[0,14,130,150],[0,1,1,0],{extrapolateRight:'clamp'});
  return <AbsoluteFill style={{background:brand.backgroundColor,overflow:'hidden',color:'#f6f0e7',fontFamily:'Georgia, serif'}}>
    <AbsoluteFill style={{background:`radial-gradient(ellipse at ${38+index*18}% ${42-index*6}%, ${brand.primaryColor}50, transparent 42%), linear-gradient(135deg,${brand.backgroundColor},#090a0b)` ,transform:`scale(${zoom})`}}/>
    <AbsoluteFill style={{opacity:.17,backgroundImage:'linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,.12) 1px, transparent 1px)',backgroundSize:'76px 76px',maskImage:'linear-gradient(90deg,transparent,#000,transparent)'}}/>
    <AbsoluteFill style={{justifyContent:'center',padding:'10%',opacity,transform:`translateY(${(1-entrance)*32}px)`}}>
      <div style={{color:brand.primaryColor,fontFamily:'Arial,sans-serif',fontSize:24,letterSpacing:8,textTransform:'uppercase',marginBottom:28}}>{label}</div>
      <div style={{fontSize:90,fontWeight:700,lineHeight:1.05,maxWidth:1370}}>{index===0?title:text}</div>
      {index!==0&&<div style={{fontFamily:'Arial,sans-serif',fontSize:35,lineHeight:1.5,maxWidth:1140,marginTop:38,color:'#e2ded6'}}>{text}</div>}
      <div style={{position:'absolute',bottom:126,left:'10%',right:'10%',textAlign:'center',fontFamily:'Arial,sans-serif',fontSize:26,lineHeight:1.4,color:'#fff',textShadow:'0 2px 12px #000',background:'rgba(0,0,0,.42)',padding:'10px 18px'}}>{text}</div>
      <div style={{position:'absolute',bottom:62,left:'10%',right:'10%',display:'flex',justifyContent:'space-between',fontFamily:'Arial,sans-serif',fontSize:18,letterSpacing:3,color:brand.secondaryColor}}><span>{brand.name.toUpperCase()}</span><span>ILLUSTRATIVE VISUAL</span></div>
    </AbsoluteFill>
  </AbsoluteFill>;
};

export const MasterDocumentary:React.FC<VideoProps>=({brand,title,scenes,musicSrc})=>{
  const {fps}=useVideoConfig();
  const normalized=scenes.length?scenes:[{id:'fallback',text:'Add scenes to begin your story.',label:'STORYBOARD'}];
  let cursor=0;
  const intervals=normalized.map((scene,index)=>{const duration=Math.max(1,Math.round((scene.durationSeconds??15/normalized.length)*fps));const from=cursor;cursor+=duration;return{scene,index,from,duration}});
  return <AbsoluteFill style={{background:brand.backgroundColor}}>{musicSrc&&<Audio src={staticFile(musicSrc)} volume={0.18}/ >}{intervals.map(({scene,index,from,duration})=><Sequence key={scene.id} from={from} durationInFrames={duration}><Scene brand={brand} title={title} text={scene.text} label={scene.label} index={index}/></Sequence>)}</AbsoluteFill>;
};
