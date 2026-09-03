import { describe, expect, it } from 'vitest';
import { applyEntryUpdate } from './entryEdits';
import type { CompositionStructure } from './types';

function buildStructure(): CompositionStructure {
  return {
    measureOrder: ['m1'],
    measuresById: { m1: { id: 'm1', staffIds: ['s1'] } },
    stavesById: {
      s1: {
        id: 's1',
        type: 'treble',
        entryIds: ['e1', 'e2'],
        group: null,
        groupId: null,
      },
    },
    entriesById: {
      e1: { id: 'e1', type: 'note', value: 'C', duration: 'quarter' },
      e2: {
        id: 'e2',
        type: 'chord',
        notes: [{ value: 'C' }, { value: 'E' }],
        duration: 'half',
      },
    },
    connectorsById: {},
    connectorOrder: [],
    tupletsById: {},
  };
}

describe('applyEntryUpdate', () => {
  it('replaces the target entry and leaves the rest untouched', () => {
    const structure = buildStructure();
    const next = applyEntryUpdate(structure, {
      id: 'e1',
      type: 'note',
      value: 'G',
      duration: 'eighth',
    });

    expect(next.entriesById.e1).toEqual({
      id: 'e1',
      type: 'note',
      value: 'G',
      duration: 'eighth',
    });
    expect(next.entriesById.e2).toBe(structure.entriesById.e2);
    expect(next.stavesById).toBe(structure.stavesById);
  });

  it('returns the same structure reference when the entry is unknown', () => {
    const structure = buildStructure();
    const next = applyEntryUpdate(structure, {
      id: 'missing',
      type: 'rest',
      duration: 'quarter',
    });
    expect(next).toBe(structure);
  });
});
