import { describe, expect, it } from 'vitest';
import { removeSelectionFromStructure } from './deleteSelection';
import type { CompositionStructure } from './types';

function buildStructure(): CompositionStructure {
  return {
    measureOrder: ['m1', 'm2'],
    measuresById: {
      m1: { id: 'm1', staffIds: ['s1', 's2'] },
      m2: { id: 'm2', staffIds: ['s3'] },
    },
    stavesById: {
      s1: {
        id: 's1',
        type: 'treble',
        entryIds: ['e1', 'e2'],
        group: null,
        groupId: null,
      },
      s2: {
        id: 's2',
        type: 'bass',
        entryIds: ['e3'],
        group: null,
        groupId: null,
      },
      s3: {
        id: 's3',
        type: 'treble',
        entryIds: ['e4', 'e5', 'e6'],
        group: null,
        groupId: null,
      },
    },
    entriesById: {
      e1: { id: 'e1', type: 'note', value: 'C', duration: 'quarter' },
      e2: { id: 'e2', type: 'note', value: 'D', duration: 'quarter' },
      e3: { id: 'e3', type: 'rest', duration: 'quarter' },
      e4: { id: 'e4', type: 'note', value: 'E', duration: 'quarter' },
      e5: { id: 'e5', type: 'note', value: 'F', duration: 'quarter' },
      e6: { id: 'e6', type: 'note', value: 'G', duration: 'quarter' },
    },
  };
}

describe('removeSelectionFromStructure', () => {
  it('cascades a deleted measure to its staves and entries', () => {
    const result = removeSelectionFromStructure(buildStructure(), {
      measureIds: ['m1'],
      staffIds: [],
      entryIds: [],
    });

    expect(result.measureOrder).toEqual(['m2']);
    expect(result.measuresById).not.toHaveProperty('m1');
    expect(result.stavesById).not.toHaveProperty('s1');
    expect(result.stavesById).not.toHaveProperty('s2');
    expect(result.stavesById).toHaveProperty('s3');
    expect(result.entriesById).not.toHaveProperty('e1');
    expect(result.entriesById).not.toHaveProperty('e2');
    expect(result.entriesById).not.toHaveProperty('e3');
    expect(result.entriesById).toHaveProperty('e4');
  });

  it('cascades a deleted staff to its entries and updates the parent measure', () => {
    const result = removeSelectionFromStructure(buildStructure(), {
      measureIds: [],
      staffIds: ['s1'],
      entryIds: [],
    });

    expect(result.measureOrder).toEqual(['m1', 'm2']);
    expect(result.measuresById.m1.staffIds).toEqual(['s2']);
    expect(result.stavesById).not.toHaveProperty('s1');
    expect(result.stavesById).toHaveProperty('s2');
    expect(result.entriesById).not.toHaveProperty('e1');
    expect(result.entriesById).not.toHaveProperty('e2');
    expect(result.entriesById).toHaveProperty('e3');
  });

  it('deletes individual entries and updates the parent staff', () => {
    const result = removeSelectionFromStructure(buildStructure(), {
      measureIds: [],
      staffIds: [],
      entryIds: ['e5'],
    });

    expect(result.stavesById.s3.entryIds).toEqual(['e4', 'e6']);
    expect(result.entriesById).not.toHaveProperty('e5');
    expect(result.entriesById).toHaveProperty('e4');
    expect(result.entriesById).toHaveProperty('e6');
  });

  it('does not double-process or error when a measure and one of its own staves are both selected', () => {
    const result = removeSelectionFromStructure(buildStructure(), {
      measureIds: ['m1'],
      staffIds: ['s1'],
      entryIds: [],
    });

    expect(result.measureOrder).toEqual(['m2']);
    expect(result.measuresById).not.toHaveProperty('m1');
    expect(result.stavesById).not.toHaveProperty('s1');
    expect(result.stavesById).not.toHaveProperty('s2');
    expect(result.entriesById).not.toHaveProperty('e1');
    expect(result.entriesById).not.toHaveProperty('e2');
    expect(result.entriesById).not.toHaveProperty('e3');
    expect(result.stavesById).toHaveProperty('s3');
  });
});
