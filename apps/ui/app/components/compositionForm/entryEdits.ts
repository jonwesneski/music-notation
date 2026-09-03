import type { CompositionStructure, MusicEntry } from './types';

// Replaces one entry in place, keyed by id. Returns the structure unchanged when
// the entry is not present (a stale selection). Kept pure and colocated with a
// test; the `updateEntry` mutator in CompositionInput just wraps this in
// `record()`.
export function applyEntryUpdate(
  structure: CompositionStructure,
  entry: MusicEntry
): CompositionStructure {
  if (!structure.entriesById[entry.id]) {
    return structure;
  }
  return {
    ...structure,
    entriesById: { ...structure.entriesById, [entry.id]: entry },
  };
}
