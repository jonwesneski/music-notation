import { expect, type Page, test } from '@playwright/test';
import { resizeHost, waitForRedrawCycle } from '../../test-fixtures/helpers';
import type { NoteLetterOctave } from '../types/elements';
import type { DurationType } from '../types/theory';
import {
  MUSIC_COMPOSITION,
  MUSIC_MEASURE,
  MUSIC_NOTE,
  MUSIC_STAFF,
} from '../utils/consts';

const MIN_NOTE_WIDTH = 20;

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

interface FlexValues {
  grow: number;
  shrink: number;
  basis: number;
}

function parseFlex(flexValue: string): FlexValues {
  const parts = flexValue.split(' ');
  return {
    grow: parseFloat(parts[0]),
    shrink: parseFloat(parts[1]),
    basis: parseFloat(parts[2]),
  };
}

async function readMeasureFlex(page: Page): Promise<FlexValues> {
  const flexString = await page.evaluate((measureTag) => {
    const measure = document.querySelector(measureTag) as HTMLElement | null;
    if (measure === null) {
      throw new Error(`${measureTag} not found`);
    }
    return measure.style.flex;
  }, MUSIC_MEASURE);
  return parseFlex(flexString);
}

async function readDescribeEndX(page: Page): Promise<number> {
  return page.evaluate((staffTag) => {
    const staff = document.querySelector(staffTag) as
      | (Element & { describeEndX: number })
      | null;
    if (staff === null) {
      throw new Error(`${staffTag} not found`);
    }
    return staff.describeEndX;
  }, MUSIC_STAFF);
}

async function buildMeasureWithNotes(
  page: Page,
  duration: DurationType,
  noteValues: NoteLetterOctave[]
): Promise<void> {
  await page.evaluate(
    ({
      duration,
      noteValues,
      compositionTag,
      measureTag,
      staffTag,
      noteTag,
    }) => {
      const host = document.getElementById('host');
      if (host === null) {
        throw new Error('host missing');
      }
      host.innerHTML = '';
      host.style.width = '900px';
      const composition = document.createElement(compositionTag);
      const measure = document.createElement(measureTag);
      const staff = document.createElement(staffTag);
      for (const value of noteValues) {
        const note = document.createElement(noteTag);
        note.setAttribute('note', value[0]);
        note.setAttribute('octave', value[1]);
        note.setAttribute('duration', duration);
        staff.appendChild(note);
      }
      measure.appendChild(staff);
      composition.appendChild(measure);
      host.appendChild(composition);
    },
    {
      duration,
      noteValues,
      compositionTag: MUSIC_COMPOSITION,
      measureTag: MUSIC_MEASURE,
      staffTag: MUSIC_STAFF,
      noteTag: MUSIC_NOTE,
    }
  );
}

const ONE_NOTE: NoteLetterOctave[] = ['C4'];
const FOUR_NOTES: NoteLetterOctave[] = ['C4', 'D4', 'E4', 'F4'];
const EIGHT_NOTES: NoteLetterOctave[] = [
  'C4',
  'D4',
  'E4',
  'F4',
  'G4',
  'A4',
  'B4',
  'C5',
];
const ELEVEN_NOTES: NoteLetterOctave[] = [
  'C4',
  'D4',
  'E4',
  'F4',
  'G4',
  'A4',
  'B4',
  'C5',
  'D5',
  'E5',
  'F5',
];
const FIFTEEN_NOTES: NoteLetterOctave[] = [
  'C4',
  'D4',
  'E4',
  'F4',
  'G4',
  'A4',
  'B4',
  'C5',
  'D5',
  'E5',
  'F5',
  'G5',
  'A5',
  'B5',
  'C6',
];
// 16 × MIN_NOTE_WIDTH (20) = 320px, guaranteeing minWidth > 300 regardless of describeEndX
const SIXTEEN_NOTES: NoteLetterOctave[] = [
  'C4',
  'D4',
  'E4',
  'F4',
  'G4',
  'A4',
  'B4',
  'C5',
  'D5',
  'E5',
  'F5',
  'G5',
  'A5',
  'B5',
  'C6',
  'D6',
];

test.describe(`${MUSIC_MEASURE} min-width layout`, () => {
  test('single whole note — basis equals describeEndX + MIN_NOTE_WIDTH, grow clamped to minimum', async ({
    page,
  }) => {
    await buildMeasureWithNotes(page, 'whole', ONE_NOTE);
    await waitForRedrawCycle(page);

    const flex = await readMeasureFlex(page);
    const describeEndX = await readDescribeEndX(page);

    expect(
      Math.abs(flex.basis - (describeEndX + MIN_NOTE_WIDTH))
    ).toBeLessThanOrEqual(1);
    expect(flex.grow).toBeCloseTo(0.2, 5);
  });

  test('basis scales linearly with note count — delta = noteCount × MIN_NOTE_WIDTH', async ({
    page,
  }) => {
    await buildMeasureWithNotes(page, 'eighth', ONE_NOTE);
    await waitForRedrawCycle(page);
    const flex1 = await readMeasureFlex(page);

    await buildMeasureWithNotes(page, 'eighth', EIGHT_NOTES);
    await waitForRedrawCycle(page);
    const flex8 = await readMeasureFlex(page);

    expect(flex8.basis - flex1.basis).toBeCloseTo(7 * MIN_NOTE_WIDTH, 1);
  });

  test('16 hundredtwentyeighth notes — basis exceeds old 300px cap (regression)', async ({
    page,
  }) => {
    await buildMeasureWithNotes(page, 'hundredtwentyeighth', SIXTEEN_NOTES);
    await waitForRedrawCycle(page);

    const flex = await readMeasureFlex(page);
    const describeEndX = await readDescribeEndX(page);

    // 16 × 20 = 320px of notes alone, so minWidth > 300 regardless of describeEndX
    expect(flex.basis).toBeGreaterThan(300);
    expect(
      Math.abs(flex.basis - (describeEndX + 16 * MIN_NOTE_WIDTH))
    ).toBeLessThanOrEqual(1);
  });

  test('notes do not bleed — proportionalWidth is non-negative for 15 hundredtwentyeighth notes', async ({
    page,
  }) => {
    await buildMeasureWithNotes(page, 'hundredtwentyeighth', FIFTEEN_NOTES);
    await waitForRedrawCycle(page);

    const { staffWidth, describeEndX } = await page.evaluate((staffTag) => {
      const staff = document.querySelector(staffTag) as
        | (Element & { describeEndX: number })
        | null;
      if (staff === null) {
        throw new Error('staff not found');
      }
      return {
        staffWidth: staff.getBoundingClientRect().width,
        describeEndX: staff.describeEndX,
      };
    }, MUSIC_STAFF);

    const proportionalWidth = staffWidth - describeEndX - 15 * MIN_NOTE_WIDTH;
    expect(proportionalWidth).toBeGreaterThanOrEqual(0);
  });

  test('two staves — measure uses the larger minWidth', async ({ page }) => {
    await page.evaluate(
      ({ compositionTag, measureTag, staffTag, noteTag }) => {
        const host = document.getElementById('host');
        if (host === null) {
          throw new Error('host missing');
        }
        host.innerHTML = '';
        host.style.width = '900px';
        const composition = document.createElement(compositionTag);
        const measure = document.createElement(measureTag);

        const slowStaff = document.createElement(staffTag);
        const wholeNote = document.createElement(noteTag);
        wholeNote.setAttribute('note', ('C4' satisfies NoteLetterOctave)[0]);
        wholeNote.setAttribute('octave', ('C4' satisfies NoteLetterOctave)[1]);
        wholeNote.setAttribute('duration', 'whole' satisfies DurationType);
        slowStaff.appendChild(wholeNote);

        const fastStaff = document.createElement(staffTag);
        for (const value of [
          'C4',
          'D4',
          'E4',
          'F4',
          'G4',
          'A4',
          'B4',
          'C5',
        ] as NoteLetterOctave[]) {
          const note = document.createElement(noteTag);
          note.setAttribute('note', value[0]);
          note.setAttribute('octave', value[1]);
          note.setAttribute('duration', 'eighth' satisfies DurationType);
          fastStaff.appendChild(note);
        }

        measure.appendChild(slowStaff);
        measure.appendChild(fastStaff);
        composition.appendChild(measure);
        host.appendChild(composition);
      },
      {
        compositionTag: MUSIC_COMPOSITION,
        measureTag: MUSIC_MEASURE,
        staffTag: MUSIC_STAFF,
        noteTag: MUSIC_NOTE,
      }
    );
    await waitForRedrawCycle(page);

    const flex = await readMeasureFlex(page);
    const describeEndX = await readDescribeEndX(page);

    const minWidthFor1Note = describeEndX + 1 * MIN_NOTE_WIDTH;
    const minWidthFor8Notes = describeEndX + 8 * MIN_NOTE_WIDTH;

    expect(Math.abs(flex.basis - minWidthFor8Notes)).toBeLessThanOrEqual(1);
    expect(flex.basis).toBeGreaterThan(minWidthFor1Note);
  });

  test('flex-grow increases monotonically as note count grows', async ({
    page,
  }) => {
    const noteCounts: NoteLetterOctave[][] = [
      ONE_NOTE,
      FOUR_NOTES,
      ELEVEN_NOTES,
      FIFTEEN_NOTES,
    ];

    const grows: number[] = [];
    for (const noteValues of noteCounts) {
      await buildMeasureWithNotes(page, 'quarter', noteValues);
      await waitForRedrawCycle(page);
      const flex = await readMeasureFlex(page);
      grows.push(flex.grow);
    }

    for (let i = 1; i < grows.length; i++) {
      expect(grows[i]).toBeGreaterThanOrEqual(grows[i - 1]);
    }
  });
});

test.describe(`${MUSIC_MEASURE} group connectors`, () => {
  async function buildMeasuresWithStaves(
    page: Page,
    measures: (string | null)[][],
    hostWidth = 900,
    standalone = false
  ): Promise<void> {
    await page.evaluate(
      ({
        compositionTag,
        measureTag,
        staffTag,
        noteTag,
        measures,
        hostWidth,
        standalone,
      }) => {
        const host = document.getElementById('host');
        if (host === null) {
          throw new Error('host missing');
        }
        host.innerHTML = '';
        host.style.width = `${hostWidth}px`;
        // Standalone skips the <music-composition> wrapper entirely, so
        // measures attach directly to #host — this is what exercises a bare
        // <music-measure> the way measure.stories.ts's GrandStaves story does.
        const measureParent = standalone
          ? host
          : document.createElement(compositionTag);

        for (const staffGroups of measures) {
          const measure = document.createElement(measureTag);
          for (const group of staffGroups) {
            const staff = document.createElement(staffTag);
            if (group !== null) {
              staff.setAttribute('group', group);
            }
            const note = document.createElement(noteTag);
            note.setAttribute('note', 'C');
            note.setAttribute('octave', '4');
            note.setAttribute('duration', 'whole');
            staff.appendChild(note);
            measure.appendChild(staff);
          }
          measureParent.appendChild(measure);
        }

        if (!standalone) {
          host.appendChild(measureParent);
        }
      },
      {
        compositionTag: MUSIC_COMPOSITION,
        measureTag: MUSIC_MEASURE,
        staffTag: MUSIC_STAFF,
        noteTag: MUSIC_NOTE,
        measures,
        hostWidth,
        standalone,
      }
    );
    await waitForRedrawCycle(page);
    await waitForRedrawCycle(page);
  }

  async function buildMeasureWithStaves(
    page: Page,
    staffGroups: (string | null)[]
  ): Promise<void> {
    await buildMeasuresWithStaves(page, [staffGroups]);
  }

  async function readGroupConnectorGlyphs(
    page: Page
  ): Promise<{ tag: string; className: string }[]> {
    return page.evaluate((measureTag) => {
      const measure = document.querySelector(measureTag);
      const container = measure?.shadowRoot?.querySelector('.group-connectors');
      if (!container) {
        return [];
      }
      return Array.from(container.children).map((el) => ({
        tag: el.tagName,
        className: el.getAttribute('class') ?? '',
      }));
    }, MUSIC_MEASURE);
  }

  // Groups every measure's .group-connectors glyph count by visual row
  // (same top-diff-tolerance technique as composition.ts's
  // #computeMeasureRows), so assertions don't need to know exactly how many
  // measures fit per row.
  async function readGroupConnectorGlyphCountsByRow(
    page: Page
  ): Promise<number[][]> {
    return page.evaluate((measureTag) => {
      const measures = Array.from(
        document.querySelectorAll(measureTag)
      ) as HTMLElement[];
      const rows: { top: number; glyphCounts: number[] }[] = [];
      for (const measure of measures) {
        const top = measure.getBoundingClientRect().top;
        const container =
          measure.shadowRoot?.querySelector('.group-connectors');
        const glyphCount = container ? container.children.length : 0;
        const existingRow = rows.find((r) => Math.abs(r.top - top) <= 5);
        if (existingRow === undefined) {
          rows.push({ top, glyphCounts: [glyphCount] });
        } else {
          existingRow.glyphCounts.push(glyphCount);
        }
      }
      return rows.map((r) => r.glyphCounts);
    }, MUSIC_MEASURE);
  }

  test('a grand-staff pair renders exactly one brace glyph', async ({
    page,
  }) => {
    await buildMeasureWithStaves(page, ['grand', null]);
    const glyphs = await readGroupConnectorGlyphs(page);
    expect(glyphs).toHaveLength(1);
    expect(glyphs[0].className).toContain('brace');
  });

  test('a bracket pair renders exactly one bracket glyph', async ({ page }) => {
    await buildMeasureWithStaves(page, ['bracket', null]);
    const glyphs = await readGroupConnectorGlyphs(page);
    expect(glyphs).toHaveLength(1);
    expect(glyphs[0].className).toContain('bracket');
  });

  test('two independent grand-staff pairs in one measure render two brace glyphs', async ({
    page,
  }) => {
    await buildMeasureWithStaves(page, ['grand', null, 'grand', null]);
    const glyphs = await readGroupConnectorGlyphs(page);
    expect(glyphs).toHaveLength(2);
    expect(glyphs.every((g) => g.className.includes('brace'))).toBe(true);
  });

  test('a grouped staff with no next sibling renders no connector', async ({
    page,
  }) => {
    await buildMeasureWithStaves(page, [null, 'grand']);
    const glyphs = await readGroupConnectorGlyphs(page);
    expect(glyphs).toHaveLength(0);
  });

  test('ungrouped staves render no group connector', async ({ page }) => {
    await buildMeasureWithStaves(page, [null, null]);
    const glyphs = await readGroupConnectorGlyphs(page);
    expect(glyphs).toHaveLength(0);
  });

  test("a bracket's hook tip sits past the barline, closer than the old flush position", async ({
    page,
  }) => {
    await buildMeasureWithStaves(page, ['bracket', null]);
    const rects = await page.evaluate((measureTag) => {
      const measure = document.querySelector(measureTag);
      const shadow = measure?.shadowRoot;
      const bracket = shadow?.querySelector('.group-connectors svg.bracket');
      const stem = bracket?.querySelector('rect');
      const barline = shadow?.querySelector<HTMLElement>('.staff-connector');
      return {
        bracketRight: bracket?.getBoundingClientRect().right ?? null,
        stemRight: stem?.getBoundingClientRect().right ?? null,
        barlineLeft: barline?.getBoundingClientRect().left ?? null,
      };
    }, MUSIC_MEASURE);

    expect(rects.bracketRight).not.toBeNull();
    expect(rects.stemRight).not.toBeNull();
    expect(rects.barlineLeft).not.toBeNull();

    // The hook tip now overlaps slightly past the barline instead of
    // landing exactly flush against it.
    expect(rects.bracketRight as number).toBeGreaterThan(
      rects.barlineLeft as number
    );
    // The stem (the visually-dominant straight part) sits well within the
    // old ~13.76-18.76px flush-position gap, not right at its outer edge.
    expect(
      (rects.barlineLeft as number) - (rects.stemRight as number)
    ).toBeLessThan(14);
  });

  test("a bracket's top/bottom hooks clear the first/last staff lines instead of sitting level with them", async ({
    page,
  }) => {
    await buildMeasureWithStaves(page, ['bracket', null]);
    const rects = await page.evaluate(
      ({ measureTag, staffTag }) => {
        const measure = document.querySelector(measureTag);
        const shadow = measure?.shadowRoot;
        const bracket = shadow?.querySelector('.group-connectors svg.bracket');
        // The SVG's own getBoundingClientRect() reflects its declared
        // width/height box, not the hook paths' painted ink that overflows
        // it (top hook draws above y=0, bottom hook below y=height) — read
        // the actual top/bottom hook <path> elements instead.
        const hookPaths = bracket?.querySelectorAll('path') ?? [];
        const topHook = hookPaths[0];
        const bottomHook = hookPaths[hookPaths.length - 1];
        const staffContainers = Array.from(
          measure?.querySelectorAll(staffTag) ?? []
        )
          .map((staff) =>
            staff.shadowRoot?.querySelector<HTMLElement>('.staff-container')
          )
          .filter((el): el is HTMLElement => el !== null && el !== undefined);
        const firstStaffLine = staffContainers[0];
        const lastStaffLine = staffContainers[staffContainers.length - 1];
        return {
          hookTop: topHook?.getBoundingClientRect().top ?? null,
          hookBottom: bottomHook?.getBoundingClientRect().bottom ?? null,
          firstStaffLineTop:
            firstStaffLine?.getBoundingClientRect().top ?? null,
          lastStaffLineBottom:
            lastStaffLine?.getBoundingClientRect().bottom ?? null,
        };
      },
      { measureTag: MUSIC_MEASURE, staffTag: MUSIC_STAFF }
    );

    expect(rects.hookTop).not.toBeNull();
    expect(rects.hookBottom).not.toBeNull();
    expect(rects.firstStaffLineTop).not.toBeNull();
    expect(rects.lastStaffLineBottom).not.toBeNull();

    // The bracket's top hook must clear the first staff's top line by a
    // visible margin, not just barely graze it.
    expect(rects.firstStaffLineTop as number).toBeGreaterThan(
      (rects.hookTop as number) + 2
    );
    // Symmetrically, the bottom hook must clear the last staff's bottom line.
    expect(rects.hookBottom as number).toBeGreaterThan(
      (rects.lastStaffLineBottom as number) + 2
    );
  });

  test('a grand-staff pair connector height matches its 2 staves, not the whole measure', async ({
    page,
  }) => {
    await buildMeasureWithStaves(page, ['grand', null, null]);
    const heights = await page.evaluate((measureTag) => {
      const measure = document.querySelector(measureTag);
      const shadow = measure?.shadowRoot;
      const brace = shadow?.querySelector('.group-connectors svg.brace');
      const barline = shadow?.querySelector<HTMLElement>('.staff-connector');
      return {
        braceHeight: brace ? Number(brace.getAttribute('height')) : null,
        barlineHeight: barline ? parseFloat(barline.style.height) : null,
      };
    }, MUSIC_MEASURE);

    expect(heights.braceHeight).not.toBeNull();
    expect(heights.barlineHeight).not.toBeNull();
    // The brace only spans 2 of the 3 staves, so it must be shorter than the
    // barline that spans all 3.
    expect(heights.braceHeight as number).toBeLessThan(
      heights.barlineHeight as number
    );
  });

  test('a grouped measure reserves left margin for its group connector', async ({
    page,
  }) => {
    await buildMeasureWithStaves(page, ['grand', null]);
    const withGroup = await page.evaluate((measureTag) => {
      const measure = document.querySelector(measureTag) as HTMLElement | null;
      return {
        hasClass: measure?.classList.contains('has-group-connector') ?? false,
        marginLeft: measure
          ? parseFloat(getComputedStyle(measure).marginLeft)
          : null,
      };
    }, MUSIC_MEASURE);
    expect(withGroup.hasClass).toBe(true);
    expect(withGroup.marginLeft).toBeGreaterThan(0);

    await buildMeasureWithStaves(page, [null, null]);
    const withoutGroup = await page.evaluate((measureTag) => {
      const measure = document.querySelector(measureTag) as HTMLElement | null;
      return measure?.classList.contains('has-group-connector') ?? false;
    }, MUSIC_MEASURE);
    expect(withoutGroup).toBe(false);
  });

  test('a standalone grand-staff measure (no <music-composition> ancestor) reserves its own left margin and its brace is not clipped', async ({
    page,
  }) => {
    await buildMeasuresWithStaves(page, [['grand', null]], 900, true);

    const result = await page.evaluate(
      ({ measureTag }) => {
        const measure = document.querySelector(
          measureTag
        ) as HTMLElement | null;
        const brace = measure?.shadowRoot?.querySelector(
          '.group-connectors svg.brace'
        );
        return {
          hasClass: measure?.classList.contains('has-group-connector') ?? false,
          marginLeft: measure
            ? parseFloat(getComputedStyle(measure).marginLeft)
            : null,
          braceLeft: brace?.getBoundingClientRect().left ?? null,
        };
      },
      { measureTag: MUSIC_MEASURE }
    );

    expect(result.hasClass).toBe(true);
    expect(result.marginLeft).toBeGreaterThan(0);
    expect(result.braceLeft).not.toBeNull();
    // The brace's negative `left` offset must land within the reserved
    // margin, not spill past the measure's own left edge / the viewport.
    expect(result.braceLeft as number).toBeGreaterThanOrEqual(0);
  });

  test('multiple measures sharing a row render the group connector only on the first measure of that row', async ({
    page,
  }) => {
    // 3 whole-note measures comfortably fit under the 900px composition
    // width cap, so all three land on one row.
    await buildMeasuresWithStaves(page, [
      ['grand', null],
      ['grand', null],
      ['grand', null],
    ]);

    const rows = await readGroupConnectorGlyphCountsByRow(page);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual([1, 0, 0]);
  });

  test('after a resize wraps measures into their own rows, each row shows exactly one brace on its own first measure', async ({
    page,
  }) => {
    await buildMeasuresWithStaves(page, [
      ['grand', null],
      ['grand', null],
      ['grand', null],
      ['grand', null],
    ]);

    const wideRows = await readGroupConnectorGlyphCountsByRow(page);
    expect(wideRows).toHaveLength(1);
    expect(wideRows[0]).toEqual([1, 0, 0, 0]);

    // Well under a single measure's own minimum footprint, so each measure
    // is forced onto its own row.
    await resizeHost(page, 150);

    const narrowRows = await readGroupConnectorGlyphCountsByRow(page);
    expect(narrowRows.length).toBeGreaterThan(1);
    for (const row of narrowRows) {
      expect(row).toEqual([1]);
    }
  });

  test('brace glyphs are cleared from measures that lose first-in-row status when widening back', async ({
    page,
  }) => {
    await buildMeasuresWithStaves(
      page,
      [
        ['grand', null],
        ['grand', null],
        ['grand', null],
      ],
      150
    );

    const narrowRows = await readGroupConnectorGlyphCountsByRow(page);
    expect(narrowRows.length).toBeGreaterThan(1);
    for (const row of narrowRows) {
      expect(row).toEqual([1]);
    }

    await resizeHost(page, 900);

    const wideRows = await readGroupConnectorGlyphCountsByRow(page);
    expect(wideRows).toHaveLength(1);
    // Only the very first measure keeps a glyph — measures 2 and 3, which
    // briefly had their own glyph while first-in-their-own-row at 150px,
    // must have it cleared now a resize merged them back into measure 1's
    // row. This is the specific regression this fix targets.
    expect(wideRows[0]).toEqual([1, 0, 0]);
  });

  test('setting `group` on an already-connected staff immediately draws a connector, without a resize', async ({
    page,
  }) => {
    await buildMeasureWithStaves(page, [null, null]);
    expect(await readGroupConnectorGlyphs(page)).toHaveLength(0);

    await page.evaluate((staffTag) => {
      const staff = document.querySelector(staffTag);
      staff?.setAttribute('group', 'grand');
    }, MUSIC_STAFF);

    const glyphs = await readGroupConnectorGlyphs(page);
    expect(glyphs).toHaveLength(1);
    expect(glyphs[0].className).toContain('brace');
  });

  test('clearing `group` on an already-connected staff immediately removes its connector, without a resize', async ({
    page,
  }) => {
    await buildMeasureWithStaves(page, ['grand', null]);
    expect(await readGroupConnectorGlyphs(page)).toHaveLength(1);

    await page.evaluate((staffTag) => {
      const staff = document.querySelector(staffTag);
      staff?.removeAttribute('group');
    }, MUSIC_STAFF);

    expect(await readGroupConnectorGlyphs(page)).toHaveLength(0);
  });

  test('changing `group-id` to merge two independent bracket spans immediately redraws a single bracket, without a resize', async ({
    page,
  }) => {
    // Two independent 2-staff brackets, each already scoped by its own
    // `group-id` at creation time (a valid starting layout).
    await page.evaluate(
      ({ compositionTag, measureTag, staffTag, noteTag }) => {
        const host = document.getElementById('host');
        if (host === null) {
          throw new Error('host missing');
        }
        host.innerHTML = '';
        host.style.width = '900px';
        const composition = document.createElement(compositionTag);
        const measure = document.createElement(measureTag);
        for (const groupId of ['pair-a', 'pair-a', 'pair-b', 'pair-b']) {
          const staff = document.createElement(staffTag);
          staff.setAttribute('group', 'bracket');
          staff.setAttribute('group-id', groupId);
          const note = document.createElement(noteTag);
          note.setAttribute('note', 'C');
          note.setAttribute('octave', '4');
          note.setAttribute('duration', 'whole');
          staff.appendChild(note);
          measure.appendChild(staff);
        }
        composition.appendChild(measure);
        host.appendChild(composition);
      },
      {
        compositionTag: MUSIC_COMPOSITION,
        measureTag: MUSIC_MEASURE,
        staffTag: MUSIC_STAFF,
        noteTag: MUSIC_NOTE,
      }
    );
    await waitForRedrawCycle(page);
    await waitForRedrawCycle(page);
    expect(await readGroupConnectorGlyphs(page)).toHaveLength(2);

    await page.evaluate(
      ({ staffTag }) => {
        const staves = Array.from(document.querySelectorAll(staffTag));
        staves.forEach((staff) => staff.setAttribute('group-id', 'merged'));
      },
      { staffTag: MUSIC_STAFF }
    );

    const glyphs = await readGroupConnectorGlyphs(page);
    expect(glyphs).toHaveLength(1);
    expect(glyphs[0].className).toContain('bracket');
  });

  test('a measure reserves left margin immediately when `group` is set on an already-connected staff, without a resize', async ({
    page,
  }) => {
    await buildMeasureWithStaves(page, [null, null]);
    const before = await page.evaluate((measureTag) => {
      const measure = document.querySelector(measureTag);
      return measure?.classList.contains('has-group-connector') ?? false;
    }, MUSIC_MEASURE);
    expect(before).toBe(false);

    await page.evaluate((staffTag) => {
      const staff = document.querySelector(staffTag);
      staff?.setAttribute('group', 'grand');
    }, MUSIC_STAFF);
    await waitForRedrawCycle(page);

    const after = await page.evaluate((measureTag) => {
      const measure = document.querySelector(measureTag);
      return measure?.classList.contains('has-group-connector') ?? false;
    }, MUSIC_MEASURE);
    expect(after).toBe(true);
  });
});
