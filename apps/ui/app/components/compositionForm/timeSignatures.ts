import type { TimeSignature } from '@one-step-at-a-time/web-components';
import type { CompositionStructure } from './types';

// The time signature is a positional value: `structure.timeSig` is the
// composition (measure 1) meter, and any later measure may carry a sparse
// `time` override that holds from that measure until the next override. This
// mirrors the library's staff → measure → composition `time` inheritance
// (`staffBase.ts` resolveInheritedValue), except the app resolves the effective
// meter itself and writes it explicitly onto every `<music-measure>`, so there is
// no inheritance ambiguity and none of the measure-1-goes-stale runtime gap the
// library has when its composition `time` changes.

// Effective meter of every measure, aligned with `structure.measureOrder`.
export function effectiveMeters(
  structure: CompositionStructure
): TimeSignature[] {
  let current = structure.timeSig;
  return structure.measureOrder.map((id) => {
    const override = structure.measuresById[id]?.time;
    if (override) {
      current = override;
    }
    return current;
  });
}

// The meter of one measure by index (out-of-range → composition meter).
export function meterAt(
  structure: CompositionStructure,
  measureIndex: number
): TimeSignature {
  return effectiveMeters(structure)[measureIndex] ?? structure.timeSig;
}

// The effective meter of the measure that holds `entryId` (→ composition meter
// when the entry isn't placed anywhere).
export function meterOfEntry(
  structure: CompositionStructure,
  entryId: string
): TimeSignature {
  const meters = effectiveMeters(structure);
  for (let i = 0; i < structure.measureOrder.length; i++) {
    const measure = structure.measuresById[structure.measureOrder[i]];
    const holdsEntry = measure?.staffIds.some((sid) =>
      structure.stavesById[sid]?.entryIds.includes(entryId)
    );
    if (holdsEntry) {
      return meters[i];
    }
  }
  return structure.timeSig;
}

// The meter region containing `measureIndex`: the run of consecutive measures
// under one meter. `startIndex` is that meter's defining measure (an override, or
// measure 0); `endIndex` is exclusive — the next measure with its own override,
// or the end of the piece.
export function meterRegionAt(
  structure: CompositionStructure,
  measureIndex: number
): { startIndex: number; endIndex: number } {
  const order = structure.measureOrder;
  let startIndex = Math.max(0, Math.min(measureIndex, order.length - 1));
  while (startIndex > 0 && !structure.measuresById[order[startIndex]]?.time) {
    startIndex--;
  }
  let endIndex = measureIndex + 1;
  while (
    endIndex < order.length &&
    !structure.measuresById[order[endIndex]]?.time
  ) {
    endIndex++;
  }
  return { startIndex, endIndex };
}
