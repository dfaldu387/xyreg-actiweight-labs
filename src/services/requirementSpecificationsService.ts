import { supabase } from "@/integrations/supabase/client";
import type { RequirementSpecification, CreateRequirementSpecificationData, UpdateRequirementSpecificationData } from "@/components/product/design-risk-controls/requirement-specifications/types";

export class RequirementSpecificationsService {
  async getByProductId(productId: string): Promise<RequirementSpecification[]> {
    const { data, error } = await supabase
      .from('requirement_specifications')
      .select('*')
      .eq('product_id', productId)
      .order('requirement_id', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch requirement specifications: ${error.message}`);
    }

    return (data || []) as RequirementSpecification[];
  }

  async getByProductAndType(productId: string, requirementType: 'system' | 'software' | 'hardware'): Promise<RequirementSpecification[]> {
    const { data, error } = await supabase
      .from('requirement_specifications')
      .select('*')
      .eq('product_id', productId)
      .eq('requirement_type', requirementType)
      .order('requirement_id', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch requirement specifications: ${error.message}`);
    }

    return (data || []) as RequirementSpecification[];
  }

  async create(
    productId: string, 
    companyId: string, 
    data: CreateRequirementSpecificationData,
    requirementType: 'system' | 'software' | 'hardware' = 'system',
    categorySuffix?: string,
    lineageBase?: string
  ): Promise<RequirementSpecification> {
    // Generate the next requirement ID with proper prefix
    const { data: nextIdData, error: idError } = await supabase.rpc('generate_requirement_id' as any, {
      p_product_id: productId,
      p_requirement_type: requirementType,
      p_category_suffix: categorySuffix || null,
      p_lineage_base: lineageBase || null
    });

    if (idError) {
      throw new Error(`Failed to generate requirement ID: ${idError.message}`);
    }

    const { data: result, error } = await supabase
      .from('requirement_specifications')
      .insert({
        requirement_id: nextIdData,
        product_id: productId,
        company_id: companyId,
        requirement_type: requirementType,
        description: data.description,
        traces_to: data.traces_to,
        linked_risks: data.linked_risks,
        verification_status: data.verification_status,
        category: data.category,
        component_id: data.component_id || null,
        parent_requirements: [],
        child_requirements: [],
        created_by: (await supabase.auth.getUser()).data.user?.id || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create requirement specification: ${error.message}`);
    }

    return result as RequirementSpecification;
  }

  async update(id: string, data: UpdateRequirementSpecificationData): Promise<RequirementSpecification> {
    const { isObjectBaselined } = await import('./baselineLockService');
    const lockStatus = await isObjectBaselined(id, 'requirement_specification');
    if (lockStatus.locked) {
      throw new Error(`BASELINE_LOCKED: This object was baselined in "${lockStatus.reviewTitle}" on ${lockStatus.baselineDate}. Submit a Change Control Request to modify it.`);
    }

    const { data: result, error } = await supabase
      .from('requirement_specifications')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update requirement specification: ${error.message}`);
    }

    return result as RequirementSpecification;
  }

  async updateWithTraceability(
    id: string, 
    data: UpdateRequirementSpecificationData,
    requirementId: string,
    userNeedIds: string[]
  ): Promise<RequirementSpecification> {
    // Import here to avoid circular dependency
    const { traceabilityService } = await import('./traceabilityService');
    
    // Update the requirement
    const updatedRequirement = await this.update(id, data);
    
    // Update traceability links
    await traceabilityService.updateRequirementUserNeedLinks(requirementId, userNeedIds);
    
    return updatedRequirement;
  }

  async delete(id: string): Promise<void> {
    // First get the requirement to find its requirement_id for traceability cleanup
    const { data: requirement, error: fetchError } = await supabase
      .from('requirement_specifications')
      .select('requirement_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch requirement specification: ${fetchError.message}`);
    }

    // Clean up traceability links first
    const { traceabilityService } = await import('./traceabilityService');
    await traceabilityService.removeRequirementLinks(requirement.requirement_id);

    // Also remove this requirement from any hazards that reference it
    const { data: hazards, error: hazardsFetchError } = await supabase
      .from('hazards')
      .select('id, linked_requirements')
      .like('linked_requirements', `%${requirement.requirement_id}%`);

    if (!hazardsFetchError && hazards) {
      for (const hazard of hazards) {
        const currentLinks = hazard.linked_requirements
          ? hazard.linked_requirements.split(',').map(id => id.trim()).filter(Boolean)
          : [];
        
        const updatedLinks = currentLinks.filter(id => id !== requirement.requirement_id);
        
        await supabase
          .from('hazards')
          .update({ linked_requirements: updatedLinks.join(', ') })
          .eq('id', hazard.id);
      }
    }

    // Delete the requirement
    const { error } = await supabase
      .from('requirement_specifications')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete requirement specification: ${error.message}`);
    }
  }

  async createWithTraceability(
    productId: string,
    companyId: string,
    data: CreateRequirementSpecificationData,
    requirementType: 'system' | 'software' | 'hardware' = 'system',
    parentRequirementIds: string[] = []
  ): Promise<RequirementSpecification> {
    // Create the requirement first
    const requirement = await this.create(productId, companyId, data, requirementType);
    
    // Update traceability links if parent requirements are provided
    if (parentRequirementIds.length > 0) {
      for (const parentId of parentRequirementIds) {
        const { error } = await supabase.rpc('update_traceability_links', {
          p_parent_id: parentId,
          p_child_id: requirement.requirement_id,
          p_parent_table: parentId.startsWith('UN-') ? 'user_needs' : 'requirement_specifications'
        });
        
        if (error) {
          console.error('Error updating traceability links:', error);
        }
      }
    }
    
    return requirement;
  }

  private async generateNextRequirementId(productId: string): Promise<string> {
    // This method is deprecated - use the database function instead
    const { data, error } = await supabase
      .from('requirement_specifications')
      .select('requirement_id')
      .eq('product_id', productId)
      .order('requirement_id', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(`Failed to generate requirement ID: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return 'RS-001';
    }

    const lastId = data[0].requirement_id;
    const match = lastId.match(/^RS-(\d+)$/);
    if (!match) {
      return 'RS-001';
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `RS-${nextNumber.toString().padStart(3, '0')}`;
  }
}

export const requirementSpecificationsService = new RequirementSpecificationsService();