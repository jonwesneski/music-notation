import '@one-step-at-a-time/web-components';
import type {
  DurationType,
  Note,
  Octave,
} from '@one-step-at-a-time/web-components';

type NoteItem = {
  id: string;
  type: 'note';
  value: Note;
  octave: Octave | null;
  duration: DurationType;
};
type ChordItem = {
  id: string;
  type: 'chord';
  duration: DurationType;
  notes: { value: Note; octave: Octave | null }[];
};
type StaffItem = NoteItem | ChordItem;

const initialNotes: StaffItem[] = [
  {
    id: 'c1',
    type: 'chord',
    duration: 'eighth',
    notes: [
      { value: 'A', octave: 4 },
      { value: 'E', octave: 4 },
    ],
  },
  {
    id: 'c2',
    type: 'chord',
    duration: 'eighth',
    notes: [
      { value: 'A', octave: 4 },
      { value: 'E', octave: 4 },
    ],
  },
  { id: 'n1', type: 'note', value: 'D', octave: 4, duration: 'quarter' },
  {
    id: 'n2',
    type: 'note',
    value: 'F#' as Note,
    octave: 4,
    duration: 'quarter',
  },
  { id: 'n3', type: 'note', value: 'B', octave: 4, duration: 'quarter' },
];

// Experimental render-only harness. Note editing (pitch / reorder drag) lives
// in the real editor under compositionForm/.
export default function MusicScore() {
  return (
    <music-composition key-sig="D" mode="major" time="4/4">
      <music-measure>
        <music-staff clef="treble">
          {initialNotes.map((item) =>
            item.type === 'chord' ? (
              <music-chord key={item.id} duration={item.duration}>
                {item.notes.map((n, j) => (
                  <music-note
                    key={j}
                    note={n.value}
                    octave={n.octave ?? undefined}
                  ></music-note>
                ))}
              </music-chord>
            ) : (
              <music-note
                key={item.id}
                note={item.value}
                octave={item.octave ?? undefined}
                duration={item.duration}
              ></music-note>
            )
          )}
        </music-staff>
        <music-staff clef="bass">
          <music-note note="A" duration="quarter"></music-note>
        </music-staff>
        <music-staff-vocal></music-staff-vocal>
      </music-measure>
      <music-measure>
        <music-staff clef="treble">
          <music-note note="A" duration="thirtysecond"></music-note>
          <music-note note="D" duration="eighth"></music-note>
        </music-staff>
        <music-staff clef="bass">
          <music-note note="A" duration="quarter"></music-note>
          <music-note note="A" duration="quarter"></music-note>
          <music-rest duration="eighth"></music-rest>
        </music-staff>

        <music-staff-vocal voice="soprano">
          <music-note note={'C'} octave={5} duration="eighth"></music-note>
          <music-note note={'D'} octave={5} duration="eighth"></music-note>
          <music-note note={'E'} octave={5} duration="eighth"></music-note>
          <music-note note={'F'} octave={5} duration="eighth"></music-note>
          <music-rest duration="eighth"></music-rest>
          <music-note note={'A'} octave={5} duration="eighth"></music-note>
          <music-note note={'A'} octave={5} duration="quarter"></music-note>
          <music-lyrics verse="1">Hap-py birth-day to_ you you_</music-lyrics>
          <music-lyrics verse="2">
            Hap-py birth-day dear_ friend friend_
          </music-lyrics>
        </music-staff-vocal>
      </music-measure>
      <music-measure>
        <music-staff clef="treble">
          <music-note note="A" duration="quarter"></music-note>
          <music-note note="A" duration="quarter"></music-note>
          <music-note note="A" duration="quarter"></music-note>
          <music-note note="A" duration="quarter"></music-note>
        </music-staff>
        <music-staff clef="bass">
          <music-note note="A" duration="quarter"></music-note>
        </music-staff>
        <music-staff-vocal></music-staff-vocal>
      </music-measure>
    </music-composition>
  );
}
