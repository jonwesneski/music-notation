import '@one-step-at-a-time/web-components';
import { useFormContext } from 'react-hook-form';
import { AnchoredTabPanel } from './AnchoredTabPanel';
import { useCompositionFormSession } from './CompositionFormSessionContext';
import { EntryInput } from './EntryInput';
import { serializeGrace } from './grace';
import { remainingDuration } from './measureCapacity';
import type { CompositionFormValues } from './types';
import { useConnectorAttributes } from './useCompositionStructure';

interface StaffInputProps {
  staffId: string;
  measureId: string;
}

export function StaffInput({ staffId, measureId }: StaffInputProps) {
  const { watch } = useFormContext<CompositionFormValues>();
  const staff = watch(`stavesById.${staffId}`);
  const entriesById = watch('entriesById');
  const keySig = watch('keySig');
  const timeSig = watch('timeSig');
  const mode = watch('mode');
  const {
    session,
    selectStaff,
    selectEntry,
    registerStaffRef,
    registerEntryRef,
    addEntry,
  } = useCompositionFormSession();
  const connectorAttrs = useConnectorAttributes();

  const isSelected = session.selection.staffIds.includes(staffId);

  const entries = staff.entryIds.map((eid) => entriesById[eid]);

  const remainingBeats = remainingDuration(entries, timeSig);

  const staffClass = `cursor-pointer rounded transition-shadow ${
    isSelected ? 'rainbow-selected' : ''
  }`;

  const entryNodes = entries.map((entry) => {
    const isEntrySelected = session.selection.entryIds.includes(entry.id);
    const entryClass = isEntrySelected ? 'rainbow-selected' : '';
    const connector = connectorAttrs.get(entry.id);
    const handleEntryClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      selectEntry(measureId, staffId, entry.id, e);
    };

    if (entry.type === 'note' || entry.type === 'chord') {
      const marks = {
        tie: connector?.tie,
        slur: connector?.slur,
        crescendo: connector?.crescendo,
        decrescendo: connector?.decrescendo,
        id: connector?.id,
        for: connector?.for,
        dynamic: entry.dynamic ?? undefined,
        articulation: entry.articulation ?? undefined,
        stress: entry.stress ?? undefined,
        ...serializeGrace(entry.grace),
        className: entryClass,
        onClick: handleEntryClick,
      };
      const setRef = (el: HTMLElement | null) => registerEntryRef(entry.id, el);

      if (entry.type === 'note') {
        return (
          <music-note
            key={entry.id}
            ref={setRef}
            note={entry.value}
            octave={entry.octave ?? undefined}
            duration={entry.duration}
            {...marks}
          />
        );
      }
      return (
        <music-chord
          key={entry.id}
          ref={setRef}
          duration={entry.duration}
          {...marks}
        >
          {entry.notes.map((n, j) => (
            <music-note key={j} note={n.value} octave={n.octave ?? undefined} />
          ))}
        </music-chord>
      );
    } else {
      return (
        <music-rest
          key={entry.id}
          ref={(el: HTMLElement | null) => registerEntryRef(entry.id, el)}
          duration={entry.duration}
          className={entryClass}
          onClick={handleEntryClick}
        />
      );
    }
  });

  return (
    <>
      <music-staff
        ref={(el: HTMLElement | null) => registerStaffRef(staffId, el)}
        clef={staff.type === 'treble' ? 'treble' : 'bass'}
        group={staff.group ?? undefined}
        group-id={staff.groupId ?? undefined}
        className={staffClass}
        keySig={keySig}
        mode={mode}
        time={timeSig}
        onClick={(e) => selectStaff(measureId, staffId, e)}
      >
        {entryNodes}
      </music-staff>
      {isSelected && (
        <AnchoredTabPanel
          tabs={[
            {
              label: 'Staff Entries',
              content: (
                <EntryInput
                  onAdd={(entry) => addEntry(measureId, staffId, entry)}
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
