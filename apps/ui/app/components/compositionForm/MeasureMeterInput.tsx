import { Button, Select } from '@/design-system';
import type { TimeSignature } from '@one-step-at-a-time/web-components';
import { useCompositionFormSession } from './CompositionFormSessionContext';
import type { NormalizedMeasure } from './types';
import { TIME_SIGNATURE_OPTIONS } from './types';

interface MeasureMeterInputProps {
  measureId: string;
  measure: NormalizedMeasure;
  meter: TimeSignature;
  isFirstMeasure: boolean;
}

const labelClass = 'text-xs font-medium text-zinc-500';

// Meter control for a selected measure. Measure 1's meter is the composition
// meter, so editing it routes to the composition scope; any later measure can
// carry its own override or clear it to inherit from earlier.
export function MeasureMeterInput({
  measureId,
  measure,
  meter,
  isFirstMeasure,
}: MeasureMeterInputProps) {
  const { requestMeterChange } = useCompositionFormSession();

  const request = (timeSig: TimeSignature) => {
    if (isFirstMeasure) {
      requestMeterChange({ scope: 'composition', timeSig });
    } else {
      requestMeterChange({ scope: 'measure', measureId, timeSig });
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3">
      <label className="flex flex-col gap-0.5">
        <span className={labelClass}>Time signature from this measure</span>
        <Select
          value={meter}
          onChange={(e) => request(e.target.value as TimeSignature)}
        >
          {TIME_SIGNATURE_OPTIONS.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </Select>
      </label>

      {!isFirstMeasure && measure.time != null && (
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            requestMeterChange({ scope: 'measure', measureId, timeSig: null })
          }
        >
          Same as previous measure
        </Button>
      )}
    </div>
  );
}
