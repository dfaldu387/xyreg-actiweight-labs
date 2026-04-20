import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Chip,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  Collapse,
  CircularProgress
} from '@mui/material';
import { ChevronRight, ExpandMore, Add as AddIcon } from '@mui/icons-material';
import { DocumentItem } from '@/types/client';
import { DocumentTechApplicability } from '@/types/documentTypes';
import { toast } from 'sonner';
import { DocumentFileUpload } from '@/components/common/DocumentFileUpload';
import { useReviewerGroups } from '@/hooks/useReviewerGroups';
import { useExistingTags } from '@/hooks/useExistingTags';
import { MultiAuthorSelector } from '@/components/common/MultiAuthorSelector';
import { PhaseActivationService } from '@/services/phaseActivationService';
import { supabase } from '@/integrations/supabase/client';
import { useComplianceSections } from '@/hooks/useComplianceSections';
import { useTranslation } from '@/hooks/useTranslation';
// import { ReasonForChangeDialog } from '@/components/audit-log/ReasonForChangeDialog';

// Sub-component to render inline sections for a selected phase
function PhaseSections({ companyId, phaseId, selectedSectionId, isLoading: parentLoading, onSectionSelect }: {
  companyId: string;
  phaseId: string;
  selectedSectionId: string;
  isLoading: boolean;
  onSectionSelect: (phaseId: string, sectionId: string, sectionName: string) => void;
}) {
  const { sections, isLoading, createSection } = useComplianceSections(companyId, { phaseId, enabled: true });
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsSaving(true);
    try {
      const newSection = await createSection(newName.trim(), phaseId);
      if (newSection) {
        onSectionSelect(phaseId, newSection.id, newSection.name);
        setNewName('');
        setIsAdding(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1 }}>
        <CircularProgress size={14} />
        <Typography variant="body2" color="text.secondary">Loading sections...</Typography>
      </Box>
    );
  }

  return (
    <>
      {sections.length === 0 && !isAdding && (
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1, fontStyle: 'italic' }}>
          No sections available for this phase
        </Typography>
      )}
      {sections.map(section => (
        <Box
          key={section.id}
          sx={{
            display: 'flex', alignItems: 'center', px: 2, py: 0.5,
            cursor: 'pointer', '&:hover': { bgcolor: '#eeeeee' },
            borderBottom: '1px solid #eeeeee',
          }}
          onClick={() => !parentLoading && onSectionSelect(phaseId, section.id, section.name)}
        >
          <Radio
            checked={selectedSectionId === section.id}
            disabled={parentLoading}
            size="small"
            sx={{ p: 0.25, mr: 1 }}
          />
          <Typography variant="body2" fontSize="0.8125rem">{section.name}</Typography>
        </Box>
      ))}

      {/* Create Section */}
      {isAdding ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1 }}>
          <TextField
            size="small"
            placeholder="Section name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setIsAdding(false); setNewName(''); } }}
            disabled={isSaving}
            autoFocus
            sx={{ flex: 1, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.8125rem' } }}
          />
          <Button size="small" variant="contained" onClick={handleCreate} disabled={isSaving || !newName.trim()} sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: '0.75rem' }}>
            {isSaving ? <CircularProgress size={14} /> : 'Add'}
          </Button>
          <Button size="small" onClick={() => { setIsAdding(false); setNewName(''); }} disabled={isSaving} sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: '0.75rem' }}>
            Cancel
          </Button>
        </Box>
      ) : (
        <Box
          sx={{ display: 'flex', alignItems: 'center', px: 2, py: 0.75, cursor: 'pointer', '&:hover': { bgcolor: '#eeeeee' } }}
          onClick={() => !parentLoading && setIsAdding(true)}
        >
          <AddIcon sx={{ fontSize: 16, mr: 0.5, color: 'primary.main' }} />
          <Typography variant="body2" fontSize="0.8125rem" color="primary.main" fontWeight={500}>
            Create Section
          </Typography>
        </Box>
      )}
    </>
  );
}

interface DocumentEditDialogProps {
  document: DocumentItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentUpdated: () => void;
  companyId: string;
}

// Helper function to format date for date input (YYYY-MM-DD)
const formatDateForInput = (dateValue: string | Date | null | undefined): string => {
  if (!dateValue) return '';
  if (typeof dateValue === 'string') {
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    // If it's a timestamp, extract the date part
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    return '';
  }
  if (dateValue instanceof Date) {
    if (!isNaN(dateValue.getTime())) {
      return dateValue.toISOString().split('T')[0];
    }
  }
  return '';
};

export function DocumentEditDialog({
  document,
  open,
  onOpenChange,
  onDocumentUpdated,
  companyId
}: DocumentEditDialogProps) {
  const { lang } = useTranslation();
  const [formData, setFormData] = useState({
    name: document.name || '',
    description: (document as any).description || '',
    status: (document as any).status || 'Not Started',
    subSection: (document as any).sub_section || '',
    sectionId: ((document as any).section_ids && (document as any).section_ids[0]) || '',
    documentReference: (document as any).document_reference || '',
    version: (document as any).version || '',
    date: formatDateForInput((document as any).date),
    dueDate: formatDateForInput((document as any).due_date),
    isCurrentEffectiveVersion: (document as any).is_current_effective_version || false,
    authorsIds: (document as any).authors_ids || [],
    needTemplateUpdate: (document as any).need_template_update || false,
    documentType: document.type || 'Standard',
    techApplicability: (document.techApplicability || 'All device types') as DocumentTechApplicability,
    phaseId: (document as any).phase_id || '',
    isRecord: (document as any).is_record || false,
    selectedCompany: false,
    selectedDevice: false,
    selectedCoreDevice: false,
    selectedPhases: [] as string[],
    phaseSectionMap: {} as Record<string, { sectionId: string; sectionName: string }>,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<string | undefined>((document as any).file_path);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [reviewerGroupIds, setReviewerGroupIds] = useState<string[]>((document as any).reviewer_group_ids || []);
  const [activePhases, setActivePhases] = useState<Array<{ id: string; name: string; description?: string }>>([]);
  const [loadingPhases, setLoadingPhases] = useState(false);
  const [loadingDocData, setLoadingDocData] = useState(true);
  const [noPhaseId, setNoPhaseId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Fetch existing tags for auto-suggestions
  const { data: existingTags = [] } = useExistingTags(companyId);

  // Fetch reviewer groups
  const { reviewerGroups, isLoading: isLoadingGroups } = useReviewerGroups(companyId);

  // Fetch "No Phase" ID directly from company_phases (may not be in active phases)
  useEffect(() => {
    if (companyId) {
      supabase
        .from('company_phases')
        .select('id')
        .eq('company_id', companyId)
        .ilike('name', 'no phase')
        .maybeSingle()
        .then(({ data }) => {
          if (data) setNoPhaseId(data.id);
        });
    }
  }, [companyId]);

  // Load document data when dialog opens (wait for phases to finish loading)
  useEffect(() => {
    if (open && document.id && !loadingPhases && (activePhases.length > 0 || noPhaseId)) {
      const loadDocumentData = async () => {
        setLoadingDocData(true);
        try {
          // Try phase_assigned_document_template first
          let { data: docData } = await supabase
            .from('phase_assigned_document_template')
            .select('*')
            .eq('id', document.id)
            .maybeSingle();

          // If not found, try documents table
          if (!docData) {
            const { data: docData2 } = await supabase
              .from('documents')
              .select('*')
              .eq('id', document.id)
              .maybeSingle();

            if (docData2) {
              docData = docData2 as any;
            }
          }

          if (docData) {
            // Determine location type from existing data
            const docScope = docData.document_scope;
            const docPhaseId = docData.phase_id || '';
            const isExcluded = docData.is_excluded === true;
            let isCompany = false;
            let isDevice = false;
            let isCoreDevice = false;
            let phaseSelections: string[] = [];

            // Use noPhaseId from direct lookup OR from activePhases
            const noPhaseMatch = activePhases.find(p => p.name.toLowerCase() === 'no phase');
            const resolvedNoPhaseId = noPhaseMatch?.id || noPhaseId;

            // If doc was removed (is_excluded), don't pre-select any location
            if (!isExcluded) {
              if (docScope === 'company_document') {
                isCompany = true;
              } else if (docScope === 'company_template' && docPhaseId) {
                isDevice = true;
                if (resolvedNoPhaseId && docPhaseId === resolvedNoPhaseId) {
                  isCoreDevice = true;
                } else {
                  phaseSelections = [docPhaseId];
                }
              }
            }

            // Also check if a company_document sibling exists for this doc name
            if (isDevice && docData.name) {
              const { data: companySibling } = await supabase
                .from('phase_assigned_document_template')
                .select('id')
                .eq('company_id', companyId)
                .eq('name', docData.name)
                .eq('document_scope', 'company_document')
                .eq('is_excluded', false)
                .is('product_id', null)
                .maybeSingle();
              if (companySibling) isCompany = true;
            }
            // Also check if device siblings exist for a company doc
            if (isCompany && !isDevice && docData.name) {
              const { data: deviceSiblings } = await supabase
                .from('phase_assigned_document_template')
                .select('phase_id, section_ids, sub_section')
                .eq('company_id', companyId)
                .eq('name', docData.name)
                .eq('document_scope', 'company_template')
                .eq('is_excluded', false)
                .is('product_id', null);
              if (deviceSiblings && deviceSiblings.length > 0) {
                isDevice = true;
                for (const sibling of deviceSiblings) {
                  if (!sibling.phase_id) continue;
                  if (resolvedNoPhaseId && sibling.phase_id === resolvedNoPhaseId) {
                    isCoreDevice = true;
                    continue;
                  }
                  phaseSelections.push(sibling.phase_id);
                }
              }
            }

            // Build phaseSectionMap from existing data
            const initPhaseSectionMap: Record<string, { sectionId: string; sectionName: string }> = {};

            // Find all sibling rows with the same name to pre-select Core + phases
            if (isDevice && docData.name) {
              const { data: siblingDocs } = await supabase
                .from('phase_assigned_document_template')
                .select('phase_id, section_ids, sub_section')
                .eq('company_id', companyId)
                .eq('name', docData.name)
                .eq('document_scope', 'company_template')
                .eq('is_excluded', false)
                .is('product_id', null);

              if (siblingDocs && siblingDocs.length > 0) {
                phaseSelections = [];
                isCoreDevice = false;
                for (const sibling of siblingDocs) {
                  if (!sibling.phase_id) continue;
                  // "No Phase" row = Core
                  if (resolvedNoPhaseId && sibling.phase_id === resolvedNoPhaseId) {
                    isCoreDevice = true;
                    continue;
                  }
                  phaseSelections.push(sibling.phase_id);
                  if (sibling.section_ids && sibling.section_ids[0] && sibling.sub_section) {
                    initPhaseSectionMap[sibling.phase_id] = {
                      sectionId: sibling.section_ids[0],
                      sectionName: sibling.sub_section,
                    };
                  }
                }
              }
            }

            setFormData({
              name: docData.name || '',
              description: docData.description || '',
              status: docData.status || 'Not Started',
              subSection: docData.sub_section || '',
              sectionId: (docData.section_ids && docData.section_ids[0]) || '',
              documentReference: docData.document_reference || '',
              version: docData.version || '',
              date: formatDateForInput(docData.date),
              dueDate: formatDateForInput(docData.due_date),
              isCurrentEffectiveVersion: docData.is_current_effective_version || false,
              authorsIds: docData.authors_ids || [],
              needTemplateUpdate: docData.need_template_update || false,
              documentType: docData.document_type || 'Standard',
              techApplicability: (docData.tech_applicability || 'All device types') as DocumentTechApplicability,
              phaseId: docPhaseId,
              isRecord: (docData as any).is_record || false,
              selectedCompany: isCompany,
              selectedDevice: isDevice,
              selectedCoreDevice: isCoreDevice,
              selectedPhases: phaseSelections,
              phaseSectionMap: initPhaseSectionMap,
            });
            setFilePath(docData.file_path || undefined);
            setReviewerGroupIds(docData.reviewer_group_ids || []);
            setTags(Array.isArray((docData as any).tags) ? (docData as any).tags : []);
          }
        } catch (error) {
          console.error('Error loading document data:', error);
        } finally {
          setLoadingDocData(false);
        }
      };

      loadDocumentData();
    }
  }, [open, document.id, activePhases, noPhaseId, loadingPhases]);

  // Load active phases when dialog opens
  useEffect(() => {
    if (open && companyId) {
      const loadActivePhases = async () => {
        setLoadingPhases(true);
        try {
          const phases = await PhaseActivationService.getActivePhases(companyId);
          if (phases && Array.isArray(phases) && phases.length > 0) {
            const mappedPhases = phases.map(phase => ({
              id: phase.phase_id,
              name: phase.phase?.name || 'Unknown Phase',
              description: phase.phase?.description
            }));
            setActivePhases(mappedPhases);
          } else {
            setActivePhases([]);
          }
        } catch (error) {
          console.error('Error loading active phases:', error);
        } finally {
          setLoadingPhases(false);
        }
      };
      loadActivePhases();
    }
  }, [open, companyId]);

  const documentTypes = ['Standard', 'Regulatory', 'Technical', 'Clinical', 'Quality', 'Design', 'SOP'];
  const techOptions: DocumentTechApplicability[] = [
    'All device types',
    'Software devices', 
    'Hardware devices',
    'Combination devices',
    'Implantable devices'
  ];

  const handleFileChange = (file: File | null, uploadPath?: string) => {
    console.log('File change event:', { file: file?.name, uploadPath });

    if (file && !uploadPath) {
      setIsFileUploading(true);
      setSelectedFile(file);
    } else if (file && uploadPath) {
      setIsFileUploading(false);
      setSelectedFile(file);
      setFilePath(uploadPath);
      console.log('File upload completed, path set to:', uploadPath);
    } else if (file === null) {
      setIsFileUploading(false);
      setSelectedFile(null);
      setFilePath(undefined);
    }
  };

  const handleReviewerGroupToggle = (groupId: string) => {
    setReviewerGroupIds(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleCompanyToggle = () => {
    setFormData(prev => ({ ...prev, selectedCompany: !prev.selectedCompany }));
  };

  const handleDeviceToggle = () => {
    setFormData(prev => ({
      ...prev,
      selectedDevice: !prev.selectedDevice,
      ...(!prev.selectedDevice ? {} : { selectedCoreDevice: false, selectedPhases: [], phaseId: '', subSection: '', sectionId: '', phaseSectionMap: {} }),
    }));
  };

  const handlePhaseToggle = (phaseId: string, checked: boolean) => {
    setFormData(prev => {
      const newMap = { ...prev.phaseSectionMap };
      if (!checked) delete newMap[phaseId];
      return {
        ...prev,
        selectedPhases: checked ? [...prev.selectedPhases, phaseId] : prev.selectedPhases.filter(id => id !== phaseId),
        phaseSectionMap: newMap,
      };
    });
  };

  const handleSectionSelect = (phaseId: string, sectionId: string, sectionName: string) => {
    setFormData(prev => {
      const current = prev.phaseSectionMap[phaseId];
      const isDeselect = current?.sectionId === sectionId;
      const newMap = { ...prev.phaseSectionMap };
      if (isDeselect) {
        delete newMap[phaseId];
      } else {
        newMap[phaseId] = { sectionId, sectionName };
      }
      return { ...prev, phaseSectionMap: newMap };
    });
  };

  // Filter out "No Phase" from phase list (Core covers it)
  const displayPhases = activePhases.filter(p => p.name.toLowerCase() !== 'no phase');
  const noPhaseEntryFromActive = activePhases.find(p => p.name.toLowerCase() === 'no phase');
  // Use active phases entry if available, otherwise use direct lookup
  const noPhaseEntry = noPhaseEntryFromActive || (noPhaseId ? { id: noPhaseId, name: 'No Phase' } : null);

  const handleSaveClick = () => {
    if (!formData.name.trim()) {
      toast.error(lang('companySettings.editDocumentDialog.documentNameRequired'));
      return;
    }
    if (isLoading || isFileUploading) return;
    // setShowReasonDialog(true); // Reason dialog disabled — saving directly
    handleSave();
  };

  const handleSave = async (reason?: string) => {
    if (!formData.name.trim()) {
      toast.error(lang('companySettings.editDocumentDialog.documentNameRequired'));
      return;
    }

    if (isLoading || isFileUploading) return;

    setIsLoading(true);
    try {
      const resolvedNoPhase = noPhaseEntry?.id || noPhaseId || formData.phaseId || null;

      // Guard: if Core selected but no phase ID resolved, abort
      if (formData.selectedDevice && formData.selectedCoreDevice && !resolvedNoPhase) {
        toast.error('Could not resolve Core phase ID. Please try again.');
        setIsLoading(false);
        return;
      }
      const docName = formData.name.trim();

      // Common fields shared across all phase rows
      const commonFields = {
        name: docName,
        description: formData.description || null,
        document_type: formData.documentType,
        status: formData.status,
        tech_applicability: formData.techApplicability,
        reviewer_group_ids: reviewerGroupIds.length > 0 ? reviewerGroupIds : null,
        file_path: filePath || null,
        file_name: selectedFile?.name || (document as any).file_name || null,
        file_size: selectedFile?.size || (document as any).file_size || null,
        file_type: selectedFile?.type || (document as any).file_type || null,
        document_reference: formData.documentReference || null,
        version: formData.version || null,
        date: formData.date || null,
        due_date: formData.dueDate || null,
        is_current_effective_version: formData.isCurrentEffectiveVersion,
        authors_ids: formData.authorsIds.length > 0 ? formData.authorsIds : null,
        need_template_update: formData.needTemplateUpdate,
        is_record: formData.isRecord,
        tags: tags.length > 0 ? tags : [],
        is_excluded: false,
        updated_at: new Date().toISOString(),
      };

      let successCount = 0;

      // Company doc — upsert or soft-delete
      if (formData.selectedCompany) {
        const companyFields = { ...commonFields, document_scope: 'company_document' as const, phase_id: resolvedNoPhase, sub_section: null as string | null, section_ids: null as string[] | null };

        const { data: companyExisting } = await supabase
          .from('phase_assigned_document_template')
          .select('id')
          .eq('company_id', companyId)
          .eq('name', docName)
          .eq('document_scope', 'company_document')
          .eq('is_excluded', false)
          .is('product_id', null)
          .maybeSingle();

        if (companyExisting) {
          await supabase.from('phase_assigned_document_template').update(companyFields).eq('id', companyExisting.id);
          successCount++;
        } else {
          await supabase.from('phase_assigned_document_template').insert({ ...companyFields, company_id: companyId });
          successCount++;
        }
      } else {
        // Company unchecked — soft-delete existing company row if any
        const { data: companyExisting } = await supabase
          .from('phase_assigned_document_template')
          .select('id')
          .eq('company_id', companyId)
          .eq('name', docName)
          .eq('document_scope', 'company_document')
          .eq('is_excluded', false)
          .is('product_id', null)
          .maybeSingle();

        if (companyExisting) {
          await supabase
            .from('phase_assigned_document_template')
            .update({ is_excluded: true, updated_at: new Date().toISOString() })
            .eq('id', companyExisting.id);
        }
      }

      // Core device doc — save/upsert or soft-delete Core row
      if (formData.selectedDevice) {
        const corePhaseId = resolvedNoPhase;

        // Find existing Core row
        const { data: coreExisting } = await supabase
          .from('phase_assigned_document_template')
          .select('id')
          .eq('company_id', companyId)
          .eq('name', docName)
          .eq('phase_id', corePhaseId)
          .eq('document_scope', 'company_template')
          .is('product_id', null)
          .maybeSingle();

        if (formData.selectedCoreDevice) {
          // Core selected — upsert
          const coreFields = { ...commonFields, document_scope: 'company_template' as const, phase_id: corePhaseId, sub_section: null as string | null, section_ids: null as string[] | null };
          if (coreExisting) {
            await supabase.from('phase_assigned_document_template').update(coreFields).eq('id', coreExisting.id);
            successCount++;
          } else {
            await supabase.from('phase_assigned_document_template').insert({ ...coreFields, company_id: companyId });
            successCount++;
          }
        } else if (coreExisting) {
          // Core unchecked — soft-delete the existing Core row
          await supabase
            .from('phase_assigned_document_template')
            .update({ is_excluded: true, updated_at: new Date().toISOString() })
            .eq('id', coreExisting.id);
        }
      }

      // Phase-specific device docs (can coexist with Core)
      if (formData.selectedDevice && formData.selectedPhases.length > 0) {
        // Multi-phase save: one row per selected phase

        // 1. Find all existing sibling rows for this doc name
        const { data: existingRows } = await supabase
          .from('phase_assigned_document_template')
          .select('id, phase_id')
          .eq('company_id', companyId)
          .eq('name', docName)
          .eq('document_scope', 'company_template')
          .is('product_id', null);

        const existingByPhase = new Map<string, string>();
        (existingRows || []).forEach(r => {
          if (r.phase_id && r.phase_id !== resolvedNoPhase) {
            existingByPhase.set(r.phase_id, r.id);
          }
        });

        // 2. Soft-delete rows for phases that are no longer selected
        // Also update common fields (tags, status, etc.) on ALL existing sibling rows
        for (const [phaseId, rowId] of existingByPhase.entries()) {
          if (!formData.selectedPhases.includes(phaseId)) {
            await supabase
              .from('phase_assigned_document_template')
              .update({ is_excluded: true, updated_at: new Date().toISOString() })
              .eq('id', rowId);
          } else {
            // Will be fully updated in step 3 below
          }
        }

        // 2b. Update common fields on ALL non-excluded sibling rows (including those not in selectedPhases)
        // This ensures tags, status, description etc. are consistent across all phase rows
        const allSiblingIds = (existingRows || []).map(r => r.id);
        if (allSiblingIds.length > 0) {
          const { tags: tagValues, document_scope, is_excluded, updated_at, phase_id, sub_section, section_ids, ...commonFieldsForSync } = commonFields as any;
          await supabase
            .from('phase_assigned_document_template')
            .update({ tags: tags.length > 0 ? tags : [], status: formData.status, description: formData.description || null, document_type: formData.documentType, tech_applicability: formData.techApplicability, authors_ids: formData.authorsIds.length > 0 ? formData.authorsIds : null, updated_at: new Date().toISOString() })
            .in('id', allSiblingIds);
        }

        // 3. Upsert a row for each selected phase with its own section
        for (const phaseId of formData.selectedPhases) {
          const phaseSection = formData.phaseSectionMap[phaseId];
          const perPhaseFields = {
            ...commonFields,
            document_scope: 'company_template' as const,
            phase_id: phaseId,
            sub_section: phaseSection?.sectionName || null,
            section_ids: phaseSection?.sectionId ? [phaseSection.sectionId] : null,
          };

          const existingId = existingByPhase.get(phaseId);
          if (existingId) {
            // Update existing row
            const { error } = await supabase
              .from('phase_assigned_document_template')
              .update(perPhaseFields)
              .eq('id', existingId);
            if (!error) successCount++;
          } else {
            // Insert new row
            const { error } = await supabase
              .from('phase_assigned_document_template')
              .insert({ ...perPhaseFields, company_id: companyId });
            if (!error) successCount++;
          }

          // Link section to phase in compliance_document_sections
          if (phaseSection?.sectionId) {
            try {
              await (supabase as any)
                .from('compliance_document_sections')
                .update({ phase_id: phaseId })
                .eq('id', phaseSection.sectionId);
            } catch (err) {
              console.error('Error linking section to phase:', err);
            }
          }
        }
      }

      if (successCount > 0) {
        console.log('DocumentEditDialog: Document updated successfully', reason ? `Reason: ${reason}` : '');
        toast.success(lang('companySettings.editDocumentDialog.documentUpdatedSuccess'));
        const parts: string[] = [];
        if (formData.selectedCompany) parts.push('Company');
        if (formData.selectedDevice && formData.selectedCoreDevice) parts.push('Core');
        if (formData.selectedDevice && formData.selectedPhases.length > 0) parts.push(`${formData.selectedPhases.length} phase(s)`);
        if (parts.length > 0) toast.info(`Document saved to ${parts.join(' + ')}`);
        onDocumentUpdated();
        onOpenChange(false);
      } else {
        toast.error(lang('companySettings.editDocumentDialog.failedToUpdateNoPermission'));
        onDocumentUpdated();
      }
    } catch (error) {
      console.error('DocumentEditDialog: Error updating document:', error);
      toast.error(lang('companySettings.editDocumentDialog.failedToUpdate'));
      onDocumentUpdated();
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <>
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '85vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">{lang('companySettings.editDocumentDialog.title')}</Typography>
            <FormControl size="small" disabled={isLoading} sx={{ minWidth: 140 }}>
              <Select
                value={formData.status}
                onChange={e => setFormData(prev => ({...prev, status: e.target.value}))}
                displayEmpty
                sx={{ height: 32, fontSize: '0.8125rem' }}
                MenuProps={{
                  disablePortal: false,
                  PaperProps: { style: { zIndex: 1400 } }
                }}
              >
                <MenuItem value="Not Started">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#9e9e9e' }}></Box>
                    Not Started
                  </Box>
                </MenuItem>
                <MenuItem value="In Review">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ff9800' }}></Box>
                    In Review
                  </Box>
                </MenuItem>
                <MenuItem value="Approved">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#4caf50' }}></Box>
                    Approved
                  </Box>
                </MenuItem>
                <MenuItem value="Report">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#4caf50' }}></Box>
                    Report
                  </Box>
                </MenuItem>
                <MenuItem value="Rejected">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f44336' }}></Box>
                    Rejected
                  </Box>
                </MenuItem>
                <MenuItem value="N/A">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#bdbdbd' }}></Box>
                    N/A
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
          <FormControl component="fieldset" disabled={isLoading} sx={{ ml: 2 }}>
            <RadioGroup
              row
              value={formData.isRecord ? 'record' : 'document'}
              onChange={(e) => setFormData(prev => ({ ...prev, isRecord: e.target.value === 'record' }))}
            >
              <FormControlLabel value="document" control={<Radio size="small" />} label={lang('companySettings.editDocumentDialog.document')} />
              <FormControlLabel value="record" control={<Radio size="small" />} label={lang('companySettings.editDocumentDialog.record')} />
            </RadioGroup>
          </FormControl>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loadingDocData ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary">Loading document data...</Typography>
          </Box>
        ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
          <Alert severity="info">
            <Typography variant="body2" fontWeight="medium">
              {lang('companySettings.editDocumentDialog.editDocumentInfo')}
            </Typography>
            <Typography variant="body2" fontSize="0.875rem">
              {lang('companySettings.editDocumentDialog.editDocumentDesc')}
            </Typography>
          </Alert>

          <TextField
            fullWidth
            label="Document Reference"
            value={formData.documentReference}
            onChange={e => setFormData(prev => ({...prev, documentReference: e.target.value}))}
            placeholder="e.g., DOC-QMS-001"
            disabled={isLoading}
            variant="outlined"
          />

          <TextField
            fullWidth
            label={lang('companySettings.editDocumentDialog.documentNameLabel')}
            value={formData.name}
            onChange={e => setFormData(prev => ({...prev, name: e.target.value}))}
            placeholder={lang('companySettings.editDocumentDialog.enterDocumentName')}
            error={!formData.name.trim() && formData.name !== ''}
            helperText={!formData.name.trim() && formData.name !== '' ? lang('companySettings.editDocumentDialog.documentNameRequired') : ""}
            disabled={isLoading}
            variant="outlined"
          />

          {/* Description — moved up per field order alignment */}
          <TextField
            fullWidth
            label={lang('companySettings.editDocumentDialog.description')}
            value={formData.description}
            onChange={e => setFormData(prev => ({...prev, description: e.target.value}))}
            placeholder={lang('companySettings.editDocumentDialog.descriptionPlaceholder')}
            multiline
            rows={3}
            disabled={isLoading}
            variant="outlined"
          />

          {/* File Upload — moved up per field order alignment */}
          <DocumentFileUpload
            onFileChange={handleFileChange}
            currentFile={filePath ? { name: (document as any).file_name || lang('companySettings.editDocumentDialog.uploadedFile'), path: filePath } : undefined}
            disabled={isLoading}
          />

          {isFileUploading && (
            <Alert severity="info">
              {lang('companySettings.editDocumentDialog.fileUploadInProgress')}
            </Alert>
          )}

          {/* Location of Document CI — hierarchical selector */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Location of Document CI
            </Typography>
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
              {/* Company doc CI */}
              <Box
                sx={{
                  display: 'flex', alignItems: 'center', px: 2, py: 1,
                  cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' },
                  bgcolor: formData.selectedCompany ? 'primary.50' : 'transparent',
                  borderBottom: '2px solid #bdbdbd',
                }}
                onClick={() => !isLoading && handleCompanyToggle()}
              >
                <Checkbox
                  checked={formData.selectedCompany}
                  disabled={isLoading}
                  sx={{ p: 0.5, mr: 1 }}
                />
                <Typography variant="body2" fontWeight={formData.selectedCompany ? 600 : 400}>
                  Company doc CI
                </Typography>
              </Box>

              {/* Device doc CI */}
              <Box>
                <Box
                  sx={{
                    display: 'flex', alignItems: 'center', px: 2, py: 1,
                    cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' },
                    bgcolor: formData.selectedDevice ? 'primary.50' : 'transparent',
                  }}
                  onClick={() => !isLoading && handleDeviceToggle()}
                >
                  <Checkbox
                    checked={formData.selectedDevice}
                    disabled={isLoading}
                    sx={{ p: 0.5, mr: 1 }}
                  />
                  <Typography variant="body2" fontWeight={formData.selectedDevice ? 600 : 400} sx={{ flex: 1 }}>
                    Device doc CI
                  </Typography>
                  {formData.selectedDevice ? (
                    <ExpandMore fontSize="small" color="action" />
                  ) : (
                    <ChevronRight fontSize="small" color="action" />
                  )}
                </Box>

                {/* Device sub-options: Core + Phases */}
                <Collapse in={formData.selectedDevice}>
                  <Box sx={{ pl: 4, borderTop: '1px solid #f0f0f0', bgcolor: '#fafafa' }}>
                    {/* Core */}
                    <Box
                      sx={{
                        display: 'flex', alignItems: 'center', px: 2, py: 0.75,
                        cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => !isLoading && setFormData(prev => ({ ...prev, selectedCoreDevice: !prev.selectedCoreDevice }))}
                    >
                      <Checkbox
                        checked={formData.selectedCoreDevice}
                        disabled={isLoading}
                        size="small"
                        sx={{ p: 0.5, mr: 1 }}
                      />
                      <Typography variant="body2">Core</Typography>
                    </Box>

                    {/* Separator between Core and Phases */}
                    <Box sx={{ borderBottom: '2px solid #9e9e9e', my: 0.5 }} />

                    {/* Phase list */}
                    <Box sx={{ maxHeight: 280, overflowY: 'auto' }}>
                      {loadingPhases ? (
                        <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
                          Loading phases...
                        </Typography>
                      ) : displayPhases.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
                          No phases available
                        </Typography>
                      ) : (
                        displayPhases.map(phase => {
                          const isPhaseSelected = formData.selectedPhases.includes(phase.id);
                          return (
                            <Box key={phase.id}>
                              {/* Phase row */}
                              <Box
                                sx={{
                                  display: 'flex', alignItems: 'center', px: 2, py: 0.75,
                                  cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' },
                                  borderBottom: '1px solid #f0f0f0',
                                  bgcolor: isPhaseSelected ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
                                }}
                                onClick={() => !isLoading && handlePhaseToggle(phase.id, !isPhaseSelected)}
                              >
                                <Checkbox
                                  checked={isPhaseSelected}
                                  disabled={isLoading}
                                  size="small"
                                  sx={{ p: 0.5, mr: 1 }}
                                />
                                <Typography variant="body2" fontWeight={isPhaseSelected ? 600 : 400}>
                                  {phase.name}
                                </Typography>
                                {isPhaseSelected && (
                                  <ExpandMore fontSize="small" color="action" sx={{ ml: 'auto' }} />
                                )}
                              </Box>

                              {/* Inline sections under selected phase */}
                              <Collapse in={isPhaseSelected}>
                                <Box sx={{ pl: 3, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                                  <PhaseSections
                                    companyId={companyId}
                                    phaseId={phase.id}
                                    selectedSectionId={formData.phaseSectionMap[phase.id]?.sectionId || ''}
                                    isLoading={isLoading}
                                    onSectionSelect={handleSectionSelect}
                                  />
                                </Box>
                              </Collapse>
                            </Box>
                          );
                        })
                      )}
                    </Box>
                  </Box>
                </Collapse>
              </Box>
            </Box>
          </Box>

          {/* <TextField
            fullWidth
            label="Document Reference"
            value={formData.documentReference}
            onChange={e => setFormData(prev => ({...prev, documentReference: e.target.value}))}
            placeholder="e.g., DOC-QMS-001"
            disabled={isLoading}
            variant="outlined"
          /> */}

          {/* <TextField
            fullWidth
            label="Version"
            value={formData.version}
            onChange={e => setFormData(prev => ({...prev, version: e.target.value}))}
            placeholder="e.g., 1.0, Rev A"
            disabled={isLoading}
            variant="outlined"
          /> */}

          {/* <FormControl fullWidth disabled={isLoading}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Date
            </Typography>
            <Box sx={{ border: '1px solid #e0e0e0', padding: '10px', borderRadius: '4px' }}>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData(prev => ({...prev, date: e.target.value}))}
                disabled={isLoading}
                style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent' }}
              />
            </Box>
          </FormControl> */}

          {/* <FormControl fullWidth disabled={isLoading}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Deadline / Due Date
            </Typography>
            <Box sx={{ border: '1px solid #e0e0e0', padding: '10px', borderRadius: '4px' }}>
              <input
                type="date"
                value={formData.dueDate || ''}
                onChange={(e) => setFormData(prev => ({...prev, dueDate: e.target.value}))}
                disabled={isLoading}
                style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent' }}
              />
            </Box>
          </FormControl> */}

          {/* <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e0e0e0', borderRadius: '4px', p: 2 }}>
            <Typography variant="body2">Current Effective Version</Typography>
            <input
              type="checkbox"
              checked={formData.isCurrentEffectiveVersion}
              onChange={(e) => setFormData(prev => ({...prev, isCurrentEffectiveVersion: e.target.checked}))}
              disabled={isLoading}
              style={{ width: '20px', height: '20px' }}
            />
          </Box> */}

          {/* <MultiAuthorSelector
            value={formData.authorsIds}
            onChange={(value) => setFormData(prev => ({...prev, authorsIds: value}))}
            companyId={companyId}
            disabled={isLoading}
          /> */}

          {/* <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e0e0e0', borderRadius: '4px', p: 2 }}>
            <Typography variant="body2">Need Template Update?</Typography>
            <input
              type="checkbox"
              checked={formData.needTemplateUpdate}
              onChange={(e) => setFormData(prev => ({...prev, needTemplateUpdate: e.target.checked}))}
              disabled={isLoading}
              style={{ width: '20px', height: '20px' }}
            />
          </Box> */}

          <FormControl fullWidth disabled={isLoading}>
            <InputLabel>{lang('companySettings.editDocumentDialog.documentType')}</InputLabel>
            <Select
              value={formData.documentType}
              label={lang('companySettings.editDocumentDialog.documentType')}
              onChange={e => setFormData(prev => ({...prev, documentType: e.target.value}))}
              MenuProps={{
                disablePortal: false,
                PaperProps: {
                  style: {
                    zIndex: 1400,
                  },
                },
              }}
            >
              {documentTypes.map(type => (
                <MenuItem key={type} value={type}>{lang(`companySettings.addDocumentDialog.docTypes.${type.toLowerCase()}`)}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={isLoading}>
            <InputLabel>{lang('companySettings.editDocumentDialog.techApplicability')}</InputLabel>
            <Select
              value={formData.techApplicability}
              label={lang('companySettings.editDocumentDialog.techApplicability')}
              onChange={e => setFormData(prev => ({...prev, techApplicability: e.target.value as DocumentTechApplicability}))}
              MenuProps={{
                disablePortal: false,
                PaperProps: {
                  style: {
                    zIndex: 1400,
                  },
                },
              }}
            >
              {techOptions.map(option => (
                <MenuItem key={option} value={option}>{lang(`companySettings.addDocumentDialog.techOptions.${option.replace(/\s+/g, '')}`)}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Tags */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Tags
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              {tags.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  onDelete={() => setTags(prev => prev.filter(t => t !== tag))}
                  disabled={isLoading}
                />
              ))}
            </Box>
            <Box sx={{ position: 'relative' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Add a tag and press Enter"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && tagInput.trim()) {
                    e.preventDefault();
                    const newTag = tagInput.trim();
                    if (!tags.includes(newTag)) {
                      setTags(prev => [...prev, newTag]);
                    }
                    setTagInput('');
                  }
                }}
                disabled={isLoading}
              />
              {tagInput.length >= 1 && existingTags.filter(t => t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t)).length > 0 && (
                <Box sx={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1500, bgcolor: 'background.paper', border: '1px solid #e0e0e0', borderRadius: 1, maxHeight: 150, overflowY: 'auto', boxShadow: 2 }}>
                  {existingTags
                    .filter(t => t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t))
                    .map(suggestion => (
                      <Box
                        key={suggestion}
                        sx={{ px: 2, py: 0.75, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, fontSize: '0.875rem' }}
                        onClick={() => {
                          setTags(prev => [...prev, suggestion]);
                          setTagInput('');
                        }}
                      >
                        {suggestion}
                      </Box>
                    ))}
                </Box>
              )}
            </Box>
            {/* Show available tags as clickable chips */}
            {existingTags.filter(t => !tags.includes(t)).length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Available tags:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {existingTags.filter(t => !tags.includes(t)).map(tag => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      onClick={() => setTags(prev => [...prev, tag])}
                      disabled={isLoading}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {lang('companySettings.editDocumentDialog.reviewerGroups')}
            </Typography>
            {isLoadingGroups ? (
              <Typography variant="body2" color="text.secondary">{lang('companySettings.editDocumentDialog.loadingReviewerGroups')}</Typography>
            ) : reviewerGroups.length === 0 ? (
              <Typography variant="body2" color="text.secondary">{lang('companySettings.editDocumentDialog.noReviewerGroups')}</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 2, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                {reviewerGroups.map(group => {
                  const isSelected = reviewerGroupIds.includes(group.id);
                  return (
                    <Chip
                      key={group.id}
                      label={group.name}
                      onClick={() => handleReviewerGroupToggle(group.id)}
                      color={isSelected ? "primary" : "default"}
                      variant={isSelected ? "filled" : "outlined"}
                      sx={{ cursor: 'pointer' }}
                    />
                  );
                })}
              </Box>
            )}
            {reviewerGroupIds.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {lang('companySettings.editDocumentDialog.groupsSelected', { count: reviewerGroupIds.length })}
              </Typography>
            )}
          </Box>
        </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
        >
          {lang('common.cancel')}
        </Button>
        <Button
          onClick={handleSaveClick}
          variant="contained"
          disabled={isLoading || !formData.name.trim() || isFileUploading}
        >
          {isLoading
            ? lang('companySettings.editDocumentDialog.saving')
            : isFileUploading
              ? lang('companySettings.editDocumentDialog.uploading')
              : lang('companySettings.editDocumentDialog.saveChanges')}
        </Button>
      </DialogActions>

    </Dialog>

    {/* <ReasonForChangeDialog
      open={showReasonDialog}
      onOpenChange={setShowReasonDialog}
      onConfirm={(reason) => handleSave(reason)}
      title="Reason for Document Change"
      entityName={formData.name}
      isLoading={isLoading}
    /> */}
    </>
  );
}
