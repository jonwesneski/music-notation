import { resolveStaffGroups } from '../rules/staffGroupRules';
import { minWidthToFlexGrow } from '../rules/staffWidth';
import type { StaffElementBaseType } from '../types/elements';
import {
  COMMON_ATTRIBUTES,
  createBraceSvg,
  createBracketSvg,
  isStaffNodeName,
  MUSIC_COMPOSITION,
  MUSIC_MEASURE,
  STAFF_EVENTS,
} from '../utils';
import {
  BRACE_STAFF_GAP_PX,
  BRACE_WIDTH_PX,
  BRACKET_EXTRA_HEIGHT_PX,
  BRACKET_STAFF_GAP_PX,
  BRACKET_TOP_OFFSET_PX,
  BRACKET_WIDTH_PX,
  EMPTY_MEASURE_FLEX_BASIS_PX,
  STAFF_BOTTOM_MARGIN,
  STAFF_LINE_START,
} from '../utils/notationDimensions';

// Per-staff vertical footprint within a measure's stacked staff children,
// used both by the plain full-measure barline (#updateConnectorVisibility)
// and group connectors (brace/bracket) to size/position their vertical
// span. A staff's own slot height is derived from its actual rendered
// height (staffSlotHeightPx) rather than assumed uniform, since staff types
// differ (e.g. a 6-line guitar-tab staff vs. a 5-line classical staff) —
// tied to the real staff geometry, plus a small empirically-measured +2
// nudge closing a visible gap the clean derivation alone didn't fully
// account for. STAFF_SLOT_GAP_PX (the fixed gap between staves) and
// CONNECTOR_TOP_PX (a separate, still-empirical top-offset constant) don't
// depend on staff height and stay as plain constants.
const STAFF_SLOT_GAP_PX = STAFF_BOTTOM_MARGIN + STAFF_LINE_START - 2;
const CONNECTOR_TOP_PX = 51;

function staffSlotHeightPx(staff: StaffElementBaseType): number {
  return staff.staffHeight + 2;
}

if (typeof window !== 'undefined' && typeof customElements !== 'undefined') {
  /**
   * One bar of music. Groups one or more staves (a single staff, or a grand
   * staff / choir when it holds several), draws the vertical bar-line connector
   * through them, and sizes itself to the widest staff's minimum width. Key
   * signature, mode and time inherited from a parent `<music-composition>` can be
   * overridden here to start a mid-piece change. Works standalone.
   *
   * @customElement music-measure
   * @attr {number} number - Bar number shown above the measure.
   * @attr {Note} key-sig - Overrides the inherited key-signature tonic from this bar on.
   * @attr {'major' | 'minor'} mode - Overrides the inherited key-signature mode.
   * @attr {TimeSignature} time - Overrides the inherited time signature from this bar on.
   *
   * @example
   * <music-measure number="1">
   *   <music-staff clef="treble">
   *     <music-note note="C" octave="4" duration="whole"></music-note>
   *   </music-staff>
   * </music-measure>
   */
  class MeasureElement extends HTMLElement {
    static get observedAttributes(): string[] {
      return [
        'number',
        COMMON_ATTRIBUTES.KEY_SIG,
        COMMON_ATTRIBUTES.MODE,
        COMMON_ATTRIBUTES.TIME,
      ];
    }

    #staffConnectorObserver: ResizeObserver;
    #staffMinWidths = new Map<EventTarget, number>();
    #onStaffMinWidth = (event: Event): void => {
      const customEvent = event as CustomEvent<{ minWidth: number }>;
      if (customEvent.target) {
        this.#staffMinWidths.set(
          customEvent.target,
          customEvent.detail.minWidth
        );
      }
      const maxMinWidth = Math.max(...this.#staffMinWidths.values());
      const flexGrow = minWidthToFlexGrow(maxMinWidth);
      this.style.flex = `${flexGrow} 1 ${maxMinWidth}px`;
    };
    #boundUpdateConnectorVisibility: () => void;

    constructor() {
      super();

      this.attachShadow({ mode: 'open' });
      const composition = this.closest(MUSIC_COMPOSITION);
      if (composition) {
        this.time = composition.getAttribute(COMMON_ATTRIBUTES.TIME) ?? '4/4';
        this.mode = composition.getAttribute(COMMON_ATTRIBUTES.MODE) ?? 'major';
        this.keySig =
          composition.getAttribute(COMMON_ATTRIBUTES.KEY_SIG) ?? 'C';
      }

      this.#boundUpdateConnectorVisibility =
        this.#updateConnectorVisibility.bind(this);
      this.#staffConnectorObserver = new ResizeObserver(
        this.#boundUpdateConnectorVisibility
      );
    }

    get number(): number | null {
      const value = this.getAttribute('number');
      if (value === null) return null;
      return parseInt(value);
    }

    set number(value: number | null) {
      if (value === null) this.removeAttribute('number');
      else this.setAttribute('number', value.toString());
    }

    get keySig(): string {
      return this.getAttribute(COMMON_ATTRIBUTES.KEY_SIG) ?? 'C';
    }

    set keySig(value: string) {
      this.setAttribute(COMMON_ATTRIBUTES.KEY_SIG, value);
    }

    get mode(): string {
      return this.getAttribute(COMMON_ATTRIBUTES.MODE) ?? 'major';
    }

    set mode(value: string) {
      this.setAttribute(COMMON_ATTRIBUTES.MODE, value);
    }

    get time(): string | null {
      return this.getAttribute(COMMON_ATTRIBUTES.TIME);
    }

    set time(value: string) {
      this.setAttribute(COMMON_ATTRIBUTES.TIME, value);
    }

    connectedCallback(): void {
      this.render();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- a measure is always slotted into a parent
      this.#staffConnectorObserver.observe(this.parentElement!);
      this.addEventListener(
        STAFF_EVENTS.STAFF_MIN_WIDTH,
        this.#onStaffMinWidth
      );
      this.addEventListener(
        STAFF_EVENTS.GROUP_ATTRIBUTE_CHANGE,
        this.#boundUpdateConnectorVisibility
      );
    }

    disconnectedCallback(): void {
      this.#staffConnectorObserver.disconnect();
      this.removeEventListener(
        STAFF_EVENTS.STAFF_MIN_WIDTH,
        this.#onStaffMinWidth
      );
      this.removeEventListener(
        STAFF_EVENTS.GROUP_ATTRIBUTE_CHANGE,
        this.#boundUpdateConnectorVisibility
      );
      this.#staffMinWidths.clear();
    }

    attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null
    ): void {
      if (oldValue !== newValue) {
        this.render();
      }
    }

    private render(): void {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- constructor attaches the shadow root
      this.shadowRoot!.innerHTML = `
        <style>
          :host {
            display: block;
            flex: 1 1 ${EMPTY_MEASURE_FLEX_BASIS_PX}px;
            min-width: 100px;
            box-sizing: border-box;
            position: relative;
          }

          :host(.has-group-connector) {
            margin-left: ${Math.max(
              BRACE_WIDTH_PX + BRACE_STAFF_GAP_PX,
              BRACKET_WIDTH_PX
            )}px;
          }

          .staff-connector {
            position: absolute;
            left: 0;
            top: 51px;
            width: 1px;
            background-color: currentColor;
            z-index: 5;
            opacity: 1;
            transition: opacity 0.3s;
          }

          .staff-connector.hidden {
            opacity: 0;
          }

          .group-connectors {
            position: absolute;
            inset: 0;
            pointer-events: none;
            overflow: visible;
            color: currentColor;
          }

          .group-connectors > * {
            position: absolute;
          }
        </style>
        <div>
          <div class="staff-connector"></div>
          <div class="group-connectors"></div>
          <span>${this.number}</span>
          <slot></slot>
        </div>
      `;
    }

    #updateConnectorVisibility() {
      const staffConnector =
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- render() always creates .staff-connector before this runs
        this.shadowRoot!.querySelector<HTMLElement>('.staff-connector')!;
      const allMeasures = Array.from(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- observer only runs while connected, so parentNode exists
        this.parentNode!.querySelectorAll(MUSIC_MEASURE)
      );

      const currentIndex = allMeasures.indexOf(this);
      const staves = Array.from(allMeasures[currentIndex].children).filter(
        (n) => isStaffNodeName(n.nodeName)
      ) as StaffElementBaseType[];
      const connectorHeight =
        staves.reduce((sum, staff) => sum + staffSlotHeightPx(staff), 0) +
        STAFF_SLOT_GAP_PX * (staves.length - 1);
      staffConnector.style.height = `${connectorHeight}px`;

      const isFirstInRow = this.#isFirstInRow(allMeasures, currentIndex);

      this.#renderGroupConnectors(isFirstInRow);
      staffConnector.classList.toggle('hidden', !isFirstInRow);
    }

    #isFirstInRow(allMeasures: Element[], currentIndex: number): boolean {
      if (currentIndex === 0) {
        return true;
      }

      const prevMeasure = allMeasures[currentIndex - 1];
      if (!prevMeasure) {
        return false;
      }

      const prevRect = prevMeasure.getBoundingClientRect();
      const currentRect = this.getBoundingClientRect();

      // Tolerance of 5px for rounding errors
      return Math.abs(currentRect.top - prevRect.top) > 5;
    }

    // A staff with a `group` attribute joins a brace/bracket connector with
    // other staves — implicitly via position (pairs with its immediate next
    // sibling) or, for brackets spanning more than 2 staves, explicitly via
    // a shared `group-id`. Resolution/validation is a pure function
    // (rules/staffGroupRules.ts) so it stays independently testable; this
    // method only turns the resolved spans into positioned SVG glyphs.
    //
    // Like the plain barline, a brace/bracket is a system-start decoration:
    // only the first measure of a visual row draws one, even when every
    // measure in the row carries the same grouped staves (see
    // composition.ts's showDescribe for the analogous clef/key/time
    // behavior). `isFirstInRow` is computed once by the caller
    // (#updateConnectorVisibility) — when false, any glyph left over from a
    // previous layout pass is cleared and nothing new is resolved/drawn.
    #renderGroupConnectors(isFirstInRow: boolean) {
      const container =
        this.shadowRoot?.querySelector<HTMLElement>('.group-connectors');
      if (!container) {
        return;
      }

      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }

      if (!isFirstInRow) {
        this.classList.remove('has-group-connector');
        return;
      }

      const staves = Array.from(this.children).filter((el) =>
        isStaffNodeName(el.nodeName)
      ) as StaffElementBaseType[];

      const { groups, warnings } = resolveStaffGroups(
        staves.map((staff) => ({
          group: staff.group ?? null,
          groupId: staff.groupId ?? null,
        }))
      );
      for (const warning of warnings) {
        console.warn(`[music-measure] ${warning}`);
      }

      // A brace/bracket glyph is drawn with a negative `left` (see below),
      // poking out past this measure's own box — this class reserves that
      // space via `margin-left` (see the :host(.has-group-connector) rule
      // above) so the glyph isn't clipped by / doesn't overlap whatever
      // sits to this measure's left, whether standalone or inside a
      // <music-composition>.
      this.classList.toggle('has-group-connector', groups.length > 0);

      for (const { index, count, group } of groups) {
        const isGrandStaff = group === 'grand';
        const bracketExtraHeight = isGrandStaff ? 0 : BRACKET_EXTRA_HEIGHT_PX;
        const precedingStavesHeight = staves
          .slice(0, index)
          .reduce(
            (sum, staff) => sum + staffSlotHeightPx(staff) + STAFF_SLOT_GAP_PX,
            0
          );
        const spanHeight =
          staves
            .slice(index, index + count)
            .reduce((sum, staff) => sum + staffSlotHeightPx(staff), 0) +
          STAFF_SLOT_GAP_PX * (count - 1) +
          bracketExtraHeight;
        const topOffset =
          CONNECTOR_TOP_PX +
          precedingStavesHeight -
          (isGrandStaff ? 0 : BRACKET_TOP_OFFSET_PX + bracketExtraHeight / 2);

        const glyph = isGrandStaff
          ? createBraceSvg(spanHeight)
          : createBracketSvg(spanHeight);
        const glyphWidth = isGrandStaff ? BRACE_WIDTH_PX : BRACKET_WIDTH_PX;
        const gap = isGrandStaff ? BRACE_STAFF_GAP_PX : -BRACKET_STAFF_GAP_PX;
        glyph.style.left = `${-(glyphWidth + gap)}px`;
        glyph.style.top = `${topOffset}px`;
        container.appendChild(glyph);
      }
    }
  }

  if (!customElements.get('music-measure')) {
    customElements.define('music-measure', MeasureElement);
  }
}
