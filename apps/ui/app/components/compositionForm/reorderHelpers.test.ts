import type { Note } from '@one-step-at-a-time/web-components';
import { describe, expect, it } from 'vitest';
import { moveEntryInStaff } from './reorderHelpers';
import type { CompositionStructure, MusicEntry, NoteEntry } from './types';

function structure(
  entryIds: string[],
  entriesById: Record<string, MusicEntry>,
  extra: Partial<CompositionStructure> = {}
): CompositionStructure {
  return {
    timeSig: '4/4',
    measureOrder: ['m1'],
    measuresById: { m1: { id: 'm1', staffIds: ['s1'] } },
    stavesById: {
      s1: { id: 's1', type: 'treble', entryIds, group: null, groupId: null },
    },
    entriesById,
    connectorsById: {},
    connectorOrder: [],
    tupletsById: {},
    ...extra,
  };
}

const note = (id: string, value: Note = 'C'): NoteEntry => ({
  id,
  type: 'note',
  value,
  duration: 'quarter',
});

describe('moveEntryInStaff', () => {
  it('splices the entry to its new position', () => {
    const next = moveEntryInStaff(
      structure(['a', 'b', 'c'], {
        a: note('a'),
        b: note('b'),
        c: note('c'),
      }),
      's1',
      'a',
      2
    );
    expect(next.stavesById.s1.entryIds).toEqual(['b', 'a', 'c']);
  });

  it('moves an entry to the end', () => {
    const next = moveEntryInStaff(
      structure(['a', 'b', 'c'], {
        a: note('a'),
        b: note('b'),
        c: note('c'),
      }),
      's1',
      'a',
      3
    );
    expect(next.stavesById.s1.entryIds).toEqual(['b', 'c', 'a']);
  });

  it('returns the same structure reference for a no-op move', () => {
    const s = structure(['a', 'b', 'c'], {
      a: note('a'),
      b: note('b'),
      c: note('c'),
    });
    expect(moveEntryInStaff(s, 's1', 'a', 1)).toBe(s);
    expect(moveEntryInStaff(s, 's1', 'missing', 2)).toBe(s);
  });

  it('keeps a tuplet whose run stays contiguous', () => {
    const next = moveEntryInStaff(
      structure(
        ['a', 'b', 'c', 'd'],
        {
          a: note('a'),
          b: { ...note('b'), tupletId: 't' },
          c: { ...note('c'), tupletId: 't' },
          d: note('d'),
        },
        { tupletsById: { t: { id: 't', ratio: '3:2' } } }
      ),
      's1',
      'a',
      4
    );
    expect(next.stavesById.s1.entryIds).toEqual(['b', 'c', 'd', 'a']);
    expect(next.tupletsById.t).toBeDefined();
    expect(next.entriesById.b).toMatchObject({ tupletId: 't' });
  });

  it('dissolves a tuplet when the move breaks its run', () => {
    const next = moveEntryInStaff(
      structure(
        ['a', 'b', 'c', 'd'],
        {
          a: note('a'),
          b: { ...note('b'), tupletId: 't' },
          c: { ...note('c'), tupletId: 't' },
          d: note('d'),
        },
        { tupletsById: { t: { id: 't', ratio: '3:2' } } }
      ),
      's1',
      'd',
      2
    );
    expect(next.stavesById.s1.entryIds).toEqual(['a', 'b', 'd', 'c']);
    expect(next.tupletsById.t).toBeUndefined();
    expect(next.entriesById.b).toMatchObject({ tupletId: null });
    expect(next.entriesById.c).toMatchObject({ tupletId: null });
  });

  it('swaps a connector’s endpoints when the move inverts their order', () => {
    const next = moveEntryInStaff(
      structure(
        ['a', 'b'],
        { a: note('a'), b: note('b') },
        {
          connectorsById: {
            t1: { id: 't1', kind: 'tie', startEntryId: 'a', endEntryId: 'b' },
          },
          connectorOrder: ['t1'],
        }
      ),
      's1',
      'a',
      2
    );
    expect(next.stavesById.s1.entryIds).toEqual(['b', 'a']);
    expect(next.connectorsById.t1).toMatchObject({
      startEntryId: 'b',
      endEntryId: 'a',
    });
  });

  it('prunes a tie whose endpoints are no longer adjacent', () => {
    const next = moveEntryInStaff(
      structure(
        ['a', 'b', 'c'],
        { a: note('a'), b: note('b'), c: note('c') },
        {
          connectorsById: {
            t1: { id: 't1', kind: 'tie', startEntryId: 'a', endEntryId: 'b' },
          },
          connectorOrder: ['t1'],
        }
      ),
      's1',
      'c',
      1
    );
    expect(next.stavesById.s1.entryIds).toEqual(['a', 'c', 'b']);
    expect(next.connectorOrder).toEqual([]);
  });
});
