import { findGroupMembers } from './staffGroups';
import type { CompositionStructure, Selection } from './types';

export function removeSelectionFromStructure(
  structure: CompositionStructure,
  selection: Selection
): CompositionStructure {
  const selectedMeasureIds = new Set(selection.measureIds);

  const staffIdsToDelete = new Set(selection.staffIds);
  for (const measureId of selectedMeasureIds) {
    for (const staffId of structure.measuresById[measureId]?.staffIds ?? []) {
      staffIdsToDelete.add(staffId);
    }
  }

  const entryIdsToDelete = new Set(selection.entryIds);
  for (const staffId of staffIdsToDelete) {
    for (const entryId of structure.stavesById[staffId]?.entryIds ?? []) {
      entryIdsToDelete.add(entryId);
    }
  }

  let measureOrder = structure.measureOrder.filter(
    (id) => !selectedMeasureIds.has(id)
  );
  let measuresById = Object.fromEntries(
    Object.entries(structure.measuresById)
      .filter(([id]) => !selectedMeasureIds.has(id))
      .map(([id, measure]) => [
        id,
        {
          ...measure,
          staffIds: measure.staffIds.filter(
            (sid) => !staffIdsToDelete.has(sid)
          ),
        },
      ])
  );

  // The composition must always have at least one measure so the
  // "add a staff" placeholder has somewhere to attach.
  if (measureOrder.length === 0) {
    const newId = crypto.randomUUID();
    measureOrder = [newId];
    measuresById = { [newId]: { id: newId, staffIds: [] } };
  }
  const stavesById = Object.fromEntries(
    Object.entries(structure.stavesById)
      .filter(([id]) => !staffIdsToDelete.has(id))
      .map(([id, staff]) => [
        id,
        {
          ...staff,
          entryIds: staff.entryIds.filter((eid) => !entryIdsToDelete.has(eid)),
        },
      ])
  );
  const entriesById = Object.fromEntries(
    Object.entries(structure.entriesById).filter(
      ([id]) => !entryIdsToDelete.has(id)
    )
  );

  // Drop any tie/slur/hairpin whose start or end entry is gone.
  const connectorsById = Object.fromEntries(
    Object.entries(structure.connectorsById).filter(
      ([, connector]) =>
        !entryIdsToDelete.has(connector.startEntryId) &&
        !entryIdsToDelete.has(connector.endEntryId)
    )
  );
  const connectorOrder = structure.connectorOrder.filter(
    (id) => connectorsById[id]
  );

  // A deleted staff can orphan its former brace/bracket partner (e.g. one side
  // of a 2-staff brace). Clear group/groupId on any staff that no longer has a
  // grouped partner so invalid group state never persists.
  const cleanedStavesById = { ...stavesById };
  for (const measure of Object.values(measuresById)) {
    measure.staffIds.forEach((id) => {
      const staff = cleanedStavesById[id];
      if (!staff.group && !staff.groupId) return;
      const members = findGroupMembers(measure.staffIds, cleanedStavesById, id);
      if (members.length < 2) {
        cleanedStavesById[id] = { ...staff, group: null, groupId: null };
      }
    });
  }

  return {
    measureOrder,
    measuresById,
    stavesById: cleanedStavesById,
    entriesById,
    connectorsById,
    connectorOrder,
  };
}
