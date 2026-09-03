# Examples

## `vanilla/`

A plain HTML page — no build step. Open `vanilla/index.html` through a local
server (ES modules don't load from `file://`):

```bash
npx serve packages/web-components        # then open /examples/vanilla/index.html
```

It loads the standalone bundle from `../../dist/standalone/music-notation.js`, so
run `nx run web-components:bundle` first. To use the published package instead,
swap the `<script src>` for the CDN URL shown in the file's comment.

## `react/`

`App.tsx` is a reference component (not a full app). It shows the side-effect
import, JSX usage, the `/react` types reference, and wiring a custom event with a
ref. Drop it into any React 19 + Vite project that has
`@one-step-at-a-time/web-components` installed.
