import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

const root=process.cwd();
const output=join(root,'out/animation-quality/props');
const source=JSON.parse(await readFile(join(root,'examples/garibpur-1971.project.json'),'utf8'));
await mkdir(output,{recursive:true});

const garibpurScenes=source.storyboard.scenes.filter(scene=>['garibpur-hook','garibpur-map'].includes(scene.id));
for(const format of ['portrait','landscape','square']){
 const props={brandId:source.brandId,title:source.title,format,storyboard:{...source.storyboard,scenes:garibpurScenes.map(scene=>({...scene}))}};
 await writeFile(join(output,`garibpur-${format}.json`),JSON.stringify(props,null,2));
}

const demos=[
 {brandId:'bengal-unfolded',title:'Bengal Unfolded · reconstruction',preset:'bengal.battlefield-intro',text:'A cited account places the armoured column on a wet rural road.',visual:'Illustrative reconstruction plate · no archival footage.'},
 {brandId:'kalokhata',title:'KaloKhata · source review',preset:'kalokhata.document-trail',text:'A claim is reviewed against dated public records.',visual:'Demonstration only · source status remains unresolved.',settings:{status:'unresolved',labels:['ALLEGATION','UNRESOLVED']}},
 {brandId:'delta-signal',title:'Delta Signal · rainfall',preset:'delta.rainfall',text:'Observed rainfall needs a station, timestamp, units, and source.',visual:'Illustrative field · no measured value shown.',settings:{intensity:.4,sourceLabel:'DEMO · SOURCE DATA REQUIRED'}},
 {brandId:'factlens',title:'FactLens · headline context',preset:'factlens.headline',text:'A headline is shown with room for source and context.',visual:'Editorial demonstration · verify current claims.'},
 {brandId:'open-care',title:'Open Care · health explainer',preset:'opencare.process',text:'Reviewed health information can be arranged into clear steps.',visual:'Schematic only · clinical review and source required.',settings:{labels:['PREVENTION','REVIEW','FOLLOW-UP']}},
 {brandId:'ciphertext-labs',title:'CipherText Labs · system architecture',preset:'ciphertext.system-architecture',text:'A product story can reveal one reviewed system step at a time.',visual:'Conceptual system diagram · use approved product media.'},
];
for(const demo of demos){
 const [brandKey,...titleBits]=demo.title.split(' · ');
 const title=titleBits.join(' · ');
 const storyboard={version:1,title,language:demo.brandId==='kalokhata'||demo.brandId==='open-care'?'bn':'en',targetDurationSeconds:7,scenes:[{id:`quality-${demo.brandId}`,order:0,sceneType:'cinematic-image',narration:demo.text,onScreenText:demo.text,estimatedDurationSeconds:7,visualDescription:demo.visual,animation:'zoom-in',approvalStatus:'approved',sourceReferences:[],animationPresetId:demo.preset,animationConfig:{camera:{movement:'zoom-in',intensity:.06},settings:demo.settings||{}}}]};
 await writeFile(join(output,`${demo.brandId}.json`),JSON.stringify({brandId:demo.brandId,title,format:'portrait',storyboard},null,2));
}
console.log(`Prepared ${demos.length} brand demos and 3 Garibpur formats in ${output}`);
