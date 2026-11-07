import React from 'react';
import {Composition} from 'remotion';
import {MasterDocumentary, type VideoProps} from './MasterDocumentary';
import {brands} from '../domain';

const demoProps:VideoProps={brand:brands[0],title:'The river remembers',musicSrc:'demo-bed.wav',scenes:[{id:'one',text:'A story carried across generations.',label:'THE BEGINNING'},{id:'two',text:'Along the great rivers of Bengal, history is always in motion.',label:'A LIVING DELTA'},{id:'three',text:'Every shore holds a story still waiting to be told.',label:'BENGAL UNFOLDED'}]};

export const VideoRoot:React.FC=()=> <>
  <Composition id="CipherTextDemo" component={MasterDocumentary} durationInFrames={450} fps={30} width={1920} height={1080} defaultProps={demoProps}/>
</>;
