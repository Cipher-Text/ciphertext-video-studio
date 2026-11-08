export type ChartDatum={label:string;value:number};
export type PlotBounds={left:number;right:number;top:number;bottom:number};
export type ChartCoordinate={x:number;y:number;value:number};

/** Converts reviewed source values into stable plot coordinates; Remotion owns reveal timing. */
export function chartCoordinates(points:ChartDatum[],plot:PlotBounds):ChartCoordinate[]{
  const maxValue=Math.max(1,...points.map(point=>point.value));
  const width=plot.right-plot.left,height=plot.bottom-plot.top,step=points.length?width/points.length:width;
  return points.map((point,index)=>({x:plot.left+step*(index+.5),y:plot.bottom-(point.value/maxValue)*height,value:point.value}));
}
