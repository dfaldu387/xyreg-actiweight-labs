/**
 * Generic applicability engine for rich-framework gap analysis.
 *
 * Replaces per-framework rule modules (e.g. `annexIContextRules.ts`) with a
 * single deterministic interpreter over the JSONB `applicability_rule` column
 * on `gap_template_items`.
 *
 * Pure, no React, no Supabase.
 */

import type { ApplicabilityRule } from "@/types/richFrameworkContent";

export type GapApplicabilityStatus =
  | "applies"
  | "suggested_na"
  | "unknown_needs_context";

/**
 * Free-form device / company context. Engine reads only the keys named by the
 * rule, so callers can pass any superset (e.g. the full
 * `key_technology_characteristics` blob plus derived flags).
 */
export type ApplicabilityContext = Record<string, unknown>;

export interface ApplicabilityResult {
  status: GapApplicabilityStatus;
  reason?: string;
  missingFields?: string[];
  contextDeepLink?: ApplicabilityRule["contextDeepLink"];
}

function valueIsAnswered(v: unknown): boolean {
  // Null / undefined = unanswered. `false`, `0`, `""` count as answered.
  return v !== null && v !== undefined;
}

function matches(actual: unknown, expected: unknown): boolean {
  if (Array.isArray(expected)) return expected.includes(actual as never);
  if (expected === "*answered*") return valueIsAnswered(actual);
  if (expected === "*empty*") {
    return (
      actual === null ||
      actual === undefined ||
      actual === "" ||
      (Array.isArray(actual) && actual.length === 0)
    );
  }
  return actual === expected;
}

/**
 * Evaluate a clause's applicability against device context.
 *
 * Order of precedence:
 *   1. If `requires` includes any field that is unanswered → `unknown_needs_context`.
 *   2. If `naIf` is provided and ALL pairs match → `suggested_na`.
 *   3. If `appliesIf` is provided and any pair does NOT match → `unknown_needs_context`.
 *   4. Otherwise → `applies`.
 */
export function evaluateApplicability(
  rule: ApplicabilityRule | null | undefined,
  context: ApplicabilityContext
): ApplicabilityResult {
  if (!rule) return { status: "applies" };

  // 1. Required-field gating
  const missing = (rule.requires ?? []).filter(
    (key) => !valueIsAnswered(context[key])
  );
  if (missing.length > 0) {
    return {
      status: "unknown_needs_context",
      reason: rule.reason,
      missingFields: missing,
      contextDeepLink: rule.contextDeepLink,
    };
  }

  // 2. naIf — all pairs must match for the clause to be N/A
  if (rule.naIf && Object.keys(rule.naIf).length > 0) {
    const allMatch = Object.entries(rule.naIf).every(([k, v]) =>
      matches(context[k], v)
    );
    if (allMatch) {
      return {
        status: "suggested_na",
        reason: rule.reason,
        contextDeepLink: rule.contextDeepLink,
      };
    }
  }

  // 3. appliesIf — every pair must match; otherwise we don't have enough info
  if (rule.appliesIf && Object.keys(rule.appliesIf).length > 0) {
    const allMatch = Object.entries(rule.appliesIf).every(([k, v]) =>
      matches(context[k], v)
    );
    if (!allMatch) {
      return {
        status: "unknown_needs_context",
        reason: rule.reason,
        contextDeepLink: rule.contextDeepLink,
      };
    }
  }

  return { status: "applies" };
}