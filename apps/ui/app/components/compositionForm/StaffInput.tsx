import '@one-step-at-a-time/web-components';
import { durationToFactor } from '@one-step-at-a-time/web-components';
import { useFormContext } from 'react-hook-form';
import { AnchoredTabPanel } from './AnchoredTabPanel';
import { EntryInput } from './EntryInput';
import type { CompositionFormValues, DraftMusicEntry } from './types';

interface StaffInputProps {
  staffId: string;
  measureId: string;
  isSelected: boolean;
  onSelectStaff: (
    measureId: string,
    staffId: string,
    e: React.MouseEvent
  ) => void;
  onAddEntry: (
    measureId: string,
    staffId: string,
    entry: DraftMusicEntry
  ) => void;
}

export function StaffInput({
  staffId,
  measureId,
  isSelected,
  onSelectStaff,
  onAddEntry,
}: StaffInputProps) {
  const { watch } = useFormContext<CompositionFormValues>();
  const staff = watch(`stavesById.${staffId}`);
  const entriesById = watch('entriesById');
  const keySig = watch('keySig');
  const timeSig = watch('timeSig');
  const mode = watch('mode');

  const entries = staff.entryIds.map((eid) => entriesById[eid]);

  const usedBeats = entries.reduce(
    (sum, entry) => sum + durationToFactor[entry.duration],
    0
  );
  const remainingBeats = 1 - usedBeats;

  const staffClass = `cursor-pointer rounded transition-shadow ${
    isSelected ? 'rainbow-selected' : ''
  }`;

  const entryNodes = entries.map((entry, i) => {
    if (entry.type === 'note') {
      return (
        <music-note key={i} note={entry.value} duration={entry.duration} />
      );
    } else if (entry.type === 'chord') {
      return (
        <music-chord key={i} duration={entry.duration}>
          {entry.notes.map((n, j) => (
            <music-note key={j} note={n} />
          ))}
        </music-chord>
      );
    } else {
      return <music-rest key={i} duration={entry.duration} />;
    }
  });

  return (
    <>
      <music-staff
        clef={staff.type === 'treble' ? 'treble' : 'bass'}
        className={staffClass}
        keySig={keySig}
        mode={mode}
        time={timeSig}
        onClick={(e) => onSelectStaff(measureId, staffId, e)}
      >
        {entryNodes}
      </music-staff>
      {isSelected && (
        <AnchoredTabPanel
          tabs={[
            {
              label: 'Entry',
              content: (
                <EntryInput
                  onAdd={(entry) => onAddEntry(measureId, staffId, entry)}
                  remainingBeats={remainingBeats}
                />
              ),
            },
          ]}
        />
      )}
    </>
  );
}
