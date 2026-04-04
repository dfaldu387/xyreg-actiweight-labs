import { supabase } from "@/integrations/supabase/client";

export interface MdrAnnexIItem {
  id: string;
  item_number: string;
  clause_reference: string;
  requirement_text: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  evidence_method?: string;
  audit_guidance?: string;
  applicable_standards?: string[];
  key_standards?: string[];
  clause_number?: string;
  clause_description?: string;
  question_number?: string;
  guidance_text?: string;
  chapter?: string;
  sort_order?: number;
  excludes_if?: string;
  automatic_na_reason?: string;
}

export interface MdrAnnexITemplate {
  id: string;
  name: string;
  framework: string;
  description: string;
  importance: string;
  scope: string;
  is_active: boolean;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegulatoryAttribute {
  id: string;
  label: string;
  description: string;
  icon: string;
  details: {
    type: string;
    implications: string;
    requirements: string[];
    standards: string[];
  };
}

/**
 * Fetch MDR Annex I template information
 */
export const fetchMdrAnnexITemplate = async (productId: string): Promise<MdrAnnexITemplate | null> => {
  try {
    console.log('fetchMdrAnnexITemplate', productId);
    const { data, error } = await supabase
      .from('mdr_annex_1')
      .select('*')
      .eq('product_id', productId)
      .order('regulatory_dna_value', { ascending: false })
    if (error) {
      console.error('[fetchMdrAnnexITemplate] Error:', error);
      return null;
    }

    return (data as any);
  } catch (error) {
    console.error('[fetchMdrAnnexITemplate] Exception:', error);
    return null;
  }
};
export const fetchMdrAnnexITemplateRegulatoryDnaValue = async (productId: string): Promise<MdrAnnexITemplate | null> => {
  try {
    console.log('fetchMdrAnnexITemplate', productId);
    const { data, error } = await supabase
      .from('mdr_annex_1')
      .select('*')
      .eq('product_id', productId)
      .eq('regulatory_dna_value', 'Yes')
    if (error) {
      console.error('[fetchMdrAnnexITemplate] Error:', error);
      return null;
    }

    return (data as any);
  } catch (error) {
    console.error('[fetchMdrAnnexITemplate] Exception:', error);
    return null;
  }
};
/* Update regulatory_dna_value in database*/
export const updateRegulatoryDnaValue = async (attributeId: string, regulatory_dna_value: string) => {
  const { data, error } = await supabase
    .from('mdr_annex_1')
    .update({
      regulatory_dna_value: regulatory_dna_value,
    })
    .eq('id', attributeId);
};

/**
 * Get regulatory attributes based on device characteristics
 */
export const getRegulatoryAttributes = (
  keyTechnologyCharacteristics: any,
  intendedUsers: string[] = []
): RegulatoryAttribute[] => {
  // Determine software type
  const softwareType = keyTechnologyCharacteristics?.isSoftwareAsaMedicalDevice
    ? 'SaMD (Software as a Medical Device)'
    : keyTechnologyCharacteristics?.isSoftwareMobileApp
      ? 'SiMD (Software in a Medical Device)'
      : keyTechnologyCharacteristics?.noSoftware
        ? 'No Software Used'
        : '';

  // Determine sterility status
  const sterilityStatus = keyTechnologyCharacteristics?.isNonSterile
    ? 'Non-sterile'
    : keyTechnologyCharacteristics?.isDeliveredSterile
      ? 'Delivered Sterile'
      : keyTechnologyCharacteristics?.canBeSterilized
        ? 'Can be Sterilized'
        : '';

  // Determine reusability status
  const reusabilityStatus = keyTechnologyCharacteristics?.isReusable
    ? 'Reusable'
    : keyTechnologyCharacteristics?.isSingleUse
      ? 'Single-use'
      : '';

  return [
    {
      id: 'software',
      label: 'Software Component',
      description: 'Does your device include software components?',
      icon: 'FileText',
      details: {
        type: softwareType || 'Not specified',
        implications: 'Software components may require additional regulatory considerations including cybersecurity, data protection, and software lifecycle management.',
        requirements: ['Software validation', 'Risk management', 'Cybersecurity assessment', 'Documentation requirements'],
        standards: ['IEC 62304', 'ISO 14971', 'IEC 82304-1']
      }
    },
    {
      id: 'sterility',
      label: 'Sterility Requirements',
      description: 'Does your device require sterility considerations?',
      icon: 'Shield',
      details: {
        type: sterilityStatus || 'Not specified',
        implications: 'Sterility requirements significantly impact manufacturing processes, packaging, and regulatory pathway.',
        requirements: ['Sterilization validation', 'Packaging validation', 'Shelf life studies', 'Environmental monitoring'],
        standards: ['ISO 11135', 'ISO 11137', 'ISO 11607']
      }
    },
    {
      id: 'measuring',
      label: 'Measuring Function',
      description: 'Does your device have measuring capabilities?',
      icon: 'Target',
      details: {
        type: keyTechnologyCharacteristics?.hasMeasuringFunction ? 'Has Measuring Function' : 'No Measuring Function',
        implications: 'Measuring functions require metrological traceability and accuracy validation.',
        requirements: ['Calibration procedures', 'Accuracy validation', 'Traceability documentation', 'Measurement uncertainty'],
        standards: ['ISO 14971', 'ISO 13485', 'IEC 60601-1']
      }
    },
    {
      id: 'implantable',
      label: 'Implantable Device',
      description: 'Is your device intended for implantation?',
      icon: 'Activity',
      details: {
        type: keyTechnologyCharacteristics?.isImplantable ? 'Implantable' : 'Non-implantable',
        implications: 'Implantable devices have the highest risk classification and require extensive clinical data.',
        requirements: ['Clinical evaluation', 'Biocompatibility testing', 'Long-term safety data', 'Post-market surveillance'],
        standards: ['ISO 10993', 'ISO 14155', 'ISO 14971']
      }
    }
  ];
};

/**
 * Get MDR Annex I progress statistics
 */
export const getMdrAnnexIProgress = (requirements: MdrAnnexIItem[]) => {
  const totalRequirements = requirements.length;
  const highPriorityRequirements = requirements.filter(req => req.priority === 'high').length;
  const mediumPriorityRequirements = requirements.filter(req => req.priority === 'medium').length;
  const lowPriorityRequirements = requirements.filter(req => req.priority === 'low').length;

  return {
    total: totalRequirements,
    highPriority: highPriorityRequirements,
    mediumPriority: mediumPriorityRequirements,
    lowPriority: lowPriorityRequirements,
    highPriorityPercentage: totalRequirements > 0 ? Math.round((highPriorityRequirements / totalRequirements) * 100) : 0
  };
};
