import React,{useEffect,useMemo,useRef,useState} from 'react';
import {AbsoluteFill,interpolate,useCurrentFrame,useDelayRender,useVideoConfig} from 'remotion';
import {Map,setWorkerUrl,type GeoJSONSource,type Map as MapLibreMap,type StyleSpecification} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type {FeatureCollection} from 'geojson';
import type {SceneVisualProps} from './sceneRegistry';
import {geographicBounds,revealGeoJsonRoutes} from './mapGeometry';
import {StaticGeoMapScene} from './StaticGeoMapScene';

const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
const asCollection=(value:NonNullable<SceneVisualProps['scene']['geoJson']>)=>value as unknown as FeatureCollection;

function localStyle(data:FeatureCollection,accent:string,paper:string):StyleSpecification{
  return {version:8,name:'CipherText local GeoJSON',sources:{'scene-data':{type:'geojson',data}},layers:[
    {id:'paper',type:'background',paint:{'background-color':paper}},
    {id:'polygons',type:'fill',source:'scene-data',filter:['==',['geometry-type'],'Polygon'],paint:{'fill-color':accent,'fill-opacity':.16}},
    {id:'polygon-edges',type:'line',source:'scene-data',filter:['==',['geometry-type'],'Polygon'],paint:{'line-color':accent,'line-width':2,'line-opacity':.85}},
    {id:'route-lines',type:'line',source:'scene-data',filter:['in',['geometry-type'],['literal',['LineString']]],layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':accent,'line-width':3.5,'line-opacity':.95}},
    {id:'locations',type:'circle',source:'scene-data',filter:['==',['geometry-type'],'Point'],paint:{'circle-radius':7,'circle-color':accent,'circle-stroke-width':2,'circle-stroke-color':'#f7f2e8'}},
  ]};
}

type MapLabel={name:string;x:number;y:number};
export const MapLibreHistoricalMap:React.FC<SceneVisualProps>=props=>{
  const {brand,scene}=props,containerRef=useRef<HTMLDivElement>(null),mapRef=useRef<MapLibreMap|null>(null),loadDone=useRef(false),frameHandles=useRef(new Set<number>());
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const {delayRender,continueRender}=useDelayRender();
  const [loadHandle]=useState(()=>delayRender(`Loading local MapLibre scene ${scene.id}`));
  const [ready,setReady]=useState(false),[failed,setFailed]=useState(false),[labels,setLabels]=useState<MapLabel[]>([]);
  const collection=scene.geoJson!;
  const originalData=useMemo(()=>asCollection(collection),[collection]);
  const bounds=useMemo(()=>geographicBounds(collection),[collection]);
  const progress=interpolate(frame,[0,Math.max(1,Math.round(scene.estimatedDurationSeconds*fps)-1)],[0,1],{...clamp,easing:(value:number)=>value*value*(3-2*value)});
  const routeProgress=interpolate(progress,[0,.68,1],[0,1,1],clamp);
  const frameData=useMemo(()=>asCollection(revealGeoJsonRoutes(collection,routeProgress)),[collection,routeProgress]);

  useEffect(()=>{
    if(!containerRef.current)return;
    try{
      setWorkerUrl(new URL('maplibre-gl/dist/maplibre-gl-worker.mjs',import.meta.url).toString());
      const instance=new Map({container:containerRef.current,style:localStyle(asCollection(revealGeoJsonRoutes(collection,0)),brand.primaryColor,'#d9d1bd'),interactive:false,attributionControl:false,fadeDuration:0,renderWorldCopies:false,pitchWithRotate:false,canvasContextAttributes:{preserveDrawingBuffer:true,antialias:false}});
      mapRef.current=instance;
      const releaseLoad=()=>{if(loadDone.current)return;loadDone.current=true;continueRender(loadHandle)};
      const fail=()=>{setFailed(true);releaseLoad();for(const handle of frameHandles.current){continueRender(handle)}frameHandles.current.clear()};
      instance.on('error',event=>{if(!ready){fail()}});
      instance.once('load',()=>{
        const camera=instance.cameraForBounds(bounds,{padding:{top:115,right:90,bottom:145,left:90},maxZoom:8});
        if(camera)instance.jumpTo(camera);
        instance.once('idle',()=>{
          if(failed)return;
          const pointLabels=collection.features.flatMap(feature=>{
            if(feature.geometry.type!=='Point'||typeof feature.properties?.name!=='string')return [];
            const point=instance.project(feature.geometry.coordinates as [number,number]);
            return [{name:feature.properties.name,x:point.x,y:point.y}];
          });
          setLabels(pointLabels);setReady(true);releaseLoad();
        });
        instance.triggerRepaint();
      });
    }catch{
      setFailed(true);if(!loadDone.current){loadDone.current=true;continueRender(loadHandle)}
    }
  // MapLibre's canvas and style are deliberately initialized once; frame updates below only change GeoJSON source data.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[scene.id]);

  useEffect(()=>{
    const instance=mapRef.current;if(!instance||!ready||failed)return;
    const source=instance.getSource('scene-data') as GeoJSONSource|undefined;if(!source)return;
    const handle=delayRender(`Updating GeoJSON route for frame ${frame}`);frameHandles.current.add(handle);
    const release=()=>{if(!frameHandles.current.has(handle))return;frameHandles.current.delete(handle);continueRender(handle)};
    source.setData(frameData);instance.once('idle',release);instance.triggerRepaint();
  },[continueRender,delayRender,failed,frame,frameData,ready]);

  if(failed)return <StaticGeoMapScene {...props}/>;
  return <AbsoluteFill style={{background:'#d9d1bd',overflow:'hidden',color:'#f4f0e8',fontFamily:'Arial,sans-serif'}}>
    <div ref={containerRef} style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/>
    {labels.map((label,index)=><div key={`${label.name}-${index}`} style={{position:'absolute',left:label.x+10,top:label.y-12,color:'#16211d',fontSize:16,fontWeight:700,textShadow:'-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff,1px 1px 0 #fff',pointerEvents:'none'}}>{label.name}</div>)}
    <div style={{position:'absolute',left:'6%',right:'6%',top:'5%',padding:'16px 20px',background:'#101817e8',borderTop:`3px solid ${brand.primaryColor}`,boxShadow:'0 7px 24px #0005'}}>
      <div style={{fontFamily:'Georgia,serif',fontSize:'clamp(22px,3.4vw,40px)',fontWeight:700,lineHeight:1.15}}>{scene.onScreenText||scene.narration}</div>
      <div style={{marginTop:7,fontSize:11,letterSpacing:2,color:brand.secondaryColor}}>MAPLIBRE · LOCAL GEOJSON · {scene.mapData?.date||'SOURCE-DATED GEOGRAPHY'}</div>
    </div>
    {!ready&&<div style={{position:'absolute',inset:'45% 10% auto',textAlign:'center',color:'#26332d',fontSize:16}}>Preparing offline GeoJSON map…</div>}
    <div style={{position:'absolute',bottom:'5%',left:'6%',right:'6%',padding:'10px 13px',background:'#101817e8',fontSize:11,letterSpacing:1.1,color:'#e2ded4',lineHeight:1.45}}>
      <span>SOURCE · {collection.source}</span><span style={{float:'right'}}>GEOGRAPHIC · ROUTES REVEAL BY FRAME</span>
    </div>
    <div style={{position:'absolute',left:'6%',bottom:'1.7%',fontSize:10,letterSpacing:1.6,color:'#d3c9b5'}}>{brand.name.toUpperCase()} · LOCAL MAP DATA · NO HOSTED TILES</div>
  </AbsoluteFill>;
};
