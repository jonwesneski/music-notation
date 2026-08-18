import type { DurationType, Note } from '@one-step-at-a-time/web-components';
import { durationToFactor } from '@one-step-at-a-time/web-components';
import { useState } from 'react';
import { Button, Radio, Select } from '../../design-system';
import { useCompositionFormSession } from './CompositionFormSessionContext';
import type { DraftMusicEntry } from './types';
import { DURATION_OPTIONS, NOTE_OPTIONS } from './types';

interface EntryInputProps {
  onAdd: (entry: DraftMusicEntry) => void;
  remainingBeats: number;
}

export function EntryInput({ onAdd, remainingBeats }: EntryInputProps) {
  const { session, setSession } = useCompositionFormSession();

  const activeEntry = session.lastActiveEntry;

  const [noteValue, setNoteValue] = useState<Note>('C');
  const [duration, setDuration] = useState<DurationType>('quarter');
  const [chordNotes, setChordNotes] = useState<Array<{ value: Note }>>([
    { value: 'C' },
    { value: 'E' },
  ]);

  const canAdd = durationToFactor[duration] <= remainingBeats;

  function handleNoteAdd() {
    onAdd({ type: 'note', value: noteValue, duration });
  }

  function handleChordAdd() {
    onAdd({
      type: 'chord',
      notes: chordNotes.map((n) => n.value),
      duration,
    });
  }

  function handleRestAdd() {
    onAdd({ type: 'rest', duration });
  }

  return (
    <div
      className="border border-zinc-200 rounded bg-white"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        role="radiogroup"
        aria-label="Entry type"
        className="flex items-center gap-4 border-b border-zinc-200 px-4 py-2"
      >
        <Radio
          name="entry-type"
          value="note"
          label="Note"
          checked={activeEntry === 'note'}
          onChange={() => setSession({ lastActiveEntry: 'note' })}
        />
        <Radio
          name="entry-type"
          value="chord"
          label="Chord"
          checked={activeEntry === 'chord'}
          onChange={() => setSession({ lastActiveEntry: 'chord' })}
        />
        <Radio
          name="entry-type"
          value="rest"
          label="Rest"
          checked={activeEntry === 'rest'}
          onChange={() => setSession({ lastActiveEntry: 'rest' })}
        />
      </div>

      <div className="p-3 flex flex-col gap-2">
        {activeEntry === 'note' && (
          <>
            <Select
              value={noteValue}
              onChange={(e) => setNoteValue(e.target.value as Note)}
            >
              {NOTE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
            <Select
              value={duration}
              onChange={(e) => setDuration(e.target.value as DurationType)}
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
            <Button type="button" disabled={!canAdd} onClick={handleNoteAdd}>
              Add
            </Button>
          </>
        )}

        {activeEntry === 'chord' && (
          <>
            {chordNotes.map((note, i) => (
              <Select
                key={i}
                value={note.value}
                onChange={(e) =>
                  setChordNotes((prev) =>
                    prev.map((n, idx) =>
                      idx === i ? { value: e.target.value as Note } : n
                    )
                  )
                }
              >
                {NOTE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setChordNotes((prev) => [...prev, { value: 'C' }])}
            >
              + Add Note
            </Button>
            <Select
              value={duration}
              onChange={(e) => setDuration(e.target.value as DurationType)}
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
            <Button type="button" disabled={!canAdd} onClick={handleChordAdd}>
              Add
            </Button>
          </>
        )}

        {activeEntry === 'rest' && (
          <>
            <Select
              value={duration}
              onChange={(e) => setDuration(e.target.value as DurationType)}
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
            <Button type="button" disabled={!canAdd} onClick={handleRestAdd}>
              Add
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
