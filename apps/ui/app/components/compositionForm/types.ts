import type {
  ConnectorRole,
  DurationType,
  Mode,
  Note,
  StaffGroupType,
  TimeSignature,
} from '@one-step-at-a-time/web-components';

export type { ConnectorRole };

export type StaffType = 'treble' | 'bass';

export type NoteEntry = {
  id: string;
  type: 'note';
  value: Note;
  duration: DurationType;
};
export type ChordEntry = {
  id: string;
  type: 'chord';
  notes: Note[];
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

export const TIME_SIGNATURE_OPTIONS = [
  '4/4',
  '3/4',
  '2/4',
  '2/2',
  '6/8',
  '9/8',
  '12/8',
  '3/8',
  '5/4',
  '7/4',
];

export const MODE_OPTIONS: Mode[] = ['major', 'minor'];

export const NOTE_OPTIONS: Note[] = [
  'A',
  'A#',
  'Bb',
  'B',
  'C',
  'C#',
  'Db',
  'D',
  'D#',
  'Eb',
  'E',
  'F',
  'F#',
  'Gb',
  'G',
  'G#',
  'Ab',
];

export const DURATION_OPTIONS: DurationType[] = [
  'whole',
  'half',
  'quarter',
  'eighth',
  'sixteenth',
  'thirtysecond',
  'sixtyfourth',
  'hundredtwentyeighth',
];
