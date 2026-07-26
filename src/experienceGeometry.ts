import { BowlId } from './bowlSamplePlayer';

export type ExperienceChakraId = BowlId | 'third-eye' | 'throat' | 'solar-plexus' | 'sacral';

export type ExperienceChakra = {
  id: ExperienceChakraId;
  name: string;
  shortName: string;
  color: string;
  active: boolean;
  angle: number;
};

// The positions are intentionally an original radial arrangement rather than a copied diagram.
export const experienceChakras: ExperienceChakra[] = [
  { id: 'crown', name: 'Crown', shortName: 'Crown', color: '#c9b4e8', active: true, angle: -90 },
  { id: 'third-eye', name: 'Third Eye', shortName: 'Third Eye', color: '#7c74ba', active: false, angle: -38 },
  { id: 'throat', name: 'Throat', shortName: 'Throat', color: '#6f9cc8', active: false, angle: 14 },
  { id: 'heart', name: 'Heart', shortName: 'Heart', color: '#76ad88', active: true, angle: 66 },
  { id: 'solar-plexus', name: 'Solar Plexus', shortName: 'Solar Plexus', color: '#d7b865', active: false, angle: 118 },
  { id: 'sacral', name: 'Sacral', shortName: 'Sacral', color: '#d58d61', active: false, angle: 170 },
  { id: 'root', name: 'Root', shortName: 'Root', color: '#c87873', active: true, angle: 222 },
];

export const activeExperienceChakras = experienceChakras.filter(chakra => chakra.active);
