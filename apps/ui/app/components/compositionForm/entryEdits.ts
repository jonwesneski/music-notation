import type { TimeSignature } from '@one-step-at-a-time/web-components';
import {
  availableForDuration,
  durationFits,
  largestFittingDuration,
} from './measureCapacity';
import type { CompositionStructure, MusicEntry } from './types';
import { isPitchedEntry } from './types';

// Replaces one entry in place, keyed by id. Returns the structure unchanged when
// the entry is not present (a stale selection). Kept pure and colocated with a
// test; the `updateEntry` mutator in CompositionInput just wraps this in
// `record()`.
//
// When `timeSig` is given, a duration that would overfill the entry's measure is
// clamped down to the largest value that fits — the last line of defense behind
// the filtered `DurationSelect`, so no caller can push the measure past its
// budget (the renderer silently drops entries beyond it).
export function applyEntryUpdate(
  structure: CompositionStructure,
  entry: MusicEntry,
  timeSig?: TimeSignature
): CompositionStructure {
  if (!structure.entriesById[entry.id]) {
    return structure;
  }
  const next = timeSig ? clampDuration(structure, entry, timeSig) : entry;
  return {
    ...structure,
    entriesById: { ...structure.entriesById, [entry.id]: next },
  };
}

function clampDuration(
  structure: CompositionStructure,
  entry: MusicEntry,
  timeSig: TimeSignature
): MusicEntry {
  const current = structure.entriesById[entry.id];
  if (
    !isPitchedEntry(entry) ||
    !isPitchedEntry(current) ||
    entry.duration === current.duration
  ) {
    return entry;
  }
  const available = availableForDuration(structure, timeSig, entry.id);
  if (durationFits(entry.duration, available)) {
    return entry;
  }
  return {
    ...entry,
    duration: largestFittingDuration(available) ?? current.duration,
  };
}
