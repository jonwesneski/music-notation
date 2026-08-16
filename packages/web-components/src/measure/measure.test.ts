/**
 * @jest-environment jsdom
 */
import '../staff/index';
import { MUSIC_MEASURE, MUSIC_STAFF, STAFF_EVENTS } from '../utils/consts';
import './index';

afterEach(() => {
  document.body.innerHTML = '';
});

describe(MUSIC_MEASURE, () => {
  it('renders with default keySig, mode, and time', () => {
    const el = document.createElement(MUSIC_MEASURE) as any;
    document.body.appendChild(el);

    expect(el.keySig).toBe('C');
    expect(el.mode).toBe('major');
    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot.innerHTML).not.toBe('');
  });

  it('redraws the group connector when `group` is set on an already-connected staff, without waiting for a resize', () => {
    const measure = document.createElement(MUSIC_MEASURE) as any;
    const staffA = document.createElement(MUSIC_STAFF);
    const staffB = document.createElement(MUSIC_STAFF);
    measure.appendChild(staffA);
    measure.appendChild(staffB);
    document.body.appendChild(measure);

    let eventFired = false;
    measure.addEventListener(STAFF_EVENTS.GROUP_ATTRIBUTE_CHANGE, () => {
      eventFired = true;
    });

    staffA.setAttribute('group', 'grand');

    expect(eventFired).toBe(true);
    const container = measure.shadowRoot.querySelector('.group-connectors');
    expect(container?.children.length).toBe(1);
  });
});
