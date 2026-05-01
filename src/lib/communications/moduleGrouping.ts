import { CommunicationThread } from '@/types/communications';

export type CommModule =
  | 'risk'
  | 'designControl'
  | 'vv'
  | 'qms'
  | 'regulatory'
  | 'general';

export const COMM_MODULE_ORDER: CommModule[] = [
  'risk',
  'designControl',
  'vv',
  'qms',
  'regulatory',
  'general',
];

export const COMM_MODULE_LABELS: Record<CommModule, string> = {
  risk: 'Risk',
  designControl: 'Design Control',
  vv: 'V&V',
  qms: 'QMS / SOPs',
  regulatory: 'Regulatory / GSPR',
  general: 'General',
};

/**
 * Map a thread to its regulatory module column based on
 * related_entity_type / thread_type metadata.
 * Pure function — safe for memoization.
 */
export function getThreadModule(thread: CommunicationThread): CommModule {
  const entity = (thread.related_entity_type || '').toLowerCase();
  const ttype = (thread.thread_type || '').toLowerCase();
  const tag = `${entity} ${ttype}`;

  if (/hazard|risk/.test(tag)) return 'risk';
  if (/requirement|design_input|design_output|bom|component|device_component/.test(tag)) return 'designControl';
  if (/verification|validation|test_case|vv\b|v_and_v/.test(tag)) return 'vv';
  if (/sop|quality|capa|audit|nonconformance/.test(tag)) return 'qms';
  if (/dossier|mdr|gspr|regulatory|annex|fda|ivdr/.test(tag)) return 'regulatory';

  return 'general';
}

export function groupThreadsByModule(
  threads: CommunicationThread[]
): Record<CommModule, CommunicationThread[]> {
  const result: Record<CommModule, CommunicationThread[]> = {
    risk: [],
    designControl: [],
    vv: [],
    qms: [],
    regulatory: [],
    general: [],
  };
  for (const t of threads) {
    result[getThreadModule(t)].push(t);
  }
  return result;
}

/**
 * A thread is "quick" (lightweight 1:1 note) when it has no rich metadata.
 * Used for visual differentiation in lists & boards.
 */
export function isQuickThread(thread: CommunicationThread): boolean {
  if (thread.thread_type === 'quick') return true;
  // Heuristic fallback for legacy quick messages created via the Hub.
  const titleLooksQuick = !!thread.title && thread.title.startsWith('Quick Message:');
  const noEntity = !thread.related_entity_id;
  const fewParticipants = (thread.participants?.length || 0) <= 2;
  return titleLooksQuick && noEntity && fewParticipants;
}