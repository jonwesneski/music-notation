import { SVG_NS } from '../consts';
import {
  BRACE_WIDTH_PX,
  BRACKET_HOOK_REACH_PX,
  BRACKET_HOOK_RISE_PX,
  BRACKET_STEM_HALF_WIDTH_PX,
  BRACKET_TIP_WIDTH_PX,
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

/**
 * A square bracket connecting independently-notated staves (e.g. an SATB
 * choir pair) — a thick vertical stem with a small curled hook flourish at
 * each end: curling up-and-right at the top, down-and-right at the bottom
 * (vertical mirror images of each other). Rendered as a single filled
 * closed path. Positioned the same way the brace renderers above are: right
 * edge (x=BRACKET_WIDTH_PX) sits just left of the staves' plain barline
 * connector.
 */
export function createBracketSvg(height: number): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('bracket');
  svg.setAttribute('width', `${BRACKET_WIDTH_PX}`);
  svg.setAttribute('height', `${height}`);
  svg.setAttribute('viewBox', `0 0 ${BRACKET_WIDTH_PX} ${height}`);
  svg.style.overflow = 'visible';

  const lineX = BRACKET_WIDTH_PX * 0.5;
  const stemLeftX = lineX - BRACKET_STEM_HALF_WIDTH_PX;
  const stemRightX = lineX + BRACKET_STEM_HALF_WIDTH_PX;

  const topTipX = lineX + BRACKET_HOOK_REACH_PX;
  const topTipOuterY = -BRACKET_HOOK_RISE_PX - BRACKET_TIP_WIDTH_PX;
  const topTipInnerY = -BRACKET_HOOK_RISE_PX + BRACKET_TIP_WIDTH_PX;

  const bottomTipX = lineX + BRACKET_HOOK_REACH_PX;
  const bottomTipOuterY = height + BRACKET_HOOK_RISE_PX + BRACKET_TIP_WIDTH_PX;
  const bottomTipInnerY = height + BRACKET_HOOK_RISE_PX - BRACKET_TIP_WIDTH_PX;

  // The outer contour departs the stem's far corner and sweeps out to the
  // tip's more extreme point; the inner contour departs the near corner and
  // sweeps to the tip's nearer point. Pairing longer-travel with the more
  // extreme target (and vice versa) keeps the two contours from crossing.
  const topOuterControl = { x: stemLeftX, y: -BRACKET_HOOK_RISE_PX };
  const topInnerControl = { x: stemRightX, y: -BRACKET_HOOK_RISE_PX };
  const bottomOuterControl = {
    x: stemLeftX,
    y: height + BRACKET_HOOK_RISE_PX,
  };
  const bottomInnerControl = {
    x: stemRightX,
    y: height + BRACKET_HOOK_RISE_PX,
  };

  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute(
    'd',
    `M ${topTipX} ${topTipOuterY} ` +
      `Q ${topOuterControl.x} ${topOuterControl.y}, ${stemLeftX} 0 ` +
      `L ${stemLeftX} ${height} ` +
      `Q ${bottomOuterControl.x} ${bottomOuterControl.y}, ${bottomTipX} ${bottomTipOuterY} ` +
      `L ${bottomTipX} ${bottomTipInnerY} ` +
      `Q ${bottomInnerControl.x} ${bottomInnerControl.y}, ${stemRightX} ${height} ` +
      `L ${stemRightX} 0 ` +
      `Q ${topInnerControl.x} ${topInnerControl.y}, ${topTipX} ${topTipInnerY} ` +
      `Z`
  );
  path.setAttribute('fill', 'currentColor');
  path.setAttribute('stroke', 'none');
  svg.appendChild(path);

  return svg;
}
