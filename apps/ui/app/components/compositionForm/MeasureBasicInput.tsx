import type { TimeSignature } from '@one-step-at-a-time/web-components';
import { AddStaffInput } from './AddStaffInput';
import { fieldLabelClass } from './formLabelHelpers';
import { MeasureTimeInput } from './MeasureTimeInput';
import type { NormalizedMeasure } from './types';

interface MeasureBasicInputProps {
  measureId: string;
  measure: NormalizedMeasure;
  timeSignature: TimeSignature;
  isFirstMeasure: boolean;
}

export function MeasureBasicInput({
  measureId,
  measure,
  timeSignature,
  isFirstMeasure,
}: MeasureBasicInputProps) {
  return (
    <div className="flex items-start gap-4 p-3">
      <MeasureTimeInput
        measureId={measureId}
        measure={measure}
        timeSignature={timeSignature}
        isFirstMeasure={isFirstMeasure}
      />
      <label className="flex flex-col gap-0.5">
        <span className={fieldLabelClass}>Add staff</span>
        <AddStaffInput measureId={measureId} />
      </label>
    </div>
  );
}
