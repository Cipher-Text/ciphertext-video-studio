import {describe,expect,it} from 'vitest';
import {chartCoordinates,chartYAxisTicks} from '../src/video/chartGeometry';

describe('chart geometry is deterministic and separate from animation',()=>{
  it('maps reviewed values to stable source coordinates',()=>{
    const data=[{label:'2019',value:10},{label:'2020',value:20},{label:'2021',value:15}];
    const plot={left:80,right:920,top:100,bottom:500};
    expect(chartCoordinates(data,plot)).toEqual([{x:220,y:300,value:10},{x:500,y:100,value:20},{x:780,y:200,value:15}]);
    expect(chartCoordinates(data,plot)).toEqual(chartCoordinates(data,plot));
  });
  it('computes stable D3 tick values independently of frame reveal state',()=>{
    expect(chartYAxisTicks(20,4)).toEqual([0,5,10,15,20]);
    expect(chartYAxisTicks(20,4)).toEqual(chartYAxisTicks(20,4));
  });
});
