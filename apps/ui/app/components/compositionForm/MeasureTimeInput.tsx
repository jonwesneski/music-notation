import { Button, Select } from '@/design-system';
import type { TimeSignature } from '@one-step-at-a-time/web-components';
import { useCompositionFormSession } from './CompositionFormSessionContext';
import { fieldLabelClass } from './formLabelHelpers';
import type { NormalizedMeasure } from './types';
import { TIME_SIGNATURE_OPTIONS } from './types';

interface MeasureTimeInputProps {
  measureId: string;
  measure: NormalizedMeasure;
  timeSignature: TimeSignature;
  isFirstMeasure: boolean;
}

// Time signature control for a selected measure. Measure 1's time signature is
// the composition time signature, so editing it routes to the composition scope;
// any later measure can carry its own override or clear it to inherit from
// earlier.
export function MeasureTimeInput({
  measureId,
  measure,
  timeSignature,
  isFirstMeasure,
}: MeasureTimeInputProps) {
  const { requestTimeSignatureChange } = useCompositionFormSession();

  const request = (timeSig: TimeSignature) => {
    if (isFirstMeasure) {
      requestTimeSignatureChange({ scope: 'composition', timeSig });
    } else {
      requestTimeSignatureChange({ scope: 'measure', measureId, timeSig });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-0.5">
        <span className={fieldLabelClass}>
          Time signature from this measure
        </span>
        <Select
          value={timeSignature}
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
            requestTimeSignatureChange({
              scope: 'measure',
              measureId,
              timeSig: null,
            })
          }
        >
          Same as previous measure
        </Button>
      )}
    </div>
  );
}
