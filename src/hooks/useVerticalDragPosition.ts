import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Vertical-only drag for a fixed-position floating button.
 * Returns props for the button and a `dragging` flag.
 * Click vs drag is distinguished by a 4px movement threshold.
 *
 * The button stays anchored to the right edge; only its `top` is user-controlled.
 * Position persists in localStorage under `storageKey`.
 */
export function useVerticalDragPosition(opts: {
  storageKey: string;
  /** Default Y in px from the TOP of the viewport. If null, falls back to bottom anchor. */
  defaultBottomPx?: number;
  /** Min/max top clamp, defaults to [80, innerHeight - 80]. */
  minTop?: number;
  buttonHeight?: number;
}) {
  const { storageKey, defaultBottomPx = 24, minTop = 80, buttonHeight = 56 } = opts;

  const [topY, setTopY] = useState<number | null>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const n = raw ? parseInt(raw, 10) : NaN;
      return Number.isFinite(n) ? n : null;
    } catch { return null; }
  });
  const [dragging, setDragging] = useState(false);
  const movedRef = useRef(false);
  const startYRef = useRef(0);
  const startTopRef = useRef(0);

  const clamp = (y: number) =>
    Math.max(minTop, Math.min(window.innerHeight - buttonHeight - 16, y));

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    movedRef.current = false;
    startYRef.current = e.clientY;
    const currentTop = topY ?? (window.innerHeight - defaultBottomPx - buttonHeight);
    startTopRef.current = currentTop;
    setDragging(true);

    const onMove = (ev: MouseEvent) => {
      const dy = ev.clientY - startYRef.current;
      if (Math.abs(dy) > 4) movedRef.current = true;
      setTopY(clamp(startTopRef.current + dy));
    };
    const onUp = () => {
      setDragging(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      // Persistence handled by the useEffect on topY changes.
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [topY, storageKey, defaultBottomPx, buttonHeight, minTop]);

  // Persist whenever topY changes during drag
  useEffect(() => {
    if (topY == null) return;
    try { localStorage.setItem(storageKey, String(topY)); } catch {/* */}
  }, [topY, storageKey]);

  const reset = useCallback(() => {
    try { localStorage.removeItem(storageKey); } catch {/* */}
    setTopY(null);
  }, [storageKey]);

  /** Returns true if the most recent pointer interaction was a drag (suppress click). */
  const wasDragged = () => movedRef.current;

  const style: React.CSSProperties = topY != null
    ? { top: topY, bottom: 'auto' }
    : { bottom: defaultBottomPx };

  return { style, dragging, onMouseDown, wasDragged, reset, hasCustomY: topY != null };
}