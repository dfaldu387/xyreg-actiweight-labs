/**
 * React Query hook for QMS Node Internal Processes and SOP Links
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  QmsNodeProcessService, 
  QmsNodeProcess, 
  QmsNodeSopLink,
  ProcessStep,
  QmsManualSopLinkService,
} from '@/services/qmsNodeProcessService';
import { supabase } from '@/integrations/supabase/client';
import { NODE_SOP_RECOMMENDATIONS } from '@/data/nodeSOPRecommendations';
import {
  formatSopDisplayId,
  getSopTier,
  TIER_B_CONDITIONAL,
  type SopTier,
  type SopTrigger,
} from '@/constants/sopAutoSeedTiers';
import { SOP_FULL_CONTENT } from '@/data/sopFullContent';

const QUERY_KEYS = {
  nodeProcess: (companyId: string, nodeId: string) => 
    ['qms-node-process', companyId, nodeId] as const,
  linkedSOPs: (companyId: string, nodeId: string) => 
    ['qms-node-sops', companyId, nodeId] as const,
  availableSOPs: (companyId: string) => 
    ['qms-available-sops', companyId] as const,
  sopRequirements: (companyId: string, nodeId: string) =>
    ['qms-sop-requirements', companyId, nodeId] as const,
  manualSopLinks: (companyId: string) =>
    ['qms-sop-manual-links', companyId] as const,
};

/**
 * Hook to fetch the internal process for a QMS node
 */
export function useQmsNodeProcess(companyId: string | undefined, nodeId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.nodeProcess(companyId || '', nodeId || ''),
    queryFn: () => QmsNodeProcessService.getNodeProcess(companyId!, nodeId!),
    enabled: !!companyId && !!nodeId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch linked SOPs for a QMS node
 */
export function useQmsNodeSOPs(companyId: string | undefined, nodeId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.linkedSOPs(companyId || '', nodeId || ''),
    queryFn: () => QmsNodeProcessService.getLinkedSOPs(companyId!, nodeId!),
    enabled: !!companyId && !!nodeId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch all available SOPs for linking
 */
export function useAvailableSOPs(companyId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.availableSOPs(companyId || ''),
    queryFn: () => QmsNodeProcessService.getAvailableSOPs(companyId!),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Hook for mutations on QMS node processes
 */
export function useQmsNodeProcessMutations(companyId: string | undefined, nodeId: string | undefined) {
  const queryClient = useQueryClient();

  const saveProcess = useMutation({
    mutationFn: async ({
      description,
      steps,
      inputs,
      outputs,
    }: {
      description: string;
      steps?: ProcessStep[];
      inputs?: string[] | null;
      outputs?: string[] | null;
    }) => {
      if (!companyId || !nodeId) throw new Error('Missing companyId or nodeId');
      return QmsNodeProcessService.upsertNodeProcess(
        companyId,
        nodeId,
        description,
        steps,
        inputs,
        outputs,
      );
    },
    onSuccess: () => {
      if (companyId && nodeId) {
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.nodeProcess(companyId, nodeId) 
        });
      }
    },
  });

  const linkSOP = useMutation({
    mutationFn: async (documentId: string) => {
      if (!companyId || !nodeId) throw new Error('Missing companyId or nodeId');
      return QmsNodeProcessService.linkSOP(companyId, nodeId, documentId);
    },
    onSuccess: () => {
      if (companyId && nodeId) {
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.linkedSOPs(companyId, nodeId) 
        });
      }
    },
  });

  const unlinkSOP = useMutation({
    mutationFn: async (linkId: string) => {
      return QmsNodeProcessService.unlinkSOP(linkId);
    },
    onSuccess: () => {
      if (companyId && nodeId) {
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.linkedSOPs(companyId, nodeId) 
        });
      }
    },
  });

  return {
    saveProcess,
    linkSOP,
    unlinkSOP,
  };
}

/**
 * Combined hook for all QMS node process data
 */
export function useQmsNodeData(companyId: string | undefined, nodeId: string | undefined) {
  const processQuery = useQmsNodeProcess(companyId, nodeId);
  const sopsQuery = useQmsNodeSOPs(companyId, nodeId);
  const mutations = useQmsNodeProcessMutations(companyId, nodeId);

  return {
    process: processQuery.data,
    sops: sopsQuery.data || [],
    isLoading: processQuery.isLoading || sopsQuery.isLoading,
    isError: processQuery.isError || sopsQuery.isError,
    ...mutations,
  };
}

// ============================================
// SOP Requirements Status Types and Hook
// ============================================

export interface SOPRequirementStatus {
  sopNumber: string;
  /** Three-part display ID, e.g. "SOP-QA-003" — falls back to the canonical
   *  two-part code when the SOP is not in the functional sub-prefix map. */
  displayId: string;
  /** Live document title from the registry, with a canonical fallback drawn
   *  from `SOP_FULL_CONTENT` when the SOP has not yet been seeded. */
  documentName: string;
  status: 'approved' | 'draft' | 'in-review' | 'missing' | 'not-applicable';
  documentId?: string;
  tier?: SopTier | null;
  /** When `tier === 'B'`, the regulatory trigger that gates auto-seeding. */
  trigger?: SopTrigger;
  /** True when this row resolved via a user-set manual override link
   *  (rather than name-based auto-matching). */
  manuallyLinked?: boolean;
}

/**
 * Fetch the status of required SOPs for a specific node
 * Checks company documents against the static SOP recommendations
 */
async function fetchSOPRequirementsStatus(
  companyId: string,
  nodeId: string
): Promise<SOPRequirementStatus[]> {
  const recommendations = NODE_SOP_RECOMMENDATIONS[nodeId] || [];

  if (recommendations.length === 0) {
    return [];
  }

  // Pull every SOP-style row for this company once; we'll match by SOP number
  // below. We don't pre-filter by SOP number because the registry sometimes
  // stores names like "SOP-0003 ..." (zero-padded) or "SOP-003 - ...".
  type DocResult = { id: string; name: string | null; status: string | null };
  let documents: DocResult[] = [];

  try {
    const response = await supabase
      .from('phase_assigned_document_template')
      .select('id, name, status')
      .eq('company_id', companyId)
      .in('document_scope', ['company_document', 'company_template']);

    if (response.error) {
      console.error('Error fetching SOP documents:', response.error);
      return recommendations.map((r) => buildMissingStatus(r.sopNumber));
    }

    documents = (response.data || []) as DocResult[];
  } catch (e) {
    console.error('Error fetching SOP documents:', e);
    return recommendations.map((r) => buildMissingStatus(r.sopNumber));
  }

  // Pull manual override links for this company so they take precedence
  // over name-based auto-matching.
  const manualLinks = await QmsManualSopLinkService.getForCompany(companyId);
  const manualBySop = new Map(manualLinks.map((l) => [l.sop_number.toUpperCase(), l.document_id]));

  return recommendations.map((rec) => {
    // 1. Manual override wins.
    const manualDocId = manualBySop.get(rec.sopNumber.toUpperCase());
    if (manualDocId) {
      const manualDoc = documents.find((d) => d.id === manualDocId);
      if (manualDoc) {
        return buildResolvedStatus(rec.sopNumber, manualDoc, true);
      }
    }

    // Match registry rows by canonical SOP number. We accept both 3-digit
    // (SOP-003) and zero-padded 4-digit (SOP-0003) variants, plus the
    // 3-part display form (SOP-QA-003).
    const canonical = rec.sopNumber.toUpperCase();        // "SOP-003"
    const numeric = canonical.replace(/^SOP-/, '');       // "003"
    const matchingDoc = documents.find((doc) => {
      const name = (doc.name || '').toUpperCase();
      if (!name) return false;
      // Strip the functional sub-prefix (QA/DE/RM/...) so SOP-QA-003 also matches.
      const normalized = name.replace(/^SOP-[A-Z]{2,3}-/, 'SOP-');
      return (
        normalized.startsWith(canonical) ||
        normalized.includes(`SOP-${numeric}`) ||
        normalized.includes(`SOP-0${numeric}`) // zero-padded variant
      );
    });

    return buildResolvedStatus(rec.sopNumber, matchingDoc);
  });
}

function canonicalSopTitle(sopKey: string): string {
  return SOP_FULL_CONTENT[sopKey]?.title || sopKey;
}

function tierMetadata(sopKey: string): {
  tier: SopTier | null;
  trigger?: SopTrigger;
} {
  const tier = getSopTier(sopKey);
  if (tier !== 'B') return { tier };
  const entry = TIER_B_CONDITIONAL.find((s) => s.sop === sopKey);
  return { tier, trigger: entry?.trigger };
}

function buildMissingStatus(sopKey: string): SOPRequirementStatus {
  const meta = tierMetadata(sopKey);
  return {
    sopNumber: sopKey,
    displayId: formatSopDisplayId(sopKey),
    documentName: canonicalSopTitle(sopKey),
    status: 'missing',
    tier: meta.tier,
    trigger: meta.trigger,
  };
}

function buildResolvedStatus(
  sopKey: string,
  matchingDoc: { id: string; name: string | null; status: string | null } | undefined,
  manuallyLinked: boolean = false,
): SOPRequirementStatus {
  const meta = tierMetadata(sopKey);
  if (!matchingDoc) {
    return {
      sopNumber: sopKey,
      displayId: formatSopDisplayId(sopKey),
      documentName: canonicalSopTitle(sopKey),
      status: 'missing',
      tier: meta.tier,
      trigger: meta.trigger,
    };
  }

  const docStatus = matchingDoc.status?.toLowerCase() || '';
  let status: SOPRequirementStatus['status'] = 'draft';
  if (docStatus === 'approved' || docStatus === 'published') {
    status = 'approved';
  } else if (docStatus === 'in review' || docStatus === 'in-review') {
    status = 'in-review';
  }

  // Strip leading SOP code from the live name so it doesn't render twice
  // alongside the displayId chip. Examples we want to clean:
  //   "SOP-003 Management Review"          → "Management Review"
  //   "SOP-003 - Management Review"        → "Management Review"
  //   "SOP-0003_Document management"       → "Document management"
  //   "SOP-QA-003 Management Review"       → "Management Review"
  // For manually linked documents we keep the user's name verbatim — they
  // chose it on purpose and a manual link may point to a doc that doesn't
  // start with an SOP code at all.
  const rawName = matchingDoc.name || canonicalSopTitle(sopKey);
  const cleanedName = manuallyLinked
    ? rawName
    : rawName.replace(/^SOP-(?:[A-Z]{2,3}-)?\d{3,4}\s*[-_:.\s]\s*/i, '').trim() || canonicalSopTitle(sopKey);

  return {
    sopNumber: sopKey,
    displayId: formatSopDisplayId(sopKey),
    documentName: cleanedName,
    status,
    documentId: matchingDoc.id,
    tier: meta.tier,
    trigger: meta.trigger,
    manuallyLinked,
  };
}

/**
 * Hook to fetch SOP requirements status for a node
 * Shows which recommended SOPs exist and their status
 */
export function useNodeSOPRequirements(
  companyId: string | undefined,
  nodeId: string | undefined
) {
  return useQuery({
    queryKey: QUERY_KEYS.sopRequirements(companyId || '', nodeId || ''),
    queryFn: () => fetchSOPRequirementsStatus(companyId!, nodeId!),
    enabled: !!companyId && !!nodeId,
    staleTime: 1000 * 60 * 5,
  });
}

// ============================================
// Manual SOP link mutations (override layer)
// ============================================

/**
 * Mutations to attach / detach an arbitrary company document to a required
 * SOP slot. After a successful mutation we invalidate every node's
 * requirement query so any other Helix node reflects the change too.
 */
export function useManualSopLinkMutations(companyId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    if (!companyId) return;
    queryClient.invalidateQueries({ queryKey: ['qms-sop-requirements'] });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.manualSopLinks(companyId) });
  };

  const setLink = useMutation({
    mutationFn: async ({ sopNumber, documentId }: { sopNumber: string; documentId: string }) => {
      if (!companyId) throw new Error('Missing companyId');
      const ok = await QmsManualSopLinkService.setLink(companyId, sopNumber, documentId);
      if (!ok) throw new Error('Manual link failed');
      return true;
    },
    onSuccess: invalidate,
  });

  const clearLink = useMutation({
    mutationFn: async (sopNumber: string) => {
      if (!companyId) throw new Error('Missing companyId');
      const ok = await QmsManualSopLinkService.clearLink(companyId, sopNumber);
      if (!ok) throw new Error('Manual unlink failed');
      return true;
    },
    onSuccess: invalidate,
  });

  return { setLink, clearLink };
}
