import { DurationType } from '../types/theory';
import {
  SPACING_LOG_INCREMENT_PX,
  SPACING_SHORTEST_SLACK_PX,
} from '../utils/notationDimensions';
import { durationToFactor } from './theoryConsts';

/**
 * Horizontal spacing of a staff's entries (notes/chords/rests) within the notes
 * area. Separate from staffWidth.ts, which sizes the staff/measure box itself:
 * these functions answer "given an available width, where does each entry sit".
 *
 * Pure — the caller supplies a tuplet scale map so this module stays free of the
 * tuplet/SVG dependency chain.
 */

/**
 * Slack (px) beyond the fixed MIN_NOTE_WIDTH strut that one entry should receive
 * when the measure has width to spare. Grows logarithmically: each doubling of
 * duration relative to the measure's shortest entry adds SPACING_LOG_INCREMENT_PX,
 * so a whole note is only a little wider than a quarter rather than four times.
 *
 * `durationFactor` / `shortestFactor` are linear whole-note fractions
 * (durationToFactor values).
 */
export function spacingSlackWeight(
  durationFactor: number,
  shortestFactor: number
): number {
  const doublings = Math.max(0, Math.log2(durationFactor / shortestFactor));
  return SPACING_SHORTEST_SLACK_PX + SPACING_LOG_INCREMENT_PX * doublings;
}

export interface SpacingWeights {
  /** Per-entry slack weight, parallel to `entries`. */
  weights: number[];
  /**
   * Σ of `weights`. The last entry's weight is the trailing space it gets before
   * the barline.
   */
  totalWeight: number;
}

/**
 * Slack weight for every entry. A tupleted entry's weight is scaled by
 * `tupletScaleByIndex.get(i)` (normal/actual) — the same reduction applied to its
 * MIN_NOTE_WIDTH strut — so N tuplet notes occupy the slack of their `normal`
 * count. The shortest-duration reference uses the unscaled linear factors.
 */
export function computeSpacingWeights(
  entries: ReadonlyArray<{ readonly duration: DurationType }>,
  tupletScaleByIndex: ReadonlyMap<number, number> = new Map()
): SpacingWeights {
  if (entries.length === 0) {
    return { weights: [], totalWeight: 0 };
  }
  const factors = entries.map((entry) => durationToFactor[entry.duration]);
  const shortestFactor = Math.min(...factors);
  let totalWeight = 0;
  const weights = factors.map((factor, i) => {
    const weight =
      spacingSlackWeight(factor, shortestFactor) *
      (tupletScaleByIndex.get(i) ?? 1);
    totalWeight += weight;
    return weight;
  });
  return { weights, totalWeight };
}

/**
 * Cumulative x-offset into the spare width (`proportionalWidth`, clamped to ≥ 0)
 * for each entry: `offsets[0]` is 0, and each subsequent offset adds the previous
 * entry's share of the spare width. The width left after the last entry — its own
 * share — is the trailing space before the barline.
 */
export function distributeSlack(
  weights: readonly number[],
  totalWeight: number,
  proportionalWidth: number
): number[] {
  const spare = Math.max(0, proportionalWidth);
  const offsets: number[] = [];
  let cumulativeWeight = 0;
  for (const weight of weights) {
    offsets.push(
      totalWeight > 0 ? (cumulativeWeight / totalWeight) * spare : 0
    );
    cumulativeWeight += weight;
  }
  return offsets;
}
