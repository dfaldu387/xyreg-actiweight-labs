import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Download,
  File,
  MessageSquare,
  Maximize2,
  Minimize2,
  AlertCircle,
  Highlighter,
  Square,
  Type,
  PenTool,
} from "lucide-react";
import { UniversalReviewManager } from "@/components/review/UniversalReviewManager";
import { DocumentRichContentView } from "@/components/documents/DocumentRichContentView";
import { toast } from "sonner";
import { useConfirm } from '@/components/ui/confirm-dialog';
import { supabase } from "@/integrations/supabase/client";
import type { CommentThread } from "@/types/comments";
import { DocumentStatusDropdown } from "../ui/document-status-dropdown";
import { DocumentAuditLogDialog } from "./DocumentAuditLogDialog";
import {
  AnnotationService,
  AnnotationData,
} from "@/services/annotationService";
import { AnnotationMapperService } from "@/services/annotationMapperService";
import { useAuth } from "@/context/AuthContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useDocumentReviewAssignments } from "@/hooks/useDocumentReviewAssignments";
import { LoadingSpinner } from "../ui/loading-spinner";
import { AnnotationSidebar } from "./AnnotationSidebar";
import { DocToPdfConverterService } from "@/services/docToPdfConverterService";
import { ESignPopup } from "@/components/esign/ESignPopup";

// React PDF imports for viewing
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Configure PDF.js worker - use unpkg CDN matching installed pdfjs-dist version
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Extended highlight interface for sidebar
interface ExtendedHighlight {
  id: string;
  pageNumber: number;
  annotationType: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  content: string;
  comment?: { text: string; emoji?: string };
  userName?: string;
  color?: string;
  createdAt?: string;
  // Store normalized coordinates for recalculation
  normalizedPosition?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface DocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string | null;
  documentName?: string;
  companyId?: string;
  companyRole: string;
  reviewerGroupId: string;
  documentFile?: {
    path: string;
    name: string;
    size?: number;
    type?: string;
    uploadedAt?: string;
  } | null;
  onStatusChanged?: (documentId: string, newStatus: string) => void;
  documentReference?: string;
}

type ViewMode =
  | "split"
  | "document-only"
  | "comments-only"
  | "reviews-only"
  | "document-reviews"
  | "comments-reviews";

export function DocumentViewer({
  open,
  onOpenChange,
  documentId,
  documentName = "Document",
  companyId,
  documentFile = null,
  companyRole,
  reviewerGroupId,
  onStatusChanged,
  documentReference,
}: DocumentViewerProps) {
  const confirmAction = useConfirm();
  const [viewMode, setViewMode] = useState<ViewMode>("document-only");
  const [showFormattedView, setShowFormattedView] = useState(false);
  const [activeRightPanel, setActiveRightPanel] = useState<"comments" | "reviews">("reviews");
  const [existingComments, setExistingComments] = useState<CommentThread[]>([]);
  const [documentStatus, setDocumentStatus] = useState<string>("Not Started");
  const [auditLogDialogOpen, setAuditLogDialogOpen] = useState(false);
  const [showAnnotationSidebar, setShowAnnotationSidebar] = useState(false);
  const [closeStatusDialogOpen, setCloseStatusDialogOpen] = useState(false);
  const [showESign, setShowESign] = useState(false);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editHighlight, setEditHighlight] = useState<ExtendedHighlight | null>(null);
  const [editText, setEditText] = useState("");

  // Note dialog state
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState("");

  // PDF state
  const [highlights, setHighlights] = useState<ExtendedHighlight[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isConvertingDoc, setIsConvertingDoc] = useState(false);
  const [convertedPdfBlobUrl, setConvertedPdfBlobUrl] = useState<string | null>(null);
  const [isViewerReady, setIsViewerReady] = useState(false);

  // React PDF state
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number } | null>(null);
  
  // Annotation state - Extended with all annotation types
  const [annotationMode, setAnnotationMode] = useState<
    "none" | "highlight" | "comment" | "rectangle" | "freetext"
  >("highlight");
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentPosition, setCommentPosition] = useState<{ x: number; y: number } | null>(null);

  // Shape drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawEnd, setDrawEnd] = useState<{ x: number; y: number } | null>(null);

  // FreeText state
  const [freeTextDialogOpen, setFreeTextDialogOpen] = useState(false);
  const [freeTextContent, setFreeTextContent] = useState("");
  const [freeTextPosition, setFreeTextPosition] = useState<{ x: number; y: number } | null>(null);

  // Annotation toolbar expanded state
  const [toolbarExpanded, setToolbarExpanded] = useState(false);

  // Active/highlighted annotation for visual feedback
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);

  // Dragging state for moving rectangles
  const [draggingAnnotation, setDraggingAnnotation] = useState<{
    id: string;
    startX: number;
    startY: number;
    originalX: number;
    originalY: number;
  } | null>(null);

  // Ref for smooth drag offset (avoids state updates during drag)
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Text selection popup state
  const [selectionPopup, setSelectionPopup] = useState<{
    show: boolean;
    x: number;
    y: number;
    selectedText: string;
    normalizedPosition: { x: number; y: number; width: number; height: number };
  } | null>(null);
  const [selectionComment, setSelectionComment] = useState("");

  // Highlight color options
  const highlightColors = [
    { name: "Yellow", value: "rgba(255, 235, 59, 0.4)", border: "#FDD835", bg: "bg-yellow-400" },
    { name: "Green", value: "rgba(76, 175, 80, 0.4)", border: "#4CAF50", bg: "bg-green-500" },
    { name: "Blue", value: "rgba(33, 150, 243, 0.4)", border: "#2196F3", bg: "bg-blue-500" },
    { name: "Pink", value: "rgba(233, 30, 99, 0.4)", border: "#E91E63", bg: "bg-pink-500" },
    { name: "Orange", value: "rgba(255, 152, 0, 0.4)", border: "#FF9800", bg: "bg-orange-500" },
    { name: "Purple", value: "rgba(156, 39, 176, 0.4)", border: "#9C27B0", bg: "bg-purple-500" },
  ];
  const [selectedHighlightColor, setSelectedHighlightColor] = useState(highlightColors[0]);

  // Shape stroke colors
  const shapeColors = [
    { name: "Red", value: "#EF4444" },
    { name: "Blue", value: "#3B82F6" },
    { name: "Green", value: "#22C55E" },
    { name: "Orange", value: "#F59E0B" },
    { name: "Purple", value: "#8B5CF6" },
    { name: "Black", value: "#1F2937" },
  ];
  const [selectedShapeColor, setSelectedShapeColor] = useState(shapeColors[0]);

  const { assignments, updateAssignmentStatus } = useDocumentReviewAssignments(documentId);
  const { user } = useAuth();
  const { logView } = useAuditLog({
    documentId: documentId || "",
    companyId: companyId || "",
    autoLogView: Boolean(documentId && companyId),
  });

  // Check file types
  const isDocFile = documentFile
    ? DocToPdfConverterService.isDocFile(documentFile.name || "", documentFile.type)
    : false;

  const isPDF = (() => {
    if (!documentFile) return false;
    const fileName = documentFile.name?.toLowerCase() || "";
    const fileType = documentFile.type?.toLowerCase() || "";
    if (fileName.endsWith(".doc") || fileName.endsWith(".docx")) return false;
    if (fileType.includes("msword") || fileType.includes("wordprocessingml")) return false;
    return fileType.includes("pdf") || fileName.endsWith(".pdf");
  })();

  const shouldShowPdfViewer = React.useMemo(() => {
    return isPDF || (isDocFile && pdfUrl && !isConvertingDoc);
  }, [isPDF, isDocFile, pdfUrl, isConvertingDoc]);

  const isDocumentAvailable = documentFile && documentFile.path;
  const showDocument = true;
  const showRightPanel = viewMode !== "document-only";
  const currentPanel =
    viewMode === "comments-only"
      ? "comments"
      : viewMode === "reviews-only"
        ? "reviews"
        : activeRightPanel;

  // Helper functions
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getUserName = () => {
    if (!user) return "Unknown User";
    if (user.user_metadata?.first_name && user.user_metadata?.last_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
    }
    return user.user_metadata?.first_name || user.email || "Unknown User";
  };

  const mapDbStatusToDropdown = (dbStatus: string | null): string => {
    if (!dbStatus) return "Not Started";
    const normalizedStatus = dbStatus.trim();
    if (["Not Started", "not_started", "NotStarted"].includes(normalizedStatus)) {
      return "Not Started";
    }
    if (["In Review", "in_review", "Under Review", "under_review", "In Progress", "in_progress"].includes(normalizedStatus)) {
      return "in_review";
    }
    if (["Approved", "approved"].includes(normalizedStatus)) return "Approved";
    if (["Rejected", "rejected"].includes(normalizedStatus)) return "Rejected";
    if (["Closed", "closed", "Completed", "completed"].includes(normalizedStatus)) {
      return "Approved";
    }
    return "Not Started";
  };

  const mapDropdownToDbStatus = (dropdownStatus: string): string => {
    if (dropdownStatus === "Not Started") return "Not Started";
    if (dropdownStatus === "in_review") return "In Review";
    if (dropdownStatus === "Approved") return "Approved";
    if (dropdownStatus === "Rejected") return "Rejected";
    return "Not Started";
  };

  // Handle document load
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsViewerReady(true);
  };

  // Handle page load to get actual PDF page dimensions
  const onPageLoadSuccess = (page: any) => {
    const viewport = page.getViewport({ scale: 1.0 });
    setPageDimensions({
      width: viewport.width,
      height: viewport.height,
    });
  };

  // Convert viewport coordinates to normalized PDF coordinates (percentages)
  const viewportToPdfCoords = (x: number, y: number, width: number, height: number) => {
    if (!pageDimensions) return { x, y, width, height };
    
    // Get current rendered page size
    const renderedWidth = pageDimensions.width * scale;
    const renderedHeight = pageDimensions.height * scale;
    
    // Convert to percentages of PDF page
    return {
      x: (x / renderedWidth) * 100,
      y: (y / renderedHeight) * 100,
      width: (width / renderedWidth) * 100,
      height: (height / renderedHeight) * 100,
    };
  };

  // Convert normalized PDF coordinates (percentages) back to viewport coordinates
  const pdfToViewportCoords = (x: number, y: number, width: number, height: number) => {
    if (!pageDimensions) return { x, y, width, height };

    // Get current rendered page size
    const renderedWidth = pageDimensions.width * scale;
    const renderedHeight = pageDimensions.height * scale;

    // Always treat stored coordinates as percentages (normalized)
    // Convert from percentages to current viewport size
    return {
      x: (x / 100) * renderedWidth,
      y: (y / 100) * renderedHeight,
      width: (width / 100) * renderedWidth,
      height: (height / 100) * renderedHeight,
    };
  };

  const onDocumentLoadError = (error: Error) => {
    setPdfError(error.message);
    toast.error("Failed to load PDF");
  };

  // Map our annotation type to sidebar display type
  const mapToSidebarType = (type: string): "highlight" | "comment" | "freetext" | "note" | "rectangle" | "text" => {
    if (type.includes("CommentHighlight")) return "comment"; // Combined type shows as comment
    if (type.includes("Highlight")) return "highlight";
    if (type.includes("Comment")) return "comment";
    if (type.includes("Sticky") || type.includes("Note")) return "note";
    if (type.includes("FreeText")) return "freetext";
    if (type.includes("Rectangle")) return "rectangle";
    return "highlight";
  };

  // Cleanup blob URL only on unmount or when dialog closes
  useEffect(() => {
    if (!open && convertedPdfBlobUrl) {
      URL.revokeObjectURL(convertedPdfBlobUrl);
      setConvertedPdfBlobUrl(null);
      setPdfUrl(null);
    }
  }, [open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (convertedPdfBlobUrl) {
        URL.revokeObjectURL(convertedPdfBlobUrl);
      }
    };
  }, []);

  useEffect(() => {
    if (!documentFile?.path) {
      setPdfUrl(null);
      setPdfError(null);
      return;
    }

    setPdfError(null);

    const loadDocument = async () => {
      try {
        if (isPDF) {
          const { data, error } = await supabase.storage
            .from("document-templates")
            .createSignedUrl(documentFile.path, 3600);
          if (error) throw error;
          setPdfUrl(data.signedUrl);
          setConvertedPdfBlobUrl(null);
        } else if (isDocFile) {
          setIsConvertingDoc(true);
          setPdfError(null);

          try {
            const { data: fileBlob, error: downloadError } = await supabase.storage
              .from("document-templates")
              .download(documentFile.path);

            if (downloadError || !fileBlob) {
              throw new Error("Failed to download file");
            }

            const pdfBlob = await DocToPdfConverterService.convertDocxToPdf(fileBlob, {
              fileName: documentFile.name,
            });

            // Validate the blob before creating URL
            if (pdfBlob && pdfBlob.size > 0) {
              const blobUrl = URL.createObjectURL(pdfBlob);
              setConvertedPdfBlobUrl(blobUrl);
              setPdfUrl(blobUrl);
              setIsConvertingDoc(false);
            } else {
              throw new Error("Conversion produced empty result");
            }
          } catch (conversionError) {
            console.error("Document conversion failed:", conversionError);
            setIsConvertingDoc(false);
            // Set a specific error for doc files that failed conversion
            setPdfError("Unable to preview this document. Please download to view.");
          }
        }
      } catch (error) {
        setIsConvertingDoc(false);
        setPdfError(error instanceof Error ? error.message : "Failed to load document");
        toast.error(error instanceof Error ? error.message : "Failed to load document");
      }
    };

    loadDocument();
  }, [documentFile?.path, isPDF, isDocFile]);

  // Fetch document status
  useEffect(() => {
    if (!open || !documentId) return;

    const fetchDocumentStatus = async () => {
      const cleanDocumentId = documentId.replace("template-", "");
      try {
        // First check if this is a company document (document_scope = 'company_document')
        const { data: companyDocument, error: companyError } = await supabase
          .from("documents")
          .select("status")
          .eq("id", cleanDocumentId)
          .eq("document_scope", "company_document")
          .maybeSingle();

        if (!companyError && companyDocument?.status) {
          setDocumentStatus(mapDbStatusToDropdown(companyDocument.status));
          return;
        }

        // If not a company document, check phase_assigned_document_template
        const { data, error } = await supabase
          .from("phase_assigned_document_template")
          .select("status")
          .eq("id", cleanDocumentId)
          .single();
        if (!error && data?.status) {
          setDocumentStatus(mapDbStatusToDropdown(data.status));
        }
      } catch (err) {
        // Keep current status
      }
    };

    setTimeout(fetchDocumentStatus, 100);
  }, [documentId, open]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open && documentId) {
      setIsViewerReady(false);
      setPageDimensions(null);
      setHighlights([]);
      setPageNumber(1);
      // Auto-enable formatted view for DS- referenced documents
      setShowFormattedView(!!documentReference?.startsWith('DS-'));
    }
  }, [open, documentId, documentReference]);

  // Load existing annotations when viewer is ready AND page dimensions are available
  useEffect(() => {
    if (open && shouldShowPdfViewer && documentId && user?.id && isViewerReady && pageDimensions) {
      loadExistingAnnotations();
    }
  }, [open, documentId, shouldShowPdfViewer, user?.id, isViewerReady, pageDimensions]);

  const loadExistingAnnotations = async () => {
    if (!documentId || !user?.id || !pageDimensions) return;

    const cleanDocumentId = AnnotationMapperService.cleanDocumentId(documentId);

    try {
      const existingAnnotations = await AnnotationService.loadAnnotations(cleanDocumentId);

      const mappedHighlights: ExtendedHighlight[] = existingAnnotations
        .map((annotation) => {
          try {
            const position = annotation.position as any;
            const rawPos = {
              x: position?.x ?? position?.boundingRect?.x1 ?? 0,
              y: position?.y ?? position?.boundingRect?.y1 ?? 0,
              width: position?.width ?? position?.boundingRect?.width ?? 0,
              height: position?.height ?? position?.boundingRect?.height ?? 0,
            };

            // Detect if coordinates are percentages (new format) or pixels (old format)
            // First check metadata marker, then use heuristic
            const metadata = annotation.metadata as any;
            const isPercentageFormat = metadata?.coordinateFormat === "percentage";

            let isOldPixelFormat = false;
            if (!isPercentageFormat) {
              // Heuristic: percentages are 0-100, pixels are typically much larger
              const hasLargeValue = rawPos.x > 100 || rawPos.y > 100 || rawPos.width > 100 || rawPos.height > 100;
              const exceedsBounds = (rawPos.x + rawPos.width) > 100 || (rawPos.y + rawPos.height) > 100;
              isOldPixelFormat = hasLargeValue || exceedsBounds;
            }

            let normalizedPos: { x: number; y: number; width: number; height: number };

            if (isOldPixelFormat) {
              // Old format: convert pixels to percentages using base page dimensions
              normalizedPos = {
                x: (rawPos.x / pageDimensions.width) * 100,
                y: (rawPos.y / pageDimensions.height) * 100,
                width: (rawPos.width / pageDimensions.width) * 100,
                height: (rawPos.height / pageDimensions.height) * 100,
              };
            } else {
              // New format: already percentages
              normalizedPos = rawPos;
            }

            return {
              id: annotation.annotation_id || annotation.id || "",
              pageNumber: annotation.page_number || 1,
              annotationType: annotation.annotation_type,
              position: normalizedPos, // Store normalized coordinates
              normalizedPosition: normalizedPos, // Also keep in normalizedPosition for clarity
              content: annotation.content || "",
              comment: { text: annotation.content || "", emoji: "" },
              userName: annotation.metadata?.userName || "Unknown User",
              color: annotation.style?.color || "rgba(255, 235, 59, 0.4)",
              createdAt: annotation.created_at,
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean) as ExtendedHighlight[];

      setHighlights(mappedHighlights);
    } catch (error) {
      toast.error("Failed to load annotations");
    }
  };

  // Manual annotation handlers - NO EXTERNAL PACKAGES NEEDED

  // Handle text selection for highlights (native browser API)
  const handleTextSelection = useCallback(() => {
    if (!documentId || !user?.id) return;

    // Only process text selection for highlight mode
    if (annotationMode !== "highlight") return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.length < 2) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const pageRect = pageRef.current?.getBoundingClientRect();

    if (!pageRect) return;

    // Calculate position relative to PDF page (viewport coordinates)
    const viewportX = rect.left - pageRect.left;
    const viewportY = rect.top - pageRect.top;
    const viewportWidth = rect.width;
    const viewportHeight = rect.height;

    // Convert to normalized PDF coordinates (percentages)
    const normalizedPos = viewportToPdfCoords(viewportX, viewportY, viewportWidth, viewportHeight);

    // Calculate popup position (fixed position on screen)
    const popupX = rect.left + rect.width / 2;
    const popupY = rect.bottom + 10;

    // Show the selection popup with comment input
    setSelectionPopup({
      show: true,
      x: popupX,
      y: popupY,
      selectedText,
      normalizedPosition: normalizedPos,
    });
    setSelectionComment("");
  }, [documentId, user?.id, pageNumber, pageDimensions, scale, annotationMode]);

  // Save annotation from selection popup - Supports highlight
  const handleSaveSelectionAnnotation = useCallback(async () => {
    if (!selectionPopup || !documentId || !user?.id) return;

    const annotationId = AnnotationMapperService.generateAnnotationId();
    const userName = getUserName();

    // Highlight annotation type
    const annotationType = selectionComment.trim() ? "CommentHighlightAnnotation" : "HighlightAnnotation";
    const color = selectedHighlightColor.value;
    const toastMessage = selectionComment.trim() ? "Comment added with highlight" : "Highlight added";

    // Store normalized coordinates consistently
    const newHighlight: ExtendedHighlight = {
      id: annotationId,
      pageNumber: pageNumber,
      annotationType: annotationType,
      position: selectionPopup.normalizedPosition,
      normalizedPosition: selectionPopup.normalizedPosition,
      content: selectionPopup.selectedText,
      comment: { text: selectionComment.trim() || selectionPopup.selectedText, emoji: "" },
      userName,
      color: color,
      createdAt: new Date().toISOString(),
    };

    setHighlights((prev) => [newHighlight, ...prev]);

    // Clear selection and popup
    window.getSelection()?.removeAllRanges();
    setSelectionPopup(null);
    setSelectionComment("");

    // Save to database
    try {
      const cleanDocumentId = AnnotationMapperService.cleanDocumentId(documentId);
      const annotationData: Omit<AnnotationData, "id" | "created_at" | "updated_at"> = {
        document_id: cleanDocumentId,
        user_id: user.id!,
        annotation_id: annotationId,
        annotation_type: annotationType,
        page_number: newHighlight.pageNumber,
        content: selectionComment.trim() || selectionPopup.selectedText,
        position: newHighlight.position,
        style: {
          color: color,
          opacity: annotationMode === "highlight" ? 0.4 : 1,
        },
        metadata: {
          userName: newHighlight.userName,
          createdBy: "manual-annotation",
          coordinateFormat: "percentage",
          selectedText: selectionPopup.selectedText,
          hasComment: !!selectionComment.trim(),
          colorName: selectedHighlightColor.name
        },
      };

      const saved = await AnnotationService.saveAnnotation(annotationData);
      if (saved) {
        toast.success(toastMessage);
      }
    } catch (error) {
      setHighlights((prev) => prev.filter((h) => h.id !== annotationId));
      toast.error("Failed to save annotation");
    }
  }, [selectionPopup, selectionComment, documentId, user?.id, pageNumber, selectedHighlightColor, annotationMode]);

  // Cancel selection popup
  const handleCancelSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setSelectionPopup(null);
    setSelectionComment("");
  }, []);

  // Handle click for adding comments, freetext, and stamps
  const handlePageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!pageRef.current) return;

    const pageRect = pageRef.current.getBoundingClientRect();
    const viewportX = e.clientX - pageRect.left;
    const viewportY = e.clientY - pageRect.top;

    // Convert to normalized coordinates
    const normalizedPos = viewportToPdfCoords(viewportX, viewportY, 0, 0);

    if (annotationMode === "comment") {
      setCommentPosition({ x: normalizedPos.x, y: normalizedPos.y });
      setCommentDialogOpen(true);
    } else if (annotationMode === "freetext") {
      setFreeTextPosition({ x: normalizedPos.x, y: normalizedPos.y });
      setFreeTextDialogOpen(true);
    }
  }, [annotationMode, pageDimensions, scale]);

  // Handle mouse down for shape drawing
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (annotationMode !== "rectangle" || !pageRef.current) return;

    const pageRect = pageRef.current.getBoundingClientRect();
    const viewportX = e.clientX - pageRect.left;
    const viewportY = e.clientY - pageRect.top;

    setIsDrawing(true);
    setDrawStart({ x: viewportX, y: viewportY });
    setDrawEnd({ x: viewportX, y: viewportY });
  }, [annotationMode]);

  // Handle mouse move for shape drawing
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !pageRef.current) return;

    const pageRect = pageRef.current.getBoundingClientRect();
    const viewportX = e.clientX - pageRect.left;
    const viewportY = e.clientY - pageRect.top;

    setDrawEnd({ x: viewportX, y: viewportY });
  }, [isDrawing]);

  // Handle annotation drag start (for moving rectangles)
  const handleAnnotationDragStart = useCallback((
    e: React.MouseEvent,
    highlight: ExtendedHighlight
  ) => {
    // Only allow dragging rectangles
    if (!highlight.annotationType.includes("Rectangle")) return;

    e.preventDefault();
    e.stopPropagation();

    const sourcePos = highlight.normalizedPosition || highlight.position;

    setDraggingAnnotation({
      id: highlight.id,
      startX: e.clientX,
      startY: e.clientY,
      originalX: sourcePos.x,
      originalY: sourcePos.y,
    });
  }, []);

  // Handle annotation drag move - uses ref for smooth updates without state changes
  const handleAnnotationDragMove = useCallback((e: React.MouseEvent) => {
    if (!draggingAnnotation || !pageRef.current) return;

    e.preventDefault();

    // Calculate delta in pixels (raw pixel offset for CSS transform)
    const deltaX = e.clientX - draggingAnnotation.startX;
    const deltaY = e.clientY - draggingAnnotation.startY;

    // Store in ref for immediate visual update via CSS transform
    dragOffsetRef.current = { x: deltaX, y: deltaY };

    // Update the dragged element directly via DOM for smooth movement
    const draggedElement = document.getElementById(`annotation-${draggingAnnotation.id}`);
    if (draggedElement) {
      draggedElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    }
  }, [draggingAnnotation]);

  // Handle annotation drag end
  const handleAnnotationDragEnd = useCallback(async () => {
    if (!draggingAnnotation || !pageDimensions) return;

    const highlight = highlights.find(h => h.id === draggingAnnotation.id);
    if (!highlight) {
      dragOffsetRef.current = { x: 0, y: 0 };
      setDraggingAnnotation(null);
      return;
    }

    // Get the drag offset from ref
    const { x: deltaX, y: deltaY } = dragOffsetRef.current;

    // Reset the DOM transform
    const draggedElement = document.getElementById(`annotation-${draggingAnnotation.id}`);
    if (draggedElement) {
      draggedElement.style.transform = '';
    }

    // If no movement, just reset
    if (Math.abs(deltaX) < 2 && Math.abs(deltaY) < 2) {
      dragOffsetRef.current = { x: 0, y: 0 };
      setDraggingAnnotation(null);
      return;
    }

    // Convert pixel delta to percentage
    const renderedWidth = pageDimensions.width * scale;
    const renderedHeight = pageDimensions.height * scale;
    const deltaXPercent = (deltaX / renderedWidth) * 100;
    const deltaYPercent = (deltaY / renderedHeight) * 100;

    // Calculate new normalized position
    const newX = Math.max(0, Math.min(95, draggingAnnotation.originalX + deltaXPercent));
    const newY = Math.max(0, Math.min(95, draggingAnnotation.originalY + deltaYPercent));

    const newPosition = {
      ...highlight.position,
      x: newX,
      y: newY,
    };

    // Update state with new position
    setHighlights(prev => prev.map(h => {
      if (h.id !== draggingAnnotation.id) return h;
      return {
        ...h,
        position: newPosition,
        normalizedPosition: newPosition,
      };
    }));

    // Save the new position to the database
    try {
      await AnnotationService.updateAnnotation(draggingAnnotation.id, {
        position: newPosition,
        metadata: {
          userName: highlight.userName || "Unknown User",
          coordinateFormat: "percentage",
          lastMoved: new Date().toISOString(),
        },
      });
      toast.success("Annotation moved");
    } catch (error) {
      toast.error("Failed to save position");
      // Revert to original position on error
      setHighlights(prev => prev.map(h => {
        if (h.id !== draggingAnnotation.id) return h;
        const revertPos = {
          ...h.position,
          x: draggingAnnotation.originalX,
          y: draggingAnnotation.originalY
        };
        return {
          ...h,
          position: revertPos,
          normalizedPosition: revertPos,
        };
      }));
    }

    dragOffsetRef.current = { x: 0, y: 0 };
    setDraggingAnnotation(null);
  }, [draggingAnnotation, highlights, pageDimensions, scale]);

  // Handle mouse up for shape drawing
  const handleMouseUp = useCallback(async () => {
    // Early exit if not in drawing state
    if (!isDrawing || !drawStart || !drawEnd || !documentId || !user?.id) {
      setIsDrawing(false);
      setDrawStart(null);
      setDrawEnd(null);
      return;
    }

    // Capture current values and reset state immediately to prevent duplicate calls
    const currentDrawStart = drawStart;
    const currentDrawEnd = drawEnd;
    const currentMode = annotationMode;

    setIsDrawing(false);
    setDrawStart(null);
    setDrawEnd(null);

    if (currentMode === "rectangle") {
      // Calculate normalized position
      const x = Math.min(currentDrawStart.x, currentDrawEnd.x);
      const y = Math.min(currentDrawStart.y, currentDrawEnd.y);
      const width = Math.abs(currentDrawEnd.x - currentDrawStart.x);
      const height = Math.abs(currentDrawEnd.y - currentDrawStart.y);

      // Minimum size check
      if (width < 10 && height < 10) {
        return;
      }

      const normalizedPos = viewportToPdfCoords(x, y, width, height);
      await handleAddShape(normalizedPos, currentMode);
    }
  }, [isDrawing, drawStart, drawEnd, annotationMode, documentId, user?.id]);

  // Add shape annotation (rectangle only)
  const handleAddShape = async (normalizedPos: { x: number; y: number; width: number; height: number }, shapeType: string) => {
    if (!documentId || !user?.id) return;

    const annotationId = AnnotationMapperService.generateAnnotationId();
    const userName = getUserName();

    const newShape: ExtendedHighlight = {
      id: annotationId,
      pageNumber: pageNumber,
      annotationType: "RectangleAnnotation",
      position: normalizedPos,
      normalizedPosition: normalizedPos,
      content: `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} annotation`,
      comment: { text: "", emoji: "" },
      userName,
      color: selectedShapeColor.value,
      createdAt: new Date().toISOString(),
    };

    setHighlights((prev) => [newShape, ...prev]);

    try {
      const cleanDocumentId = AnnotationMapperService.cleanDocumentId(documentId);
      const annotationData: Omit<AnnotationData, "id" | "created_at" | "updated_at"> = {
        document_id: cleanDocumentId,
        user_id: user.id,
        annotation_id: annotationId,
        annotation_type: newShape.annotationType,
        page_number: pageNumber,
        content: newShape.content,
        position: normalizedPos,
        style: { color: selectedShapeColor.value, strokeWidth: 2, opacity: 1 },
        metadata: { userName, coordinateFormat: "percentage", shapeType },
      };

      await AnnotationService.saveAnnotation(annotationData);
      toast.success(`${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} added`);
    } catch {
      setHighlights((prev) => prev.filter((h) => h.id !== annotationId));
      toast.error("Failed to save shape");
    }
  };

  // Add FreeText annotation
  const handleAddFreeText = async () => {
    if (!documentId || !user?.id || !freeTextContent.trim() || !freeTextPosition) return;

    const annotationId = AnnotationMapperService.generateAnnotationId();
    const userName = getUserName();

    const normalizedPos = {
      x: freeTextPosition.x,
      y: freeTextPosition.y,
      width: 20, // Default width
      height: 5  // Default height
    };

    const newFreeText: ExtendedHighlight = {
      id: annotationId,
      pageNumber: pageNumber,
      annotationType: "FreeTextAnnotation",
      position: normalizedPos,
      normalizedPosition: normalizedPos,
      content: freeTextContent.trim(),
      comment: { text: freeTextContent.trim(), emoji: "" },
      userName,
      color: selectedShapeColor.value,
      createdAt: new Date().toISOString(),
    };

    setHighlights((prev) => [newFreeText, ...prev]);
    setFreeTextDialogOpen(false);
    setFreeTextContent("");
    setFreeTextPosition(null);

    try {
      const cleanDocumentId = AnnotationMapperService.cleanDocumentId(documentId);
      const annotationData: Omit<AnnotationData, "id" | "created_at" | "updated_at"> = {
        document_id: cleanDocumentId,
        user_id: user.id,
        annotation_id: annotationId,
        annotation_type: "FreeTextAnnotation",
        page_number: pageNumber,
        content: freeTextContent.trim(),
        position: normalizedPos,
        style: { color: selectedShapeColor.value, fontSize: 14, opacity: 1 },
        metadata: { userName, coordinateFormat: "percentage" },
      };

      await AnnotationService.saveAnnotation(annotationData);
      toast.success("Text added");
    } catch {
      setHighlights((prev) => prev.filter((h) => h.id !== annotationId));
      toast.error("Failed to save text");
    }
  };

  // Add comment at clicked position
  const handleAddComment = async () => {
    if (!documentId || !user?.id || !commentText.trim() || !commentPosition) return;

    const generatedId = AnnotationMapperService.generateAnnotationId();
    const userName = getUserName();

    // Use normalized coordinates with a small marker size
    const normalizedPos = {
      x: commentPosition.x,
      y: commentPosition.y,
      width: 3, // Small marker width (3% of page)
      height: 3 // Small marker height (3% of page)
    };

    const newComment: ExtendedHighlight = {
      id: generatedId,
      pageNumber: pageNumber,
      annotationType: "CommentAnnotation",
      position: normalizedPos,
      normalizedPosition: normalizedPos,
      content: commentText.trim(),
      comment: { text: commentText.trim(), emoji: "" },
      userName,
      color: "rgba(255, 193, 7, 1)", // Amber/yellow for comments
      createdAt: new Date().toISOString(),
    };

    setHighlights((prev) => [newComment, ...prev]);
    setCommentDialogOpen(false);
    setCommentText("");
    setCommentPosition(null);

    try {
      const cleanDocumentId = AnnotationMapperService.cleanDocumentId(documentId);
      const annotationData: Omit<AnnotationData, "id" | "created_at" | "updated_at"> = {
        document_id: cleanDocumentId,
        user_id: user.id,
        annotation_id: generatedId,
        annotation_type: "CommentAnnotation",
        page_number: pageNumber,
        content: commentText.trim(),
        position: normalizedPos,
        style: { color: "rgba(255, 193, 7, 1)", opacity: 1 },
        metadata: { userName, annotationType: "comment", coordinateFormat: "percentage" },
      };

      await AnnotationService.saveAnnotation(annotationData);
      toast.success("Comment added");
    } catch {
      setHighlights((prev) => prev.filter((h) => h.id !== generatedId));
      toast.error("Failed to save comment");
    }
  };

  // Save annotation to database (reusable function)
  const saveAnnotationToDb = async (annotation: ExtendedHighlight, annotationId: string) => {
    if (!documentId || !user?.id) return;
    
    try {
      const cleanDocumentId = AnnotationMapperService.cleanDocumentId(documentId);
      const annotationData: Omit<AnnotationData, "id" | "created_at" | "updated_at"> = {
        document_id: cleanDocumentId,
        user_id: user.id!,
        annotation_id: annotationId,
        annotation_type: annotation.annotationType,
        page_number: annotation.pageNumber,
        content: annotation.content,
        position: annotation.position,
        style: {
          color: annotation.color || "rgba(255, 235, 59, 0.4)",
          opacity: 0.4,
        },
        metadata: { userName: annotation.userName, createdBy: "manual-annotation", coordinateFormat: "percentage" },
      };

      const saved = await AnnotationService.saveAnnotation(annotationData);
      if (saved) {
        toast.success("Annotation saved");
      }
    } catch (error) {
      setHighlights((prev) => prev.filter((h) => h.id !== annotationId));
      toast.error("Failed to save annotation");
    }
  };

  // Document loaded handler
  const handleDocumentLoaded = () => {
    setIsViewerReady(true);
  };

  // Get highlights for current page and convert normalized coordinates to viewport
  // Memoized to prevent flickering on re-renders
  const currentPageHighlights = React.useMemo((): ExtendedHighlight[] => {
    if (!pageDimensions) return [];

    const renderedWidth = pageDimensions.width * scale;
    const renderedHeight = pageDimensions.height * scale;

    return highlights
      .filter((h) => h.pageNumber === pageNumber)
      .map((highlight) => {
        // Use normalizedPosition if available, otherwise use position (which should be percentages)
        const sourcePos = highlight.normalizedPosition || highlight.position;
        const viewportPos = pdfToViewportCoords(
          sourcePos.x,
          sourcePos.y,
          sourcePos.width,
          sourcePos.height
        );

        // Clamp coordinates to ensure annotation stays within page bounds
        const clampedPos = {
          x: Math.max(0, Math.min(viewportPos.x, renderedWidth - viewportPos.width)),
          y: Math.max(0, Math.min(viewportPos.y, renderedHeight - viewportPos.height)),
          width: Math.min(viewportPos.width, renderedWidth),
          height: Math.min(viewportPos.height, renderedHeight),
        };

        return {
          ...highlight,
          position: clampedPos,
        };
      });
  }, [pageDimensions, scale, highlights, pageNumber]);

  // Delete annotation
  const handleDeleteAnnotation = async (highlight: ExtendedHighlight) => {
    if (!highlight?.id) return;
    if (!await confirmAction({ title: 'Delete annotation', description: 'Delete this annotation?', confirmLabel: 'Delete', variant: 'destructive' })) return;

    try {
      const success = await AnnotationService.deleteAnnotation(highlight.id);
      if (success) {
        setHighlights((prev) => prev.filter((h) => h.id !== highlight.id));
        toast.success("Annotation deleted");
      }
    } catch {
      toast.error("Failed to delete annotation");
    }
  };

  // Edit annotation
  const handleEditAnnotation = (highlight: ExtendedHighlight) => {
    setEditHighlight(highlight);
    setEditText(highlight.comment?.text || highlight.content || "");
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editHighlight?.id) return;

    try {
      const updated = await AnnotationService.updateAnnotation(editHighlight.id, {
        content: editText,
        metadata: { userName: editHighlight.userName || "Unknown User", createdBy: "react-pdf" },
      });

      if (updated) {
        setHighlights((prev) =>
          prev.map((h) =>
            h.id === editHighlight.id
              ? { ...h, content: editText, comment: { ...h.comment, text: editText } }
              : h
          )
        );
        toast.success("Annotation updated");
        setEditModalOpen(false);
      }
    } catch {
      toast.error("Failed to update annotation");
    }
  };

  // Scroll to highlight / Navigate to annotation
  const handleAnnotationClick = (highlight: ExtendedHighlight) => {
    // First navigate to the correct page
    setPageNumber(highlight.pageNumber);
    setShowAnnotationSidebar(true);

    // Set this annotation as active for visual highlighting
    setActiveAnnotationId(highlight.id);

    // Clear the highlight after 2 seconds
    setTimeout(() => {
      setActiveAnnotationId(null);
    }, 2000);

    // Scroll to annotation position after page renders
    setTimeout(() => {
      if (!containerRef.current || !pageDimensions) return;

      // Get the normalized position (percentages)
      const sourcePos = highlight.normalizedPosition || highlight.position;

      // Convert percentage to viewport coordinates
      const renderedHeight = pageDimensions.height * scale;
      const viewportY = (sourcePos.y / 100) * renderedHeight;

      // Calculate scroll position - center the annotation in the viewport
      const containerHeight = containerRef.current.clientHeight;
      const scrollTop = Math.max(0, viewportY - containerHeight / 3);

      containerRef.current.scrollTo({
        top: scrollTop,
        behavior: "smooth",
      });
    }, 150);
  };

  // Download file
  const handleDownloadFile = async () => {
    if (!documentFile?.path) {
      toast.error("No file available");
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from("document-templates")
        .download(documentFile.path);
      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = documentFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("File downloaded");
    } catch {
      toast.error("Failed to download file");
    }
  };

  // Status change
  const documentStatusChange = async (value: string) => {
    if (!user?.id) {
      toast.error("You must be logged in");
      return;
    }

    const oldStatus = documentStatus;
    const cleanDocumentId = documentId?.replace("template-", "") || "";
    const dbStatus = mapDropdownToDbStatus(value);

    try {
      // Check if this is a company document (document_scope = 'company_document')
      const { data: companyDocument } = await supabase
        .from("documents")
        .select("id, document_scope")
        .eq("id", cleanDocumentId)
        .eq("document_scope", "company_document")
        .maybeSingle();

      const isCompanyDocument = !!companyDocument;

      if (reviewerGroupId && assignments.length > 0) {
        const assignment = assignments.find((a) => a.reviewer_group_id === reviewerGroupId);
        if (assignment) {
          const assignmentStatus: "pending" | "in_review" | "completed" | "skipped" | "rejected" =
            value === "Approved"
              ? "completed"
              : value === "Rejected"
                ? "rejected"
                : value === "in_review"
                  ? "in_review"
                  : "pending";

          await updateAssignmentStatus(assignment.id, assignmentStatus, reviewerGroupId);

          if (value === "Approved" || value === "Rejected") {
            await supabase.from("document_review_notes").insert({
              document_id: cleanDocumentId,
              reviewer_id: user.id,
              note: `Status changed to ${dbStatus}`,
            });
          }

          // Save individual reviewer decision for ALL status changes
          const decisionMap: Record<string, string> = {
            'Approved': 'approved',
            'Rejected': 'rejected',
            'Changes Requested': 'changes_requested',
            'In Review': 'in_review',
            'in_review': 'in_review',
            'Under Review': 'in_review',
            'Not Started': 'not_started',
            'Pending': 'pending',
          };
          const decision = decisionMap[value] || decisionMap[dbStatus];
          if (decision) {
            await supabase
              .from("document_reviewer_decisions")
              .upsert({
                document_id: cleanDocumentId,
                reviewer_id: user.id,
                reviewer_group_id: reviewerGroupId,
                decision,
                comment: `Status changed to ${dbStatus}`,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'document_id,reviewer_id' });
          }

          const { data: allAssignments } = await supabase
            .from("document_review_assignments")
            .select("status")
            .eq("document_id", cleanDocumentId);

          const allDone =
            allAssignments &&
            allAssignments.length > 0 &&
            allAssignments.every((a) => a.status === "completed" || a.status === "rejected");

          const hasRejection =
            allAssignments &&
            allAssignments.some((a) => a.status === "rejected");

          const finalStatus: "Rejected" | "Approved" | "In Review" = allDone
            ? (hasRejection ? "Rejected" : "Approved")
            : "In Review" as "Rejected" | "Approved" | "In Review";

          // Update the appropriate table based on document type
          const updateData: Record<string, any> = {
            status: finalStatus,
            updated_at: new Date().toISOString()
          };
          // Set approval_date when status is Approved
          if (finalStatus === "Approved") {
            updateData.approval_date = new Date().toISOString();
          }

          if (isCompanyDocument) {
            await supabase
              .from("documents")
              .update(updateData as any)
              .eq("id", cleanDocumentId);
          } else {
            await supabase
              .from("phase_assigned_document_template")
              .update(updateData as any)
              .eq("id", cleanDocumentId);
          }

          setDocumentStatus(mapDbStatusToDropdown(finalStatus));
        }
      } else {
        // Update the appropriate table based on document type
        const directUpdateData: Record<string, any> = {
          status: dbStatus,
          updated_at: new Date().toISOString()
        };
        // Set approval_date when status is Approved
        if (dbStatus.toLowerCase() === "approved") {
          directUpdateData.approval_date = new Date().toISOString();
        }

        if (isCompanyDocument) {
          await supabase
            .from("documents")
            .update(directUpdateData as any)
            .eq("id", cleanDocumentId);
        } else {
          await supabase
            .from("phase_assigned_document_template")
            .update(directUpdateData as any)
            .eq("id", cleanDocumentId);
        }

        setDocumentStatus(value);

        // Save individual reviewer decision (no reviewer group path)
        if (user?.id) {
          const directDecisionMap: Record<string, string> = {
            'Approved': 'approved',
            'Rejected': 'rejected',
            'Changes Requested': 'changes_requested',
            'In Review': 'in_review',
            'in_review': 'in_review',
            'Under Review': 'in_review',
            'Not Started': 'not_started',
            'Pending': 'pending',
          };
          const directDecision = directDecisionMap[value] || directDecisionMap[dbStatus];
          if (directDecision) {
            await supabase
              .from("document_reviewer_decisions")
              .upsert({
                document_id: cleanDocumentId,
                reviewer_id: user.id,
                decision: directDecision,
                comment: `Status changed to ${dbStatus}`,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'document_id,reviewer_id' });
          }
        }
      }

      toast.success("Status updated");

      // Notify parent component of status change so it can refresh the list
      if (onStatusChanged && documentId) {
        const cleanDocumentId = documentId.replace("template-", "");
        onStatusChanged(cleanDocumentId, dbStatus);
      }
    } catch {
      setDocumentStatus(oldStatus);
      toast.error("Failed to update status");
    }
  };

  // Add note using Syncfusion sticky notes
  const handleAddNote = async () => {
    if (!documentId || !user?.id || !noteText.trim()) return;

    const generatedId = AnnotationMapperService.generateAnnotationId();
    const userName = getUserName();

    // Use normalized coordinates (percentages) - position note at 10% from top-left
    const normalizedPos = { x: 10, y: 10, width: 25, height: 15 };

    const newNote: ExtendedHighlight = {
      id: generatedId,
      pageNumber: pageNumber, // Use current page
      annotationType: "NoteAnnotation",
      position: normalizedPos, // Store normalized coordinates
      normalizedPosition: normalizedPos,
      content: noteText.trim(),
      comment: { text: noteText.trim(), emoji: "" },
      userName,
      color: "rgba(33, 150, 243, 1)",
      createdAt: new Date().toISOString(),
    };

    setHighlights((prev) => [newNote, ...prev]);
    setNoteDialogOpen(false);
    setNoteText("");

    try {
      const cleanDocumentId = AnnotationMapperService.cleanDocumentId(documentId);
      const annotationData: Omit<AnnotationData, "id" | "created_at" | "updated_at"> = {
        document_id: cleanDocumentId,
        user_id: user.id,
        annotation_id: generatedId,
        annotation_type: "NoteAnnotation",
        page_number: pageNumber, // Use current page
        content: noteText.trim(),
        position: normalizedPos, // Save normalized coordinates
        style: { color: "rgba(33, 150, 243, 1)", opacity: 1 },
        metadata: { userName, annotationType: "note", coordinateFormat: "percentage" },
      };

      await AnnotationService.saveAnnotation(annotationData);
      toast.success("Note added");
    } catch {
      setHighlights((prev) => prev.filter((h) => h.id !== generatedId));
      toast.error("Failed to save note");
    }
  };

  // Convert for sidebar
  const sidebarHighlights = highlights.map((h) => ({
    id: h.id,
    pageNumber: h.pageNumber,
    text: h.content || "",
    position: h.position,
    comment: h.comment,
    userName: h.userName,
    color: h.color,
    annotationType: mapToSidebarType(h.annotationType),
    createdAt: h.createdAt,
  }));

  if (!documentId || !companyId) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-[95vw] sm:h-[98vh] p-0 flex flex-col [&>button]:hidden"
          onPointerDownOutside={(e) => {
            if (selectionPopup?.show) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onInteractOutside={(e) => {
            if (selectionPopup?.show) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onFocusOutside={(e) => {
            if (selectionPopup?.show) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          <DialogHeader className="sticky top-0 z-50 p-3 border-b bg-white/95 backdrop-blur-md shadow-md">
            <div className="flex items-center justify-between pr-8">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900">{documentName}</span>
                  {documentFile && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <File className="h-3 w-3" />
                      <span>{documentFile.name}</span>
                      {documentFile.size && <span>({formatFileSize(documentFile.size)})</span>}
                      {shouldShowPdfViewer && (
                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                          {highlights.length} Annotation{highlights.length !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Formatted View toggle for DS- documents */}
                {documentReference?.startsWith('DS-') && (
                  <Button
                    variant={showFormattedView ? "default" : "outline"}
                    onClick={() => setShowFormattedView(!showFormattedView)}
                    className="px-3"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    {showFormattedView ? "PDF View" : "Formatted View"}
                  </Button>
                )}
                {shouldShowPdfViewer && !showFormattedView && (
                  <>
                    <Button
                      variant="default"
                      onClick={() => setNoteDialogOpen(true)}
                      className="px-3 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Add Note
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowAnnotationSidebar(!showAnnotationSidebar)}
                      className="px-3"
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Annotations
                      <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0.5 bg-blue-500 text-white rounded-full">
                        {highlights.length}
                      </Badge>
                    </Button>
                  </>
                )}
                {/* <Button
                  variant="default"
                  onClick={() => setShowESign(true)}
                  className="px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <PenTool className="h-3 w-3 mr-1" />
                  E-Signature
                </Button> */}
                <Button variant="outline" onClick={() => setCloseStatusDialogOpen(true)} className="px-3">
                  Done
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* E-Signature Popup */}
          <ESignPopup
            open={showESign}
            onOpenChange={setShowESign}
            documentId={documentId || ''}
            documentName={documentName}
            onClose={() => setShowESign(false)}
          />

          <div className="flex-1 flex overflow-hidden bg-gray-50 relative">
            {showDocument && (
              <div className={`flex h-full bg-white justify-center transition-all duration-200 flex-shrink-0 ${showAnnotationSidebar && shouldShowPdfViewer ? "w-2/3" : "w-full"}`}>
                <div className="w-full h-full flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-hidden relative">
                    {showFormattedView ? (
                      <DocumentRichContentView
                        documentName={documentName}
                        documentReference={documentReference}
                      />
                    ) : !isDocumentAvailable ? (
                      <div className="flex flex-col items-center justify-center h-full bg-gray-50">
                        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900">Document Not Found</h3>
                      </div>
                    ) : shouldShowPdfViewer ? (
                      pdfError ? (
                        <div className="flex items-center justify-center h-full bg-gray-50">
                          <div className="text-center p-8">
                            <FileText className="h-16 w-16 text-red-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
                            <p className="text-gray-500 mb-4">{pdfError}</p>
                            <Button variant="outline" onClick={handleDownloadFile}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      ) : isConvertingDoc ? (
                        <div className="flex items-center justify-center h-full bg-gray-50">
                          <div className="text-center">
                            <LoadingSpinner size="lg" className="mb-6" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Converting...</h3>
                          </div>
                        </div>
                      ) : pdfUrl ? (
                        <div
                          ref={containerRef}
                          className={`h-full w-full overflow-auto bg-gray-100 p-4 ${
                            !["highlight", "none"].includes(annotationMode)
                              ? "[&_.react-pdf__Page__textContent]:pointer-events-none [&_.react-pdf__Page__textContent]:select-none"
                              : ""
                          }`}
                          onMouseUp={handleTextSelection}
                          style={{ pointerEvents: selectionPopup?.show ? 'none' : 'auto' }}
                        >
                          <div className="flex flex-col items-center gap-4">
                            {/* PDF Controls */}
                            <div className="flex flex-col gap-2 sticky top-0 z-50 bg-white p-3 rounded-lg shadow-sm">
                              {/* Top Row: Navigation and Zoom */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Navigation */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
                                  disabled={pageNumber <= 1}
                                >
                                  Previous
                                </Button>
                                <span className="text-sm px-3">
                                  Page {pageNumber} of {numPages || "?"}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPageNumber((prev) => Math.min(numPages || 1, prev + 1))}
                                  disabled={pageNumber >= (numPages || 1)}
                                >
                                  Next
                                </Button>
                                <div className="w-px h-6 bg-gray-300 mx-2" />

                                {/* Zoom */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setScale((prev) => Math.max(0.5, prev - 0.25))}
                                >
                                  Zoom Out
                                </Button>
                                <span className="text-sm px-2">{Math.round(scale * 100)}%</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setScale((prev) => Math.min(2, prev + 0.25))}
                                >
                                  Zoom In
                                </Button>
                              </div>

                              {/* Annotation Toolbar */}
                              <div className="flex items-center gap-1 flex-wrap border-t pt-2">
                                {/* Text Markup Group */}
                                <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-md">
                                  <span className="text-xs text-gray-500 mr-1">Text:</span>
                                  <Button
                                    variant={annotationMode === "highlight" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setAnnotationMode(annotationMode === "highlight" ? "none" : "highlight")}
                                    className={`h-8 px-2 ${annotationMode === "highlight" ? "bg-yellow-500 hover:bg-yellow-600" : ""}`}
                                    title="Highlight (select text)"
                                  >
                                    <Highlighter className="h-4 w-4" />
                                  </Button>
                                </div>

                                <div className="w-px h-6 bg-gray-300 mx-1" />

                                {/* Shapes Group */}
                                <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-md">
                                  <span className="text-xs text-gray-500 mr-1">Shapes:</span>
                                  <Button
                                    variant={annotationMode === "rectangle" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setAnnotationMode(annotationMode === "rectangle" ? "none" : "rectangle")}
                                    className={`h-8 px-2 ${annotationMode === "rectangle" ? "bg-blue-500 hover:bg-blue-600" : ""}`}
                                    title="Rectangle (click and drag)"
                                  >
                                    <Square className="h-4 w-4" />
                                  </Button>
                                </div>

                                <div className="w-px h-6 bg-gray-300 mx-1" />

                                {/* Text & Comment Group */}
                                <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-md">
                                  <span className="text-xs text-gray-500 mr-1">Add:</span>
                                  <Button
                                    variant={annotationMode === "freetext" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setAnnotationMode(annotationMode === "freetext" ? "none" : "freetext")}
                                    className={`h-8 px-2 ${annotationMode === "freetext" ? "bg-teal-500 hover:bg-teal-600" : ""}`}
                                    title="Add text (click to place)"
                                  >
                                    <Type className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant={annotationMode === "comment" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setAnnotationMode(annotationMode === "comment" ? "none" : "comment")}
                                    className={`h-8 px-2 ${annotationMode === "comment" ? "bg-amber-500 hover:bg-amber-600" : ""}`}
                                    title="Add comment (click to place)"
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                </div>

                                <div className="w-px h-6 bg-gray-300 mx-1" />

                                {/* Color Picker for shapes */}
                                {["rectangle", "freetext"].includes(annotationMode) && (
                                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-md">
                                    <span className="text-xs text-gray-500 mr-1">Color:</span>
                                    {shapeColors.map((color) => (
                                      <button
                                        key={color.name}
                                        onClick={() => setSelectedShapeColor(color)}
                                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                                          selectedShapeColor.name === color.name
                                            ? "border-gray-600 scale-110"
                                            : "border-transparent hover:border-gray-300"
                                        }`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                      />
                                    ))}
                                  </div>
                                )}

                                {/* Color Picker for highlight */}
                                {annotationMode === "highlight" && (
                                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-md">
                                    <span className="text-xs text-gray-500 mr-1">Color:</span>
                                    {highlightColors.map((color) => (
                                      <button
                                        key={color.name}
                                        onClick={() => setSelectedHighlightColor(color)}
                                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                                          selectedHighlightColor.name === color.name
                                            ? "border-gray-600 scale-110"
                                            : "border-transparent hover:border-gray-300"
                                        }`}
                                        style={{ backgroundColor: color.border }}
                                        title={color.name}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Active tool indicator */}
                              {annotationMode !== "none" && (
                                <div className="text-xs text-center text-gray-500 pt-1 border-t">
                                  {annotationMode === "highlight" && "Select text to highlight"}
                                  {annotationMode === "rectangle" && "Click and drag to draw rectangle"}
                                  {annotationMode === "freetext" && "Click to add text"}
                                  {annotationMode === "comment" && "Click to add comment"}
                                </div>
                              )}
                            </div>

                            {/* PDF Document */}
                            <Document
                              file={pdfUrl}
                              onLoadSuccess={onDocumentLoadSuccess}
                              onLoadError={onDocumentLoadError}
                              loading={<LoadingSpinner />}
                              className="flex justify-center"
                            >
                              <div
                                ref={pageRef}
                                className={`relative shadow-lg bg-white ${
                                  ["comment", "freetext", "stamp"].includes(annotationMode) ? "cursor-crosshair" :
                                  ["rectangle", "circle", "line", "arrow", "freehand"].includes(annotationMode) ? "cursor-crosshair" :
                                  ""
                                }`}
                                onClick={handlePageClick}
                                onMouseDown={handleMouseDown}
                                onMouseMove={(e) => {
                                  if (draggingAnnotation) {
                                    handleAnnotationDragMove(e);
                                  } else {
                                    handleMouseMove(e);
                                  }
                                }}
                                onMouseUp={() => {
                                  if (draggingAnnotation) {
                                    handleAnnotationDragEnd();
                                  } else {
                                    handleMouseUp();
                                  }
                                }}
                                onMouseLeave={() => {
                                  if (draggingAnnotation) {
                                    handleAnnotationDragEnd();
                                  } else if (isDrawing) {
                                    handleMouseUp();
                                  }
                                }}
                                style={{
                                  // Disable text selection when using non-text annotation tools or dragging
                                  userSelect: draggingAnnotation || !["highlight", "none"].includes(annotationMode) ? "none" : "text",
                                  WebkitUserSelect: draggingAnnotation || !["highlight", "none"].includes(annotationMode) ? "none" : "text",
                                }}
                              >
                                <Page
                                  pageNumber={pageNumber}
                                  scale={scale}
                                  renderTextLayer={true}
                                  renderAnnotationLayer={true}
                                  className="border border-gray-300"
                                  onLoadSuccess={onPageLoadSuccess}
                                />

                                {/* Drawing overlay - captures mouse events and prevents text selection for shape tools */}
                                {["rectangle", "comment", "freetext"].includes(annotationMode) && (
                                  <div
                                    className="absolute inset-0 z-10"
                                    style={{
                                      cursor: "crosshair",
                                      background: "transparent",
                                    }}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleMouseDown(e);
                                    }}
                                    onMouseMove={(e) => {
                                      e.preventDefault();
                                      handleMouseMove(e);
                                    }}
                                    onMouseUp={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleMouseUp();
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handlePageClick(e);
                                    }}
                                    onMouseLeave={() => {
                                      if (isDrawing) {
                                        handleMouseUp();
                                      }
                                    }}
                                  />
                                )}
                                
                                {/* Annotation Overlay */}
                                <div className="absolute inset-0 pointer-events-none">
                                  {/* Render saved annotations - exclude notes (notes only show in sidebar) */}
                                  {currentPageHighlights
                                    .filter((highlight) => {
                                      // Filter out notes - they should only appear in the sidebar
                                      const isNote = highlight.annotationType.includes("Note") || highlight.annotationType.includes("Sticky");
                                      return !isNote;
                                    })
                                    .map((highlight) => {
                                      const type = highlight.annotationType;
                                      const isCommentHighlight = type.includes("CommentHighlight");
                                      const isHighlight = type.includes("Highlight") && !isCommentHighlight && !type.includes("Comment");
                                      const isRectangle = type.includes("Rectangle");
                                      const isFreeText = type.includes("FreeText");
                                      const isComment = type.includes("Comment") && !isCommentHighlight;

                                      // Rectangle annotation - with drag-to-move support
                                      if (isRectangle) {
                                        const isActive = activeAnnotationId === highlight.id;
                                        const isDragging = draggingAnnotation?.id === highlight.id;
                                        return (
                                          <div
                                            id={`annotation-${highlight.id}`}
                                            key={highlight.id}
                                            className={`absolute ${
                                              isDragging ? "cursor-grabbing opacity-70" : "cursor-grab hover:opacity-80"
                                            } ${isActive ? "ring-4 ring-blue-400 ring-opacity-75 animate-pulse" : ""}`}
                                            style={{
                                              left: `${highlight.position.x}px`,
                                              top: `${highlight.position.y}px`,
                                              width: `${highlight.position.width}px`,
                                              height: `${highlight.position.height}px`,
                                              border: `2px solid ${highlight.color}`,
                                              backgroundColor: isActive ? `${highlight.color}20` : "transparent",
                                              pointerEvents: "auto",
                                              zIndex: isDragging ? 100 : isActive ? 50 : 1,
                                              willChange: isDragging ? 'transform' : 'auto',
                                            }}
                                            onMouseDown={(e) => handleAnnotationDragStart(e, highlight)}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (!draggingAnnotation) {
                                                handleAnnotationClick(highlight);
                                              }
                                            }}
                                            title={`${highlight.comment?.text || "Rectangle"} (drag to move)`}
                                          >
                                            {/* Move indicator */}
                                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                              Drag to move
                                            </div>
                                          </div>
                                        );
                                      }

                                      // FreeText annotation
                                      if (isFreeText) {
                                        const isActive = activeAnnotationId === highlight.id;
                                        return (
                                          <div
                                            key={highlight.id}
                                            className={`absolute cursor-pointer hover:opacity-80 transition-all px-2 py-1 bg-white/90 border rounded shadow-sm ${
                                              isActive ? "ring-4 ring-blue-400 ring-opacity-75 animate-pulse" : ""
                                            }`}
                                            style={{
                                              left: `${highlight.position.x}px`,
                                              top: `${highlight.position.y}px`,
                                              color: highlight.color,
                                              borderColor: highlight.color,
                                              fontSize: "14px",
                                              maxWidth: "200px",
                                              pointerEvents: "auto",
                                              zIndex: isActive ? 50 : 1,
                                            }}
                                            onClick={(e) => { e.stopPropagation(); handleAnnotationClick(highlight); }}
                                            title={highlight.content}
                                          >
                                            {highlight.content}
                                          </div>
                                        );
                                      }

                                      // Default: Highlight and Comment annotations
                                      const isActive = activeAnnotationId === highlight.id;
                                      return (
                                        <div
                                          key={highlight.id}
                                          className={`absolute cursor-pointer hover:opacity-80 transition-all ${
                                            isCommentHighlight ? "border-2 border-yellow-400"
                                            : isHighlight ? "border-2 border-yellow-400"
                                            : isComment ? "flex items-center justify-center"
                                            : "border-2 border-gray-400"
                                          } ${isActive ? "ring-4 ring-blue-400 ring-opacity-75 animate-pulse" : ""}`}
                                          style={{
                                            left: `${highlight.position.x}px`,
                                            top: `${highlight.position.y}px`,
                                            width: isComment && !isCommentHighlight ? "24px" : `${highlight.position.width}px`,
                                            height: isComment && !isCommentHighlight ? "24px" : `${highlight.position.height}px`,
                                            backgroundColor: isComment && !isCommentHighlight ? "transparent" : isActive ? `${highlight.color}` : highlight.color,
                                            pointerEvents: "auto",
                                            zIndex: isActive ? 50 : 1,
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAnnotationClick(highlight);
                                          }}
                                          title={highlight.comment?.text || highlight.content || highlight.userName}
                                        >
                                          {/* Comment highlight - show highlight with comment icon */}
                                          {isCommentHighlight && (
                                            <div className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-md border border-white z-10">
                                              <MessageSquare className="h-2.5 w-2.5 text-white" />
                                            </div>
                                          )}
                                          {/* Pure comment - just icon */}
                                          {isComment && !isCommentHighlight && (
                                            <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                                              <MessageSquare className="h-3 w-3 text-white" />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}

                                  {/* Drawing preview while dragging - Rectangle */}
                                  {isDrawing && drawStart && drawEnd && annotationMode === "rectangle" && (
                                    <div className="absolute inset-0 z-20 pointer-events-none">
                                      <div
                                        className="absolute border-2 border-dashed"
                                        style={{
                                          left: `${Math.min(drawStart.x, drawEnd.x)}px`,
                                          top: `${Math.min(drawStart.y, drawEnd.y)}px`,
                                          width: `${Math.abs(drawEnd.x - drawStart.x)}px`,
                                          height: `${Math.abs(drawEnd.y - drawStart.y)}px`,
                                          borderColor: selectedShapeColor.value,
                                        }}
                                      />
                                    </div>
                                  )}

                                  </div>
                              </div>
                            </Document>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <LoadingSpinner />
                          <span className="ml-2">Loading PDF...</span>
                        </div>
                      )
                    ) : isDocFile && pdfError ? (
                      // Doc/Docx file conversion failed - show error with download option
                      <div className="flex items-center justify-center h-full bg-gray-50">
                        <div className="text-center p-8">
                          <FileText className="h-16 w-16 text-red-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview Not Available</h3>
                          <p className="text-gray-500 mb-4">{pdfError}</p>
                          <Button variant="outline" onClick={handleDownloadFile}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ) : isDocFile ? (
                      // Doc/Docx file is loading/converting - show loading state
                      <div className="flex items-center justify-center h-full bg-gray-50">
                        <div className="text-center">
                          <LoadingSpinner size="lg" className="mb-6" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Document...</h3>
                          <p className="text-sm text-gray-500">Preparing document for preview</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-50">
                        <div className="text-center p-8">
                          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview Not Available</h3>
                          <Button variant="outline" onClick={handleDownloadFile} className="mt-2">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Annotation Sidebar */}
            {showAnnotationSidebar && shouldShowPdfViewer && (
              <AnnotationSidebar
                highlights={sidebarHighlights}
                onHighlightClick={(h) => {
                  const fullHighlight = highlights.find((hl) => hl.id === h.id);
                  if (fullHighlight) handleAnnotationClick(fullHighlight);
                }}
                onEdit={(h) => {
                  const fullHighlight = highlights.find((hl) => hl.id === h.id);
                  if (fullHighlight) handleEditAnnotation(fullHighlight);
                }}
                onDelete={(h) => {
                  const fullHighlight = highlights.find((hl) => hl.id === h.id);
                  if (fullHighlight) handleDeleteAnnotation(fullHighlight);
                }}
                onClose={() => setShowAnnotationSidebar(false)}
              />
            )}

            {/* Edit Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Annotation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <textarea
                    className="w-full border rounded p-2 min-h-[80px]"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    autoFocus
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdit}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Add Note Dialog */}
            <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Add Document Note
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <textarea
                    className="w-full border rounded-md p-3 min-h-[120px] text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your note..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey && noteText.trim()) {
                        e.preventDefault();
                        handleAddNote();
                      }
                    }}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setNoteDialogOpen(false); setNoteText(""); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddNote} disabled={!noteText.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Add Note
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Add Comment Dialog */}
            <Dialog open={commentDialogOpen} onOpenChange={(open) => {
              setCommentDialogOpen(open);
              if (!open) {
                setCommentText("");
                setCommentPosition(null);
              }
            }}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-amber-500" />
                    Add Comment
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <textarea
                    className="w-full border rounded-md p-3 min-h-[120px] text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Enter your comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey && commentText.trim()) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-2">Press Ctrl+Enter to save</p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setCommentDialogOpen(false); setCommentText(""); setCommentPosition(null); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddComment} disabled={!commentText.trim()} className="bg-amber-500 hover:bg-amber-600 text-white">
                    Add Comment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Add FreeText Dialog */}
            <Dialog open={freeTextDialogOpen} onOpenChange={(open) => {
              setFreeTextDialogOpen(open);
              if (!open) {
                setFreeTextContent("");
                setFreeTextPosition(null);
              }
            }}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Type className="h-5 w-5 text-teal-500" />
                    Add Text
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Text Color</label>
                    <div className="flex items-center gap-2">
                      {shapeColors.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => setSelectedShapeColor(color)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            selectedShapeColor.name === color.name
                              ? "border-gray-600 scale-110"
                              : "border-transparent hover:border-gray-300"
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                  <textarea
                    className="w-full border rounded-md p-3 min-h-[120px] text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Enter your text..."
                    value={freeTextContent}
                    onChange={(e) => setFreeTextContent(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey && freeTextContent.trim()) {
                        e.preventDefault();
                        handleAddFreeText();
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-2">Press Ctrl+Enter to save</p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setFreeTextDialogOpen(false); setFreeTextContent(""); setFreeTextPosition(null); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddFreeText} disabled={!freeTextContent.trim()} className="bg-teal-500 hover:bg-teal-600 text-white">
                    Add Text
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Close Status Dialog */}
            <Dialog open={closeStatusDialogOpen} onOpenChange={setCloseStatusDialogOpen}>
              <DialogContent className="sm:max-w-[400px] [&>button]:hidden">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    Select Status Before Closing
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-gray-600">Please select a status:</p>
                  <DocumentStatusDropdown
                    value={documentStatus}
                    onValueChange={setDocumentStatus}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCloseStatusDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      await documentStatusChange(documentStatus);
                      setCloseStatusDialogOpen(false);
                      onOpenChange(false);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Close Document
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Right Panel */}
            {showRightPanel && (
              <div className={`transition-all duration-300 bg-white ${viewMode === "comments-only" || viewMode === "reviews-only" ? "w-full" : "w-1/2"}`}>
                <div className="h-full flex flex-col">
                  <div className="border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between px-4 py-2">
                      {viewMode === "split" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewMode(currentPanel === "comments" ? "comments-only" : "reviews-only")}
                          className="h-7 px-2 text-gray-500"
                        >
                          <Maximize2 className="h-3 w-3" />
                        </Button>
                      )}
                      {(viewMode === "comments-only" || viewMode === "reviews-only") && (
                        <Button variant="ghost" size="sm" onClick={() => setViewMode("split")} className="h-7 px-2 text-gray-500">
                          <Minimize2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <Tabs value={currentPanel} className="h-full">
                      <TabsContent value="reviews" className="h-full m-0 p-0">
                        <div className="h-full overflow-auto p-4 space-y-4">
                          <UniversalReviewManager
                            recordType="document"
                            recordId={documentId}
                            recordName={documentName}
                            companyId={companyId}
                            className="h-full"
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-3 border-t bg-white">
            <div className="flex items-center justify-between w-full">
              <Badge variant="outline" className="text-xs px-2 py-1">
                {viewMode === "document-only" ? "Document Only" : "Split View"}
              </Badge>
              {existingComments.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MessageSquare className="h-3 w-3" />
                  {existingComments.length} comment{existingComments.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DocumentAuditLogDialog
        open={auditLogDialogOpen}
        onOpenChange={setAuditLogDialogOpen}
        documentId={documentId}
        documentName={documentName}
      />

      {/* Selection Comment Dialog - Modern & Attractive Design */}
      <Dialog
        open={selectionPopup?.show || false}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelSelection();
          }
        }}
      >
        <DialogContent
          className="sm:max-w-[520px] !z-[10000] p-0 overflow-hidden rounded-xl border-0 shadow-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={() => handleCancelSelection()}
          style={{ pointerEvents: 'auto', zIndex: 10000 }}
        >
          {/* Gradient Header */}
          <div
            className="px-6 py-5 text-white"
            style={{ background: `linear-gradient(135deg, ${selectedHighlightColor.border} 0%, ${selectedHighlightColor.border}dd 100%)` }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-left text-xl font-bold text-white mb-1">Add Highlight & Comment</DialogTitle>
                <DialogDescription className="text-left text-white/80 text-sm">
                  Select a color and add your comment
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5 bg-gradient-to-b from-gray-50 to-white">
            {/* Color Picker */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedHighlightColor.border }}></span>
                Highlight Color
              </label>
              <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                {highlightColors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedHighlightColor(color)}
                    className={`relative w-9 h-9 rounded-full transition-all duration-200 hover:scale-110 ${
                      selectedHighlightColor.name === color.name
                        ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                        : "hover:ring-2 hover:ring-offset-1 hover:ring-gray-200"
                    }`}
                    style={{ backgroundColor: color.border }}
                    title={color.name}
                  >
                    {selectedHighlightColor.name === color.name && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected text preview */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700">Selected Text</label>
              <div
                className="p-4 rounded-xl max-h-24 overflow-auto border-l-4 bg-white shadow-sm"
                style={{ borderLeftColor: selectedHighlightColor.border, backgroundColor: `${selectedHighlightColor.border}10` }}
              >
                <p className="text-sm text-gray-700 leading-relaxed">
                  "{selectionPopup?.selectedText && selectionPopup.selectedText.length > 150
                    ? selectionPopup.selectedText.substring(0, 150) + '...'
                    : selectionPopup?.selectedText}"
                </p>
              </div>
            </div>

            {/* Comment input */}
            <div className="space-y-3" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
              <label className="text-sm font-semibold text-gray-700">Your Comment</label>
              <Textarea
                placeholder="Write your thoughts, feedback, or notes here..."
                value={selectionComment}
                onChange={(e) => setSelectionComment(e.target.value)}
                className="min-h-[120px] resize-none rounded-xl border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 bg-white shadow-sm text-gray-700 placeholder:text-gray-400"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleSaveSelectionAnnotation();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
              />
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">Ctrl</kbd>
                <span>+</span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">Enter</kbd>
                <span className="ml-1">to save quickly</span>
              </p>
            </div>
          </div>

          {/* Footer with gradient border */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleCancelSelection}
              className="px-5 rounded-lg border-gray-200 hover:bg-gray-100 text-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSelectionAnnotation}
              className="px-5 rounded-lg text-white shadow-lg hover:shadow-xl transition-all duration-200"
              style={{ backgroundColor: selectedHighlightColor.border }}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Add Comment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
