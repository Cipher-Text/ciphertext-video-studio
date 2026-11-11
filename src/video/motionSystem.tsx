import React from 'react';
import {AbsoluteFill,Easing,interpolate,spring} from 'remotion';

const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};

export const cinematicCameraProgress=(frame:number,duration:number)=>interpolate(frame,[0,Math.max(1,duration-1)],[0,1],{...clamp,easing:Easing.inOut(Easing.cubic)});

export const CinematicAtmosphere:React.FC<{frame:number;seed?:number;strength?:number;warmth?:string}>=({frame,seed=0,strength=.28,warmth='#d6c29c'})=>{
 const dust=Array.from({length:24},(_,i)=>{const phase=((i*173+seed*71)%997)/997;const x=((phase*1000+(frame*(i%3+1)*.28))%1080);const y=(i*149+seed*53)%1920-frame*(.12+(i%4)*.05);return{x,y,r:1+(i%3)*.7,opacity:.08+(i%4)*.035}});
 const safeId=`cinematic-atmosphere-${seed}`;
 return <AbsoluteFill style={{pointerEvents:'none'}}>
  <div style={{position:'absolute',inset:0,background:`linear-gradient(118deg,${warmth}18,transparent 43%)`,mixBlendMode:'screen'}}/>
  <svg viewBox="0 0 1080 1920" preserveAspectRatio="none" width="100%" height="100%" style={{position:'absolute',inset:0}}>
   <defs><radialGradient id={`${safeId}-vignette`}><stop offset="47%" stopColor="#070908" stopOpacity="0"/><stop offset="100%" stopColor="#070908" stopOpacity={strength}/></radialGradient></defs>
   {dust.map((particle,index)=><circle key={index} cx={particle.x} cy={particle.y} r={particle.r} fill="#f2e8d4" opacity={particle.opacity}/>)}
   <rect width="1080" height="1920" fill={`url(#${safeId}-vignette)`}/>
  </svg>
 </AbsoluteFill>;
};

export const KineticTitle:React.FC<{frame:number;fps:number;text:string;color:string;fontFamily?:string;delay?:number;maxWidth?:string}>=({frame,fps,text,color,fontFamily='Georgia,serif',delay=0,maxWidth='84%'})=>{
 const reveal=spring({frame:Math.max(0,frame-delay),fps,config:{damping:24,stiffness:58,mass:.9}});
 const y=interpolate(reveal,[0,1],[20,0],clamp);
 return <div style={{maxWidth,opacity:reveal,transform:`translateY(${y}px)`,fontFamily,fontSize:'clamp(25px,4.2vw,52px)',fontWeight:650,lineHeight:1.2,letterSpacing:'-.02em',color,textShadow:'0 3px 24px #0009',overflowWrap:'anywhere'}}>{text}</div>;
};
