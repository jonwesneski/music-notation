/// <reference types="@one-step-at-a-time/web-components/react" />
import '@one-step-at-a-time/web-components';
import { useEffect, useRef } from 'react';

/**
 * Minimal React usage. Register the package once (the side-effect import above),
 * then write the `<music-*>` tags as JSX. Custom events need a ref +
 * `addEventListener` — only `onClick` maps to a prop automatically.
 */
export function App() {
  const staffRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = staffRef.current;
    if (!el) {
      return;
    }
    const onNoteClick = (event: Event) => {
      const detail = (event as CustomEvent<{ value: string }>).detail;
      console.log(`clicked ${detail.value}`);
    };
    el.addEventListener('note-click', onNoteClick);
    return () => el.removeEventListener('note-click', onNoteClick);
  }, []);

  return (
    <music-composition key-sig="G" mode="major" time="4/4">
      <music-measure>
        <music-staff ref={staffRef} clef="treble">
          <music-note note="G" octave="4" duration="quarter" />
          <music-note note="B" octave="4" duration="quarter" />
          <music-note note="D" octave="5" duration="quarter" />
          <music-note note="G" octave="5" duration="quarter" />
        </music-staff>
      </music-measure>
    </music-composition>
  );
}
