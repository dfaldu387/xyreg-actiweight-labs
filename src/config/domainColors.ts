/**
 * Five-color domain system (XyReg canonical).
 *
 * Buckets:
 * - business      → Gold/Amber  — Strategy, valuation, commercial
 * - operations    → Blue        — Execution: supply chain, manufacturing, lifecycle, HR
 * - design-risk   → Teal        — Science: design, software, risk mgmt, V&V, BOM
 * - quality      → Green        — Guardrail: QMS, PMS, audit
 * - clinical-reg → Purple       — Evidence: clinical, regulatory affairs, dossier
 */
export type DomainBucket =
  | 'business'
  | 'operations'
  | 'design-risk'
  | 'quality'
  | 'clinical-reg';

export interface DomainTokens {
  /** Icon foreground for a primary header item. */
  text: string;
  /** Lighter icon foreground for sub-items. */
  textSub: string;
  /** Left-border accent stripe (use on the menu button container). */
  border: string;
  /** Subtle hover/active background tint. */
  bg: string;
  /** Pill / badge style. */
  badge: string;
  /** Important-flagged icon color so it wins over sidebar hover/active. */
  iconForce: string;
  /**
   * Sidebar group wrapper (legacy — kept for backwards compat). Prefer `button`.
   */
  wrapper: string;
  /**
   * Merge-into-`SidebarMenuButton` className. Puts the 3px stripe on the
   * button itself plus a visible tint that survives hover/active.
   */
  button: string;
}

export const DOMAIN_TOKENS: Record<DomainBucket, DomainTokens> = {
  'business': {
    text: 'text-amber-600',
    textSub: 'text-amber-500',
    border: 'border-l-amber-500',
    bg: 'bg-amber-50',
    badge: 'bg-amber-100 text-amber-900',
    iconForce: '!text-amber-600',
    wrapper: 'border-l-[3px] border-l-amber-500 bg-amber-500/5 rounded-r-md pl-2 ml-1',
    button: 'border-l-4 border-l-amber-500 !bg-amber-100/70 hover:!bg-amber-200 !text-amber-900 data-[active=true]:!bg-amber-300 data-[active=true]:!text-amber-950 rounded-l-none',
  },
  'operations': {
    text: 'text-blue-600',
    textSub: 'text-blue-500',
    border: 'border-l-blue-500',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-900',
    iconForce: '!text-blue-600',
    wrapper: 'border-l-[3px] border-l-blue-500 bg-blue-500/5 rounded-r-md pl-2 ml-1',
    button: 'border-l-4 border-l-blue-500 !bg-blue-100/70 hover:!bg-blue-200 !text-blue-900 data-[active=true]:!bg-blue-300 data-[active=true]:!text-blue-950 rounded-l-none',
  },
  'design-risk': {
    text: 'text-teal-600',
    textSub: 'text-teal-500',
    border: 'border-l-teal-500',
    bg: 'bg-teal-50',
    badge: 'bg-teal-100 text-teal-900',
    iconForce: '!text-teal-600',
    wrapper: 'border-l-[3px] border-l-teal-500 bg-teal-500/5 rounded-r-md pl-2 ml-1',
    button: 'border-l-4 border-l-teal-500 !bg-teal-100/70 hover:!bg-teal-200 !text-teal-900 data-[active=true]:!bg-teal-300 data-[active=true]:!text-teal-950 rounded-l-none',
  },
  'quality': {
    text: 'text-emerald-600',
    textSub: 'text-emerald-500',
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-50',
    badge: 'bg-emerald-100 text-emerald-900',
    iconForce: '!text-emerald-600',
    wrapper: 'border-l-[3px] border-l-emerald-500 bg-emerald-500/5 rounded-r-md pl-2 ml-1',
    button: 'border-l-4 border-l-emerald-500 !bg-emerald-100/70 hover:!bg-emerald-200 !text-emerald-900 data-[active=true]:!bg-emerald-300 data-[active=true]:!text-emerald-950 rounded-l-none',
  },
  'clinical-reg': {
    text: 'text-purple-600',
    textSub: 'text-purple-500',
    border: 'border-l-purple-500',
    bg: 'bg-purple-50',
    badge: 'bg-purple-100 text-purple-900',
    iconForce: '!text-purple-600',
    wrapper: 'border-l-[3px] border-l-purple-500 bg-purple-500/5 rounded-r-md pl-2 ml-1',
    button: 'border-l-4 border-l-purple-500 !bg-purple-100/70 hover:!bg-purple-200 !text-purple-900 data-[active=true]:!bg-purple-300 data-[active=true]:!text-purple-950 rounded-l-none',
  },
};

export function domainTokens(bucket: DomainBucket): DomainTokens {
  return DOMAIN_TOKENS[bucket];
}
