import './chord';
import './composition';
import './tuplet';
import './measure';
import './staffGuitarTab';
import './staff'; // order of import matters for some reason, otherwise <note> can't find gYCoordinate()
import './staffVocal';
import './clef';

import './guitarNote';
import './note';
import './rest';

export { durationToFactor } from './rules/theoryConsts';
export * from './types/theory';
export type {
  ConnectorRole,
  GraceArticulationsType,
  GraceNotesType,
  GraceOctavesType,
  GuitarFret,
} from './types/elements';
export type { PitchChangeDetail } from './utils/pitchDragHandler';

/**
 * Allowed-value arrays for the enumerated attributes, re-exported so app code can
 * build pickers/controls without importing from deep paths.
 */
export {
  ARTICULATIONS,
  CLEFS,
  DURATIONS,
  DYNAMICS,
  GRACE_DURATIONS,
  GRACE_SLURS,
  GRACE_TYPES,
  MODES,
  NOTES,
  OCTAVES,
  STAFF_GROUPS,
  STRESSES,
  TIMES,
  TUPLET_RATIOS,
  VOICES,
} from './utils/consts';
