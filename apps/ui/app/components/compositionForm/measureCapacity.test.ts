import type { DurationType } from '@one-step-at-a-time/web-components';
import { describe, expect, it } from 'vitest';
import {
  availableForDuration,
  fittingDurations,
  largestFittingDuration,
  measureDuration,
  remainingDuration,
  staffOfEntryId,
  usedDuration,
} from './measureCapacity';
import type {
  CompositionStructure,
  MusicEntry,
  NormalizedTuplet,
  NoteEntry,
} from './types';

const note = (
  id: string,
  duration: DurationType,
  tupletId?: string
): NoteEntry => ({
  id,
  type: 'note',
  value: 'C',
  duration,
  ...(tupletId ? { tupletId } : {}),
});

const noTuplets: Record<string, NormalizedTuplet> = {};

function buildStructure(
  entriesById: Record<string, MusicEntry>,
  tupletsById: Record<string, NormalizedTuplet> = {}
): CompositionStructure {
  return {
    measureOrder: ['m1'],
    measuresById: { m1: { id: 'm1', staffIds: ['s1'] } },
    stavesById: {
      s1: {
        id: 's1',
        type: 'treble',
        entryIds: Object.keys(entriesById),
        group: null,
        groupId: null,
      },
    },
    entriesById,
    connectorsById: {},
    connectorOrder: [],
    tupletsById,
  };
}

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
    expect(
      usedDuration([note('a', 'quarter'), note('b', 'eighth')], noTuplets)
    ).toBe(0.375);
  });

  it('scales tuplet members by the ratio (3:2 triplet fills one beat)', () => {
    const entries = [
      note('a', 'eighth', 't1'),
      note('b', 'eighth', 't1'),
      note('c', 'eighth', 't1'),
    ];
    const tuplets = { t1: { id: 't1', ratio: '3:2' as const } };
    expect(usedDuration(entries, tuplets)).toBeCloseTo(0.25);
  });

  it('scales bare-numeral tuplet ratios via the library default normal count', () => {
    const entries = [
      note('a', 'eighth', 't1'),
      note('b', 'eighth', 't1'),
      note('c', 'eighth', 't1'),
    ];
    const tuplets = { t1: { id: 't1', ratio: '3' as const } };
    expect(usedDuration(entries, tuplets)).toBeCloseTo(0.25);
  });
});

describe('remainingDuration', () => {
  it('reflects the time signature, not a fixed whole note', () => {
    const threeQuarters = [note('a', 'quarter'), note('b', 'quarter')];
    expect(remainingDuration(threeQuarters, '3/4', noTuplets)).toBeCloseTo(
      0.25
    );
    expect(remainingDuration(threeQuarters, '2/4', noTuplets)).toBeCloseTo(0);
  });

  it('goes negative when a measure is overfull', () => {
    expect(
      remainingDuration([note('a', 'whole')], '3/4', noTuplets)
    ).toBeCloseTo(-0.25);
  });
});

describe('staffOfEntryId', () => {
  it('returns the staff holding the entry, or null', () => {
    const structure = buildStructure({
      e1: note('e1', 'quarter'),
      e2: note('e2', 'quarter'),
    });
    expect(staffOfEntryId(structure, 'e2')?.id).toBe('s1');
    expect(staffOfEntryId(structure, 'nope')).toBeNull();
  });
});

describe('availableForDuration', () => {
  it('is the whole-measure budget with the entry’s own slot freed', () => {
    const structure = buildStructure({
      e1: note('e1', 'quarter'),
      e2: { id: 'e2', type: 'note', value: 'C', duration: 'half' },
    });
    // used = 0.75; freeing e1 (0.25) leaves 1 - 0.5 = 0.5 available to e1
    expect(availableForDuration(structure, '4/4', 'e1')).toBeCloseTo(0.5);
    // freeing e2 (0.5) leaves 1 - 0.25 = 0.75 available to e2
    expect(availableForDuration(structure, '4/4', 'e2')).toBeCloseTo(0.75);
  });

  it('falls back to the whole-measure budget for an unknown entry', () => {
    const structure = buildStructure({ e1: note('e1', 'quarter') });
    expect(availableForDuration(structure, '3/4', 'missing')).toBeCloseTo(0.75);
  });
});

describe('fittingDurations', () => {
  it('keeps everything that fits plus the current value and shorter', () => {
    expect(fittingDurations(0.25, 'quarter')).toEqual([
      'quarter',
      'eighth',
      'sixteenth',
      'thirtysecond',
      'sixtyfourth',
      'hundredtwentyeighth',
    ]);
  });

  it('adds longer values once they fit', () => {
    expect(fittingDurations(0.5, 'quarter')).toEqual([
      'half',
      'quarter',
      'eighth',
      'sixteenth',
      'thirtysecond',
      'sixtyfourth',
      'hundredtwentyeighth',
    ]);
  });

  it('still shows the current value when the measure is already overfull', () => {
    expect(fittingDurations(-0.25, 'whole')).toEqual([
      'whole',
      'half',
      'quarter',
      'eighth',
      'sixteenth',
      'thirtysecond',
      'sixtyfourth',
      'hundredtwentyeighth',
    ]);
  });
});

describe('largestFittingDuration', () => {
  it('is the longest value within budget', () => {
    expect(largestFittingDuration(0.3)).toBe('quarter');
    expect(largestFittingDuration(1)).toBe('whole');
    expect(largestFittingDuration(2)).toBe('double-whole');
  });

  it('is null when nothing fits', () => {
    expect(largestFittingDuration(0)).toBeNull();
  });
});
