import { Button } from '@/design-system';
import type { DurationType } from '@one-step-at-a-time/web-components';
import { useState } from 'react';
import { DurationSelect } from './entryControls';
import { durationFits, fittingDurations } from './measureCapacityHelpers';
import type { DraftMusicEntry } from './types';

interface AddRestInputProps {
  onAdd: (entry: DraftMusicEntry) => void;
  remainingBeats: number;
}

export function AddRestInput({ onAdd, remainingBeats }: AddRestInputProps) {
  const [duration, setDuration] = useState<DurationType>('quarter');

  const canAdd = durationFits(duration, remainingBeats);
  const durationOptions = fittingDurations(remainingBeats, duration);

  return (
    <div
      className="flex flex-col gap-2 p-3"
      onClick={(e) => e.stopPropagation()}
    >
      <DurationSelect
        value={duration}
        options={durationOptions}
        onChange={setDuration}
      />
      <Button
        type="button"
        disabled={!canAdd}
        onClick={() => onAdd({ type: 'rest', duration })}
      >
        Add
      </Button>
    </div>
  );
}
