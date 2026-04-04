import { supabase } from '@/integrations/supabase/client';

export interface TemplateResponse {
  id: string;
  activity_id: string;
  company_id: string;
  template_type: string;
  template_data: any;
  completion_status: 'in_progress' | 'completed' | 'approved';
  completed_at?: string;
  completed_by?: string;
  created_at: string;
  updated_at: string;
}

export class TemplateResponseService {
  static async createResponse(
    activityId: string,
    companyId: string,
    templateType: string,
    initialData: any = {}
  ): Promise<TemplateResponse | null> {
    try {
      const { data, error } = await supabase
        .from('template_responses')
        .insert({
          activity_id: activityId,
          company_id: companyId,
          template_type: templateType,
          template_data: initialData,
          completion_status: 'in_progress'
        })
        .select()
        .single();

      if (error) throw error;
      return data as TemplateResponse;
    } catch (error) {
      console.error('Error creating template response:', error);
      return null;
    }
  }

  static async getResponse(activityId: string): Promise<TemplateResponse | null> {
    try {
      const { data, error } = await supabase
        .from('template_responses')
        .select('*')
        .eq('activity_id', activityId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return (data as TemplateResponse) || null;
    } catch (error) {
      console.error('Error fetching template response:', error);
      return null;
    }
  }

  static async updateResponse(
    responseId: string,
    updates: Partial<TemplateResponse>
  ): Promise<TemplateResponse | null> {
    try {
      const { data, error } = await supabase
        .from('template_responses')
        .update(updates)
        .eq('id', responseId)
        .select()
        .single();

      if (error) throw error;
      return data as TemplateResponse;
    } catch (error) {
      console.error('Error updating template response:', error);
      return null;
    }
  }

  static async saveProgress(
    responseId: string,
    sectionId: string,
    sectionData: any
  ): Promise<boolean> {
    try {
      // Get current response data
      const { data: response, error: fetchError } = await supabase
        .from('template_responses')
        .select('template_data')
        .eq('id', responseId)
        .single();

      if (fetchError) throw fetchError;

      const currentData = (response.template_data as any) || {};
      const updatedData = {
        ...currentData,
        sections: {
          ...(currentData.sections || {}),
          [sectionId]: sectionData
        }
      };

      const { error } = await supabase
        .from('template_responses')
        .update({ template_data: updatedData })
        .eq('id', responseId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving section progress:', error);
      return false;
    }
  }

  static async markCompleted(
    responseId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('template_responses')
        .update({
          completion_status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: userId
        })
        .eq('id', responseId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking template completed:', error);
      return false;
    }
  }

  static calculateCompletionPercentage(templateData: any, sections: any[]): number {
    if (!sections.length) return 0;

    const completedSections = sections.filter(section => {
      const sectionData = templateData.sections?.[section.id];
      if (!sectionData) return false;

      if (section.section_type === 'checklist') {
        const items = section.phase_specific_data?.items || [];
        const checkedItems = sectionData.checkedItems || {};
        return items.every((_, index) => checkedItems[index]);
      }

      if (section.section_type === 'form') {
        const fields = section.phase_specific_data?.fields || [];
        const responses = sectionData.responses || {};
        return fields.every(field => responses[field.label]?.trim());
      }

      return true;
    });

    return Math.round((completedSections.length / sections.length) * 100);
  }
}