import { Button } from '@/design-system';
import type {
  DurationType,
  Note,
  Octave,
} from '@one-step-at-a-time/web-components';
import { durationToFactor } from '@one-step-at-a-time/web-components';
import { useState } from 'react';
import { DurationSelect, OctaveSelect, PitchSelect } from './entryControls';
import type { DraftMusicEntry } from './types';

interface AddNoteInputProps {
  onAdd: (entry: DraftMusicEntry) => void;
  remainingBeats: number;
}

export function AddNoteInput({ onAdd, remainingBeats }: AddNoteInputProps) {
  const [value, setValue] = useState<Note>('C');
  const [octave, setOctave] = useState<Octave | null>(null);
  const [duration, setDuration] = useState<DurationType>('quarter');

  const canAdd = durationToFactor[duration] <= remainingBeats;

  return (
    <div
      className="flex flex-col gap-2 p-3"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1.5">
        <PitchSelect className="flex-1" value={value} onChange={setValue} />
        <OctaveSelect value={octave} onChange={setOctave} />
      </div>
      <DurationSelect value={duration} onChange={setDuration} />
      <Button
        type="button"
        disabled={!canAdd}
        onClick={() => onAdd({ type: 'note', value, octave, duration })}
      >
        Add
      </Button>
    </div>
  );
}
