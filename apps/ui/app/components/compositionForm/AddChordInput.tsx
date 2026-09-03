import { Button } from '@/design-system';
import type { DurationType } from '@one-step-at-a-time/web-components';
import { durationToFactor } from '@one-step-at-a-time/web-components';
import { useState } from 'react';
import { ChordNoteRows, DurationSelect } from './entryControls';
import type { ChordNote, DraftMusicEntry } from './types';

interface AddChordInputProps {
  onAdd: (entry: DraftMusicEntry) => void;
  remainingBeats: number;
}

export function AddChordInput({ onAdd, remainingBeats }: AddChordInputProps) {
  const [notes, setNotes] = useState<ChordNote[]>([
    { value: 'C' },
    { value: 'E' },
  ]);
  const [duration, setDuration] = useState<DurationType>('quarter');

  const canAdd = durationToFactor[duration] <= remainingBeats;

  return (
    <div
      className="flex flex-col gap-2 p-3"
      onClick={(e) => e.stopPropagation()}
    >
      <ChordNoteRows notes={notes} onChange={setNotes} />
      <DurationSelect value={duration} onChange={setDuration} />
      <Button
        type="button"
        disabled={!canAdd}
        onClick={() => onAdd({ type: 'chord', notes, duration })}
      >
        Add
      </Button>
    </div>
  );
}
