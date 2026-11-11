import React from 'react';
import {AbsoluteFill,Img,interpolate,staticFile,useCurrentFrame} from 'remotion';
import type {BrandProfile,Scene,SceneAnimationSettings} from '../domain';
import {projectGeoJson} from './geoJsonGeometry';
import {AnimatedBattleMap} from './battlefieldAnimations';
import {CinematicAtmosphere,KineticTitle} from './motionSystem';

type GenericAnimationProps={brand:BrandProfile;scene:Scene;progress:number;rendererKey:string;settings?:SceneAnimationSettings};
const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
const labelStyle:React.CSSProperties={position:'absolute',left:'7%',right:'7%',top:'8%',color:'#f5f1e9',fontFamily:'Arial,sans-serif',fontWeight:700,fontSize:'clamp(20px,4.4vw,48px)',lineHeight:1.15,textShadow:'0 2px 14px #0009'};
const footerStyle:React.CSSProperties={position:'absolute',left:'7%',right:'7%',bottom:'6%',color:'#e2ded4',fontFamily:'Arial,sans-serif',fontSize:'clamp(10px,1.4vw,16px)',letterSpacing:2,textShadow:'0 1px 10px #000',display:'flex',justifyContent:'space-between',gap:20};

const SoldierAdvance:React.FC<GenericAnimationProps>=({brand,scene,progress})=>{
 return <AbsoluteFill style={{background:'#151916',overflow:'hidden',color:'#f4f0e8'}}>
  <Img src={staticFile(scene.assetPath||'illustrations/battlefield-reconstruction-dawn-v1.png')} style={{position:'absolute',inset:'-4%',width:'108%',height:'108%',objectFit:'cover',objectPosition:'center 55%',transform:`scale(${1.035+progress*.025}) translateX(${interpolate(progress,[0,1],[12,-14],clamp)}px)`,filter:'saturate(.68) contrast(1.12) brightness(.58)'}}/>
  <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,#0c120fdd,#0c120f55 68%,#0c120f8a),linear-gradient(0deg,#0b100fe8,transparent 48%)'}}/>
  <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" width="100%" height="100%" style={{position:'absolute',inset:0}}>
   {scene.mapData?.routes.map((route,index)=>{const d=route.points.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join(' ');return <g key={`${route.name}-${index}`}><path d={d} fill="none" stroke="#f3e7d0" strokeOpacity=".3" strokeWidth="13"/><path d={d} fill="none" stroke={brand.primaryColor} strokeWidth="4" strokeDasharray="10 12" strokeDashoffset={-progress*280}/><circle cx={route.points[0][0]} cy={route.points[0][1]} r="8" fill={brand.primaryColor}/><circle cx={route.points[route.points.length-1][0]} cy={route.points[route.points.length-1][1]} r="8" fill={brand.primaryColor}/></g>})}
   {scene.mapData?.locations.map((location,index)=><g key={`${location.name}-${index}`} transform={`translate(${location.x},${location.y})`}><circle r="8" fill={brand.primaryColor}/><text x="15" y="-10" fill="#f8f1e5" fontSize="16" fontWeight="700">{location.name}</text></g>)}
  </svg>
  <div style={{position:'absolute',left:'8%',right:'8%',top:'10%',maxWidth:900}}><div style={{color:brand.primaryColor,fontSize:11,letterSpacing:4,fontWeight:700}}>FIELD MOVEMENT · {scene.mapData?.date||'SOURCE REQUIRED'}</div><div style={{marginTop:18,fontFamily:'Noto Serif Bengali, Georgia, serif',fontSize:'clamp(26px,4.2vw,50px)',lineHeight:1.18,fontWeight:700,textShadow:'0 2px 20px #000'}}>{scene.onScreenText||scene.narration}</div></div>
  <div style={{...footerStyle,bottom:'7%',fontSize:11,letterSpacing:1.5}}><span>{brand.name.toUpperCase()} · HISTORICAL ILLUSTRATION</span><span>{scene.mapData?scene.mapData.source:'ROUTE AND UNIT MOVEMENT REQUIRE A CITED SOURCE'}</span></div>
 </AbsoluteFill>;
};

const InfantryContact:React.FC<GenericAnimationProps>=({brand,scene,progress})=>{
 return <AbsoluteFill style={{background:'#111513',overflow:'hidden',color:'#f4f0e8'}}>
  <Img src={staticFile(scene.assetPath||'illustrations/battlefield-reconstruction-dawn-v1.png')} style={{position:'absolute',inset:'-3%',width:'106%',height:'106%',objectFit:'cover',objectPosition:'center 55%',transform:`scale(${1.04+progress*.02})`,filter:'saturate(.62) contrast(1.12) brightness(.48)'}}/>
  <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,#101614ed 0%,#10161488 55%,#10161455),linear-gradient(0deg,#090e0de8,transparent 52%)'}}/>
  <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" width="100%" height="100%" style={{position:'absolute',inset:0}}>
   {scene.mapData?.routes.map((route,index)=>{const d=route.points.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join(' ');return <path key={`${route.name}-${index}`} d={d} fill="none" stroke={brand.primaryColor} strokeWidth="4" strokeDasharray="8 12" strokeDashoffset={-progress*220}/>})}
  </svg>
  <div style={{position:'absolute',left:'8%',right:'8%',top:'12%'}}><div style={{color:brand.primaryColor,fontSize:11,letterSpacing:4,fontWeight:700}}>NON-GRAPHIC HISTORICAL ILLUSTRATION</div><div style={{marginTop:20,fontFamily:'Noto Serif Bengali, Georgia, serif',fontSize:'clamp(26px,4.2vw,50px)',lineHeight:1.18,fontWeight:700,textShadow:'0 2px 20px #000'}}>{scene.onScreenText||scene.narration}</div></div>
  <div style={{...footerStyle,bottom:'8%',fontSize:11}}><span>NO FIGURES OR WEAPONS DEPICTED</span><span>{scene.mapData?`SOURCE · ${scene.mapData.source}`:'POSITION DETAILS REQUIRE A CITED SOURCE'}</span></div>
 </AbsoluteFill>;
};

const RouteMap:React.FC<GenericAnimationProps>=({brand,scene,progress})=>{
 const frame=useCurrentFrame();
 return <AnimatedBattleMap progress={progress} frame={frame} brand={brand} scene={scene}/>;
};

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

const CampaignMap:React.FC<GenericAnimationProps>=({brand,scene,progress})=>{
 const geo=scene.geoJson?projectGeoJson(scene.geoJson):null;
 const title=scene.onScreenText||scene.narration;
 const source=scene.geoJson?.source||scene.animationConfig?.settings?.sourceLabel||'Geographic source required';
 return <AbsoluteFill style={{background:'#d6c7a5',color:'#222820',overflow:'hidden',fontFamily:'Arial,sans-serif'}}>
  <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
   <defs><pattern id={`campaign-grid-${scene.id}`} width="42" height="42" patternUnits="userSpaceOnUse"><path d="M42 0H0V42" fill="none" stroke="#70694f" strokeOpacity=".12" strokeWidth="1"/></pattern><linearGradient id={`campaign-paper-${scene.id}`} x2="0" y2="1"><stop stopColor="#e7dcc2"/><stop offset="1" stopColor="#c4b58f"/></linearGradient><filter id={`campaign-shadow-${scene.id}`} x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#302c20" floodOpacity=".23"/></filter></defs>
   <rect width="1000" height="1000" fill={`url(#campaign-paper-${scene.id})`}/><rect width="1000" height="1000" fill={`url(#campaign-grid-${scene.id})`}/>
   {[0,1,2,3,4].map(i=><path key={i} d={`M${-100+i*170} 650 Q${160+i*135} ${450+(i%2)*95} ${360+i*155} 520 T${1110+i*85} ${360+i*55}`} fill="none" stroke="#7f987f" strokeWidth={2+i%2} opacity=".21"/>)}
   {geo?.paths.map((path,index)=><path key={`geo-path-${index}`} d={path} fill={path.endsWith('Z')?`${brand.primaryColor}18`:'none'} stroke={path.endsWith('Z')?'#6d705b':'#8d5e48'} strokeWidth={path.endsWith('Z')?2:5} strokeDasharray={path.endsWith('Z')?'none':'12 10'} strokeDashoffset={path.endsWith('Z')?0:-progress*440} strokeLinejoin="round" filter={`url(#campaign-shadow-${scene.id})`}/>)}
   {geo?.points.map((point,index)=>{const feature=scene.geoJson?.features[index];const name=feature?.properties?.name;return <g key={`geo-marker-${index}`} transform={`translate(${point.x},${point.y})`}><circle r="17" fill={brand.primaryColor} opacity=".2"/><circle r="7" fill={brand.primaryColor} stroke="#f4ead5" strokeWidth="3"/><text x="15" y="-12" fill="#252a23" fontSize="19" fontWeight="700">{typeof name==='string'?name:`LOCATION ${index+1}`}</text></g>})}
   {!geo&&<g opacity=".7"><path d="M130 750 C270 620 360 705 490 535 S720 490 870 300" fill="none" stroke="#75664c" strokeWidth="4" strokeDasharray="8 12"/><text x="500" y="540" textAnchor="middle" fill="#6a604c" fontSize="18" letterSpacing="3">ATTACH SOURCED GEOGRAPHY TO SHOW ROUTES</text></g>}
   <g transform="translate(835 130)"><path d="M0 80V0M0 0L-12 24M0 0L12 24" stroke="#463f31" strokeWidth="4"/><text y="104" textAnchor="middle" fill="#463f31" fontSize="13" letterSpacing="2">N</text></g>
  </svg>
  <div style={{position:'absolute',left:'7%',right:'7%',top:'7%',padding:'18px 22px',background:'#eee6d4ed',borderTop:`3px solid ${brand.primaryColor}`,boxShadow:'0 9px 28px #16130c26'}}><div style={{fontFamily:'Noto Serif Bengali, Georgia, serif',fontSize:'clamp(20px,3vw,34px)',fontWeight:700,lineHeight:1.2}}>{title}</div><div style={{marginTop:8,fontSize:10,letterSpacing:2,color:'#5c5547'}}>CAMPAIGN MAP · SOURCE-BASED ROUTES ONLY</div></div>
  <div style={{position:'absolute',bottom:'6%',left:'7%',right:'7%',padding:'11px 14px',background:'#f0e8d5eb',fontSize:10,letterSpacing:1.4,color:'#4e493d',lineHeight:1.5}}>SOURCE · {source} <span style={{float:'right'}}>SCHEMATIC · NOT TO SCALE</span></div>
 </AbsoluteFill>;
};

const EditorialMotion:React.FC<GenericAnimationProps>=({brand,scene,progress,rendererKey})=>{
 const frame=useCurrentFrame();const reveal=interpolate(progress,[.06,.42],[0,1],clamp);const headline=scene.onScreenText||scene.narration;
 const fact=rendererKey.startsWith('factlens'),care=rendererKey.startsWith('opencare'),tech=rendererKey.startsWith('ciphertext'),legal=rendererKey.startsWith('kalokhata');
 const eyebrow=fact?'NEWSROOM · CONTEXT':care?'OPEN CARE · HEALTH EXPLAINER':tech?'CIPHERTEXT LABS · PRODUCT STORY':legal?'KALOKHATA · EVIDENCE STATUS':'EDITORIAL MOTION';
 const accent=fact?'#e85e4f':care?'#e9928a':tech?'#9e9aff':legal?'#c1a16a':brand.primaryColor;
 const words=headline.split(/\s+/).filter(Boolean).slice(0,10);
 return <AbsoluteFill style={{background:fact?'#111517':care?'#f4eeea':legal?'#171715':'#101018',overflow:'hidden',color:fact||legal?'#f3f1ec':care?'#2a2425':'#f0efff',fontFamily:'Arial,sans-serif'}}>
  <div style={{position:'absolute',inset:'7%',border:care?'1px solid #c9b6b1':'1px solid #ffffff20',borderRadius:care?18:4,background:fact?'linear-gradient(135deg,#1b2529,#101517 55%,#20211f)':care?'radial-gradient(ellipse at 75% 12%,#fff,#f0e4df 75%)':legal?'linear-gradient(145deg,#28251f,#171715 65%)':'radial-gradient(ellipse at 80% 16%,#7771ff33,transparent 42%),linear-gradient(145deg,#202034,#101018 60%)',boxShadow:'0 25px 80px #0004'}}/>
  <div style={{position:'absolute',left:'12%',right:'12%',top:'13%',height:3,background:accent,transform:`scaleX(${reveal})`,transformOrigin:'left'}}/>
  <div style={{position:'absolute',left:'12%',right:'12%',top:'17%',fontSize:11,letterSpacing:3,color:accent,fontWeight:700}}>{eyebrow}</div>
  {!care&&<CinematicAtmosphere frame={frame} seed={scene.order} strength={.12}/>}<div style={{position:'absolute',left:'12%',right:'12%',top:'25%',maxHeight:'48%',overflow:'hidden',fontFamily:care?'Noto Sans Bengali, Arial, sans-serif':'Georgia,serif'}}><KineticTitle frame={frame} fps={30} text={headline} color={care?'#2a2425':fact||legal?'#f3f1ec':'#f0efff'} fontFamily={care?'Kohinoor Bangla, Bangla Sangam MN, Arial Unicode MS, sans-serif':'Georgia,serif'} maxWidth="100%"/></div>
  <div style={{position:'absolute',left:'12%',right:'12%',top:'64%',display:'flex',gap:8,alignItems:'center'}}>{words.slice(0,6).map((word,index)=><span key={`${word}-${index}`} style={{width:`${Math.max(9,Math.min(38,word.length*5))}%`,height:4,background:index===0?accent:'#ffffff32',transform:`scaleX(${interpolate(progress,[.2+index*.05,.5+index*.05],[0,1],clamp)})`,transformOrigin:'left'}}/>)}</div>
  <svg viewBox="0 0 1000 300" preserveAspectRatio="none" width="100%" height="30%" style={{position:'absolute',bottom:'10%',opacity:.8}}>
   {fact&&<><path d="M95 220H900" stroke="#ffffff30" strokeWidth="2"/><circle cx={130+progress*680} cy="210" r="8" fill={accent}/><path d={`M130 210H${130+progress*680}`} stroke={accent} strokeWidth="4"/><text x="95" y="265" fill="#d5d5d0" fontSize="18" letterSpacing="3">CLAIM · SOURCE · CONTEXT</text></>}
   {care&&<><path d="M170 160H830" stroke="#b69e99" strokeWidth="3"/><circle cx="170" cy="160" r="22" fill={accent} opacity={.22+Math.sin(frame*.05)*.04}/>{[0,1,2].map(i=><g key={i} opacity={interpolate(progress,[i*.18,.35+i*.18],[.35,1],clamp)}><circle cx={170+i*330} cy="160" r="10" fill={accent}/><text x={170+i*330} y="215" textAnchor="middle" fill="#544c4a" fontSize="15" letterSpacing="2">{scene.animationConfig?.settings?.labels?.[i]||`STEP ${i+1}`}</text></g>)}</>}
   {tech&&<><path d="M190 210V150H400V105H600V160H810V225" fill="none" stroke="#bcb8f7" strokeWidth="3" strokeDasharray="8 10" strokeDashoffset={-progress*180}/>{[190,400,600,810].map((x,i)=><g key={x}><rect x={x-34} y={i===1?70:i===2?125:175} width="68" height="56" rx="9" fill="#29283e" stroke={accent}/><circle cx={x} cy={(i===1?70:i===2?125:175)+28} r="5" fill={accent}/></g>)}<text x="500" y="275" textAnchor="middle" fill="#c7c6df" fontSize="16" letterSpacing="3">CONCEPTUAL SYSTEM DIAGRAM</text></>}
   {legal&&rendererKey==='kalokhata-network'&&<><path d="M190 170H500L810 170M500 170V240" fill="none" stroke="#c1a16a" strokeOpacity=".65" strokeWidth="2" strokeDasharray="7 9" strokeDashoffset={-progress*160}/>{[190,500,810].map((x,i)=><g key={x}><rect x={x-88} y="126" width="176" height="88" rx="4" fill="#28251f" stroke="#c1a16a"/><text x={x} y="177" textAnchor="middle" fill="#e5dccb" fontSize="15" letterSpacing="1">{scene.animationConfig?.settings?.labels?.[i]||`ENTITY ${i+1}`}</text></g>)}<text x="500" y="276" textAnchor="middle" fill="#c8bda7" fontSize="13" letterSpacing="2">DOCUMENTED LINKS ONLY · SOURCE REQUIRED</text></>}
   {legal&&rendererKey!=='kalokhata-network'&&<><rect x="105" y="110" width="365" height="135" rx="4" fill="#24231f" stroke="#756349"/><rect x="530" y="110" width="365" height="135" rx="4" fill="#24231f" stroke="#756349"/><text x="130" y="145" fill={accent} fontSize="14" letterSpacing="2">{scene.animationConfig?.settings?.labels?.[0]||'ALLEGATION'}</text><text x="555" y="145" fill={accent} fontSize="14" letterSpacing="2">{scene.animationConfig?.settings?.labels?.[1]||scene.animationConfig?.settings?.status?.toUpperCase()||'OFFICIAL STATUS'}</text><text x="130" y="190" fill="#e6dfd0" fontSize="14">{scene.sourceReferences?.[0]?'SOURCE ATTACHED':'CITATION REQUIRED'}</text><text x="555" y="190" fill="#e6dfd0" fontSize="14">{scene.sourceReferences?.[1]?'SOURCE ATTACHED':'CITATION REQUIRED'}</text></>}
  </svg>
  <div style={{position:'absolute',left:'12%',right:'12%',bottom:'7%',display:'flex',justifyContent:'space-between',gap:12,fontSize:10,letterSpacing:2,color:care?'#726765':'#b4b1bd'}}><span>{scene.sourceReferences?.length?'SOURCE ATTACHED':'ILLUSTRATIVE · SOURCE REVIEW REQUIRED'}</span><span>{brand.name.toUpperCase()}</span></div>
 </AbsoluteFill>;
};

const DeltaComparison:React.FC<GenericAnimationProps>=({brand,scene,progress})=>{
 const data=scene.comparisonData;const labels=data?.series??[];
 if(!data)return <AbsoluteFill style={{background:'#101a19',color:'#e4ede8',justifyContent:'center',padding:'9%',fontFamily:'Arial,sans-serif'}}><div style={{color:brand.primaryColor,fontSize:12,letterSpacing:3}}>DELTA SIGNAL · COMPARISON</div><h1 style={{fontFamily:'Georgia,serif',fontSize:'clamp(30px,5vw,62px)',lineHeight:1.1}}>{scene.onScreenText||scene.narration}</h1><p style={{maxWidth:760,color:'#bbc9c2',lineHeight:1.6}}>Attach two source-backed series with matching labels, units, reporting period, and uncertainty notes. No values are shown until data is supplied.</p></AbsoluteFill>;
 const values=labels.flatMap(series=>series.values.map(item=>item.value));const low=Math.min(...values),high=Math.max(...values),span=high-low||1;const color=['#73c7a4','#f0bd79'];
 const points=labels.map((series,seriesIndex)=>series.values.map((item,index)=>({x:100+index*(800/Math.max(1,series.values.length-1)),y:760-((item.value-low)/span)*530,low:item.lower,high:item.upper})));const animate=interpolate(progress,[.1,.82],[0,1],clamp);
 return <AbsoluteFill style={{background:'linear-gradient(145deg,#13201f,#101716)',color:'#e7eee9',overflow:'hidden',fontFamily:'Arial,sans-serif'}}><div style={{position:'absolute',left:'8%',right:'8%',top:'7%'}}><div style={{color:brand.primaryColor,fontSize:11,letterSpacing:3}}>DELTA SIGNAL · DATA COMPARISON</div><div style={{marginTop:12,fontFamily:'Georgia,serif',fontSize:'clamp(26px,4vw,48px)',lineHeight:1.15}}>{scene.onScreenText||scene.narration}</div></div>
  <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet" width="100%" height="100%" style={{position:'absolute',inset:0}}><path d="M100 230V770H910" fill="none" stroke="#d4e0da66" strokeWidth="2"/><text x="100" y="205" fill="#cbd8d1" fontSize="17">{data.unit}</text>{[0,1,2,3,4].map(i=><path key={i} d={`M100 ${280+i*110}H910`} stroke="#ecf3ee20" strokeWidth="1"/>)}{points.map((series,index)=>{const path=series.slice(0,Math.max(2,Math.ceil(series.length*animate))).map((point,i)=>`${i?'L':'M'}${point.x} ${point.y}`).join(' ');return <g key={index}><path d={path} fill="none" stroke={color[index]} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>{series.slice(0,Math.max(2,Math.ceil(series.length*animate))).map((point,i)=><g key={i}><circle cx={point.x} cy={point.y} r="7" fill={color[index]}/>{i%Math.max(1,Math.ceil(series.length/6))===0&&<text x={point.x} y="805" textAnchor="middle" fill="#cbd8d1" fontSize="13">{labels[index].values[i].label}</text>}</g>)}</g>})}</svg>
  <div style={{position:'absolute',left:'8%',right:'8%',bottom:'6%',display:'flex',justifyContent:'space-between',gap:16,flexWrap:'wrap',fontSize:11,color:'#c3d2cb'}}><div style={{display:'flex',gap:18}}>{labels.map((series,index)=><span key={series.name} style={{color:color[index]}}>● {series.name}</span>)}</div><span>{data.period} · {data.source}{data.uncertaintyNote?` · ${data.uncertaintyNote}`:''}</span></div>
 </AbsoluteFill>;
};

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
  case 'campaign-map':return <CampaignMap {...props}/>;
  case 'delta-comparison':return <DeltaComparison {...props}/>;
  case 'factlens-headline':case 'factlens-compare':case 'opencare-process':case 'opencare-awareness':case 'ciphertext-product':case 'ciphertext-architecture':case 'kalokhata-comparison':case 'kalokhata-network':return <EditorialMotion {...props}/>;
  default:return <div/>;
 }
};
