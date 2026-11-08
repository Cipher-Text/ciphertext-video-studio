import type {Scene} from '../domain';
type GeoJson=NonNullable<Scene['geoJson']>;
type Position=[number,number,...number[]];
export type ProjectedGeoJson={paths:string[];points:{x:number;y:number}[]};
const flatten=(value:unknown):Position[]=>{
  if(!Array.isArray(value))return [];
  if(value.length>=2&&typeof value[0]==='number'&&typeof value[1]==='number')return [value as Position];
  return value.flatMap(flatten);
};
export function projectGeoJson(collection:GeoJson,width=1000,height=620,padding=32):ProjectedGeoJson{
  const features=collection.features;
  const positions=features.flatMap(feature=>flatten(feature.geometry.coordinates));
  if(!positions.length)return{paths:[],points:[]};
  const longs=positions.map(p=>p[0]),lats=positions.map(p=>p[1]);
  const minLon=Math.min(...longs),maxLon=Math.max(...longs),minLat=Math.min(...lats),maxLat=Math.max(...lats);
  const lonSpan=maxLon-minLon||1e-6,latSpan=maxLat-minLat||1e-6;
  const scale=Math.min((width-padding*2)/lonSpan,(height-padding*2)/latSpan);
  const offsetX=(width-lonSpan*scale)/2,offsetY=(height-latSpan*scale)/2;
  const map=(p:Position)=>({x:offsetX+(p[0]-minLon)*scale,y:height-offsetY-(p[1]-minLat)*scale});
  const line=(coordinates:unknown,close=false)=>{const pts=flatten(coordinates).map(map);return pts.length?`M${pts.map(p=>`${p.x.toFixed(2)},${p.y.toFixed(2)}`).join('L')}${close?'Z':''}`:''};
  const paths:string[]=[],points:{x:number;y:number}[]=[];
  const addCoordinates=(type:string,coordinates:unknown)=>{
    if(type==='Point'){const pos=flatten(coordinates)[0];if(pos)points.push(map(pos));return}
    if(type==='MultiPoint'){for(const pos of flatten(coordinates))points.push(map(pos));return}
    if(type==='LineString'){paths.push(line(coordinates));return}
    if(type==='MultiLineString'){for(const part of (coordinates as unknown[]))paths.push(line(part));return}
    if(type==='Polygon'){for(const ring of (coordinates as unknown[]))paths.push(line(ring,true));return}
    if(type==='MultiPolygon'){for(const polygon of (coordinates as unknown[][]))for(const ring of polygon)paths.push(line(ring,true))}
  };
  for(const feature of features)addCoordinates(feature.geometry.type,feature.geometry.coordinates);
  return{paths:paths.filter(Boolean),points};
}
