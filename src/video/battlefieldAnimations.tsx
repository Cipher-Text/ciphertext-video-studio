import React from 'react';
import {AbsoluteFill,Img,interpolate,spring,staticFile,useCurrentFrame} from 'remotion';
import type {BrandProfile,SceneAnimationConfig,Scene} from '../domain';
import {CinematicAtmosphere,KineticTitle} from './motionSystem';

const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
const Bengali= '"Noto Sans Bengali", "Noto Sans Bengali UI", sans-serif';

export const TankTurretRotation:React.FC<{frame:number;progress:number;model:'pt76'|'m24';direction?:1|-1}>=({frame,progress,model,direction=1})=>{
  const sweep=model==='pt76'?interpolate(progress,[0,.55,1],[-9,3,10],clamp):interpolate(progress,[0,.5,1],[8,-5,-12],clamp);
  const recoil=progress>.34&&progress<.46&&frame%17<4?8:0;
  return <g transform={`rotate(${sweep*direction},0,-33)`}>
    <rect x={model==='pt76'?-14:-18} y="-59" width={model==='pt76'?122:100} height="15" rx="7" fill="#465044" stroke="#171d18" strokeWidth="4"/>
    <rect x={model==='pt76'?68:43} y="-58" width="48" height="11" rx="4" fill="#29322b" transform={`translate(${-recoil},0)`}/>
    {model==='m24'&&<rect x="-16" y="-68" width="34" height="10" rx="4" fill="#59604b"/>}
  </g>;
};

export const AnimatedTank:React.FC<{model:'pt76'|'m24';x:number;y:number;scale?:number;direction?:1|-1;progress:number;frame:number;label?:string;firing?:boolean}>=({model,x,y,scale=1,direction=1,progress,frame,label,firing=false})=>{
  const isPt=model==='pt76';
  const hull=isPt?'M-153 -7 Q-128 -31 -100 -38 L72 -37 Q125 -30 153 -4 L131 19 L-133 19Z':'M-144 -9 L-109 -46 L82 -46 L144 -5 L132 22 L-130 22Z';
  const turret=isPt?'M-49 -39 Q-38 -73 8 -73 Q40 -70 56 -39Z':'M-56 -47 Q-35 -85 30 -81 L60 -56 L53 -44Z';
  const wheelXs=isPt?[-112,-69,-26,17,60,103]:[-105,-62,-19,24,67,110];
  const bob=Math.sin((frame+(isPt?0:8))*.18)*1.4;
  return <g transform={`translate(${x},${y+bob}) scale(${direction*scale},${scale})`}>
    <ellipse cx="0" cy="37" rx="153" ry="18" fill="#10140f" opacity=".36"/>
    <rect x="-145" y="-4" width="290" height="54" rx="25" fill="#252d27" stroke="#141a16" strokeWidth="7"/>
    {wheelXs.map((wx,index)=><g key={wx}><circle cx={wx} cy="22" r="18" fill="#646958" stroke="#171d18" strokeWidth="6"/><circle cx={wx} cy="22" r="5" fill="#252d27"/><path d={`M${wx-10} 4 l20 36`} stroke="#8b8b70" strokeWidth="3" opacity=".5"/></g>)}
    <path d={hull} fill={isPt?'#68715a':'#59624f'} stroke="#20281f" strokeWidth="6"/>
    {isPt&&<path d="M-145 -6 Q-162 -4 -170 8 L-143 14Z" fill="#727a60" stroke="#20281f" strokeWidth="5"/>}
    {!isPt&&<><rect x="-120" y="-49" width="38" height="14" rx="4" fill="#68715a"/><rect x="72" y="-48" width="39" height="14" rx="4" fill="#68715a"/><path d="M-90 -44h17m91 0h17" stroke="#242c22" strokeWidth="6"/></>}
    <path d={turret} fill={isPt?'#778064':'#69745c'} stroke="#20281f" strokeWidth="5"/>
    <TankTurretRotation frame={frame} progress={progress} model={model} direction={direction}/>
    <MuzzleFlash frame={frame} x={125} y={-50} direction={1} active={firing}/>
    <g transform={`scale(${direction},1)`}><text x="0" y="-4" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="13" fill="#eee3c7">{label??(isPt?'PT-76':'M24 CHAFFEE')}</text></g>
  </g>;
};

export const TankMovement:React.FC<{model:'pt76'|'m24';fromX:number;toX:number;y:number;progress:number;frame:number;direction?:1|-1;scale?:number;firing?:boolean}>=props=>{
  const eased=interpolate(props.progress,[0,1],[0,1],{easing:(t)=>t*t*(3-2*t),...clamp});
  return <AnimatedTank {...props} x={interpolate(eased,[0,1],[props.fromX,props.toX],clamp)} y={props.y}/>;
};

export const BattlefieldSmoke:React.FC<{frame:number;x:number;y:number;size?:number;opacity?:number}>=({frame,x,y,size=1,opacity=.3})=><g opacity={opacity}>
  {[0,1,2,3].map(i=>{const phase=(frame*0.42+i*37)%100;const rise=phase*1.3;const drift=Math.sin((frame+i*13)*.04)*22;return <ellipse key={i} cx={x+drift+i*15} cy={y-rise-i*9} rx={(35+i*8+phase*.22)*size} ry={(22+i*5+phase*.14)*size} fill={i%2?'#d2c5aa':'#bcb6a5'} opacity={Math.max(.015,(1-phase/120)*.2)}/>})}
</g>;

export const MuzzleFlash:React.FC<{frame:number;x:number;y:number;active?:boolean;direction?:1|-1}>=({frame,x,y,active=true,direction=1})=>{
  const flash=active&&frame%64>=36&&frame%64<40;
  if(!flash)return null;
  return <g transform={`translate(${x},${y}) scale(${direction},1)`}><path d="M0 0 L-28 -17 L-15 -3 L-42 0 L-13 5 L-27 20Z" fill="#f5c776"/><circle r="19" fill="#fff0c2" opacity=".72"/></g>;
};

const Haze:React.FC<{frame:number}>=({frame})=><g opacity=".2">{[0,1,2,3,4].map(i=><ellipse key={i} cx={(i*270+frame*(i%2?1.1:-.7)+140)%1500-170} cy={430+i*119} rx={210+i*31} ry={46+i*9} fill="#ded8c8"/>)}</g>;

const BattlefieldStage:React.FC<{mode:SceneAnimationConfig['mode'];progress:number;frame:number;brand:BrandProfile;scene:Scene}>=({mode,progress,frame,brand,scene})=>{
  const intro=mode==='battlefield-intro';const retreat=mode==='tank-retreat';const outro=mode==='brand-outro';
  const reveal=spring({frame:Math.max(0,frame),fps:30,config:{damping:200,stiffness:28,mass:1.1}});
  const opacity=outro?interpolate(progress,[0,.72,1],[1,.2,0],clamp):1;
  const image=scene.assetPath||'illustrations/battlefield-reconstruction-dawn-v1.png';
  const cameraX=interpolate(progress,[0,1],retreat?[0,-42]:[-24,18],clamp);
  const cameraY=interpolate(progress,[0,1],[14,-24],clamp);
  const titleY=interpolate(reveal,[0,1],[20,0],clamp);
  return <AbsoluteFill style={{background:'#171a18',overflow:'hidden',opacity}}>
   <Img src={staticFile(image)} style={{position:'absolute',inset:'-7%',width:'114%',height:'114%',objectFit:'cover',objectPosition:'center 58%',transform:`translate(${cameraX}px,${cameraY}px) scale(${1.04+progress*.045})`,filter:'saturate(.76) contrast(1.08) brightness(.76)'}}/>
   <AbsoluteFill style={{background:'linear-gradient(180deg,#0b101055 0%,#15201b0a 36%,#11171455 72%,#0a0e0de8 100%)'}}/>
   <AbsoluteFill style={{background:'radial-gradient(ellipse at 65% 37%,transparent 28%,#09100e75 100%)'}}/>
   <div style={{position:'absolute',inset:0,background:'linear-gradient(115deg,#d8cba51b 0%,transparent 38%)',mixBlendMode:'screen'}}/>
   <svg viewBox="0 0 1080 1920" preserveAspectRatio="none" width="100%" height="100%" style={{position:'absolute',inset:0,pointerEvents:'none'}}>
    <defs><filter id={`${scene.id}-soften`}><feGaussianBlur stdDeviation="28"/></filter><radialGradient id={`${scene.id}-film-vignette`}><stop offset="45%" stopColor="#080b0a" stopOpacity="0"/><stop offset="100%" stopColor="#080b0a" stopOpacity=".58"/></radialGradient></defs>
    <g filter={`url(#${scene.id}-soften)`} opacity=".3" fill="#d9d6c8"><ellipse cx={120+(1-progress)*160} cy="845" rx="360" ry="85"/><ellipse cx={830-progress*90} cy="1030" rx="440" ry="110"/><ellipse cx={440+progress*65} cy="745" rx="330" ry="74"/></g>
    <rect width="1080" height="1920" fill={`url(#${scene.id}-film-vignette)`}/>
   </svg>
   <CinematicAtmosphere frame={frame} seed={scene.order} strength={.24}/>
   <div style={{position:'absolute',top:'8%',left:'7%',right:'7%',transform:`translateY(${titleY}px)`,opacity:reveal}}>
    <div style={{font:'600 13px/1.2 Arial,sans-serif',letterSpacing:4,color:'#dfb988',textTransform:'uppercase',textShadow:'0 2px 12px #000'}}>BENGAL UNFOLDED <span style={{opacity:.55}}> / </span> HISTORICAL ILLUSTRATION</div>
    {scene.onScreenText&&<div style={{marginTop:22,paddingLeft:18,borderLeft:`3px solid ${brand.primaryColor}`}}><KineticTitle frame={frame} fps={30} text={scene.onScreenText} color="#f5f0e6" fontFamily="Noto Serif Bengali, Noto Sans Bengali, Georgia, serif" maxWidth="900px"/></div>}
   </div>
   <div style={{position:'absolute',left:'7%',right:'7%',bottom:'8%',display:'flex',justifyContent:'space-between',alignItems:'end',gap:18,color:'#f3eee1',fontFamily:'Arial,sans-serif',textShadow:'0 2px 10px #000'}}><span style={{maxWidth:'72%',fontSize:'clamp(10px,1.2vw,15px)',letterSpacing:2,lineHeight:1.45}}>HISTORICAL ILLUSTRATION · NOT ARCHIVAL FOOTAGE</span><span style={{fontSize:12,letterSpacing:3,opacity:.75}}>{retreat?'WITHDRAWAL':intro?'ADVANCE':'RECONSTRUCTION'}</span></div>
   {outro&&<AbsoluteFill style={{alignItems:'center',justifyContent:'center',background:'radial-gradient(circle,#252822dd,#111916f5)',opacity:interpolate(progress,[.42,.68,1],[0,1,1],clamp)}}><div style={{width:120,height:120,border:`1px solid ${brand.primaryColor}`,transform:'rotate(45deg)',marginBottom:58,boxShadow:`0 0 70px ${brand.primaryColor}55`}}/><div style={{font:'600 clamp(32px,5vw,58px) Georgia,serif',letterSpacing:7,color:'#eee1c4',textAlign:'center'}}>{brand.name.toUpperCase()}</div><div style={{marginTop:20,color:'#c9b99a',fontFamily:Bengali,fontSize:23,letterSpacing:1}}>ইতিহাসের পাতা উন্মোচন</div></AbsoluteFill>}
  </AbsoluteFill>;
};

export const AnimatedBattleMap:React.FC<{progress:number;frame:number;brand:BrandProfile;scene:Scene}>=({progress,frame,brand,scene})=>{
  const map=scene.mapData;const lineProgress=interpolate(progress,[.08,.78],[0,1],clamp);const markerPulse=1+Math.sin(frame*.08)*.08;const ids={grid:`${scene.id}-map-grid`,paper:`${scene.id}-map-paper`,arrow:`${scene.id}-map-arrow`};
  return <AbsoluteFill style={{background:'#d9cfb8',overflow:'hidden',color:'#252923'}}><svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
    <defs><pattern id={ids.grid} width="54" height="54" patternUnits="userSpaceOnUse"><path d="M54 0H0V54" fill="none" stroke="#786f5c" strokeOpacity=".14" strokeWidth="1"/></pattern><linearGradient id={ids.paper} x2="0" y2="1"><stop stopColor="#e7dcc2"/><stop offset="1" stopColor="#c9ba98"/></linearGradient><filter id={`${scene.id}-map-shadow`} x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#28251e" floodOpacity=".2"/></filter><marker id={ids.arrow} markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" refX="11" refY="7" orient="auto"><path d="M2 2L12 7L2 12Z" fill={brand.primaryColor}/></marker></defs>
    <rect width="1000" height="1000" fill={`url(#${ids.paper})`}/><rect width="1000" height="1000" fill={`url(#${ids.grid})`}/>
    {[0,1,2,3,4,5].map(i=><path key={i} d={`M-60 ${175+i*132} Q205 ${120+i*130} 455 ${180+i*112} T1060 ${160+i*138}`} fill="none" stroke="#8c9d83" strokeWidth="2" opacity=".22"/>)}
    {map?.routes.map((route,index)=>{const d=route.points.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join(' ');return <g key={`${route.name}-${index}`} filter={`url(#${scene.id}-map-shadow)`}><path d={d} fill="none" stroke={brand.primaryColor} strokeWidth="5" strokeDasharray="11 9" strokeDashoffset={-lineProgress*320} markerEnd={`url(#${ids.arrow})`} opacity={route.status==='illustrative'?.74:1}/><path d={d} fill="none" stroke="#fff9e8" strokeWidth="1.2" strokeDasharray="2 18" strokeDashoffset={-lineProgress*320}/></g>})}
    {map?.locations.map((location,index)=><g key={`${location.name}-${index}`} transform={`translate(${location.x},${location.y})`}><circle r={14*markerPulse} fill={brand.primaryColor} opacity=".18"/><circle r="7" fill={brand.primaryColor} stroke="#f6ead0" strokeWidth="3"/><text x="17" y="-12" fill="#252923" fontFamily={Bengali} fontWeight="700" fontSize="20">{location.name}</text></g>)}
    {!map&&<g><text x="500" y="510" textAnchor="middle" fill="#625b4e" fontSize="17" letterSpacing="3">ADD CITED MAP DATA TO SHOW PLACES AND ROUTES</text></g>}
    <g transform="translate(870 142)"><path d="M0 62V0M0 0L-11 21M0 0L11 21" fill="none" stroke="#514a3a" strokeWidth="3"/><text y="83" textAnchor="middle" fill="#514a3a" fontSize="12" letterSpacing="2">N</text></g>
  </svg>
  <div style={{position:'absolute',top:'7%',left:'7%',right:'7%',padding:'18px 22px',background:'#f0e8d6ed',borderTop:`4px solid ${brand.primaryColor}`,boxShadow:'0 8px 32px #17140e30'}}><div style={{fontFamily:Bengali,fontSize:'clamp(22px,3.3vw,38px)',fontWeight:700,lineHeight:1.2}}>{scene.onScreenText||scene.narration}</div><div style={{fontFamily:'Arial,sans-serif',fontSize:10,letterSpacing:2,marginTop:8,color:'#665d4c'}}>CAMPAIGN MOVEMENT {map?.date?`· ${map.date}`:''}</div></div>
  <div style={{position:'absolute',bottom:'6%',left:'7%',right:'7%',padding:'11px 14px',background:'#f0e8d6ee',color:'#514a3a',fontFamily:'Arial,sans-serif',fontSize:10,letterSpacing:1.3,lineHeight:1.55}}>{map?<>SOURCE · {map.source} <span style={{float:'right'}}>{map.scale==='schematic-not-to-scale'?'SCHEMATIC · NOT TO SCALE':'GEOGRAPHIC'}</span></>:<>MAP SOURCE REQUIRED <span style={{float:'right'}}>NO ROUTES OR LOCATIONS ASSERTED</span></>}</div>
  </AbsoluteFill>;
};

export const TroopMovementArrows:React.FC<{progress:number}>=({progress})=>{
  const dash=interpolate(progress,[0,.5,1],[1100,420,0],clamp);
  return <g fill="none" stroke="#9c493d" strokeWidth="7" strokeDasharray="16 14" strokeDashoffset={dash} opacity=".9"><path d="M185 1310 Q330 1180 500 1215"/><path d="M260 1380 Q420 1310 520 1226"/><path d="M690 800 Q790 638 855 494"/><path d="M510 1190 Q610 1000 700 805"/></g>;
};

const Location:React.FC<{x:number;y:number;label:string;english:string;color:string;pulse:number}>=({x,y,label,english,color,pulse})=><g transform={`translate(${x},${y})`}><circle r={18*pulse} fill={color} opacity=".18"/><circle r="10" fill={color} stroke="#f0e2c4" strokeWidth="4"/><text x="20" y="-16" fill="#27302b" fontFamily={Bengali} fontWeight="700" fontSize="28">{label}</text><text x="20" y="12" fill="#554f40" fontFamily="Arial,sans-serif" letterSpacing="2" fontWeight="700" fontSize="13">{english}</text></g>;

export const AnimatedBattleScene:React.FC<{brand:BrandProfile;scene:Scene;progress:number;mode?:SceneAnimationConfig['mode']}>=({brand,scene,progress,mode})=>{
  const frame=useCurrentFrame();
  const config=scene.animationConfig;
  const resolvedMode=mode??config?.mode??'tank-battle';
  return resolvedMode==='battle-map'?<AnimatedBattleMap progress={progress} frame={frame} brand={brand} scene={scene}/>:<BattlefieldStage mode={resolvedMode} progress={progress} frame={frame} brand={brand} scene={scene}/>;
};

