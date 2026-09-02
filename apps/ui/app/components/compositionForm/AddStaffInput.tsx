import { Select } from '@/design-system';
import { useCompositionFormSession } from './CompositionFormSessionContext';
import type { StaffType } from './types';

interface AddStaffInputProps {
  measureId: string;
}

export function AddStaffInput({ measureId }: AddStaffInputProps) {
  const { addStaff } = useCompositionFormSession();

  return (
    <Select
      value=""
      onChange={(e) => {
        const value = e.target.value as StaffType;
        if (value) addStaff(measureId, value);
      }}
    >
      <option value="" disabled>
        Add staff...
      </option>
      <option value="treble">Treble</option>
      <option value="bass">Bass</option>
    </Select>
  );
}
