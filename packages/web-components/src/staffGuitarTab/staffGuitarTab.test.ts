/**
 * @jest-environment jsdom
 */
import type { StaffElementBaseType } from '../types/elements';
import {
  COMMON_ATTRIBUTES,
  MUSIC_COMPOSITION,
  MUSIC_MEASURE,
  MUSIC_STAFF_GUITAR_TAB,
} from '../utils/consts';
import '../composition/index';
import '../measure/index';
import './index';

afterEach(() => {
  document.body.innerHTML = '';
});

describe(MUSIC_STAFF_GUITAR_TAB, () => {
  it('renders shadow root with 6-line tab staff', () => {
    const el = document.createElement(MUSIC_STAFF_GUITAR_TAB) as any;
    document.body.appendChild(el);

    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot.innerHTML).not.toBe('');
  });
});

describe(`${MUSIC_STAFF_GUITAR_TAB} time signature`, () => {
  it('defaults time to 4/4', () => {
    const staff = document.createElement(
      MUSIC_STAFF_GUITAR_TAB
    ) as StaffElementBaseType;
    document.body.appendChild(staff);

    expect(staff.time).toBe('4/4');
  });

  it('is settable/gettable via the time property', () => {
    const staff = document.createElement(
      MUSIC_STAFF_GUITAR_TAB
    ) as StaffElementBaseType;
    document.body.appendChild(staff);

    staff.time = '3/4';

    expect(staff.time).toBe('3/4');
  });

  it('inherits time from a <music-measure> ancestor', () => {
    const measure = document.createElement(MUSIC_MEASURE) as any;
    measure.setAttribute(COMMON_ATTRIBUTES.TIME, '6/8');
    document.body.appendChild(measure);

    const staff = document.createElement(
      MUSIC_STAFF_GUITAR_TAB
    ) as StaffElementBaseType;
    measure.appendChild(staff);

    expect(staff.time).toBe('6/8');
  });

  it('inherits time from a <music-composition> ancestor', () => {
    const composition = document.createElement(MUSIC_COMPOSITION) as any;
    composition.setAttribute(COMMON_ATTRIBUTES.TIME, '5/4');
    document.body.appendChild(composition);

    const measure = document.createElement(MUSIC_MEASURE) as any;
    composition.appendChild(measure);

    const staff = document.createElement(
      MUSIC_STAFF_GUITAR_TAB
    ) as StaffElementBaseType;
    measure.appendChild(staff);

    expect(staff.time).toBe('5/4');
  });

  it('respects a staff-level time override over the measure value', () => {
    const measure = document.createElement(MUSIC_MEASURE) as any;
    measure.setAttribute(COMMON_ATTRIBUTES.TIME, '6/8');
    document.body.appendChild(measure);

    const staff = document.createElement(
      MUSIC_STAFF_GUITAR_TAB
    ) as StaffElementBaseType;
    staff.setAttribute(COMMON_ATTRIBUTES.TIME, '2/4');
    measure.appendChild(staff);

    expect(staff.time).toBe('2/4');
  });
});
