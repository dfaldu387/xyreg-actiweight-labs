import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ComplianceSection {
  id: string;
  company_id: string;
  phase_id: string | null;
  user_id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
}

export class ComplianceSectionService {
  /**
   * Get all compliance sections for a company
   */
  async getCompanySections(companyId: string): Promise<ComplianceSection[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('compliance_document_sections')
        .select('*')
        .eq('company_id', companyId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching compliance sections:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCompanySections:', error);
      return [];
    }
  }

  /**
   * Get compliance sections for a specific phase
   */
  async getPhaseSections(phaseId: string): Promise<ComplianceSection[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('compliance_document_sections')
        .select('*')
        .eq('phase_id', phaseId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching phase sections:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPhaseSections:', error);
      return [];
    }
  }

  /**
   * Create a new compliance section
   */
  async createSection(
    companyId: string,
    name: string,
    userId: string,
    createdBy?: string,
    phaseId?: string
  ): Promise<ComplianceSection | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('compliance_document_sections')
        .insert({
          company_id: companyId,
          user_id: userId,
          name: name.trim(),
          created_by: createdBy || null,
          phase_id: phaseId || null
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation
          toast.error(`Section "${name}" already exists`);
        } else {
          console.error('Error creating compliance section:', error);
          toast.error('Failed to create section');
        }
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createSection:', error);
      toast.error('Failed to create section');
      return null;
    }
  }

  /**
   * Update an existing section
   */
  async updateSection(
    sectionId: string,
    updates: Partial<Pick<ComplianceSection, 'name' | 'phase_id'>>
  ): Promise<boolean> {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name.trim();
      if (updates.phase_id !== undefined) updateData.phase_id = updates.phase_id;

      const { error } = await (supabase as any)
        .from('compliance_document_sections')
        .update(updateData)
        .eq('id', sectionId);

      if (error) {
        if (error.code === '23505') {
          toast.error('A section with this name already exists');
        } else {
          console.error('Error updating compliance section:', error);
          toast.error('Failed to update section');
        }
        return false;
      }

      toast.success('Section updated');
      return true;
    } catch (error) {
      console.error('Error in updateSection:', error);
      toast.error('Failed to update section');
      return false;
    }
  }

  /**
   * Delete a section
   */
  async deleteSection(sectionId: string): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('compliance_document_sections')
        .delete()
        .eq('id', sectionId);

      if (error) {
        console.error('Error deleting compliance section:', error);
        toast.error('Failed to delete section');
        return false;
      }

      toast.success('Section deleted');
      return true;
    } catch (error) {
      console.error('Error in deleteSection:', error);
      toast.error('Failed to delete section');
      return false;
    }
  }

  /**
   * Get or create a section by name for a specific phase
   */
  async getOrCreateSection(
    companyId: string,
    name: string,
    userId: string,
    createdBy?: string,
    phaseId?: string
  ): Promise<ComplianceSection | null> {
    try {
      // First try to find existing section by name and phase
      let query = (supabase as any)
        .from('compliance_document_sections')
        .select('*')
        .eq('company_id', companyId)
        .ilike('name', name.trim());

      if (phaseId) {
        query = query.eq('phase_id', phaseId);
      }

      const { data: existing } = await query.maybeSingle();

      if (existing) {
        return existing;
      }

      // If not found, create it (without showing toast for auto-creation)
      const { data, error } = await (supabase as any)
        .from('compliance_document_sections')
        .insert({
          company_id: companyId,
          user_id: userId,
          name: name.trim(),
          created_by: createdBy || null,
          phase_id: phaseId || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error auto-creating section:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getOrCreateSection:', error);
      return null;
    }
  }
}

// Export singleton instance
export const complianceSectionService = new ComplianceSectionService();
