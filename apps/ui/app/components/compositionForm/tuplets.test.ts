import { describe, expect, it } from 'vitest';
import { resolveTupletRuns, setTuplet, tupletCandidate } from './tuplets';
import type { CompositionStructure, MusicEntry, Selection } from './types';
import { isPitchedEntry } from './types';

const tupletIdOf = (
  entriesById: Record<string, MusicEntry>,
  id: string
): string | null | undefined => {
  const entry = entriesById[id];
  return isPitchedEntry(entry) ? entry.tupletId : null;
};

const note = (id: string, tupletId?: string | null): MusicEntry => ({
  id,
  type: 'note',
  value: 'C',
  duration: 'eighth',
  ...(tupletId !== undefined ? { tupletId } : {}),
});

function buildStructure(): CompositionStructure {
  return {
    measureOrder: ['m1'],
    measuresById: { m1: { id: 'm1', staffIds: ['s1', 's2'] } },
    stavesById: {
      s1: {
        id: 's1',
        type: 'treble',
        entryIds: ['e1', 'e2', 'e3', 'e4'],
        group: null,
        groupId: null,
      },
      s2: {
        id: 's2',
        type: 'bass',
        entryIds: ['e5', 'e6'],
        group: null,
        groupId: null,
      },
    },
    entriesById: {
      e1: note('e1'),
      e2: note('e2'),
      e3: note('e3'),
      e4: note('e4'),
      e5: note('e5'),
      e6: note('e6'),
    },
    connectorsById: {},
    connectorOrder: [],
    tupletsById: {},
  };
}

const sel = (
  entryIds: string[],
  patch: Partial<Selection> = {}
): Selection => ({
  measureIds: [],
  staffIds: [],
  entryIds,
  ...patch,
});

describe('resolveTupletRuns', () => {
  it('splits a staff into loose and tuplet runs', () => {
    const entriesById: Record<string, MusicEntry> = {
      e1: note('e1'),
      e2: note('e2', 't1'),
      e3: note('e3', 't1'),
      e4: note('e4'),
    };
    const runs = resolveTupletRuns(['e1', 'e2', 'e3', 'e4'], entriesById);
    expect(runs.map((r) => r.tupletId)).toEqual([null, 't1', null]);
    expect(runs[1].entries.map((e) => e.id)).toEqual(['e2', 'e3']);
  });

  it('breaks a tuplet run at a clef entry', () => {
    const entriesById: Record<string, MusicEntry> = {
      e1: note('e1', 't1'),
      c1: { id: 'c1', type: 'clef', clef: 'bass' },
      e2: note('e2', 't1'),
    };
    const runs = resolveTupletRuns(['e1', 'c1', 'e2'], entriesById);
    expect(runs.map((r) => r.tupletId)).toEqual(['t1', null, 't1']);
  });
});

describe('tupletCandidate', () => {
  it('accepts 2+ contiguous entries in one staff', () => {
    expect(tupletCandidate(sel(['e2', 'e3']), buildStructure())).toEqual({
      staffId: 's1',
      entryIds: ['e2', 'e3'],
    });
  });

  it('rejects a non-contiguous selection', () => {
    expect(tupletCandidate(sel(['e1', 'e3']), buildStructure())).toBeNull();
  });

  it('rejects a cross-staff selection', () => {
    expect(tupletCandidate(sel(['e4', 'e5']), buildStructure())).toBeNull();
  });

  it('rejects a single entry and rejects when a measure is also selected', () => {
    expect(tupletCandidate(sel(['e1']), buildStructure())).toBeNull();
    expect(
      tupletCandidate(
        sel(['e1', 'e2'], { measureIds: ['m1'] }),
        buildStructure()
      )
    ).toBeNull();
  });
});

describe('setTuplet', () => {
  it('creates a tuplet and stamps every member', () => {
    const next = setTuplet(buildStructure(), ['e1', 'e2', 'e3'], '3');
    const ids = ['e1', 'e2', 'e3'].map((id) =>
      tupletIdOf(next.entriesById, id)
    );
    expect(new Set(ids).size).toBe(1);
    expect(ids[0]).toBeTruthy();
    expect(Object.values(next.tupletsById)[0].ratio).toBe('3');
  });

  it('re-ratios in place, replacing the old tuplet', () => {
    let next = setTuplet(buildStructure(), ['e1', 'e2'], '3');
    next = setTuplet(next, ['e1', 'e2'], '5');
    expect(Object.keys(next.tupletsById)).toHaveLength(1);
    expect(Object.values(next.tupletsById)[0].ratio).toBe('5');
  });

  it('removes the tuplet and clears every member, even ones not re-selected', () => {
    let next = setTuplet(buildStructure(), ['e1', 'e2', 'e3'], '3');
    next = setTuplet(next, ['e1', 'e2'], null);
    expect(next.tupletsById).toEqual({});
    expect(tupletIdOf(next.entriesById, 'e3')).toBeNull();
  });
});
