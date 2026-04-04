
import React, { useState, useEffect } from "react";
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
  Chip,
  Radio,
  RadioGroup,
  FormControlLabel,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import { Add, Close } from '@mui/icons-material';
import { Tooltip as ShadTooltip, TooltipContent as ShadTooltipContent, TooltipProvider as ShadTooltipProvider, TooltipTrigger as ShadTooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { DocumentFileUpload } from "@/components/common/DocumentFileUpload";
import { UnifiedDocumentService } from "@/services/unifiedDocumentService";
import { DocumentTypeDetector } from "@/utils/documentTypeDetector";
import { DocumentTemplateFileService } from "@/services/documentTemplateFileService";
import { DocumentTechApplicability } from "@/types/documentTypes";
import { toast } from "sonner";
import { MultiAuthorSelector } from "@/components/common/MultiAuthorSelector";
import { PendingAuthorData, createPendingAuthors } from "@/components/common/AddAuthorSheet";
import { SectionSelector } from "@/components/common/SectionSelector";
import { useReviewerGroups } from "@/hooks/useReviewerGroups";
import { useDocumentTypes } from "@/hooks/useDocumentTypes";
import { usePermissions } from "@/hooks/usePermissions";
import { PhaseActivationService } from "@/services/phaseActivationService";
import { AddDocumentTypeSheet } from "@/components/common/AddDocumentTypeSheet";
import { DocToPdfConverterService } from "@/services/docToPdfConverterService";
import { uploadFileToStorage } from "@/utils/storageUtils";
import { useCompanyDateFormat } from "@/hooks/useCompanyDateFormat";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";
import { Link } from "react-router-dom";
import { useExistingTags } from "@/hooks/useExistingTags";
import { ReferenceDocumentPicker } from "@/components/common/ReferenceDocumentPicker";
import { useReferenceDocuments } from "@/hooks/useReferenceDocuments";

interface CompanyDocumentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: string;
  document: {
    id: string;
    name: string;
    document_type: string;
    description?: string;
    tech_applicability?: string;
    file_path?: string;
    file_name?: string;
    uploaded_at?: string;
    status?: string;
    sub_section?: string;
    section_ids?: string[];
    document_reference?: string;
    version?: string;
    date?: string;
    due_date?: string;
    phase_id?: string;
    is_current_effective_version?: boolean;
    brief_summary?: string;
    author?: string;
    authors_ids?: string[];
    need_template_update?: boolean;
    is_record?: boolean;
    tags?: string[];
    // Gap analysis specific fields
    clauseId?: string;
    framework?: string;
    section?: string;
    requirement?: string;
    gapDescription?: string;
    clauseSummary?: string;
    assignedTo?: string;
    priority?: string;
    source_table?: 'documents' | 'phase_assigned_document_template' | 'document_studio_templates';
  };
  onDocumentUpdated: () => void;
}

export function CompanyDocumentEditDialog({
  open,
  onOpenChange,
  companyId: propCompanyId,
  document,
  onDocumentUpdated
}: CompanyDocumentEditDialogProps) {
  const { lang } = useTranslation();

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

  const [formData, setFormData] = useState({
    name: document.name,
    description: document.description || '',
    documentType: document.document_type,
    techApplicability: document.tech_applicability || 'All device types',
    status: document.status || 'Not Started',
    subSection: document.sub_section || '',
    sectionId: document.section_ids?.[0] || '' as string | undefined,
    documentReference: document.document_reference || '',
    version: document.version || '',
    date: formatDateForInput(document.date),
    dueDate: formatDateForInput(document.due_date),
    phaseId: document.phase_id || '',
    isCurrentEffectiveVersion: document.is_current_effective_version || false,
    authorsIds: document.authors_ids || [] as string[],
    needTemplateUpdate: document.need_template_update || false,
    isRecord: document.is_record || false
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<string | undefined>(document.file_path);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [isConvertingDoc, setIsConvertingDoc] = useState(false);
  const [companyId, setCompanyId] = useState<string>(propCompanyId || '');
  const [documentType, setDocumentType] = useState<string>('regular-document');
  const [selectedReviewerGroups, setSelectedReviewerGroups] = useState<string[]>([]);
  const [activePhases, setActivePhases] = useState<Array<{ id: string; name: string; description?: string; is_system_phase?: boolean }>>([]);
  const [loadingPhases, setLoadingPhases] = useState(false);

  // Track pending authors that need to be created when form is saved
  const [pendingAuthors, setPendingAuthors] = useState<PendingAuthorData[]>([]);
  const [approvalNote, setApprovalNote] = useState<string>('');
  const [tags, setTags] = useState<string[]>(document.tags || []);
  const [tagInput, setTagInput] = useState<string>('');
  const [referenceDocumentIds, setReferenceDocumentIds] = useState<string[]>(
    (document as any).reference_document_ids || []
  );
  const [isRefDocPickerOpen, setIsRefDocPickerOpen] = useState(false);
  const { hasAdminAccess } = usePermissions();
  const { reviewerGroups, isLoading: isLoadingGroups } = useReviewerGroups(companyId);
  const { companyName } = useCurrentCompany();
  const { documentTypes, isLoading: isLoadingDocTypes, refetch: refetchDocumentTypes } = useDocumentTypes(companyId);

  // Get company date format
  const { formatDate, dateFormat } = useCompanyDateFormat(companyId);
  const { data: existingTags = [] } = useExistingTags(companyId || undefined);
  const { documents: referenceDocuments } = useReferenceDocuments(companyId || undefined);

  // State for Add Document Type Sheet
  const [isAddDocumentTypeSheetOpen, setIsAddDocumentTypeSheetOpen] = useState(false);

  // Get company ID and detect document type when dialog opens
  useEffect(() => {
    const detectDocumentType = async () => {
      if (open && document) {
        const detection = await DocumentTypeDetector.detectType(document);
        setDocumentType(detection.type);

        // Use prop companyId if provided, otherwise fetch from user metadata
        if (propCompanyId) {
          setCompanyId(propCompanyId);
        } else {
          // Get current user's active company
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.user_metadata?.activeCompany) {
            setCompanyId(user.user_metadata.activeCompany);
          }
        }
      }
    };
    detectDocumentType();
  }, [open, document, propCompanyId]);

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
              description: phase.phase?.description,
              is_system_phase: phase.phase?.is_system_phase || false
            }));
            setActivePhases(mappedPhases);
          } else {
            setActivePhases([]);
          }
        } catch {
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

  // Reset form when document changes or dialog opens
  useEffect(() => {
    if (open && document) {
      // Pre-select __CORE__ if phase_id matches "No Phase"
      const docPhaseId = document.phase_id || '';
      const isNoPhase = noPhaseEntry && docPhaseId === noPhaseEntry.id;
      setFormData({
        name: document.name,
        description: document.description || '',
        documentType: document.document_type,
        techApplicability: document.tech_applicability || 'All device types',
        status: document.status || 'Not Started',
        subSection: document.sub_section || '',
        sectionId: document.section_ids?.[0] || '',
        documentReference: document.document_reference || '',
        version: document.version || '',
        date: formatDateForInput(document.date),
        dueDate: formatDateForInput(document.due_date),
        phaseId: isNoPhase ? '__CORE__' : docPhaseId,
        isCurrentEffectiveVersion: document.is_current_effective_version || false,
        authorsIds: document.authors_ids || [],
        needTemplateUpdate: document.need_template_update || false,
        isRecord: document.is_record || false
      });
      setFilePath(document.file_path);
      setUploadedFile(null);
      setIsFileUploading(false);
      setTags(document.tags || []);
      setTagInput('');
      setReferenceDocumentIds((document as any).reference_document_ids || []);
      // Load existing reviewer groups - handle both single ID and array format
      const existingReviewerGroups = (document as any).reviewer_group_ids || 
        ((document as any).reviewer_group_id ? [(document as any).reviewer_group_id] : []);
      setSelectedReviewerGroups(Array.isArray(existingReviewerGroups) ? existingReviewerGroups : []);
    }
  }, [open, document, activePhases]);

  const handleFileUpload = async (file: File) => {
    setIsFileUploading(true);
    setUploadedFile(file);

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

        // Upload original DOC/DOCX file as backup
        const originalFilePath = `documents/${timestamp}_original_${cleanFileName}`;
        await uploadFileToStorage(file, originalFilePath);

        // Upload converted PDF file (this will be stored in file_path)
        const pdfFilePath = `documents/${timestamp}_${pdfFileName}`;

        // Convert blob to File for upload
        const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });
        const uploadedPdfPath = await uploadFileToStorage(pdfFile, pdfFilePath);

        setFilePath(uploadedPdfPath);
        setUploadedFile(pdfFile);
        setIsFileUploading(false);
        setIsConvertingDoc(false);

      } catch (error) {
        setIsConvertingDoc(false);
        setIsFileUploading(false);
        setUploadedFile(null);
        toast.error(error instanceof Error ? error.message : 'Failed to convert document to PDF');
      }
    } else {
      // Non-DOC file - use regular upload
      try {
        const uploadedPath = await DocumentTemplateFileService.uploadFile(
          document.id,
          file,
          companyId
        );

        if (uploadedPath) {
          setIsFileUploading(false);
          setFilePath(uploadedPath);
          // Toast removed - final save toast is sufficient
        } else {
          throw new Error('Upload failed');
        }
      } catch {
        setIsFileUploading(false);
        setUploadedFile(null);
        toast.error('Failed to upload file');
      }
    }
  };

  const handleFileRemove = () => {
    setUploadedFile(null);
    setFilePath(undefined);
  };

  const handleReviewerGroupToggle = (groupId: string) => {
    setSelectedReviewerGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSubmit = async () => {
    if (isFileUploading) {
      toast.error('Please wait for file upload to complete');
      return;
    }

    if (isUpdating) {
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Document name is required');
      return;
    }

    setIsUpdating(true);
    try {
      // Create any pending authors first
      let finalAuthorIds = [...formData.authorsIds];
      if (pendingAuthors.length > 0) {
        const tempToRealIdMap = await createPendingAuthors(pendingAuthors, companyId);

        // Replace temp IDs with real IDs
        finalAuthorIds = finalAuthorIds.map(id => {
          const realId = tempToRealIdMap.get(id);
          return realId || id;
        });
      }

      // Create a unified document item for the service
      const documentItem = {
        id: document.id,
        name: formData.name.trim(),
        type: formData.documentType,
        description: formData.description,
        status: formData.status,
        techApplicability: formData.techApplicability as DocumentTechApplicability,
        file_path: filePath,
        file_name: uploadedFile?.name || (filePath ? document.file_name : null),
        uploaded_at: filePath && uploadedFile ? new Date().toISOString() : document.uploaded_at,
        // Compliance fields
        sub_section: formData.subSection || null,
        section_ids: formData.sectionId ? [formData.sectionId] : null,
        document_reference: formData.documentReference || null,
        version: formData.version || null,
        date: formData.date || null,
        due_date: formData.dueDate || null,
        phase_id: formData.phaseId === '__CORE__' ? (noPhaseEntry?.id || null) : (formData.phaseId && formData.phaseId.trim() !== '' ? formData.phaseId : null),
        is_current_effective_version: formData.isCurrentEffectiveVersion,
        authors_ids: finalAuthorIds.length > 0 ? finalAuthorIds : null,
        need_template_update: formData.needTemplateUpdate,
        // Include gap analysis specific fields if they exist
        clauseId: document.clauseId,
        framework: document.framework,
        section: document.section,
        requirement: document.requirement,
        gapDescription: document.gapDescription,
        clauseSummary: document.clauseSummary,
        assignedTo: document.assignedTo,
        priority: document.priority,
        // Required DocumentItem fields
        phases: [],
        reviewers: [], // Keep as empty array for compatibility
        reviewer_group_ids: selectedReviewerGroups.length > 0 ? selectedReviewerGroups : null, // Add reviewer group IDs
        is_record: formData.isRecord,
        lastUpdated: new Date().toISOString(),
        // Approval fields - set when status is Approved
        approval_note: formData.status === 'Approved' && approvalNote ? approvalNote : null,
        tags: tags.length > 0 ? tags : null,
        reference_document_ids: referenceDocumentIds.length > 0 ? referenceDocumentIds : null,
        source_table: document.source_table
      };

      // Use the unified service to handle the update
      const success = await UnifiedDocumentService.updateDocument(documentItem);

      if (success) {
        onDocumentUpdated();
        onOpenChange(false);
      } else {
        throw new Error('Update operation failed');
      }
    } catch {
      toast.error('Failed to update document');
    } finally {
      setIsUpdating(false);
    }
  };

  const techApplicabilityOptions = [
    'All device types',
    'Class I devices only',
    'Class II devices only',
    'Class III devices only',
    'Software devices only',
    'Hardware devices only'
  ];

  const canSubmit = formData.name.trim() && !isUpdating && !isFileUploading;

  const isGapAnalysisItem = documentType === 'gap-analysis';

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
        sx: { width: { xs: '100%', sm: 1000 }, display: 'flex', flexDirection: 'column' }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">
            {isGapAnalysisItem ? lang('documentDialog.editGapAnalysisItem') : lang('documentDialog.editDocument')}
          </Typography>
            <FormControl size="small" disabled={isUpdating} sx={{ minWidth: 140 }}>
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
          {!isGapAnalysisItem && (
            <FormControl component="fieldset" disabled={isUpdating} sx={{ ml: 2 }}>
              <RadioGroup
                row
                value={formData.isRecord ? 'report' : 'document'}
                onChange={(e) => setFormData(prev => ({ ...prev, isRecord: e.target.value === 'report' }))}
              >
                <ShadTooltipProvider>
                  <ShadTooltip>
                    <ShadTooltipTrigger asChild>
                      <FormControlLabel value="document" control={<Radio size="small" />} label={lang('documentDialog.document')} />
                    </ShadTooltipTrigger>
                    <ShadTooltipContent side="bottom" className="max-w-xs z-[9999]">
                      <p>Per EU MDR & ISO 13485: A controlled document that defines how processes should be performed — procedures, plans, policies, work instructions, and specifications.</p>
                    </ShadTooltipContent>
                  </ShadTooltip>
                </ShadTooltipProvider>
                <ShadTooltipProvider>
                  <ShadTooltip>
                    <ShadTooltipTrigger asChild>
                      <FormControlLabel value="report" control={<Radio size="small" />} label={lang('documentDialog.report')} />
                    </ShadTooltipTrigger>
                    <ShadTooltipContent side="bottom" className="max-w-xs z-[9999]">
                      <p>Per EU MDR & ISO 13485: A record that provides evidence of activities performed and results achieved — test reports, clinical evaluation reports, audit reports, risk management reports.</p>
                    </ShadTooltipContent>
                  </ShadTooltip>
                </ShadTooltipProvider>
              </RadioGroup>
            </FormControl>
          )}
          <IconButton onClick={() => onOpenChange(false)} size="small" sx={{ ml: 1 }}>
            <Close />
          </IconButton>
        </Box>

      <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {!isGapAnalysisItem && (
            <Alert severity="info">
              <Typography variant="body2" fontWeight="medium">
                {lang('documentDialog.companyWideDocument')}
              </Typography>
              <Typography variant="body2" fontSize="0.875rem">
                {lang('documentDialog.companyWideDocumentUpdateDesc')}
              </Typography>
            </Alert>
          )}

          {!isGapAnalysisItem && (
            <TextField
              fullWidth
              label="Document Reference"
              value={formData.documentReference}
              onChange={(e) => setFormData(prev => ({ ...prev, documentReference: e.target.value }))}
              placeholder="e.g., DOC-QMS-001"
              disabled={isUpdating}
              variant="outlined"
            />
          )}

          <TextField
            fullWidth
            label={isGapAnalysisItem ? 'Item Name *' : 'Document Name *'}
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder={isGapAnalysisItem ? "Enter item name" : "Enter document name"}
            error={!formData.name.trim() && formData.name !== ''}
            helperText={!formData.name.trim() && formData.name !== '' ? "Name is required" : ""}
            disabled={isUpdating}
            variant="outlined"
          />

          {/* Description — moved up per Task 3 */}
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Document description..."
            multiline
            rows={3}
            disabled={isUpdating}
            variant="outlined"
          />

          {/* File Upload — moved up per Task 3 */}
          {!isGapAnalysisItem && (
            <>
              <DocumentFileUpload
                onFileChange={(file, path) => {
                  if (file && !path) {
                    handleFileUpload(file);
                  } else if (file === null) {
                    handleFileRemove();
                  }
                }}
                currentFile={filePath ? { name: uploadedFile?.name || document.file_name || 'Uploaded file', path: filePath } : undefined}
                disabled={isUpdating}
              />

              {isFileUploading && (
                <Alert severity="info">
                  {isConvertingDoc
                    ? "Converting DOC/DOCX to PDF and uploading files... Please wait before saving."
                    : "File upload in progress... Please wait before saving."}
                </Alert>
              )}
            </>
          )}

          {/* Approval Note - shown when status is Approved */}
          {formData.status === 'Approved' && (
            <TextField
              fullWidth
              label="Approval Note"
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
              placeholder="e.g., Talked to author John, he says this is fine"
              multiline
              rows={2}
              disabled={isUpdating}
              variant="outlined"
              helperText="Optional: Add a note about the approval (e.g., who was consulted, reason for approval)"
            />
          )}

          {!isGapAnalysisItem && (
            <TextField
              fullWidth
              label="Version"
              value={formData.version}
              onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
              placeholder="e.g., 1.0, Rev A"
              disabled={isUpdating}
              variant="outlined"
            />
          )}

          <FormControl fullWidth disabled={isUpdating || loadingPhases}>
            <InputLabel id="company-edit-phase-select-label" shrink={true}>Core / Phase</InputLabel>
            <Select
              labelId="company-edit-phase-select-label"
              value={formData.phaseId || ""}
              label="Core / Phase"
              onChange={(e) => setFormData(prev => ({ ...prev, phaseId: e.target.value, subSection: '', sectionId: '' }))}
              displayEmpty
              notched
              renderValue={(selected) => {
                if (!selected || selected === "") {
                  return <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>Select a phase</span>;
                }
                if (selected === '__CORE__') {
                  return 'Core';
                }
                const selectedPhase = activePhases.find(phase => phase.id === selected);
                if (selectedPhase?.name.toLowerCase() === 'no phase') return 'Core';
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
                <MenuItem disabled>Loading...</MenuItem>
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
                <MenuItem disabled>No phases available</MenuItem>
              )}
              {!loadingPhases && displayPhases.map(phase => (
                <MenuItem key={phase.id} value={phase.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span>{phase.name}</span>
                    {phase.is_system_phase && (
                      <Chip
                        label="Inherited"
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
          {!isGapAnalysisItem && (
            <>
              {/* Section — only shown when a real phase is selected (not Core) */}
              {formData.phaseId && formData.phaseId !== '__CORE__' && formData.phaseId !== '' && (
                <SectionSelector
                  value={formData.subSection || ''}
                  onChange={(value, sectionId) => setFormData(prev => ({
                    ...prev,
                    subSection: value,
                    sectionId: sectionId
                  }))}
                  companyId={companyId}
                  phaseId={formData.phaseId}
                  disabled={isUpdating}
                  label="Section"
                  placeholder="Select or create a section"
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
                    disabled={isUpdating}
                    sx={{ ml: 'auto' }}
                  >
                    SELECT
                  </Button>
                </Box>
              </Box>

              {/* Tags — same style as Add form */}
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
                      sx={{ bgcolor: '#e0f2f1', color: '#00695c' }}
                    />
                  ))}
                  <TextField
                    variant="standard"
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagInput.trim()) {
                        e.preventDefault();
                        if (!tags.includes(tagInput.trim())) {
                          setTags(prev => [...prev, tagInput.trim()]);
                        }
                        setTagInput('');
                      }
                    }}
                    disabled={isUpdating}
                    InputProps={{ disableUnderline: true }}
                    sx={{ minWidth: 100, flex: 1 }}
                    size="small"
                  />
                </Box>
                {existingTags.length > 0 && tagInput && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
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
                          sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
                        />
                      ))}
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flex: 1 }}>
                <FormControl fullWidth disabled={isUpdating || isLoadingDocTypes} sx={{ flex: 1 }}>
                  <InputLabel>Document Type</InputLabel>
                  <Select
                    value={formData.documentType}
                    label="Document Type"
                    onChange={(e) => setFormData(prev => ({ ...prev, documentType: e.target.value }))}
                    MenuProps={{
                      disablePortal: false,
                      PaperProps: { style: { zIndex: 1400 } }
                    }}
                  >
                    {isLoadingDocTypes ? (
                      <MenuItem disabled>Loading...</MenuItem>
                    ) : (
                      documentTypes.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
                <Tooltip title="Add new document type">
                  <IconButton
                    onClick={() => setIsAddDocumentTypeSheetOpen(true)}
                    disabled={isUpdating || isLoadingDocTypes}
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

              {/* Tech Applicability - commented out, not needed for now */}
              {/* <FormControl fullWidth disabled={isUpdating}>
                <InputLabel>Tech Applicability</InputLabel>
                <Select
                  value={formData.techApplicability}
                  label="Tech Applicability"
                  onChange={(e) => setFormData(prev => ({ ...prev, techApplicability: e.target.value }))}
                  MenuProps={{
                    disablePortal: false,
                    PaperProps: { style: { zIndex: 1400 } }
                  }}
                >
                  {techApplicabilityOptions.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl> */}

              <FormControl fullWidth disabled={isUpdating}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Date
                </Typography>
                <Box sx={{ border: '1px solid #e0e0e0', padding: '10px', borderRadius: '4px' }}>
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    disabled={isUpdating}
                    style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent' }}
                  />
                </Box>
                {formData.date && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    Display format: {formatDate(formData.date)}
                  </Typography>
                )}
              </FormControl>

              <FormControl fullWidth disabled={isUpdating}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Deadline / Due Date
                </Typography>
                <Box sx={{ border: '1px solid #e0e0e0', padding: '10px', borderRadius: '4px' }}>
                  <input
                    type="date"
                    value={formData.dueDate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    disabled={isUpdating}
                    style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent' }}
                  />
                </Box>
                {formData.dueDate && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    Display format: {formatDate(formData.dueDate)}
                  </Typography>
                )}
              </FormControl>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e0e0e0', borderRadius: '4px', p: 2 }}>
                <Typography variant="body2">Current Effective Version</Typography>
                <input
                  type="checkbox"
                  checked={formData.isCurrentEffectiveVersion}
                  onChange={(e) => setFormData(prev => ({ ...prev, isCurrentEffectiveVersion: e.target.checked }))}
                  disabled={isUpdating}
                  style={{ width: '20px', height: '20px' }}
                />
              </Box>

              <MultiAuthorSelector
                value={formData.authorsIds}
                onChange={(value) => setFormData(prev => ({ ...prev, authorsIds: value }))}
                companyId={companyId}
                disabled={isUpdating}
                deferCreation={true}
                onPendingAuthorsChange={setPendingAuthors}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e0e0e0', borderRadius: '4px', p: 2 }}>
                <Typography variant="body2">Need Template Update?</Typography>
                <input
                  type="checkbox"
                  checked={formData.needTemplateUpdate}
                  onChange={(e) => setFormData(prev => ({ ...prev, needTemplateUpdate: e.target.checked }))}
                  disabled={isUpdating}
                  style={{ width: '20px', height: '20px' }}
                />
              </Box>
            </>
          )}

          {/* Description, File Upload, Status, Approval Note already moved up per Task 3 */}

          {!isGapAnalysisItem && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Reviewer Groups
              </Typography>
              {isLoadingGroups ? (
                <Typography variant="body2" color="text.secondary">Loading reviewer groups...</Typography>
              ) : reviewerGroups.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No reviewer groups configured.{' '}
                  <Link to={`/app/company/${encodeURIComponent(companyName || '')}/settings?tab=reviewers`} style={{ color: '#1976d2', textDecoration: 'underline' }}>
                    Configure in Settings
                  </Link>
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 2, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                  {reviewerGroups.map(group => {
                    const isSelected = selectedReviewerGroups.includes(group.id);
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
              {selectedReviewerGroups.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {selectedReviewerGroups.length} {selectedReviewerGroups.length === 1 ? 'group' : 'groups'} selected
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Button
          onClick={() => onOpenChange(false)}
          disabled={isUpdating}
        >
          {lang('common.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!canSubmit}
        >
          {isUpdating ? lang('documentDialog.saving') : isFileUploading ? lang('documentDialog.uploading') : lang('documentDialog.saveChanges')}
        </Button>
      </Box>

      {/* Add Document Type Sheet */}
      {companyId && (
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
      )}

      {companyId && (
        <ReferenceDocumentPicker
          open={isRefDocPickerOpen}
          onOpenChange={setIsRefDocPickerOpen}
          companyId={companyId}
          selectedIds={referenceDocumentIds}
          onConfirm={setReferenceDocumentIds}
        />
      )}
    </Drawer>
  );
}
