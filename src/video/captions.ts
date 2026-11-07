export type CaptionSegment={text:string;startSeconds:number;endSeconds:number};

const sentenceParts=(text:string)=>text.split(/(?<=[.!?।])\s+/u).map(part=>part.trim()).filter(Boolean);

export function buildCaptionSegments(text:string,durationSeconds:number,maxWords=6):CaptionSegment[]{
  if(!text.trim()||!Number.isFinite(durationSeconds)||durationSeconds<=0)return [];
  const phrases:string[]=[];
  for(const sentence of sentenceParts(text)){
    const words=sentence.split(/\s+/u).filter(Boolean);let phrase:string[]=[];
    for(const word of words){
      const candidate=[...phrase,word].join(' ');
      if(phrase.length&&(phrase.length>=maxWords||candidate.length>54)){phrases.push(phrase.join(' '));phrase=[];}
      phrase.push(word);
    }
    if(phrase.length)phrases.push(phrase.join(' '));
  }
  if(!phrases.length)return [];
  const weights=phrases.map(phrase=>Math.max(1,phrase.split(/\s+/u).length));const totalWeight=weights.reduce((sum,weight)=>sum+weight,0);let cursor=0;
  return phrases.map((phrase,index)=>{const startSeconds=cursor;cursor+=durationSeconds*weights[index]/totalWeight;return{text:phrase,startSeconds,endSeconds:index===phrases.length-1?durationSeconds:cursor}});
}
