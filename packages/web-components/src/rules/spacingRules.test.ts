import { DurationType } from '../types/theory';
import {
  SPACING_LOG_INCREMENT_PX,
  SPACING_SHORTEST_SLACK_PX,
} from '../utils/notationDimensions';
import {
  computeSpacingWeights,
  distributeSlack,
  spacingSlackWeight,
} from './spacingRules';

const entries = (...durations: DurationType[]): { duration: DurationType }[] =>
  durations.map((duration) => ({ duration }));

describe('spacingSlackWeight', () => {
  it('is the floor when the note is the measure shortest', () => {
    expect(spacingSlackWeight(0.25, 0.25)).toBe(SPACING_SHORTEST_SLACK_PX);
  });

  it('adds one increment per doubling of duration', () => {
    // quarter (0.25) is two doublings above a sixteenth (0.0625)
    expect(spacingSlackWeight(0.25, 0.0625)).toBeCloseTo(
      SPACING_SHORTEST_SLACK_PX + 2 * SPACING_LOG_INCREMENT_PX
    );
  });

  it('never drops below the floor for a note shorter than the reference', () => {
    expect(spacingSlackWeight(0.03125, 0.25)).toBe(SPACING_SHORTEST_SLACK_PX);
  });

  it('is finite and positive across the whole duration range', () => {
    for (const factor of [2, 1, 0.5, 0.25, 0.0078125]) {
      const weight = spacingSlackWeight(factor, 0.0078125);
      expect(Number.isFinite(weight)).toBe(true);
      expect(weight).toBeGreaterThan(0);
    }
  });
});

describe('computeSpacingWeights', () => {
  it('returns empty results for no entries', () => {
    expect(computeSpacingWeights([])).toEqual({ weights: [], totalWeight: 0 });
  });

  it('gives equal weights to same-duration entries', () => {
    const { weights, totalWeight } = computeSpacingWeights(
      entries('quarter', 'quarter', 'quarter')
    );
    expect(weights).toEqual([
      SPACING_SHORTEST_SLACK_PX,
      SPACING_SHORTEST_SLACK_PX,
      SPACING_SHORTEST_SLACK_PX,
    ]);
    expect(totalWeight).toBe(3 * SPACING_SHORTEST_SLACK_PX);
  });

  it('weights a longer note above the measure shortest', () => {
    const { weights } = computeSpacingWeights(entries('eighth', 'whole'));
    expect(weights[1]).toBeGreaterThan(weights[0]);
  });

  it('totalWeight is the sum of the per-entry weights', () => {
    const { weights, totalWeight } = computeSpacingWeights(
      entries('half', 'quarter', 'eighth', 'whole')
    );
    expect(totalWeight).toBeCloseTo(weights.reduce((a, b) => a + b, 0));
  });

  it('scales a tupleted entry by its normal/actual factor', () => {
    const triplet = new Map([
      [0, 2 / 3],
      [1, 2 / 3],
      [2, 2 / 3],
    ]);
    const plain = computeSpacingWeights(entries('eighth', 'eighth'));
    const tripled = computeSpacingWeights(
      entries('eighth', 'eighth', 'eighth'),
      triplet
    );
    // three triplet eighths occupy the slack of two straight eighths
    expect(tripled.totalWeight).toBeCloseTo(plain.totalWeight);
  });
});

describe('distributeSlack', () => {
  it('starts the first entry at zero offset', () => {
    const offsets = distributeSlack([20, 20, 20], 60, 300);
    expect(offsets[0]).toBe(0);
  });

  it('is monotonically non-decreasing', () => {
    const offsets = distributeSlack([10, 40, 20, 30], 100, 500);
    for (let i = 1; i < offsets.length; i++) {
      expect(offsets[i]).toBeGreaterThanOrEqual(offsets[i - 1]);
    }
  });

  it('leaves the last entry its own weight share as trailing space', () => {
    const weights = [10, 40, 20, 30];
    const total = 100;
    const proportionalWidth = 500;
    const offsets = distributeSlack(weights, total, proportionalWidth);
    const trailing = proportionalWidth - offsets[offsets.length - 1];
    expect(trailing).toBeCloseTo(
      (weights[weights.length - 1] / total) * proportionalWidth
    );
  });

  it('collapses to all-zero offsets when there is no spare width', () => {
    expect(distributeSlack([20, 20], 40, 0)).toEqual([0, 0]);
    expect(distributeSlack([20, 20], 40, -50)).toEqual([0, 0]);
  });

  it('returns a single zero offset for one entry', () => {
    expect(distributeSlack([25], 25, 400)).toEqual([0]);
  });
});
