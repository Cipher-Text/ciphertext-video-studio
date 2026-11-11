import React from 'react';
import {Composition, type CalculateMetadataFunction} from 'remotion';
import {MasterDocumentary, type VideoProps} from './MasterDocumentary';
import {brands,StoryboardSchema,type BrandId,type Storyboard} from '../domain';
import {getProjectVideoMetadata} from './metadata';

const demoProps:VideoProps={brand:brands[0],title:'The river remembers',musicSrc:'demo-bed.wav',scenes:[{id:'one',text:'A story carried across generations.',label:'THE BEGINNING'},{id:'two',text:'Along the great rivers of Bengal, history is always in motion.',label:'A LIVING DELTA'},{id:'three',text:'Every shore holds a story still waiting to be told.',label:'BENGAL UNFOLDED'}]};
const sceneEngineDemoProps:VideoProps={brand:brands.find(brand=>brand.id==='delta-signal')!,title:'Reading river gauge data',language:'en',scenes:[
  {id:'engine-demo-intro',text:'A deterministic scene engine, driven by the frame.',label:'SCENE ENGINE · FRAME-DRIVEN MOTION',durationSeconds:4,sceneType:'intro',animation:'fade'},
  {id:'engine-demo-chart',text:'This example chart uses sample station readings. Replace them with verified source data before publication.',label:'Reading river gauge data',durationSeconds:7,sceneType:'data-chart',animation:'rise',sourceReferences:['Example dataset only; replace with the original station record.'],chartData:{chartType:'line',unit:'meters',period:'Example readings',source:'Example dataset only; replace with a verified station record.',points:[{label:'Station A',value:2.4},{label:'Station B',value:3.1},{label:'Station C',value:2.8}]}},
  {id:'engine-demo-outro',text:'Use the same typed scenes and motion system across the six brand profiles.',label:'CIPHERTEXT VIDEO STUDIO',durationSeconds:4,sceneType:'outro',animation:'fade'},
]};

export const VideoRoot:React.FC=()=> <>
  <Composition id="CipherTextDemo" component={MasterDocumentary} durationInFrames={450} fps={30} width={1920} height={1080} defaultProps={demoProps}/>
  <Composition id="CipherTextSceneEngineDemo" component={MasterDocumentary} durationInFrames={450} fps={30} width={1080} height={1080} defaultProps={sceneEngineDemoProps}/>
  <Composition id="CipherTextProject" component={SavedProjectVideo} durationInFrames={300} fps={30} width={1920} height={1080} defaultProps={{brandId:'bengal-unfolded',title:'Untitled project',format:'landscape',storyboard:{version:1,title:'Untitled project',language:'en',targetDurationSeconds:10,scenes:[{id:'placeholder',order:0,sceneType:'intro',narration:'Prepare a storyboard to render.',onScreenText:'STORYBOARD',estimatedDurationSeconds:10,visualDescription:'',animation:'fade',approvalStatus:'draft',sourceReferences:[]}]}} as SavedProjectProps} calculateMetadata={projectMetadata}/>
</>;

type SavedProjectProps={brandId:BrandId;title:string;format:'landscape'|'portrait'|'square';storyboard:Storyboard};
const SavedProjectVideo:React.FC<SavedProjectProps>=({brandId,title,storyboard})=><MasterDocumentary brand={brands.find(b=>b.id===brandId)!} title={title} language={storyboard.language} scenes={storyboard.scenes.map(scene=>({id:scene.id,text:scene.narration,label:scene.onScreenText,durationSeconds:scene.estimatedDurationSeconds,animation:scene.animation,sceneType:scene.sceneType,visualDescription:scene.visualDescription,sourceReferences:scene.sourceReferences,camera:scene.camera,animationConfig:scene.animationConfig,animationPresetId:scene.animationPresetId,transition:scene.transition,audio:scene.audio,assetPath:scene.assetPath,parallaxLayers:scene.parallaxLayers,geoJson:scene.geoJson,comparisonData:scene.comparisonData,mapData:scene.mapData,videoAsset:scene.videoAsset,chartData:scene.chartData,historyData:scene.historyData,softwareData:scene.softwareData}))}/>;
const projectMetadata:CalculateMetadataFunction<SavedProjectProps>=({props})=>{
  const storyboard=StoryboardSchema.parse(props.storyboard);
  const {width,height,durationInFrames}=getProjectVideoMetadata(props.format,storyboard);
  return {width,height,durationInFrames};
};
