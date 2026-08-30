import '@one-step-at-a-time/web-components';
import type { StaffGroupType } from '@one-step-at-a-time/web-components';
import { useCallback, useEffect } from 'react';
import {
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { Button } from '@/design-system';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { BasicInfoInput } from './BasicInfoInput';
import {
  CompositionFormSessionProvider,
  useCompositionFormSession,
} from './CompositionFormSessionContext';
import {
  connectorBetween,
  removeConnector,
  upsertConnector,
} from './connectors';
import { DragSelectOverlay } from './DragSelectOverlay';
import { MeasureInput } from './MeasureInput';
import { findGroupMembers } from './staffGroups';
import type {
  CompositionFormValues,
  CompositionStructure,
  ConnectorKind,
  DraftMusicEntry,
  StaffType,
} from './types';
import { isSelectionEmpty } from './types';

const firstMeasureId = crypto.randomUUID();

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable)
  );
}

function CompositionFormBody({
  undo,
  redo,
  canUndo,
  canRedo,
}: {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}) {
  const { control } = useFormContext<CompositionFormValues>();
  const keySig = useWatch({ control, name: 'keySig' });
  const timeSig = useWatch({ control, name: 'timeSig' });
  const mode = useWatch({ control, name: 'mode' });
  const measureOrder = useWatch({ control, name: 'measureOrder' });
  const measuresById = useWatch({ control, name: 'measuresById' });
  const lastMeasureStaffCount =
    measuresById[measureOrder[measureOrder.length - 1]]?.staffIds.length ?? 0;

  const { session, deleteSelected, addMeasure } = useCompositionFormSession();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (mod && !e.shiftKey && key === 'z') {
        e.preventDefault();
        undo();
        return;
      }
      if (mod && ((e.shiftKey && key === 'z') || key === 'y')) {
        e.preventDefault();
        redo();
        return;
      }
      if (
        (e.key === 'Backspace' || e.key === 'Delete') &&
        !isEditableTarget(e.target) &&
        !isSelectionEmpty(session.selection)
      ) {
        e.preventDefault();
        deleteSelected();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo, deleteSelected, session.selection]);

  return (
    <div className="flex flex-col gap-4">
      <div className="p-3 bg-white rounded border border-zinc-200 shadow-sm">
        <BasicInfoInput />
      </div>

      <div className="flex gap-2">
        <Button onClick={undo} disabled={!canUndo}>
          Undo
        </Button>
        <Button onClick={redo} disabled={!canRedo}>
          Redo
        </Button>
        <Button
          onClick={deleteSelected}
          disabled={isSelectionEmpty(session.selection)}
        >
          Delete Selected
        </Button>
      </div>

      <DragSelectOverlay>
        <music-composition keySig={keySig} mode={mode} time={timeSig}>
          {measureOrder.map((measureId) => (
            <MeasureInput key={measureId} measureId={measureId} />
          ))}
          <Button
            className="place-self-center ml-2"
            disabled={measureOrder.length > 0 && lastMeasureStaffCount === 0}
            onClick={addMeasure}
          >
            Add Measure
          </Button>
        </music-composition>
      </DragSelectOverlay>
    </div>
  );
}

export function CompositionInput() {
  const methods = useForm<CompositionFormValues>({
    defaultValues: {
      title: '',
      keySig: 'C',
      timeSig: '4/4',
      mode: 'major',
      measureOrder: [firstMeasureId],
      measuresById: { [firstMeasureId]: { id: firstMeasureId, staffIds: [] } },
      stavesById: {},
      entriesById: {},
      connectorsById: {},
      connectorOrder: [],
    },
  });

  const getStructure = useCallback(
    (): CompositionStructure => ({
      measureOrder: methods.getValues('measureOrder'),
      measuresById: methods.getValues('measuresById'),
      stavesById: methods.getValues('stavesById'),
      entriesById: methods.getValues('entriesById'),
      connectorsById: methods.getValues('connectorsById'),
      connectorOrder: methods.getValues('connectorOrder'),
    }),
    [methods]
  );

  const setStructure = useCallback(
    (s: CompositionStructure) => {
      methods.setValue('measureOrder', s.measureOrder);
      methods.setValue('measuresById', s.measuresById);
      methods.setValue('stavesById', s.stavesById);
      methods.setValue('entriesById', s.entriesById);
      methods.setValue('connectorsById', s.connectorsById);
      methods.setValue('connectorOrder', s.connectorOrder);
    },
    [methods]
  );

  const { record, undo, redo, canUndo, canRedo } = useUndoRedo(
    getStructure,
    setStructure
  );

  function addMeasure() {
    const s = getStructure();
    const newId = crypto.randomUUID();
    const lastMeasure =
      s.measuresById[s.measureOrder[s.measureOrder.length - 1]];
    if (!lastMeasure) {
      record({
        ...s,
        measureOrder: [...s.measureOrder, newId],
        measuresById: {
          ...s.measuresById,
          [newId]: { id: newId, staffIds: [] },
        },
      });
      return;
    }
    // Copying the staff structure from the last measure
    const newStaffEntries = lastMeasure.staffIds.map((sid) => {
      const newSid = crypto.randomUUID();
      return {
        newSid,
        staff: { ...s.stavesById[sid], id: newSid, entryIds: [] },
      };
    });
    record({
      ...s,
      measureOrder: [...s.measureOrder, newId],
      measuresById: {
        ...s.measuresById,
        [newId]: { id: newId, staffIds: newStaffEntries.map((x) => x.newSid) },
      },
      stavesById: {
        ...s.stavesById,
        ...Object.fromEntries(newStaffEntries.map((x) => [x.newSid, x.staff])),
      },
    });
  }

  function addStaff(measureId: string, staffType: StaffType) {
    const s = getStructure();
    const newSid = crypto.randomUUID();
    record({
      ...s,
      measuresById: {
        ...s.measuresById,
        [measureId]: {
          ...s.measuresById[measureId],
          staffIds: [...s.measuresById[measureId].staffIds, newSid],
        },
      },
      stavesById: {
        ...s.stavesById,
        [newSid]: {
          id: newSid,
          type: staffType,
          entryIds: [],
          group: null,
          groupId: null,
        },
      },
    });
  }

  function setStaffGroup(
    measureId: string,
    staffIds: string[],
    groupType: StaffGroupType | null
  ) {
    const s = getStructure();
    const measure = s.measuresById[measureId];

    // Clear group/groupId for any staff currently grouped with one of the
    // target staves, so reassigning a subset doesn't leave a stale partial
    // group behind.
    const idsToClear = new Set<string>();
    staffIds.forEach((id) => {
      findGroupMembers(measure.staffIds, s.stavesById, id).forEach((memberId) =>
        idsToClear.add(memberId)
      );
      idsToClear.add(id);
    });

    const stavesById = { ...s.stavesById };
    idsToClear.forEach((id) => {
      stavesById[id] = { ...stavesById[id], group: null, groupId: null };
    });

    if (groupType === 'grand') {
      // Implicit pairing: only the first (lowest-index) staff carries group="grand".
      const firstId = staffIds[0];
      stavesById[firstId] = {
        ...stavesById[firstId],
        group: 'grand',
        groupId: null,
      };
    } else if (groupType === 'bracket') {
      const newGroupId = crypto.randomUUID();
      staffIds.forEach((id) => {
        stavesById[id] = {
          ...stavesById[id],
          group: 'bracket',
          groupId: newGroupId,
        };
      });
    }

    record({ ...s, stavesById });
  }

  function addEntry(
    measureId: string,
    staffId: string,
    entry: DraftMusicEntry
  ) {
    const s = getStructure();
    const newEid = crypto.randomUUID();
    record({
      ...s,
      stavesById: {
        ...s.stavesById,
        [staffId]: {
          ...s.stavesById[staffId],
          entryIds: [...s.stavesById[staffId].entryIds, newEid],
        },
      },
      entriesById: {
        ...s.entriesById,
        [newEid]: { ...entry, id: newEid },
      },
    });
  }

  function setConnector(
    startEntryId: string,
    endEntryId: string,
    kind: ConnectorKind | null
  ) {
    const s = getStructure();
    if (kind === null) {
      const existing = connectorBetween(s, startEntryId, endEntryId);
      if (!existing) {
        return;
      }
      record(removeConnector(s, existing.id));
      return;
    }
    record(upsertConnector(s, startEntryId, endEntryId, kind));
  }

  return (
    <CompositionFormSessionProvider
      getStructure={getStructure}
      recordStructure={record}
      onAddMeasure={addMeasure}
      onAddStaff={addStaff}
      onSetStaffGroup={setStaffGroup}
      onAddEntry={addEntry}
      onSetConnector={setConnector}
    >
      <FormProvider {...methods}>
        <CompositionFormBody
          undo={undo}
          redo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      </FormProvider>
    </CompositionFormSessionProvider>
  );
}
