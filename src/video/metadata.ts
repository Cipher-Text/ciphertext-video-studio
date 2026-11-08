import type {Scene,Storyboard,StudioProject} from '../domain';

export const VIDEO_FPS=30;
export type VideoFormat=StudioProject['format'];
export type CompositionMetadata={width:number;height:number;fps:number;durationInFrames:number;sceneFrames:number[]};

export function sceneDurationSeconds(scene:Scene):number {
  return Math.max(scene.estimatedDurationSeconds,scene.audio?.durationSeconds??0,scene.videoAsset?scene.videoAsset.trimEndSeconds-scene.videoAsset.trimStartSeconds:0);
}
export function transitionFrameDurations(storyboard:Storyboard,fps=VIDEO_FPS):number[]{
  return storyboard.scenes.slice(0,-1).map((scene,index)=>{
    const transition=scene.transition;
    if(!transition||transition.type==='cut')return 0;
    const left=Math.max(1,Math.ceil(sceneDurationSeconds(scene)*fps));
    const right=Math.max(1,Math.ceil(sceneDurationSeconds(storyboard.scenes[index+1])*fps));
    return Math.min(Math.max(1,Math.round(transition.durationSeconds*fps)),Math.floor(Math.min(left,right)/3));
  });
}
export function getProjectVideoMetadata(format:VideoFormat,storyboard:Storyboard,fps=VIDEO_FPS):CompositionMetadata {
  const dimensions=format==='portrait'?{width:1080,height:1920}:format==='square'?{width:1080,height:1080}:{width:1920,height:1080};
  const sceneFrames=storyboard.scenes.map(scene=>Math.max(1,Math.ceil(sceneDurationSeconds(scene)*fps)));
  return {...dimensions,fps,sceneFrames,durationInFrames:sceneFrames.reduce((sum,frames)=>sum+frames,0)};
}
