import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches comprehensive device & company context for AI prompt enrichment.
 * Returns a structured text block ready to inject into AI prompts.
 */
export async function fetchFullAIContext(
  productId?: string,
  companyId?: string
): Promise<{ text: string; sources: AIContextSources }> {
  const sources: AIContextSources = {
    deviceDefinition: false,
    riskManagement: false,
    designControls: false,
    clinicalData: false,
    companySettings: false,
  };

  const parts: string[] = [];

  // Run all queries in parallel
  const [productResult, hazardsResult, userNeedsResult, reqsResult, clinicalResult, companyResult] =
    await Promise.all([
      productId
        ? supabase
            .from('products')
            .select(
              'name, description, class, device_type, emdn_code, emdn_description, intended_use, intended_users, clinical_benefits, contraindications, key_technology_characteristics, target_population, device_category, conformity_assessment_route, classification_rule'
            )
            .eq('id', productId)
            .maybeSingle()
        : Promise.resolve(null),

      productId
        ? supabase
            .from('hazards')
            .select(
              'hazard_id, description, hazardous_situation, potential_harm, initial_severity, initial_probability, initial_risk_level, risk_control_measure, risk_control_type, residual_risk_level'
            )
            .eq('product_id', productId)
            .limit(30)
        : Promise.resolve(null),

      productId
        ? supabase
            .from('user_needs')
            .select('id, description, category, priority')
            .eq('product_id', productId)
            .limit(30)
        : Promise.resolve(null),

      productId
        ? supabase
            .from('requirement_specifications')
            .select('requirement_id, description, requirement_type, category')
            .eq('product_id', productId)
            .limit(30)
        : Promise.resolve(null),

      productId
        ? supabase
            .from('product_clinical_evidence_plan')
            .select('*')
            .eq('product_id', productId)
            .maybeSingle()
        : Promise.resolve(null),

      companyId
        ? supabase.from('companies').select('name, country').eq('id', companyId).maybeSingle()
        : Promise.resolve(null),
    ]);

  // ── Device Definition ──
  const product = productResult?.data;
  if (product) {
    sources.deviceDefinition = true;
    const lines = ['## Device Definition'];
    if (product.name) lines.push(`- Device Name: ${product.name}`);
    if (product.description) lines.push(`- Description: ${product.description}`);
    if (product.class) lines.push(`- Risk Class: ${product.class}`);
    if (product.device_type) lines.push(`- Device Type: ${product.device_type}`);
    if (product.device_category) lines.push(`- Device Category: ${product.device_category}`);
    if (product.emdn_code) lines.push(`- EMDN Code: ${product.emdn_code}`);
    if (product.emdn_description) lines.push(`- EMDN Description: ${product.emdn_description}`);
    if (product.intended_use) lines.push(`- Intended Use: ${product.intended_use}`);
    if (product.intended_users) lines.push(`- Intended Users: ${product.intended_users}`);
    if (product.target_population) lines.push(`- Target Population: ${product.target_population}`);
    if (product.clinical_benefits) lines.push(`- Clinical Benefits: ${product.clinical_benefits}`);
    if (product.contraindications) lines.push(`- Contraindications: ${product.contraindications}`);
    if (product.classification_rule) lines.push(`- Classification Rule: ${product.classification_rule}`);
    if (product.conformity_assessment_route) lines.push(`- Conformity Route: ${product.conformity_assessment_route}`);
    const techChars = product.key_technology_characteristics;
    if (techChars && typeof techChars === 'object') {
      const flags = Object.entries(techChars as Record<string, boolean>)
        .filter(([, v]) => v === true)
        .map(([k]) => k);
      if (flags.length) lines.push(`- Technology Characteristics: ${flags.join(', ')}`);
    }
    parts.push(lines.join('\n'));
  }

  // ── Risk Management ──
  const hazards = hazardsResult?.data;
  if (hazards && hazards.length > 0) {
    sources.riskManagement = true;
    const lines = [`## Risk Management (${hazards.length} hazards)`];
    hazards.forEach((h: any) => {
      const id = h.hazard_id || '—';
      lines.push(
        `- [${id}] ${h.description || 'Unnamed hazard'} | Situation: ${h.hazardous_situation || '—'} | Harm: ${h.potential_harm || '—'} | Initial Risk: ${h.initial_risk_level || '—'} | Control: ${h.risk_control_measure || '—'} | Residual: ${h.residual_risk_level || '—'}`
      );
    });
    parts.push(lines.join('\n'));
  }

  // ── Design Controls ──
  const userNeeds = userNeedsResult?.data;
  const reqs = reqsResult?.data;
  if ((userNeeds && userNeeds.length > 0) || (reqs && reqs.length > 0)) {
    sources.designControls = true;
    const lines = ['## Design Controls'];
    if (userNeeds && userNeeds.length > 0) {
      lines.push(`### User Needs (${userNeeds.length})`);
      userNeeds.forEach((un: any) => {
        lines.push(`- ${un.description || 'No description'} [${un.category || '—'}] Priority: ${un.priority || '—'}`);
      });
    }
    if (reqs && reqs.length > 0) {
      lines.push(`### Requirements (${reqs.length})`);
      reqs.forEach((r: any) => {
        lines.push(`- [${r.requirement_id || '—'}] ${r.description || 'No description'} (${r.requirement_type || '—'}, ${r.category || '—'})`);
      });
    }
    parts.push(lines.join('\n'));
  }

  // ── Clinical Data ──
  const clinical = clinicalResult?.data;
  if (clinical) {
    sources.clinicalData = true;
    const lines = ['## Clinical Evidence'];
    if (clinical.study_design) lines.push(`- Study Design: ${JSON.stringify(clinical.study_design)}`);
    if (clinical.pmcf_required !== null) lines.push(`- PMCF Required: ${clinical.pmcf_required}`);
    if (clinical.pmcf_plan) lines.push(`- PMCF Plan: ${clinical.pmcf_plan}`);
    parts.push(lines.join('\n'));
  }

  // ── Company Settings ──
  const company = companyResult?.data;
  if (company) {
    sources.companySettings = true;
    const lines = ['## Company Information'];
    if (company.name) lines.push(`- Company: ${company.name}`);
    if (company.country) lines.push(`- Country: ${company.country}`);
    parts.push(lines.join('\n'));
  }

  return {
    text: parts.length > 0 ? `# DEVICE & COMPANY CONTEXT\nUse this information to ground your output in the specific device and company data.\n\n${parts.join('\n\n')}` : '',
    sources,
  };
}

export interface AIContextSources {
  deviceDefinition: boolean;
  riskManagement: boolean;
  designControls: boolean;
  clinicalData: boolean;
  companySettings: boolean;
}
