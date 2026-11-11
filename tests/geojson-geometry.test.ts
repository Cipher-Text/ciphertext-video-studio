import {describe,expect,it} from 'vitest';
import {projectGeoJson} from '../src/video/geoJsonGeometry';
import type {Scene} from '../src/domain';
import {geographicBounds,revealGeoJsonRoutes} from '../src/video/mapGeometry';

describe('sourced GeoJSON scene projection',()=>{
  it('projects geographic lines and points into deterministic SVG geometry',()=>{
    const map={type:'FeatureCollection' as const,source:'Example geographic dataset',features:[
      {type:'Feature' as const,geometry:{type:'LineString' as const,coordinates:[[90,22],[91,23]]}},
      {type:'Feature' as const,geometry:{type:'Point' as const,coordinates:[90.5,22.5]}},
    ]} as NonNullable<Scene['geoJson']>;
    const projected=projectGeoJson(map,1000,620);
    expect(projected.paths).toHaveLength(1);
    expect(projected.paths[0]).toMatch(/^M222\.00,588\.00L778\.00,32\.00$/);
    expect(projected.points).toHaveLength(1);
    expect(projected.points[0]).toEqual({x:500,y:310});
    expect(projectGeoJson(map)).toEqual(projectGeoJson(map));
  });
});

describe('Turf map preparation for local MapLibre scenes',()=>{
  const collection={type:'FeatureCollection' as const,source:'Reviewed local map data',features:[
    {type:'Feature' as const,geometry:{type:'LineString' as const,coordinates:[[90,22],[91,22],[92,22]]}},
    {type:'Feature' as const,geometry:{type:'Point' as const,coordinates:[91,23]},properties:{name:'Sample location'}},
  ]} as NonNullable<Scene['geoJson']>;
  it('calculates a bounded geographic camera extent deterministically',()=>{
    const bounds=geographicBounds(collection);
    expect(bounds[0]).toBeLessThan(90);
    expect(bounds[2]).toBeGreaterThan(92);
    expect(geographicBounds(collection)).toEqual(bounds);
  });
  it('reveals geographic line work by frame progress without mutating the source collection',()=>{
    const original=JSON.stringify(collection);
    const start=revealGeoJsonRoutes(collection,0);
    const middle=revealGeoJsonRoutes(collection,.5);
    const end=revealGeoJsonRoutes(collection,1);
    const route=(value:NonNullable<Scene['geoJson']>)=>value.features.find(feature=>feature.geometry.type==='LineString')!;
    const routeEndLongitude=(value:NonNullable<Scene['geoJson']>)=>{const geometry=route(value).geometry;return geometry.type==='LineString'?geometry.coordinates.at(-1)?.[0]:undefined};
    const startGeometry=route(start).geometry;
    expect(startGeometry.type==='LineString'?startGeometry.coordinates:[]).toHaveLength(2);
    expect(routeEndLongitude(middle)).toBeCloseTo(91,0);
    expect(routeEndLongitude(end)).toBe(92);
    expect(JSON.stringify(collection)).toBe(original);
    expect(middle.features.find(feature=>feature.geometry.type==='Point')?.properties?.name).toBe('Sample location');
  });
});
