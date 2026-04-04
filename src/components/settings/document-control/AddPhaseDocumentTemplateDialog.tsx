import React, { useState, useEffect } from "react";
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
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormLabel,
  Chip,
  Collapse,
  CircularProgress
} from '@mui/material';
import { ChevronRight, ExpandMore, Add as AddIcon } from '@mui/icons-material';
import { DocumentFileUpload } from "@/components/common/DocumentFileUpload";
import { DocumentCreationService } from "@/services/documentCreationService";
import { useDocumentAssignmentPhases } from "@/hooks/useDocumentAssignmentPhases";
import { CompanyDocumentTemplateService } from "@/services/companyDocumentTemplateService";
import { useReviewerGroups } from "@/hooks/useReviewerGroups";
import { MultiAuthorSelector } from "@/components/common/MultiAuthorSelector";
import { useExistingTags } from "@/hooks/useExistingTags";
import { useComplianceSections } from "@/hooks/useComplianceSections";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
// Sub-component to render inline sections for a selected phase
function PhaseSections({ companyId, phaseId, selectedSectionId, isCreating, onSectionSelect }: {
  companyId: string;
  phaseId: string;
  selectedSectionId: string;
  isCreating: boolean;
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
          onClick={() => !isCreating && onSectionSelect(phaseId, section.id, section.name)}
        >
          <Radio
            checked={selectedSectionId === section.id}
            disabled={isCreating}
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
          onClick={() => !isCreating && setIsAdding(true)}
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

interface AddPhaseDocumentTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onDocumentCreated: () => void;
}
export function AddPhaseDocumentTemplateDialog({
  open,
  onOpenChange,
  companyId,
  onDocumentCreated
}: AddPhaseDocumentTemplateDialogProps) {
  const { lang } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    documentType: 'Standard',
    selectedCompany: false,
    selectedDevice: false,
    selectedCoreDevice: false,
    selectedPhases: [] as string[],
    techApplicability: 'All device types',
    itemType: 'document' as 'document' | 'template',
    selectedTemplateId: '',
    status: 'Not Started',
    subSection: '',
    sectionId: '',
    phaseSectionMap: {} as Record<string, { sectionId: string; sectionName: string }>,
    documentReference: '',
    version: '',
    date: '',
    dueDate: '',
    isCurrentEffectiveVersion: false,
    briefSummary: '',
    authorsIds: [] as string[],
    needTemplateUpdate: false
  });
  const [isCreating, setIsCreating] = useState(false);
  const [existingTemplates, setExistingTemplates] = useState<any[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const { data: existingTags = [] } = useExistingTags(companyId);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<string>('');
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [reviewerGroupIds, setReviewerGroupIds] = useState<string[]>([]);
  const { phases } = useDocumentAssignmentPhases(companyId);
  const { reviewerGroups, isLoading: isLoadingGroups } = useReviewerGroups(companyId);
  
  // Load existing templates when itemType is 'template'
  useEffect(() => {
    if (formData.itemType === 'template' && companyId) {
      CompanyDocumentTemplateService.getTemplates(companyId).then(setExistingTemplates);
    }
  }, [formData.itemType, companyId]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        name: '',
        description: '',
        documentType: 'Standard',
        selectedCompany: false,
        selectedDevice: false,
        selectedCoreDevice: false,
        selectedPhases: [],
        techApplicability: 'All device types',
        itemType: 'document',
        selectedTemplateId: '',
        status: 'Not Started',
        subSection: '',
        sectionId: '',
        phaseSectionMap: {},
        documentReference: '',
        version: '',
        date: '',
        dueDate: '',
        isCurrentEffectiveVersion: false,
        briefSummary: '',
        authorsIds: [],
        needTemplateUpdate: false
      });
      setUploadedFile(null);
      setFilePath('');
      setIsFileUploading(false);
      setReviewerGroupIds([]);
      setTags([]);
      setTagInput('');
    }
  }, [open]);
  const handleFileChange = (file: File | null, uploadPath?: string) => {
    console.log('File change event:', { file: file?.name, uploadPath });

    if (file && !uploadPath) {
      setIsFileUploading(true);
      setUploadedFile(file);
    } else if (file && uploadPath) {
      setIsFileUploading(false);
      setUploadedFile(file);
      setFilePath(uploadPath);
      console.log('File upload completed, path set to:', uploadPath);
    } else if (file === null) {
      setIsFileUploading(false);
      setUploadedFile(null);
      setFilePath('');
    }
  };

  const handleSubmit = async () => {
    if (isCreating || isFileUploading) return;

    // Validation
    if (!formData.name.trim()) {
      toast.error(formData.itemType === 'template'
        ? lang('companySettings.addDocumentDialog.pleaseEnterTemplateName')
        : lang('companySettings.addDocumentDialog.pleaseEnterDocumentName'));
      return;
    }

    setIsCreating(true);
    try {
      const itemName = formData.name;
      const commonParams = {
        name: itemName,
        description: formData.description,
        documentType: formData.documentType,
        companyId,
        techApplicability: formData.techApplicability,
        filePath: filePath || undefined,
        fileName: uploadedFile?.name || undefined,
        fileSize: uploadedFile?.size,
        fileType: uploadedFile?.type,
        status: formData.status,
        reviewerGroupIds: reviewerGroupIds.length > 0 ? reviewerGroupIds : undefined,
        documentReference: formData.documentReference || undefined,
        version: formData.version || undefined,
        date: formData.date || undefined,
        dueDate: formData.dueDate || undefined,
        isCurrentEffectiveVersion: formData.isCurrentEffectiveVersion,
        briefSummary: formData.briefSummary || undefined,
        authors_ids: formData.authorsIds.length > 0 ? formData.authorsIds : undefined,
        needTemplateUpdate: formData.needTemplateUpdate,
        tags: tags.length > 0 ? tags : undefined,
      };

      const createPromises: Promise<any>[] = [];

      const noPhaseEntry = phases.find(p => p.name.toLowerCase() === 'no phase');

      // Company doc
      if (formData.selectedCompany) {
        if (noPhaseEntry) {
          createPromises.push(DocumentCreationService.createDocument({
            ...commonParams,
            scope: 'company_document',
            phaseId: noPhaseEntry.id,
          }));
        } else {
          console.warn('No "No Phase" entry found — cannot create company document');
          toast.error('Missing "No Phase" configuration. Please contact admin.');
        }
      }

      // Core device document
      if (formData.selectedDevice && formData.selectedCoreDevice) {
        if (noPhaseEntry) {
          createPromises.push(DocumentCreationService.createDocument({
            ...commonParams,
            scope: 'company_template',
            phaseId: noPhaseEntry.id,
            silent: true,
          }));
        }
      }

      // Phase-specific device documents
      if (formData.selectedDevice) {
        for (const phaseId of formData.selectedPhases) {
          const phaseSection = formData.phaseSectionMap[phaseId];
          createPromises.push(DocumentCreationService.createDocument({
            ...commonParams,
            scope: 'company_template',
            phaseId,
            subSection: phaseSection?.sectionName || undefined,
            sectionIds: phaseSection?.sectionId ? [phaseSection.sectionId] : undefined,
            silent: true,
          }));
        }
      }

      // Nothing selected — default to company document
      if (!formData.selectedCompany && !formData.selectedDevice) {
        createPromises.push(DocumentCreationService.createDocument({
          ...commonParams,
          scope: 'company_document',
          phaseId: noPhaseEntry?.id || null,
        }));
      }

      const results = await Promise.all(createPromises);
      const successCount = results.filter(Boolean).length;

      if (successCount > 0) {
        // Ensure section exists for each selected phase (per-phase sections)
        const phaseSectionEntries = Object.entries(formData.phaseSectionMap);
        if (phaseSectionEntries.length > 0 && formData.selectedPhases.length > 0) {
          for (const [phaseId, { sectionId: secId, sectionName }] of phaseSectionEntries) {
            if (!secId || !sectionName || !formData.selectedPhases.includes(phaseId)) continue;
            try {
              // Check if section with this name already exists for this phase
              const { data: existing } = await (supabase as any)
                .from('compliance_document_sections')
                .select('id')
                .eq('phase_id', phaseId)
                .eq('name', sectionName)
                .maybeSingle();

              if (existing) {
                await (supabase as any)
                  .from('phase_assigned_document_template')
                  .update({ section_ids: [existing.id], sub_section: sectionName })
                  .eq('phase_id', phaseId)
                  .eq('name', formData.name.trim());
              } else {
                const { data: newSection } = await (supabase as any)
                  .from('compliance_document_sections')
                  .insert({ name: sectionName, phase_id: phaseId, company_id: companyId })
                  .select('id')
                  .single();

                if (newSection) {
                  await (supabase as any)
                    .from('phase_assigned_document_template')
                    .update({ section_ids: [newSection.id], sub_section: sectionName })
                    .eq('phase_id', phaseId)
                    .eq('name', formData.name.trim());
                }
              }
            } catch (err) {
              console.error('Error ensuring section for phase:', err);
            }
          }
        }

        toast.success(formData.itemType === 'template'
          ? lang('companySettings.addDocumentDialog.templateAssignedToPhases', { count: successCount })
          : lang('companySettings.addDocumentDialog.documentAssignedToPhases', { count: successCount }));
        onDocumentCreated();
        onOpenChange(false);
      } else {
        toast.error(formData.itemType === 'template'
          ? lang('companySettings.addDocumentDialog.failedToCreateTemplate')
          : lang('companySettings.addDocumentDialog.failedToCreateDocument'));
      }
    } catch (error) {
      console.error(`Error creating ${formData.itemType}:`, error);
      toast.error(formData.itemType === 'template'
        ? lang('companySettings.addDocumentDialog.failedToCreateTemplate')
        : lang('companySettings.addDocumentDialog.failedToCreateDocument'));
    } finally {
      setIsCreating(false);
    }
  };
  const handleCompanyToggle = () => {
    setFormData(prev => ({ ...prev, selectedCompany: !prev.selectedCompany }));
  };

  const handleDeviceToggle = () => {
    setFormData(prev => ({
      ...prev,
      selectedDevice: !prev.selectedDevice,
      ...(!prev.selectedDevice ? {} : { selectedCoreDevice: false, selectedPhases: [], phaseSectionMap: {}, subSection: '', sectionId: '' }),
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

  const handleReviewerGroupToggle = (groupId: string) => {
    setReviewerGroupIds(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };
  const documentTypes = ['Standard', 'Regulatory', 'Technical', 'Clinical', 'Quality', 'Design', 'SOP'];
  const techApplicabilityOptions = ['All device types', 'Software devices', 'Hardware devices', 'Combination devices', 'Implantable devices'];
  
  return (
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">
            {formData.itemType === 'template'
              ? lang('companySettings.addDocumentDialog.addTemplateCI')
              : lang('companySettings.addDocumentDialog.addDocumentCI')}
          </Typography>
          <FormControl size="small" disabled={isCreating} sx={{ minWidth: 140 }}>
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
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
          <Alert severity="info">
            <Typography variant="body2" fontSize="0.875rem">
              {formData.itemType === 'template'
                ? lang('companySettings.addDocumentDialog.templateDescription')
                : lang('companySettings.addDocumentDialog.documentDescription')}
            </Typography>
          </Alert>

          {/* <FormControl component="fieldset">
            <FormLabel component="legend">Item Type</FormLabel>
            <RadioGroup
              row
              value={formData.itemType}
              onChange={(e) => setFormData(prev => ({...prev, itemType: e.target.value as 'document' | 'template'}))}
            >
              <FormControlLabel value="document" control={<Radio />} label="Document" />
              <FormControlLabel value="template" control={<Radio />} label="Template" />
            </RadioGroup>
          </FormControl> */}

          {/* Field order: Reference → Name → Description → File Upload → Status (per Task #12/13) */}
          <TextField
            fullWidth
            label="Document Reference"
            value={formData.documentReference}
            onChange={e => setFormData(prev => ({...prev, documentReference: e.target.value}))}
            placeholder="e.g., DOC-QMS-001"
            disabled={isCreating}
            variant="outlined"
          />

          <TextField
            fullWidth
            label={formData.itemType === 'template'
              ? lang('companySettings.addDocumentDialog.templateNameLabel')
              : lang('companySettings.addDocumentDialog.documentNameLabel')}
            value={formData.name}
            onChange={e => setFormData(prev => ({...prev, name: e.target.value}))}
            placeholder={formData.itemType === 'template'
              ? lang('companySettings.addDocumentDialog.enterTemplateName')
              : lang('companySettings.addDocumentDialog.enterDocumentName')}
            error={!formData.name.trim() && formData.name !== ''}
            helperText={!formData.name.trim() && formData.name !== ''
              ? (formData.itemType === 'template'
                ? lang('companySettings.addDocumentDialog.templateNameRequired')
                : lang('companySettings.addDocumentDialog.documentNameRequired'))
              : ""}
            disabled={isCreating}
            variant="outlined"
          />

          <TextField
            fullWidth
            label={lang('companySettings.addDocumentDialog.description')}
            value={formData.description}
            onChange={e => setFormData(prev => ({...prev, description: e.target.value}))}
            placeholder={formData.itemType === 'template'
              ? lang('companySettings.addDocumentDialog.enterTemplateDescription')
              : lang('companySettings.addDocumentDialog.enterDocumentDescription')}
            multiline
            rows={3}
            disabled={isCreating}
            variant="outlined"
          />

          <DocumentFileUpload
            onFileChange={handleFileChange}
            currentFile={filePath ? { name: uploadedFile?.name || lang('companySettings.addDocumentDialog.uploadedFile'), path: filePath } : undefined}
            disabled={isCreating}
          />

          {isFileUploading && (
            <Alert severity="info">
              {lang('companySettings.addDocumentDialog.fileUploadInProgress')}
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
                onClick={() => !isCreating && handleCompanyToggle()}
              >
                <Checkbox
                  checked={formData.selectedCompany}
                  disabled={isCreating}
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
                  onClick={() => !isCreating && handleDeviceToggle()}
                >
                  <Checkbox
                    checked={formData.selectedDevice}
                    disabled={isCreating}
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
                      onClick={() => !isCreating && setFormData(prev => ({ ...prev, selectedCoreDevice: !prev.selectedCoreDevice }))}
                    >
                      <Checkbox
                        checked={formData.selectedCoreDevice}
                        disabled={isCreating}
                        size="small"
                        sx={{ p: 0.5, mr: 1 }}
                      />
                      <Typography variant="body2">Core</Typography>
                    </Box>

                    {/* Separator between Core and Phases */}
                    <Box sx={{ borderBottom: '2px solid #9e9e9e', my: 0.5 }} />

                    {/* Phase list (filter out "No Phase" since Core covers it) */}
                    <Box sx={{ maxHeight: 280, overflowY: 'auto' }}>
                      {phases.filter(p => p.name.toLowerCase() !== 'no phase').length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
                          No phases available
                        </Typography>
                      ) : (
                        phases.filter(p => p.name.toLowerCase() !== 'no phase').map(phase => {
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
                                onClick={() => !isCreating && handlePhaseToggle(phase.id, !isPhaseSelected)}
                              >
                                <Checkbox
                                  checked={isPhaseSelected}
                                  disabled={isCreating}
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
                                    isCreating={isCreating}
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

          <FormControl fullWidth disabled={isCreating}>
            <InputLabel>{lang('companySettings.addDocumentDialog.documentType')}</InputLabel>
            <Select
              value={formData.documentType}
              label={lang('companySettings.addDocumentDialog.documentType')}
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

          <FormControl fullWidth disabled={isCreating}>
            <InputLabel>{lang('companySettings.addDocumentDialog.techApplicability')}</InputLabel>
            <Select
              value={formData.techApplicability}
              label={lang('companySettings.addDocumentDialog.techApplicability')}
              onChange={e => setFormData(prev => ({...prev, techApplicability: e.target.value}))}
              MenuProps={{
                disablePortal: false,
                PaperProps: {
                  style: {
                    zIndex: 1400,
                  },
                },
              }}
            >
              {techApplicabilityOptions.map(option => (
                <MenuItem key={option} value={option}>{lang(`companySettings.addDocumentDialog.techOptions.${option.replace(/\s+/g, '')}`)}</MenuItem>
              ))}
            </Select>
          </FormControl>


          {/* Commented-out fields preserved below for future use */}

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
                  disabled={isCreating}
                />
              ))}
            </Box>
            <TextField
              fullWidth
              size="small"
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
              placeholder="Type a tag and press Enter"
              disabled={isCreating}
              variant="outlined"
            />
            {tagInput.length >= 1 && existingTags.filter(t => t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t)).length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {existingTags
                  .filter(t => t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t))
                  .slice(0, 8)
                  .map(suggestion => (
                    <Chip
                      key={suggestion}
                      label={suggestion}
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setTags(prev => [...prev, suggestion]);
                        setTagInput('');
                      }}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
              </Box>
            )}
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {lang('companySettings.addDocumentDialog.reviewerGroups')}
            </Typography>
            {isLoadingGroups ? (
              <Typography variant="body2" color="text.secondary">{lang('companySettings.addDocumentDialog.loadingReviewerGroups')}</Typography>
            ) : reviewerGroups.length === 0 ? (
              <Typography variant="body2" color="text.secondary">{lang('companySettings.addDocumentDialog.noReviewerGroups')}</Typography>
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
                {lang('companySettings.addDocumentDialog.groupsSelected', { count: reviewerGroupIds.length })}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={() => onOpenChange(false)}
          disabled={isCreating}
        >
          {lang('common.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isCreating || isFileUploading || !formData.name.trim()}
        >
          {isCreating
            ? lang('companySettings.addDocumentDialog.creating')
            : isFileUploading
              ? lang('companySettings.addDocumentDialog.uploadingFile')
              : (formData.itemType === 'template'
                ? lang('companySettings.addDocumentDialog.createTemplate')
                : lang('companySettings.addDocumentDialog.createDocument'))}
        </Button>
      </DialogActions>
    </Dialog>
  );
}