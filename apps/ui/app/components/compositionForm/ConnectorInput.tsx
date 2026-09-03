import { Radio } from '@/design-system';
import type { ConnectorEndpoints } from './connectors';
import { canTie, connectorBetween } from './connectors';
import type { CompositionStructure, ConnectorKind, MusicEntry } from './types';

type ConnectorChoice = 'none' | ConnectorKind;

interface ConnectorInputProps {
  endpoints: ConnectorEndpoints;
  selectionEntryCount: number;
  structure: CompositionStructure;
  onSetConnector: (
    startEntryId: string,
    endEntryId: string,
    kind: ConnectorKind | null
  ) => void;
}

function entryLabel(entry: MusicEntry | undefined): string {
  if (!entry) {
    return '?';
  }
  if (entry.type === 'note') {
    return entry.value;
  }
  if (entry.type === 'chord') {
    return entry.notes.map((n) => n.value).join('/');
  }
  return 'rest';
}

export function ConnectorInput({
  endpoints,
  selectionEntryCount,
  structure,
  onSetConnector,
}: ConnectorInputProps) {
  const current = connectorBetween(
    structure,
    endpoints.startEntryId,
    endpoints.endEntryId
  );
  const currentChoice: ConnectorChoice = current?.kind ?? 'none';

  const startEntry = structure.entriesById[endpoints.startEntryId];
  const endEntry = structure.entriesById[endpoints.endEntryId];

  const tieAllowed = selectionEntryCount === 2 && canTie(structure, endpoints);

  let tieReason: string | null = null;
  if (!tieAllowed && currentChoice !== 'tie') {
    if (selectionEntryCount !== 2) {
      tieReason = 'Select exactly two notes to tie.';
    } else if (startEntry?.type !== endEntry?.type) {
      tieReason = 'A tie needs two notes or two chords.';
    } else {
      tieReason = 'A tie needs the same pitch on adjacent notes.';
    }
  }

  function applyChoice(choice: ConnectorChoice) {
    onSetConnector(
      endpoints.startEntryId,
      endpoints.endEntryId,
      choice === 'none' ? null : choice
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="text-sm text-zinc-500">
        Connect {entryLabel(startEntry)} → {entryLabel(endEntry)}
      </div>
      <div className="flex flex-col gap-1.5">
        <Radio
          name="connector"
          label="None"
          checked={currentChoice === 'none'}
          onChange={() => applyChoice('none')}
        />
        <Radio
          name="connector"
          label="Tie"
          checked={currentChoice === 'tie'}
          disabled={!tieAllowed && currentChoice !== 'tie'}
          onChange={() => applyChoice('tie')}
        />
        <Radio
          name="connector"
          label="Slur"
          checked={currentChoice === 'slur'}
          onChange={() => applyChoice('slur')}
        />
      </div>
      {tieReason && <div className="text-sm text-zinc-400">{tieReason}</div>}
    </div>
  );
}
