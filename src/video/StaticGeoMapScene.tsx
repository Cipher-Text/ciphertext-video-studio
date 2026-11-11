import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {SceneVisualProps} from './sceneRegistry';
import {projectGeoJson} from './geoJsonGeometry';
import {AnimatedBattleScene} from './battlefieldAnimations';

/** Existing dependency-light SVG renderer retained as the compatibility and error fallback. */
export const StaticGeoMapScene:React.FC<SceneVisualProps>=({brand,scene,progress})=>{
  if(scene.animationConfig?.mode)return <AnimatedBattleScene brand={brand} scene={scene} progress={progress}/>;
  const collection=scene.geoJson;
  if(collection){
    const projected=projectGeoJson(collection);
    return <AbsoluteFill style={{background:'linear-gradient(145deg,#142126,#101617)',color:'#f4f0e9',fontFamily:'Arial,sans-serif'}}>
      <svg viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid meet" style={{position:'absolute',left:'5%',top:'12%',width:'90%',height:'72%'}}>
        {projected.paths.map((path,index)=><path key={`geo-path-${index}`} d={path} fill={path.endsWith('Z')?`${brand.primaryColor}28`:'none'} stroke={brand.primaryColor} strokeWidth="3" strokeLinejoin="round"/>)}
        {projected.points.map((point,index)=><circle key={`geo-point-${index}`} cx={point.x} cy={point.y} r="7" fill={brand.secondaryColor} stroke={brand.primaryColor} strokeWidth="3"/>)}
      </svg>
      <div style={{position:'absolute',left:'7%',top:'5%',fontFamily:'Georgia,serif',fontSize:36,fontWeight:700}}>{scene.onScreenText||scene.narration}</div>
      <div style={{position:'absolute',bottom:'5%',left:'7%',right:'7%',fontSize:13,color:'#c1c7c3'}}>GeoJSON · {collection.source} · coordinates shown in lon/lat</div>
    </AbsoluteFill>;
  }
  return <AbsoluteFill style={{background:'#192126'}}>
    <svg viewBox="0 0 1200 700" style={{position:'absolute',inset:'8%',width:'84%',height:'84%',opacity:.65}}>
      <path d="M40 370 C150 280 245 350 350 245 S570 335 665 220 S890 270 1160 95 M80 580 C260 440 350 520 475 390 S730 500 840 345 S1010 400 1160 310" fill="none" stroke={brand.primaryColor} strokeWidth="5"/>
      <path d="M260 50 Q350 190 290 280 T360 530 M660 55 Q580 180 650 300 T600 660 M920 50 Q850 160 920 260 T880 630" fill="none" stroke="#d7c8a2" strokeWidth="2" strokeDasharray="8 14"/>
    </svg>
    <AbsoluteFill style={{justifyContent:'center',padding:'8%',fontFamily:'Arial,sans-serif',color:'#f4f0e9'}}>
      <div style={{fontSize:20,letterSpacing:6,color:brand.primaryColor,textTransform:'uppercase',marginBottom:26}}>Historical map schematic</div>
      <div style={{fontFamily:'Georgia,serif',fontSize:54,fontWeight:700,lineHeight:1.08,maxWidth:'90%'}}>{scene.onScreenText||scene.narration}</div>
      <p style={{fontSize:21}}>No geographic dataset is attached to this scene.</p>
      <div style={{position:'absolute',bottom:'6%',left:'8%',color:brand.secondaryColor,fontSize:17,letterSpacing:2,textTransform:'uppercase'}}>Schematic only · attach sourced GeoJSON for geographic reconstruction</div>
    </AbsoluteFill>
  </AbsoluteFill>;
};
