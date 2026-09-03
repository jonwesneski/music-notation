import type {
  DurationType,
  Note,
  Octave,
} from '@one-step-at-a-time/web-components';
import { useCompositionFormSession } from './CompositionFormSessionContext';
import {
  ChordNoteRows,
  DurationSelect,
  MarkingsFields,
  OctaveSelect,
  PitchSelect,
} from './entryControls';
import type { PitchedEntry } from './types';

interface EntryEditInputProps {
  entry: PitchedEntry;
}

const labelClass = 'text-xs font-medium text-zinc-500';

export function EntryEditInput({ entry }: EntryEditInputProps) {
  const { updateEntry } = useCompositionFormSession();

  return (
    <div
      className="flex flex-col gap-2 p-3"
      onClick={(e) => e.stopPropagation()}
    >
      {entry.type === 'note' && (
        <div className="flex gap-2">
          <label className="flex flex-1 flex-col gap-0.5">
            <span className={labelClass}>Pitch</span>
            <PitchSelect
              value={entry.value}
              onChange={(value: Note) => updateEntry({ ...entry, value })}
            />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className={labelClass}>Octave</span>
            <OctaveSelect
              value={entry.octave}
              onChange={(octave: Octave | null) =>
                updateEntry({ ...entry, octave })
              }
            />
          </label>
        </div>
      )}

      {entry.type === 'chord' && (
        <div className="flex flex-col gap-0.5">
          <span className={labelClass}>Notes</span>
          <ChordNoteRows
            notes={entry.notes}
            onChange={(notes) => updateEntry({ ...entry, notes })}
          />
        </div>
      )}

      <label className="flex flex-col gap-0.5">
        <span className={labelClass}>Duration</span>
        <DurationSelect
          value={entry.duration}
          onChange={(duration: DurationType) =>
            updateEntry({ ...entry, duration })
          }
        />
      </label>

      {entry.type !== 'rest' && (
        <MarkingsFields
          markings={entry}
          onChange={(patch) => updateEntry({ ...entry, ...patch })}
        />
      )}
    </div>
  );
}
