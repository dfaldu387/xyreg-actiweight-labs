import { useState, useEffect, useRef } from 'react';

/**
 * Safe wrapper around useStore that handles undefined/null writables
 * Fixes: "Writable _scrollTask is not defined" in production builds
 */
export function useSafeStore(api, key) {
  const [value, setValue] = useState(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (!api) return;

    try {
      const store = api.getStoreState?.(key) ?? api.getReactive?.(key);

      if (store && typeof store.subscribe === 'function') {
        unsubRef.current = store.subscribe((v) => {
          setValue(v);
        });
      } else {
        // Store doesn't exist or isn't subscribable — return null safely
        setValue(null);
      }
    } catch (e) {
      // Writable not defined — swallow error, return null
      console.warn(`[Gantt] Store "${key}" not available:`, e?.message);
      setValue(null);
    }

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [api, key]);

  return value;
}
