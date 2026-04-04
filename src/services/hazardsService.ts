import { supabase } from "@/integrations/supabase/client";
import { CreateHazardInput, Hazard, SeverityLevel, ProbabilityLevel } from "@/components/product/design-risk-controls/risk-management/types";
import { hazardProductScopeService } from "./hazardProductScopeService";

export const hazardsService = {
  async getHazardsByProduct(productId: string): Promise<Hazard[]> {
    const { data, error } = await supabase
      .from('hazards')
      .select('*')
      .eq('product_id', productId)
      .order('hazard_id', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch hazards: ${error.message}`);
    }

    // Cast the data to match our Hazard interface types
    return (data || []).map(item => ({
      ...item,
      initial_severity: item.initial_severity as SeverityLevel,
      initial_probability: item.initial_probability as ProbabilityLevel,
      residual_severity: item.residual_severity as SeverityLevel,
      residual_probability: item.residual_probability as ProbabilityLevel,
    })) as Hazard[];
  },

  async createHazard(
    productId: string,
    companyId: string,
    input: CreateHazardInput,
    sourceType: 'SYS' | 'SWR' | 'HWR' | 'USE' | 'GEN' = 'GEN'
  ): Promise<Hazard> {
    // Generate next hazard ID with source-derived prefix
    const hazardId = await this.generateNextHazardId(productId, sourceType);

    // Calculate risk levels if severity and probability are provided
    const calculateRisk = (severity?: number, probability?: number): "Low" | "Medium" | "High" | null => {
      if (!severity || !probability) return null;
      const score = severity * probability;
      if (score <= 4) return "Low";
      if (score <= 9) return "Medium";
      return "High"; // Database only accepts Low/Medium/High, not Very High
    };

    const mapRiskToDbValue = this.mapRiskToDbValue;

    const initialRisk = mapRiskToDbValue(input.initial_risk) || calculateRisk(input.initial_severity, input.initial_probability) || 'Medium';
    const residualRisk = mapRiskToDbValue(input.residual_risk) || calculateRisk(input.residual_severity, input.residual_probability);

    const { data, error } = await supabase
      .from('hazards')
      .insert([{
        hazard_id: hazardId,
        product_id: productId,
        company_id: companyId,
        description: input.description,
        category: input.category,

        // Comprehensive risk analysis
        foreseeable_sequence_events: input.foreseeable_sequence_events,
        hazardous_situation: input.hazardous_situation,
        potential_harm: input.potential_harm,

        // Initial risk assessment
        initial_severity: input.initial_severity,
        initial_probability: input.initial_probability,
        initial_risk: initialRisk,

        // Risk control measures
        risk_control_measure: input.risk_control_measure,
        risk_control_type: input.risk_control_type,
        mitigation_measure: input.mitigation_measure || '', // Legacy compatibility - default to empty string
        mitigation_type: input.mitigation_type || 'Information for Safety', // Legacy compatibility - default value
        mitigation_link: input.mitigation_link,

        // Residual risk assessment
        residual_severity: input.residual_severity,
        residual_probability: input.residual_probability,
        residual_risk: residualRisk || 'Medium', // Legacy compatibility - default to Medium

        // Verification and validation
        verification_implementation: input.verification_implementation,
        verification_effectiveness: input.verification_effectiveness,

        // Traceability
        linked_requirements: input.linked_requirements,
        traceability_requirements: input.traceability_requirements,

        created_by: (await supabase.auth.getUser()).data.user?.id,
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create hazard: ${error.message}`);
    }

    // Auto-create RC verification test case if risk_control_measure is set (fire-and-forget)
    if (data.risk_control_measure) {
      import('@/utils/rcToTestCasePrefill').then(({ createRcTestCaseForHazard }) =>
        createRcTestCaseForHazard(data, productId, companyId)
          .then(() => {
            import('@/lib/query-client').then(({ queryClient }) => {
              queryClient.invalidateQueries({ queryKey: ['traceability-matrix'] });
              queryClient.invalidateQueries({ queryKey: ['traceability-visual'] });
              queryClient.invalidateQueries({ queryKey: ['hazards'] });
            });
          })
          .catch(console.error)
      );
    }

    // Save product scope if provided (fire-and-forget)
    if (input.productScope) {
      hazardProductScopeService.upsertScope(
        data.id,
        companyId,
        input.productScope.productIds,
        input.productScope.categoryNames
      ).catch(console.error);
    }

    // Cast the data to match our Hazard interface types
    return {
      ...data,
      initial_severity: data.initial_severity as SeverityLevel,
      initial_probability: data.initial_probability as ProbabilityLevel,
      residual_severity: data.residual_severity as SeverityLevel,
      residual_probability: data.residual_probability as ProbabilityLevel,
    } as Hazard;
  },

  async updateHazard(
    id: string,
    updates: Partial<CreateHazardInput>
  ): Promise<Hazard> {
    const { isObjectBaselined } = await import('./baselineLockService');
    const lockStatus = await isObjectBaselined(id, 'hazard');
    if (lockStatus.locked) {
      throw new Error(`BASELINE_LOCKED: This object was baselined in "${lockStatus.reviewTitle}" on ${lockStatus.baselineDate}. Submit a Change Control Request to modify it.`);
    }

    const { data, error } = await supabase
      .from('hazards')
      .update({
        description: updates.description,
        category: updates.category,
        
        // Comprehensive risk analysis
        foreseeable_sequence_events: updates.foreseeable_sequence_events,
        hazardous_situation: updates.hazardous_situation,
        potential_harm: updates.potential_harm,
        
        // Initial risk assessment
        initial_severity: updates.initial_severity,
        initial_probability: updates.initial_probability,
        initial_risk: this.mapRiskToDbValue(updates.initial_risk) || 'Medium', // Legacy compatibility
        
        // Risk control measures
        risk_control_measure: updates.risk_control_measure,
        risk_control_type: updates.risk_control_type,
        mitigation_measure: updates.mitigation_measure, // Legacy compatibility
        mitigation_type: updates.mitigation_type, // Legacy compatibility
        mitigation_link: updates.mitigation_link,
        
        // Residual risk assessment
        residual_severity: updates.residual_severity,
        residual_probability: updates.residual_probability,
        residual_risk: this.mapRiskToDbValue(updates.residual_risk) || 'Medium', // Legacy compatibility
        
        // Verification and validation
        verification_implementation: updates.verification_implementation,
        verification_effectiveness: updates.verification_effectiveness,
        
        // Traceability
        linked_requirements: updates.linked_requirements,
        traceability_requirements: updates.traceability_requirements,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update hazard: ${error.message}`);
    }

    // Auto-create RC verification test case if risk_control_measure is set (fire-and-forget)
    if (data.risk_control_measure && data.product_id && data.company_id) {
      import('@/utils/rcToTestCasePrefill').then(({ createRcTestCaseForHazard }) =>
        createRcTestCaseForHazard(data, data.product_id, data.company_id)
          .then(() => {
            import('@/lib/query-client').then(({ queryClient }) => {
              queryClient.invalidateQueries({ queryKey: ['traceability-matrix'] });
              queryClient.invalidateQueries({ queryKey: ['traceability-visual'] });
              queryClient.invalidateQueries({ queryKey: ['hazards'] });
            });
          })
          .catch(console.error)
      );
    }

    // Save product scope if provided (fire-and-forget)
    if (updates.productScope && data.company_id) {
      hazardProductScopeService.upsertScope(
        id,
        data.company_id,
        updates.productScope.productIds,
        updates.productScope.categoryNames
      ).catch(console.error);
    }

    // Cast the data to match our Hazard interface types
    return {
      ...data,
      initial_severity: data.initial_severity as SeverityLevel,
      initial_probability: data.initial_probability as ProbabilityLevel,
      residual_severity: data.residual_severity as SeverityLevel,
      residual_probability: data.residual_probability as ProbabilityLevel,
    } as Hazard;
  },

  async updateHazardWithTraceability(
    id: string,
    updates: Partial<CreateHazardInput>,
    hazardId: string,
    requirementIds: string[]
  ): Promise<Hazard> {
    const { traceabilityService } = await import('./traceabilityService');
    
    // Update the hazard
    const hazard = await this.updateHazard(id, updates);
    
    // Update traceability links
    await traceabilityService.updateHazardRequirementLinks(hazardId, requirementIds);
    
    return hazard;
  },

  async deleteHazard(id: string): Promise<void> {
    // First get the hazard to find its hazard_id for traceability cleanup
    const { data: hazard, error: fetchError } = await supabase
      .from('hazards')
      .select('hazard_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch hazard: ${fetchError.message}`);
    }

    // Clean up traceability links first
    const { TraceabilityService } = await import('./traceabilityService');
    await TraceabilityService.removeHazardLinks(hazard.hazard_id);

    // Delete the hazard
    const { error } = await supabase
      .from('hazards')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete hazard: ${error.message}`);
    }
  },

  // Map risk levels - DB only accepts Low/Medium/High
  mapRiskToDbValue(risk: string | null | undefined): "Low" | "Medium" | "High" | null {
    if (!risk) return null;
    if (risk === "Very High") return "High";
    return risk as "Low" | "Medium" | "High";
  },

  async generateNextHazardId(productId: string, sourceType: 'SYS' | 'SWR' | 'HWR' | 'USE' | 'GEN' = 'GEN'): Promise<string> {
    const prefix = `HAZ-${sourceType}-`;
    
    const { data, error } = await supabase
      .from('hazards')
      .select('hazard_id')
      .eq('product_id', productId)
      .like('hazard_id', `${prefix}%`)
      .order('hazard_id', { ascending: false });

    if (error) {
      throw new Error(`Failed to generate hazard ID: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return `${prefix}001`;
    }

    // Find the highest number within this prefix namespace
    let maxNum = 0;
    const regex = new RegExp(`^HAZ-[A-Z]+-(\\.+)$`);
    for (const row of data) {
      const match = row.hazard_id.match(/^HAZ-[A-Z]+-(\d+)$/);
      if (match) {
        maxNum = Math.max(maxNum, parseInt(match[1], 10));
      }
    }

    return `${prefix}${(maxNum + 1).toString().padStart(3, '0')}`;
  },
};