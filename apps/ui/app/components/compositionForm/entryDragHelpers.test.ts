import type { Note } from '@one-step-at-a-time/web-components';
import { describe, expect, it } from 'vitest';
import {
  STAFF_Y_STEP,
  isNoteheadPath,
  pitchAfterVerticalDrag,
  reorderTargetIndex,
} from './entryDragHelpers';

function el(...classes: string[]): HTMLElement {
  const node = document.createElement('div');
  node.classList.add(...classes);
  return node;
}

describe('isNoteheadPath', () => {
  it('is true when the path passes through a notehead or its hit zone', () => {
    expect(isNoteheadPath([el('head')])).toBe(true);
    expect(isNoteheadPath([el('flag'), el('head-hit-zone'), el('note')])).toBe(
      true
    );
  });

  it('is false for stem/flag/body or an empty path', () => {
    expect(isNoteheadPath([el('stem'), el('flag')])).toBe(false);
    expect(isNoteheadPath([])).toBe(false);
    expect(isNoteheadPath([window, document])).toBe(false);
  });
});

describe('pitchAfterVerticalDrag', () => {
  const treble = {
    value: 'C' as Note,
    octave: 4 as const,
    clef: 'treble' as const,
  };

  it('raises the pitch one diatonic step per STAFF_Y_STEP dragged up', () => {
    expect(
      pitchAfterVerticalDrag({ ...treble, deltaY: -2 * STAFF_Y_STEP })
    ).toEqual({ value: 'E', octave: 4 });
  });

  it('lowers the pitch when dragged down', () => {
    expect(
      pitchAfterVerticalDrag({
        value: 'E',
        octave: 4,
        clef: 'treble',
        deltaY: 2 * STAFF_Y_STEP,
      })
    ).toEqual({ value: 'C', octave: 4 });
  });

  it('snaps to the nearest step (sub-half-step moves do nothing)', () => {
    expect(pitchAfterVerticalDrag({ ...treble, deltaY: -2 })).toEqual({
      value: 'C',
      octave: 4,
    });
  });

  it('clamps to the top of the clef range', () => {
    expect(pitchAfterVerticalDrag({ ...treble, deltaY: -1000 })).toEqual({
      value: 'C',
      octave: 6,
    });
  });

  it('clamps to the bottom of the clef range', () => {
    expect(pitchAfterVerticalDrag({ ...treble, deltaY: 1000 })).toEqual({
      value: 'C',
      octave: 4,
    });
  });

  it('uses the bass clef range', () => {
    expect(
      pitchAfterVerticalDrag({
        value: 'E',
        octave: 3,
        clef: 'bass',
        deltaY: -STAFF_Y_STEP,
      })
    ).toEqual({ value: 'F', octave: 3 });
  });

  it('skips steps already taken by other notes of the chord', () => {
    // C4 dragged up two steps lands on E4 (step 30); with E4 occupied it moves
    // on to F4 (step 31) in the drag direction.
    expect(
      pitchAfterVerticalDrag({
        ...treble,
        deltaY: -2 * STAFF_Y_STEP,
        occupiedSteps: [30],
      })
    ).toEqual({ value: 'F', octave: 4 });
  });
});

describe('reorderTargetIndex', () => {
  const siblings = [
    { id: 'a', rect: { left: 0, width: 20 } as DOMRect },
    { id: 'b', rect: { left: 20, width: 20 } as DOMRect },
    { id: 'c', rect: { left: 40, width: 20 } as DOMRect },
  ];

  it('returns 0 left of the first midpoint', () => {
    expect(reorderTargetIndex(5, siblings)).toBe(0);
  });

  it('returns the slot whose midpoint the pointer has not yet passed', () => {
    expect(reorderTargetIndex(25, siblings)).toBe(1);
    expect(reorderTargetIndex(45, siblings)).toBe(2);
  });

  it('returns the length past the last midpoint', () => {
    expect(reorderTargetIndex(100, siblings)).toBe(3);
  });
});
