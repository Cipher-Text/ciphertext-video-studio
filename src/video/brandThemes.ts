import type {BrandId} from '../domain';

export type DocumentaryBrandTheme={
  titleFont:string;
  bodyFont:string;
  titleWeight:number;
  titleTracking:string;
  motionGuidance:{cameraIntensity:number;transition:'fade'|'cut'};
};

/** Presentation tokens are separate from project data so existing brand/storyboard JSON stays unchanged. */
export const brandThemes={
  'bengal-unfolded':{titleFont:'"Noto Serif Bengali", Georgia, serif',bodyFont:'"Noto Sans Bengali", Arial, sans-serif',titleWeight:650,titleTracking:'-.02em',motionGuidance:{cameraIntensity:.08,transition:'fade'}},
  'delta-signal':{titleFont:'Georgia, serif',bodyFont:'Arial, sans-serif',titleWeight:650,titleTracking:'-.015em',motionGuidance:{cameraIntensity:.055,transition:'fade'}},
  factlens:{titleFont:'Arial, sans-serif',bodyFont:'Arial, sans-serif',titleWeight:700,titleTracking:'-.025em',motionGuidance:{cameraIntensity:.045,transition:'cut'}},
  kalokhata:{titleFont:'Georgia, serif',bodyFont:'Arial, sans-serif',titleWeight:600,titleTracking:'-.01em',motionGuidance:{cameraIntensity:.035,transition:'cut'}},
  'ciphertext-labs':{titleFont:'Arial, sans-serif',bodyFont:'Arial, sans-serif',titleWeight:650,titleTracking:'-.035em',motionGuidance:{cameraIntensity:.06,transition:'cut'}},
  'open-care':{titleFont:'"Noto Sans Bengali", Arial, sans-serif',bodyFont:'"Noto Sans Bengali", Arial, sans-serif',titleWeight:600,titleTracking:'-.01em',motionGuidance:{cameraIntensity:.035,transition:'fade'}},
} satisfies Record<BrandId,DocumentaryBrandTheme>;
