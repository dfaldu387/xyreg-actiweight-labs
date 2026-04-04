import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CompanyDataIntegrationService, type CompanyData, type PersonnelData, type ProductData, type MissingDataIndicator } from '@/services/companyDataIntegrationService';
import { ISO_13485_SECTIONS, type ISO13485SectionItem } from '@/config/gapISO13485Sections';
import { toast } from 'sonner';
import { simpleDebounce } from '@/utils/simpleDebounce';

export interface QualityManualSection {
  sectionKey: string;
  clause: string;
  title: string;
  description: string;
  groupId: number;
  groupName: string;
  content: string;
  lastUpdated?: string;
  commonlyExcluded?: boolean;
  exclusionHint?: string;
}

export interface QualityManualExclusion {
  clause: string;
  justification: string;
}

export interface QualityManualData {
  company: CompanyData | null;
  personnel: PersonnelData[];
  products: ProductData[];
  missingData: MissingDataIndicator[];
}

function sectionKeyFromClause(clause: string): string {
  return `qm_section_${clause.replace('.', '_')}`;
}

function exclusionKeyFromClause(clause: string): string {
  return `qm_exclusion_${clause.replace('.', '_')}`;
}

export function useQualityManual(companyId: string | undefined) {
  const [sections, setSections] = useState<QualityManualSection[]>([]);
  const [exclusions, setExclusions] = useState<Map<string, string>>(new Map());
  const [subStepContents, setSubStepContents] = useState<Map<string, { content: string; lastUpdated?: string }>>(new Map());
  const [companyData, setCompanyData] = useState<QualityManualData>({
    company: null, personnel: [], products: [], missingData: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  // Build sections from ISO config
  useEffect(() => {
    const built: QualityManualSection[] = ISO_13485_SECTIONS.map(s => ({
      sectionKey: sectionKeyFromClause(s.section),
      clause: s.section,
      title: s.title,
      description: s.description || '',
      groupId: s.sectionGroup,
      groupName: s.sectionGroupName,
      content: '',
      commonlyExcluded: s.commonlyExcluded,
      exclusionHint: s.exclusionHint,
    }));
    setSections(built);
  }, []);

  // Load company data + saved content + exclusions + sub-step content
  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [cdResult, settingsResult] = await Promise.all([
          CompanyDataIntegrationService.getCompanyData(companyId!),
          supabase
            .from('template_settings')
            .select('setting_key, setting_value, updated_at')
            .eq('company_id', companyId!)
            .eq('category', 'quality_manual' as any)
        ]);

        if (cancelled) return;

        setCompanyData({
          company: cdResult.company,
          personnel: cdResult.personnel,
          products: cdResult.products,
          missingData: cdResult.missingData,
        });

        const savedMap = new Map<string, { content: string; updated: string }>();
        const loadedExclusions = new Map<string, string>();
        const loadedSubSteps = new Map<string, { content: string; lastUpdated?: string }>();

        if (settingsResult.data) {
          for (const row of settingsResult.data) {
            if (row.setting_key.includes('_sub_')) {
              // Sub-step content
              loadedSubSteps.set(row.setting_key, {
                content: typeof row.setting_value === 'string' ? row.setting_value : JSON.stringify(row.setting_value),
                lastUpdated: row.updated_at,
              });
            } else if (row.setting_key.startsWith('qm_section_')) {
              savedMap.set(row.setting_key, {
                content: typeof row.setting_value === 'string' ? row.setting_value : JSON.stringify(row.setting_value),
                updated: row.updated_at,
              });
            } else if (row.setting_key.startsWith('qm_exclusion_')) {
              const clause = row.setting_key.replace('qm_exclusion_', '').replace('_', '.');
              const justification = typeof row.setting_value === 'string' ? row.setting_value : '';
              loadedExclusions.set(clause, justification);
            }
          }
        }

        setExclusions(loadedExclusions);
        setSubStepContents(loadedSubSteps);

        setSections(prev => prev.map(s => {
          const saved = savedMap.get(s.sectionKey);
          return saved ? { ...s, content: saved.content, lastUpdated: saved.updated } : s;
        }));
      } catch (err) {
        console.error('Failed to load quality manual data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [companyId]);

  // Toggle exclusion for a section
  const toggleExclusion = useCallback(async (clause: string, justification?: string) => {
    if (!companyId) return;
    const key = exclusionKeyFromClause(clause);
    const isCurrentlyExcluded = exclusions.has(clause);

    setSaving(true);
    try {
      if (isCurrentlyExcluded) {
        const { error } = await supabase
          .from('template_settings')
          .delete()
          .eq('company_id', companyId)
          .eq('setting_key', key);
        if (error) throw error;

        setExclusions(prev => {
          const next = new Map(prev);
          next.delete(clause);
          return next;
        });
        toast.success(`§${clause} restored to scope`);
      } else {
        const reason = justification || 'Not applicable to this organization';
        const { error } = await supabase
          .from('template_settings')
          .upsert({
            company_id: companyId,
            setting_key: key,
            setting_value: reason,
            setting_type: 'string',
            category: 'quality_manual' as any,
          }, { onConflict: 'company_id,setting_key' });
        if (error) throw error;

        setExclusions(prev => {
          const next = new Map(prev);
          next.set(clause, reason);
          return next;
        });
        toast.success(`§${clause} marked as Not Applicable`);
      }
    } catch (err) {
      console.error('Failed to toggle exclusion:', err);
      toast.error('Failed to update exclusion');
    } finally {
      setSaving(false);
    }
  }, [companyId, exclusions]);

  // Update exclusion justification
  const updateExclusionJustification = useCallback(async (clause: string, justification: string) => {
    if (!companyId || !exclusions.has(clause)) return;
    const key = exclusionKeyFromClause(clause);

    try {
      const { error } = await supabase
        .from('template_settings')
        .upsert({
          company_id: companyId,
          setting_key: key,
          setting_value: justification,
          setting_type: 'string',
          category: 'quality_manual' as any,
        }, { onConflict: 'company_id,setting_key' });
      if (error) throw error;

      setExclusions(prev => {
        const next = new Map(prev);
        next.set(clause, justification);
        return next;
      });
    } catch (err) {
      console.error('Failed to update justification:', err);
    }
  }, [companyId, exclusions]);

  // Save section content (top-level or sub-step)
  const saveContent = useCallback(async (settingKey: string, content: string) => {
    if (!companyId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('template_settings')
        .upsert({
          company_id: companyId,
          setting_key: settingKey,
          setting_value: content,
          setting_type: 'string',
          category: 'quality_manual' as any,
        }, { onConflict: 'company_id,setting_key' });

      if (error) throw error;

      // Update the right state
      if (settingKey.includes('_sub_')) {
        setSubStepContents(prev => {
          const next = new Map(prev);
          next.set(settingKey, { content, lastUpdated: new Date().toISOString() });
          return next;
        });
      } else {
        setSections(prev => prev.map(s =>
          s.sectionKey === settingKey
            ? { ...s, content, lastUpdated: new Date().toISOString() }
            : s
        ));
      }
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('Failed to save section');
    } finally {
      setSaving(false);
    }
  }, [companyId]);

  const debouncedSave = useCallback(
    simpleDebounce((key: string, content: string) => saveContent(key, content), 1500),
    [saveContent]
  );

  // Update local content (for editor) + debounced save
  const updateSectionContent = useCallback((sectionKey: string, content: string) => {
    if (sectionKey.includes('_sub_')) {
      setSubStepContents(prev => {
        const next = new Map(prev);
        next.set(sectionKey, { content, lastUpdated: prev.get(sectionKey)?.lastUpdated });
        return next;
      });
    } else {
      setSections(prev => prev.map(s =>
        s.sectionKey === sectionKey ? { ...s, content } : s
      ));
    }
    debouncedSave(sectionKey, content);
  }, [debouncedSave]);

  // AI generate section content
  const generateSection = useCallback(async (sectionKey: string, options?: { outputLanguage?: string; additionalPrompt?: string }) => {
    if (!companyId || !companyData.company) {
      toast.error('Company data not loaded yet');
      return;
    }

    // Determine if this is a sub-step or top-level
    const isSubStep = sectionKey.includes('_sub_');
    const baseSectionKey = isSubStep ? sectionKey.replace(/_sub_\d+$/, '') : sectionKey;
    const section = sections.find(s => s.sectionKey === baseSectionKey);
    if (!section) return;

    let subStepLabel = '';
    if (isSubStep) {
      const subIndex = parseInt(sectionKey.split('_sub_')[1], 10);
      const isoConfig = ISO_13485_SECTIONS.find(s => s.section === section.clause);
      const subItem = isoConfig?.subItems?.[subIndex];
      if (subItem) {
        subStepLabel = `§${section.clause}.${subItem.letter} ${subItem.description}`;
      }
    }

    setGenerating(sectionKey);
    try {
      const companyContext = [
        `Company: ${companyData.company.name}`,
        companyData.company.country ? `Country: ${companyData.company.country}` : null,
        companyData.company.description ? `Description: ${companyData.company.description}` : null,
        companyData.products.length > 0 ? `Products: ${companyData.products.map(p => `${p.name} (${p.risk_class || 'unclassified'})`).join(', ')}` : null,
        companyData.personnel.length > 0 ? `Personnel count: ${companyData.personnel.length}` : null,
      ].filter(Boolean).join('\n');

      const targetTitle = isSubStep
        ? `${subStepLabel} (part of §${section.clause} ${section.title})`
        : `§${section.clause} ${section.title}`;

      let prompt = `Write the Quality Manual section for ISO 13485:2016 clause ${targetTitle}.

Regulatory requirement: ${section.description}

Company context:
${companyContext}

Write this as a formal quality manual section that would be part of the company's QMS documentation. Include:
- A clear statement of how the organization addresses this requirement
- Specific references to the company's processes and structure where relevant
- Cross-references to related procedures and documents
- Language appropriate for a regulatory submission

Use HTML formatting with <h3>, <h4>, <p>, <ul>, <ol>, <li>, <strong>, <em> tags.
Do NOT use markdown. Return only the HTML content.`;

      if (options?.additionalPrompt) {
        prompt += `\n\nAdditional instructions: ${options.additionalPrompt}`;
      }

      const { data, error } = await supabase.functions.invoke('ai-content-generator', {
        body: {
          prompt,
          sectionTitle: targetTitle,
          currentContent: isSubStep
            ? (subStepContents.get(sectionKey)?.content || undefined)
            : (section.content || undefined),
          companyId,
          outputLanguage: options?.outputLanguage,
        },
      });

      if (error) throw error;
      if (!data?.success || !data?.content) throw new Error(data?.error || 'No content generated');

      let cleaned = data.content;
      cleaned = cleaned.replace(/^```html\s*/i, '').replace(/```\s*$/i, '').trim();

      await saveContent(sectionKey, cleaned);
      toast.success(`Generated ${targetTitle} content`);
    } catch (err: any) {
      console.error('AI generation failed:', err);
      toast.error(err.message || 'AI generation failed');
    } finally {
      setGenerating(null);
    }
  }, [companyId, companyData, sections, subStepContents, saveContent]);

  // Helper to get sub-step key
  const getSubStepKey = useCallback((sectionKey: string, subIndex: number) => {
    return `${sectionKey}_sub_${subIndex}`;
  }, []);

  // Completeness stats (exclude N/A sections)
  const completeness = {
    total: sections.length,
    excluded: exclusions.size,
    get applicable() {
      return this.total - this.excluded;
    },
    completed: sections.filter(s => !exclusions.has(s.clause) && s.content && s.content.length > 20).length,
    get percentage() {
      return this.applicable > 0 ? Math.round((this.completed / this.applicable) * 100) : 0;
    },
  };

  return {
    sections,
    exclusions,
    subStepContents,
    companyData,
    loading,
    saving,
    generating,
    completeness,
    updateSectionContent,
    generateSection,
    saveSection: saveContent,
    toggleExclusion,
    updateExclusionJustification,
    getSubStepKey,
  };
}
