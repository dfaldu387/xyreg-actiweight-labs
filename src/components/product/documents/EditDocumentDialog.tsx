import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  FormHelperText,
  Radio,
  RadioGroup,
  FormControlLabel,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import { Add, Close } from '@mui/icons-material';
import { Tooltip as ShadTooltip, TooltipContent as ShadTooltipContent, TooltipProvider as ShadTooltipProvider, TooltipTrigger as ShadTooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/useTranslation";
import { DocumentStatusDropdown } from "@/components/ui/document-status-dropdown";
import { PhaseRestrictedDatePicker } from "@/components/ui/phase-restricted-date-picker";
import { ProductSpecificDocumentService } from "@/services/productSpecificDocumentService";
import { TemplateInstanceDocumentService } from "@/services/templateInstanceDocumentService";
import { DocumentPhaseFixService } from "@/services/documentPhaseFixService";
import { toast } from "sonner";
import { DocumentFileUpload } from "@/components/common/DocumentFileUpload";
import { useReviewerGroups } from "@/hooks/useReviewerGroups";
import { useDocumentPhaseTimeline } from "@/hooks/useDocumentPhaseTimeline";
import { useProductPhases } from "@/hooks/useProductPhases";
import { supabase } from "@/integrations/supabase/client";
import { ReviewerNotificationService } from "@/services/reviewerNotificationService";
import { DocToPdfConverterService } from "@/services/docToPdfConverterService";
import { uploadFileToStorage } from "@/utils/storageUtils";
import { MultiAuthorSelector } from "@/components/common/MultiAuthorSelector";
import { PendingAuthorData, createPendingAuthors } from "@/components/common/AddAuthorSheet";
import { PhaseActivationService } from "@/services/phaseActivationService";
import { DocumentCreationService } from "@/services/documentCreationService";
import { SectionSelector } from "@/components/common/SectionSelector";
import { useDocumentTypes } from "@/hooks/useDocumentTypes";
import { AddDocumentTypeSheet } from "@/components/common/AddDocumentTypeSheet";
import { useCompanyDateFormat } from "@/hooks/useCompanyDateFormat";
import { ReferenceDocumentPicker } from "@/components/common/ReferenceDocumentPicker";
import { useReferenceDocuments } from "@/hooks/useReferenceDocuments";
import { useExistingTags } from "@/hooks/useExistingTags";

interface EditDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: any;
  onDocumentUpdated: (document: any) => void;
  documentType: 'product-specific' | 'template-instance';
  productId: string;
  companyId: string;
  handleRefreshData: () => void;
  isFromGanttChart?: boolean;
}

export function EditDocumentDialog({
  open,
  onOpenChange,
  document,
  onDocumentUpdated,
  documentType,
  productId,
  companyId,
  handleRefreshData,
  isFromGanttChart = false
}: EditDocumentDialogProps) {
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const [name, setName] = useState(document?.name || "");
  const [description, setDescription] = useState(document?.description || "");
  const [selectedDocumentType, setSelectedDocumentType] = useState(document?.document_type || "");
  const [phaseId, setPhaseId] = useState(document?.phase_id || document?.phaseId || "");
  const [section, setSection] = useState(document?.sub_section || "");
  const [sectionId, setSectionId] = useState(
    document?.section_ids && Array.isArray(document.section_ids) && document.section_ids.length > 0
      ? document.section_ids[0]
      : ""
  );
  const [documentReference, setDocumentReference] = useState(document.document_reference || "");
  const [tags, setTags] = useState<string[]>(document.tags && Array.isArray(document.tags) ? document.tags : []);
  const [tagInput, setTagInput] = useState("");
  const [activePhases, setActivePhases] = useState<Array<{ id: string; name: string; description?: string; is_system_phase?: boolean }>>([]);
  const [loadingPhases, setLoadingPhases] = useState(false);
  const [version, setVersion] = useState(document.version || "");
  const [date, setDate] = useState(document.date || "");
  const [isCurrentEffectiveVersion, setIsCurrentEffectiveVersion] = useState(document.is_current_effective_version || false);
  const [authorsIds, setAuthorsIds] = useState<string[]>(
    document.authors_ids && Array.isArray(document.authors_ids)
      ? document.authors_ids
      : []
  );
  const [needTemplateUpdate, setNeedTemplateUpdate] = useState(document.need_template_update || false);
  const [isRecord, setIsRecord] = useState(document.is_record || false);
  // Track pending authors that need to be created when form is saved
  const [pendingAuthors, setPendingAuthors] = useState<PendingAuthorData[]>([]);
  // Reference document linking
  const [referenceDocumentIds, setReferenceDocumentIds] = useState<string[]>(
    document.reference_document_ids && Array.isArray(document.reference_document_ids)
      ? document.reference_document_ids
      : []
  );
  const [isRefDocPickerOpen, setIsRefDocPickerOpen] = useState(false);
  const { documents: refDocuments } = useReferenceDocuments(companyId);
  // Map backend status to frontend status values
  const mapBackendStatusToFrontend = (backendStatus: string) => {
    if (!backendStatus) return "Not Started";

    const statusMap: { [key: string]: string } = {
      "Not Started": "Not Started",
      "In Review": "In Review",
      "In Progress": "In Review",
      "Pending": "In Review",
      "Approved": "Approved",
      "Completed": "Approved",
      "Complete": "Approved",
      "Report": "Report",
      "Rejected": "Rejected",
      "Closed": "Rejected", // Legacy mapping
      "N/A": "N/A",
      "Not Required": "N/A",
    };

    const mappedStatus = statusMap[backendStatus] || "Not Started";
    return mappedStatus;
  };

  const [status, setStatus] = useState(mapBackendStatusToFrontend(document.status));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<string | undefined>(document.file_path || document.filePath);
  const [pdfPath, setPdfPath] = useState<string | undefined>(document.public_url);
  const [fileUploadInProgress, setFileUploadInProgress] = useState(false);
  const [isConvertingDoc, setIsConvertingDoc] = useState(false);
  const [reviewerGroupIds, setReviewerGroupIds] = useState<string[]>(
    // Handle both singular and plural field names, and array format
    document.reviewer_group_ids && Array.isArray(document.reviewer_group_ids)
      ? document.reviewer_group_ids
      : document.reviewer_group_id
        ? [document.reviewer_group_id]
        : document.reviewerGroupId
          ? [document.reviewerGroupId]
          : []
  );

  // Handle both due_date and deadline fields - also check for dueDate (camelCase)
  const [dueDate, setDueDate] = useState<Date | undefined>(
    (document.deadline || document.due_date || document.dueDate) ? new Date(document.deadline || document.due_date || document.dueDate) : undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch reviewer groups and product phases
  const { reviewerGroups, isLoading: isLoadingGroups } = useReviewerGroups(companyId);
  const { phases, fetchPhases } = useProductPhases(productId, companyId);
  
  // Get dynamic document types
  const { documentTypes, isLoading: isLoadingDocTypes, refetch: refetchDocumentTypes } = useDocumentTypes(companyId);
  const [isAddDocumentTypeSheetOpen, setIsAddDocumentTypeSheetOpen] = useState(false);
  const { data: existingTags = [] } = useExistingTags(companyId);

  // Get company date format
  const { formatDate, dateFormat } = useCompanyDateFormat(companyId);

  // Handler for when a new document type is added
  const handleDocumentTypeAdded = async (documentTypeName: string) => {
    await refetchDocumentTypes();
    setSelectedDocumentType(documentTypeName);
  };

  // Handler for when a document type is deleted
  const handleDocumentTypeDeleted = async () => {
    // Refresh the document types list
    await refetchDocumentTypes();
    // Clear selection if the deleted type was selected
    const currentTypes = documentTypes;
    if (!currentTypes.includes(selectedDocumentType)) {
      setSelectedDocumentType("");
    }
  };

  const computeHasChanges = () => {
    const originalReviewerIds = document.reviewer_group_ids
      ? [...document.reviewer_group_ids].sort()
      : document.reviewer_group_id
      ? [document.reviewer_group_id]
      : [];

    const currentReviewerIds = [...reviewerGroupIds].sort();

    const initialDeadline = document.deadline || document.due_date || document.dueDate;
    const originalDueDate = initialDeadline ? new Date(initialDeadline) : undefined;

    return (
      name.trim() !== document.name ||
      (description || "") !== (document.description || "") ||
      status !== mapBackendStatusToFrontend(document.status) ||
      JSON.stringify(originalReviewerIds) !== JSON.stringify(currentReviewerIds) ||
      (!!originalDueDate && !!dueDate && originalDueDate.toISOString().split("T")[0] !== dueDate.toISOString().split("T")[0]) ||
      (!!originalDueDate !== !!dueDate) || // one exists, the other doesn't
      selectedFile !== null ||             // new file uploaded
      (filePath === undefined && (document.file_path || document.filePath)) || // file removed
      (filePath && filePath !== (document.file_path || document.filePath))     // file replaced
    );
  };

  // Debug reviewer groups loading
 

  // Get phase timeline information for this document
  const phaseTimeline = useDocumentPhaseTimeline(productId, companyId, document.phase_id || document.phaseId);

  // Create appropriate service based on document type
  const documentService = documentType === 'product-specific'
    ? new ProductSpecificDocumentService(productId, companyId)
    : new TemplateInstanceDocumentService(productId, companyId);

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

  // Reset state when dialog opens with new document
  useEffect(() => {
    if (open && document) {
      setName(document.name);
      setDescription(document.description || "");
      setSelectedDocumentType(document.document_type || "");
      // Pre-select __CORE__ if phase_id matches "No Phase"
      const docPhaseId = document.phase_id || document.phaseId || "";
      const isNoPhase = noPhaseEntry && docPhaseId === noPhaseEntry.id;
      setPhaseId(isNoPhase ? '__CORE__' : docPhaseId);
      setSection(document.sub_section || "");
      setSectionId(
        document.section_ids && Array.isArray(document.section_ids) && document.section_ids.length > 0
          ? document.section_ids[0]
          : ""
      );
      setDocumentReference(document.document_reference || "");
      setTags(document.tags && Array.isArray(document.tags) ? document.tags : []);
      setTagInput("");
      setVersion(document.version || "");
      setDate(document.date || "");
      setIsCurrentEffectiveVersion(document.is_current_effective_version || false);
      setAuthorsIds(
        document.authors_ids && Array.isArray(document.authors_ids)
          ? document.authors_ids
          : []
      );
      setNeedTemplateUpdate(document.need_template_update || false);
      setIsRecord(document.is_record || false);
      setReferenceDocumentIds(
        document.reference_document_ids && Array.isArray(document.reference_document_ids)
          ? document.reference_document_ids
          : []
      );
      setIsRefDocPickerOpen(false);
      setStatus(mapBackendStatusToFrontend(document.status));
      setFilePath(document.file_path || document.filePath);
      setSelectedFile(null);
      setFileUploadInProgress(false);
      setIsConvertingDoc(false);

      const initialReviewerGroupIds = document.reviewer_group_ids && Array.isArray(document.reviewer_group_ids)
        ? document.reviewer_group_ids
        : document.reviewer_group_id
          ? [document.reviewer_group_id]
          : document.reviewerGroupId
            ? [document.reviewerGroupId]
            : [];
      // console.log('[EditDocumentDialog] Setting reviewer group IDs:', initialReviewerGroupIds);
      setReviewerGroupIds(initialReviewerGroupIds);

      // Handle date fields - check all possible field names
      const documentDeadline = document.deadline || document.due_date || document.dueDate;
      let parsedDate: Date | undefined;

      if (documentDeadline) {
        // Handle different date formats
        if (typeof documentDeadline === 'string') {
          // If it's already in YYYY-MM-DD format, create date directly
          if (/^\d{4}-\d{2}-\d{2}$/.test(documentDeadline)) {
            parsedDate = new Date(documentDeadline + 'T00:00:00');
          } else {
            parsedDate = new Date(documentDeadline);
          }
        } else {
          parsedDate = new Date(documentDeadline);
        }

        // Check if the date is valid
        if (parsedDate && isNaN(parsedDate.getTime())) {
          console.warn('[EditDocumentDialog] Invalid date:', documentDeadline);
          parsedDate = undefined;
        }
      }

      // console.log('[EditDocumentDialog] Parsed due date:', parsedDate);
      setDueDate(parsedDate);
    }
  }, [open, document, activePhases]);

  // Auto-fix phase ID issue for "Concept Brief" when timeline is not available
  useEffect(() => {
    if (open && document && document.name === 'Concept Brief' && !phaseTimeline.hasTimeline) {
      // console.log('[EditDocumentDialog] Detected Concept Brief with no timeline, attempting auto-fix');

      const autoFixPhaseId = async () => {
        const success = await DocumentPhaseFixService.fixConceptBriefPhaseId(productId, companyId);
        if (success) {
          // Refresh phases to get updated data
          await fetchPhases();
          toast.success('Automatically fixed Concept Brief phase assignment');
        }
      };

      autoFixPhaseId();
    }
  }, [open, document, phaseTimeline.hasTimeline, productId, companyId, fetchPhases]);

  const sendReviewerGroupNotification = async (groupIds: string[], documentName: string, dueDate: string | null) => {
    try {
      // console.log('[EditDocumentDialog] Starting reviewer group notifications for:', { groupIds, documentName, dueDate });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[EditDocumentDialog] No authenticated user found');
        return;
      }

      const notificationService = new ReviewerNotificationService();
      const cleanDocumentId = document.id.startsWith('template-')
        ? document.id.replace('template-', '')
        : document.id;

      // Send notifications to all selected reviewer groups
      for (const groupId of groupIds) {
        // Get reviewer group details
        const { data: groupData, error: groupError } = await supabase
          .from('reviewer_groups')
          .select('name, company_id')
          .eq('id', groupId)
          .single();

        if (groupError || !groupData) {
          console.error('Error fetching reviewer group for notification:', groupError);
          continue;
        }

        await notificationService.notifyReviewerGroupAssignment({
          documentName,
          documentId: cleanDocumentId,
          reviewerGroupId: groupId,
          reviewerGroupName: groupData.name,
          companyId: groupData.company_id,
          dueDate,
          assignedBy: user.id
        });
      }

      // console.log('Email notifications sent for document assignment to all groups');
    } catch (error) {
      console.error('Error sending reviewer group notifications:', error);
      // Don't show error to user as this shouldn't block the document update
    }
  };

  const handleFileChange = async (file: File | null, uploadPath?: string) => {
    // console.log('File change event:', { file: file?.name, uploadPath, hasPath: !!uploadPath });

    if (file && !uploadPath) {
      // Upload started but not completed yet
      setFileUploadInProgress(true);
      setSelectedFile(file);

      // For DOC/DOCX files: upload original DOCX + convert and upload PDF copy
      const isConvertibleDoc = DocToPdfConverterService.isConvertibleDoc(file.name, file.type);
      if (isConvertibleDoc) {
        try {
          setIsConvertingDoc(true);
          const timestamp = Date.now();
          const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

          // 1. Upload original DOCX (stored in file_path for OnlyOffice editing)
          const docxFilePath = `documents/${timestamp}_${cleanFileName}`;
          const uploadedDocxPath = await uploadFileToStorage(file, docxFilePath);
          setFilePath(uploadedDocxPath);

          // 2. Convert to PDF and upload (stored in public_url for viewing/review)
          const pdfBlob = await DocToPdfConverterService.convertDocxToPdf(file, {
            fileName: file.name
          });
          if (pdfBlob) {
            const pdfFileName = cleanFileName.replace(/\.(doc|docx)$/i, '.pdf');
            const pdfFilePath = `documents/${timestamp}_${pdfFileName}`;
            const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });
            const uploadedPdfPath = await uploadFileToStorage(pdfFile, pdfFilePath);
            setPdfPath(uploadedPdfPath);
          }

          setFileUploadInProgress(false);
          setIsConvertingDoc(false);
        } catch (error) {
          console.error('Error during file upload/conversion:', error);
          setIsConvertingDoc(false);
          setFileUploadInProgress(false);
          // DOCX upload may have succeeded even if PDF conversion failed — keep going
          if (!filePath) {
            setSelectedFile(null);
            setFilePath(undefined);
            setPdfPath(undefined);
            toast.error(error instanceof Error ? error.message : 'Failed to upload document');
          }
        }
      }
    } else if (file && uploadPath) {
      // Upload completed successfully (for non-DOC files like PDF)
      setFileUploadInProgress(false);
      setSelectedFile(file);
      setFilePath(uploadPath);
    } else if (file === null) {
      // File removed or upload failed
      setFileUploadInProgress(false);
      setIsConvertingDoc(false);
      setSelectedFile(null);
      setFilePath(undefined);
      setPdfPath(undefined);

      // Don't automatically call onDocumentUpdated on file removal
      // Let the user manually save the changes instead
    }
  };

  const handleSubmit = async () => {
    // Prevent submission if file upload is in progress

    if (fileUploadInProgress) {
      toast.error("Please wait for file upload to complete before saving.");
      return;
    }

    // Validate required fields
    if (!name.trim()) {
      toast.error("Document name is required.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Create any pending authors first
      let finalAuthorIds = [...authorsIds];
      if (pendingAuthors.length > 0) {
        // console.log('[EditDocumentDialog] Creating pending authors:', pendingAuthors);
        const tempToRealIdMap = await createPendingAuthors(pendingAuthors, companyId);

        // Replace temp IDs with real IDs
        finalAuthorIds = finalAuthorIds.map(id => {
          const realId = tempToRealIdMap.get(id);
          return realId || id;
        });
        // console.log('[EditDocumentDialog] Final author IDs:', finalAuthorIds);
      }

      // Check if this is a "No Phase" document being assigned to a phase
      // If so, migrate it from documents table to phase_assigned_document_template
      const originalPhaseId = document.phase_id || document.phaseId;
      const isNoPhaseDocument = !originalPhaseId || originalPhaseId === '';
      const isAssigningPhase = phaseId && phaseId !== '' && phaseId !== '__CORE__';

      if (isNoPhaseDocument && isAssigningPhase && documentType === 'product-specific') {
        // Format due date for database
        const formatDueDateForMigration = (date: Date | undefined): string | null => {
          if (!date) return null;
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        // Pass all edited values to the migration function
        const migrationResult = await DocumentCreationService.migrateDocumentToPhase(document.id, phaseId, {
          name: name.trim(),
          description: description.trim(),
          status: status,
          due_date: formatDueDateForMigration(dueDate),
          sub_section: section.trim() || null,
          section_ids: sectionId ? [sectionId] : null,
          document_reference: documentReference.trim() || null,
          version: version.trim() || null,
          is_current_effective_version: isCurrentEffectiveVersion,
          authors_ids: finalAuthorIds.length > 0 ? finalAuthorIds : null,
          reviewer_group_ids: reviewerGroupIds.length > 0 ? reviewerGroupIds : null,
          need_template_update: needTemplateUpdate,
          is_record: isRecord,
          reference_document_ids: referenceDocumentIds.length > 0 ? referenceDocumentIds : null
        });

        if (migrationResult.success) {
          // console.log('[EditDocumentDialog] Migration successful, new document ID:', migrationResult.newDocumentId);

          // Create updated document object with new ID
          const migratedDocument = {
            ...document,
            id: migrationResult.newDocumentId,
            phase_id: phaseId,
            name: name.trim(),
            description: description.trim(),
            status: status,
            due_date: formatDueDateForMigration(dueDate),
            sub_section: section.trim() || null,
            section_ids: sectionId ? [sectionId] : null,
            document_reference: documentReference.trim() || null,
            version: version.trim() || null,
            is_current_effective_version: isCurrentEffectiveVersion,
            authors_ids: finalAuthorIds.length > 0 ? finalAuthorIds : null,
            reviewer_group_ids: reviewerGroupIds.length > 0 ? reviewerGroupIds : null,
            need_template_update: needTemplateUpdate,
            is_record: isRecord,
            updated_at: new Date().toISOString()
          };

          onDocumentUpdated(migratedDocument);
          handleRefreshData();
          toast.success("Document moved to phase successfully");
          onOpenChange(false);
          return;
        } else {
          toast.error(migrationResult.error || 'Failed to migrate document to phase');
          setIsSubmitting(false);
          return;
        }
      }

      // Map frontend status to backend status
      const mapFrontendStatusToBackend = (frontendStatus: string) => {
        const statusMap: { [key: string]: string } = {
          "Not Started": "Not Started",
          "In Review": "In Review",
          "Approved": "Approved",
          "Report": "Report",
          "Rejected": "Rejected",
          "N/A": "Not Required"
        };

        return statusMap[frontendStatus] || "Not Started";
      };

      // Format due date as local date (YYYY-MM-DD) to avoid timezone issues
      const formatDueDateForDB = (date: Date | undefined): string | null => {
        if (!date) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const formattedDueDate = formatDueDateForDB(dueDate);

      // Check if reviewer group assignment changed
      const currentReviewerGroups = document.reviewer_group_ids || (document.reviewer_group_id ? [document.reviewer_group_id] : []);
      const reviewerGroupChanged = JSON.stringify(currentReviewerGroups.sort()) !== JSON.stringify(reviewerGroupIds.sort());

      // Determine the correct status - only change to "In Review" if reviewer groups are being assigned
      let finalStatus = status;
      if (reviewerGroupChanged && reviewerGroupIds.length > 0) {
        // Reviewer groups are being assigned - set status to "In Review"
        finalStatus = "In Review";
        // console.log('[EditDocumentDialog] Reviewer groups assigned, changing status to "In Review"');
      }

      const backendStatus = mapFrontendStatusToBackend(finalStatus);

      // Get clean document ID for review workflow
      const cleanDocumentId = document.id.startsWith('template-')
        ? document.id.replace('template-', '')
        : document.id;


      // Prepare update data with file information
      const updateData: any = {
        name: name.trim(),
        description: description.trim(),
        document_type: selectedDocumentType || null,
        status: backendStatus,
        due_date: formattedDueDate,
        reviewers: document.reviewers || null,
        phase_id: phaseId === '__CORE__' ? (noPhaseEntry?.id || null) : (phaseId || null),
        sub_section: section.trim() || null,
        section_ids: sectionId ? [sectionId] : null,
        document_reference: documentReference.trim() || null,
        tags: tags,
        version: version.trim() || null,
        date: date || null,
        is_current_effective_version: isCurrentEffectiveVersion,
        authors_ids: finalAuthorIds.length > 0 ? finalAuthorIds : null, // New multi-author field
        need_template_update: needTemplateUpdate,
        is_record: isRecord,
        reference_document_ids: referenceDocumentIds.length > 0 ? referenceDocumentIds : [],
      };

      // Set approval_date when status changes to Approved
      if (backendStatus.toLowerCase() === 'approved') {
        updateData.approval_date = new Date().toISOString();
      }

      // Handle reviewer group assignment - always use reviewer_group_ids array for consistency
      updateData.reviewer_group_ids = reviewerGroupIds || [];
      // console.log('[EditDocumentDialog] Setting reviewer_group_ids:', reviewerGroupIds);

      // Get detailed reviewer group data for the reviewers field
      const selectedReviewerGroups = reviewerGroups.filter(group => reviewerGroupIds.includes(group.id));
      // console.log('[EditDocumentDialog] Selected reviewer groups with details:', selectedReviewerGroups);

      // Store the detailed reviewer group data in the reviewers field
      updateData.reviewers = selectedReviewerGroups.length > 0 ? selectedReviewerGroups : null;

      // Add file information if there's a new file or keep existing file data
      if (selectedFile && filePath) {
        // file_path = original DOCX (for OnlyOffice editing)
        // public_url = converted PDF (for viewing/review)
        updateData.file_path = filePath;
        updateData.file_name = selectedFile.name;
        updateData.file_size = selectedFile.size;
        updateData.file_type = selectedFile.type;
        if (pdfPath) {
          updateData.public_url = pdfPath;
        }

        const { data: { user } } = await supabase.auth.getUser();
        updateData.uploaded_at = new Date().toISOString();
        updateData.uploaded_by = user?.id;
      } else if (!selectedFile && filePath === undefined) {
        // File was explicitly removed - clear all file fields
        updateData.file_path = null;
        updateData.file_name = null;
        updateData.file_size = null;
        updateData.file_type = null;
        updateData.public_url = null;
        updateData.uploaded_at = null;
        updateData.uploaded_by = null;
      }
      // If selectedFile is null but filePath exists, keep existing file (no change to file fields)

      const previousReviewerGroupIds = currentReviewerGroups;

      // Update the document using the existing documentService instance (created at component level)
      const success = await documentService.updateDocument(document.id, updateData);

      if (success) {
        // Create updated document object for parent component
        const updatedDocument = {
          ...document,
          name: name.trim(),
          description: description.trim(),
          status: backendStatus, // This is now properly mapped to backend format
          due_date: formattedDueDate,
          deadline: formattedDueDate, // Ensure deadline field is available for UI
          reviewer_group_ids: reviewerGroupIds, // Always use array format
          authors_ids: authorsIds.length > 0 ? authorsIds : null, // Multi-author field
          is_record: isRecord,
          updated_at: new Date().toISOString(),
          approval_date: updateData.approval_date || document.approval_date || null, // Include approval_date
          file_path: filePath || null,
          reviewers: updateData.reviewers, // Use the detailed reviewer group data
          file_name: selectedFile?.name || (filePath ? document.file_name : null),
          file_size: selectedFile?.size || (filePath ? document.file_size : null),
          file_type: selectedFile?.type || (filePath ? document.file_type : null),
          uploaded_at: selectedFile ? new Date().toISOString() : (filePath ? document.uploaded_at : null),
          uploaded_by: selectedFile ? updateData.uploaded_by : (filePath ? document.uploaded_by : null)
        };

        // console.log('[EditDocumentDialog] Updated document object:', updatedDocument);
        // console.log('Document updated successfully, calling parent callback');

        // Notify parent component FIRST with updated data
        onDocumentUpdated(updatedDocument);

        // Then refresh data to ensure consistency
        handleRefreshData();

        // Create review workflow if reviewer groups are assigned
        if (reviewerGroupChanged && reviewerGroupIds.length > 0) {
          // console.log('[EditDocumentDialog] Creating review workflow for reviewer groups:', reviewerGroupIds);

          try {
            // Check if workflow already exists
            const { data: existingWorkflow } = await supabase
              .from('review_workflows')
              .select('id')
              .eq('record_type', 'document')
              .eq('record_id', cleanDocumentId)
              .maybeSingle();

            let workflowId: string | null = existingWorkflow?.id || null;

            if (!workflowId) {
              // Create new workflow
              const { data: newWorkflow, error: workflowError } = await supabase
                .from('review_workflows')
                .insert({
                  record_type: 'document',
                  record_id: cleanDocumentId,
                  workflow_name: `Review - ${name.trim()}`,
                  workflow_description: `Review workflow for ${name.trim()}`,
                  total_stages: 1,
                  current_stage: 1,
                  overall_status: 'in_review',
                  priority: 'medium',
                  due_date: formattedDueDate,
                  metadata: {}
                })
                .select()
                .single();

              if (workflowError) throw workflowError;
              workflowId = newWorkflow.id;

              // Create stage with group-based approval requirements
              const { error: stageError } = await supabase
                .from('review_workflow_stages')
                .insert({
                  workflow_id: workflowId,
                  stage_number: 1,
                  stage_name: 'Review',
                  required_approvals: Math.max(1, reviewerGroupIds.length),
                  approval_threshold: 1.0,
                  is_parallel: true,
                  auto_advance: true
                });

              if (stageError) throw stageError;
            }
            const cleanWorkflowDocumentId = document.id.startsWith('template-')
              ? document.id.replace('template-', '')
              : document.id;
            // Create assignments in the new document_review_assignments table
            const { data: existingAssignments } = await supabase
              .from('document_review_assignments')
              .select('reviewer_group_id')
              .eq('document_id', cleanWorkflowDocumentId)
              .eq('company_id', companyId);

            const existingGroupIds = (existingAssignments || []).map(a => a.reviewer_group_id);
            const missingGroupIds = reviewerGroupIds.filter(id => !existingGroupIds.includes(id));

            if (missingGroupIds.length > 0) {
              const { error: insertAssignmentsError } = await supabase
                .from('document_review_assignments')
                .insert(
                  missingGroupIds.map((gid) => ({
                    company_id: companyId,
                    document_id: cleanWorkflowDocumentId,
                    reviewer_group_id: gid,
                    status: 'pending',
                    due_date: formattedDueDate
                  }))
                );
              if (insertAssignmentsError) throw insertAssignmentsError;
            }

            // console.log('[EditDocumentDialog] Review workflow created/updated successfully');
          } catch (error) {
            console.error('[EditDocumentDialog] Error creating review workflow:', error);
            toast.error('Document updated but failed to create review workflow');
          }

          // Send notifications
          await sendReviewerGroupNotification(reviewerGroupIds, name.trim(), formattedDueDate);

          // Also create in-app notification for document assignment
          const { NotificationService } = await import('@/services/notificationService');
          const notificationService = new NotificationService();
          await notificationService.addNotification({
            title: 'Document Assigned for Review',
            message: `"${name.trim()}" has been assigned to your reviewer group`,
            type: 'document_assigned',
            company_id: companyId,
            document_id: document.id,
            document_name: name.trim(),
            is_read: false,
          });
        }

        // Show success message
        toast.success("Document updated successfully");
        // Close dialog
        onOpenChange(false);

      } else {
        throw new Error('Update operation returned false');
      }
    } catch (error) {
      console.error("Error updating document:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update document");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if document is automatically overdue
  const isDocumentOverdue = () => {
    if (!dueDate) return false;
    const now = new Date();
    return dueDate < now;
  };

  // Create the due date label with phase timeline information
  const getDueDateLabel = () => {
    if (phaseTimeline.hasTimeline) {
      return `Due Date (${phaseTimeline.phaseName}: ${phaseTimeline.phaseStartDate ? formatDate(phaseTimeline.phaseStartDate) : ''} - ${phaseTimeline.phaseEndDate ? formatDate(phaseTimeline.phaseEndDate) : ''})`;
    } else {
      return `Due Date (Phase timeline not set - please define phase timeline)`;
    }
  };

  // Prepare current file data for the upload component
  const currentFile = (() => {
    if (filePath === undefined) {
      return undefined;
    }

    if (filePath && selectedFile) {
      return {
        name: selectedFile.name,
        path: filePath,
        size: selectedFile.size,
        type: selectedFile.type,
        uploadedAt: new Date().toISOString()
      };
    }

    if (document && (document.file_path || document.filePath || document.file_name || document.fileName)) {
      return {
        name: document.file_name || document.fileName || 'Unknown file',
        path: document.file_path || document.filePath || '',
        size: document.file_size || document.fileSize,
        type: document.file_type || document.fileType,
        uploadedAt: document.uploaded_at || document.uploadedAt
      };
    }

    return undefined;
  })();

  // Check if we can save (no upload in progress and required fields filled)
  const canSave = !fileUploadInProgress && !isSubmitting && name.trim().length > 0;

  // Helper function to format date for input field (avoid timezone issues)
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
          <Typography variant="h6">
            {lang('document.edit')} {documentType === 'template-instance' ? lang('document.templateInstance') : lang('document.productDocument')}
          </Typography>
            <FormControl size="small" disabled={isSubmitting} sx={{ minWidth: 140 }}>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
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
          <FormControl component="fieldset" disabled={isSubmitting} sx={{ ml: 2 }}>
            <RadioGroup
              row
              value={isRecord ? 'report' : 'document'}
              onChange={(e) => {
                const isReportSelected = e.target.value === 'report';
                setIsRecord(isReportSelected);
                // Automatically set status to "Report" when report is selected
                if (isReportSelected) {
                  setStatus('Report');
                }
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert
            severity="info"
            sx={{
              backgroundColor: documentType === 'product-specific' ? 'purple.50' : 'blue.50',
              borderColor: documentType === 'product-specific' ? 'purple.200' : 'blue.200',
              color: documentType === 'product-specific' ? 'purple.800' : 'blue.800',
              '& .MuiAlert-icon': {
                color: documentType === 'product-specific' ? 'purple.600' : 'blue.600'
              }
            }}
          >
            <Typography variant="body2" fontWeight="medium">
              {documentType === 'product-specific'
                ? lang('document.productSpecificDocument')
                : lang('document.templateBasedInstance')}
            </Typography>
            <Typography variant="body2" fontSize="0.875rem">
              {documentType === 'product-specific'
                ? lang('document.productSpecificDocumentDescription')
                : lang('document.templateBasedInstanceDescription')}
            </Typography>
          </Alert>

          <TextField
            fullWidth
            label={lang('document.documentReference')}
            value={documentReference}
            onChange={(e) => setDocumentReference(e.target.value)}
            placeholder={lang('document.documentReferencePlaceholder')}
            disabled={isSubmitting}
            variant="outlined"
          />

          <TextField
            fullWidth
            label={lang('document.documentNameRequired')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={lang('document.enterDocumentName')}
            error={!name.trim()}
            helperText={!name.trim() ? lang('document.documentNameIsRequired') : ""}
            disabled={isSubmitting}
            variant="outlined"
          />

          {/* Description — moved up per Task 3 */}
          <TextField
            fullWidth
            label={lang('document.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={lang('document.descriptionPlaceholder')}
            multiline
            rows={4}
            disabled={isSubmitting}
            variant="outlined"
          />

          {/* File Upload — moved up per Task 3 */}
          <DocumentFileUpload
            currentFile={currentFile}
            onFileChange={handleFileChange}
            disabled={isSubmitting}
          />

          {fileUploadInProgress && (
            <Alert severity="info">
              {isConvertingDoc
                ? lang('document.convertingDocToPdf')
                : lang('document.fileUploadInProgress')}
            </Alert>
          )}

          <TextField
            fullWidth
            label={lang('document.version')}
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder={lang('document.versionPlaceholder')}
            disabled={isSubmitting}
            variant="outlined"
          />

          {/* Phase Selection */}
          <FormControl fullWidth disabled={isSubmitting || loadingPhases}>
            <InputLabel id="edit-phase-select-label" shrink={true}>Core / Phase</InputLabel>
            <Select
              labelId="edit-phase-select-label"
              value={phaseId || ""}
              label="Core / Phase"
              onChange={(e) => { setPhaseId(e.target.value); setSection(''); setSectionId(''); }}
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
          {phaseId && phaseId !== '__CORE__' && phaseId !== '' && (
            <Box>
              <SectionSelector
                value={section || ''}
                onChange={(value, id) => {
                  setSection(value);
                  setSectionId(id || '');
                }}
                companyId={companyId}
                phaseId={phaseId}
                disabled={isSubmitting}
                label={lang('document.section')}
                placeholder={lang('document.selectOrCreateSection')}
              />
            </Box>
          )}

          {/* Reference Documents Linking */}
          <FormControl fullWidth variant="outlined" disabled={isSubmitting}>
            <InputLabel shrink sx={{ background: 'white', px: 0.5 }}>Reference Documents</InputLabel>
            <Box sx={{
              border: '1px solid',
              borderColor: 'rgba(0, 0, 0, 0.23)',
              borderRadius: '4px',
              p: 2,
              pt: 1.5,
              mt: '8px',
              minHeight: '56px',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
              '&:hover': { borderColor: 'rgba(0, 0, 0, 0.87)' },
            }}>
              {referenceDocumentIds.length > 0 ? (
                referenceDocumentIds.map((id) => {
                  const doc = refDocuments.find((d) => d.id === id);
                  return (
                    <Chip
                      key={id}
                      label={doc?.file_name || id.slice(0, 8)}
                      size="small"
                      onDelete={() => setReferenceDocumentIds((prev) => prev.filter((x) => x !== id))}
                      disabled={isSubmitting}
                    />
                  );
                })
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                  No reference documents linked
                </Typography>
              )}
              <Button
                variant="outlined"
                size="small"
                onClick={() => setIsRefDocPickerOpen(true)}
                disabled={isSubmitting}
                sx={{ ml: 'auto', flexShrink: 0 }}
              >
                Select
              </Button>
            </Box>
          </FormControl>

          {/* Tags */}
          <FormControl fullWidth disabled={isSubmitting}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Tags
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  onDelete={() => setTags(prev => prev.filter(t => t !== tag))}
                  disabled={isSubmitting}
                />
              ))}
            </Box>
            <TextField
              fullWidth
              size="small"
              placeholder="Type a tag and press Enter..."
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
              disabled={isSubmitting}
              variant="outlined"
            />
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
                        disabled={isSubmitting}
                        sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                      />
                    ))}
                  </Box>
                </Box>
              );
            })()}
          </FormControl>

          {/* Document Type */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <FormControl fullWidth disabled={isSubmitting || isLoadingDocTypes} sx={{ flex: 1 }}>
              <InputLabel id="edit-document-type-select-label">{lang('document.documentType')}</InputLabel>
              <Select
                labelId="edit-document-type-select-label"
                value={selectedDocumentType}
                label={lang('document.documentType')}
                onChange={(e) => setSelectedDocumentType(e.target.value)}
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
                disabled={isSubmitting || isLoadingDocTypes}
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
          <FormControl fullWidth disabled={isSubmitting}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {lang('document.date')}
            </Typography>
            <Box sx={{ border: '1px solid #e0e0e0', padding: '10px', borderRadius: '4px' }}>
              <input
                type="date"
                value={date || ''}
                onChange={(e) => setDate(e.target.value)}
                disabled={isSubmitting}
                style={{ width: '100%', border: 'none', outline: 'none' }}
              />
            </Box>
            {date && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {lang('document.displayFormat')}: {formatDate(date)}
              </Typography>
            )}
          </FormControl>

          {/* Due Date Section */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {getDueDateLabel()}
            </Typography>

            <FormControl fullWidth disabled={isSubmitting} sx={{ width: '100%', border: '1px solid #e0e0e0', padding: '10px', borderRadius: '4px' }}>
             <input
                type="date"
                value={dueDate ? formatDateForInput(dueDate) : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setDueDate(val ? new Date(val + 'T00:00:00') : undefined);
                }}
                disabled={isSubmitting}
                style={{ width: '100%', border: 'none', outline: 'none' }}
              />
            </FormControl>
            {dueDate && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {lang('document.displayFormat')}: {formatDate(dueDate)} <Button
                  type="button"
                  variant="text"
                  size="small"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDueDate(undefined);
                  }}
                  sx={{ ml: 1, minWidth: 'auto', p: 0, textTransform: 'uppercase', fontSize: '0.75rem' }}
                >
                  {lang('document.clearDate')}
                </Button>
              </Typography>
            )}
          </Box>

          {isDocumentOverdue() && (
            <Alert severity="warning">
              {lang('document.documentOverdue')}
            </Alert>
          )}

          {/* Current Effective Version */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e0e0e0', borderRadius: '4px', p: 2, mb: 2 }}>
            <Typography variant="body2">{lang('document.currentEffectiveVersion')}</Typography>
            <input
              type="checkbox"
              checked={isCurrentEffectiveVersion}
              onChange={(e) => setIsCurrentEffectiveVersion(e.target.checked)}
              disabled={isSubmitting}
              style={{ width: '20px', height: '20px' }}
            />
          </Box>

          {/* Authors */}
          <Box>
            <MultiAuthorSelector
              value={authorsIds}
              onChange={setAuthorsIds}
              companyId={companyId}
              disabled={isSubmitting}
              deferCreation={true}
              onPendingAuthorsChange={setPendingAuthors}
            />
          </Box>

          {/* Need Template Update */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e0e0e0', borderRadius: '4px', p: 2 }}>
            <Typography variant="body2">{lang('document.needTemplateUpdate')}</Typography>
            <input
              type="checkbox"
              checked={needTemplateUpdate}
              onChange={(e) => setNeedTemplateUpdate(e.target.checked)}
              disabled={isSubmitting}
              style={{ width: '20px', height: '20px' }}
            />
          </Box>

          {/* Reviewer Group Selection */}
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
          <FormControl fullWidth disabled={isSubmitting || isLoadingGroups}>
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
                    zIndex: 1400, // Higher than dialog z-index
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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Box>
          {isFromGanttChart && document?.id && (
            <Button
              onClick={() => {
                onOpenChange(false);
                const docName = document.name || '';
                navigate(`/app/product/${productId}/documents?filter=${encodeURIComponent(docName)}`);
              }}
              variant="outlined"
              color="primary"
            >
              Go to Document CI
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            color="inherit"
          >
            {lang('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSave}
            variant="contained"
            sx={{
              backgroundColor: '#000',
              color: '#fff',
              '&:hover': {
                backgroundColor: '#000',
              },
              '&:disabled': {
                opacity: 0.5,
                cursor: 'not-allowed'
              }
            }}
          >
            {isSubmitting ? lang('document.saving') : lang('document.saveChanges')}
          </Button>
        </Box>
      </Box>

      {/* Reference Document Picker */}
      <ReferenceDocumentPicker
        open={isRefDocPickerOpen}
        onOpenChange={setIsRefDocPickerOpen}
        companyId={companyId}
        selectedIds={referenceDocumentIds}
        onConfirm={setReferenceDocumentIds}
      />

      {/* Add Document Type Sheet */}
      <AddDocumentTypeSheet
        open={isAddDocumentTypeSheetOpen}
        onOpenChange={setIsAddDocumentTypeSheetOpen}
        companyId={companyId}
        onDocumentTypeAdded={handleDocumentTypeAdded}
        onDocumentTypeDeleted={handleDocumentTypeDeleted}
      />
    </Drawer>
  );
}
