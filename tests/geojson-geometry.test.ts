import {describe,expect,it} from 'vitest';
import {projectGeoJson} from '../src/video/geoJsonGeometry';
import type {Scene} from '../src/domain';

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
