import type { NoteLetterOctave, YCoordinates } from '../types/elements';
import type { Note, Octave } from '../types/theory';
import { NOTE_EVENTS } from './consts';

type PitchDragState = {
  element: HTMLElement;
  elementIndex: number;
  // For chords: the index of the notehead within the chord being dragged.
  chordNoteIndex: number | null;
  originalNote: NoteLetterOctave;
  currentNote: NoteLetterOctave;
  originalY: number;
  startClientY: number;
  tooltip: HTMLDivElement;
  yCoordinates: YCoordinates;
  sortedPositions: [NoteLetterOctave, number][];
};

/**
 * `detail` payload of the `note-pitch-change` event a `<music-staff editable>`
 * dispatches when a notehead is dragged to a new pitch. `note` and `octave` are
 * always carried as separate fields, never a combined string.
 */
export type PitchChangeDetail = {
  element: HTMLElement;
  elementIndex: number;
  /** Index of the note within the chord, or null for a single note. */
  chordNoteIndex: number | null;
  fromNote: Note;
  fromOctave: Octave;
  toNote: Note;
  toOctave: Octave;
};

// Handles vertical dragging of noteheads to change pitch. Activates only
// when the pointerdown target is a `.head`/`.head-hit-zone` SVG element.
// Snaps to valid staff Y positions during drag, shows a tooltip with the
// note transition (e.g. "D4 → F4"), and dispatches `note-pitch-change` on
// drop.
export class PitchDragHandler {
  #hostElement: HTMLElement;
  // Resolves the Y-coordinate table for the clef segment active at a given
  // elementIndex — a staff with mid-stream <music-clef> markers has more
  // than one table, so this can't be captured once at construction time.
  #resolveYCoordinates: (elementIndex: number) => YCoordinates;
  #dragState: PitchDragState | null = null;
  #onLivePreview:
    | ((
        elementIndex: number,
        note: Note,
        octave: Octave,
        chordNoteIndex: number | null
      ) => void)
    | null = null;
  #bound: {
    pointermove: (e: PointerEvent) => void;
    pointerup: (e: PointerEvent) => void;
    pointercancel: (e: PointerEvent) => void;
    keydown: (e: KeyboardEvent) => void;
  };

  constructor(
    hostElement: HTMLElement,
    resolveYCoordinates: (elementIndex: number) => YCoordinates,
    onLivePreview?: (
      elementIndex: number,
      note: Note,
      octave: Octave,
      chordNoteIndex: number | null
    ) => void
  ) {
    this.#hostElement = hostElement;
    this.#resolveYCoordinates = resolveYCoordinates;
    this.#onLivePreview = onLivePreview ?? null;

    this.#bound = {
      pointermove: this.#onPointerMove.bind(this),
      pointerup: this.#onPointerUp.bind(this),
      pointercancel: this.#onPointerCancel.bind(this),
      keydown: this.#onKeyDown.bind(this),
    };
  }

  // Call from the staff's pointerdown handler once the target is confirmed
  // to be a notehead. Returns whether a drag actually started.
  tryStart(
    e: PointerEvent,
    element: HTMLElement,
    elementIndex: number,
    chordNoteIndex: number | null
  ): boolean {
    const yCoordinates = this.#resolveYCoordinates(elementIndex);
    const sortedPositions = this.#buildSortedPositions(yCoordinates);

    const originalNote = this.#resolveNote(
      element,
      chordNoteIndex,
      yCoordinates,
      sortedPositions
    );
    if (!originalNote) {
      return false;
    }

    const originalY = yCoordinates[originalNote];
    if (originalY === undefined) {
      return false;
    }

    const dragStartEvent = new CustomEvent(NOTE_EVENTS.PITCH_DRAG_START, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { element, elementIndex, chordNoteIndex, note: originalNote },
    });
    if (!this.#hostElement.dispatchEvent(dragStartEvent)) {
      return false;
    }

    e.preventDefault();

    const tooltip = this.#createTooltip(originalNote, originalNote);

    this.#dragState = {
      element,
      elementIndex,
      chordNoteIndex,
      originalNote,
      currentNote: originalNote,
      originalY,
      startClientY: e.clientY,
      tooltip,
      yCoordinates,
      sortedPositions,
    };

    this.#hostElement.setPointerCapture(e.pointerId);
    this.#hostElement.addEventListener('pointermove', this.#bound.pointermove);
    this.#hostElement.addEventListener('pointerup', this.#bound.pointerup);
    this.#hostElement.addEventListener(
      'pointercancel',
      this.#bound.pointercancel
    );
    document.addEventListener('keydown', this.#bound.keydown);

    return true;
  }

  cancelDrag(): void {
    if (!this.#dragState) {
      return;
    }

    const { elementIndex, originalNote, chordNoteIndex } = this.#dragState;
    if (this.#onLivePreview && this.#dragState.currentNote !== originalNote) {
      const { note, octave } = this.#splitNoteOctave(originalNote);
      this.#onLivePreview(elementIndex, note, octave, chordNoteIndex);
    }

    this.#cleanup();
  }

  detach(): void {
    this.cancelDrag();
  }

  get isDragging(): boolean {
    return this.#dragState !== null;
  }

  #onPointerMove(e: PointerEvent) {
    if (!this.#dragState) {
      return;
    }

    const deltaY = e.clientY - this.#dragState.startClientY;
    const targetY = this.#dragState.originalY + deltaY;

    const snapped = this.#snapToPosition(
      targetY,
      this.#dragState.element,
      this.#dragState.chordNoteIndex,
      this.#dragState.yCoordinates,
      this.#dragState.sortedPositions
    );
    if (!snapped) {
      return;
    }

    const [newNote] = snapped;

    if (newNote !== this.#dragState.currentNote) {
      this.#dragState.currentNote = newNote;

      this.#updateTooltip(
        this.#dragState.tooltip,
        this.#dragState.originalNote,
        newNote
      );

      if (this.#onLivePreview) {
        const { note, octave } = this.#splitNoteOctave(newNote);
        this.#onLivePreview(
          this.#dragState.elementIndex,
          note,
          octave,
          this.#dragState.chordNoteIndex
        );
      }
    }

    this.#dragState.tooltip.style.left = `${e.clientX + 16}px`;
    this.#dragState.tooltip.style.top = `${e.clientY - 12}px`;
  }

  #onPointerUp() {
    if (!this.#dragState) {
      return;
    }

    const { elementIndex, chordNoteIndex, originalNote, currentNote, element } =
      this.#dragState;

    this.#cleanup();

    if (originalNote !== currentNote) {
      const { note: fromNote, octave: fromOctave } =
        this.#splitNoteOctave(originalNote);
      const { note: toNote, octave: toOctave } =
        this.#splitNoteOctave(currentNote);
      this.#hostElement.dispatchEvent(
        new CustomEvent(NOTE_EVENTS.PITCH_CHANGE, {
          bubbles: true,
          composed: true,
          detail: {
            element,
            elementIndex,
            chordNoteIndex,
            fromNote,
            fromOctave,
            toNote,
            toOctave,
          } satisfies PitchChangeDetail,
        })
      );
    }
  }

  #onPointerCancel() {
    this.cancelDrag();
  }

  #onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.cancelDrag();
    }
  }

  #cleanup() {
    if (!this.#dragState) {
      return;
    }

    this.#dragState.tooltip.remove();

    this.#hostElement.removeEventListener(
      'pointermove',
      this.#bound.pointermove
    );
    this.#hostElement.removeEventListener('pointerup', this.#bound.pointerup);
    this.#hostElement.removeEventListener(
      'pointercancel',
      this.#bound.pointercancel
    );
    document.removeEventListener('keydown', this.#bound.keydown);

    this.#dragState = null;
  }

  // Splits a combined letter+octave key into its two parts for external
  // consumers (onLivePreview, PitchChangeDetail) — internal snap/lookup
  // logic keeps using the combined form since that's what the Y-coordinate
  // table's keys are.
  #splitNoteOctave(value: NoteLetterOctave): { note: Note; octave: Octave } {
    return {
      note: value[0] as Note,
      octave: Number(value[1]) as Octave,
    };
  }

  // Flattens a Y-coordinate table into an array sorted ascending by Y
  // (top-to-bottom), used for nearest-position snapping.
  #buildSortedPositions(
    yCoordinates: YCoordinates
  ): [NoteLetterOctave, number][] {
    const sortedPositions: [NoteLetterOctave, number][] = [];
    for (const [note, y] of Object.entries(yCoordinates)) {
      if (y !== undefined) {
        sortedPositions.push([note as NoteLetterOctave, y]);
      }
    }
    sortedPositions.sort((a, b) => a[1] - b[1]);
    return sortedPositions;
  }

  // Snaps a target Y to the nearest valid staff position, excluding
  // positions already occupied by other notes in the same chord.
  #snapToPosition(
    targetY: number,
    element: HTMLElement,
    chordNoteIndex: number | null,
    yCoordinates: YCoordinates,
    sortedPositions: [NoteLetterOctave, number][]
  ): [NoteLetterOctave, number] | null {
    // Get occupied positions for chord duplicate prevention
    const occupiedNotes = new Set<NoteLetterOctave>();
    if (chordNoteIndex !== null && element.nodeName === 'MUSIC-CHORD') {
      const noteElements = element.querySelectorAll('music-note');
      noteElements.forEach((noteEl, i) => {
        if (i !== chordNoteIndex) {
          const val = noteEl.getAttribute('note');
          if (val) {
            const resolved = this.#resolveLetterOctave(
              val,
              noteEl.getAttribute('octave'),
              yCoordinates,
              sortedPositions
            );
            if (resolved) {
              occupiedNotes.add(resolved);
            }
          }
        }
      });
    }

    let best: [NoteLetterOctave, number] | null = null;
    let bestDist = Infinity;

    for (const [note, y] of sortedPositions) {
      // Skip positions occupied by other chord notes
      if (occupiedNotes.has(note)) {
        continue;
      }

      const dist = Math.abs(y - targetY);
      if (dist < bestDist) {
        bestDist = dist;
        best = [note, y];
      }
    }

    return best;
  }

  // Resolves the note at chordNoteIndex when element is a chord, else the element's own note.
  #resolveNote(
    element: HTMLElement,
    chordNoteIndex: number | null,
    yCoordinates: YCoordinates,
    sortedPositions: [NoteLetterOctave, number][]
  ): NoteLetterOctave | null {
    if (element.nodeName === 'MUSIC-CHORD' && chordNoteIndex !== null) {
      const noteElements = element.querySelectorAll('music-note');
      const noteEl = noteElements[chordNoteIndex];
      if (!noteEl) return null;
      return this.#resolveLetterOctave(
        noteEl.getAttribute('note') ?? '',
        noteEl.getAttribute('octave'),
        yCoordinates,
        sortedPositions
      );
    }

    return this.#resolveLetterOctave(
      element.getAttribute('note') ?? '',
      element.getAttribute('octave'),
      yCoordinates,
      sortedPositions
    );
  }

  #resolveLetterOctave(
    value: string,
    octave: string | null,
    yCoordinates: YCoordinates,
    sortedPositions: [NoteLetterOctave, number][]
  ): NoteLetterOctave | null {
    if (!value) return null;

    const letter = value.trim()[0]?.toUpperCase();
    if (!letter || !/^[A-G]$/.test(letter)) return null;

    if (octave) {
      const key = `${letter}${octave}` as NoteLetterOctave;
      if (yCoordinates[key] !== undefined) return key;
    } else {
      // Search from lowest octave first (highest Y) to match staff behavior
      // where octaves are searched in ascending order [4, 5, 6].
      for (let i = sortedPositions.length - 1; i >= 0; i--) {
        const [note] = sortedPositions[i];
        if (note.startsWith(letter)) return note;
      }
    }

    return null;
  }

  #createTooltip(from: NoteLetterOctave, to: NoteLetterOctave): HTMLDivElement {
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
      position: fixed;
      padding: 4px 8px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      border-radius: 4px;
      font-size: 12px;
      font-family: monospace;
      pointer-events: none;
      z-index: 10001;
      white-space: nowrap;
    `;
    tooltip.textContent = from === to ? from : `${from} → ${to}`;
    document.body.appendChild(tooltip);
    return tooltip;
  }

  #updateTooltip(
    tooltip: HTMLDivElement,
    from: NoteLetterOctave,
    to: NoteLetterOctave
  ) {
    tooltip.textContent = from === to ? from : `${from} → ${to}`;
  }

  // Checks whether an SVG element is a notehead (hit zone or visible head).
  // Used by staffClassicalBase.ts's pointerdown dispatch to choose pitch
  // drag vs timing reorder.
  static isNoteheadTarget(target: Element): boolean {
    let current: Element | null = target;
    while (current) {
      if (
        current.classList.contains('head') ||
        current.classList.contains('head-hit-zone')
      ) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  }
}
