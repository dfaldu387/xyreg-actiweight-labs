/**
 * Lightweight store to share active document section context
 * between LiveEditor and FloatingAdvisoryBot without prop drilling.
 */

type DocumentContext = { sectionTitle: string; content: string } | null;
type Listener = () => void;

let currentContext: DocumentContext = null;
const listeners = new Set<Listener>();

export const documentContextStore = {
  get: () => currentContext,
  set: (ctx: DocumentContext) => {
    currentContext = ctx;
    listeners.forEach((l) => l());
  },
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};
