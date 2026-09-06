import { Radio } from '@/design-system';
import type { ConnectorEndpoints } from './connectorsHelpers';
import { canTie, connectorBetween } from './connectorsHelpers';
import type { CompositionStructure, ConnectorKind, MusicEntry } from './types';

const TIE_SLUR: ConnectorKind[] = ['tie', 'slur'];
const HAIRPINS: ConnectorKind[] = ['crescendo', 'decrescendo'];

type TieSlurChoice = 'none' | 'tie' | 'slur';
type HairpinChoice = 'none' | 'crescendo' | 'decrescendo' | 'diminuendo';

interface ConnectorInputProps {
  endpoints: ConnectorEndpoints;
  selectionEntryCount: number;
  structure: CompositionStructure;
  onSetConnector: (
    startEntryId: string,
    endEntryId: string,
    kind: ConnectorKind | null,
    family: ConnectorKind[]
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
  return entry.type;
}

export function ConnectorInput({
  endpoints,
  selectionEntryCount,
  structure,
  onSetConnector,
}: ConnectorInputProps) {
  const { startEntryId, endEntryId } = endpoints;
  const tieSlur = connectorBetween(
    structure,
    startEntryId,
    endEntryId,
    TIE_SLUR
  );
  const hairpin = connectorBetween(
    structure,
    startEntryId,
    endEntryId,
    HAIRPINS
  );

  const tieSlurChoice: TieSlurChoice =
    (tieSlur?.kind as TieSlurChoice) ?? 'none';
  const hairpinChoice: HairpinChoice =
    (hairpin?.kind as HairpinChoice) ?? 'none';

  const startEntry = structure.entriesById[startEntryId];
  const endEntry = structure.entriesById[endEntryId];

  const tieAllowed = selectionEntryCount === 2 && canTie(structure, endpoints);

  let tieReason: string | null = null;
  if (!tieAllowed && tieSlurChoice !== 'tie') {
    if (selectionEntryCount !== 2) {
      tieReason = 'Select exactly two notes to tie.';
    } else if (startEntry?.type !== endEntry?.type) {
      tieReason = 'A tie needs two notes or two chords.';
    } else {
      tieReason = 'A tie needs the same pitch on adjacent notes.';
    }
  }

  const setTieSlur = (choice: TieSlurChoice) => {
    onSetConnector(
      startEntryId,
      endEntryId,
      choice === 'none' ? null : choice,
      TIE_SLUR
    );
  };
  const setHairpin = (choice: HairpinChoice) => {
    onSetConnector(
      startEntryId,
      endEntryId,
      choice === 'none'
        ? null
        : choice === 'diminuendo'
        ? 'decrescendo'
        : choice,
      HAIRPINS
    );
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="text-sm text-zinc-500">
        Connect {entryLabel(startEntry)} → {entryLabel(endEntry)}
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-xs font-medium text-zinc-500 mb-1">
          Tie / Slur
        </legend>
        <Radio
          name="tie-slur"
          label="None"
          checked={tieSlurChoice === 'none'}
          onChange={() => setTieSlur('none')}
        />
        <Radio
          name="tie-slur"
          label="Tie"
          checked={tieSlurChoice === 'tie'}
          disabled={!tieAllowed && tieSlurChoice !== 'tie'}
          onChange={() => setTieSlur('tie')}
        />
        <Radio
          name="tie-slur"
          label="Slur"
          checked={tieSlurChoice === 'slur'}
          onChange={() => setTieSlur('slur')}
        />
        {tieReason && <div className="text-sm text-zinc-400">{tieReason}</div>}
      </fieldset>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-xs font-medium text-zinc-500 mb-1">
          Hairpin
        </legend>
        <Radio
          name="hairpin"
          label="None"
          checked={hairpinChoice === 'none'}
          onChange={() => setHairpin('none')}
        />
        <Radio
          name="hairpin"
          label="Crescendo"
          checked={hairpinChoice === 'crescendo'}
          onChange={() => setHairpin('crescendo')}
        />
        <Radio
          name="hairpin"
          label="Decrescendo"
          checked={hairpinChoice === 'decrescendo'}
          onChange={() => setHairpin('decrescendo')}
        />
      </fieldset>
    </div>
  );
}
