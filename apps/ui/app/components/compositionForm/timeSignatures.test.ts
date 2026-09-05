import type { TimeSignature } from '@one-step-at-a-time/web-components';
import { describe, expect, it } from 'vitest';
import {
  effectiveMeters,
  meterAt,
  meterOfEntry,
  meterRegionAt,
} from './timeSignatures';
import type { CompositionStructure, NormalizedMeasure } from './types';

function structureOf(
  timeSig: TimeSignature,
  measureTimes: (TimeSignature | null)[]
): CompositionStructure {
  const measuresById: Record<string, NormalizedMeasure> = {};
  const measureOrder = measureTimes.map((time, i) => {
    const id = `m${i}`;
    measuresById[id] = { id, staffIds: [], time };
    return id;
  });
  return {
    timeSig,
    measureOrder,
    measuresById,
    stavesById: {},
    entriesById: {},
    connectorsById: {},
    connectorOrder: [],
    tupletsById: {},
  };
}

describe('effectiveMeters', () => {
  it('carries the composition meter forward until an override', () => {
    const s = structureOf('4/4', [null, null, '3/4', null, '4/4', null]);
    expect(effectiveMeters(s)).toEqual([
      '4/4',
      '4/4',
      '3/4',
      '3/4',
      '4/4',
      '4/4',
    ]);
  });

  it('is just the composition meter with no overrides', () => {
    const s = structureOf('6/8', [null, null, null]);
    expect(effectiveMeters(s)).toEqual(['6/8', '6/8', '6/8']);
  });
});

describe('meterAt', () => {
  it('reads one measure’s effective meter', () => {
    const s = structureOf('4/4', [null, '3/4', null]);
    expect(meterAt(s, 0)).toBe('4/4');
    expect(meterAt(s, 2)).toBe('3/4');
  });
});

describe('meterRegionAt', () => {
  const s = structureOf('4/4', [null, null, '3/4', null, '4/4', null]);

  it('spans from the composition start to the first override', () => {
    expect(meterRegionAt(s, 0)).toEqual({ startIndex: 0, endIndex: 2 });
    expect(meterRegionAt(s, 1)).toEqual({ startIndex: 0, endIndex: 2 });
  });

  it('spans from an override to the next override', () => {
    expect(meterRegionAt(s, 2)).toEqual({ startIndex: 2, endIndex: 4 });
    expect(meterRegionAt(s, 3)).toEqual({ startIndex: 2, endIndex: 4 });
  });

  it('spans from the last override to the end', () => {
    expect(meterRegionAt(s, 4)).toEqual({ startIndex: 4, endIndex: 6 });
    expect(meterRegionAt(s, 5)).toEqual({ startIndex: 4, endIndex: 6 });
  });
});

describe('meterOfEntry', () => {
  it('is the effective meter of the entry’s measure', () => {
    const base = structureOf('4/4', [null, '3/4']);
    const s: CompositionStructure = {
      ...base,
      measuresById: {
        m0: { id: 'm0', staffIds: ['s0'] },
        m1: { id: 'm1', staffIds: ['s1'], time: '3/4' },
      },
      stavesById: {
        s0: {
          id: 's0',
          type: 'treble',
          entryIds: ['a'],
          group: null,
          groupId: null,
        },
        s1: {
          id: 's1',
          type: 'treble',
          entryIds: ['b'],
          group: null,
          groupId: null,
        },
      },
      entriesById: {
        a: { id: 'a', type: 'rest', duration: 'quarter' },
        b: { id: 'b', type: 'rest', duration: 'quarter' },
      },
    };
    expect(meterOfEntry(s, 'a')).toBe('4/4');
    expect(meterOfEntry(s, 'b')).toBe('3/4');
    expect(meterOfEntry(s, 'missing')).toBe('4/4');
  });
});
