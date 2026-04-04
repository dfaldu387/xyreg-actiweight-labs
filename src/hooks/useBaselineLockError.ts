import { useState, useCallback } from 'react';

export interface BaselineLockErrorState {
  open: boolean;
  reviewTitle: string | null;
  baselineDate: string | null;
  objectId: string;
  objectType: string;
  objectLabel: string;
}

const INITIAL_STATE: BaselineLockErrorState = {
  open: false,
  reviewTitle: null,
  baselineDate: null,
  objectId: '',
  objectType: '',
  objectLabel: '',
};

/**
 * Parse a BASELINE_LOCKED error message and extract review title + date.
 * Format: BASELINE_LOCKED: This object was baselined in "Review Title" on 2026-01-15T...
 */
function parseBaselineLockError(message: string): { reviewTitle: string | null; baselineDate: string | null } {
  const titleMatch = message.match(/baselined in "([^"]+)"/);
  const dateMatch = message.match(/on (\S+)\./);
  return {
    reviewTitle: titleMatch?.[1] || null,
    baselineDate: dateMatch?.[1] || null,
  };
}

/**
 * Returns true if the error is a BASELINE_LOCKED error.
 */
export function isBaselineLockError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith('BASELINE_LOCKED');
}

/**
 * Hook to manage BaselineLockDialog state from mutation onError callbacks.
 */
export function useBaselineLockError() {
  const [state, setState] = useState<BaselineLockErrorState>(INITIAL_STATE);

  const handleError = useCallback((
    error: unknown,
    objectId: string,
    objectType: string,
    objectLabel: string,
  ): boolean => {
    if (!isBaselineLockError(error)) return false;

    const { reviewTitle, baselineDate } = parseBaselineLockError((error as Error).message);
    setState({
      open: true,
      reviewTitle,
      baselineDate,
      objectId,
      objectType,
      objectLabel,
    });
    return true; // error was handled
  }, []);

  const close = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return { state, handleError, close };
}
