
import React, { useState, useMemo } from "react";
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
import { DocumentCreationService } from "@/services/documentCreationService";
import { DocumentFileUpload } from "@/components/common/DocumentFileUpload";
import { MultiAuthorSelector } from "@/components/common/MultiAuthorSelector";
import { PendingAuthorData, createPendingAuthors } from "@/components/common/AddAuthorSheet";
import { useReviewerGroups } from "@/hooks/useReviewerGroups";
import { useDocumentTypes } from "@/hooks/useDocumentTypes";
import { toast } from "sonner";
import { AddDocumentTypeSheet } from "@/components/common/AddDocumentTypeSheet";
import { DocToPdfConverterService } from "@/services/docToPdfConverterService";
import { uploadFileToStorage } from "@/utils/storageUtils";
import { useCompanyDateFormat } from "@/hooks/useCompanyDateFormat";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";
import { Link } from "react-router-dom";
import { ReferenceDocumentPicker } from "@/components/common/ReferenceDocumentPicker";
import { useReferenceDocuments } from "@/hooks/useReferenceDocuments";
import { useExistingTags } from "@/hooks/useExistingTags";
import { SectionSelector } from "@/components/common/SectionSelector";
import { PhaseActivationService } from "@/services/phaseActivationService";

interface CompanyDocumentCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onDocumentCreated: (documentId: string) => void;
}

export function CompanyDocumentCreationDialog({
  open,
  onOpenChange,
  companyId,
  onDocumentCreated
}: CompanyDocumentCreationDialogProps) {
  const { lang } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    documentType: 'Standard',
    techApplicability: 'All device types',
    status: 'Not Started',
    subSection: '',
    sectionId: '' as string | undefined,
    documentReference: '',
    version: '',
    date: '',
    dueDate: '',
    isCurrentEffectiveVersion: false,
    authorsIds: [] as string[],
    needTemplateUpdate: false,
    itemType: 'report' as 'document' | 'report',
    phaseId: '__CORE__'
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<string | undefined>(undefined);
  const [isCreating, setIsCreating] = useState(false);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [isConvertingDoc, setIsConvertingDoc] = useState(false);
  const [selectedReviewerGroups, setSelectedReviewerGroups] = useState<string[]>([]);
  // Track pending authors that need to be created when form is saved
  const [pendingAuthors, setPendingAuthors] = useState<PendingAuthorData[]>([]);
  const [referenceDocumentIds, setReferenceDocumentIds] = useState<string[]>([]);
  const [isRefDocPickerOpen, setIsRefDocPickerOpen] = useState(false);
  const { documents: referenceDocuments } = useReferenceDocuments(companyId);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const { data: existingTags = [] } = useExistingTags(companyId);

  const [activePhases, setActivePhases] = useState<Array<{ id: string; name: string; description?: string; is_system_phase?: boolean }>>([]);
  const [loadingPhases, setLoadingPhases] = useState(false);

  // Fetch reviewer groups for the company
  const { reviewerGroups, isLoading: isLoadingGroups } = useReviewerGroups(companyId);
  const { companyName } = useCurrentCompany();

  // Get company date format
  const { formatDate, dateFormat } = useCompanyDateFormat(companyId);

  // Fetch document types for the company
  const { documentTypes, isLoading: isLoadingDocTypes, refetch: refetchDocumentTypes } = useDocumentTypes(companyId);
  
  // State for Add Document Type Sheet
  const [isAddDocumentTypeSheetOpen, setIsAddDocumentTypeSheetOpen] = useState(false);

  // Load active phases when dialog opens
  React.useEffect(() => {
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

  const handleFileChange = async (file: File | null, path?: string) => {
    if (file && !path) {
      // Upload started but not completed yet
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
          setFilePath(undefined);
          toast.error(error instanceof Error ? error.message : 'Failed to convert document to PDF');
        }
      }
      // For non-DOC files, the DocumentFileUpload component will handle the upload
    } else if (file && path) {
      // Upload completed successfully (for non-DOC files like PDF)
      const isConvertibleDoc = file ? DocToPdfConverterService.isConvertibleDoc(file.name, file.type) : false;

      if (!isConvertibleDoc) {
        setIsFileUploading(false);
        setUploadedFile(file);
        setFilePath(path);
      }
    } else if (file === null) {
      // File removed
      setIsFileUploading(false);
      setIsConvertingDoc(false);
      setUploadedFile(null);
      setFilePath(undefined);
    }
  };

  const handleReviewerGroupToggle = (groupId: string) => {
    setSelectedReviewerGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSubmit = async () => {
    // Prevent submission if file is still uploading
    if (isFileUploading) {
      toast.error('Please wait for file upload to complete');
      return;
    }

    if (isCreating) return;

    setIsCreating(true);
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

      const documentId = await DocumentCreationService.createDocument({
        name: formData.name,
        description: formData.description,
        documentType: formData.documentType,
        scope: 'company_document',
        companyId,
        techApplicability: formData.techApplicability,
        filePath: filePath,
        fileName: uploadedFile?.name,
        reviewerGroupIds: selectedReviewerGroups.length > 0 ? selectedReviewerGroups : undefined,
        status: formData.status,
        subSection: formData.subSection || undefined,
        sectionIds: formData.sectionId ? [formData.sectionId] : undefined,
        documentReference: formData.documentReference || undefined,
        version: formData.version || undefined,
        date: formData.date || undefined,
        dueDate: formData.dueDate || undefined,
        phaseId: formData.phaseId === '__CORE__' ? (noPhaseEntry?.id || undefined) : (formData.phaseId && formData.phaseId.trim() !== '' ? formData.phaseId : undefined),
        isCurrentEffectiveVersion: formData.isCurrentEffectiveVersion,
        authors_ids: finalAuthorIds.length > 0 ? finalAuthorIds : undefined,
        needTemplateUpdate: formData.needTemplateUpdate,
        isRecord: formData.itemType === 'report',
        reference_document_ids: referenceDocumentIds.length > 0 ? referenceDocumentIds : undefined,
        tags: tags.length > 0 ? tags : undefined,
        silent: true
      });

      if (documentId) {
        onDocumentCreated(documentId);
        onOpenChange(false);

        toast.success('Document created successfully');

        // Reset form
        setFormData({
          name: '',
          description: '',
          documentType: 'Standard',
          techApplicability: 'All device types',
          status: 'Not Started',
          subSection: '',
          sectionId: '',
          documentReference: '',
          version: '',
          date: '',
          dueDate: '',
          isCurrentEffectiveVersion: false,
          authorsIds: [],
          needTemplateUpdate: false,
          itemType: 'report',
          phaseId: '__CORE__'
        });
        setUploadedFile(null);
        setFilePath(undefined);
        setIsFileUploading(false);
        setSelectedReviewerGroups([]);
        setPendingAuthors([]);
        setReferenceDocumentIds([]);
        setTags([]);
        setTagInput('');
      }
    } catch {
      toast.error('Failed to create document');
    } finally {
      setIsCreating(false);
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

  // Check if form can be submitted
  const canSubmit = formData.name.trim() && !isCreating && !isFileUploading;

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
          <Typography variant="h6">Add Company Document CI</Typography>
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
              onChange={(e) => setFormData(prev => ({ ...prev, itemType: e.target.value as 'document' | 'report' }))}
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
          <IconButton onClick={() => onOpenChange(false)} size="small" sx={{ ml: 1 }}>
            <Close />
          </IconButton>
        </Box>

      <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Alert severity="info">
            <Typography variant="body2" fontWeight="medium">
              {lang('documentDialog.companyWideDocument')}
            </Typography>
            <Typography variant="body2" fontSize="0.875rem">
              {lang('documentDialog.companyWideDocumentDesc')}
            </Typography>
          </Alert>

          <TextField
            fullWidth
            label="Document Reference"
            value={formData.documentReference}
            onChange={(e) => setFormData(prev => ({ ...prev, documentReference: e.target.value }))}
            placeholder="e.g., DOC-QMS-001"
            disabled={isCreating}
            variant="outlined"
          />

          <TextField
            fullWidth
            label="Document Name *"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter document name"
            error={!formData.name.trim() && formData.name !== ''}
            helperText={!formData.name.trim() && formData.name !== '' ? "Document name is required" : ""}
            disabled={isCreating}
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
            disabled={isCreating}
            variant="outlined"
          />

          {/* File Upload — moved up per Task 3 */}
          <DocumentFileUpload
            onFileChange={handleFileChange}
            disabled={isCreating}
          />

          {isFileUploading && (
            <Alert severity="info">
              {isConvertingDoc
                ? "Converting DOC/DOCX to PDF and uploading files... Please wait before saving."
                : "File upload in progress... Please wait before saving."}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Version"
            value={formData.version}
            onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
            placeholder="e.g., 1.0, Rev A"
            disabled={isCreating}
            variant="outlined"
          />

          {/* Core / Phase */}
          <FormControl fullWidth disabled={isCreating || loadingPhases}>
            <InputLabel id="company-add-phase-select-label" shrink={true}>Core / Phase</InputLabel>
            <Select
              labelId="company-add-phase-select-label"
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
                PaperProps: { style: { zIndex: 1400 } }
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
              disabled={isCreating}
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
              {tags.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  onDelete={() => setTags(prev => prev.filter(t => t !== tag))}
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
                    const newTag = tagInput.trim();
                    if (!tags.includes(newTag)) {
                      setTags(prev => [...prev, newTag]);
                    }
                    setTagInput('');
                  }
                }}
                disabled={isCreating}
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

          {/* Document Type */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flex: 1 }}>
            <FormControl fullWidth disabled={isCreating || isLoadingDocTypes} sx={{ flex: 1 }}>
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

          {/* Tech Applicability — commented out, not needed for now
          <FormControl fullWidth disabled={isCreating}>
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
          </FormControl>
          */}

          <FormControl fullWidth disabled={isCreating}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Date
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
                Display format: {formatDate(formData.date)}
              </Typography>
            )}
          </FormControl>

          <FormControl fullWidth disabled={isCreating}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Deadline / Due Date
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
              disabled={isCreating}
              style={{ width: '20px', height: '20px' }}
            />
          </Box>

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
            <Typography variant="body2">Need Template Update?</Typography>
            <input
              type="checkbox"
              checked={formData.needTemplateUpdate}
              onChange={(e) => setFormData(prev => ({ ...prev, needTemplateUpdate: e.target.checked }))}
              disabled={isCreating}
              style={{ width: '20px', height: '20px' }}
            />
          </Box>

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
          disabled={!canSubmit}
        >
          {isCreating ? lang('documentDialog.creating') : isFileUploading ? lang('documentDialog.uploading') : lang('documentDialog.createDocument')}
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
