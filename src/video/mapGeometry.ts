import bbox from '@turf/bbox';
import {lineString} from '@turf/helpers';
import length from '@turf/length';
import lineSliceAlong from '@turf/line-slice-along';
import type {Feature,FeatureCollection,LineString,Position} from 'geojson';
import type {Scene} from '../domain';

type SceneGeoJson=NonNullable<Scene['geoJson']>;
type Route=Feature<LineString,Record<string,unknown>>;

/** Uses Turf's geodesic bbox operation; coordinates remain longitude/latitude. */
export function geographicBounds(collection:SceneGeoJson):[number,number,number,number]{
  const [west,south,east,north]=bbox(collection as unknown as FeatureCollection);
  const padLng=Math.max((east-west)*.08,.015),padLat=Math.max((north-south)*.08,.015);
  return [Math.max(-180,west-padLng),Math.max(-85,south-padLat),Math.min(180,east+padLng),Math.min(85,north+padLat)];
}

/** Reveals line and multiline routes by frame progress while leaving other GeoJSON geometry intact. */
export function revealGeoJsonRoutes(collection:SceneGeoJson,progress:number):SceneGeoJson{
  const amount=Math.max(0,Math.min(1,progress));
  const features:SceneGeoJson['features']=[];
  for(const feature of collection.features){
    const properties=feature.properties??{};
    const geometry=feature.geometry;
    const routes:Position[][]=geometry.type==='LineString'?[geometry.coordinates]:geometry.type==='MultiLineString'?geometry.coordinates:[];
    if(!routes.length){features.push(feature);continue;}
    for(const [index,coordinates] of routes.entries()){
      const route=lineString(coordinates as Position[],properties) as Route;
      const total=length(route,{units:'kilometers'});
      let visible:Route;
      if(amount>=1||total===0)visible=route;
      else if(amount<=0)visible=lineString([coordinates[0] as Position,coordinates[0] as Position],properties) as Route;
      else visible=lineSliceAlong(route,0,total*amount,{units:'kilometers'}) as Route;
      features.push({type:'Feature',id:geometry.type==='MultiLineString'?`${String(feature.id??'route')}-${index}`:feature.id,properties,geometry:visible.geometry} as SceneGeoJson['features'][number]);
    }
  }
  return {type:'FeatureCollection',source:collection.source,features};
}
