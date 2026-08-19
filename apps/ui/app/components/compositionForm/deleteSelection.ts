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

  const measureOrder = structure.measureOrder.filter(
    (id) => !selectedMeasureIds.has(id)
  );
  const measuresById = Object.fromEntries(
    Object.entries(structure.measuresById)
      .filter(([id]) => !selectedMeasureIds.has(id))
      .map(([id, measure]) => [
        id,
        {
          ...measure,
          staffIds: measure.staffIds.filter((sid) => !staffIdsToDelete.has(sid)),
        },
      ])
  );
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

  return { measureOrder, measuresById, stavesById, entriesById };
}
