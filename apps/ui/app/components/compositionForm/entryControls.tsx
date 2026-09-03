import type { DurationType, Note } from '@one-step-at-a-time/web-components';
import { DURATIONS, NOTES } from '@one-step-at-a-time/web-components';
import { Button, Select } from '@/design-system';

// Shared pitch / duration / chord-note controls used by both the "add entry"
// panel (EntryInput) and the "edit selected entry" panel (EntryEditInput).

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
  notes: Note[];
  onChange: (notes: Note[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {notes.map((value, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <PitchSelect
            className="flex-1"
            value={value}
            onChange={(next) =>
              onChange(notes.map((n, idx) => (idx === i ? next : n)))
            }
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
        onClick={() => onChange([...notes, 'C'])}
      >
        + Add Note
      </Button>
    </div>
  );
}
