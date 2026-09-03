import type { TimeSignature } from '@one-step-at-a-time/web-components';
import { durationToFactor } from '@one-step-at-a-time/web-components';
import type { MusicEntry } from './types';
import { isPitchedEntry } from './types';

// How much of a measure one whole note fills is 1.0; a 4/4 measure holds 1.0,
// a 3/4 measure 0.75, a 6/8 measure 0.75, etc. Mirrors the library's
// measureRules.computeAllowedElementCount, which derives the same
// `beatsInMeasure / beatType` budget — the UI only needs the scalar because it
// is the sole writer and never over-fills a measure on purpose.

export function measureDuration(timeSig: TimeSignature): number {
  const [beats, beatType] = timeSig.split('/').map(Number);
  return beats / beatType;
}

export function usedDuration(entries: MusicEntry[]): number {
  return entries.reduce(
    (sum, entry) =>
      sum + (isPitchedEntry(entry) ? durationToFactor[entry.duration] : 0),
    0
  );
}

export function remainingDuration(
  entries: MusicEntry[],
  timeSig: TimeSignature
): number {
  return measureDuration(timeSig) - usedDuration(entries);
}
