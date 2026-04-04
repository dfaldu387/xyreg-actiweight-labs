import { supabase } from "@/integrations/supabase/client";
import { GapAnalysisTemplate, GapChecklistItem, ImportanceLevel, TemplateScope } from "@/types/gapAnalysisTemplate";
import type { Database } from "@/integrations/supabase/types";

export interface CompanyPhase {
  id: string;
  name: string;
  company_id: string;
  position: number;
}

type GapTemplateItemInsert = Database["public"]["Tables"]["gap_template_items"]["Insert"];
type GapTemplateItemUpdate = Database["public"]["Tables"]["gap_template_items"]["Update"];
type GapTemplateItemRow = Database["public"]["Tables"]["gap_template_items"]["Row"];

export interface CompanyGapTemplate {
  id: string;
  company_id: string;
  template_id: string;
  is_enabled: boolean;
  company_notes?: string;
  created_at: string;
  updated_at: string;
  template: GapAnalysisTemplate;
}

export interface GapTemplateWithItems extends GapAnalysisTemplate {
  checklistItems: GapChecklistItem[];
}

export class CompanyGapTemplateService {
  static async getCompanyTemplates(companyId: string): Promise<CompanyGapTemplate[]> {
    const { data, error } = await supabase
      .from('company_gap_templates')
      .select(`
        *,
        template:gap_analysis_templates(*)
      `)
      .eq('company_id', companyId)
      .order('created_at');

    if (error) throw error;
    
    return (data || []).map(item => ({
      ...item,
      template: {
        ...item.template,
        isActive: item.template.is_active,
        isCustom: item.template.is_custom,
        createdAt: item.template.created_at,
        updatedAt: item.template.updated_at,
        importance: item.template.importance as ImportanceLevel,
        scope: item.template.scope as TemplateScope
      }
    }));
  }

  static async getAvailableTemplates(): Promise<GapTemplateWithItems[]> {
    const { data, error } = await supabase
      .from('gap_analysis_templates')
      .select(`
        *,
        checklistItems:gap_template_items(
          id,
          item_number,
          requirement_text,
          clause_reference,
          category,
          priority,
          sort_order
        )
      `)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    
    return (data || []).map(template => ({
      ...template,
      isActive: template.is_active,
      isCustom: template.is_custom,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
      importance: template.importance as ImportanceLevel,
      scope: template.scope as TemplateScope,
      checklistItems: (template.checklistItems || [])
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        .map(item => ({
          ...item,
          clause: item.clause_reference || '',
          section: item.clause_reference || '',
          requirement: item.requirement_text,
          description: item.requirement_text,
          category: (item.category as any) || 'documentation',
          priority: (item.priority as any) || 'medium',
          framework: template.framework,
          chapter: item.clause_reference || ''
        }))
    }));
  }

  static async enableTemplate(companyId: string, templateId: string): Promise<void> {
    const { error } = await supabase
      .from('company_gap_templates')
      .upsert({
        company_id: companyId,
        template_id: templateId,
        is_enabled: true
      }, {
        onConflict: 'company_id,template_id'
      });

    if (error) throw error;
    // Note: Gap analysis item creation is now handled by the sync service
  }


  static async disableTemplate(companyId: string, templateId: string): Promise<void> {
    const { error } = await supabase
      .from('company_gap_templates')
      .upsert({
        company_id: companyId,
        template_id: templateId,
        is_enabled: false
      }, {
        onConflict: 'company_id,template_id'
      });

    if (error) throw error;
  }

  static async updateTemplateNotes(companyId: string, templateId: string, notes: string): Promise<void> {
    const { error } = await supabase
      .from('company_gap_templates')
      .upsert({
        company_id: companyId,
        template_id: templateId,
        company_notes: notes
      }, {
        onConflict: 'company_id,template_id'
      });

    if (error) throw error;
  }

  static async updateTemplateScope(templateId: string, scope: TemplateScope): Promise<void> {
    const { error } = await supabase
      .from('gap_analysis_templates')
      .update({ scope })
      .eq('id', templateId);

    if (error) throw error;
  }

  static async getEnabledTemplatesForCompany(companyId: string): Promise<GapTemplateWithItems[]> {
    const { data, error } = await supabase
      .from('company_gap_templates')
      .select(`
        template:gap_analysis_templates(
          *,
          checklistItems:gap_template_items(
            id,
            item_number,
            requirement_text,
            clause_reference,
            category,
            priority,
            sort_order
          )
        )
      `)
      .eq('company_id', companyId)
      .eq('is_enabled', true);

    if (error) throw error;
    return (data || []).map(item => {
      const template = Array.isArray(item.template) ? item.template[0] : item.template;
      if (!template) return null;
      return {
        ...template,
        isActive: template.is_active,
        isCustom: template.is_custom,
        createdAt: template.created_at,
        updatedAt: template.updated_at,
        importance: template.importance as ImportanceLevel,
        scope: template.scope as TemplateScope,
        checklistItems: (template.checklistItems || [])
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          .map(checkItem => ({
            ...checkItem,
            clause: checkItem.clause_reference || '',
            section: checkItem.clause_reference || '',
            requirement: checkItem.requirement_text,
            description: checkItem.requirement_text,
            category: (checkItem.category as any) || 'documentation',
            priority: (checkItem.priority as any) || 'medium',
            framework: template.framework,
            chapter: checkItem.clause_reference || ''
          }))
      };
    }).filter(Boolean);
  }

  // CRUD Operations for Template Items
  static async getTemplateItems(templateId: string): Promise<GapTemplateItemRow[]> {
    const { data, error } = await supabase
      .from('gap_template_items')
      .select('*')
      .eq('template_id', templateId)
      .order('sort_order');

    if (error) throw error;
    return data || [];
  }

  static async createTemplateItem(templateId: string, item: Omit<GapTemplateItemInsert, 'template_id'>): Promise<GapTemplateItemRow> {
    const { data, error } = await supabase
      .from('gap_template_items')
      .insert({
        ...item,
        template_id: templateId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTemplateItem(itemId: string, updates: GapTemplateItemUpdate): Promise<GapTemplateItemRow> {
    const { data, error } = await supabase
      .from('gap_template_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteTemplateItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('gap_template_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  }

  static async reorderTemplateItems(templateId: string, itemsWithOrder: { id: string; sort_order: number }[]): Promise<void> {
    const updates = itemsWithOrder.map(item => 
      supabase
        .from('gap_template_items')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter(result => result.error);
    
    if (errors.length > 0) {
      throw errors[0].error;
    }
  }

  // Phase Management Methods
  static async getCompanyPhases(companyId: string): Promise<CompanyPhase[]> {
    const { data, error } = await supabase
      .from('company_chosen_phases')
      .select(`
        phase:company_phases(
          id,
          name,
          company_id,
          position
        )
      `)
      .eq('company_id', companyId)
      .order('position');

    if (error) throw error;
    
    return (data || [])
      .map(item => Array.isArray(item.phase) ? item.phase[0] : item.phase)
      .filter(Boolean);
  }

  static async updateTemplatePhases(templateId: string, phaseIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('gap_analysis_templates')
      .update({ 
        applicable_phases: phaseIds.length > 0 ? JSON.stringify(phaseIds) : null 
      })
      .eq('id', templateId);

    if (error) throw error;
  }

  static getTemplatePhases(template: any): string[] {
    if (!template.applicable_phases) return [];
    
    try {
      return Array.isArray(template.applicable_phases) 
        ? template.applicable_phases 
        : JSON.parse(template.applicable_phases);
    } catch {
      return [];
    }
  }

  static formatPhaseDisplay(template: any, phases: CompanyPhase[]): string {
    const templatePhases = this.getTemplatePhases(template);
    
    if (templatePhases.length === 0) return "All Phases";
    
    const phaseNames = templatePhases
      .map(phaseId => phases.find(p => p.id === phaseId)?.name)
      .filter(Boolean);
    
    if (phaseNames.length === 0) return "Unassigned";
    if (phaseNames.length <= 2) return phaseNames.join(", ");
    
    return `${phaseNames.slice(0, 2).join(", ")} +${phaseNames.length - 2} more`;
  }
}