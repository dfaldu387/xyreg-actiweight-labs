import { supabase } from '@/integrations/supabase/client';

// Cached user id for synchronous reads. Warmed up on first import.
let cachedUserId: string | null = null;
let warmupPromise: Promise<string | null> | null = null;

const warmup = (): Promise<string | null> => {
  if (warmupPromise) return warmupPromise;
  warmupPromise = supabase.auth
    .getUser()
    .then(({ data }) => {
      cachedUserId = data.user?.id ?? null;
      return cachedUserId;
    })
    .catch(() => null);
  return warmupPromise;
};

// Kick off warm-up at module import so the id is ready by the time
// components mount.
warmup();

supabase.auth.onAuthStateChange((_event, session) => {
  cachedUserId = session?.user?.id ?? null;
  warmupPromise = Promise.resolve(cachedUserId);
});

const buildKey = (scope: string, userId: string | null): string =>
  `xyreg.userFilters.${userId ?? 'anon'}.${scope}`;

export const getUserScopedFilters = <T,>(scope: string): T | null => {
  try {
    const key = buildKey(scope, cachedUserId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const setUserScopedFilters = <T,>(scope: string, value: T): void => {
  try {
    const key = buildKey(scope, cachedUserId);
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / serialization errors */
  }
};

export const clearUserScopedFilters = (scope: string): void => {
  try {
    const key = buildKey(scope, cachedUserId);
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
};

// Allows components mounted before warm-up to re-hydrate once the user id arrives.
export const onUserScopeReady = (cb: (userId: string | null) => void): void => {
  warmup().then(cb);
};