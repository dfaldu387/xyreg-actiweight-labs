import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CompanyDataIntegrationService, type CompanyData, type PersonnelData, type ProductData, type MissingDataIndicator } from '@/services/companyDataIntegrationService';
import { LEAN_QM_SECTIONS, OLD_KEY_TO_NEW_CHAPTER } from '@/config/qualityManualStructure';
import { toast } from 'sonner';
import { simpleDebounce } from '@/utils/simpleDebounce';
import { getClassBasedExclusions } from '@/config/classBasedExclusions';
import { fetchTemplateSettings } from '@/utils/templateSettingsQueries';

export interface QualityManualSection {
  sectionKey: string;
  clause: string;
  title: string;
  description: string;
  /** Chapter number 1–8 */
  chapterNumber: number;
  /** Sub-clauses covered by this chapter */
  coveredClauses: string[];
  content: string;
  lastUpdated?: string;
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

function exclusionKeyFromClause(clause: string): string {
  return `qm_exclusion_${clause.replace('.', '_')}`;
}

export function useQualityManual(companyId: string | undefined) {
  const [sections, setSections] = useState<QualityManualSection[]>([]);
  const [exclusions, setExclusions] = useState<Map<string, string>>(new Map());
  const [companyData, setCompanyData] = useState<QualityManualData>({
    company: null, personnel: [], products: [], missingData: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [documentPrefixes, setDocumentPrefixes] = useState<string>('');

  // Build sections from lean config
  useEffect(() => {
    const built: QualityManualSection[] = LEAN_QM_SECTIONS.map(ch => ({
      sectionKey: ch.key,
      clause: ch.clauseRange,
      title: ch.title,
      description: ch.description,
      chapterNumber: ch.number,
      coveredClauses: ch.coveredClauses,
      content: '',
    }));
    setSections(built);
  }, []);

  // Load company data + saved content + exclusions + document prefixes
  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [cdResult, settingsResult, allSettings] = await Promise.all([
          CompanyDataIntegrationService.getCompanyData(companyId!),
          supabase
            .from('template_settings')
            .select('setting_key, setting_value, updated_at')
            .eq('company_id', companyId!)
            .eq('category', 'quality_manual' as any),
          fetchTemplateSettings(companyId!),
        ]);

        if (cancelled) return;

        setCompanyData({
          company: cdResult.company,
          personnel: cdResult.personnel,
          products: cdResult.products,
          missingData: cdResult.missingData,
        });

        // Load document prefix configuration
        const prefixSetting = allSettings.find(s => s.setting_key === 'global_sub_prefixes' && s.category === 'document_numbering');
        if (prefixSetting && Array.isArray(prefixSetting.setting_value)) {
          const prefixes = (prefixSetting.setting_value as any[])
            .filter((p: any) => p.enabled)
            .map((p: any) => `${p.code} = ${p.label}`)
            .join(', ');
          setDocumentPrefixes(prefixes);
        }

        // Parse saved content — support both new lean keys and old granular keys
        const leanContentMap = new Map<string, { content: string; updated: string }>();
        const oldContentByChapter = new Map<string, Array<{ clause: string; content: string; updated: string }>>();
        const loadedExclusions = new Map<string, string>();

        if (settingsResult.data) {
          for (const row of settingsResult.data) {
            // New lean keys (qm_ch_*)
            if (row.setting_key.startsWith('qm_ch_')) {
              leanContentMap.set(row.setting_key, {
                content: typeof row.setting_value === 'string' ? row.setting_value : JSON.stringify(row.setting_value),
                updated: row.updated_at,
              });
            }
            // Old granular keys (qm_section_*) — migrate
            else if (row.setting_key.startsWith('qm_section_') && !row.setting_key.includes('_sub_')) {
              const newChapterKey = OLD_KEY_TO_NEW_CHAPTER[row.setting_key];
              if (newChapterKey && !leanContentMap.has(newChapterKey)) {
                const arr = oldContentByChapter.get(newChapterKey) || [];
                const clause = row.setting_key.replace('qm_section_', '').replace('_', '.');
                arr.push({
                  clause,
                  content: typeof row.setting_value === 'string' ? row.setting_value : JSON.stringify(row.setting_value),
                  updated: row.updated_at,
                });
                oldContentByChapter.set(newChapterKey, arr);
              }
            }
            // Exclusions
            else if (row.setting_key.startsWith('qm_exclusion_')) {
              const clause = row.setting_key.replace('qm_exclusion_', '').replace('_', '.');
              const justification = typeof row.setting_value === 'string' ? row.setting_value : '';
              loadedExclusions.set(clause, justification);
            }
          }
        }

        setExclusions(loadedExclusions);

        setSections(prev => prev.map(s => {
          // Prefer new lean content
          const lean = leanContentMap.get(s.sectionKey);
          if (lean) return { ...s, content: lean.content, lastUpdated: lean.updated };

          // Migrate old granular content
          const oldParts = oldContentByChapter.get(s.sectionKey);
          if (oldParts && oldParts.length > 0) {
            oldParts.sort((a, b) => a.clause.localeCompare(b.clause));
            const merged = oldParts.map(p => p.content).join('\n<hr>\n');
            return { ...s, content: merged, lastUpdated: oldParts[0].updated };
          }

          return s;
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

  // Toggle exclusion for a sub-clause
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

  // Save section content
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

      setSections(prev => prev.map(s =>
        s.sectionKey === settingKey
          ? { ...s, content, lastUpdated: new Date().toISOString() }
          : s
      ));
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

  // Update local content + debounced save
  const updateSectionContent = useCallback((sectionKey: string, content: string) => {
    setSections(prev => prev.map(s =>
      s.sectionKey === sectionKey ? { ...s, content } : s
    ));
    debouncedSave(sectionKey, content);
  }, [debouncedSave]);

  // AI generate section content
  const generateSection = useCallback(async (sectionKey: string, options?: { outputLanguage?: string; additionalPrompt?: string; detailLevel?: string; companySize?: string; regulatoryMaturity?: string }) => {
    if (!companyId || !companyData.company) {
      toast.error('Company data not loaded yet');
      return;
    }

    const section = sections.find(s => s.sectionKey === sectionKey);
    if (!section) return;

    setGenerating(sectionKey);
    try {
      const companyContext = [
        `Company: ${companyData.company.name}`,
        companyData.company.country ? `Country: ${companyData.company.country}` : null,
        companyData.company.description ? `Description: ${companyData.company.description}` : null,
        companyData.products.length > 0 ? `Products: ${companyData.products.map(p => `${p.name} (${p.risk_class || 'unclassified'})`).join(', ')}` : null,
        companyData.personnel.length > 0 ? `Personnel count: ${companyData.personnel.length}` : null,
      ].filter(Boolean).join('\n');

      // Build excluded clauses context for §1 (Scope)
      const exclusionContext = exclusions.size > 0
        ? `\nExcluded clauses:\n${Array.from(exclusions.entries()).map(([c, j]) => `- §${c}: ${j}`).join('\n')}`
        : '';

      const coveredClausesText = section.coveredClauses.length > 0
        ? `This section covers ISO 13485:2016 clauses: ${section.coveredClauses.map(c => `§${c}`).join(', ')}.`
        : '';

      // Word count guidance
      const wordGuidance: Record<string, string> = {
        concise: 'Keep this section concise, approximately 150–250 words. Focus on essential process descriptions only.',
        standard: 'Write approximately 300–500 words with balanced detail.',
        comprehensive: 'Write approximately 500–800 words with full enterprise-level detail.',
      };

      const companySizeContext: Record<string, string> = {
        startup: 'This is a small startup/micro organization (1–20 people). Keep processes lean and practical.',
        sme: 'This is a small-to-medium enterprise (20–100 people). Balance formality with practicality.',
        enterprise: 'This is a large enterprise (100+ people). Use formal, detailed enterprise-grade language.',
      };

      const maturityContext: Record<string, string> = {
        new: 'This organization is building its QMS from scratch. Write foundational content that establishes processes.',
        existing: 'This organization has an existing QMS being updated. Write content that reflects established practices.',
        certified: 'This organization is already ISO-certified and maintaining compliance. Write content that demonstrates mature, optimized processes.',
      };

      // Document prefix instructions
      const prefixInstructions = documentPrefixes
        ? `\nDocument Numbering Convention: When referencing company procedures, use the following XyReg document prefix system: ${documentPrefixes}. For example, reference SOPs as "SOP-QA-001", forms as "FORM-001", work instructions as "WI-MF-001", etc. Use the three-part format: PREFIX-DEPT-NUMBER.`
        : '';

      let prompt = `Write Chapter ${section.chapterNumber}: "${section.title}" of the Quality Manual for ISO 13485:2016.

${coveredClausesText}

Requirement summary: ${section.description}

Company context:
${companyContext}
${exclusionContext}

${options?.detailLevel ? wordGuidance[options.detailLevel] || '' : ''}
${options?.companySize ? companySizeContext[options.companySize] || '' : ''}
${options?.regulatoryMaturity ? maturityContext[options.regulatoryMaturity] || '' : ''}
${prefixInstructions}

CRITICAL INSTRUCTIONS:
1. Write as a FUNCTIONAL PROCESS MAP — describe how the organization operates, not a verbatim repetition of the standard.
2. Use a narrative style: explain what the company does, who is responsible, and how processes interact.
3. Reference the company's documentation hierarchy:
   - Level 1: Quality Manual (this document)
   - Level 2: Standard Operating Procedures (SOPs) — the "Who/What/When"
   - Level 3: Work Instructions (WIs) — the "How-to"
   - Level 4: Records/Forms — the objective evidence
4. Cross-reference specific procedures by document number where relevant.
5. Keep it lean and auditor-friendly — avoid padding or clause parroting.
6. Do NOT break into sub-sections per sub-clause. Write one cohesive narrative for the entire chapter.

Use HTML formatting with <h3>, <h4>, <p>, <ul>, <ol>, <li>, <strong>, <em> tags.
Do NOT use markdown. Return only the HTML content.`;

      if (options?.additionalPrompt) {
        prompt += `\n\nAdditional instructions: ${options.additionalPrompt}`;
      }

      const { data, error } = await supabase.functions.invoke('ai-content-generator', {
        body: {
          prompt,
          sectionTitle: `Ch.${section.chapterNumber} ${section.title}`,
          currentContent: section.content || undefined,
          companyId,
          outputLanguage: options?.outputLanguage,
        },
      });

      if (error) throw error;
      if (!data?.success || !data?.content) throw new Error(data?.error || 'No content generated');

      let cleaned = data.content;
      cleaned = cleaned.replace(/^```html\s*/i, '').replace(/```\s*$/i, '').trim();

      await saveContent(sectionKey, cleaned);
      toast.success(`Generated Ch.${section.chapterNumber} ${section.title}`);
    } catch (err: any) {
      console.error('AI generation failed:', err);
      toast.error(err.message || 'AI generation failed');
    } finally {
      setGenerating(null);
    }
  }, [companyId, companyData, sections, saveContent, exclusions, documentPrefixes]);

  // Apply class-based exclusions in batch
  const applyClassBasedExclusions = useCallback(async (deviceClass: string) => {
    if (!companyId) return;
    const suggested = getClassBasedExclusions(deviceClass);
    if (suggested.length === 0) return;

    setSaving(true);
    let applied = 0;
    try {
      for (const item of suggested) {
        if (exclusions.has(item.clause)) continue;
        const key = exclusionKeyFromClause(item.clause);
        const { error } = await supabase
          .from('template_settings')
          .upsert({
            company_id: companyId,
            setting_key: key,
            setting_value: item.justification,
            setting_type: 'string',
            category: 'quality_manual' as any,
          }, { onConflict: 'company_id,setting_key' });
        if (!error) {
          setExclusions(prev => {
            const next = new Map(prev);
            next.set(item.clause, item.justification);
            return next;
          });
          applied++;
        }
      }
      if (applied > 0) {
        toast.success(`Applied ${applied} class-based exclusion${applied > 1 ? 's' : ''}`);
      } else {
        toast.info('All suggested exclusions were already applied');
      }
    } catch (err) {
      console.error('Failed to apply class-based exclusions:', err);
      toast.error('Failed to apply exclusions');
    } finally {
      setSaving(false);
    }
  }, [companyId, exclusions]);

  // Completeness stats
  const completeness = {
    total: sections.length,
    excluded: 0, // Exclusions are at sub-clause level, not chapter level
    get applicable() {
      return this.total;
    },
    completed: sections.filter(s => s.content && s.content.length > 20).length,
    get percentage() {
      return this.total > 0 ? Math.round((this.completed / this.total) * 100) : 0;
    },
  };

  return {
    sections,
    exclusions,
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
    applyClassBasedExclusions,
  };
}
