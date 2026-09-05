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

describe('applyEntryUpdate — capacity clamp', () => {
  // buildStructure: s1 = [e1 quarter note, e2 half chord] → used 0.75 in 4/4
  it('applies a duration that still fits its measure verbatim', () => {
    const structure = buildStructure();
    const next = applyEntryUpdate(
      structure,
      { id: 'e1', type: 'note', value: 'C', duration: 'half' },
      '4/4'
    );
    expect(next.entriesById.e1).toMatchObject({ duration: 'half' });
  });

  it('clamps a duration that would overfill down to the largest that fits', () => {
    const structure = buildStructure();
    const next = applyEntryUpdate(
      structure,
      { id: 'e1', type: 'note', value: 'C', duration: 'whole' },
      '4/4'
    );
    // freeing e1's quarter leaves 0.5 available → whole clamps to half
    expect(next.entriesById.e1).toMatchObject({ duration: 'half' });
  });

  it('leaves non-duration edits alone even when the measure is full', () => {
    const structure = buildStructure();
    const next = applyEntryUpdate(
      structure,
      { id: 'e1', type: 'note', value: 'G', duration: 'quarter' },
      '4/4'
    );
    expect(next.entriesById.e1).toEqual({
      id: 'e1',
      type: 'note',
      value: 'G',
      duration: 'quarter',
    });
  });

  it('keeps the existing duration when the measure is already overfull', () => {
    const structure: CompositionStructure = {
      ...buildStructure(),
      entriesById: {
        e1: { id: 'e1', type: 'note', value: 'C', duration: 'whole' },
        e2: { id: 'e2', type: 'note', value: 'C', duration: 'whole' },
      },
    };
    const next = applyEntryUpdate(
      structure,
      { id: 'e1', type: 'note', value: 'C', duration: 'double-whole' },
      '3/4'
    );
    expect(next.entriesById.e1).toMatchObject({ duration: 'whole' });
  });
});
