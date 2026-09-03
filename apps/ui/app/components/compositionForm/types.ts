import type {
  ConnectorRole,
  DurationType,
  Mode,
  Note,
  Octave,
  StaffGroupType,
  TimeSignature,
} from '@one-step-at-a-time/web-components';
import { DURATIONS, MODES, TIMES } from '@one-step-at-a-time/web-components';

export type { ConnectorRole };

// Re-export the library's option arrays so form controls have one source of
// truth. `KEY_SIGNATURE_OPTIONS` below stays local — it is a deliberate
// circle-of-fifths subset with no library equivalent.
export { DURATIONS as DURATION_OPTIONS, TIMES as TIME_SIGNATURE_OPTIONS };
export const MODE_OPTIONS = MODES;

export type StaffType = 'treble' | 'bass';

// `octave: null` (or absent) means "let the staff clef pick the octave" —
// matches the library's optional `octave` attribute and `ChordNote` shape.
export type ChordNote = { value: Note; octave?: Octave | null };

export type NoteEntry = {
  id: string;
  type: 'note';
  value: Note;
  octave?: Octave | null;
  duration: DurationType;
};
export type ChordEntry = {
  id: string;
  type: 'chord';
  notes: ChordNote[];
  duration: DurationType;
};
export type RestEntry = {
  id: string;
  type: 'rest';
  duration: DurationType;
};
export type MusicEntry = NoteEntry | ChordEntry | RestEntry;
// Entry shape before an id is assigned (used when constructing entries in EntryInput)
export type DraftMusicEntry =
  | Omit<NoteEntry, 'id'>
  | Omit<ChordEntry, 'id'>
  | Omit<RestEntry, 'id'>;

// Flat normalized nodes
export type NormalizedMeasure = { id: string; staffIds: string[] };
export type NormalizedStaff = {
  id: string;
  type: StaffType;
  entryIds: string[];
  group: StaffGroupType | null;
  groupId: string | null;
};

export type ConnectorKind = 'tie' | 'slur';

// A tie or slur between two note/chord entries. References entry ids only, so it
// is independent of which staff/measure the endpoints live in (a slur or tie may
// span a barline). startEntryId is always earlier than endEntryId in document
// order (measure → staff → entry).
export type NormalizedConnector = {
  id: string;
  kind: ConnectorKind;
  startEntryId: string;
  endEntryId: string;
};

// The undoable structural slice
export type CompositionStructure = {
  measureOrder: string[];
  measuresById: Record<string, NormalizedMeasure>;
  stavesById: Record<string, NormalizedStaff>;
  entriesById: Record<string, MusicEntry>;
  connectorsById: Record<string, NormalizedConnector>;
  connectorOrder: string[];
};

export type Selection = {
  measureIds: string[];
  staffIds: string[];
  entryIds: string[];
};

export const EMPTY_SELECTION: Selection = {
  measureIds: [],
  staffIds: [],
  entryIds: [],
};

export function isSelectionEmpty(selection: Selection): boolean {
  return (
    selection.measureIds.length === 0 &&
    selection.staffIds.length === 0 &&
    selection.entryIds.length === 0
  );
}

// Exactly one entry and nothing else — the selection an entry editor needs.
export function isSingleEntrySelection(selection: Selection): boolean {
  return (
    selection.entryIds.length === 1 &&
    selection.measureIds.length === 0 &&
    selection.staffIds.length === 0
  );
}

// Root form shape (BasicInfo fields + structure)
export type CompositionFormValues = {
  title: string;
  keySig: Note;
  timeSig: TimeSignature;
  mode: Mode;
} & CompositionStructure;

export const KEY_SIGNATURE_OPTIONS: Note[] = [
  'C',
  'G',
  'D',
  'A',
  'E',
  'B',
  'F#',
  'Db',
  'Ab',
  'Eb',
  'Bb',
  'F',
];
