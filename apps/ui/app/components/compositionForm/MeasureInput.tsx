import '@one-step-at-a-time/web-components';
import { useFormContext } from 'react-hook-form';
import { AddStaffInput } from './AddStaffInput';
import { AnchoredTabPanel } from './AnchoredTabPanel';
import { useCompositionFormSession } from './CompositionFormSessionContext';
import { isConnectableSelection } from './connectors';
import { ConnectorInput } from './ConnectorInput';
import { EntryEditInput } from './EntryEditInput';
import { StaffGroupInput } from './StaffGroupInput';
import { StaffInput } from './StaffInput';
import type { CompositionFormValues } from './types';
import { isSingleEntrySelection } from './types';
import { useCompositionStructure } from './useCompositionStructure';

interface MeasureInputProps {
  measureId: string;
}

export function MeasureInput({ measureId }: MeasureInputProps) {
  const { watch } = useFormContext<CompositionFormValues>();
  const measure = watch(`measuresById.${measureId}`);
  const { session, selectMeasure, registerMeasureRef, setConnector } =
    useCompositionFormSession();
  const structure = useCompositionStructure();

  const isMeasureSelected = session.selection.measureIds.includes(measureId);
  const containsSelectedStaff = measure.staffIds.some((id) =>
    session.selection.staffIds.includes(id)
  );

  const selectedStaffIdsInMeasure = measure.staffIds.filter((id) =>
    session.selection.staffIds.includes(id)
  );
  const isGroupableSelection =
    selectedStaffIdsInMeasure.length === session.selection.staffIds.length &&
    selectedStaffIdsInMeasure.length >= 2;

  // A tie/slur editor is shown by the measure that holds the selection's start
  // endpoint, so a cross-barline selection gets exactly one panel.
  const selectionEndpoints = isConnectableSelection(
    session.selection,
    structure
  );
  const connectorEndpoints =
    selectionEndpoints &&
    measure.staffIds.some((sid) =>
      structure.stavesById[sid]?.entryIds.includes(
        selectionEndpoints.startEntryId
      )
    )
      ? selectionEndpoints
      : null;

  // The edit panel shows for a lone selected entry, mounted by the measure that
  // actually contains it (mirrors how the connector panel binds to its start).
  const selectedEntryId = isSingleEntrySelection(session.selection)
    ? session.selection.entryIds[0]
    : null;
  const editableEntry =
    selectedEntryId &&
    measure.staffIds.some((sid) =>
      structure.stavesById[sid]?.entryIds.includes(selectedEntryId)
    )
      ? structure.entriesById[selectedEntryId]
      : null;

  const tabs = [];
  if (isMeasureSelected) {
    tabs.push({
      label: 'Add Staff',
      content: <AddStaffInput measureId={measureId} />,
    });
  }
  if (isGroupableSelection) {
    tabs.push({
      label: 'Group Staves',
      content: (
        <StaffGroupInput
          measureId={measureId}
          staffIds={selectedStaffIdsInMeasure}
        />
      ),
    });
  }
  if (connectorEndpoints) {
    tabs.push({
      label: 'Connections',
      content: (
        <ConnectorInput
          endpoints={connectorEndpoints}
          selectionEntryCount={session.selection.entryIds.length}
          structure={structure}
          onSetConnector={setConnector}
        />
      ),
    });
  }
  if (editableEntry) {
    tabs.push({
      label: 'Edit',
      content: <EntryEditInput entry={editableEntry} />,
    });
  }

  return (
    <music-measure
      ref={(el: HTMLElement | null) => registerMeasureRef(measureId, el)}
      className={`cursor-pointer rounded transition-shadow ${
        isMeasureSelected ? 'rainbow-selected' : ''
      } ${
        isMeasureSelected ||
        containsSelectedStaff ||
        connectorEndpoints ||
        editableEntry
          ? 'pb-10'
          : ''
      }`}
      onClick={() => selectMeasure(measureId)}
    >
      {measure.staffIds.length === 0 && (
        <div className="text-zinc-400 text-sm px-3 py-4 select-none">
          Tap or click here and use the dropdown to add a staff
        </div>
      )}
      {measure.staffIds.map((staffId) => (
        <StaffInput key={staffId} staffId={staffId} measureId={measureId} />
      ))}
      {tabs.length > 0 && <AnchoredTabPanel tabs={tabs} />}
    </music-measure>
  );
}
