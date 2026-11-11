import React,{Suspense,useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useVideoConfig} from 'remotion';
import {BufferAttribute,BufferGeometry,MathUtils} from 'three';
import type {SceneVisualProps} from './sceneRegistry';

const Terrain:React.FC=()=>{
  const geometry=useMemo(()=>{
    const positions:number[]=[];const indices:number[]=[];const columns=18;const rows=12;
    for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){
      const px=(x/columns-.5)*15,pz=(y/rows-.5)*10;
      const hill=Math.sin(px*.72)*.14+Math.cos(pz*.9)*.11+Math.sin((px+pz)*.38)*.08;
      positions.push(px,hill,pz);
    }
    for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){
      const a=y*(columns+1)+x,b=a+1,c=a+columns+1,d=c+1;indices.push(a,c,b,b,c,d);
    }
    const result=new BufferGeometry();result.setAttribute('position',new BufferAttribute(new Float32Array(positions),3));result.setIndex(indices);result.computeVertexNormals();return result;
  },[]);
  return <mesh geometry={geometry} position={[0,-.22,0]}><meshStandardMaterial color="#4c5948" roughness={1} flatShading/></mesh>;
};

const ArmoredVehicle:React.FC<{progress:number;accent:string}> = ({progress,accent})=>{
  const x=-4.1+progress*8.2;
  const heading=Math.sin(progress*Math.PI*3)*.08;const turretRotation=-.2+MathUtils.smoothstep(progress,.38,.72)*.55;
  return <group position={[x,.18,0]} rotation={[0,heading,0]}>
    <mesh position={[0,.12,0]}><boxGeometry args={[2.05,.54,1.12]}/><meshStandardMaterial color="#667553" roughness={.94}/></mesh>
    <mesh position={[-.12,.48,0]}><boxGeometry args={[1.18,.3,.82]}/><meshStandardMaterial color="#818b67" roughness={.94}/></mesh>
    <group position={[-.06,.5,0]} rotation={[0,turretRotation,0]}>
      <mesh><cylinderGeometry args={[.29,.34,.22,8]}/><meshStandardMaterial color="#718060" roughness={1}/></mesh>
      <mesh position={[.48,.03,0]} rotation={[0,0,-Math.PI/2]}><cylinderGeometry args={[.075,.09,.86,8]}/><meshStandardMaterial color="#59674d" roughness={1}/></mesh>
    </group>
    {[-.42,.42].map((z)=><mesh key={z} position={[0,-.08,z]}><boxGeometry args={[2.15,.22,.18]}/><meshStandardMaterial color="#252b28" roughness={1}/></mesh>)}
    <pointLight position={[.6,.4,0]} color={accent} intensity={.16} distance={3}/>
  </group>;
};

const ThreeContents:React.FC<{progress:number;subject:NonNullable<SceneVisualProps['scene']['threeConfig']>['subject'];accent:string}> = ({progress,subject,accent})=>{
  return <>
    <color attach="background" args={['#111512']}/><fog attach="fog" args={['#111512',9,24]}/>
    <ambientLight intensity={1.2}/><directionalLight position={[-4,8,6]} intensity={2.6}/><directionalLight position={[5,4,-5]} intensity={.75} color={accent}/>
    <Terrain/>
    {subject==='armored-vehicle'&&<><ArmoredVehicle progress={progress} accent={accent}/><group position={[-2.9,.12,-1.45]} scale={.67}><ArmoredVehicle progress={MathUtils.clamp(progress*1.2-.12,0,1)} accent={accent}/></group></>}
    {subject==='globe'&&<mesh position={[0,1,0]} rotation={[.2,progress*.32,0]}><icosahedronGeometry args={[1.65,2]}/><meshStandardMaterial color="#496a61" roughness={1} flatShading wireframe/></mesh>}
    {subject==='terrain'&&<group>{[-2,0,2].map((x,index)=><mesh key={x} position={[x,.5,-.7+index*.7]} rotation={[0,0,index%2?.2:-.16]}><coneGeometry args={[.8,1.6,5]}/><meshStandardMaterial color={index===1?accent:'#6c7258'} roughness={1} flatShading/></mesh>)}</group>}
  </>;
};

export const ThreeIllustrationScene:React.FC<SceneVisualProps>=({brand,scene,progress,title})=>{
  const {width,height}=useVideoConfig();const accent=scene.threeConfig?.accentColor??brand.primaryColor;const subject=scene.threeConfig?.subject??'armored-vehicle';
  return <div style={{position:'absolute',inset:0,overflow:'hidden',background:'#111512'}}>
    <ThreeCanvas width={width} height={height} dpr={[1,1]} camera={{position:[-.25+progress*.5,5.6,11.5],fov:37,rotation:[-.39,0,0]}} gl={{antialias:false,alpha:false,powerPreference:'low-power'}} style={{position:'absolute',inset:0}}>
      <Suspense fallback={null}><ThreeContents progress={progress} subject={subject} accent={accent}/></Suspense>
    </ThreeCanvas>
    <div style={{position:'absolute',inset:0,pointerEvents:'none',background:'linear-gradient(90deg,rgba(8,11,9,.68),transparent 75%),linear-gradient(0deg,rgba(8,10,8,.42),transparent 42%)'}}/>
    <div style={{position:'absolute',left:'8%',top:'12%',maxWidth:'75%',fontFamily:'Georgia,serif',fontSize:'clamp(34px,6vw,72px)',lineHeight:1.04,color:'#f0ecdf',textShadow:'0 3px 22px #000'}}>{scene.onScreenText||title}</div>
    <div style={{position:'absolute',right:'8%',top:'5%',fontFamily:'Arial,sans-serif',fontSize:13,letterSpacing:2,color:brand.secondaryColor,textAlign:'right',background:'rgba(12,15,13,.55)',padding:'8px 10px'}}>HISTORICAL ILLUSTRATION · PROCEDURAL 3D</div>
  </div>;
};
