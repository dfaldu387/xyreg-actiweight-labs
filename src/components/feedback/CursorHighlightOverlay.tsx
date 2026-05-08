import React, { useEffect, useRef, useState } from 'react';

interface ClickRipple {
  id: number;
  x: number;
  y: number;
}

/**
 * Click-only highlight for screen recording: emits a yellow ring at every
 * click point so the recorded video makes interactions obvious. No cursor
 * follow — only clicks.
 *
 * Pointer-events are disabled so the overlay never blocks real interactions.
 */
export function CursorHighlightOverlay() {
  const [ripples, setRipples] = useState<ClickRipple[]>([]);
  const rippleIdRef = useRef(0);

  useEffect(() => {
    const handleDown = (e: { clientX: number; clientY: number }) => {
      const id = ++rippleIdRef.current;
      setRipples((prev) => [...prev, { id, x: e.clientX, y: e.clientY }]);
      window.setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 700);
    };
    const opts: AddEventListenerOptions = { capture: true, passive: true };
    window.addEventListener('pointerdown', handleDown as any, opts);
    window.addEventListener('mousedown', handleDown as any, opts);
    return () => {
      window.removeEventListener('pointerdown', handleDown as any, opts);
      window.removeEventListener('mousedown', handleDown as any, opts);
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes feedback-cursor-ripple {
          0%   { transform: translate(-50%, -50%) scale(0.4); opacity: 0.75; }
          100% { transform: translate(-50%, -50%) scale(2.4); opacity: 0; }
        }
      `}</style>
      <div
        className="pointer-events-none fixed inset-0 z-[2147483646]"
        aria-hidden="true"
      >
        {ripples.map((r) => (
          <div
            key={r.id}
            style={{
              position: 'fixed',
              left: r.x,
              top: r.y,
              width: 60,
              height: 60,
              borderRadius: '50%',
              border: '3px solid rgba(234, 179, 8, 0.9)',
              animation: 'feedback-cursor-ripple 600ms ease-out forwards',
            }}
          />
        ))}
      </div>
    </>
  );
}
