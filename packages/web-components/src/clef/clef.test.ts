/**
 * @jest-environment jsdom
 */
import type { ClefElementType } from '../types/elements';
import { CLEFS } from '../utils';
import { CLEF_EVENTS, MUSIC_CLEF } from '../utils/consts';
import './index';

afterEach(() => {
  document.body.innerHTML = '';
});

describe(MUSIC_CLEF, () => {
  it('standalone and attributes are absent', () => {
    const clefElement = document.createElement(MUSIC_CLEF) as ClefElementType;
    document.body.appendChild(clefElement);

    expect(clefElement.clef).toBe('treble');

    expect(clefElement.shadowRoot?.innerHTML).not.toBe('');
    expect(clefElement.shadowRoot?.querySelector('svg')).not.toBeNull();
  });

  it('renders a clef glyph for every supported clef value', () => {
    for (const clef of CLEFS) {
      const clefElement = document.createElement(MUSIC_CLEF) as ClefElementType;
      clefElement.setAttribute('clef', clef);
      document.body.appendChild(clefElement);

      expect(clefElement.shadowRoot?.querySelector('svg.clef')).not.toBeNull();

      document.body.innerHTML = '';
    }
  });

  it('re-renders when the clef attribute changes', () => {
    const clefElement = document.createElement(MUSIC_CLEF) as ClefElementType;
    clefElement.setAttribute('clef', 'treble');
    document.body.appendChild(clefElement);

    const initialHtml = clefElement.shadowRoot?.innerHTML;

    clefElement.setAttribute('clef', 'bass');

    expect(clefElement.shadowRoot?.innerHTML).not.toBe(initialHtml);
    expect(clefElement.clef).toBe('bass');
  });

  it('dispatches a bubbling, composed attribute-change event when connected and the value changes', () => {
    const clefElement = document.createElement(MUSIC_CLEF) as ClefElementType;
    clefElement.setAttribute('clef', 'treble');
    document.body.appendChild(clefElement);

    const listener = jest.fn();
    clefElement.addEventListener(CLEF_EVENTS.ATTRIBUTE_CHANGE, listener);

    clefElement.setAttribute('clef', 'bass');

    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0][0] as CustomEvent;
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });

  it('does not dispatch the attribute-change event when disconnected or unchanged', () => {
    const clefElement = document.createElement(MUSIC_CLEF) as ClefElementType;
    clefElement.setAttribute('clef', 'treble');

    const listener = jest.fn();
    clefElement.addEventListener(CLEF_EVENTS.ATTRIBUTE_CHANGE, listener);

    clefElement.setAttribute('clef', 'bass');
    expect(listener).not.toHaveBeenCalled();

    document.body.appendChild(clefElement);
    clefElement.setAttribute('clef', 'bass');
    expect(listener).not.toHaveBeenCalled();
  });
});
