import React from 'react';
import type {Scene} from '../domain';

type ChartData=NonNullable<Scene['chartData']>;
const blankData=():ChartData=>({chartType:'bar',unit:'',period:'',source:'',points:[{label:'',value:0},{label:'',value:0}]});

export const ChartDataEditor:React.FC<{value?:ChartData;onChange:(value:ChartData|undefined)=>void;sceneNumber:number}>=({value,onChange,sceneNumber})=>{
  const data=value??blankData();
  const update=(patch:Partial<ChartData>)=>onChange({...data,...patch});
  return <section className="chart-data-editor" aria-label={`Scene ${sceneNumber} chart data`}>
    <div className="chart-editor-heading"><div><span className="eyebrow">CHART DATA</span><p>Enter reviewed values and a source. Preview and exports use these exact values.</p></div>{value&&<button className="text-button" type="button" onClick={()=>onChange(undefined)}>Clear data</button>}</div>
    <div className="row chart-meta"><label>Chart style<select value={data.chartType} onChange={e=>update({chartType:e.target.value as ChartData['chartType']})}><option value="bar">Bar</option><option value="line">Line</option></select></label><label>Unit<input aria-label={`Scene ${sceneNumber} chart unit`} maxLength={24} value={data.unit} placeholder="e.g. tonnes" onChange={e=>update({unit:e.target.value})}/></label><label>Period or date range<input aria-label={`Scene ${sceneNumber} chart period`} maxLength={80} value={data.period} placeholder="e.g. 2019–2024" onChange={e=>update({period:e.target.value})}/></label></div>
    <div className="chart-points">{data.points.map((point,index)=><div className="row chart-point" key={index}><label>Label {index+1}<input aria-label={`Scene ${sceneNumber} data label ${index+1}`} maxLength={48} value={point.label} placeholder={`e.g. ${2019+index}`} onChange={e=>update({points:data.points.map((item,i)=>i===index?{...item,label:e.target.value}:item)})}/></label><label>Value<input aria-label={`Scene ${sceneNumber} data value ${index+1}`} type="number" min="0" max="1000000000000000" step="any" value={point.value} onChange={e=>update({points:data.points.map((item,i)=>i===index?{...item,value:Number(e.target.value)}:item)})}/></label>{data.points.length>2&&<button type="button" className="text-button" aria-label={`Remove data point ${index+1}`} onClick={()=>update({points:data.points.filter((_,i)=>i!==index)})}>Remove</button>}</div>)}{data.points.length<12&&<button type="button" className="button ghost" onClick={()=>update({points:[...data.points,{label:'',value:0}]})}>＋ Add data point</button>}</div>
    <label className="chart-source">Source or citation<input aria-label={`Scene ${sceneNumber} chart source`} maxLength={500} value={data.source} placeholder="Publisher, dataset, URL, or document reference" onChange={e=>update({source:e.target.value})}/></label>
    {(!data.source.trim()||data.points.length<2||data.points.some(point=>!point.label.trim()))&&<span className="muted chart-source-hint">Add at least two labeled values and a source before approving this chart scene.</span>}
  </section>;
};
