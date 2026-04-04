
import React, { useState, useEffect, useMemo } from "react";
import {
  Drawer,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  FormHelperText
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { Add } from '@mui/icons-material';
import { Tooltip as ShadTooltip, TooltipContent as ShadTooltipContent, TooltipProvider as ShadTooltipProvider, TooltipTrigger as ShadTooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/useTranslation";
import { useExistingTags } from "@/hooks/useExistingTags";
import { DocumentCreationService } from "@/services/documentCreationService";
import { DocumentFileUpload } from "@/components/common/DocumentFileUpload";
import { useReviewerGroups } from "@/hooks/useReviewerGroups";
import { MultiAuthorSelector } from "@/components/common/MultiAuthorSelector";
import { PendingAuthorData, createPendingAuthors } from "@/components/common/AddAuthorSheet";
import { PhaseActivationService } from "@/services/phaseActivationService";
import { SectionSelector } from "@/components/common/SectionSelector";
import { useDocumentTypes } from "@/hooks/useDocumentTypes";
import { AddDocumentTypeSheet } from "@/components/common/AddDocumentTypeSheet";
import { DocToPdfConverterService } from "@/services/docToPdfConverterService";
import { uploadFileToStorage } from "@/utils/storageUtils";
import { toast } from "sonner";
import { useCompanyDateFormat } from "@/hooks/useCompanyDateFormat";
import { ReferenceDocumentPicker } from "@/components/common/ReferenceDocumentPicker";
import { useReferenceDocuments } from "@/hooks/useReferenceDocuments";

interface ProductDocumentCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  companyId: string;
  onDocumentCreated: (documentId: string, metadata?: any) => void;
}

export function ProductDocumentCreationDialog({
  open,
  onOpenChange,
  productId,
  companyId,
  onDocumentCreated
}: ProductDocumentCreationDialogProps) {
  const { lang } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Not Started',
    documentType: '',
    subSection: '',
    sectionId: '',
    documentReference: '',
    version: '',
    date: '',
    dueDate: '',
    isCurrentEffectiveVersion: false,
    authorsIds: [] as string[],
    needTemplateUpdate: false,
    phaseId: '__CORE__' as string,
    itemType: 'report' as 'document' | 'report'
  });
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<string | undefined>(undefined);
  const [fileUploadInProgress, setFileUploadInProgress] = useState(false);
  const [isConvertingDoc, setIsConvertingDoc] = useState(false);
  const [reviewerGroupIds, setReviewerGroupIds] = useState<string[]>([]);
  const [activePhases, setActivePhases] = useState<Array<{ id: string; name: string; description?: string; is_system_phase?: boolean }>>([]);
  const [loadingPhases, setLoadingPhases] = useState(false);
  // Track pending authors that need to be created when form is saved
  const [pendingAuthors, setPendingAuthors] = useState<PendingAuthorData[]>([]);
  const [referenceDocumentIds, setReferenceDocumentIds] = useState<string[]>([]);
  const [isRefDocPickerOpen, setIsRefDocPickerOpen] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const { documents: referenceDocuments } = useReferenceDocuments(companyId);

  // Fetch reviewer groups
  const { reviewerGroups, isLoading: isLoadingGroups } = useReviewerGroups(companyId);

  // Get dynamic document types
  const { documentTypes, isLoading: isLoadingDocTypes, refetch: refetchDocumentTypes } = useDocumentTypes(companyId);
  const { data: existingTags = [] } = useExistingTags(companyId);

  // Get company date format
  const { formatDate, dateFormat } = useCompanyDateFormat(companyId);
  
  // State for Add Document Type Sheet
  const [isAddDocumentTypeSheetOpen, setIsAddDocumentTypeSheetOpen] = useState(false);

  // Load active phases when dialog opens (same logic as Edit dialog)
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
              description: phase.phase?.description,
              is_system_phase: phase.phase?.is_system_phase || false
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

  // Filter out "No Phase" from display — Core covers it
  const displayPhases = activePhases.filter(p => p.name.toLowerCase() !== 'no phase');
  const noPhaseEntry = activePhases.find(p => p.name.toLowerCase() === 'no phase');

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        name: '',
        description: '',
        status: 'Not Started',
        documentType: '',
        subSection: '',
        sectionId: '',
        documentReference: '',
        version: '',
        date: '',
        dueDate: '',
        isCurrentEffectiveVersion: false,
        authorsIds: [],
        needTemplateUpdate: false,
        phaseId: '__CORE__',
        itemType: 'report'
      });
      setSelectedFile(null);
      setFilePath(undefined);
      setFileUploadInProgress(false);
      setIsConvertingDoc(false);
      setReviewerGroupIds([]);
      setPendingAuthors([]);
      setReferenceDocumentIds([]);
      setTags([]);
      setTagInput('');
    }
  }, [open]);

  const handleFileChange = async (file: File | null, uploadPath?: string) => {
    console.log('File change event:', { file: file?.name, uploadPath });

    if (file && !uploadPath) {
      // Upload started but not completed yet
      setFileUploadInProgress(true);
      setSelectedFile(file);

      // Check if file is DOC/DOCX and convert to PDF
      const isConvertibleDoc = DocToPdfConverterService.isConvertibleDoc(file.name, file.type);

      if (isConvertibleDoc) {
        try {
          setIsConvertingDoc(true);

          // Convert DOC/DOCX to PDF
          const pdfBlob = await DocToPdfConverterService.convertDocxToPdf(file, {
            fileName: file.name
          });

          if (!pdfBlob) {
            throw new Error('Failed to convert document to PDF');
          }

          // Generate file paths
          const timestamp = Date.now();
          const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const pdfFileName = cleanFileName.replace(/\.(doc|docx)$/i, '.pdf');

          // Upload original DOC/DOCX file as backup (not stored in DB, just for backup)
          const originalFilePath = `documents/${timestamp}_original_${cleanFileName}`;
          await uploadFileToStorage(file, originalFilePath);

          // Upload converted PDF file (this will be stored in file_path)
          const pdfFilePath = `documents/${timestamp}_${pdfFileName}`;

          // Convert blob to File for upload
          const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });
          const uploadedPdfPath = await uploadFileToStorage(pdfFile, pdfFilePath);

          setFilePath(uploadedPdfPath);
          setFileUploadInProgress(false);
          setIsConvertingDoc(false);

          // Set selectedFile to PDF for the form
          setSelectedFile(pdfFile);

        } catch (error) {
          setIsConvertingDoc(false);
          setFileUploadInProgress(false);
          setSelectedFile(null);
          setFilePath(undefined);
          toast.error(error instanceof Error ? error.message : 'Failed to convert document to PDF');
        }
      }
      // For non-DOC files, the DocumentFileUpload component will handle the upload
    } else if (file && uploadPath) {
      // Upload completed successfully (for non-DOC files or if DOC conversion already handled)
      // Only process if this is not a DOC/DOCX file (those are handled above)
      const isConvertibleDoc = file ? DocToPdfConverterService.isConvertibleDoc(file.name, file.type) : false;

      if (!isConvertibleDoc) {
        setFileUploadInProgress(false);
        setSelectedFile(file);
        setFilePath(uploadPath);
        console.log('File upload completed, path set to:', uploadPath);
      }
    } else if (file === null) {
      // File removed or upload failed
      console.log('[ProductDocumentCreationDialog] File removal detected, clearing state');
      setFileUploadInProgress(false);
      setIsConvertingDoc(false);
      setSelectedFile(null);
      setFilePath(undefined);
    }
  };

  const handleSubmit = async () => {
    if (isCreating || fileUploadInProgress) return;

    console.log('[ProductDocumentCreationDialog] Submitting with sectionId:', formData.sectionId, 'subSection:', formData.subSection);

    setIsCreating(true);
    try {
      // Create any pending authors first
      let finalAuthorIds = [...formData.authorsIds];
      if (pendingAuthors.length > 0) {
        console.log('[ProductDocumentCreationDialog] Creating pending authors:', pendingAuthors);
        const tempToRealIdMap = await createPendingAuthors(pendingAuthors, companyId);

        // Replace temp IDs with real IDs
        finalAuthorIds = finalAuthorIds.map(id => {
          const realId = tempToRealIdMap.get(id);
          return realId || id;
        });
        console.log('[ProductDocumentCreationDialog] Final author IDs:', finalAuthorIds);
      }

      // Set approval_date when status is Approved
      const approvalDate = formData.status?.toLowerCase() === 'approved'
        ? new Date().toISOString()
        : undefined;

      const resolvedPhaseId = formData.phaseId === '__CORE__'
        ? (noPhaseEntry?.id || undefined)
        : (formData.phaseId || undefined);

      const documentId = await DocumentCreationService.createDocument({
        name: formData.name,
        description: formData.description,
        documentType: formData.documentType || 'Standard',
        scope: 'product_document',
        companyId,
        productId,
        phaseId: resolvedPhaseId,
        subSection: formData.subSection || undefined,
        sectionIds: formData.sectionId ? [formData.sectionId] : undefined,
        status: formData.status,
        filePath: filePath,
        fileName: selectedFile?.name,
        fileSize: selectedFile?.size,
        fileType: selectedFile?.type,
        reviewerGroupIds: reviewerGroupIds.length > 0 ? reviewerGroupIds : undefined,
        documentReference: formData.documentReference || undefined,
        version: formData.version || undefined,
        date: formData.date || undefined,
        dueDate: formData.dueDate || undefined,
        isCurrentEffectiveVersion: formData.isCurrentEffectiveVersion,
        authors_ids: finalAuthorIds.length > 0 ? finalAuthorIds : undefined,
        needTemplateUpdate: formData.needTemplateUpdate,
        isRecord: formData.itemType === 'report',
        approval_date: approvalDate,
        reference_document_ids: referenceDocumentIds.length > 0 ? referenceDocumentIds : undefined,
        tags: tags.length > 0 ? tags : undefined
      });

      const firstDocId = documentId;

      if (firstDocId) {
        onDocumentCreated(firstDocId, {
          name: formData.name,
          status: formData.status || 'Not Started',
          document_type: formData.documentType || 'Standard',
          description: formData.description,
          phase_id: resolvedPhaseId,
          due_date: formData.dueDate,
          date: formData.date,
          version: formData.version,
          authors_ids: finalAuthorIds.length > 0 ? finalAuthorIds : undefined,
          reviewer_group_ids: reviewerGroupIds.length > 0 ? reviewerGroupIds : undefined,
          tags: tags.length > 0 ? tags : undefined,
          is_record: formData.itemType === 'report',
        });
        onOpenChange(false);
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={() => onOpenChange(false)}
      ModalProps={{
        disableAutoFocus: true,
        disableEnforceFocus: true,
      }}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 900 }, display: 'flex', flexDirection: 'column' }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">{lang('document.addDocumentComplianceInstance')}</Typography>
            <FormControl size="small" disabled={isCreating} sx={{ minWidth: 140 }}>
              <Select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
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
          <FormControl component="fieldset" disabled={isCreating} sx={{ ml: 2 }}>
            <RadioGroup
              row
              value={formData.itemType}
              onChange={(e) => {
                const newItemType = e.target.value as 'document' | 'report';
                setFormData(prev => ({
                  ...prev,
                  itemType: newItemType,
                  // Automatically set status to "Report" when report is selected
                  status: newItemType === 'report' ? 'Report' : prev.status
                }));
              }}
            >
              <ShadTooltipProvider>
                <ShadTooltip>
                  <ShadTooltipTrigger asChild>
                    <FormControlLabel value="document" control={<Radio size="small" />} label={lang('document.document')} />
                  </ShadTooltipTrigger>
                  <ShadTooltipContent side="bottom" className="max-w-xs z-[9999]">
                    <p>Per EU MDR & ISO 13485: A controlled document that defines how processes should be performed — procedures, plans, policies, work instructions, and specifications.</p>
                  </ShadTooltipContent>
                </ShadTooltip>
              </ShadTooltipProvider>
              <ShadTooltipProvider>
                <ShadTooltip>
                  <ShadTooltipTrigger asChild>
                    <FormControlLabel value="report" control={<Radio size="small" />} label={lang('document.report')} />
                  </ShadTooltipTrigger>
                  <ShadTooltipContent side="bottom" className="max-w-xs z-[9999]">
                    <p>Per EU MDR & ISO 13485: A record that provides evidence of activities performed and results achieved — test reports, clinical evaluation reports, audit reports, risk management reports.</p>
                  </ShadTooltipContent>
                </ShadTooltip>
              </ShadTooltipProvider>
            </RadioGroup>
          </FormControl>
          <IconButton onClick={() => onOpenChange(false)} size="small" sx={{ ml: 1 }}>
            <Close />
          </IconButton>
        </Box>

      <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Alert severity="info">
            <Typography variant="body2" fontWeight="medium">
              {lang('document.productSpecificDocument')}
            </Typography>
            <Typography variant="body2" fontSize="0.875rem">
              {lang('document.productSpecificDocumentDescription')}
            </Typography>
          </Alert>

          {/* Reference */}
          <TextField
            fullWidth
            label={lang('document.documentReference')}
            value={formData.documentReference}
            onChange={(e) => setFormData(prev => ({ ...prev, documentReference: e.target.value }))}
            placeholder={lang('document.documentReferencePlaceholder')}
            disabled={isCreating}
            variant="outlined"
          />

          {/* Name */}
          <TextField
            fullWidth
            label={lang('document.documentNameRequired')}
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder={lang('document.enterDocumentName')}
            error={!formData.name.trim() && formData.name !== ''}
            helperText={!formData.name.trim() && formData.name !== '' ? lang('document.documentNameIsRequired') : ""}
            disabled={isCreating}
            variant="outlined"
          />

          {/* Description — moved up per Task 3 */}
          <TextField
            fullWidth
            label={lang('document.description')}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder={lang('document.descriptionPlaceholder')}
            multiline
            rows={3}
            disabled={isCreating}
            variant="outlined"
          />

          {/* Upload Document — moved up per Task 3 */}
          <DocumentFileUpload
            onFileChange={handleFileChange}
            currentFile={filePath ? { name: selectedFile?.name || 'Uploaded file', path: filePath } : undefined}
            disabled={isCreating}
          />

          {fileUploadInProgress && (
            <Alert severity="info">
              {isConvertingDoc
                ? lang('document.convertingDocToPdf')
                : lang('document.fileUploadInProgress')}
            </Alert>
          )}

          {/* Version */}
          <TextField
            fullWidth
            label={lang('document.version')}
            value={formData.version}
            onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
            placeholder={lang('document.versionPlaceholder')}
            disabled={isCreating}
            variant="outlined"
          />

          {/* Core / Phase */}
          <FormControl fullWidth disabled={isCreating || loadingPhases}>
            <InputLabel id="phase-select-label" shrink={true}>Core / Phase</InputLabel>
            <Select
              labelId="phase-select-label"
              value={formData.phaseId || ""}
              label="Core / Phase"
              onChange={(e) => setFormData(prev => ({ ...prev, phaseId: e.target.value, subSection: '', sectionId: '' }))}
              displayEmpty
              notched
              renderValue={(selected) => {
                if (!selected || selected === "") {
                  return <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>{lang('document.selectAPhase')}</span>;
                }
                if (selected === '__CORE__') {
                  return 'Core';
                }
                const selectedPhase = activePhases.find(phase => phase.id === selected);
                return selectedPhase ? selectedPhase.name : selected;
              }}
              MenuProps={{
                disablePortal: false,
                PaperProps: {
                  style: {
                    zIndex: 1400,
                  },
                },
              }}
            >
              {loadingPhases && (
                <MenuItem disabled>{lang('common.loading')}</MenuItem>
              )}
              {!loadingPhases && (
                <MenuItem value="__CORE__">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span>Core</span>
                  </Box>
                </MenuItem>
              )}
              {!loadingPhases && <Divider />}
              {!loadingPhases && displayPhases.length === 0 && (
                <MenuItem disabled>{lang('document.noPhasesAvailable')}</MenuItem>
              )}
              {!loadingPhases && displayPhases.map(phase => (
                <MenuItem key={phase.id} value={phase.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span>{phase.name}</span>
                    {phase.is_system_phase && (
                      <Chip
                        label={lang('document.inherited')}
                        size="small"
                        sx={{
                          ml: 1,
                          height: 20,
                          fontSize: '0.7rem',
                          backgroundColor: 'rgba(25, 118, 210, 0.1)',
                          color: 'primary.main'
                        }}
                      />
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Section — only shown when a real phase is selected (not Core) */}
          {formData.phaseId && formData.phaseId !== '__CORE__' && formData.phaseId !== '' && (
            <SectionSelector
              value={formData.subSection || ''}
              onChange={(value, sectionId) => setFormData(prev => ({ ...prev, subSection: value, sectionId: sectionId || '' }))}
              companyId={companyId}
              phaseId={formData.phaseId}
              disabled={isCreating}
              label={lang('document.section')}
              placeholder={lang('document.selectOrCreateSection')}
            />
          )}

          {/* Reference Documents */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Reference Documents
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 2, border: '1px solid #e0e0e0', borderRadius: '4px', minHeight: 42, alignItems: 'center' }}>
              {referenceDocumentIds.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No reference documents selected</Typography>
              ) : (
                referenceDocumentIds.map(id => {
                  const doc = referenceDocuments.find(d => d.id === id);
                  return (
                    <Chip
                      key={id}
                      label={doc?.file_name || id}
                      size="small"
                      onDelete={() => setReferenceDocumentIds(prev => prev.filter(x => x !== id))}
                    />
                  );
                })
              )}
              <Button
                size="small"
                variant="outlined"
                onClick={() => setIsRefDocPickerOpen(true)}
                disabled={isCreating}
                sx={{ ml: 'auto' }}
              >
                SELECT
              </Button>
            </Box>
          </Box>

          {/* Tags */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Tags
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 2, border: '1px solid #e0e0e0', borderRadius: '4px', minHeight: 42, alignItems: 'center' }}>
              {tags.map((tag, idx) => (
                <Chip
                  key={idx}
                  label={tag}
                  size="small"
                  onDelete={() => setTags(prev => prev.filter((_, i) => i !== idx))}
                />
              ))}
              <TextField
                size="small"
                variant="standard"
                placeholder="Type a tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tagInput.trim()) {
                    e.preventDefault();
                    const newTag = tagInput.trim();
                    if (!tags.includes(newTag)) {
                      setTags(prev => [...prev, newTag]);
                    }
                    setTagInput('');
                  }
                }}
                disabled={isCreating}
                sx={{ minWidth: 150, flex: 1 }}
                InputProps={{ disableUnderline: true }}
              />
            </Box>
            {/* Existing tag suggestions */}
            {(() => {
              const suggestions = existingTags.filter(t => !tags.includes(t) && (!tagInput || t.toLowerCase().includes(tagInput.toLowerCase())));
              if (suggestions.length === 0) return null;
              return (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                    Existing tags:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {suggestions.slice(0, 15).map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          if (!tags.includes(tag)) {
                            setTags(prev => [...prev, tag]);
                          }
                          setTagInput('');
                        }}
                        disabled={isCreating}
                        sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                      />
                    ))}
                  </Box>
                </Box>
              );
            })()}
          </Box>

          {/* Document Type */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <FormControl fullWidth disabled={isCreating || isLoadingDocTypes} sx={{ flex: 1 }}>
              <InputLabel id="document-type-select-label">{lang('document.documentType')}</InputLabel>
              <Select
                labelId="document-type-select-label"
                value={formData.documentType}
                label={lang('document.documentType')}
                onChange={(e) => setFormData(prev => ({ ...prev, documentType: e.target.value }))}
                MenuProps={{
                  disablePortal: false,
                  PaperProps: {
                    style: {
                      zIndex: 1400,
                    },
                  },
                }}
              >
                {isLoadingDocTypes ? (
                  <MenuItem disabled>{lang('document.loadingTypes')}</MenuItem>
                ) : documentTypes.length === 0 ? (
                  <MenuItem disabled>{lang('document.noTypesAvailable')}</MenuItem>
                ) : (
                  documentTypes.map(type => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            <Tooltip title={lang('document.addNewDocumentType')}>
              <IconButton
                onClick={() => setIsAddDocumentTypeSheetOpen(true)}
                disabled={isCreating || isLoadingDocTypes}
                sx={{
                  mt: 1,
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '&:disabled': {
                    bgcolor: 'action.disabledBackground',
                  }
                }}
              >
                <Add />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Date */}
          <FormControl fullWidth disabled={isCreating}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {lang('document.date')}
            </Typography>
            <Box sx={{ border: '1px solid #e0e0e0', padding: '10px', borderRadius: '4px' }}>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                disabled={isCreating}
                style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent' }}
              />
            </Box>
            {formData.date && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {lang('document.displayFormat')}: {formatDate(formData.date)}
              </Typography>
            )}
          </FormControl>

          {/* Due Date */}
          <FormControl fullWidth disabled={isCreating}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {lang('document.deadlineDueDate')}
            </Typography>
            <Box sx={{ border: '1px solid #e0e0e0', padding: '10px', borderRadius: '4px' }}>
              <input
                type="date"
                value={formData.dueDate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                disabled={isCreating}
                style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent' }}
              />
            </Box>
            {formData.dueDate && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {lang('document.displayFormat')}: {formatDate(formData.dueDate)}
              </Typography>
            )}
          </FormControl>

          {/* Current Effective Version */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e0e0e0', borderRadius: '4px', p: 2 }}>
            <Typography variant="body2">{lang('document.currentEffectiveVersion')}</Typography>
            <input
              type="checkbox"
              checked={formData.isCurrentEffectiveVersion}
              onChange={(e) => setFormData(prev => ({ ...prev, isCurrentEffectiveVersion: e.target.checked }))}
              disabled={isCreating}
              style={{ width: '20px', height: '20px' }}
            />
          </Box>

          {/* Authors */}
          <MultiAuthorSelector
            value={formData.authorsIds}
            onChange={(value) => setFormData(prev => ({ ...prev, authorsIds: value }))}
            companyId={companyId}
            disabled={isCreating}
            deferCreation={true}
            onPendingAuthorsChange={setPendingAuthors}
          />

          {/* Need Template Update */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e0e0e0', borderRadius: '4px', p: 2 }}>
            <Typography variant="body2">{lang('document.needTemplateUpdate')}</Typography>
            <input
              type="checkbox"
              checked={formData.needTemplateUpdate}
              onChange={(e) => setFormData(prev => ({ ...prev, needTemplateUpdate: e.target.checked }))}
              disabled={isCreating}
              style={{ width: '20px', height: '20px' }}
            />
          </Box>

          {/* Reviewer Groups */}
          {!isLoadingGroups && reviewerGroups.length === 0 ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {lang('document.reviewerGroups')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {lang('document.noReviewerGroupsConfigured')}
              </Typography>
            </Box>
          ) : (
          <FormControl fullWidth disabled={isCreating || isLoadingGroups}>
            <InputLabel>{lang('document.reviewerGroups')}</InputLabel>
            <Select
              multiple
              value={reviewerGroupIds}
              label={lang('document.reviewerGroups')}
              onChange={(e) => {
                const value = e.target.value;
                const selectedIds = typeof value === 'string' ? value.split(',') : value;
                setReviewerGroupIds(selectedIds);
              }}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {isLoadingGroups ? (
                    <Typography variant="body2" color="text.secondary">
                      {lang('document.loadingReviewerGroups')}
                    </Typography>
                  ) : (
                    selected.map((value) => {
                      const group = reviewerGroups.find(g => g.id === value);
                      return (
                        <Chip
                          key={value}
                          label={group?.name || 'Unknown Group'}
                          size="small"
                          sx={{
                            backgroundColor: 'primary.light',
                            color: 'primary.contrastText',
                            '& .MuiChip-deleteIcon': {
                              color: 'primary.contrastText'
                            }
                          }}
                        />
                      );
                    })
                  )}
                </Box>
              )}
              MenuProps={{
                disablePortal: false,
                PaperProps: {
                  style: {
                    zIndex: 1400,
                  },
                },
              }}
            >
              {reviewerGroups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' }}></Box>
                    {group.name}
                    {group.description && (
                      <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                        - {group.description}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {isLoadingGroups ? (
                lang('document.loadingReviewerGroups')
              ) : (
                <>
                  {lang('document.selectReviewerGroupsOptional')}
                  {reviewerGroupIds.length > 0 && (
                    <Typography variant="caption" display="block" sx={{ mt: 1, color: 'info.main' }}>
                      {lang('document.groupsSelected', { count: reviewerGroupIds.length })}
                    </Typography>
                  )}
                </>
              )}
            </FormHelperText>
          </FormControl>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Button
          onClick={() => onOpenChange(false)}
          disabled={isCreating}
        >
          {lang('common.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isCreating || !formData.name.trim() || fileUploadInProgress}
        >
          {isCreating ? lang('document.creating') : fileUploadInProgress ? lang('document.uploading') : lang('document.createInstance')}
        </Button>
      </Box>

      {/* Add Document Type Sheet */}
      <AddDocumentTypeSheet
        open={isAddDocumentTypeSheetOpen}
        onOpenChange={setIsAddDocumentTypeSheetOpen}
        companyId={companyId}
        onDocumentTypeAdded={async (documentTypeName: string) => {
          await refetchDocumentTypes();
          setFormData(prev => ({ ...prev, documentType: documentTypeName }));
        }}
        onDocumentTypeDeleted={async () => {
          await refetchDocumentTypes();
          // Clear selection if the deleted type was selected
          if (!documentTypes.includes(formData.documentType)) {
            setFormData(prev => ({ ...prev, documentType: '' }));
          }
        }}
      />

      <ReferenceDocumentPicker
        open={isRefDocPickerOpen}
        onOpenChange={setIsRefDocPickerOpen}
        companyId={companyId}
        selectedIds={referenceDocumentIds}
        onConfirm={setReferenceDocumentIds}
      />
    </Drawer>
  );
}
