import type {
  ArticulationType,
  ConnectorRole,
  DurationType,
  DynamicMarking,
  GraceDuration,
  GraceSlur,
  GraceType,
  Mode,
  Note,
  Octave,
  StaffGroupType,
  StressType,
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

// A grace-note group preceding a note/chord. `octaves` / `articulations` are
// aligned by index with `notes` (a null slot = "no value for that grace note").
// Serialized to the seven `grace-*` attributes by grace.ts.
export type GraceGroup = {
  notes: Note[];
  octaves?: (Octave | null)[];
  articulations?: (ArticulationType | null)[];
  type?: GraceType;
  duration?: GraceDuration;
  slur?: GraceSlur;
  dynamic?: DynamicMarking;
};

// Expression marks shared by notes and chords. Every field is optional/nullable
// and maps 1:1 to a `<music-note>` / `<music-chord>` attribute.
export type EntryMarkings = {
  dynamic?: DynamicMarking | null;
  articulation?: ArticulationType | null;
  stress?: StressType | null;
  grace?: GraceGroup | null;
};

export type NoteEntry = EntryMarkings & {
  id: string;
  type: 'note';
  value: Note;
  octave?: Octave | null;
  duration: DurationType;
};
export type ChordEntry = EntryMarkings & {
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

// tie / slur pair by document order with id/for disambiguation for interleaving
// spans; crescendo / decrescendo are hairpins the library pairs by nearest end
// of the same kind (no id/for). `diminuendo` is not modelled — it is a display
// label that writes `decrescendo` (the library treats it as a pure alias).
export type ConnectorKind = 'tie' | 'slur' | 'crescendo' | 'decrescendo';

// A tie / slur / hairpin between two note/chord entries. References entry ids
// only, so it is independent of which staff/measure the endpoints live in (any
// of them may span a barline). startEntryId is always earlier than endEntryId in
// document order (measure → staff → entry).
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
