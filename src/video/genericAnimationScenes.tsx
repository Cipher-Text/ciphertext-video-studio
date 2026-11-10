import React from 'react';
import {AbsoluteFill,interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import type {BrandProfile,Scene,SceneAnimationSettings} from '../domain';

type GenericAnimationProps={brand:BrandProfile;scene:Scene;progress:number;rendererKey:string;settings?:SceneAnimationSettings};
const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
const labelStyle:React.CSSProperties={position:'absolute',left:'7%',right:'7%',top:'8%',color:'#f5f1e9',fontFamily:'Arial,sans-serif',fontWeight:700,fontSize:'clamp(20px,4.4vw,48px)',lineHeight:1.15,textShadow:'0 2px 14px #0009'};
const footerStyle:React.CSSProperties={position:'absolute',left:'7%',right:'7%',bottom:'6%',color:'#e2ded4',fontFamily:'Arial,sans-serif',fontSize:'clamp(10px,1.4vw,16px)',letterSpacing:2,textShadow:'0 1px 10px #000',display:'flex',justifyContent:'space-between',gap:20};

const SoldierAdvance:React.FC<GenericAnimationProps>=({brand,scene,progress})=>{
 const frame=useCurrentFrame();
 return <AbsoluteFill style={{background:'linear-gradient(#53615c 0%,#a3a18a 47%,#44483b 48%,#20231e 100%)',overflow:'hidden'}}>
  <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" width="100%" height="100%">
   <path d="M0 520 Q180 420 350 520T700 500T1000 520V1000H0Z" fill="#677158"/><path d="M0 655 Q200 575 405 650T780 625T1000 655V1000H0Z" fill="#424a38"/>
   {[0,1,2,3,4,5,6,7,8].map(i=>{const p=(progress+i*.08)%1,x=interpolate(p,[0,1],[120+i*36,880+i*10],clamp),y=635+(i%3)*31;const s=.5+(i%4)*.09;return <g key={i} transform={`translate(${x},${y+Math.sin((frame+i*7)*.18)*3}) scale(${s})`} fill={brand.backgroundColor} stroke="#c8c3ad" strokeOpacity=".32" strokeWidth="2"><circle cy="-42" r="12"/><path d="M-13 -28h26l12 58h-12L2 -4L-5 31h-13l5-39-20 23-8-7z"/><path d="M-20 -18l36 8" stroke={brand.secondaryColor} strokeWidth="8"/></g>})}
   <path d="M60 783 Q350 730 940 785" fill="none" stroke={brand.primaryColor} strokeWidth="5" strokeDasharray="16 16" strokeDashoffset={-progress*500}/>
  </svg>
  <div style={labelStyle}>{scene.onScreenText||scene.narration}</div><div style={footerStyle}><span>{brand.name.toUpperCase()}</span><span>ILLUSTRATIVE MOVEMENT · VERIFY UNIT DETAILS</span></div>
 </AbsoluteFill>;
};

const InfantryContact:React.FC<GenericAnimationProps>=({brand,scene,progress})=>{
 const frame=useCurrentFrame();
 const flash=Math.sin(frame*.16)>0.86?1:0;
 return <AbsoluteFill style={{background:'linear-gradient(#414d4b,#8e927d 43%,#45493b 44%,#1d211d)',overflow:'hidden'}}>
  <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" width="100%" height="100%">
   <path d="M0 545 Q210 435 410 535T740 500T1000 535V1000H0Z" fill="#626c50"/><path d="M0 670 Q200 585 420 660T790 625T1000 660V1000H0Z" fill="#343a30"/>
   {[0,1,2,3,4].map(i=>{const x=interpolate(progress,[0,1],[120+i*26,420+i*20],clamp),y=650+(i%2)*26;return <g key={`west-${i}`} transform={`translate(${x},${y}) scale(.72)`} fill="#222a25" stroke="#c5c2ad" strokeOpacity=".28" strokeWidth="2"><circle cy="-40" r="11"/><path d="M-12 -26h24l12 54h-11L2 -5l-5 34h-12l4-38-19 23-7-6z"/><path d="M-20 -14l42 4" stroke="#c9c2aa" strokeWidth="6"/></g>})}
   {[0,1,2,3,4].map(i=>{const x=interpolate(progress,[0,1],[875-i*24,595-i*20],clamp),y=680+(i%2)*24;return <g key={`east-${i}`} transform={`translate(${x},${y}) scale(.72)`} fill="#303126" stroke="#c4bfae" strokeOpacity=".24" strokeWidth="2"><circle cy="-40" r="11"/><path d="M-12 -26h24l12 54h-11L2 -5l-5 34h-12l4-38-19 23-7-6z"/><path d="M-20 -14l42 4" stroke="#b9b29d" strokeWidth="6"/></g>})}
   <path d="M510 540V795" stroke={brand.primaryColor} strokeWidth="4" strokeDasharray="12 12" opacity=".7"/><circle cx="510" cy="630" r="17" fill="#f4c875" opacity={flash}/>
   <text x="500" y="880" textAnchor="middle" fill="#e7e1d3" fontSize="16" letterSpacing="3">NON-GRAPHIC ILLUSTRATION · VERIFY DETAILS AGAINST THE SOURCE</text>
  </svg>
  <div style={labelStyle}>{scene.onScreenText||scene.narration}</div><div style={footerStyle}><span>{brand.name.toUpperCase()}</span><span>ILLUSTRATIVE CONTACT · NO UNIT INSIGNIA SHOWN</span></div>
 </AbsoluteFill>;
};

const RouteMap:React.FC<GenericAnimationProps>=({brand,scene,progress})=><AbsoluteFill style={{background:'#e1d4b8',color:'#24251f',overflow:'hidden'}}>
 <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" width="100%" height="100%">
  <defs><pattern id={`map-grid-${scene.id}`} width="45" height="45" patternUnits="userSpaceOnUse"><path d="M45 0H0V45" fill="none" stroke="#645a47" strokeOpacity=".17"/></pattern></defs>
  <rect width="1000" height="1000" fill={`url(#map-grid-${scene.id})`}/><path d="M-50 700 C220 620 150 470 390 440 S650 520 1050 255" fill="none" stroke="#8aa9a1" strokeWidth="90" opacity=".62"/><path d="M-50 700 C220 620 150 470 390 440 S650 520 1050 255" fill="none" stroke="#f0ead8" strokeWidth="6" opacity=".8"/>
  <path d={`M170 790 C260 650 300 560 470 490 S660 380 805 220`} fill="none" stroke={brand.primaryColor} strokeWidth="11" strokeDasharray="18 14" strokeDashoffset={-progress*700}/>
  {[['START',170,790],['ROUTE',470,490],['END',805,220]].map(([name,x,y],i)=><g key={String(name)} transform={`translate(${x},${y})`}><circle r={20+i*3} fill={brand.primaryColor} opacity=".2"/><circle r="9" fill={brand.primaryColor}/><text x="18" y="5" fill="#35332d" fontSize="22" fontWeight="700">{name}</text></g>)}
 </svg>
 <div style={{...labelStyle,color:'#292820',textShadow:'none'}}>{scene.onScreenText||scene.narration}</div><div style={{...footerStyle,color:'#39372f',textShadow:'none'}}><span>{brand.name.toUpperCase()}</span><span>SCHEMATIC ROUTE · NOT TO SCALE · VERIFY LOCATIONS</span></div>
</AbsoluteFill>;

const FundsFlow:React.FC<GenericAnimationProps>=({brand,scene,progress,settings})=><AbsoluteFill style={{background:'linear-gradient(145deg,#171817,#25231e)',overflow:'hidden',color:'#f4f0e8'}}>
 <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" width="100%" height="100%">
  {[{x:130,label:settings?.labels?.[0]||'ORIGIN'},{x:500,label:settings?.labels?.[1]||'INTERMEDIARY'},{x:870,label:settings?.labels?.[2]||'DESTINATION'}].map((node,i)=><g key={node.label} transform={`translate(${node.x},525)`}><rect x="-122" y="-68" width="244" height="136" rx="12" fill="#292a26" stroke={brand.primaryColor} strokeWidth="3"/><text textAnchor="middle" y="8" fill="#f1eadc" fontSize="22" fontWeight="700" letterSpacing="2">{node.label}</text><circle cx="0" cy="-98" r="14" fill={brand.secondaryColor} opacity={interpolate(progress,[i*.18,i*.18+.2],[.35,1],clamp)}/></g>)}
  {[0,1].map(i=>{const start=130+i*370,end=start+370,x=interpolate(progress,[.15+i*.2,.9],[start,end],clamp);return <g key={i}><path d={`M${start+125} 525H${end-125}`} stroke="#aaa38f" strokeWidth="4" strokeDasharray="10 12"/><circle cx={x} cy="525" r="12" fill={brand.primaryColor}/><path d={`M${end-145} 510l20 15-20 15`} fill="none" stroke={brand.primaryColor} strokeWidth="5"/></g>})}
  <text x="500" y="760" textAnchor="middle" fill="#c8c0af" fontSize="20" letterSpacing="2">CONCEPTUAL FLOW · NOT A CASE CLAIM</text>
 </svg>
 <div style={labelStyle}>{scene.onScreenText||scene.narration}</div><div style={footerStyle}><span>KALOKHATA · RECORDS AND ACCOUNTABILITY</span><span>USE SOURCE-LINKED LABELS FOR REAL ENTITIES</span></div>
</AbsoluteFill>;

const RecordsTrail:React.FC<GenericAnimationProps>=({brand,scene,progress,settings})=><AbsoluteFill style={{background:'#191916',overflow:'hidden',color:'#f1eee7'}}>
 <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" width="100%" height="100%">
  <path d="M180 760 C330 700 230 590 420 520 S610 390 800 230" fill="none" stroke={brand.primaryColor} strokeWidth="5" strokeDasharray="12 14" strokeDashoffset={-progress*600}/>
  {['RECORD 01','RECORD 02','RECORD 03'].map((text,i)=>{const x=190+i*300,y=725-i*240,shown=interpolate(progress,[i*.2,i*.2+.22],[0,1],clamp);return <g key={text} opacity={shown} transform={`translate(${x},${y}) rotate(${-5+i*5})`}><rect width="205" height="142" rx="5" fill="#eee7d8"/><path d="M18 34h166M18 58h145M18 80h126" stroke="#817a6b" strokeWidth="5" opacity=".7"/><rect x="18" y="103" width="88" height="18" rx="3" fill={brand.primaryColor} opacity=".75"/><text x="18" y="22" fill="#39372f" fontSize="13" fontWeight="700" letterSpacing="2">{text}</text></g>})}
  <text x="500" y="875" textAnchor="middle" fill="#d2cbbb" fontSize="18" letterSpacing="3">STATUS · {(settings?.status||'unresolved').toUpperCase()} · VERIFY AGAINST THE CITED RECORD</text>
 </svg>
 <div style={labelStyle}>{scene.onScreenText||scene.narration}</div><div style={footerStyle}><span>KALOKHATA</span><span>DOCUMENT VISUALIZATION · CITATIONS REQUIRED</span></div>
</AbsoluteFill>;

const IncidentContext:React.FC<GenericAnimationProps>=({brand,scene,progress})=><AbsoluteFill style={{background:'radial-gradient(ellipse at 50% 52%,#3b3830,#171716 70%)',overflow:'hidden',color:'#f3eee5'}}>
 <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" width="100%" height="100%">
  <circle cx="500" cy="520" r={interpolate(progress,[0,1],[40,245],clamp)} fill="none" stroke={brand.primaryColor} strokeWidth="3" opacity=".65"/><circle cx="500" cy="520" r="14" fill={brand.primaryColor}/><path d="M500 520V680" stroke="#d4cec1" strokeWidth="3" strokeDasharray="8 9"/>
  <rect x="230" y="690" width="540" height="96" rx="6" fill="#211f1b" stroke="#625746"/><text x="500" y="748" textAnchor="middle" fill="#e2d8c7" fontSize="18" letterSpacing="2">INCIDENT CONTEXT · NON-GRAPHIC</text>
 </svg>
 <div style={labelStyle}>{scene.onScreenText||scene.narration}</div><div style={footerStyle}><span>KALOKHATA · HISTORICAL CONTEXT</span><span>RECONSTRUCTION · DETAILS REQUIRE A VERIFIED SOURCE</span></div>
</AbsoluteFill>;

const DeltaWeather:React.FC<GenericAnimationProps>=({brand,scene,progress,rendererKey,settings})=>{
 const frame=useCurrentFrame();
 const storm=rendererKey==='delta-storm',water=rendererKey==='delta-water';
 const intensity=settings?.intensity??.62,speed=settings?.speed??1;
 const rainCount=Math.round(22+intensity*72);
 return <AbsoluteFill style={{background:water?'linear-gradient(#273b41,#17282e 60%,#142329)':'linear-gradient(#26353a,#435052 42%,#182923 43%,#10231f)',overflow:'hidden',color:'#f3f7f4'}}>
  <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" width="100%" height="100%">
   <path d="M0 530 Q130 510 270 542T550 530T800 550T1000 520V1000H0Z" fill="#244b49" opacity=".78"/><path d="M0 612 Q145 585 290 618T560 605T830 622T1000 596" fill="none" stroke="#7bb6aa" strokeWidth="5" opacity=".55"/>
   {water&&<path d={`M0 ${790-progress*220} Q230 ${730-progress*220} 500 ${785-progress*220}T1000 ${755-progress*220}V1000H0Z`} fill="#4b9e96" opacity=".62"/>}
   {storm&&<><path d="M140 350 C320 250 440 430 610 340 S800 260 910 190" fill="none" stroke={brand.primaryColor} strokeWidth="8" strokeDasharray="14 11" strokeDashoffset={-progress*500}/><circle cx={140+progress*760} cy={350-progress*160+Math.sin(frame*.05)*15} r="22" fill={brand.primaryColor}/></>}
   {!water&&Array.from({length:rainCount},(_,i)=>{const x=(i*83+frame*(i%3+1)*4*speed)%1040,y=(i*137+frame*(i%4+2)*12*speed)%1000;return <path key={i} d={`M${x} ${y}l-9 24`} stroke="#c9ddd9" strokeWidth={i%4===0?3:2} opacity={.25+(i%5)*.08}/>})}
   {water&&Array.from({length:10},(_,i)=><path key={i} d={`M${i*120-20} ${820-progress*170+Math.sin(frame*.045+i)*7}q35 -12 70 0t70 0`} fill="none" stroke="#b9e2d8" strokeWidth="4" opacity=".44"/>)}
   <text x="70" y="900" fill="#d7e8e3" fontSize="16" letterSpacing="3">{settings?.sourceLabel||(storm?'TRACK ILLUSTRATION · ATTACH TRACK AND TIME SOURCE':water?'ILLUSTRATIVE WATER LEVEL · NO MEASURED VALUE SHOWN':'RAINFALL ILLUSTRATION · SOURCE DATA REQUIRED')}</text>
  </svg>
  <div style={labelStyle}>{scene.onScreenText||scene.narration}</div><div style={footerStyle}><span>DELTA SIGNAL · FIELD NOTES</span><span>{water?'RIVER LEVEL':storm?'STORM TRACK':'RAINFALL'} · SOURCE AND OBSERVATION TIME REQUIRED</span></div>
 </AbsoluteFill>;
};

export const GenericAnimationScene:React.FC<GenericAnimationProps>=props=>{
 switch(props.rendererKey){
  case 'bengal-soldiers':return <SoldierAdvance {...props}/>;
  case 'bengal-infantry-contact':return <InfantryContact {...props}/>;
  case 'bengal-route-map':return <RouteMap {...props}/>;
  case 'kalokhata-flow':return <FundsFlow {...props}/>;
  case 'kalokhata-records':return <RecordsTrail {...props}/>;
  case 'kalokhata-incident':return <IncidentContext {...props}/>;
  case 'delta-weather':case 'delta-storm':case 'delta-water':return <DeltaWeather {...props}/>;
  default:return <div/>;
 }
};
