import { useCallback, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useCompositionFormSession } from './CompositionFormSessionContext';
import type { CompositionFormValues } from './types';

const DRAG_THRESHOLD_PX = 4;
const LONG_PRESS_MS = 400;
const LONG_PRESS_JITTER_PX = 8;

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  pointerType: string;
  longPressTimer: ReturnType<typeof setTimeout> | null;
  isDragging: boolean;
};

type MarqueeRect = { left: number; top: number; width: number; height: number };

function isFormControl(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    !!target.closest(
      'button, select, input, textarea, [contenteditable="true"]'
    )
  );
}

export function DragSelectOverlay({ children }: { children: React.ReactNode }) {
  const { control } = useFormContext<CompositionFormValues>();
  const measureOrder = useWatch({ control, name: 'measureOrder' });
  const measuresById = useWatch({ control, name: 'measuresById' });
  const stavesById = useWatch({ control, name: 'stavesById' });
  const { applyDragSelection } = useCompositionFormSession();

  const dragStateRef = useRef<DragState | null>(null);
  const justCompletedDragRef = useRef(false);
  const [marqueeRect, setMarqueeRect] = useState<MarqueeRect | null>(null);

  const endDrag = useCallback(() => {
    const state = dragStateRef.current;
    if (state?.longPressTimer) clearTimeout(state.longPressTimer);
    dragStateRef.current = null;
    setMarqueeRect(null);
  }, []);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (isFormControl(e.target)) return;

    const pointerId = e.pointerId;
    const startX = e.clientX;
    const startY = e.clientY;
    const pointerType = e.pointerType;
    const currentTarget = e.currentTarget;

    if (pointerType === 'touch') {
      // Long-press-then-drag: a plain touch-swipe must scroll the page
      // normally, so we don't engage the marquee (or call preventDefault)
      // until the pointer has been held roughly still for LONG_PRESS_MS.
      const longPressTimer = setTimeout(() => {
        const state = dragStateRef.current;
        if (!state) return;
        state.isDragging = true;
        currentTarget.setPointerCapture(pointerId);
        setMarqueeRect({ left: startX, top: startY, width: 0, height: 0 });
      }, LONG_PRESS_MS);
      dragStateRef.current = {
        pointerId,
        startX,
        startY,
        pointerType,
        longPressTimer,
        isDragging: false,
      };
    } else {
      // Pointer capture is deferred until the drag threshold is actually
      // crossed (in handlePointerMove) — capturing here would retarget the
      // eventual `click` event to this wrapper, breaking every descendant's
      // native onClick bubbling for what turns out to be a plain click.
      dragStateRef.current = {
        pointerId,
        startX,
        startY,
        pointerType,
        longPressTimer: null,
        isDragging: false,
      };
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== e.pointerId) return;

    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    const distance = Math.hypot(dx, dy);

    if (state.pointerType === 'touch' && !state.isDragging) {
      // Still waiting for the long-press to fire. If the finger has moved
      // meaningfully, this is a scroll, not a select — cancel the timer and
      // let the browser handle it (no preventDefault was ever called).
      if (distance > LONG_PRESS_JITTER_PX && state.longPressTimer) {
        clearTimeout(state.longPressTimer);
        dragStateRef.current = null;
      }
      return;
    }

    if (!state.isDragging) {
      if (distance < DRAG_THRESHOLD_PX) return;
      state.isDragging = true;
      e.currentTarget.setPointerCapture(state.pointerId);
    }

    e.preventDefault();
    setMarqueeRect({
      left: Math.min(state.startX, e.clientX),
      top: Math.min(state.startY, e.clientY),
      width: Math.abs(dx),
      height: Math.abs(dy),
    });
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== e.pointerId) return;

    if (state.isDragging) {
      const dragRect = new DOMRect(
        Math.min(state.startX, e.clientX),
        Math.min(state.startY, e.clientY),
        Math.abs(e.clientX - state.startX),
        Math.abs(e.clientY - state.startY)
      );
      applyDragSelection(dragRect, { measureOrder, measuresById, stavesById });
      justCompletedDragRef.current = true;
    }

    endDrag();
  }

  function handleClickCapture(e: React.MouseEvent) {
    if (justCompletedDragRef.current) {
      e.stopPropagation();
      justCompletedDragRef.current = false;
    }
  }

  return (
    <div
      className="relative"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={endDrag}
      onClickCapture={handleClickCapture}
    >
      {children}
      {marqueeRect && (
        <div
          className="fixed pointer-events-none z-50 border-2 border-blue-500 bg-blue-500/10"
          style={{
            left: marqueeRect.left,
            top: marqueeRect.top,
            width: marqueeRect.width,
            height: marqueeRect.height,
          }}
        />
      )}
    </div>
  );
}
