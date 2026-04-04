import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Enhanced document operations with proper foreign key constraint handling
 */
export class EnhancedDocumentOperations {
  /**
   * Enhanced document removal with proper dependency handling
   */
  static async removeDocumentFromPhaseById(
    documentName: string,
    phaseId: string,
    companyIdentifier: string
  ): Promise<boolean> {
    // console.log('[EnhancedDocumentOperations] Starting phase ID-based document removal:', { documentName, phaseId, companyIdentifier, timestamp: new Date().toISOString() });

    try {
      // Step 1: Authenticate user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('[EnhancedDocumentOperations] Authentication failed:', authError);
        throw new Error('Authentication required');
      }
      // console.log('[EnhancedDocumentOperations] User authenticated:', user.id);

      // Step 2: Resolve company identifier to UUID
      const companyId = await this.resolveCompanyId(companyIdentifier);
      // console.log('[EnhancedDocumentOperations] Company ID resolved:', companyId);

      // Step 3: Verify user access to company
      await this.verifyUserAccess(user.id, companyId);
      // console.log('[EnhancedDocumentOperations] User access verified');

      // Step 4: Verify phase belongs to company
      await this.verifyPhaseOwnership(phaseId, companyId);
      // console.log('[EnhancedDocumentOperations] Phase ownership verified');

      // Step 5: Get the document record to delete
      const documentRecord = await this.getDocumentRecord(documentName, phaseId);
      // console.log('[EnhancedDocumentOperations] Document record found:', documentRecord);

      // Step 6: Handle foreign key dependencies before deletion
      await this.handleDependenciesBeforeDeletion(documentRecord);
      // console.log('[EnhancedDocumentOperations] Dependencies handled');

      // Step 7: Perform deletion
      const success = await this.performDeletion(documentName, phaseId);
      // console.log('[EnhancedDocumentOperations] Deletion completed:', success);

      if (success) {
        toast.success(`Successfully removed "${documentName}" from phase`);
        return true;
      } else {
        throw new Error('Deletion operation failed');
      }

    } catch (error) {
      console.error('[EnhancedDocumentOperations] Enhanced removal failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[EnhancedDocumentOperations] Error details:', {
        message: errorMessage,
        documentName,
        phaseId,
        companyIdentifier
      });

      // Provide specific error feedback
      if (errorMessage.includes('Authentication')) {
        toast.error('Authentication required - please log in again');
      } else if (errorMessage.includes('Company not found')) {
        toast.error(`Company "${companyIdentifier}" not found`);
      } else if (errorMessage.includes('No access')) {
        toast.error(`No access to company "${companyIdentifier}"`);
      } else if (errorMessage.includes('Phase not owned')) {
        toast.error(`Phase does not belong to this company`);
      } else if (errorMessage.includes('Document not found')) {
        toast.error(`Document "${documentName}" not found in phase`);
      } else if (errorMessage.includes('RLS policy')) {
        toast.error(`Permission denied - insufficient privileges for this operation`);
      } else if (errorMessage.includes('foreign key constraint')) {
        toast.error(`Cannot delete: document is referenced by other records`);
      } else {
        toast.error(`Failed to remove document: ${errorMessage}`);
      }

      return false;
    }
  }

  /**
   * Get the document record that needs to be deleted
   */
  private static async getDocumentRecord(documentName: string, phaseId: string): Promise<any> {
    const { data: document, error } = await supabase
      .from('phase_assigned_documents')
      .select('id, name')
      .eq('phase_id', phaseId)
      .eq('name', documentName)
      .maybeSingle();

    if (error) {
      console.error('[EnhancedDocumentOperations] Document lookup failed:', error);
      throw new Error(`Document lookup failed: ${error.message}`);
    }

    if (!document) {
      console.error('[EnhancedDocumentOperations] Document not found in phase');
      throw new Error(`Document not found in phase`);
    }

    return document;
  }

  /**
   * Handle foreign key dependencies before deletion
   */
  private static async handleDependenciesBeforeDeletion(documentRecord: any): Promise<void> {
    // console.log('[EnhancedDocumentOperations] Handling dependencies for document:', documentRecord.id);

    // Find any documents table records that reference this phase_assigned_documents record
    const { data: dependentRecords, error: lookupError } = await supabase
      .from('documents')
      .select('id, name, template_source_id')
      .eq('template_source_id', documentRecord.id);

    if (lookupError) {
      console.error('[EnhancedDocumentOperations] Dependency lookup failed:', lookupError);
      throw new Error(`Dependency lookup failed: ${lookupError.message}`);
    }

    if (dependentRecords && dependentRecords.length > 0) {
      // console.log('[EnhancedDocumentOperations] Found dependent records:', dependentRecords.length);

      // Update dependent records to remove the foreign key reference
      const { error: updateError } = await supabase
        .from('documents')
        .update({ template_source_id: null })
        .eq('template_source_id', documentRecord.id);

      if (updateError) {
        console.error('[EnhancedDocumentOperations] Failed to update dependent records:', updateError);
        throw new Error(`Failed to update dependent records: ${updateError.message}`);
      }

      // console.log('[EnhancedDocumentOperations] Successfully updated dependent records');
    } else {
      // console.log('[EnhancedDocumentOperations] No dependent records found');
    }
  }

  /**
   * Get phase ID from phase name with EXACT matching only - NO smart matching
   */
  static async getPhaseIdFromName(phaseName: string, companyId: string): Promise<string | null> {
    // console.log('[EnhancedDocumentOperations] Looking up phase ID for EXACT name:', phaseName);

    try {
      // EXACT match only - no fuzzy matching, no name modifications
      const { data: phase, error } = await supabase
        .from('phases')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('name', phaseName) // EXACT match only
        .maybeSingle();

      if (error) {
        console.error('[EnhancedDocumentOperations] Error fetching phase:', error);
        return null;
      }

      if (phase) {
        // console.log('[EnhancedDocumentOperations] Found EXACT phase match:', phase);
        return phase.id;
      }

      console.error('[EnhancedDocumentOperations] No EXACT phase match found for:', phaseName);
      
      // Get all available phases to help with debugging
      const { data: allPhases, error: allPhasesError } = await supabase
        .from('phases')
        .select('id, name')
        .eq('company_id', companyId);

      if (!allPhasesError && allPhases) {
        console.error('[EnhancedDocumentOperations] Available phase names in database:', allPhases.map(p => p.name));
      }

      return null;

    } catch (error) {
      console.error('[EnhancedDocumentOperations] Error in EXACT phase ID lookup:', error);
      return null;
    }
  }

  /**
   * Resolve company identifier to UUID with fallback strategies (now public)
   */
  static async resolveCompanyId(companyIdentifier: string): Promise<string> {
    // Check if already a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(companyIdentifier)) {
      // console.log('[EnhancedDocumentOperations] Company identifier is already UUID');
      return companyIdentifier;
    }

    // Decode URL-encoded name
    const decodedName = decodeURIComponent(companyIdentifier);
    // console.log('[EnhancedDocumentOperations] Looking up company by name:', decodedName);

    const { data: company, error } = await supabase
      .from('companies')
      .select('id, name')
      .eq('name', decodedName)
      .single();

    if (error || !company) {
      console.error('[EnhancedDocumentOperations] Company lookup failed:', error);
      throw new Error(`Company not found: ${decodedName}`);
    }

    // console.log('[EnhancedDocumentOperations] Company found:', company);
    return company.id;
  }

  /**
   * Verify user has access to the company
   */
  private static async verifyUserAccess(userId: string, companyId: string): Promise<void> {
    const { data: userAccess, error } = await supabase
      .from('user_company_access')
      .select('company_id, access_level')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .single();

    if (error || !userAccess) {
      console.error('[EnhancedDocumentOperations] User access check failed:', error);
      throw new Error(`No access to company`);
    }

    // console.log('[EnhancedDocumentOperations] User access level:', userAccess.access_level);
  }

  /**
   * Verify phase belongs to the company
   */
  private static async verifyPhaseOwnership(phaseId: string, companyId: string): Promise<void> {
    const { data: phase, error } = await supabase
      .from('phases')
      .select('id, name, company_id')
      .eq('id', phaseId)
      .eq('company_id', companyId)
      .single();

    if (error || !phase) {
      console.error('[EnhancedDocumentOperations] Phase ownership verification failed:', error);
      throw new Error(`Phase not owned by company`);
    }

    // console.log('[EnhancedDocumentOperations] Phase ownership verified:', phase);
  }

  /**
   * Verify document exists in the specified phase
   */
  private static async verifyDocumentInPhase(documentName: string, phaseId: string): Promise<void> {
    const { data: document, error } = await supabase
      .from('phase_assigned_documents')
      .select('id, name')
      .eq('phase_id', phaseId)
      .eq('name', documentName)
      .maybeSingle();

    if (error) {
      console.error('[EnhancedDocumentOperations] Document verification failed:', error);
      throw new Error(`Document verification failed: ${error.message}`);
    }

    if (!document) {
      console.error('[EnhancedDocumentOperations] Document not found in phase');
      throw new Error(`Document not found in phase`);
    }

    // console.log('[EnhancedDocumentOperations] Document verified:', document);
  }

  /**
   * Perform the actual deletion with retry logic
   */
  private static async performDeletion(documentName: string, phaseId: string): Promise<boolean> {
    // console.log('[EnhancedDocumentOperations] Starting deletion operation');

    // Retry deletion up to 3 times
    for (let attempt = 1; attempt <= 3; attempt++) {
      // console.log(`[EnhancedDocumentOperations] Deletion attempt ${attempt}`);

      try {
        const { error, count } = await supabase
          .from('phase_assigned_documents')
          .delete({ count: 'exact' })
          .eq('phase_id', phaseId)
          .eq('name', documentName);

        if (error) {
          console.error(`[EnhancedDocumentOperations] Deletion attempt ${attempt} failed:`, error);
          
          if (attempt === 3) {
            throw new Error(`Deletion failed after 3 attempts: ${error.message}`);
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }

        // console.log(`[EnhancedDocumentOperations] Deletion successful, rows affected:`, count);
        
        if (count === 0) {
          console.warn('[EnhancedDocumentOperations] No rows were deleted - document may not exist');
          throw new Error('No rows deleted - document not found');
        }

        return true;

      } catch (error) {
        console.error(`[EnhancedDocumentOperations] Deletion attempt ${attempt} error:`, error);
        
        if (attempt === 3) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    return false;
  }

  /**
   * Improved normalize phase name for comparison by removing formatting and standardizing text
   */
  private static normalizePhaseNameForComparison(name: string): string {
    return name
      .toLowerCase()
      .replace(/^\(\d+\)\s*/, '') // Remove leading (1), (2), etc.
      .replace(/^\d+\)\s*/, '')   // Remove leading 1), 2), etc.
      .replace(/^\d+\.\s*/, '')   // Remove leading 1., 2., etc.
      .replace(/^\d+\s*[-–—]\s*/, '') // Remove leading 1 -, 2 –, etc.
      .replace(/[^\w\s&]/g, ' ')  // Replace special chars with space (keep &)
      .replace(/\s+/g, ' ')       // Normalize whitespace
      .trim();
  }

  /**
   * Extract core words from a normalized string for word-based matching
   */
  private static extractCoreWords(normalizedString: string): string[] {
    const commonWords = ['and', 'or', 'the', 'a', 'an', 'is', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return normalizedString
      .split(' ')
      .filter(word => word.length > 2 && !commonWords.includes(word))
      .map(word => word.toLowerCase());
  }

  /**
   * Get current company identifier from URL path
   */
  static getCurrentCompanyIdentifier(): string | null {
    if (typeof window === 'undefined') return null;
    
    const pathParts = window.location.pathname.split('/');
    const companyIndex = pathParts.indexOf('company');
    
    if (companyIndex !== -1 && pathParts[companyIndex + 1]) {
      return pathParts[companyIndex + 1];
    }
    
    return null;
  }
}
