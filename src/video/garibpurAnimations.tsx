import React from 'react';
import {AbsoluteFill,interpolate,spring,useCurrentFrame,useVideoConfig} from 'remotion';
import type {BrandProfile,SceneAnimationConfig,Scene} from '../domain';

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
  const intro=mode==='battlefield-intro';const battle=mode==='tank-battle';const retreat=mode==='tank-retreat';const advance=mode==='troop-advance';const outro=mode==='brand-outro';
  const opacity=outro?interpolate(progress,[0,.72,1],[1,.15,0],clamp):1;
  const ptFrom=retreat?610:intro?-420:advance?-310:battle?100:-240;const ptTo=retreat?1380:intro?520:advance?505:battle?500:470;
  const m24From=retreat?830:intro?1140:1090;const m24To=retreat?1490:intro?720:battle?670:610;
  const reveal=spring({frame:Math.max(0,frame),fps:30,config:{damping:180,stiffness:38,mass:.9}});
  const ids={sky:`${scene.id}-sky`,land:`${scene.id}-land`,vignette:`${scene.id}-vignette`,rice:`${scene.id}-rice`};
  const layer=(id:'background'|'midground'|'foreground',fallback:number):NonNullable<SceneAnimationConfig['layers']>[number]=>scene.animationConfig?.layers?.find(item=>item.id===id)??{id,depth:fallback};
  const backgroundLayer=layer('background',.12),midgroundLayer=layer('midground',.42),foregroundLayer=layer('foreground',.72);
  return <AbsoluteFill style={{background:'#24251f',overflow:'hidden'}}><svg viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style={{opacity}}>
    <defs><linearGradient id={ids.sky} x2="0" y2="1"><stop stopColor="#3b4039"/><stop offset=".46" stopColor="#a49a7f"/><stop offset="1" stopColor="#d3c09a"/></linearGradient><linearGradient id={ids.land} x2="0" y2="1"><stop stopColor="#777b61"/><stop offset="1" stopColor="#35382c"/></linearGradient><radialGradient id={ids.vignette}><stop offset=".45" stopColor="#090d0b" stopOpacity="0"/><stop offset="1" stopColor="#090d0b" stopOpacity=".62"/></radialGradient><pattern id={ids.rice} width="95" height="70" patternUnits="userSpaceOnUse" patternTransform="skewX(-22)"><path d="M0 0v70" stroke="#d4c39b" strokeOpacity=".18" strokeWidth="3"/></pattern></defs>
    <g transform={`translate(${progress*backgroundLayer.depth*34+(backgroundLayer.offsetX??0)},${progress*backgroundLayer.depth*20+(backgroundLayer.offsetY??0)}) scale(${backgroundLayer.scale??1})`} opacity={backgroundLayer.opacity??1}><rect width="1080" height="1920" fill={`url(#${ids.sky})`}/><path d="M0 760 Q220 665 410 754 T810 718 T1080 750 V1920 H0Z" fill="#81856d"/></g><path d="M0 1020 Q320 910 580 1008 T1080 956 V1920 H0Z" fill={`url(#${ids.land})`}/><g transform={`translate(${progress*foregroundLayer.depth*52+(foregroundLayer.offsetX??0)},${progress*foregroundLayer.depth*8+(foregroundLayer.offsetY??0)}) scale(${foregroundLayer.scale??1})`} opacity={foregroundLayer.opacity??1}><path d="M0 1020 Q320 910 580 1008 T1080 956 V1920 H0Z" fill={`url(#${ids.rice})`}/></g>
    <g opacity=".35" fill="#393b31">{[0,1,2,3,4,5,6].map(i=><path key={i} d={`M${i*180-40} 784 l44 -122 37 122z`}/>)}</g>
    <g transform={`translate(${interpolate(progress,[0,1],[20,-20],clamp)+progress*midgroundLayer.depth*62+(midgroundLayer.offsetX??0)},${progress*midgroundLayer.depth*18+(midgroundLayer.offsetY??0)}) scale(${midgroundLayer.scale??1})`} opacity={midgroundLayer.opacity??1}><Haze frame={frame}/>
      <BattlefieldSmoke frame={frame} x={260} y={910} size={1.35} opacity={battle ? .39 : .23}/><BattlefieldSmoke frame={frame} x={870} y={805} size={1.15} opacity={battle ? .32 : .16}/>
      <g transform={`translate(${(1-reveal)*-190},${(1-reveal)*26})`}><TankMovement model="pt76" fromX={ptFrom} toX={ptTo} y={1230} scale={1.12} direction={1} progress={progress} frame={frame} firing={battle}/></g>
      {(battle||retreat||intro)&&<g transform={`translate(${(1-reveal)*230},${(1-reveal)*10})`}><TankMovement model="m24" fromX={m24From} toX={m24To} y={1410} scale={intro ? .58 : .82} direction={-1} progress={progress} frame={frame+11} firing={battle}/></g>}
      {advance&&<g opacity={.86} transform={`translate(${progress*160},0)`}>{[0,1,2,3,4,5].map(i=><g key={i} transform={`translate(${140+i*48},${1110+(i%2)*26})`} fill="#29332c"><circle cy="-32" r="13"/><path d="M-12 -17h24l12 60h-10l-14-36-4 38h-11l2-42-15 25-9-6z"/></g>)}</g>}
    </g>
    <rect width="1080" height="1920" fill={`url(#${ids.vignette})`}/><rect width="1080" height="1920" fill="#282216" opacity=".12"/>
  </svg>
  <div style={{position:'absolute',top:'9%',left:'7%',color:'#f0e2c4',fontFamily:'Georgia,serif',fontSize:21,letterSpacing:5,textShadow:'0 2px 12px #111',opacity:outro?opacity:1}}>BENGAL <span style={{color:brand.primaryColor}}>UNFOLDED</span></div>
  {scene.onScreenText&&<div style={{position:'absolute',top:'16%',left:'7%',maxWidth:'84%',padding:'14px 20px',background:'#171b18bd',borderLeft:`5px solid ${brand.primaryColor}`,fontFamily:Bengali,color:'#f1e5cb',fontSize:27,fontWeight:700,opacity:outro?opacity:1}}>{scene.onScreenText}</div>}
  <div style={{position:'absolute',bottom:'14%',left:'7%',right:'7%',padding:'14px 18px',background:'#141916cb',borderLeft:`5px solid ${brand.primaryColor}`,color:'#e3dccd',fontFamily:'Arial,sans-serif',fontSize:14,letterSpacing:2,opacity:outro?opacity:1}}>HISTORICAL ILLUSTRATION · NOT ARCHIVAL FOOTAGE</div>
  {outro&&<AbsoluteFill style={{alignItems:'center',justifyContent:'center',background:'radial-gradient(circle,#45453c,#111916)',opacity:interpolate(progress,[.42,.68,1],[0,1,1],clamp)}}><div style={{width:148,height:148,border:`3px solid ${brand.primaryColor}`,transform:'rotate(45deg)',marginBottom:72,boxShadow:`0 0 38px ${brand.primaryColor}33`}}/><div style={{font:'700 58px Georgia,serif',letterSpacing:6,color:'#eee1c4',textAlign:'center'}}>{brand.name.toUpperCase()}</div><div style={{marginTop:28,color:'#c9b99a',fontFamily:Bengali,fontSize:25}}>ইতিহাসের পাতা উন্মোচন</div></AbsoluteFill>}
  </AbsoluteFill>;
};

export const AnimatedBattleMap:React.FC<{progress:number;frame:number;brand:BrandProfile;scene:Scene}>=({progress,frame,brand,scene})=>{
  const lineProgress=interpolate(progress,[.08,.78],[0,1],clamp);
  const markerPulse=1+Math.sin(frame*.12)*.16;
  const ids={grid:`${scene.id}-map-grid`,paper:`${scene.id}-map-paper`,arrow:`${scene.id}-map-arrow`};
  return <AbsoluteFill style={{background:'#d4c49f',overflow:'hidden'}}><svg viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
    <defs><pattern id={ids.grid} width="86" height="86" patternUnits="userSpaceOnUse"><path d="M86 0H0V86" fill="none" stroke="#897759" strokeOpacity=".23" strokeWidth="2"/></pattern><linearGradient id={ids.paper} x2="0" y2="1"><stop stopColor="#e1d2ae"/><stop offset="1" stopColor="#c8b58d"/></linearGradient><marker id={ids.arrow} markerUnits="userSpaceOnUse" markerWidth="18" markerHeight="18" refX="15" refY="9" orient="auto"><path d="M2 2L16 9L2 16Z" fill="#a4463b"/></marker></defs>
    <rect width="1080" height="1920" fill={`url(#${ids.paper})`}/><rect width="1080" height="1920" fill={`url(#${ids.grid})`}/>
    <path d="M90 1540 C250 1450 210 1310 390 1180 S510 980 610 880" fill="none" stroke="#728c8c" strokeWidth="66" opacity=".56"/><path d="M90 1540 C250 1450 210 1310 390 1180 S510 980 610 880" fill="none" stroke="#b9d0c7" strokeWidth="5" opacity=".8"/>
    <path d="M332 1180 C400 1030 515 946 640 835 S790 634 866 465" fill="none" stroke="#75654c" strokeWidth="10" strokeDasharray="18 19" opacity=".8"/>
    <path d={`M520 1210 L${520+(336*lineProgress)} ${950-(375*lineProgress)}`} fill="none" stroke="#a4463b" strokeWidth="12" strokeDasharray="20 14" markerEnd={`url(#${ids.arrow})`}/>
    <TroopMovementArrows progress={progress}/>
    <Location x={520} y={1210} label="গরিবপুর" english="GARIBPUR" color="#a4463b" pulse={markerPulse}/>
    <Location x={658} y={828} label="চৌগাছা" english="CHAUGACHA" color="#434e43" pulse={markerPulse}/>
    <Location x={858} y={460} label="যশোর" english="JESSORE" color="#434e43" pulse={markerPulse}/>
    <Location x={296} y={1500} label="বায়রা" english="BAYRA" color="#617268" pulse={markerPulse}/>
    <path d="M95 170 L95 280 L76 248 M95 170 L114 248" fill="none" stroke="#554a39" strokeWidth="5"/><text x="95" y="150" textAnchor="middle" fill="#554a39" fontSize="28" fontFamily="Arial">N</text>
  </svg>
  <div style={{position:'absolute',top:'8%',left:'7%',right:'7%',padding:'20px 23px',background:'#eee4ceeb',borderTop:`5px solid ${brand.primaryColor}`,fontFamily:Bengali,color:'#252a24'}}><div style={{fontSize:28,fontWeight:700}}>{scene.onScreenText||'গরিবপুর · যশোর সেক্টর'}</div><div style={{fontFamily:'Arial,sans-serif',fontSize:12,letterSpacing:3,marginTop:8,color:'#595443'}}>AREA OF OPERATIONS · NOVEMBER 1971</div></div>
  <div style={{position:'absolute',bottom:'9%',left:'7%',right:'7%',padding:'12px 14px',background:'#eee4ceeb',color:'#534b3c',fontFamily:'Arial,sans-serif',fontSize:12,letterSpacing:1.5}}>SCHEMATIC · RELATIVE LOCATIONS FROM MP-IDSA MAP · NOT TO SCALE · ROUTE IS ILLUSTRATIVE</div>
  </AbsoluteFill>;
};

export const TroopMovementArrows:React.FC<{progress:number}>=({progress})=>{
  const dash=interpolate(progress,[0,.5,1],[1100,420,0],clamp);
  return <g fill="none" stroke="#9c493d" strokeWidth="7" strokeDasharray="16 14" strokeDashoffset={dash} opacity=".9"><path d="M185 1310 Q330 1180 500 1215"/><path d="M260 1380 Q420 1310 520 1226"/><path d="M690 800 Q790 638 855 494"/><path d="M510 1190 Q610 1000 700 805"/></g>;
};

const Location:React.FC<{x:number;y:number;label:string;english:string;color:string;pulse:number}>=({x,y,label,english,color,pulse})=><g transform={`translate(${x},${y})`}><circle r={18*pulse} fill={color} opacity=".18"/><circle r="10" fill={color} stroke="#f0e2c4" strokeWidth="4"/><text x="20" y="-16" fill="#27302b" fontFamily={Bengali} fontWeight="700" fontSize="28">{label}</text><text x="20" y="12" fill="#554f40" fontFamily="Arial,sans-serif" letterSpacing="2" fontWeight="700" fontSize="13">{english}</text></g>;

export const AnimatedBattleScene:React.FC<{brand:BrandProfile;scene:Scene;progress:number}>=({brand,scene,progress})=>{
  const frame=useCurrentFrame();
  const config=scene.animationConfig;
  return config?.mode==='battle-map'?<AnimatedBattleMap progress={progress} frame={frame} brand={brand} scene={scene}/>:<BattlefieldStage mode={config?.mode??'tank-battle'} progress={progress} frame={frame} brand={brand} scene={scene}/>;
};

