import React from 'react';
import type {Scene} from '../domain';

type HistoryData=NonNullable<Scene['historyData']>;
type HistoryEvent=HistoryData['events'][number];
const blankEvent=():HistoryEvent=>({date:'',title:'',description:'',source:'',illustrative:true});

export const HistoryTimelineEditor:React.FC<{value?:HistoryData;assets:{src:string}[];sceneNumber:number;onChange:(value:HistoryData)=>void}>=({value,assets,sceneNumber,onChange})=>{
  const events=value?.events??[blankEvent(),blankEvent()];
  const update=(index:number,patch:Partial<HistoryEvent>)=>onChange({events:events.map((event,i)=>i===index?{...event,...patch}:event)});
  return <section className="history-data-editor" aria-label={`Scene ${sceneNumber} history timeline`}>
    <div className="history-editor-heading"><div><span className="eyebrow">SOURCED HISTORY TIMELINE</span><p>Add dated events in chronological order. Each event needs a citation; mark reconstructions clearly.</p></div></div>
    {events.map((event,index)=><fieldset className="history-event-editor" key={index}><legend>Event {String(index+1).padStart(2,'0')}</legend><div className="row history-event-fields"><label>Date or period<input maxLength={40} aria-label={`Scene ${sceneNumber} history date ${index+1}`} placeholder="e.g. 1971 or c. 1600" value={event.date} onChange={e=>update(index,{date:e.target.value})}/></label><label>Event title<input maxLength={140} aria-label={`Scene ${sceneNumber} history title ${index+1}`} value={event.title} onChange={e=>update(index,{title:e.target.value})}/></label></div><label className="history-description">Description<textarea maxLength={800} aria-label={`Scene ${sceneNumber} history description ${index+1}`} rows={2} value={event.description} onChange={e=>update(index,{description:e.target.value})}/></label><label className="history-source">Source / citation<input maxLength={500} aria-label={`Scene ${sceneNumber} history source ${index+1}`} placeholder="Archive, collection, publication, or URL" value={event.source} onChange={e=>update(index,{source:e.target.value})}/></label><div className="row history-event-footer"><label>Archival image<select aria-label={`Scene ${sceneNumber} archival image ${index+1}`} value={event.assetPath??''} onChange={e=>update(index,{assetPath:e.target.value||undefined})}><option value="">No image attached</option>{assets.map(asset=><option key={asset.src} value={asset.src}>{asset.src.split('/').pop()}</option>)}</select></label><label className="reconstruction-toggle"><input type="checkbox" checked={event.illustrative} onChange={e=>update(index,{illustrative:e.target.checked})}/><span>Illustrative reconstruction</span></label>{events.length>2&&<button type="button" className="text-button" onClick={()=>onChange({events:events.filter((_,i)=>i!==index)})}>Remove event</button>}</div></fieldset>)}
    {events.length<8&&<button type="button" className="button ghost" onClick={()=>onChange({events:[...events,blankEvent()]})}>＋ Add dated event</button>}
    {events.some(event=>!event.date.trim()||!event.title.trim()||!event.source.trim())&&<p className="muted history-validation-note">Every event needs a date, title, and citation before approval. Media marked illustrative will carry that label in the video.</p>}
  </section>;
};
