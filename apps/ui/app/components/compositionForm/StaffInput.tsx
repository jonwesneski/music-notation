import '@one-step-at-a-time/web-components';
import type { TimeSignature } from '@one-step-at-a-time/web-components';
import { useFormContext } from 'react-hook-form';
import { AddChordInput } from './AddChordInput';
import { AddClefInput } from './AddClefInput';
import { AddNoteInput } from './AddNoteInput';
import { AddRestInput } from './AddRestInput';
import { AnchoredTabPanel } from './AnchoredTabPanel';
import { effectiveClefOfEntry } from './clefsHelpers';
import { useCompositionFormSession } from './CompositionFormSessionContext';
import { serializeGrace } from './graceHelpers';
import { remainingDuration } from './measureCapacityHelpers';
import { resolveTupletRuns } from './tupletsHelpers';
import type {
  CompositionFormValues,
  DraftMusicEntry,
  MusicEntry,
} from './types';
import {
  useCompositionStructure,
  useConnectorAttributes,
} from './useCompositionStructure';
import { useEntryDrag } from './useEntryDrag';

interface StaffInputProps {
  staffId: string;
  measureId: string;
  timeSignature: TimeSignature;
}

export function StaffInput({
  staffId,
  measureId,
  timeSignature,
}: StaffInputProps) {
  const { watch } = useFormContext<CompositionFormValues>();
  const staff = watch(`stavesById.${staffId}`);
  const entriesById = watch('entriesById');
  const keySig = watch('keySig');
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
  const structure = useCompositionStructure();
  const { onEntryPointerDown } = useEntryDrag();

  const isSelected = session.selection.staffIds.includes(staffId);

  const entries = staff.entryIds.map((eid) => entriesById[eid]);

  const remainingBeats = remainingDuration(
    entries,
    timeSignature,
    structure.tupletsById
  );
  const add = (entry: DraftMusicEntry) => addEntry(measureId, staffId, entry);

  const staffClass = `cursor-pointer rounded transition-shadow ${
    isSelected ? 'rainbow-selected' : ''
  }`;

  const renderEntry = (entry: MusicEntry) => {
    const isEntrySelected = session.selection.entryIds.includes(entry.id);
    const isDraggable = entry.type !== 'clef';
    const entryClass = `${isEntrySelected ? 'rainbow-selected' : ''} ${
      isDraggable ? 'cursor-grab' : ''
    }`.trim();
    const connector = connectorAttrs.get(entry.id);
    const handleEntryClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      selectEntry(measureId, staffId, entry.id, e);
    };
    const handleEntryPointerDown = (e: React.PointerEvent) => {
      onEntryPointerDown(e, {
        entry,
        staffId,
        clef: effectiveClefOfEntry(structure, entry.id),
        entryIds: staff.entryIds,
      });
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
        onPointerDown: handleEntryPointerDown,
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
    } else if (entry.type === 'clef') {
      return (
        <music-clef
          key={entry.id}
          ref={(el: HTMLElement | null) => registerEntryRef(entry.id, el)}
          clef={entry.clef}
          className={entryClass}
          onClick={handleEntryClick}
        />
      );
    } else {
      return (
        <music-rest
          key={entry.id}
          ref={(el: HTMLElement | null) => registerEntryRef(entry.id, el)}
          duration={entry.duration}
          className={entryClass}
          onClick={handleEntryClick}
          onPointerDown={handleEntryPointerDown}
        />
      );
    }
  };

  // A tuplet run renders as a <music-tuplet> wrapper (a direct child of
  // <music-staff>, as the library's slot walker requires); loose runs render
  // their entries inline.
  const runs = resolveTupletRuns(staff.entryIds, entriesById);
  const entryNodes = runs.map((run) => {
    const nodes = run.entries.map(renderEntry);
    if (run.tupletId === null) {
      return nodes;
    }
    const ratio = structure.tupletsById[run.tupletId]?.ratio;
    return (
      <music-tuplet key={run.tupletId} ratio={ratio}>
        {nodes}
      </music-tuplet>
    );
  });

  return (
    <>
      <music-staff
        ref={(el: HTMLElement | null) => registerStaffRef(staffId, el)}
        clef={staff.type === 'treble' ? 'treble' : 'bass'}
        group={staff.group ?? undefined}
        group-id={staff.groupId ?? undefined}
        className={staffClass}
        key-sig={keySig}
        mode={mode}
        time={timeSignature}
        onClick={(e) => selectStaff(measureId, staffId, e)}
      >
        {entryNodes}
      </music-staff>
      {isSelected && (
        <AnchoredTabPanel
          tabs={[
            {
              label: 'Note',
              content: (
                <AddNoteInput onAdd={add} remainingBeats={remainingBeats} />
              ),
            },
            {
              label: 'Chord',
              content: (
                <AddChordInput onAdd={add} remainingBeats={remainingBeats} />
              ),
            },
            {
              label: 'Rest',
              content: (
                <AddRestInput onAdd={add} remainingBeats={remainingBeats} />
              ),
            },
            {
              label: 'Clef Change',
              content: <AddClefInput onAdd={add} />,
            },
          ]}
        />
      )}
    </>
  );
}
