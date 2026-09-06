import { Button, Select } from '@/design-system';
import type { TupletRatio } from '@one-step-at-a-time/web-components';
import { TUPLET_RATIOS } from '@one-step-at-a-time/web-components';
import { useCompositionFormSession } from './CompositionFormSessionContext';
import { tupletCandidate, tupletOfEntries } from './tupletsHelpers';
import type { CompositionStructure } from './types';

const RATIO_LABEL: Partial<Record<TupletRatio, string>> = {
  '2': '2 (duplet)',
  '3': '3 (triplet)',
  '5': '5 (quintuplet)',
  '6': '6 (sextuplet)',
  '7': '7 (septuplet)',
};

interface TupletInputProps {
  structure: CompositionStructure;
}

export function TupletInput({ structure }: TupletInputProps) {
  const { session, setTuplet } = useCompositionFormSession();
  const candidate = tupletCandidate(session.selection, structure);

  if (!candidate) {
    return (
      <div className="p-3 text-sm text-zinc-400">
        Select two or more adjacent notes in one staff to make a tuplet.
      </div>
    );
  }

  const current = tupletOfEntries(structure, candidate.entryIds);
  const value = current?.ratio ?? '';

  return (
    <div
      className="flex flex-col gap-2 p-3"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="text-sm text-zinc-500">
        {candidate.entryIds.length} entries
      </div>
      <label className="flex flex-col gap-0.5">
        <span className="text-xs font-medium text-zinc-500">Ratio</span>
        <Select
          value={value}
          onChange={(e) =>
            setTuplet(
              candidate.entryIds,
              e.target.value ? (e.target.value as TupletRatio) : null
            )
          }
        >
          <option value="">none</option>
          {TUPLET_RATIOS.map((r) => (
            <option key={r} value={r}>
              {RATIO_LABEL[r] ?? r}
            </option>
          ))}
        </Select>
      </label>
      {current && (
        <Button
          type="button"
          variant="secondary"
          onClick={() => setTuplet(candidate.entryIds, null)}
        >
          Remove tuplet
        </Button>
      )}
    </div>
  );
}
