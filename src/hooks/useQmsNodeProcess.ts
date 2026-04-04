/**
 * React Query hook for QMS Node Internal Processes and SOP Links
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  QmsNodeProcessService, 
  QmsNodeProcess, 
  QmsNodeSopLink,
  ProcessStep 
} from '@/services/qmsNodeProcessService';
import { supabase } from '@/integrations/supabase/client';
import { NODE_SOP_RECOMMENDATIONS } from '@/data/nodeSOPRecommendations';

const QUERY_KEYS = {
  nodeProcess: (companyId: string, nodeId: string) => 
    ['qms-node-process', companyId, nodeId] as const,
  linkedSOPs: (companyId: string, nodeId: string) => 
    ['qms-node-sops', companyId, nodeId] as const,
  availableSOPs: (companyId: string) => 
    ['qms-available-sops', companyId] as const,
  sopRequirements: (companyId: string, nodeId: string) =>
    ['qms-sop-requirements', companyId, nodeId] as const,
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
      steps 
    }: { 
      description: string; 
      steps?: ProcessStep[] 
    }) => {
      if (!companyId || !nodeId) throw new Error('Missing companyId or nodeId');
      return QmsNodeProcessService.upsertNodeProcess(companyId, nodeId, description, steps);
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
  status: 'approved' | 'draft' | 'in-review' | 'missing';
  documentId?: string;
  documentName?: string;
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

  // Get SOP numbers to search for
  const sopNumbers = recommendations.map(r => r.sopNumber);

  // Query phase_assigned_document_template for matching SOPs
  // Include both company_document and company_template scopes
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
      return recommendations.map(r => ({
        sopNumber: r.sopNumber,
        status: 'missing' as const,
      }));
    }
    
    documents = (response.data || []) as DocResult[];
  } catch (e) {
    console.error('Error fetching SOP documents:', e);
    return recommendations.map(r => ({
      sopNumber: r.sopNumber,
      status: 'missing' as const,
    }));
  }

  // Match documents to SOP numbers
  return recommendations.map(rec => {
    // Find a document that matches this SOP number
    const matchingDoc = documents?.find(doc => {
      const docName = doc.name?.toUpperCase() || '';
      const sopNum = rec.sopNumber.toUpperCase();
      // Match if document name starts with the SOP number
      return docName.startsWith(sopNum) || docName.includes(sopNum);
    });

    if (!matchingDoc) {
      return {
        sopNumber: rec.sopNumber,
        status: 'missing' as const,
      };
    }

    // Map document status to our status type
    const docStatus = matchingDoc.status?.toLowerCase() || '';
    let status: SOPRequirementStatus['status'] = 'draft';
    
    if (docStatus === 'approved' || docStatus === 'published') {
      status = 'approved';
    } else if (docStatus === 'in review' || docStatus === 'in-review') {
      status = 'in-review';
    }

    return {
      sopNumber: rec.sopNumber,
      status,
      documentId: matchingDoc.id,
      documentName: matchingDoc.name,
    };
  });
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
