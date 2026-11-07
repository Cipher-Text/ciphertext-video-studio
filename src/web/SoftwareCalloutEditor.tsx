import React from 'react';
import type {Scene} from '../domain';

type SoftwareData=NonNullable<Scene['softwareData']>;
type Callout=SoftwareData['callouts'][number];
const newCallout=(duration:number):Callout=>({text:'',startSeconds:0,endSeconds:Math.max(.1,Math.min(3,duration)),targetX:50,targetY:50,labelX:70,labelY:28});

export const SoftwareCalloutEditor:React.FC<{value?:SoftwareData;durationSeconds:number;sceneNumber:number;onChange:(value:SoftwareData)=>void}>=({value,durationSeconds,sceneNumber,onChange})=>{
  const callouts=value?.callouts??[];
  const update=(index:number,patch:Partial<Callout>)=>onChange({callouts:callouts.map((callout,i)=>i===index?{...callout,...patch}:callout)});
  return <section className="software-callout-editor" aria-label={`Scene ${sceneNumber} product callouts`}>
    <div className="software-callout-heading"><div><span className="eyebrow">PRODUCT CALLOUTS</span><p>Attach a screenshot or screen recording above. Set when each callout appears and position its target and label on the frame.</p></div></div>
    {callouts.map((callout,index)=><fieldset className="software-callout" key={index}><legend>Callout {String(index+1).padStart(2,'0')}</legend><label>Callout text<input maxLength={120} aria-label={`Scene ${sceneNumber} callout text ${index+1}`} placeholder="e.g. Export your report in one click" value={callout.text} onChange={e=>update(index,{text:e.target.value})}/></label><div className="row software-callout-times"><label>Show from (seconds)<input type="number" min="0" max={durationSeconds} step="0.1" value={callout.startSeconds} onChange={e=>{const start=Math.max(0,Math.min(durationSeconds-.1,Number(e.target.value)));update(index,{startSeconds:start,endSeconds:Math.max(start+.1,Math.min(durationSeconds,callout.endSeconds))})}}/></label><label>Show until (seconds)<input type="number" min={callout.startSeconds+0.1} max={durationSeconds} step="0.1" value={callout.endSeconds} onChange={e=>update(index,{startSeconds:Math.min(callout.startSeconds,Math.max(0,Number(e.target.value)-.1)),endSeconds:Math.max(.1,Math.min(durationSeconds,Number(e.target.value)))})}/></label></div><div className="software-callout-positions"><label>Target horizontal<input type="range" min="0" max="100" value={callout.targetX} onChange={e=>update(index,{targetX:Number(e.target.value)})}/><span>{callout.targetX}%</span></label><label>Target vertical<input type="range" min="0" max="100" value={callout.targetY} onChange={e=>update(index,{targetY:Number(e.target.value)})}/><span>{callout.targetY}%</span></label><label>Label horizontal<input type="range" min="0" max="100" value={callout.labelX} onChange={e=>update(index,{labelX:Number(e.target.value)})}/><span>{callout.labelX}%</span></label><label>Label vertical<input type="range" min="0" max="100" value={callout.labelY} onChange={e=>update(index,{labelY:Number(e.target.value)})}/><span>{callout.labelY}%</span></label></div><button type="button" className="text-button" onClick={()=>onChange({callouts:callouts.filter((_,i)=>i!==index)})}>Remove callout</button></fieldset>)}
    {callouts.length<8&&<button type="button" className="button ghost" onClick={()=>onChange({callouts:[...callouts,newCallout(durationSeconds)]})}>＋ Add callout</button>}
    {!callouts.length&&<p className="muted">No callouts yet. Add one to point out a product feature.</p>}
  </section>;
};
