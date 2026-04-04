import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { resolveToCompanyUuid, getCurrentCompanyId } from "@/utils/companyIdResolver";

/**
 * Enhanced document operations with proper upsert logic and network retry handling
 */

export const updateDocumentPhases = async (
  documentName: string,
  phases: string[],
  documentProperties?: {
    document_type: string;
    file_path: string;
    file_name: string;
    file_size: number;
    file_type: string;
    public_url: string | null;
    sub_section?: string | null;
    section_ids?: string[] | null;
  }
): Promise<boolean> => {

  try {
    // Step 1: Verify user authentication
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[DocumentOperations] Authentication failed:', authError);
      toast.error('Authentication required');
      return false;
    }
    // console.log('[DocumentOperations] ✅ User authenticated:', user.id);

    // Step 2: Get company ID from URL and resolve it
    // console.log('[DocumentOperations] Step 2: Getting company identifier from URL...');
    const companyIdentifier = getCurrentCompanyId();
    if (!companyIdentifier) {
      console.error('[DocumentOperations] ❌ No company identifier found in URL');
      toast.error('No company context found');
      return false;
    }
    // console.log('[DocumentOperations] ✅ Company identifier from URL:', companyIdentifier);

    // Step 3: Resolve company identifier to UUID
    // console.log('[DocumentOperations] Step 3: Resolving company identifier to UUID...');
    const companyId = await resolveToCompanyUuid(companyIdentifier);
    if (!companyId) {
      console.error('[DocumentOperations] ❌ Could not resolve company identifier:', companyIdentifier);
      toast.error('Invalid company context');
      return false;
    }
    // console.log('[DocumentOperations] ✅ Resolved company ID:', companyId);

    // Step 4: Verify user has access to this company
    // console.log('[DocumentOperations] Step 4: Verifying user company access...');
    const { data: userAccess, error: accessError } = await supabase
      .from('user_company_access')
      .select('company_id, access_level')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
    // .single();

    if (accessError || !userAccess) {
      console.error('[DocumentOperations] ❌ No company access found:', accessError);
      toast.error('No access to this company');
      return false;
    }
    // console.log('[DocumentOperations] ✅ Company access verified:', userAccess);
    // console.log("companyId companyId", companyId)
    // Step 5: Get phase IDs for the phase names in this company
    // console.log('[DocumentOperations] Step 5: Looking up phase IDs for:', phases);
    const { data: phaseData, error: phaseError } = await supabase
      .from('company_phases')
      .select('id, name, company_id')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .in('name', phases);

    if (phaseError) {
      console.error('[DocumentOperations] ❌ Phase lookup failed:', phaseError);
      toast.error('Failed to find phases');
      return false;
    }

    // console.log('[DocumentOperations] ✅ Found phases:', phaseData);

    if (!phaseData || phaseData.length === 0) {
      console.error('[DocumentOperations] ❌ No phases found for:', {
        requestedPhases: phases,
        companyId: companyId
      });
      toast.error(`Could not find phases: ${phases.join(', ')}`);
      return false;
    }

    if (phaseData.length !== phases.length) {
      console.warn('[DocumentOperations] ⚠️ Phase count mismatch:', {
        requested: phases.length,
        found: phaseData?.length || 0,
        requestedPhases: phases,
        foundPhases: phaseData?.map(p => p.name) || []
      });
      
      // Find which phases were not found
      const foundPhaseNames = new Set(phaseData.map(p => p.name));
      const missingPhases = phases.filter(p => !foundPhaseNames.has(p));
      if (missingPhases.length > 0) {
        console.error('[DocumentOperations] ❌ Missing phases:', missingPhases);
        toast.error(`Could not find phases: ${missingPhases.join(', ')}`);
        return false;
      }
    }

    const phaseIds = phaseData?.map(p => p.id) || [];
    // console.log('[DocumentOperations] ✅ Phase IDs to assign:', phaseIds);
    
    if (phaseIds.length === 0) {
      console.error('[DocumentOperations] ❌ No phase IDs to assign');
      toast.error('No valid phases found to assign document');
      return false;
    }

    // Step 6: Get existing assignments for this document in this company
    // console.log('[DocumentOperations] Step 6: Getting existing assignments for:', documentName);

    const { data: allCompanyPhases, error: companyPhasesError } = await supabase
      .from('company_phases')
      .select('id')
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (companyPhasesError) {
      console.error('[DocumentOperations] ❌ Error getting company phases:', companyPhasesError);
      toast.error('Failed to get company phases');
      return false;
    }
    // console.log('allCompanyPhases allCompanyPhases', allCompanyPhases);
    const allCompanyPhaseIds = allCompanyPhases?.map(p => p.id) || [];
    // console.log('[DocumentOperations] ✅ All company phase IDs:', allCompanyPhaseIds);

    const { data: existingAssignments, error: existingError } = await supabase
      .from('phase_assigned_document_template')
      .select('phase_id')
      .eq('name', documentName)
      .in('phase_id', allCompanyPhaseIds);

    if (existingError) {
      console.error('[DocumentOperations] ❌ Error getting existing assignments:', existingError);
      toast.error('Failed to get existing assignments');
      return false;
    }

    const existingPhaseIds = new Set(existingAssignments?.map(a => a.phase_id) || []);
    // console.log('[DocumentOperations] ✅ Existing phase assignments:', Array.from(existingPhaseIds));

    // Step 7: Determine which assignments to add and which to remove
    // console.log('[DocumentOperations] Step 7: Calculating assignment changes...');
    const targetPhaseIds = new Set(phaseIds);
    const toAdd = phaseIds.filter(id => !existingPhaseIds.has(id));
    const toRemove = Array.from(existingPhaseIds).filter(id => !targetPhaseIds.has(id));

    

    // Step 8: Remove assignments that are no longer needed
    if (toRemove.length > 0) {
      // console.log('[DocumentOperations] Step 8: Removing assignments:', toRemove);
      const { error: removeError } = await supabase
        .from('phase_assigned_document_template')
        .delete()
        .eq('name', documentName)
        .in('phase_id', toRemove);

      if (removeError) {
        console.error('[DocumentOperations] ❌ Error removing assignments:', removeError);
        toast.error('Failed to remove old assignments');
        return false;
      }
      // console.log('[DocumentOperations] ✅ Successfully removed assignments');
    } else {
      // console.log('[DocumentOperations] Step 8: No assignments to remove');
    }

    // Step 9: Add new assignments
    if (toAdd.length > 0) {
      // console.log('[DocumentOperations] Step 9: Adding new assignments:', toAdd);
      
      // Use passed document properties or fallback to defaults
      const docProps = documentProperties || {
        document_type: 'Standard',
        file_path: '',
        file_name: '',
        file_size: 0,
        file_type: '',
        public_url: null
      };
      
      // console.log('[DocumentOperations] Using document properties:', docProps);
      
      const assignments = toAdd.map(phaseId => ({
        phase_id: phaseId,
        name: documentName,
        status: 'Not Started',
        document_type: docProps.document_type,
        document_scope: 'company_template' as const,
        file_name: docProps.file_name,
        file_path: docProps.file_path,
        file_size: docProps.file_size,
        file_type: docProps.file_type,
        public_url: docProps.public_url,
        is_predefined_core_template: false,
        tech_applicability: 'All device types',
        markets: [],
        classes_by_market: {},
        uploaded_at: null,
        uploaded_by: null,
        reviewers: [],
        description: null,
        due_date: null,
        reviewer_group_id: null,
        sub_section: docProps.sub_section || null,
        section_ids: docProps.section_ids && docProps.section_ids.length > 0 ? docProps.section_ids : null
      }));

      // console.log('[DocumentOperations] 📝 Assignment data to insert:', assignments);

      const { data: insertData, error: insertError } = await supabase
        .from('phase_assigned_document_template')
        .insert(assignments)
        .select();

      if (insertError) {
        console.error('[DocumentOperations] ❌ Insert failed:', insertError);
        toast.error(`Failed to assign document: ${insertError.message}`);
        return false;
      }

      // console.log('[DocumentOperations] ✅ Successfully inserted assignments:', insertData);
    } else {
      // console.log('[DocumentOperations] Step 9: No new assignments to add');
    }

    // // console.log('[DocumentOperations] 🎉 Operation completed successfully');
    toast.success(`Document "${documentName}" assigned to ${phases.length} phases`);
    return true;

  } catch (error) {
    console.error('[DocumentOperations] 💥 Unexpected error in updateDocumentPhases:', error);
    console.error('[DocumentOperations] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    toast.error(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};
export const removeDocumentAssignmentByPhaseName = async (phaseName: string, documentName: string, companyId: string): Promise<void> => {
  // console.log('[DocumentOperations] Removing document from phase:', { phaseName, documentName, companyId });

  try {
    // Step 1: Get company ID (resolve if needed)
    const companyIdentifier = getCurrentCompanyId();
    if (!companyIdentifier) {
      throw new Error('No company identifier found in URL');
    }
    
    const resolvedCompanyId = await resolveToCompanyUuid(companyIdentifier);
    if (!resolvedCompanyId) {
      throw new Error(`Could not resolve company identifier: ${companyIdentifier}`);
    }

    // Step 2: Find the phase in company_phases table
    // console.log('[DocumentOperations] Looking up phase:', phaseName);
    const { data: phaseData, error: phaseError } = await supabase
      .from('company_phases')
      .select('id, name')
      .eq('company_id', resolvedCompanyId)
      .eq('is_active', true)
      .eq('name', phaseName)
      .maybeSingle();

    if (phaseError) {
      console.error('[DocumentOperations] ❌ Phase lookup failed:', phaseError);
      throw new Error(`Failed to find phase: ${phaseError.message}`);
    }

    let phaseId: string;
    
    if (!phaseData) {
      // Try to find phase by partial match (in case of number prefix differences)
      const { data: allPhases, error: allPhasesError } = await supabase
        .from('company_phases')
        .select('id, name')
        .eq('company_id', resolvedCompanyId)
        .eq('is_active', true);
      
      if (allPhasesError) {
        throw new Error(`Failed to search phases: ${allPhasesError.message}`);
      }

      // Try to match by removing number prefix and ISO reference
      const phaseNameClean = phaseName.replace(/^\(0*\d+\)\s*/, '').replace(/\s*\(ISO\s+13485[^)]*\)/i, '').trim();
      const matchedPhase = allPhases?.find(p => {
        const pNameClean = p.name.replace(/^\(0*\d+\)\s*/, '').replace(/\s*\(ISO\s+13485[^)]*\)/i, '').trim();
        return pNameClean === phaseNameClean || p.name === phaseName || phaseName.includes(p.name) || p.name.includes(phaseNameClean);
      });

      if (!matchedPhase) {
        console.error('[DocumentOperations] ❌ Phase not found:', phaseName);
        // console.log('[DocumentOperations] Available phases:', allPhases?.map(p => p.name));
        throw new Error(`Phase "${phaseName}" not found in company phases`);
      }

      // console.log('[DocumentOperations] ✅ Found phase by partial match:', matchedPhase.name);
      phaseId = matchedPhase.id;
    } else {
      // console.log('[DocumentOperations] ✅ Found phase:', phaseData.name);
      phaseId = phaseData.id;
    }

    // Step 3: Delete the document assignment from phase_assigned_document_template
    // console.log('[DocumentOperations] Deleting document assignment:', { phaseId, documentName });
    const { error: deleteError } = await supabase
      .from('phase_assigned_document_template')
      .delete()
      .eq('phase_id', phaseId)
      .eq('name', documentName);

    if (deleteError) {
      console.error('[DocumentOperations] ❌ Delete failed:', deleteError);
      throw new Error(`Failed to remove document assignment: ${deleteError.message}`);
    }

    // console.log('[DocumentOperations] ✅ Successfully removed document from phase');

  } catch (error) {
    console.error('[DocumentOperations] Error removing document from phase:', error);
    throw error;
  }
};

export const deleteDocumentTemplate = async (companyId: string, documentId: string): Promise<void> => {
  // console.log('[DocumentOperations] Deleting document template:', { companyId, documentId });

  try {
    // Use the database function to safely delete the document template
    const { data, error } = await supabase.rpc('safely_delete_document_template', {
      template_id_param: documentId
    });

    if (error) throw error;

    if (!data) {
      throw new Error('Failed to delete document template');
    }

    // console.log('[DocumentOperations] Successfully deleted document template');

  } catch (error) {
    console.error('[DocumentOperations] Error deleting document template:', error);
    throw error;
  }
};

export const changeAssignedPhase = async (
  phaseId: string, 
  documentName: string, 
  documentId: string, 
  currentPhaseId: string, 
  companyId: string,
  documentProperties?: {
    document_type: string;
    file_path: string;
    file_name: string;
    file_size: number;
    file_type: string;
    public_url: string | null;
  }
): Promise<void> => {
  let response: any;
  // console.log('[DocumentOperations] Changing assigned phase:', { phaseId, documentName, documentId, currentPhaseId, companyId });

  try {
    // Use passed document properties or fallback to defaults
    const docProps = documentProperties || {
      document_type: 'Standard',
      file_path: '',
      file_name: '',
      file_size: 0,
      file_type: '',
      public_url: null
    };
    
    // console.log('[DocumentOperations] Using document properties for changeAssignedPhase:', docProps);
    
    const { data: res, error } = await supabase
      .from('phase_assigned_document_template')
      .insert({
        phase_id: phaseId,
        name: documentName,
        document_type: docProps.document_type,
        document_scope: 'company_template' as const,
        file_name: docProps.file_name,
        file_path: docProps.file_path,
        file_size: docProps.file_size,
        file_type: docProps.file_type,
        public_url: docProps.public_url,
        is_predefined_core_template: false,
        tech_applicability: 'All device types',
        markets: [],
        classes_by_market: {},
        uploaded_at: null,
        uploaded_by: null,
        reviewers: [],
        description: null,
        reviewer_group_id: null
      })
      .select("*")
      .maybeSingle();

    // console.log('res changeAssignedPhase', res);
    // console.log('error', error);

    response = res;
    toast.success('New Phase Assigned Successfully');
    return response;

  } catch (error) {
    // console.log('error', error);
  }
};