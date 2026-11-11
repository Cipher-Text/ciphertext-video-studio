import {scaleBand,scaleLinear} from 'd3-scale';

export type ChartDatum={label:string;value:number};
export type PlotBounds={left:number;right:number;top:number;bottom:number};
export type ChartCoordinate={x:number;y:number;value:number};

/** Converts reviewed source values into stable plot coordinates; Remotion owns reveal timing. */
export function chartCoordinates(points:ChartDatum[],plot:PlotBounds):ChartCoordinate[]{
  const maxValue=Math.max(1,...points.map(point=>point.value));
  const x=scaleBand<number>().domain(points.map((_,index)=>index)).range([plot.left,plot.right]);
  const y=scaleLinear().domain([0,maxValue]).range([plot.bottom,plot.top]);
  return points.map((point,index)=>({x:x(index)!+x.bandwidth()/2,y:y(point.value),value:point.value}));
}

/** D3-derived nice ticks; only geometry comes from D3, while Remotion owns frame reveals. */
export function chartYAxisTicks(maxValue:number,count=5):number[]{
  return scaleLinear().domain([0,Math.max(1,maxValue)]).ticks(count);
}
