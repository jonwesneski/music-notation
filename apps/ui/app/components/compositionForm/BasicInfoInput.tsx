import { Select, TextInput } from '@/design-system';
import type { TimeSignature } from '@one-step-at-a-time/web-components';
import { useFormContext, useWatch } from 'react-hook-form';
import { useCompositionFormSession } from './CompositionFormSessionContext';
import {
  KEY_SIGNATURE_OPTIONS,
  MODE_OPTIONS,
  TIME_SIGNATURE_OPTIONS,
  type CompositionFormValues,
} from './types';

const labelClass = 'text-xs font-medium text-zinc-500 mb-0.5';

export function BasicInfoInput() {
  const { register, control } = useFormContext<CompositionFormValues>();
  const { requestMeterChange } = useCompositionFormSession();
  const timeSig = useWatch({ control, name: 'timeSig' });

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="flex flex-col min-w-48 flex-1">
        <label className={labelClass}>Song Title</label>
        <TextInput type="text" placeholder="Untitled" {...register('title')} />
      </div>

      <div className="flex flex-col">
        <label className={labelClass}>Key</label>
        <Select className="w-full" {...register('keySig')}>
          {KEY_SIGNATURE_OPTIONS.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col">
        <label className={labelClass}>Time</label>
        <Select
          className="w-full"
          value={timeSig}
          onChange={(e) =>
            requestMeterChange({
              scope: 'composition',
              timeSig: e.target.value as TimeSignature,
            })
          }
        >
          {TIME_SIGNATURE_OPTIONS.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col">
        <label className={labelClass}>Mode</label>
        <Select className="w-full" {...register('mode')}>
          {MODE_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
