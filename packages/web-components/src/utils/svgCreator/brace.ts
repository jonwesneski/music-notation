import { SVG_NS } from '../consts';
import {
  BRACE_WIDTH_PX,
  BRACKET_LEFT_MARGIN_PX,
  BRACKET_STEM_THICKNESS_PX,
  BRACKET_WIDTH_PX,
} from '../notationDimensions';

// ─── Brace ──────────────────────────────────────────────────────────────────
//
// Path data below is derived from an engraved brace glyph outline via a
// one-off extraction/processing script (not checked in), keeping the
// glyph's original 20-segment cubic-bezier structure intact. The outline
// traces both walls of the brace's curved "ribbon" (an outer wall out to
// each tip, an inner wall back from each tip to the mid-junction pinch);
// every point in the path — anchors and control points alike — is tagged
// with which of those four wall arcs it belongs to, matched against its
// nearest (by vertical position) point on the opposite wall of the same
// tip's ribbon, and moved 25% of the way toward that match. Since both
// sides of a matched pair move toward each other by the same fraction, the
// gap between them (the local stroke width) shrinks to half its original
// size — verified by sampling cross-sections at several heights (~43-48%
// width reduction at the humps, converging naturally to ~0 at the tips and
// pinch where the two walls already meet). Finally the origin is
// normalized so the path's own coordinate space is already
// X ∈ [0, BRACE_NATURAL_WIDTH], Y ∈ [0, BRACE_NATURAL_HEIGHT]
// (top-left origin, Y-down) — so no translation is needed at render time,
// only the scale below. See CLAUDE.md's "Grand Staff / Part Connectors"
// section for provenance details.
const BRACE_PATH_D =
  'M 6.25 504 ' +
  'C 30.5 477.5, 60 406, 60 346 ' +
  'C 60 342.25, 60 337.75, 59.25 334 ' +
  'C 45.25 279, 22.75 184.5, 22.75 119 ' +
  'C 22.75 80, 46.75 28, 56 14.5 ' +
  'C 58.25 10, 59.75 9.25, 59.75 7 ' +
  'C 60.75 3.5, 59 0, 56.75 0 ' +
  'C 56.5 0, 55.75 2.5, 52.75 7 ' +
  'C 33.75 32, 7.75 88, 7.75 189.5 ' +
  'C 15.25 287, 43.25 332, 43.5 398 ' +
  'C 43.5 433.25, 21 470.5, 0 494.5 ' +
  'C 13.5 518.5, 35.25 530.5, 43.5 597 ' +
  'C 43.25 668.25, 15.25 729.5, 7.75 807.75 ' +
  'C 7.75 909.25, 33.75 965.25, 52.75 991 ' +
  'C 55 996.25, 56.5 997, 58 997 ' +
  'C 59 997, 60.75 994.5, 59.75 991 ' +
  'C 59.75 988.75, 59 987.25, 56 982.75 ' +
  'C 46.75 969.75, 22.75 917.75, 22.75 878 ' +
  'C 22.75 813.25, 45.25 724.5, 59.25 664.75 ' +
  'C 60 661, 60 657.25, 60 652.75 ' +
  'C 60 591, 28 517.5, 6.25 504 Z';

/** Full width (units) of the thinned+normalized glyph outline's bounding box. */
const BRACE_NATURAL_WIDTH = 60.75;

/**
 * Full height (units) of the thinned+normalized glyph outline's bounding
 * box — its default/natural size. The source glyph is meant to be scaled
 * disproportionately (Y independent of X) to fit whatever gap the connected
 * staves need, which is what createBraceSvg does below.
 */
const BRACE_NATURAL_HEIGHT = 997;

/**
 * Brace renderer built from an engraved glyph outline (see BRACE_PATH_D
 * above; provenance in CLAUDE.md). Right edge sits at x=BRACE_WIDTH_PX,
 * matching the positioning convention used by the other connector
 * renderers below.
 */
export function createBraceSvg(height: number): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('brace');
  svg.setAttribute('width', `${BRACE_WIDTH_PX}`);
  svg.setAttribute('height', `${height}`);
  svg.setAttribute('viewBox', `0 0 ${BRACE_WIDTH_PX} ${height}`);
  svg.style.overflow = 'visible';

  // Width scales by a fixed factor regardless of height (disproportionate
  // scaling — see BRACE_NATURAL_HEIGHT comment); height scales to
  // exactly fill the requested span. The path's own coordinates already
  // start at (0, 0), so scale is the only transform needed.
  const scaleX = BRACE_WIDTH_PX / BRACE_NATURAL_WIDTH;
  const scaleY = height / BRACE_NATURAL_HEIGHT;

  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', BRACE_PATH_D);
  path.setAttribute('transform', `scale(${scaleX}, ${scaleY})`);
  path.setAttribute('fill', 'currentColor');
  path.setAttribute('stroke', 'none');
  svg.appendChild(path);

  return svg;
}

// ─── Bracket ────────────────────────────────────────────────────────────────
//
// A bracket is a straight stem with a curled hook flourish at each end.
// Unlike the brace above, that hook must never stretch — real engraving
// keeps it a fixed size no matter how many staves the bracket spans; only
// the straight stem between the hooks gets longer. So rather than one glyph
// scaled to fit, this is built from two independent, fixed-size hook
// outlines (traced from an engraved reference glyph, one per end, each
// already normalized to this file's px coordinate scale) plus a stem
// rectangle sized to whatever span is requested.
//
// Both hooks share one outline shape (mirror images of each other), traced
// with its own top-left origin, X ∈ [0, 18.76], Y ∈ [0, 11.8]. Within that
// shape, X ∈ [0, 5] (matching the stem's own thickness) is the flat edge
// that meets the stem; the curled tip reaches out toward X=18.76. For the
// top hook, that meeting edge must land at Y=0 (flush with the stem's own
// top) with the tip curling out to Y=-11.8 (up and away) — i.e. the outline
// is *mirrored* (Y negated), not shifted, relative to its natural Y ∈
// [0, 11.8]. BRACKET_TOP_PATH_D below is that mirrored outline, with
// BRACKET_LEFT_MARGIN_PX also added to every X so the whole hook (and the
// stem it caps) sits with a bit of breathing room left of the connector's
// own bounding box. The bottom hook needs the same mirroring, but can't be
// pre-computed the same way since how far down it sits depends on the
// requested height, so it's kept as per-point (x, y) data and re-serialized
// into a `d` string with that mirror + offset applied at call time — see
// `bracketBottomPathD` — rather than repositioned with a `transform`.
const BRACKET_TOP_PATH_D =
  `M ${0 + BRACKET_LEFT_MARGIN_PX} 0 L ${5 + BRACKET_LEFT_MARGIN_PX} 0 ` +
  `C ${11.4 + BRACKET_LEFT_MARGIN_PX} -1.2, ${
    17.12 + BRACKET_LEFT_MARGIN_PX
  } -4.16, ${18.72 + BRACKET_LEFT_MARGIN_PX} -10.84 ` +
  `C ${18.76 + BRACKET_LEFT_MARGIN_PX} -11, ${
    18.76 + BRACKET_LEFT_MARGIN_PX
  } -11.12, ${18.76 + BRACKET_LEFT_MARGIN_PX} -11.24 ` +
  `C ${18.76 + BRACKET_LEFT_MARGIN_PX} -11.56, ${
    18.64 + BRACKET_LEFT_MARGIN_PX
  } -11.72, ${18.44 + BRACKET_LEFT_MARGIN_PX} -11.8 ` +
  `C ${18.08 + BRACKET_LEFT_MARGIN_PX} -11.8, ${
    17.64 + BRACKET_LEFT_MARGIN_PX
  } -11.52, ${17.44 + BRACKET_LEFT_MARGIN_PX} -11.24 ` +
  `C ${17.04 + BRACKET_LEFT_MARGIN_PX} -10.8, ${
    12 + BRACKET_LEFT_MARGIN_PX
  } -5.52, ${4.36 + BRACKET_LEFT_MARGIN_PX} -4.96 ` +
  `L ${0.32 + BRACKET_LEFT_MARGIN_PX} -4.96 ` +
  `C ${0.08 + BRACKET_LEFT_MARGIN_PX} -4.96, ${
    0 + BRACKET_LEFT_MARGIN_PX
  } -4.92, ${0 + BRACKET_LEFT_MARGIN_PX} -4.68 Z`;

/** Full natural height (px) of a hook cap's own outline — see comment above. */
const BRACKET_CAP_NATURAL_HEIGHT = 11.8;

type PathSegment =
  | { cmd: 'M' | 'L'; x: number; y: number }
  | {
      cmd: 'C';
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      x: number;
      y: number;
    }
  | { cmd: 'Z' };

// Natural (unmirrored) coordinates, X already shifted right by
// BRACKET_LEFT_MARGIN_PX — Y is mirrored (and offset by the requested
// height) at call time in bracketBottomPathD, since that part of the
// transform genuinely depends on a runtime value.
const BRACKET_BOTTOM_PATH_SEGMENTS: PathSegment[] = [
  { cmd: 'M', x: 0 + BRACKET_LEFT_MARGIN_PX, y: 7.12 },
  {
    cmd: 'C',
    x1: 0 + BRACKET_LEFT_MARGIN_PX,
    y1: 6.88,
    x2: 0.08 + BRACKET_LEFT_MARGIN_PX,
    y2: 6.84,
    x: 0.32 + BRACKET_LEFT_MARGIN_PX,
    y: 6.84,
  },
  { cmd: 'L', x: 4.36 + BRACKET_LEFT_MARGIN_PX, y: 6.84 },
  {
    cmd: 'C',
    x1: 12 + BRACKET_LEFT_MARGIN_PX,
    y1: 6.28,
    x2: 17.04 + BRACKET_LEFT_MARGIN_PX,
    y2: 1,
    x: 17.44 + BRACKET_LEFT_MARGIN_PX,
    y: 0.56,
  },
  {
    cmd: 'C',
    x1: 17.64 + BRACKET_LEFT_MARGIN_PX,
    y1: 0.28,
    x2: 18.08 + BRACKET_LEFT_MARGIN_PX,
    y2: 0,
    x: 18.44 + BRACKET_LEFT_MARGIN_PX,
    y: 0,
  },
  {
    cmd: 'C',
    x1: 18.64 + BRACKET_LEFT_MARGIN_PX,
    y1: 0.08,
    x2: 18.76 + BRACKET_LEFT_MARGIN_PX,
    y2: 0.24,
    x: 18.76 + BRACKET_LEFT_MARGIN_PX,
    y: 0.56,
  },
  {
    cmd: 'C',
    x1: 18.76 + BRACKET_LEFT_MARGIN_PX,
    y1: 0.68,
    x2: 18.76 + BRACKET_LEFT_MARGIN_PX,
    y2: 0.8,
    x: 18.72 + BRACKET_LEFT_MARGIN_PX,
    y: 0.96,
  },
  {
    cmd: 'C',
    x1: 17.12 + BRACKET_LEFT_MARGIN_PX,
    y1: 7.64,
    x2: 11.4 + BRACKET_LEFT_MARGIN_PX,
    y2: 10.6,
    x: 5 + BRACKET_LEFT_MARGIN_PX,
    y: 11.8,
  },
  { cmd: 'L', x: 0 + BRACKET_LEFT_MARGIN_PX, y: 11.8 },
  { cmd: 'Z' },
];

/**
 * Re-serializes the bottom hook's outline mirrored (Y negated relative to
 * its own natural height) and shifted down by `offsetY` — see the comment
 * above BRACKET_TOP_PATH_D for why the meeting edge needs to land at
 * `offsetY` (flush with the stem's bottom) with the tip curling out past it.
 */
function bracketBottomPathD(offsetY: number): string {
  const y = (naturalY: number) =>
    BRACKET_CAP_NATURAL_HEIGHT - naturalY + offsetY;
  return BRACKET_BOTTOM_PATH_SEGMENTS.map((segment) => {
    switch (segment.cmd) {
      case 'M':
        return `M ${segment.x} ${y(segment.y)}`;
      case 'L':
        return `L ${segment.x} ${y(segment.y)}`;
      case 'C':
        return (
          `C ${segment.x1} ${y(segment.y1)}, ` +
          `${segment.x2} ${y(segment.y2)}, ` +
          `${segment.x} ${y(segment.y)}`
        );
      case 'Z':
        return 'Z';
    }
  }).join(' ');
}

/**
 * Bracket renderer built from the two hook outlines above plus a stem
 * rectangle, in a local coordinate space where the hook tips sit at the
 * right edge (x=BRACKET_WIDTH_PX) and BRACKET_LEFT_MARGIN_PX of breathing
 * room is reserved on the left — see `measure.ts`'s `#renderGroupConnectors`
 * for how that right edge is placed relative to the staff barline
 * (BRACKET_STAFF_GAP_PX). No `transform` is used — the bottom hook's
 * placement and the stem's length are both plain arithmetic on `height`, so
 * this scales cleanly to any span (a 2-staff pair or a many-staff bracket)
 * without distorting either hook.
 */
export function createBracketSvg(height: number): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('bracket');
  svg.setAttribute('width', `${BRACKET_WIDTH_PX}`);
  svg.setAttribute('height', `${height}`);
  svg.setAttribute('viewBox', `0 0 ${BRACKET_WIDTH_PX} ${height}`);
  svg.style.overflow = 'visible';

  const topCap = document.createElementNS(SVG_NS, 'path');
  topCap.setAttribute('d', BRACKET_TOP_PATH_D);
  topCap.setAttribute('fill', 'currentColor');
  topCap.setAttribute('stroke', 'none');
  svg.appendChild(topCap);

  const stem = document.createElementNS(SVG_NS, 'rect');
  stem.setAttribute('x', `${BRACKET_LEFT_MARGIN_PX}`);
  stem.setAttribute('y', '0');
  stem.setAttribute('width', `${BRACKET_STEM_THICKNESS_PX}`);
  stem.setAttribute('height', `${height}`);
  stem.setAttribute('fill', 'currentColor');
  svg.appendChild(stem);

  const bottomCap = document.createElementNS(SVG_NS, 'path');
  bottomCap.setAttribute('d', bracketBottomPathD(height));
  bottomCap.setAttribute('fill', 'currentColor');
  bottomCap.setAttribute('stroke', 'none');
  svg.appendChild(bottomCap);

  return svg;
}
