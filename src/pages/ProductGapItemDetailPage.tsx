import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDeviceComponents } from '@/hooks/useDeviceComponents';
import { ArrowLeft, ArrowRight, Zap, CheckCircle, FileText, ShieldCheck, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { findAnnexIIConfig } from '@/config/gapAnnexIISections';
import { GapItem } from '@/components/product/gap-analysis/GapItem';
import { IEC60601ClauseForm, type SsotTechSpecs } from '@/components/product/gap-analysis/IEC60601ClauseForm';
import { IEC_60601_FORM_FIELDS, type ClauseFormConfig } from '@/config/gapIEC60601FormFields';
import { MDR_ANNEX_II_FORM_FIELDS } from '@/config/gapAnnexIIFormFields';
import { IEC_62304_FORM_FIELDS } from '@/config/gapIEC62304FormFields';
import { ISO_14971_DEVICE_FORM_FIELDS } from '@/config/gapISO14971DeviceFormFields';
import { MDR_ANNEX_I_FORM_FIELDS } from '@/config/gapAnnexIFormFields';
import { IEC_62366_FORM_FIELDS } from '@/config/gapIEC62366FormFields';
import { IEC_60601_1_2_FORM_FIELDS } from '@/config/gapIEC60601_1_2FormFields';
import { IEC_60601_1_6_FORM_FIELDS } from '@/config/gapIEC60601_1_6FormFields';
import { MDR_ANNEX_III_FORM_FIELDS } from '@/config/gapAnnexIIIFormFields';
import { ISO_10993_FORM_FIELDS } from '@/config/gapISO10993FormFields';
import { ISO_15223_FORM_FIELDS } from '@/config/gapISO15223FormFields';
import { ISO_20417_FORM_FIELDS } from '@/config/gapISO20417FormFields';
import { IEC_20957_FORM_FIELDS } from '@/config/gapIEC20957FormFields';
import { ISO_13485_FORM_FIELDS } from '@/config/gapISO13485FormFields';
import { ISO_14971_ENTERPRISE_FORM_FIELDS } from '@/config/gapISO14971EnterpriseFormFields';
import { CMDR_FORM_FIELDS } from '@/config/gapCMDRFormFields';
import { TGA_FORM_FIELDS } from '@/config/gapTGAFormFields';
import { PMDA_FORM_FIELDS } from '@/config/gapPMDAFormFields';
import { NMPA_FORM_FIELDS } from '@/config/gapNMPAFormFields';
import { ANVISA_FORM_FIELDS } from '@/config/gapANVISAFormFields';
import { CDSCO_FORM_FIELDS } from '@/config/gapCDSCOFormFields';
import { UKCA_MDR_FORM_FIELDS } from '@/config/gapUKCAMDRFormFields';
import { MEPSW_FORM_FIELDS } from '@/config/gapMEPSWFormFields';
import { KFDA_FORM_FIELDS } from '@/config/gapKFDAFormFields';
import { IEC_60601_SSOT_FIELD_MAP } from '@/config/gapIEC60601SsotMapping';
import { MDR_ANNEX_II_DERIVED_SSOT_FIELDS } from '@/config/gapAnnexIISsotMapping';
import type { DerivedSsotFields } from '@/components/product/gap-analysis/IEC60601ClauseForm';
import { IEC_60601_SECTIONS, IEC_60601_GROUPS } from '@/config/gapIEC60601Sections';
import { ANNEX_II_SECTIONS, ANNEX_II_GROUPS } from '@/config/gapAnnexIISections';
import { ANNEX_I_SECTIONS, ANNEX_I_GROUPS } from '@/config/gapAnnexISections';
import { ISO_14971_DEVICE_SECTIONS, ISO_14971_DEVICE_GROUPS } from '@/config/gapISO14971DeviceSections';
import { IEC_62304_SECTIONS, IEC_62304_GROUPS } from '@/config/gapIEC62304Sections';
import { IEC_62366_SECTIONS, IEC_62366_GROUPS } from '@/config/gapIEC62366Sections';
import { IEC_60601_1_2_SECTIONS, IEC_60601_1_2_GROUPS } from '@/config/gapIEC60601_1_2Sections';
import { IEC_60601_1_6_SECTIONS, IEC_60601_1_6_GROUPS } from '@/config/gapIEC60601_1_6Sections';
import { ANNEX_III_SECTIONS, ANNEX_III_GROUPS } from '@/config/gapAnnexIIISections';
import { ISO_10993_SECTIONS, ISO_10993_GROUPS } from '@/config/gapISO10993Sections';
import { ISO_15223_SECTIONS, ISO_15223_GROUPS } from '@/config/gapISO15223Sections';
import { ISO_20417_SECTIONS, ISO_20417_GROUPS } from '@/config/gapISO20417Sections';
import { ISO_13485_SECTIONS, ISO_13485_GROUPS } from '@/config/gapISO13485Sections';
import { ISO_14971_ENTERPRISE_SECTIONS, ISO_14971_ENTERPRISE_GROUPS } from '@/config/gapISO14971Sections';
import { IEC_20957_SECTIONS, IEC_20957_GROUPS } from '@/config/gapIEC20957Sections';
import { CMDR_SECTIONS, CMDR_GROUPS } from '@/config/gapCMDRSections';
import { TGA_SECTIONS, TGA_GROUPS } from '@/config/gapTGASections';
import { PMDA_SECTIONS, PMDA_GROUPS } from '@/config/gapPMDASections';
import { NMPA_SECTIONS, NMPA_GROUPS } from '@/config/gapNMPASections';
import { ANVISA_SECTIONS, ANVISA_GROUPS } from '@/config/gapANVISASections';
import { CDSCO_SECTIONS, CDSCO_GROUPS } from '@/config/gapCDSCOSections';
import { UKCA_MDR_SECTIONS, UKCA_MDR_GROUPS } from '@/config/gapUKCAMDRSections';
import { MEPSW_SECTIONS, MEPSW_GROUPS } from '@/config/gapMEPSWSections';
import { KFDA_SECTIONS, KFDA_GROUPS } from '@/config/gapKFDASections';
import { GenericGapSidebar, type ActiveSubStep } from '@/components/company/gap-analysis/GenericGapSidebar';
import type { GenericSectionItem, GenericSectionGroup } from '@/components/company/gap-analysis/GenericGapLaunchView';
import type { LucideIcon } from 'lucide-react';
import { useGapAnalysisHelp } from '@/context/GapAnalysisHelpContext';

interface FrameworkConfig {
  sections: GenericSectionItem[];
  groups: GenericSectionGroup[];
  label: string;
  icon: LucideIcon;
  frameworkFilter: string;
}

function getFrameworkConfig(fw: string): FrameworkConfig | null {
  const fwLower = fw.toLowerCase();
  if (fw === 'IEC 60601-1' || (fwLower.includes('60601') && !fwLower.includes('60601-1-'))) {
    return { sections: IEC_60601_SECTIONS, groups: IEC_60601_GROUPS, label: 'IEC 60601-1', icon: Zap, frameworkFilter: 'IEC 60601-1' };
  }
  if (fwLower.includes('60601-1-2') || fw === 'IEC 60601-1-2') {
    return { sections: IEC_60601_1_2_SECTIONS, groups: IEC_60601_1_2_GROUPS, label: 'IEC 60601-1-2', icon: Zap, frameworkFilter: fw };
  }
  if (fwLower.includes('60601-1-6') || fw === 'IEC 60601-1-6') {
    return { sections: IEC_60601_1_6_SECTIONS, groups: IEC_60601_1_6_GROUPS, label: 'IEC 60601-1-6', icon: Zap, frameworkFilter: fw };
  }
  if (fwLower.includes('annex iii') || fw === 'MDR_ANNEX_III') {
    return { sections: ANNEX_III_SECTIONS, groups: ANNEX_III_GROUPS, label: 'MDR Annex III', icon: FileText, frameworkFilter: fw };
  }
  if (fwLower.includes('annex ii') || fw === 'MDR' || fw === 'MDR_ANNEX_II') {
    return { sections: ANNEX_II_SECTIONS as any, groups: ANNEX_II_GROUPS as any, label: 'MDR Annex II', icon: FileText, frameworkFilter: fw };
  }
  if (fwLower.includes('annex i') && !fwLower.includes('annex ii') && !fwLower.includes('annex iii') || fw === 'GSPR' || fw === 'MDR_ANNEX_I') {
    return { sections: ANNEX_I_SECTIONS, groups: ANNEX_I_GROUPS, label: 'MDR Annex I', icon: FileText, frameworkFilter: fw };
  }
  if (fw === 'ISO 14971' || fwLower.includes('14971')) {
    return { sections: ISO_14971_DEVICE_SECTIONS, groups: ISO_14971_DEVICE_GROUPS, label: 'ISO 14971', icon: ShieldCheck, frameworkFilter: fw };
  }
  if (fw === 'IEC 62304' || fwLower.includes('62304')) {
    return { sections: IEC_62304_SECTIONS, groups: IEC_62304_GROUPS, label: 'IEC 62304', icon: Cpu, frameworkFilter: fw };
  }
  if (fw === 'IEC 62366-1' || fwLower.includes('62366')) {
    return { sections: IEC_62366_SECTIONS, groups: IEC_62366_GROUPS, label: 'IEC 62366-1', icon: Cpu, frameworkFilter: fw };
  }
  if (fwLower.includes('10993')) {
    return { sections: ISO_10993_SECTIONS, groups: ISO_10993_GROUPS, label: 'ISO 10993-1:2025', icon: ShieldCheck, frameworkFilter: fw };
  }
  if (fwLower.includes('15223')) {
    return { sections: ISO_15223_SECTIONS, groups: ISO_15223_GROUPS, label: 'ISO 15223-1', icon: FileText, frameworkFilter: fw };
  }
  if (fwLower.includes('20417')) {
    return { sections: ISO_20417_SECTIONS, groups: ISO_20417_GROUPS, label: 'ISO 20417', icon: FileText, frameworkFilter: fw };
  }
  if (fwLower.includes('20957')) {
    return { sections: IEC_20957_SECTIONS, groups: IEC_20957_GROUPS, label: 'IEC 20957', icon: Zap, frameworkFilter: fw };
  }
  if (fwLower.includes('13485')) {
    return { sections: ISO_13485_SECTIONS as any, groups: ISO_13485_GROUPS, label: 'ISO 13485', icon: ShieldCheck, frameworkFilter: fw };
  }
  if (fwLower.includes('14971') && !fwLower.includes('device')) {
    return { sections: ISO_14971_ENTERPRISE_SECTIONS, groups: ISO_14971_ENTERPRISE_GROUPS, label: 'ISO 14971', icon: ShieldCheck, frameworkFilter: fw };
  }
  if (fwLower.includes('cmdr') || fw === 'CMDR') {
    return { sections: CMDR_SECTIONS, groups: CMDR_GROUPS, label: 'CMDR', icon: FileText, frameworkFilter: fw };
  }
  if (fwLower.includes('tga') || fw === 'TGA') {
    return { sections: TGA_SECTIONS, groups: TGA_GROUPS, label: 'TGA', icon: FileText, frameworkFilter: fw };
  }
  if (fwLower.includes('pmda') || fw === 'PMDA') {
    return { sections: PMDA_SECTIONS, groups: PMDA_GROUPS, label: 'PMDA', icon: FileText, frameworkFilter: fw };
  }
  if (fwLower.includes('nmpa') || fw === 'NMPA') {
    return { sections: NMPA_SECTIONS, groups: NMPA_GROUPS, label: 'NMPA', icon: FileText, frameworkFilter: fw };
  }
  if (fwLower.includes('anvisa') || fw === 'ANVISA') {
    return { sections: ANVISA_SECTIONS, groups: ANVISA_GROUPS, label: 'ANVISA', icon: FileText, frameworkFilter: fw };
  }
  if (fwLower.includes('cdsco') || fw === 'CDSCO') {
    return { sections: CDSCO_SECTIONS, groups: CDSCO_GROUPS, label: 'CDSCO', icon: FileText, frameworkFilter: fw };
  }
  if (fwLower.includes('ukca') || fw === 'UKCA') {
    return { sections: UKCA_MDR_SECTIONS, groups: UKCA_MDR_GROUPS, label: 'UKCA', icon: FileText, frameworkFilter: fw };
  }
  if (fwLower.includes('mepsw') || fwLower.includes('mepv') || fw === 'MepV') {
    return { sections: MEPSW_SECTIONS, groups: MEPSW_GROUPS, label: 'MepV', icon: FileText, frameworkFilter: fw };
  }
  if (fwLower.includes('kfda') || fw === 'KFDA') {
    return { sections: KFDA_SECTIONS, groups: KFDA_GROUPS, label: 'KFDA', icon: FileText, frameworkFilter: fw };
  }
  return null;
}

export default function ProductGapItemDetailPage() {
  const { productId, itemId, companyName } = useParams<{ productId: string; itemId: string; companyName: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeSteps, setActiveSteps] = useState<ActiveSubStep[]>([]);
  const { setGapHelpContext } = useGapAnalysisHelp();

  const { data: item, isLoading } = useQuery({
    queryKey: ['gap-analysis-item', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gap_analysis_items')
        .select('*')
        .eq('id', itemId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!itemId,
  });

  // Set gap analysis help context for the Help & Guide sidebar
  useEffect(() => {
    const fw = (item as any)?.framework as string | undefined;
    const sec = (item as any)?.section as string | undefined;
    if (fw && sec) {
      setGapHelpContext(fw, sec);
    }
    return () => setGapHelpContext(null, null);
  }, [item, setGapHelpContext]);

  const config = useMemo(() => {
    if (!item) return undefined;
    const section = (item as any).section || '';
    const itemFw = (item as any).framework || '';
    if (['MDR', 'MDR_ANNEX_II', 'MDR Annex II'].includes(itemFw)) {
      return findAnnexIIConfig(section);
    }
    const fwCfg = getFrameworkConfig(itemFw);
    if (fwCfg) {
      return fwCfg.sections.find(s => s.section === section);
    }
    return undefined;
  }, [item]);

  const fw = (item as any)?.framework as string | undefined;
  const sectionStr = (item as any)?.section as string | undefined;
  const fwConfig = fw ? getFrameworkConfig(fw) : null;
  // Resolve form fields for any framework that has guided step-by-step config
  const resolvedFormFields: Record<string, ClauseFormConfig> | null = (() => {
    if (!sectionStr || !fwConfig) return null;
    const fwLower = fwConfig.frameworkFilter.toLowerCase();
    if (fwLower.includes('60601-1-2') && IEC_60601_1_2_FORM_FIELDS[sectionStr]) return IEC_60601_1_2_FORM_FIELDS;
    if (fwLower.includes('60601-1-6') && IEC_60601_1_6_FORM_FIELDS[sectionStr]) return IEC_60601_1_6_FORM_FIELDS;
    if (fwLower.includes('60601') && IEC_60601_FORM_FIELDS[sectionStr]) return IEC_60601_FORM_FIELDS;
    if (fwLower.includes('62304') && IEC_62304_FORM_FIELDS[sectionStr]) return IEC_62304_FORM_FIELDS;
    if ((fwLower.includes('annex iii') || fwLower.includes('annex_iii')) && MDR_ANNEX_III_FORM_FIELDS[sectionStr]) return MDR_ANNEX_III_FORM_FIELDS;
    if ((fwLower.includes('annex ii') || fwLower.includes('annex_ii') || fwLower === 'mdr') && MDR_ANNEX_II_FORM_FIELDS[sectionStr]) return MDR_ANNEX_II_FORM_FIELDS;
    if ((fwLower.includes('annex i') && !fwLower.includes('annex ii') && !fwLower.includes('annex iii') || fwLower.includes('annex_i') && !fwLower.includes('annex_ii') && !fwLower.includes('annex_iii') || fwLower === 'gspr') && MDR_ANNEX_I_FORM_FIELDS[sectionStr]) return MDR_ANNEX_I_FORM_FIELDS;
    if (fwLower.includes('14971') && ISO_14971_DEVICE_FORM_FIELDS[sectionStr]) return ISO_14971_DEVICE_FORM_FIELDS;
    if (fwLower.includes('62366') && IEC_62366_FORM_FIELDS[sectionStr]) return IEC_62366_FORM_FIELDS;
    if (fwLower.includes('10993') && ISO_10993_FORM_FIELDS[sectionStr]) return ISO_10993_FORM_FIELDS;
    if (fwLower.includes('15223') && ISO_15223_FORM_FIELDS[sectionStr]) return ISO_15223_FORM_FIELDS;
    if (fwLower.includes('20417') && ISO_20417_FORM_FIELDS[sectionStr]) return ISO_20417_FORM_FIELDS;
    if (fwLower.includes('20957') && IEC_20957_FORM_FIELDS[sectionStr]) return IEC_20957_FORM_FIELDS;
    if (fwLower.includes('13485') && ISO_13485_FORM_FIELDS[sectionStr]) return ISO_13485_FORM_FIELDS;
    if (fwLower.includes('14971') && !ISO_14971_DEVICE_FORM_FIELDS[sectionStr] && ISO_14971_ENTERPRISE_FORM_FIELDS[sectionStr]) return ISO_14971_ENTERPRISE_FORM_FIELDS;
    if (fwLower.includes('cmdr') && CMDR_FORM_FIELDS[sectionStr]) return CMDR_FORM_FIELDS;
    if (fwLower.includes('tga') && TGA_FORM_FIELDS[sectionStr]) return TGA_FORM_FIELDS;
    if (fwLower.includes('pmda') && PMDA_FORM_FIELDS[sectionStr]) return PMDA_FORM_FIELDS;
    if (fwLower.includes('nmpa') && NMPA_FORM_FIELDS[sectionStr]) return NMPA_FORM_FIELDS;
    if (fwLower.includes('anvisa') && ANVISA_FORM_FIELDS[sectionStr]) return ANVISA_FORM_FIELDS;
    if (fwLower.includes('cdsco') && CDSCO_FORM_FIELDS[sectionStr]) return CDSCO_FORM_FIELDS;
    if (fwLower.includes('ukca') && UKCA_MDR_FORM_FIELDS[sectionStr]) return UKCA_MDR_FORM_FIELDS;
    if ((fwLower.includes('mepsw') || fwLower.includes('mepv')) && MEPSW_FORM_FIELDS[sectionStr]) return MEPSW_FORM_FIELDS;
    if (fwLower.includes('kfda') && KFDA_FORM_FIELDS[sectionStr]) return KFDA_FORM_FIELDS;
    return null;
  })();
  const hasFormConfig = !!resolvedFormFields;
  const isIEC60601_1 = fwConfig?.frameworkFilter === 'IEC 60601-1';
  const isAnnexII = ['MDR', 'MDR_ANNEX_II', 'MDR Annex II'].includes(fwConfig?.frameworkFilter || '');

  const { data: allFrameworkItems = [] } = useQuery({
    queryKey: ['gap-analysis-items-framework', productId, fwConfig?.frameworkFilter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gap_analysis_items')
        .select('*')
        .eq('product_id', productId!)
        .eq('framework', fwConfig!.frameworkFilter);
      if (error) throw error;
      return data || [];
    },
    enabled: !!productId && !!fwConfig,
  });

  const frameworkItemsBySection = useMemo(() => {
    const hasFormResponses = (responses: any) =>
      !!responses && typeof responses === 'object' && !Array.isArray(responses) && Object.keys(responses).length > 0;

    const statusRank = (status?: string | null) => {
      if (status === 'compliant') return 3;
      if (status === 'partially_compliant') return 2;
      if (status === 'non_compliant') return 1;
      return 0;
    };

    const pickPreferred = (a: any, b: any) => {
      const aHasData = hasFormResponses(a.form_responses);
      const bHasData = hasFormResponses(b.form_responses);
      if (aHasData !== bHasData) return bHasData ? b : a;

      const aRank = statusRank(a.status);
      const bRank = statusRank(b.status);
      if (aRank !== bRank) return bRank > aRank ? b : a;

      const aUpdated = new Date(a.updated_at || 0).getTime();
      const bUpdated = new Date(b.updated_at || 0).getTime();
      return bUpdated > aUpdated ? b : a;
    };

    const map = new Map<string, any>();
    (allFrameworkItems as any[]).forEach((item) => {
      const key = item.section;
      if (!key) return;
      const existing = map.get(key);
      map.set(key, existing ? pickPreferred(existing, item) : item);
    });
    return map;
  }, [allFrameworkItems]);

  const dedupedFrameworkItems = useMemo(
    () => Array.from(frameworkItemsBySection.values()),
    [frameworkItemsBySection]
  );

  // Fetch product data for SSOT fields
  const { data: productData } = useQuery({
    queryKey: ['product-purpose-ssot', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('name, trade_name, intended_purpose_data, key_technology_characteristics, primary_regulatory_type, description, class, contraindications, intended_users, eudamed_basic_udi_di_code, variant_display_name, model_id')
        .eq('id', productId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const ssotIntendedUseCategory = (productData?.intended_purpose_data as any)?.intended_use_category || '';
  const ssotEssentialPerformance: string[] = (productData?.intended_purpose_data as any)?.essentialPerformance || [];
  const techChars = (productData?.key_technology_characteristics as any) || {};

  // Derive IVD exclusion from primary_regulatory_type
  const derivedSsotFields: DerivedSsotFields = useMemo(() => {
    const regType = (productData as any)?.primary_regulatory_type || '';
    const isIvd = regType.toLowerCase().includes('ivd') || regType.toLowerCase().includes('in vitro');
    const ivdValue = isIvd ? 'Yes — IVD, excluded from IEC 60601-1' : 'No — not IVD';
    const description = (productData as any)?.description || '';
    const productName = (productData as any)?.name || '';

    const base: DerivedSsotFields = {
      ivd_exclusion: { value: ivdValue, sourceLabel: 'Classification', readOnly: true },
      device_description_ref: { value: description || (productName ? `Device Definition — ${productName}` : ''), sourceLabel: 'Device Definition', readOnly: true },
    };

    // Annex II SSOT derived fields
    if (isAnnexII && productData) {
      const pd = productData as any;
      const purposeData = (pd.intended_purpose_data || {}) as Record<string, any>;
      const deviceName = pd.name || '';
      const tradeName = [deviceName, pd.trade_name].filter(Boolean).join(' / ') || '';
      const contraindications = Array.isArray(pd.contraindications) ? pd.contraindications.join('; ') : '';
      const intendedUsers = typeof pd.intended_users === 'object' && pd.intended_users
        ? (Array.isArray(pd.intended_users) ? pd.intended_users.join(', ') : JSON.stringify(pd.intended_users))
        : '';
      const riskClass = pd.class || '';
      const basicUdiDi = pd.eudamed_basic_udi_di_code || '';
      const variantName = pd.variant_display_name || '';

      base.product_trade_name = { value: tradeName, sourceLabel: 'Device Definition', readOnly: true };
      base.general_description = { value: description, sourceLabel: 'Device Definition', readOnly: true };
      base.intended_purpose = { value: purposeData.intendedPurpose || '', sourceLabel: 'Purpose', readOnly: true };
      base.medical_conditions = { value: purposeData.medicalConditions || '', sourceLabel: 'Purpose', readOnly: true };
      base.intended_users = { value: intendedUsers, sourceLabel: 'Purpose', readOnly: true };
      base.basic_udi_di = { value: basicUdiDi, sourceLabel: 'Identification', readOnly: true };
      base.patient_population = { value: purposeData.patientPopulation || '', sourceLabel: 'Purpose', readOnly: true };
      base.contraindications = { value: contraindications, sourceLabel: 'Purpose', readOnly: true };
      base.risk_class = { value: riskClass, sourceLabel: 'Classification', readOnly: true };
      base.variants_description = { value: variantName, sourceLabel: 'Device Definition', readOnly: true };
    }

    return base;
  }, [productData, isAnnexII]);

  // Fetch device components for applied parts SSOT
  const { data: deviceComponentsRaw } = useDeviceComponents(productId);
  const deviceComponents = useMemo(() =>
    (deviceComponentsRaw || []).map(c => ({ id: c.id, name: c.name })),
    [deviceComponentsRaw]
  );

  const handleSsotIntendedUseCategoryChange = useCallback(async (value: string) => {
    if (!productId) return;
    const currentData = (productData?.intended_purpose_data as Record<string, any>) || {};
    const updatedData = { ...currentData, intended_use_category: value };
    await supabase
      .from('products')
      .update({ intended_purpose_data: updatedData as any })
      .eq('id', productId);
    queryClient.invalidateQueries({ queryKey: ['product-purpose-ssot', productId] });
  }, [productId, productData, queryClient]);

  // Generic handler for updating any tech characteristic
  const handleTechCharChange = useCallback(async (charKey: string, value: string) => {
    if (!productId) return;
    const currentChars = (productData?.key_technology_characteristics as Record<string, any>) || {};
    const updated = { ...currentChars, [charKey]: value };
    await supabase
      .from('products')
      .update({ key_technology_characteristics: updated as any })
      .eq('id', productId);
    queryClient.invalidateQueries({ queryKey: ['product-purpose-ssot', productId] });
  }, [productId, productData, queryClient]);

  // Build ssotTechSpecs map from all SSOT field mappings
  const ssotTechSpecs: SsotTechSpecs = useMemo(() => {
    const map: SsotTechSpecs = {};
    const uniqueCharKeys = new Set(Object.values(IEC_60601_SSOT_FIELD_MAP));
    for (const charKey of uniqueCharKeys) {
      map[charKey] = {
        value: techChars[charKey] || '',
        onChange: (v: string) => handleTechCharChange(charKey, v),
      };
    }
    return map;
  }, [techChars, handleTechCharChange]);

  const handleStepsInfo = useCallback((steps: { id: string; label: string; complete: boolean }[]) => {
    setActiveSteps(steps);
  }, []);

  const getBackUrl = () => {
    // Company-level gap analysis
    if (companyName && !productId) {
      const base = `/app/company/${companyName}/gap-analysis`;
      if (!item || !fw) return base;
      const fwLower = fw.toLowerCase();
      if (fw === 'ISO 13485' || fwLower.includes('13485')) return `${base}?tab=iso-13485`;
      if (fw === 'ISO 14971' || fwLower.includes('14971')) return `${base}?tab=iso-14971`;
      if (fw === 'CMDR' || fwLower.includes('cmdr')) return `${base}?tab=cmdr`;
      if (fw === 'TGA' || fwLower.includes('tga')) return `${base}?tab=tga`;
      if (fw === 'PMDA' || fwLower.includes('pmda')) return `${base}?tab=pmda`;
      if (fw === 'NMPA' || fwLower.includes('nmpa')) return `${base}?tab=nmpa`;
      if (fw === 'ANVISA' || fwLower.includes('anvisa')) return `${base}?tab=anvisa`;
      if (fw === 'CDSCO' || fwLower.includes('cdsco')) return `${base}?tab=cdsco`;
      if (fw === 'UKCA' || fwLower.includes('ukca')) return `${base}?tab=ukca`;
      if (fw === 'MepV' || fwLower.includes('mepsw') || fwLower.includes('mepv')) return `${base}?tab=mepsw`;
      if (fw === 'KFDA' || fwLower.includes('kfda')) return `${base}?tab=kfda`;
      return base;
    }
    const base = `/app/product/${productId}/gap-analysis`;
    if (!item || !fw) return base;

    const fwLower = fw.toLowerCase();
    if (fwLower.includes('annex i') && !fwLower.includes('ii') && !fwLower.includes('iii') || fw === 'GSPR') return `${base}?tab=mdr&subtab=annex-i`;
    if (fwLower.includes('annex ii') && !fwLower.includes('iii') || fw === 'MDR' || fw === 'MDR_ANNEX_II') return `${base}?tab=mdr&subtab=annex-ii`;
    if (fwLower.includes('annex iii') || fw === 'PMS') return `${base}?tab=mdr&subtab=annex-iii`;
    if (fw === 'ISO 14971' || fwLower.includes('14971')) return `${base}?tab=iso-14971`;
    if (fw === 'IEC 62304' || fwLower.includes('62304')) return `${base}?tab=iec-62304`;
    if (fw === 'IEC 60601-1-2' || fwLower.includes('60601-1-2')) return `${base}?tab=iec-60601&subtab=60601-1-2`;
    if (fw === 'IEC 60601-1-6' || fwLower.includes('60601-1-6')) return `${base}?tab=iec-60601&subtab=60601-1-6`;
    if (fw === 'IEC 60601-1' || fwLower.includes('60601')) return `${base}?tab=iec-60601&subtab=60601-1`;
    if (fw === 'IEC 20957' || fwLower.includes('20957')) return `${base}?tab=iec-20957`;
    return base;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-semibold">Item not found</h2>
        <Button variant="ghost" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Go back
        </Button>
      </div>
    );
  }

  const showClauseForm = hasFormConfig && sectionStr;

  // Detect if this item is inherited (belongs to a different product than the current one)
  const isInheritedItem = !!(item && productId && item.product_id && item.product_id !== productId);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(getBackUrl())}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Gap Analysis
        </Button>
        {!showClauseForm && config && (
          <span className="text-sm text-muted-foreground">
            Section {config.section}: {config.title}
          </span>
        )}
      </div>

      {/* Inherited item banner */}
      {isInheritedItem && (
        <div className="mx-4 mt-3 rounded-lg border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/30 p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 uppercase tracking-wider">
              Shared
            </span>
            <span className="text-blue-800 dark:text-blue-200">
              This section is inherited from the primary family device. Changes are read-only.
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0 text-xs"
            onClick={async () => {
              if (!productId || !item) return;
              try {
                const { data: newItem, error } = await supabase
                  .from('gap_analysis_items')
                  .insert({
                    product_id: productId,
                    requirement: item.requirement,
                    framework: (item as any).framework,
                    section: (item as any).section,
                    clause_id: (item as any).clause_id,
                    clause_summary: (item as any).clause_summary,
                    category: (item as any).category,
                    status: 'non_compliant',
                    action_needed: '',
                    priority: (item as any).priority,
                  })
                  .select('id')
                  .single();
                if (error) throw error;
                if (newItem) {
                  queryClient.invalidateQueries({ queryKey: ['productDetails', productId] });
                  navigate(`/app/product/${productId}/gap-analysis/${newItem.id}`, { replace: true });
                }
              } catch (err) {
                console.error('Failed to create local override:', err);
              }
            }}
          >
            Create Local Override
          </Button>
        </div>
      )}

      {/* Content with sidebar */}
      <div className={`flex-1 overflow-hidden ${fwConfig ? 'mr-[280px] lg:mr-[300px] xl:mr-[320px]' : ''}`}>
        {showClauseForm ? (
          <IEC60601ClauseForm
            itemId={item.id}
            section={sectionStr!}
            initialResponses={(item as any).form_responses || {}}
            currentStepIndex={currentStepIndex}
            onStepChange={setCurrentStepIndex}
            onStepsInfo={handleStepsInfo}
            productId={productId}
            companyId={(item as any).company_id}
            formFields={resolvedFormFields || undefined}
            ssotIntendedUseCategory={isIEC60601_1 ? ssotIntendedUseCategory : undefined}
            onSsotIntendedUseCategoryChange={isIEC60601_1 ? handleSsotIntendedUseCategoryChange : undefined}
            ssotEnergyTransfer={isIEC60601_1 ? ssotTechSpecs['energyTransferDirection']?.value : undefined}
            onSsotEnergyTransferChange={isIEC60601_1 ? ssotTechSpecs['energyTransferDirection']?.onChange : undefined}
            ssotEnergyType={isIEC60601_1 ? ssotTechSpecs['energyTransferType']?.value : undefined}
            onSsotEnergyTypeChange={isIEC60601_1 ? ssotTechSpecs['energyTransferType']?.onChange : undefined}
            deviceComponents={isIEC60601_1 ? deviceComponents : undefined}
            ssotTechSpecs={isIEC60601_1 ? ssotTechSpecs : undefined}
            derivedSsotFields={(isIEC60601_1 || isAnnexII) ? derivedSsotFields : undefined}
            ssotEssentialPerformance={isIEC60601_1 ? ssotEssentialPerformance : undefined}
            formReadOnly={isInheritedItem}
            frameworkId={fwConfig?.frameworkFilter}
          />
        ) : (
          <div className="overflow-y-auto p-4 space-y-6 h-full">
            {config?.subItems && config.subItems.length > 0 && (
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold text-sm mb-3">
                  Requirements Checklist — Section {config.section}
                </h3>
                <div className="space-y-2">
                  {config.subItems.map(sub => (
                    <div key={sub.letter} className="flex items-start gap-3 py-1.5 px-2 rounded hover:bg-muted/30">
                      <span className="text-xs font-mono font-semibold text-muted-foreground mt-0.5 w-5 flex-shrink-0">
                        ({sub.letter})
                      </span>
                      <span className="text-sm text-foreground">{sub.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <GapItem
              item={item as any}
              companyId={(item as any).company_id}
              productId={productId}
            />
          </div>
        )}
      </div>

      {/* Sidebar */}
      {fwConfig && (
        <GenericGapSidebar
          sections={fwConfig.sections}
          groups={fwConfig.groups}
          items={dedupedFrameworkItems as any}
          standardLabel={fwConfig.label}
          standardIcon={fwConfig.icon}
          baseUrl={`/app/product/${productId}`}
          framework={fwConfig.frameworkFilter}
          productId={productId}
          activeSection={sectionStr}
          activeSteps={showClauseForm ? activeSteps : undefined}
          activeStepIndex={showClauseForm ? currentStepIndex : undefined}
          onStepClick={showClauseForm ? setCurrentStepIndex : undefined}
        />
      )}

      {/* Floating bottom navigation bar */}
      {(() => {
        if (showClauseForm) {
          const formConfig = resolvedFormFields?.[sectionStr!];
          if (!formConfig) return null;
          const steps = formConfig.steps;
          const totalSteps = steps.length;
          const currentLabel = steps[currentStepIndex]?.stepLabel || '';
          const prevLabel = currentStepIndex > 0 ? steps[currentStepIndex - 1]?.stepLabel : null;
          const nextLabel = currentStepIndex < totalSteps - 1 ? steps[currentStepIndex + 1]?.stepLabel : null;
          const currentComplete = activeSteps[currentStepIndex]?.complete || false;
          const prevComplete = currentStepIndex > 0 ? (activeSteps[currentStepIndex - 1]?.complete || false) : false;
          const nextComplete = currentStepIndex < totalSteps - 1 ? (activeSteps[currentStepIndex + 1]?.complete || false) : false;

          const sectionIndex = fwConfig ? fwConfig.sections.findIndex(s => s.section === sectionStr) : -1;
          const nextSection = fwConfig && sectionIndex >= 0 && sectionIndex < fwConfig.sections.length - 1
            ? fwConfig.sections[sectionIndex + 1] : null;
          const prevSection = fwConfig && sectionIndex > 0
            ? fwConfig.sections[sectionIndex - 1] : null;

          const navigateToSection = async (section: typeof nextSection, goToLastStep = false) => {
            if (!section) return;
            const entry = frameworkItemsBySection.get(section.section);
            if (entry) {
              navigate(`/app/product/${productId}/gap-analysis/${entry.id}`);
              if (goToLastStep) {
                const destFormConfig = resolvedFormFields?.[section.section];
                const lastIdx = destFormConfig ? destFormConfig.steps.length - 1 : 0;
                setCurrentStepIndex(Math.max(0, lastIdx));
              } else {
                setCurrentStepIndex(0);
              }
            } else if (section.type === 'navigate' && section.route) {
              navigate(`/app/product/${productId}/${section.route}?returnTo=gap-analysis`);
            } else if (section.type === 'evidence' && productId && fwConfig) {
              try {
                const { data, error } = await supabase
                  .from('gap_analysis_items')
                  .insert({
                    product_id: productId,
                    requirement: section.title,
                    framework: fwConfig.frameworkFilter,
                    section: section.section,
                    clause_id: section.section,
                    clause_summary: section.title,
                    status: 'non_compliant',
                    action_needed: '',
                  })
                  .select('id')
                  .single();
                if (!error && data) {
                  navigate(`/app/product/${productId}/gap-analysis/${data.id}`);
                  setCurrentStepIndex(0);
                }
              } catch (err) {
                console.error('Failed to create gap item:', err);
              }
            }
          };

          const isLastStep = currentStepIndex >= totalSteps - 1;
          const isFirstStep = currentStepIndex === 0;
          const nextBtnLabel = nextLabel || (nextSection ? `§${nextSection.section} ${nextSection.title}` : 'Back to Gap Analysis');
          const nextBtnAction = () => {
            if (nextLabel) { setCurrentStepIndex(currentStepIndex + 1); }
            else if (nextSection) { navigateToSection(nextSection); }
            else { navigate(getBackUrl()); }
          };
          const prevBtnLabel = prevLabel || (prevSection ? `§${prevSection.section} ${prevSection.title}` : null);
          const prevBtnAction = () => {
            if (prevLabel) { setCurrentStepIndex(currentStepIndex - 1); }
            else if (prevSection) { navigateToSection(prevSection, true); }
          };

          const btnBase = '!bg-slate-100 hover:!bg-slate-200 text-slate-700 border border-slate-500 shadow-sm';
          const btnDone = '!bg-emerald-50 hover:!bg-emerald-100 text-emerald-700 border border-emerald-400 shadow-sm';

          return (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm rounded-[28px] border shadow-xl px-3 py-1.5">
                {prevBtnLabel && (
                  <Button onClick={prevBtnAction} size="sm"
                    className={`gap-1.5 h-9 w-[180px] min-w-[180px] max-w-[180px] rounded-full justify-start ${prevLabel ? (prevComplete ? btnDone : btnBase) : btnBase}`}>
                    <ArrowLeft className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${prevLabel && prevComplete ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                    <span className="text-xs font-medium truncate flex-1 text-left">{prevBtnLabel}</span>
                  </Button>
                )}
                <div className="flex flex-col items-center px-6 py-2 min-w-[220px] bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mx-2">
                  <div className="flex items-center gap-2">
                    {currentComplete && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                    <span className="text-xs font-semibold text-white truncate max-w-[180px]">{currentLabel}</span>
                  </div>
                  <span className="text-[10px] text-white/70">Step {currentStepIndex + 1}/{totalSteps}</span>
                </div>
                <Button onClick={nextBtnAction} size="sm"
                  className={`gap-1.5 h-9 w-[180px] min-w-[180px] max-w-[180px] rounded-full justify-end ${nextLabel ? (nextComplete ? btnDone : btnBase) : btnBase}`}>
                  <span className="text-xs font-medium truncate flex-1 text-right">{nextBtnLabel}</span>
                  <span className={`h-2 w-2 rounded-full flex-shrink-0 ${nextLabel && nextComplete ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                  <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
                </Button>
              </div>
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
}
