import type { DurationType } from '@one-step-at-a-time/web-components';
import {
  DURATIONS,
  durationToFactor,
} from '@one-step-at-a-time/web-components';
import { CAPACITY_EPSILON } from './measureCapacityHelpers';

// The model has no augmentation dots, so a duration that isn't a single power of
// two (e.g. a dotted-eighth 0.1875, or the 0.3125 a barline can leave) is written
// as a tie chain of plain durations. Greedy largest-first over `DURATIONS`
// (descending) — every time signature here has a power-of-two beat type, so a
// factor that is a multiple of a 128th always resolves exactly.
export function decomposeToDurations(factor: number): DurationType[] {
  const out: DurationType[] = [];
  let remaining = factor;
  for (const duration of DURATIONS) {
    const size = durationToFactor[duration];
    while (remaining + CAPACITY_EPSILON >= size) {
      out.push(duration);
      remaining -= size;
    }
    if (remaining <= CAPACITY_EPSILON) {
      break;
    }
  }
  return out;
}
