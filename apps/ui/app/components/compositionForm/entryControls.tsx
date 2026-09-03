import type {
  DurationType,
  Note,
  Octave,
} from '@one-step-at-a-time/web-components';
import { DURATIONS, NOTES, OCTAVES } from '@one-step-at-a-time/web-components';
import { Button, Select } from '@/design-system';
import type { ChordNote } from './types';

// Shared pitch / octave / duration / chord-note controls used by both the "add
// entry" panel (EntryInput) and the "edit selected entry" panel (EntryEditInput).

export function PitchSelect({
  value,
  onChange,
  className,
}: {
  value: Note;
  onChange: (value: Note) => void;
  className?: string;
}) {
  return (
    <Select
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value as Note)}
    >
      {NOTES.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </Select>
  );
}

const CLEF_DEFAULT = 'clef';

export function OctaveSelect({
  value,
  onChange,
  className,
}: {
  value: Octave | null | undefined;
  onChange: (value: Octave | null) => void;
  className?: string;
}) {
  return (
    <Select
      className={className}
      value={value ?? CLEF_DEFAULT}
      onChange={(e) =>
        onChange(
          e.target.value === CLEF_DEFAULT
            ? null
            : (Number(e.target.value) as Octave)
        )
      }
    >
      <option value={CLEF_DEFAULT}>clef default</option>
      {OCTAVES.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </Select>
  );
}

export function DurationSelect({
  value,
  onChange,
}: {
  value: DurationType;
  onChange: (value: DurationType) => void;
}) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value as DurationType)}
    >
      {DURATIONS.map((d) => (
        <option key={d} value={d}>
          {d}
        </option>
      ))}
    </Select>
  );
}

export function ChordNoteRows({
  notes,
  onChange,
}: {
  notes: ChordNote[];
  onChange: (notes: ChordNote[]) => void;
}) {
  const setNote = (index: number, next: Partial<ChordNote>) => {
    onChange(notes.map((n, i) => (i === index ? { ...n, ...next } : n)));
  };

  return (
    <div className="flex flex-col gap-2">
      {notes.map((note, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <PitchSelect
            className="flex-1"
            value={note.value}
            onChange={(value) => setNote(i, { value })}
          />
          <OctaveSelect
            value={note.octave}
            onChange={(octave) => setNote(i, { octave })}
          />
          {notes.length > 1 && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => onChange(notes.filter((_, idx) => idx !== i))}
            >
              −
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        onClick={() => onChange([...notes, { value: 'C' }])}
      >
        + Add Note
      </Button>
    </div>
  );
}
