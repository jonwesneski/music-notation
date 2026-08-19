import '@one-step-at-a-time/web-components';
import { useFormContext } from 'react-hook-form';
import { useCompositionFormSession } from './CompositionFormSessionContext';
import { StaffInput } from './StaffInput';
import type { CompositionFormValues, StaffType } from './types';

interface MeasureInputProps {
  measureId: string;
}

export function MeasureInput({ measureId }: MeasureInputProps) {
  const { watch } = useFormContext<CompositionFormValues>();
  const measure = watch(`measuresById.${measureId}`);
  const { session, selectMeasure, registerMeasureRef, addStaff } =
    useCompositionFormSession();

  const isMeasureSelected = session.selection.measureIds.includes(measureId);
  const containsSelectedStaff = measure.staffIds.some((id) =>
    session.selection.staffIds.includes(id)
  );

  return (
    <music-measure
      ref={(el: HTMLElement | null) => registerMeasureRef(measureId, el)}
      className={`cursor-pointer rounded transition-shadow ${
        isMeasureSelected ? 'rainbow-selected' : ''
      } ${isMeasureSelected || containsSelectedStaff ? 'pb-10' : ''}`}
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
      {isMeasureSelected && (
        <select
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 text-sm border border-zinc-300 rounded bg-white px-2 py-1 cursor-pointer shadow-sm"
          value=""
          onChange={(e) => {
            const value = e.target.value as StaffType;
            if (value) addStaff(measureId, value);
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <option value="" disabled>
            Add staff...
          </option>
          <option value="treble">Treble</option>
          <option value="bass">Bass</option>
        </select>
      )}
    </music-measure>
  );
}
