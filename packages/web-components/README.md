# @one-step-at-a-time/web-components

Framework-agnostic **Web Components** for rendering music notation as SVG in the
browser. Every musical element is a native custom element — no framework
dependencies, so it works in plain HTML or inside React, Vue, Svelte, or Angular.

**[Documentation & live playground →](https://jonwesneski.github.io/one-step-at-a-time/)**

## Install

```bash
pnpm add @one-step-at-a-time/web-components
```

## Quick start (bundler)

Import the package once at your entry point — the import registers every element:

```ts
import '@one-step-at-a-time/web-components';
```

```html
<music-composition key-sig="G" mode="major" time="4/4">
  <music-measure>
    <music-staff clef="treble">
      <music-note note="G" octave="4" duration="quarter"></music-note>
      <music-note note="B" octave="4" duration="quarter"></music-note>
      <music-note note="D" octave="5" duration="quarter"></music-note>
      <music-note note="G" octave="5" duration="quarter"></music-note>
    </music-staff>
  </music-measure>
</music-composition>
```

## No build step (CDN)

```html
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@one-step-at-a-time/web-components/dist/standalone/music-notation.js"
></script>
```

For environments without ES modules, a classic-script build is published too:

```html
<script src="https://cdn.jsdelivr.net/npm/@one-step-at-a-time/web-components"></script>
```

## React

```tsx
/// <reference types="@one-step-at-a-time/web-components/react" />
import '@one-step-at-a-time/web-components';

<music-staff clef="treble" time="4/4">
  <music-note note="C" octave="5" duration="quarter" />
</music-staff>;
```

Custom events (`note-click`, `note-pointerdown`, …) need `useRef` +
`addEventListener` — see the **Framework Integration** guide.

## Elements

| Element                    | Purpose                                                          |
| -------------------------- | ---------------------------------------------------------------- |
| `<music-composition>`      | Score container; responsive reflow of measures                   |
| `<music-measure>`          | One bar; groups staves and draws the bar-line                    |
| `<music-staff>`            | Five-line classical staff (`clef` = `treble` \| `bass`)          |
| `<music-staff-guitar-tab>` | Six-line guitar tablature staff                                  |
| `<music-staff-vocal>`      | Vocal staff (six voice types) with lyric layout                  |
| `<music-lyrics>`           | One verse of lyrics for a vocal staff                            |
| `<music-clef>`             | Clef glyph; standalone or a mid-stream clef change               |
| `<music-note>`             | A single note with articulations, dynamics, ties, grace notes    |
| `<music-chord>`            | Several noteheads on one stem (`chord="Cmaj7"` or slotted notes) |
| `<music-rest>`             | A rest of a given duration                                       |
| `<music-tuplet>`           | Wraps notes/chords/rests as a tuplet                             |
| `<music-guitar-note>`      | A fret-on-string tablature note                                  |

Every element's attributes, and a live playground, are in the
[documentation](https://jonwesneski.github.io/one-step-at-a-time/).

## Browser support

Modern evergreen browsers. Uses native Custom Elements and Shadow DOM — no
polyfills.

## Contributing

See [`CLAUDE.md`](./CLAUDE.md) for architecture, the feature-adding workflow, and
the test tiers.

## License

MIT
