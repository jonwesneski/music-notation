import { resolveStaffGroups } from '../rules/staffGroupRules';
import { minWidthToFlexGrow } from '../rules/staffWidth';
import type { StaffElementBaseType } from '../types/elements';
import {
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
  STAFF_HEIGHT,
  STAFF_LINE_START,
} from '../utils/notationDimensions';

// Per-staff vertical footprint within a measure's stacked staff children,
// used both by the plain full-measure barline (#updateConnectorVisibility)
// and group connectors (brace/bracket) to size/position their vertical
// span. Tied to the real staff geometry, plus small empirically-measured
// nudges (+2 / -2) closing visible gaps the clean derivation alone
// didn't fully account for. CONNECTOR_TOP_PX remains a separate,
// still-empirical top-offset constant.
const STAFF_SLOT_HEIGHT_PX = STAFF_HEIGHT + 2;
const STAFF_SLOT_GAP_PX = STAFF_BOTTOM_MARGIN + STAFF_LINE_START - 2;
const CONNECTOR_TOP_PX = 51;

if (typeof window !== 'undefined' && typeof customElements !== 'undefined') {
  class MeasureElement extends HTMLElement {
    static get observedAttributes(): string[] {
      return ['number', 'keysig', 'mode', 'time'];
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

    constructor() {
      super();

      this.attachShadow({ mode: 'open' });
      const composition = this.closest(MUSIC_COMPOSITION);
      if (composition) {
        this.time = composition.getAttribute('time') ?? '4/4';
        this.mode = composition.getAttribute('mode') ?? 'major';
        this.keySig = composition.getAttribute('keysig') ?? 'C';
      }

      this.#staffConnectorObserver = new ResizeObserver(
        this.#updateConnectorVisibility.bind(this)
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
      return this.getAttribute('keysig') ?? 'C';
    }

    set keySig(value: string) {
      this.setAttribute('keysig', value);
    }

    get mode(): string {
      return this.getAttribute('mode') ?? 'major';
    }

    set mode(value: string) {
      this.setAttribute('mode', value);
    }

    get time(): string | null {
      return this.getAttribute('time');
    }

    set time(value: string) {
      this.setAttribute('time', value);
    }

    connectedCallback(): void {
      this.render();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- a measure is always slotted into a parent
      this.#staffConnectorObserver.observe(this.parentElement!);
      this.addEventListener(
        STAFF_EVENTS.STAFF_MIN_WIDTH,
        this.#onStaffMinWidth
      );
    }

    disconnectedCallback(): void {
      this.#staffConnectorObserver.disconnect();
      this.removeEventListener(
        STAFF_EVENTS.STAFF_MIN_WIDTH,
        this.#onStaffMinWidth
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

    // #handleSlotChange(event: Event) {
    //   const slot = event.target as HTMLSlotElement;
    //   const staffMap = {
    //     'MUSIC-STAFF-TREBLE': true,
    //     'MUSIC-STAFF-BASS': true,
    //     'MUSIC-STAFF-GUITAR-TAB': true,
    //   };
    //   const assignedNodes = slot
    //     .assignedNodes({ flatten: true })
    //     .filter((n) => staffMap[n.nodeName as keyof typeof staffMap]);
    //   const assignedElements = slot
    //     .assignedElements({ flatten: true })
    //     .filter((e) => staffMap[e.nodeName as keyof typeof staffMap]);

    //   for (let i = 0; i < assignedElements.length; i++) {}
    // }

    #updateConnectorVisibility() {
      const staffConnector =
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- render() always creates .staff-connector before this runs
        this.shadowRoot!.querySelector<HTMLElement>('.staff-connector')!;
      const allMeasures = Array.from(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- observer only runs while connected, so parentNode exists
        this.parentNode!.querySelectorAll(MUSIC_MEASURE)
      );

      const currentIndex = allMeasures.indexOf(this);
      const total = Array.from(allMeasures[currentIndex].children).filter((n) =>
        isStaffNodeName(n.nodeName)
      ).length;
      const connectorHeight =
        STAFF_SLOT_HEIGHT_PX * total + STAFF_SLOT_GAP_PX * (total - 1);
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

      for (const { index, count, group } of groups) {
        const isGrandStaff = group === 'grand';
        const bracketExtraHeight = isGrandStaff
          ? 0
          : BRACKET_EXTRA_HEIGHT_PX / 2;
        const spanHeight =
          STAFF_SLOT_HEIGHT_PX * count +
          STAFF_SLOT_GAP_PX * (count - 1) +
          bracketExtraHeight;
        const topOffset =
          CONNECTOR_TOP_PX +
          index * (STAFF_SLOT_HEIGHT_PX + STAFF_SLOT_GAP_PX) -
          (isGrandStaff ? 0 : BRACKET_TOP_OFFSET_PX + bracketExtraHeight);

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
