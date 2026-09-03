import { describe, expect, it } from 'vitest';
import {
  measureDuration,
  remainingDuration,
  usedDuration,
} from './measureCapacity';
import type { MusicEntry } from './types';

const note = (id: string, duration: MusicEntry['duration']): MusicEntry => ({
  id,
  type: 'note',
  value: 'C',
  duration,
});

describe('measureDuration', () => {
  it('is beats over beat-type', () => {
    expect(measureDuration('4/4')).toBe(1);
    expect(measureDuration('3/4')).toBe(0.75);
    expect(measureDuration('6/8')).toBe(0.75);
    expect(measureDuration('2/2')).toBe(1);
    expect(measureDuration('7/8')).toBeCloseTo(0.875);
  });
});

describe('usedDuration', () => {
  it('sums the entries by duration factor', () => {
    expect(usedDuration([note('a', 'quarter'), note('b', 'eighth')])).toBe(
      0.375
    );
  });
});

describe('remainingDuration', () => {
  it('reflects the time signature, not a fixed whole note', () => {
    const threeQuarters = [note('a', 'quarter'), note('b', 'quarter')];
    expect(remainingDuration(threeQuarters, '3/4')).toBeCloseTo(0.25);
    expect(remainingDuration(threeQuarters, '2/4')).toBeCloseTo(0);
  });

  it('goes negative when a measure is overfull', () => {
    expect(remainingDuration([note('a', 'whole')], '3/4')).toBeCloseTo(-0.25);
  });
});
