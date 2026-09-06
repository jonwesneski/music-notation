import type { NormalizedStaff } from './types';

// Returns the full set of staff ids currently grouped with `staffId` (including
// itself), or just `[staffId]` if it isn't part of a valid group. Mirrors the
// same pairing rules as packages/web-components' StaffElementBase#group
// (grand = implicit pair with next sibling; bracket = shared groupId), but
// only needs to interpret well-formed data since this app is the sole writer
// of these attributes.
export function findGroupMembers(
  measureStaffIds: string[],
  stavesById: Record<string, NormalizedStaff>,
  staffId: string
): string[] {
  const staff = stavesById[staffId];

  if (staff.groupId) {
    return measureStaffIds.filter(
      (id) => stavesById[id].groupId === staff.groupId
    );
  }

  const index = measureStaffIds.indexOf(staffId);

  if (staff.group === 'grand') {
    const next = measureStaffIds[index + 1];
    const nextIsFree =
      next && !stavesById[next].group && !stavesById[next].groupId;
    return nextIsFree ? [staffId, next] : [staffId];
  }

  // Not this staff's own group — check whether it's the implicit second half
  // of the previous staff's "grand" pair.
  const prev = measureStaffIds[index - 1];
  if (prev && stavesById[prev].group === 'grand') {
    return [prev, staffId];
  }

  return [staffId];
}
