import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { ConnectorEntryAttributes } from './connectors';
import { resolveConnectorAttributes } from './connectors';
import type { CompositionFormValues, CompositionStructure } from './types';

// Assembles the normalized structural slice from the form store, reactively.
export function useCompositionStructure(): CompositionStructure {
  const { control } = useFormContext<CompositionFormValues>();
  const measureOrder = useWatch({ control, name: 'measureOrder' });
  const measuresById = useWatch({ control, name: 'measuresById' });
  const stavesById = useWatch({ control, name: 'stavesById' });
  const entriesById = useWatch({ control, name: 'entriesById' });
  const connectorsById = useWatch({ control, name: 'connectorsById' });
  const connectorOrder = useWatch({ control, name: 'connectorOrder' });
  const tupletsById = useWatch({ control, name: 'tupletsById' });

  return useMemo(
    () => ({
      measureOrder,
      measuresById,
      stavesById,
      entriesById,
      connectorsById,
      connectorOrder,
      tupletsById,
    }),
    [
      measureOrder,
      measuresById,
      stavesById,
      entriesById,
      connectorsById,
      connectorOrder,
      tupletsById,
    ]
  );
}

// Per-entry tie/slur/id/for attributes, keyed by entry id.
export function useConnectorAttributes(): Map<
  string,
  ConnectorEntryAttributes
> {
  const structure = useCompositionStructure();
  return useMemo(() => resolveConnectorAttributes(structure), [structure]);
}
