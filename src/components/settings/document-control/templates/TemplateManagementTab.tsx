import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { stripDocPrefix } from '@/utils/templateNameUtils';
import { Plus, FileText, Calendar, User, Download, Trash2, Brain, Eye, Edit, ArrowUpDown, ArrowUp, ArrowDown, FilePlus2, Loader2, MoreHorizontal, ChevronRight, ChevronDown, ListChecks, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { DocumentTemplateFileService } from '@/services/documentTemplateFileService';
import { TemplateFilters, TemplateUploadData } from '@/types/templateManagement';
import { TemplateManagementService } from '@/services/templateManagementService';
import { TemplateFilterBar } from './TemplateFilterBar';
import { EnhancedTemplateUploadDialog } from './EnhancedTemplateUploadDialog';
import { TemplateViewDialog } from './TemplateViewDialog';
import { TemplateEditDialog } from './TemplateEditDialog';
import { SOPTemplatePreviewDialog } from './SOPTemplatePreviewDialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { TIER_A_AUTO_SEED, getSopTier, parseSopNumber, getSopSubPrefix , compareSopDocuments } from '@/constants/sopAutoSeedTiers';
import { formatSopDisplayName } from '@/constants/sopAutoSeedTiers';
import { seedSingleSopForCompany } from '@/services/sopAutoSeedService';
import { SOP_FULL_CONTENT } from '@/data/sopFullContent';
import { SopAutoSeedStatus } from '@/components/settings/document-control/SopAutoSeedStatus';
import { TierBadge } from '@/components/documents/TierBadge';
import { DocumentDraftDrawer } from '@/components/product/documents/DocumentDraftDrawer';
import {
  listGlobalWIsForSop,
  materializeGlobalWIForCompany,
  materializeGlobalWIForCompanyDetailed,
  type GlobalWI,
} from '@/services/globalWorkInstructionsService';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface TemplateManagementTabProps {
  companyId: string;
  onOpenAiTemplateDialog: () => void;
  onOpenUploadDialog?: () => void;
}

interface DraftTemplateSummary {
  id: string;
  template_id?: string | null;
  name: string;
  type?: string | null;
  updated_at?: string | null;
  metadata?: {
    sopNumber?: string;
  } | null;
}

export function TemplateManagementTab({ companyId, onOpenAiTemplateDialog, onOpenUploadDialog }: TemplateManagementTabProps) {
  const { lang } = useTranslation();
  const { activeCompanyRole } = useCompanyRole();
  const { companyName: companyNameParam } = useParams<{ companyName: string }>();
  const companyName = companyNameParam ? decodeURIComponent(companyNameParam) : '';
  const [seedingSop, setSeedingSop] = useState<string | null>(null);

  // Set of Tier A SOP numbers (e.g. "SOP-001") for quick lookup.
  const tierASopNumbers = useMemo(
    () => new Set(TIER_A_AUTO_SEED.map((e) => e.sop)),
    [],
  );

  const isTierASop = (templateName: string): boolean => {
    const match = templateName.match(/SOP-\d{3}/);
    return !!match && tierASopNumbers.has(match[0]);
  };

  const extractSopKey = (templateName: string): string | null => {
    // Match both legacy "SOP-008" and current functional sub-prefix
    // form "SOP-DE-008" / "SOP-SC-016" so the key uniquely identifies a draft.
    const match = templateName.match(/SOP(?:-[A-Z]{2,4})?-\d{3}/i);
    return match ? match[0] : null;
  };

  const [filters, setFilters] = useState<TemplateFilters>({
    search: '',
  });
  const [companyTemplates, setCompanyTemplates] = useState<any[]>([]);
  const [saasTemplates, setSaasTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [sopPreviewOpen, setSopPreviewOpen] = useState(false);
  const [draftTemplateNames, setDraftTemplateNames] = useState<Set<string>>(new Set());
  const [draftTemplatesBySopNumber, setDraftTemplatesBySopNumber] = useState<Map<string, DraftTemplateSummary>>(new Map());
  const [draftDrawerDoc, setDraftDrawerDoc] = useState<{ id: string; name: string; type: string } | null>(null);
  const { toast } = useToast();

  // Bulk seed selection: set of SOP keys (e.g. "SOP-008") for missing-SOP rows.
  const [bulkSeedSelected, setBulkSeedSelected] = useState<Set<string>>(new Set());
  const [isBulkSeeding, setIsBulkSeeding] = useState(false);

  // Foundation SOP <-> Global Work Instruction unification.
  // wisBySopKey: e.g. "SOP-001" -> [global WI rows]
  const [wisBySopKey, setWisBySopKey] = useState<Map<string, GlobalWI[]>>(new Map());
  const [expandedSopKeys, setExpandedSopKeys] = useState<Set<string>>(new Set());
  const [openingWiId, setOpeningWiId] = useState<string | null>(null);

  // Load global WIs once per company mount; they're global so we don't filter by company.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('global_work_instructions' as never)
          .select('id, sop_template_key, wi_number, title, focus, scope, roles, modules, sections, version')
          .order('wi_number', { ascending: true });
        if (cancelled) return;
        const map = new Map<string, GlobalWI[]>();
        ((data ?? []) as unknown as GlobalWI[]).forEach((w) => {
          const arr = map.get(w.sop_template_key) ?? [];
          arr.push(w);
          map.set(w.sop_template_key, arr);
        });
        setWisBySopKey(map);
      } catch (e) {
        console.error('[Templates] failed to load global WIs', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const toggleSopExpanded = (sopKey: string) => {
    setExpandedSopKeys((prev) => {
      const next = new Set(prev);
      if (next.has(sopKey)) next.delete(sopKey);
      else next.add(sopKey);
      return next;
    });
  };

  const handleOpenGlobalWI = async (wi: GlobalWI) => {
    console.info('[WI Open] click', wi.wi_number, wi.id);
    if (!companyId) {
      sonnerToast.error('No active company in context');
      return;
    }
    setOpeningWiId(wi.id);
    try {
      // Resolve a phase id (first company phase) to anchor the materialized CI.
      let phaseId: string | undefined;
      const { data: phase } = await supabase
        .from('company_phases')
        .select('id')
        .eq('company_id', companyId)
        .order('order_index', { ascending: true })
        .limit(1)
        .maybeSingle();
      phaseId = (phase as { id?: string } | null)?.id;

      // Fallback: borrow any phase already used by another company doc.
      if (!phaseId) {
        const { data: anyDoc } = await supabase
          .from('phase_assigned_document_template')
          .select('phase_id')
          .eq('company_id', companyId)
          .not('phase_id', 'is', null)
          .limit(1)
          .maybeSingle();
        phaseId = (anyDoc as { phase_id?: string } | null)?.phase_id;
      }

      if (!phaseId) {
        sonnerToast.error('No company phase found to anchor this Work Instruction.');
        return;
      }

      const result = await materializeGlobalWIForCompanyDetailed({
        globalWiId: wi.id,
        companyId,
        phaseId,
      });
      if (result.ok === false) {
        sonnerToast.error(`Failed to open ${wi.wi_number}: ${result.reason}`);
        return;
      }
      setDraftDrawerDoc({ id: result.ciId, name: wi.title, type: 'WI' });
      sonnerToast.success(`Opened ${wi.wi_number}`);
      await loadDraftNames();
    } catch (e) {
      console.error('[WI Open] unexpected error', e);
      sonnerToast.error(`Failed to open ${wi.wi_number}: ${(e as Error).message}`);
    } finally {
      setOpeningWiId(null);
    }
  };

  // Only reload templates when the company changes — filters are applied
  // client-side via the `filteredTemplates` useMemo below. Reloading on every
  // keystroke would trigger the loading spinner and unmount the search input,
  // causing focus loss after the first character.
  useEffect(() => {
    loadTemplates();
  }, [companyId]);

  // Load draft names to know which templates have CI docs
  const getCanonicalSopName = (templateName: string): string => {
    const sopNumber = parseSopNumber(templateName);
    if (!sopNumber) return templateName;

    const content = SOP_FULL_CONTENT[sopNumber];
    return content ? `${content.sopNumber} ${content.title}` : templateName;
  };

  const getDraftSopNumber = (draft: DraftTemplateSummary): string | null => {
    const metadataSopNumber = typeof draft.metadata?.sopNumber === 'string'
      ? draft.metadata.sopNumber
      : null;

    return metadataSopNumber || parseSopNumber(draft.name);
  };

  const getMatchingDraft = (
    template: any,
    draftLookup: Map<string, DraftTemplateSummary> = draftTemplatesBySopNumber,
  ): DraftTemplateSummary | null => {
    const sopNumber = parseSopNumber(template?.name);
    if (!sopNumber) return null;
    return draftLookup.get(sopNumber) ?? null;
  };

  const hasDraftForTemplate = (template: any): boolean => {
    if (isSOP(template?.name || '')) {
      return !!getMatchingDraft(template);
    }
    return draftTemplateNames.has(template?.name);
  };

  const getEffectiveTemplateName = (template: any): string => {
    const matchingDraft = getMatchingDraft(template);
    if (matchingDraft?.name) return matchingDraft.name;
    return getCanonicalSopName(template?.name || '');
  };

  const openDraftInDrawer = (draft: DraftTemplateSummary, fallbackType = 'SOP') => {
    const drawerId = draft.template_id || draft.id;
    setDraftDrawerDoc({
      id: drawerId,
      name: draft.name,
      type: draft.type || fallbackType,
    });
  };

  const loadDraftNames = async (): Promise<Map<string, DraftTemplateSummary>> => {
    try {
      const { data } = await supabase
        .from('document_studio_templates')
        .select('id, template_id, name, type, updated_at, metadata')
        .eq('company_id', companyId)
        .order('updated_at', { ascending: false });
      if (data) {
        const nextDraftTemplateNames = new Set(data.map((d: any) => d.name));
        const nextDraftTemplatesBySopNumber = new Map<string, DraftTemplateSummary>();

        for (const draft of data as DraftTemplateSummary[]) {
          const sopNumber = getDraftSopNumber(draft);
          if (sopNumber && !nextDraftTemplatesBySopNumber.has(sopNumber)) {
            nextDraftTemplatesBySopNumber.set(sopNumber, draft);
          }
        }

        setDraftTemplateNames(nextDraftTemplateNames);
        setDraftTemplatesBySopNumber(nextDraftTemplatesBySopNumber);
        return nextDraftTemplatesBySopNumber;
      }
    } catch (e) {
      console.error('Error loading draft names:', e);
    }
    setDraftTemplateNames(new Set());
    setDraftTemplatesBySopNumber(new Map());
    return new Map();
  };

  const handleUseTemplate = async (
    template: any,
  ): Promise<{ ok: boolean; sopKey: string | null; reason?: string }> => {
    const sopKey = parseSopNumber(template.name) || extractSopKey(template.name);
    if (!sopKey || !companyId || !companyName) {
      return { ok: false, sopKey: null, reason: 'missing-context' };
    }
    try {
      setSeedingSop(sopKey);
      const result = await seedSingleSopForCompany(companyId, companyName, sopKey);
      if (result.inserted > 0) {
        toast({
          title: lang('common.success'),
          description: `${sopKey} draft created and personalized for ${companyName}.`,
        });
        await loadDraftNames();
        return { ok: true, sopKey };
      } else if (result.skipped > 0) {
        toast({
          title: 'Already exists',
          description: `${sopKey} is already provisioned for this company.`,
        });
        await loadDraftNames();
        return { ok: true, sopKey };
      } else {
        toast({
          title: lang('common.error'),
          description: result.errors[0] ?? 'Failed to seed SOP.',
          variant: 'destructive',
        });
        await loadDraftNames();
        return { ok: false, sopKey, reason: result.errors[0] ?? 'seed-failed' };
      }
    } catch (e) {
      console.error('Use Template failed:', e);
      toast({
        title: lang('common.error'),
        description: e instanceof Error ? e.message : 'Failed to seed SOP.',
        variant: 'destructive',
      });
      return { ok: false, sopKey, reason: e instanceof Error ? e.message : 'exception' };
    } finally {
      setSeedingSop(null);
    }
  };

  useEffect(() => {
    loadDraftNames();
  }, [companyId]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const { companyTemplates: company, saasTemplates: saas } = await TemplateManagementService.getAllTemplates(companyId, filters);
      setCompanyTemplates(company);
      setSaasTemplates(saas);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: lang('common.error'),
        description: lang('templates.library.loadFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (data: TemplateUploadData) => {
    try {
      setIsUploading(true);
      
      // Create template
      const template = await TemplateManagementService.createTemplate(companyId, data);
      
      // Upload file if provided
      if (data.file) {
        await TemplateManagementService.uploadTemplateFile(template.id, data.file);
      }
      
      toast({
        title: lang('common.success'),
        description: lang('templates.toast.uploadSuccess'),
      });

      await loadTemplates();
    } catch (error) {
      console.error('Error uploading template:', error);
      toast({
        title: lang('common.error'),
        description: lang('templates.toast.uploadFailed'),
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    try {
      await TemplateManagementService.deleteTemplate(templateId);
      toast({
        title: lang('common.success'),
        description: lang('templates.library.deleteSuccess'),
      });
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: lang('common.error'),
        description: lang('templates.library.deleteFailed'),
        variant: 'destructive',
      });
    }
  };

  const isSOP = (name: string) => /^SOP(?:-[A-Z]{2,4})?-\d{3}/i.test(name);

  // Eye-icon routing: real draft → TemplateViewDialog; SOP w/o draft →
  // read-only SOPTemplatePreviewDialog (boilerplate); other → TemplateViewDialog.
  const handleView = (template: any) => {
    setSelectedTemplate(template);
    const hasDraft = hasDraftForTemplate(template);
    if (!hasDraft && isSOP(template.name)) {
      setSopPreviewOpen(true);
    } else {
      setViewDialogOpen(true);
    }
  };

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    if (isSOP(template.name)) {
      void openSopEditor(template);
    } else {
      void openNonSopEditor(template);
    }
  };

  // For non-SOP templates: try to open the existing studio draft in the side drawer.
  // Falls back to the metadata edit modal if no draft exists yet.
  const openNonSopEditor = async (template: any) => {
    try {
      const { data, error } = await supabase
        .from('document_studio_templates')
        .select('id, template_id, name, type')
        .eq('company_id', companyId)
        .eq('name', template.name)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        // The drawer loads drafts via the linked CI/template id, NOT the
        // studio row's own primary key. Falling back to the studio row id
        // makes the drawer open in a blank "Create Draft" state.
        const drawerId = (data as any).template_id || data.id;
        setDraftDrawerDoc({ id: drawerId, name: data.name, type: (data as any).type || template.document_type || 'Template' });
      } else {
        setEditDialogOpen(true);
      }
    } catch (e) {
      console.error('Error opening template draft drawer:', e);
      setEditDialogOpen(true);
    }
  };

  const openDrawerForTemplateName = async (name: string) => {
    try {
      const sopNumber = parseSopNumber(name);

      if (sopNumber) {
        const matchedDraft = draftTemplatesBySopNumber.get(sopNumber);
        if (matchedDraft) {
          openDraftInDrawer(matchedDraft, 'SOP');
          return;
        }

        const canonicalName = getCanonicalSopName(name);
        const { data, error } = await supabase
          .from('document_studio_templates')
          .select('id, template_id, name, type, updated_at, metadata')
          .eq('company_id', companyId)
          .eq('name', canonicalName)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          openDraftInDrawer(data as DraftTemplateSummary, 'SOP');
          return;
        }

        // Fallback: a draft may exist under a sub-prefixed name variant
        // (e.g. "SOP-MF-018 …" instead of canonical "SOP-018 …"). Match by
        // the canonical document_number stored in metadata.
        const { data: byNumber, error: byNumberError } = await supabase
          .from('document_studio_templates')
          .select('id, template_id, name, type, updated_at, metadata')
          .eq('company_id', companyId)
          .eq('metadata->>document_number', sopNumber)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (byNumberError) throw byNumberError;
        if (byNumber) {
          openDraftInDrawer(byNumber as DraftTemplateSummary, 'SOP');
          return;
        }
      } else {
        const { data, error } = await supabase
          .from('document_studio_templates')
          .select('id, template_id, name, type, updated_at, metadata')
          .eq('company_id', companyId)
          .eq('name', name)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          openDraftInDrawer(data as DraftTemplateSummary, 'SOP');
          return;
        }
      }

      if (sopNumber) {
        const result = await seedSingleSopForCompany(companyId, companyName, sopNumber);
        if (result.failed > 0) {
          throw new Error(result.errors[0] || 'Failed to create draft.');
        }

        const refreshedLookup = await loadDraftNames();
        const createdDraft = refreshedLookup.get(sopNumber);
        if (createdDraft) {
          openDraftInDrawer(createdDraft, 'SOP');
          return;
        }
      }

      if (!sopNumber) {
        toast({
          title: lang('common.error'),
          description: 'Could not locate the draft for this template.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: lang('common.error'),
          description: 'Could not locate the draft for this SOP.',
          variant: 'destructive',
        });
      }
    } catch (e) {
      console.error('Error opening draft drawer:', e);
      toast({
        title: lang('common.error'),
        description: e instanceof Error ? e.message : 'Failed to open editor.',
        variant: 'destructive',
      });
    }
  };

  const openSopEditor = async (template: any) => {
    const sopKey = parseSopNumber(template.name) || extractSopKey(template.name);
    const hasDraft = hasDraftForTemplate(template);
    if (!hasDraft) {
      const seedResult = await handleUseTemplate(template);
      if (!seedResult.ok) {
        // Toast already raised by handleUseTemplate. Bail out so we don't
        // open the drawer onto a non-existent draft (silent failure).
        return;
      }
    }
    await openDrawerForTemplateName(getEffectiveTemplateName(template));
  };

  const handleUpdateTemplate = async (updatedTemplate: any) => {
    try {
      setIsUpdating(true);
      
      // Determine if this is a SaaS template or company template
      const isSaasTemplate = saasTemplates.some(t => t.id === updatedTemplate.id);
      
      // Prepare updates object
      const updates = {
        name: updatedTemplate.name,
        description: updatedTemplate.description,
        document_type: updatedTemplate.document_type,
        scope: updatedTemplate.scope
      };
      
      await TemplateManagementService.updateOrCreateTemplate(
        companyId, 
        updatedTemplate, 
        updates, 
        isSaasTemplate
      );
      
      toast({
        title: lang('common.success'),
        description: isSaasTemplate
          ? lang('templates.library.companyCopyCreated')
          : lang('templates.library.updateSuccess'),
      });

      await loadTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: lang('common.error'),
        description: lang('templates.library.updateFailed'),
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCleanupDuplicates = async () => {
    try {
      setIsLoading(true);
      const result = await TemplateManagementService.cleanupDuplicateTemplates(companyId);
      toast({
        title: lang('common.success'),
        description: lang('templates.library.cleanupSuccess').replace('{{count}}', String(result.cleaned)),
      });
      await loadTemplates();
    } catch (error) {
      console.error('Error cleaning up duplicates:', error);
      toast({
        title: lang('common.error'),
        description: lang('templates.library.cleanupFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (template: any) => {
    if (template.file_path) {
      try {
        const { SuperAdminTemplateManagementService } = await import('@/services/superAdminTemplateManagementService');
        await SuperAdminTemplateManagementService.downloadTemplateFile(template.file_path, template.file_name || 'template');
      } catch (error) {
        console.error('Download failed:', error);
        toast({
          title: lang('common.error'),
          description: lang('templates.library.downloadFailed'),
          variant: "destructive"
        });
      }
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" /> 
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const filteredTemplates = useMemo(() => {
    const companyTemplateNames = new Set(companyTemplates.map(t => t.name));
    const filteredSaasTemplates = saasTemplates.filter(t => !companyTemplateNames.has(t.name));
    
    let templates: any[] = [
      ...companyTemplates.map(t => ({ ...t, source: 'company' })),
      ...filteredSaasTemplates.map(t => ({ ...t, source: 'saas' })),
    ];
    
    if (filters.documentType && filters.documentType !== 'all') {
      templates = templates.filter(template => 
        template.document_type === filters.documentType
      );
    }

    // Scope filter (Company-wide / Product-specific)
    if (filters.scope && (filters.scope as string) !== 'all') {
      templates = templates.filter(template => template.scope === filters.scope);
    }

    // Multi-select scopes (new TemplateFilterBar). Treat legacy 'company' / 'product'
    // values as equivalent to 'company-wide' / 'product-specific'.
    if (filters.scopes && filters.scopes.length > 0) {
      const allowed = new Set<string>(filters.scopes);
      templates = templates.filter(template => {
        const s = template.scope;
        if (s === 'company' || s === 'company-wide') return allowed.has('company-wide');
        if (s === 'product' || s === 'product-specific') return allowed.has('product-specific');
        return false;
      });
    }

    // Multi-select document types.
    if (filters.documentTypes && filters.documentTypes.length > 0) {
      const allowed = new Set(filters.documentTypes);
      templates = templates.filter(template =>
        template.document_type && allowed.has(template.document_type)
      );
    }

    // Multi-select classification (Generic / Pathway / Device-specific).
    if (filters.tiers && filters.tiers.length > 0) {
      const allowed = new Set(filters.tiers);
      templates = templates.filter(template => {
        const tier = getSopTier(template.name);
        return tier !== null && allowed.has(tier);
      });
    }

    // Multi-select functional sub-prefix (QA / DE / RM / CL / RA / MF / SC).
    if (filters.subPrefixes && filters.subPrefixes.length > 0) {
      const allowed = new Set(filters.subPrefixes);
      templates = templates.filter(template => {
        const sp = getSopSubPrefix(template.name);
        return sp !== null && allowed.has(sp);
      });
    }

    // Search filter — match title/name first, then description.
    const rawSearch = (filters.search || '').trim().toLowerCase();
    const searchTerm = rawSearch.replace(/^-+/, '').replace(/-+$/, '');

    // Detect when the query is purely a sub-prefix token (e.g. "-cl", "cl",
    // "sop-cl", "sop-cl-"). In that case match strictly against the SOP
    // sub-prefix code so unrelated descriptions containing the letters don't
    // pollute results.
    const SUB_PREFIX_CODES = new Set(['qa', 'de', 'rm', 'cl', 'ra', 'mf', 'sc']);
    const subPrefixOnlyMatch = (() => {
      if (!rawSearch) return null;
      const m = rawSearch.match(/^(?:sop[-\s]*)?-?([a-z]{2})-?$/i);
      if (!m) return null;
      const code = m[1].toLowerCase();
      return SUB_PREFIX_CODES.has(code) ? code.toUpperCase() : null;
    })();

    let searchRankMap: Map<string, number> | null = null;
    if (subPrefixOnlyMatch) {
      searchRankMap = new Map();
      templates = templates.filter(template => {
        const sp = getSopSubPrefix(template.name);
        if (sp === subPrefixOnlyMatch) {
          searchRankMap!.set(template.id, 0);
          return true;
        }
        return false;
      });
    } else if (searchTerm) {
      searchRankMap = new Map();
      templates = templates.filter(template => {
        const name = (template.name || '').toLowerCase();
        const displayName = formatSopDisplayName(template.name).toLowerCase();
        const desc = (template.description || '').toLowerCase();
        const nameHit = name.includes(searchTerm) || displayName.includes(searchTerm);
        const descHit = desc.includes(searchTerm);

        if (nameHit) {
          searchRankMap!.set(template.id, 0);
          return true;
        }

        if (descHit) {
          searchRankMap!.set(template.id, 1);
          return true;
        }

        return false;
      });
    }

    // Apply sorting
    if (sortColumn) {
      templates.sort((a, b) => {
        if (searchRankMap) {
          const rankA = searchRankMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
          const rankB = searchRankMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
          if (rankA !== rankB) return rankA - rankB;
        }

        // Name column uses the shared SOP-aware comparator so the Template
        // Library and Company Documents views produce the same order.
        if (sortColumn === 'name') {
          const cmp = compareSopDocuments(a.name, b.name);
          return sortDirection === 'asc' ? cmp : -cmp;
        }

        let aVal = '';
        let bVal = '';
        
        switch (sortColumn) {
          case 'name': aVal = a.name || ''; bVal = b.name || ''; break;
          case 'description': aVal = a.description || ''; bVal = b.description || ''; break;
          case 'type': aVal = a.document_type || ''; bVal = b.document_type || ''; break;
          case 'tier': {
            // Order: A → B → C → none. Sort key uses '4' for non-SOPs to push them to the end.
            const order: Record<string, string> = { A: '1', B: '2', C: '3' };
            aVal = order[getSopTier(a.name) ?? ''] ?? '4';
            bVal = order[getSopTier(b.name) ?? ''] ?? '4';
            break;
          }
          case 'category': aVal = a.category || ''; bVal = b.category || ''; break;
          case 'scope': aVal = a.scope || ''; bVal = b.scope || ''; break;
          case 'created': aVal = a.created_at || ''; bVal = b.created_at || ''; break;
        }
        
        const cmp = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' });
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    } else if (searchRankMap) {
      // No explicit sort — keep title/name matches above description-only matches,
      // preserving original order within each group.
      templates = [
        ...templates.filter(t => (searchRankMap!.get(t.id) ?? Number.MAX_SAFE_INTEGER) === 0),
        ...templates.filter(t => (searchRankMap!.get(t.id) ?? Number.MAX_SAFE_INTEGER) === 1),
      ];
    }
    
    return templates;
  }, [companyTemplates, saasTemplates, filters, sortColumn, sortDirection]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">{lang('templates.library.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compact seed status + admin overflow — one line tall when collapsed */}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <SopAutoSeedStatus
            variant="compact"
            companyId={companyId}
            companyName={activeCompanyRole?.companyName || companyName}
            onSeeded={() => { loadTemplates(); loadDraftNames(); }}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label="Template admin actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleCleanupDuplicates} disabled={isLoading}>
              {lang('templates.library.cleanupDuplicates')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filters — Documents-style search + popover */}
      <TemplateFilterBar
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Bulk-seed amber bar — shown only when ≥1 missing SOP row is selected */}
      {bulkSeedSelected.size > 0 && (
        <div className="flex items-center gap-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2">
          <span className="text-sm font-medium text-amber-900">
            {bulkSeedSelected.size} SOP{bulkSeedSelected.size === 1 ? '' : 's'} selected
          </span>
          <div className="h-4 w-px bg-amber-300" />
          <Button
            size="sm"
            className="h-8 text-xs"
            disabled={isBulkSeeding || !companyId || !companyName}
            onClick={async () => {
              if (!companyId || !companyName) return;
              setIsBulkSeeding(true);
              const keys = Array.from(bulkSeedSelected);
              let inserted = 0;
              let failed = 0;
              for (const sopKey of keys) {
                try {
                  const r = await seedSingleSopForCompany(companyId, companyName, sopKey);
                  inserted += r.inserted;
                  failed += r.failed;
                } catch {
                  failed += 1;
                }
              }
              setIsBulkSeeding(false);
              setBulkSeedSelected(new Set());
              await loadTemplates();
              await loadDraftNames();
              if (inserted > 0) {
                toast({
                  title: 'SOPs seeded',
                  description: `${inserted} SOP${inserted === 1 ? '' : 's'} provisioned${failed > 0 ? `, ${failed} failed` : ''}.`,
                });
              } else if (failed > 0) {
                toast({
                  title: 'Bulk seed failed',
                  description: `${failed} SOP${failed === 1 ? '' : 's'} failed to seed.`,
                  variant: 'destructive',
                });
              }
            }}
          >
            {isBulkSeeding ? (
              <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Seeding…</>
            ) : (
              `Seed selected SOPs`
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs"
            disabled={isBulkSeeding}
            onClick={() => setBulkSeedSelected(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Templates Table */}
      <div className="border rounded-lg">
        <Table>
           <TableHeader>
             <TableRow>
               <TableHead className="w-[40px]">
                 {(() => {
                   const missingKeys = filteredTemplates
                     .filter(t => isTierASop(t.name) && !hasDraftForTemplate(t))
                     .map(t => extractSopKey(t.name))
                     .filter((k): k is string => !!k);
                   if (missingKeys.length === 0) return null;
                   const allSelected = missingKeys.every(k => bulkSeedSelected.has(k));
                   return (
                     <Checkbox
                       checked={allSelected}
                       onCheckedChange={(checked) => {
                         setBulkSeedSelected(prev => {
                           const next = new Set(prev);
                           if (checked) missingKeys.forEach(k => next.add(k));
                           else missingKeys.forEach(k => next.delete(k));
                           return next;
                         });
                       }}
                       aria-label="Select all missing SOPs"
                     />
                   );
                 })()}
               </TableHead>
               <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                 <span className="flex items-center">{lang('templates.library.headers.templateName')}<SortIcon column="name" /></span>
               </TableHead>
               <TableHead className="cursor-pointer select-none" onClick={() => handleSort('description')}>
                 <span className="flex items-center">{lang('templates.library.headers.description')}<SortIcon column="description" /></span>
               </TableHead>
               <TableHead className="cursor-pointer select-none" onClick={() => handleSort('type')}>
                 <span className="flex items-center">{lang('templates.library.headers.type')}<SortIcon column="type" /></span>
               </TableHead>
               <TableHead className="cursor-pointer select-none" onClick={() => handleSort('tier')}>
                  <span className="flex items-center">Tier<SortIcon column="tier" /></span>
               </TableHead>
               <TableHead className="cursor-pointer select-none" onClick={() => handleSort('category')}>
                 <span className="flex items-center">{lang('templates.library.headers.category')}<SortIcon column="category" /></span>
               </TableHead>
               <TableHead className="cursor-pointer select-none" onClick={() => handleSort('scope')}>
                 <span className="flex items-center">{lang('templates.library.headers.scope')}<SortIcon column="scope" /></span>
               </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('created')}>
                 <span className="flex items-center">{lang('templates.library.headers.created')}<SortIcon column="created" /></span>
               </TableHead>
               <TableHead className="text-right">{lang('templates.library.headers.actions')}</TableHead>
             </TableRow>
           </TableHeader>
          <TableBody>
             {filteredTemplates.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                   {lang('templates.library.noTemplates')}
                 </TableCell>
               </TableRow>
             ) : (
               filteredTemplates.map((template) => {
                 const sopKey = extractSopKey(template.name);
                 const isFoundation = isTierASop(template.name);
                 const wisForRow = sopKey ? (wisBySopKey.get(sopKey) ?? []) : [];
                 const isExpanded = sopKey ? expandedSopKeys.has(sopKey) : false;
                 const showExpander = isFoundation && !!sopKey;
                 return (
                 <React.Fragment key={template.id}>
                 <TableRow>
                   <TableCell>
                    <div className="flex items-center gap-1">
                    {showExpander && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 -ml-1"
                        onClick={() => sopKey && toggleSopExpanded(sopKey)}
                        aria-label={isExpanded ? 'Collapse Work Instructions' : 'Expand Work Instructions'}
                        title={wisForRow.length > 0 ? `${wisForRow.length} Work Instructions` : 'No global Work Instructions yet'}
                      >
                        {isExpanded
                          ? <ChevronDown className="h-3.5 w-3.5" />
                          : <ChevronRight className="h-3.5 w-3.5" />}
                      </Button>
                    )}
                    {(() => {
                      const isMissing = isTierASop(template.name) && !hasDraftForTemplate(template);
                      if (isMissing && sopKey) {
                       return (
                         <Checkbox
                           checked={bulkSeedSelected.has(sopKey)}
                           onCheckedChange={(checked) => {
                             setBulkSeedSelected(prev => {
                               const next = new Set(prev);
                               if (checked) next.add(sopKey);
                               else next.delete(sopKey);
                               return next;
                             });
                           }}
                           aria-label={`Select ${sopKey} for bulk seed`}
                         />
                       );
                     }
                      const seeded = hasDraftForTemplate(template);
                      return (
                        <span title={seeded ? 'Seeded — draft exists' : 'Not seeded yet'} className="inline-flex">
                          <FileText
                            className={`h-4 w-4 ${seeded ? 'text-emerald-600' : 'text-muted-foreground'}`}
                            aria-label={seeded ? 'Seeded — draft exists' : 'Not seeded yet'}
                          />
                        </span>
                      );
                   })()}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {stripDocPrefix(formatSopDisplayName(template.name))}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {template.description || lang('templates.library.noDescription')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-xs">
                        {template.document_type || '-'}
                      </Badge>
                      {isFoundation && (
                        <span className="text-[10px] text-muted-foreground inline-flex items-center gap-0.5">
                          <ListChecks className="h-3 w-3" />
                          {wisForRow.length} {wisForRow.length === 1 ? 'WI' : 'WIs'}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <TierBadge source={template.name} />
                  </TableCell>
                   <TableCell>
                     <Badge variant="outline" className="text-xs">
                       {template.category || lang('templates.library.general')}
                     </Badge>
                   </TableCell>
                   <TableCell>
                     <Badge
                        variant="outline"
                        className="text-xs"
                     >
                       {template.scope === 'company' ? lang('templates.library.scopes.companyWide') :
                        template.scope === 'product' ? lang('templates.library.scopes.productSpecific') :
                        template.scope === 'both' ? lang('templates.library.scopes.both') : lang('templates.library.scopes.companyWide')}
                     </Badge>
                   </TableCell>
                   <TableCell className="text-muted-foreground text-sm">
                    {template.created_at ? 
                      new Date(template.created_at).toLocaleDateString() : 
                      'N/A'
                    }
                  </TableCell>
                   <TableCell className="text-right">
                     <div className="flex items-center justify-end gap-1">
                        <Button
                         variant="ghost"
                         size="icon"
                         className="h-8 w-8"
                         onClick={() => handleView(template)}
                          title={hasDraftForTemplate(template) ? 'View draft' : 'Preview template'}
                       >
                         <Eye className="h-4 w-4" />
                       </Button>
                       <Button
                         variant="ghost"
                         size="icon"
                         className="h-8 w-8"
                         onClick={() => handleEdit(template)}
                         disabled={seedingSop === extractSopKey(template.name)}
                         title={
                            isTierASop(template.name) && !hasDraftForTemplate(template)
                             ? 'Provision this SOP for the company (auto-personalized) and open editor'
                             : 'Edit template'
                         }
                       >
                         {seedingSop === extractSopKey(template.name) ? (
                           <Loader2 className="h-4 w-4 animate-spin" />
                         ) : (
                           <Edit className="h-4 w-4" />
                         )}
                       </Button>
                       {template.file_path && (
                         <Button
                           variant="ghost"
                           size="icon"
                           className="h-8 w-8"
                           onClick={() => handleDownload(template)}
                           title="Download template"
                         >
                           <Download className="h-4 w-4" />
                         </Button>
                       )}
                       {template.source === 'company' && (
                         <Button
                           variant="ghost"
                           size="icon"
                           className="h-8 w-8 text-destructive hover:text-destructive"
                           onClick={() => handleDelete(template.id)}
                           title="Delete template"
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       )}
                     </div>
                   </TableCell>
                </TableRow>
                  {showExpander && isExpanded && (
                    <TableRow className="bg-muted/30 hover:bg-muted/40">
                      <TableCell />
                      <TableCell colSpan={8} className="py-2">
                        {wisForRow.length === 0 ? (
                          <div className="text-xs text-muted-foreground italic">
                            No global Work Instructions yet — use the “Generate WIs” action above to seed them for this SOP.
                          </div>
                        ) : (
                          <ul className="space-y-1">
                            {wisForRow.map((wi) => (
                              <li key={wi.id} className="flex items-start justify-between gap-3 text-sm">
                                <div className="min-w-0">
                                  <span className="font-mono text-xs text-muted-foreground mr-2">{wi.wi_number}</span>
                                  <span className="font-medium">{wi.title}</span>
                                  {wi.focus && (
                                    <div className="text-xs text-muted-foreground truncate">{wi.focus}</div>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => handleOpenGlobalWI(wi)}
                                  disabled={openingWiId === wi.id}
                                >
                                  {openingWiId === wi.id
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <ExternalLink className="h-3.5 w-3.5 mr-1" />}
                                  Open
                                </Button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                  </React.Fragment>
                  );
               })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Upload Dialog */}
      <EnhancedTemplateUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleUpload}
        isUploading={isUploading}
        companyId={companyId}
      />

      {/* View Dialog */}
      <TemplateViewDialog
        template={selectedTemplate}
        isOpen={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setSelectedTemplate(null);
        }}
      />

      {/* Edit Dialog */}
      <TemplateEditDialog
        template={selectedTemplate}
        isOpen={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedTemplate(null);
        }}
        onSave={handleUpdateTemplate}
        isLoading={isUpdating}
      />
      {/* SOP Preview Dialog */}
      <SOPTemplatePreviewDialog
        template={selectedTemplate}
        isOpen={sopPreviewOpen}
        onClose={() => {
          setSopPreviewOpen(false);
          setSelectedTemplate(null);
        }}
        onDraftCreated={() => loadDraftNames()}
        companyId={companyId}
        companyName={activeCompanyRole?.companyName || ''}
        viewOnly={!!selectedTemplate && !draftTemplateNames.has(selectedTemplate.name)}
      />

      {/* Document Draft Side Drawer (SOP authoring) */}
      <DocumentDraftDrawer
        open={!!draftDrawerDoc}
        onOpenChange={(open) => { if (!open) setDraftDrawerDoc(null); }}
        documentId={draftDrawerDoc?.id || ''}
        documentName={draftDrawerDoc?.name || ''}
        documentType={draftDrawerDoc?.type || 'SOP'}
        companyId={companyId}
        companyName={activeCompanyRole?.companyName || companyName}
        onDocumentSaved={() => loadDraftNames()}
      />
    </div>
  );
}