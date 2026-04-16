import React, { useState, useEffect } from "react";
import { DocumentEditor } from "@onlyoffice/document-editor-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  FileEdit,
  Loader2,
  X,
  PenTool,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Clock,
  User,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ReAuthContent } from "@/components/esign/components/ReAuthContent";
import { ESignService } from "@/components/esign/lib/esign.service";
import { AuditTrailDrawer } from "@/components/esign/components/AuditTrailDrawer";
import { useDocumentReviewAssignments } from "@/hooks/useDocumentReviewAssignments";
import type { ESignRecord, AuthMethod } from "@/components/esign/lib/esign.types";
import { DocumentExportService } from "@/services/documentExportService";
import type { DocumentTemplate, DocumentSection, ProductContext, DocumentControl, RevisionHistory, AssociatedDocument } from "@/types/documentComposer";

const STORAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public`;
const CALLBACK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onlyoffice-callback`;

// Preload OnlyOffice SDK script so it's cached before user opens a document
const ONLYOFFICE_SERVER = import.meta.env.VITE_ONLYOFFICE_SERVER_URL || "";
if (ONLYOFFICE_SERVER && typeof window !== "undefined") {
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "script";
  link.href = `${ONLYOFFICE_SERVER}/web-apps/apps/api/documents/api.js`;
  document.head.appendChild(link);
}

const getDocumentUrl = (filePath?: string): string => {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
  const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
  return `${STORAGE_URL}/document-templates/${cleanPath}`;
};

const getFileType = (fileName?: string): string => {
  if (!fileName) return "docx";
  const extension = fileName.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "doc":
    case "docx":
      return "docx";
    case "xls":
    case "xlsx":
      return "xlsx";
    case "ppt":
    case "pptx":
      return "pptx";
    case "pdf":
      return "pdf";
    default:
      return "docx";
  }
};

const getDocumentType = (fileName?: string): string => {
  if (!fileName) return "word";
  const extension = fileName.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "doc":
    case "docx":
      return "word";
    case "xls":
    case "xlsx":
      return "cell";
    case "ppt":
    case "pptx":
      return "slide";
    case "pdf":
      return "word";
    default:
      return "word";
  }
};

const SIGNATURE_MEANINGS = [
  { value: "reviewer", label: "Reviewer — I have reviewed this document" },
  { value: "approver", label: "Approver — I approve this document" },
  { value: "author", label: "Author — I authored this document" },
  { value: "other", label: "Other" },
];

const AUTH_METHOD_LABELS: Record<string, string> = {
  password_reauth: "Password Re-Authentication",
  totp_authenticator: "Google Authenticator (TOTP)",
  email_otp: "Email OTP Verification",
};

// Review decision step: 'decision' | 'sign' | 'reauth' | 'complete'
type ReviewStep = "decision" | "sign" | "reauth" | "complete";

interface OnlyOfficeReviewViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentName: string;
  companyId: string;
  reviewerGroupId: string;
  userRole?: 'review' | 'author' | 'approver';
  isAlsoApprover?: boolean;
  documentFile?: {
    path: string;
    name: string;
    size: number;
    type: string;
  } | null;
}

export function OnlyOfficeReviewViewer({
  open,
  onOpenChange,
  documentId,
  documentName,
  companyId,
  reviewerGroupId,
  userRole,
  isAlsoApprover,
  documentFile,
}: OnlyOfficeReviewViewerProps) {
  const { user } = useAuth();
  const [editorKey, setEditorKey] = useState<string | null>(null);
  const [viewerVisible, setViewerVisible] = useState(true);

  // Active role can switch from 'review' → 'approver' within the same session
  const [activeRole, setActiveRole] = useState(userRole);
  React.useEffect(() => { setActiveRole(userRole); }, [userRole]);

  // Review decision state
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewStep, setReviewStep] = useState<ReviewStep>("decision");
  const [reviewComments, setReviewComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // E-Signature state (for approve flow)
  const [fullLegalName, setFullLegalName] = useState("");
  const getDefaultMeaning = (role?: string) => role === 'approver' ? 'approver' : role === 'author' ? 'author' : 'reviewer';
  const [signatureMeaning, setSignatureMeaning] = useState(() => getDefaultMeaning(activeRole));
  const isMeaningLocked = activeRole === 'review' || activeRole === 'approver';

  // Update meaning when activeRole changes or when dialog opens
  React.useEffect(() => {
    if (open) {
      setSignatureMeaning(getDefaultMeaning(activeRole));
    }
  }, [open, activeRole]);
  const [customMeaning, setCustomMeaning] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const [signatureRecord, setSignatureRecord] = useState<ESignRecord | null>(null);
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null);
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  const { assignments, updateAssignmentStatus } = useDocumentReviewAssignments(documentId);

  // Live file info — re-fetched from DB each time the viewer opens so we never show a stale file.
  const [liveFile, setLiveFile] = useState<{ path: string; name: string; size: number; type: string } | null>(null);

  const documentServerUrl = import.meta.env.VITE_ONLYOFFICE_SERVER_URL || "/api/onlyoffice/";
  const hasServerUrl = !!documentServerUrl;

  const filePath = liveFile?.path ?? documentFile?.path;
  const fileName = liveFile?.name ?? documentFile?.name ?? documentName;
  const fileType = getFileType(fileName || filePath || documentName);
  const documentUrl = getDocumentUrl(filePath);

  const userName = user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim()
    : user?.email || "Unknown";
  const userEmail = user?.email || "";

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  const effectiveMeaning = signatureMeaning === "other" ? customMeaning : signatureMeaning;

  // Re-fetch latest file info + editor key from DB each time the viewer opens.
  // This ensures the reviewer always sees the latest uploaded file, even if the
  // parent page rendered with stale props or the author re-sent while the page was open.
  useEffect(() => {
    if (!open || !documentId) {
      setEditorKey(null);
      setLiveFile(null);
      return;
    }
    setViewerVisible(true);
    const cleanDocId = documentId.startsWith("template-") ? documentId.replace("template-", "") : documentId;
    const isTemplate = documentId.startsWith("template-");

    const init = async () => {
      // 1. Fetch the latest file info from the DB
      let latestFilePath: string | undefined;
      if (isTemplate) {
        const { data: docRow } = await supabase
          .from('phase_assigned_document_template')
          .select('file_path, file_name, file_size, file_type, company_id, updated_at')
          .eq('id', cleanDocId)
          .single();
        if (docRow?.file_path) {
          latestFilePath = docRow.file_path;
          setLiveFile({
            path: docRow.file_path,
            name: docRow.file_name || documentName,
            size: docRow.file_size || 0,
            type: docRow.file_type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          });

          // Use a stable key based on file path + updated_at so OnlyOffice can
          // reuse its cached conversion when the file hasn't changed.
          // Key format must stay as review-{docId}-{digits} for callback parsing.
          const keyBase = `${docRow.file_path}-${docRow.updated_at || ''}`;
          let hash = 0;
          for (let i = 0; i < keyBase.length; i++) {
            hash = ((hash << 5) - hash + keyBase.charCodeAt(i)) | 0;
          }
          const stableKey = `review-${cleanDocId}-${(Math.abs(hash) + 1000000000000).toString().slice(0, 13)}`;

          // Upsert editor key in parallel — no need to await before setting state
          supabase.from('document_editor_sessions').upsert({
            document_id: cleanDocId,
            editor_key: stableKey,
            version: 1,
          }, { onConflict: 'document_id' });
          setEditorKey(stableKey);
          return;
        } else if (docRow) {
          // No file attached — try to export draft from document_studio_templates
          const cid = docRow.company_id || companyId;
          const { data: draftRow } = await supabase
            .from('document_studio_templates')
            .select('*')
            .eq('company_id', cid)
            .eq('template_id', cleanDocId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (draftRow && Array.isArray(draftRow.sections) && draftRow.sections.length > 0) {
            const template: DocumentTemplate = {
              id: draftRow.template_id,
              name: draftRow.name,
              type: draftRow.type,
              sections: draftRow.sections as unknown as DocumentSection[],
              productContext: (draftRow.product_context || { productName: '', productType: '' }) as unknown as ProductContext,
              documentControl: draftRow.document_control as unknown as DocumentControl,
              revisionHistory: (Array.isArray(draftRow.revision_history) ? draftRow.revision_history : []) as unknown as RevisionHistory[],
              associatedDocuments: (Array.isArray(draftRow.associated_documents) ? draftRow.associated_documents : []) as unknown as AssociatedDocument[],
              metadata: (draftRow.metadata || { version: '1.0', lastUpdated: new Date(), estimatedCompletionTime: '' }) as unknown as DocumentTemplate['metadata'],
            };

            const docxBlob = await DocumentExportService.generateDocxBlob(template);
            const timestamp = Date.now();
            const storagePath = `${cid}/${cleanDocId}/review-draft-${timestamp}.docx`;
            const fName = `${draftRow.name || documentName}.docx`;

            const { error: uploadError } = await supabase.storage
              .from('document-templates')
              .upload(storagePath, docxBlob, {
                contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                upsert: false,
              });

            if (!uploadError) {
              await supabase
                .from('phase_assigned_document_template')
                .update({
                  file_path: storagePath,
                  file_name: fName,
                  file_size: docxBlob.size,
                  file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                })
                .eq('id', cleanDocId);

              latestFilePath = storagePath;
              setLiveFile({
                path: storagePath,
                name: fName,
                size: docxBlob.size,
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              });
            } else {
            }
          } else {
          }
        }
      }

      // Fallback: generate a new editor key for non-template docs or draft exports
      const newKey = `review-${cleanDocId}-${Date.now()}`;

      await supabase.from('document_editor_sessions').upsert({
        document_id: cleanDocId,
        editor_key: newKey,
        version: 1,
      }, { onConflict: 'document_id' });
      setEditorKey(newKey);
    };

    init();
  }, [open, documentId]);

  // Reset review dialog state when it opens
  useEffect(() => {
    if (showReviewDialog) {
      setReviewStep("decision");
      setReviewComments("");
      setFullLegalName("");
      setSignatureMeaning(getDefaultMeaning(activeRole));
      setCustomMeaning("");
      setSignatureRecord(null);
      setAuthMethod(null);
    }
  }, [showReviewDialog]);

  const handleCloseClick = () => {
    setViewerVisible(false);
    setShowReviewDialog(true);
  };

  const handleContinueReviewing = () => {
    setShowReviewDialog(false);
    setViewerVisible(true);
  };

  const handleActualClose = () => {
    setShowReviewDialog(false);
    setViewerVisible(true);
    onOpenChange(false);
  };

  const updateDocumentStatus = async (newStatus: string, clearReviewers = false) => {
    const cleanDocId = documentId.startsWith("template-") ? documentId.replace("template-", "") : documentId;
    const payload: Record<string, any> = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === "Approved") payload.approval_date = new Date().toISOString();
    if (clearReviewers) {
      payload.reviewer_group_ids = [];
      payload.reviewer_user_ids = [];
    }
    await supabase.from("phase_assigned_document_template").update(payload as any).eq("id", cleanDocId);
    await supabase.from("documents").update(payload as any).eq("id", cleanDocId);
  };

  const saveReviewerDecision = async (decision: string, comment?: string) => {
    const cleanDocId = documentId.startsWith("template-") ? documentId.replace("template-", "") : documentId;
    await supabase
      .from("document_reviewer_decisions")
      .upsert({
        document_id: cleanDocId,
        reviewer_id: user?.id,
        reviewer_group_id: reviewerGroupId,
        decision,
        comment: comment || `Status changed to ${decision}`,
        updated_at: new Date().toISOString(),
      }, { onConflict: "document_id,reviewer_id" });
  };

  const handleRejectOrChanges = async (decision: "rejected" | "needs_changes") => {
    if (!reviewComments.trim()) {
      toast.error("Please provide comments for your decision");
      return;
    }
    setIsSubmitting(true);
    try {
      const assignment = assignments.find((a) => a.reviewer_group_id === reviewerGroupId);
      if (assignment) {
        const status = decision === "rejected" ? "rejected" : "in_review";
        await updateAssignmentStatus(assignment.id, status as any, reviewerGroupId);
      }

      // Save individual reviewer decision
      const decisionValue = decision === "rejected" ? "rejected" : "changes_requested";
      await saveReviewerDecision(decisionValue, reviewComments.trim());

      // Update document status + clear reviewer_group_ids so author can re-send
      const docStatus = decision === "rejected" ? "Rejected" : "Changes Requested";
      await updateDocumentStatus(docStatus, true);

      // Save review note
      const cleanDocId = documentId.startsWith("template-") ? documentId.replace("template-", "") : documentId;
      const isTemplate = documentId.startsWith("template-");
      const notePayload = isTemplate
        ? { template_document_id: cleanDocId, reviewer_id: user?.id, note: reviewComments.trim() }
        : { document_id: cleanDocId, reviewer_id: user?.id, note: reviewComments.trim() };

      await supabase.from("document_review_notes").insert(notePayload);

      toast.success(decision === "rejected" ? "Document rejected" : "Changes requested");
      handleActualClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveClick = () => {
    setReviewStep("sign");
  };

  const handleSignClick = () => {
    if (!fullLegalName.trim()) {
      toast.error("Please enter your full legal name");
      return;
    }
    if (signatureMeaning === "other" && !customMeaning.trim()) {
      toast.error("Please enter a custom meaning");
      return;
    }
    setReviewStep("reauth");
  };

  const handleAuthenticated = async (method: AuthMethod) => {
    setIsSigning(true);
    setAuthMethod(method);
    try {
      const documentHash = await ESignService.computeDocumentHash(filePath || documentId);

      // Log audit event
      await ESignService.logAuditEvent(
        documentId,
        null,
        user?.id || "",
        "signature_applied",
        { meaning: effectiveMeaning, auth_method: method, full_legal_name: fullLegalName }
      );

      // Create signature record (direct review signing — no request/signer)
      const cleanDocId = documentId.startsWith("template-") ? documentId.replace("template-", "") : documentId;
      const { data: record, error: signError } = await supabase
        .from("esign_records")
        .insert({
          user_id: user?.id,
          document_id: cleanDocId,
          document_hash: documentHash,
          meaning: effectiveMeaning,
          user_agent: navigator.userAgent,
          auth_method: method,
          full_legal_name: fullLegalName,
        })
        .select()
        .single();

      if (signError) {
        console.error("[Review] Failed to create signature record:", signError);
        throw signError;
      }

      // Save individual reviewer decision
      await saveReviewerDecision(
        activeRole === 'approver' ? "approved" : "reviewed",
        reviewComments.trim() || (activeRole === 'approver' ? "Approved and signed" : "Reviewed and signed")
      );

      // Update review assignment to completed
      // Check both group-based and individual user assignments
      const assignment = assignments.find((a) => a.reviewer_group_id === reviewerGroupId)
        || assignments.find((a) => (a as any).reviewer_user_id === user?.id);
      if (assignment) {
        await updateAssignmentStatus(assignment.id, "completed", assignment.reviewer_group_id || '');
      }

      // Determine new status: check if ALL reviewers AND ALL approvers have completed
      {
        const cleanId = documentId.startsWith("template-") ? documentId.replace("template-", "") : documentId;

        // 1. Fetch the document's reviewer + approver lists
        const { data: docData } = await supabase
          .from('phase_assigned_document_template')
          .select('reviewer_user_ids, reviewer_group_ids, approver_user_ids, approver_group_ids')
          .eq('id', cleanId)
          .maybeSingle();

        // 2. Build full set of expected reviewer + approver user IDs (individual + group members)
        const expectedReviewerIds = new Set<string>(
          Array.isArray(docData?.reviewer_user_ids) ? docData.reviewer_user_ids : []
        );
        const expectedApproverIds = new Set<string>(
          Array.isArray(docData?.approver_user_ids) ? docData.approver_user_ids : []
        );
        const allGroupIds = [
          ...(Array.isArray(docData?.reviewer_group_ids) ? docData.reviewer_group_ids : []),
          ...(Array.isArray(docData?.approver_group_ids) ? docData.approver_group_ids : []),
        ];
        if (allGroupIds.length > 0) {
          const { data: members } = await supabase
            .from('reviewer_group_members_new')
            .select('user_id, group_id')
            .in('group_id', allGroupIds)
            .eq('is_active', true);
          const reviewerGroupIds = new Set(Array.isArray(docData?.reviewer_group_ids) ? docData.reviewer_group_ids : []);
          const approverGroupIds = new Set(Array.isArray(docData?.approver_group_ids) ? docData.approver_group_ids : []);
          (members || []).forEach(m => {
            if (reviewerGroupIds.has(m.group_id)) expectedReviewerIds.add(m.user_id);
            if (approverGroupIds.has(m.group_id)) expectedApproverIds.add(m.user_id);
          });
        }

        // 3. Fetch all existing decisions for this document
        const { data: allDecisions } = await supabase
          .from('document_reviewer_decisions')
          .select('reviewer_id, decision')
          .eq('document_id', cleanId);

        const completedReviewerIds = new Set(
          (allDecisions || [])
            .filter(d => d.decision === 'reviewed' || d.decision === 'approved')
            .map(d => d.reviewer_id)
        );
        const completedApproverIds = new Set(
          (allDecisions || [])
            .filter(d => d.decision === 'approved')
            .map(d => d.reviewer_id)
        );

        // 4. Check completion
        const allReviewersDone = expectedReviewerIds.size > 0
          ? Array.from(expectedReviewerIds).every(uid => completedReviewerIds.has(uid))
          : true;
        const allApproversDone = expectedApproverIds.size > 0
          ? Array.from(expectedApproverIds).every(uid => completedApproverIds.has(uid))
          : true;

        if (allReviewersDone && allApproversDone) {
          await updateDocumentStatus("Approved");
        } else {
          // Stay in review — don't change status away from In Review
          await updateDocumentStatus("In Review");
        }
      }

      // Save review note if comments were provided
      if (reviewComments.trim()) {
        const cleanDocId = documentId.startsWith("template-") ? documentId.replace("template-", "") : documentId;
        const isTemplate = documentId.startsWith("template-");
        const notePayload = isTemplate
          ? { template_document_id: cleanDocId, reviewer_id: user?.id, note: reviewComments.trim() }
          : { document_id: cleanDocId, reviewer_id: user?.id, note: reviewComments.trim() };
        await supabase.from("document_review_notes").insert(notePayload);
      }

      setSignatureRecord((record as ESignRecord) || null);
      setReviewStep("complete");
      toast.success(activeRole === 'approver' ? "Document approved and signed successfully" : "Document reviewed and signed successfully");
    } catch (err: any) {
      console.error("[Review] Signing error:", err);
      toast.error("Failed to apply signature. Please try again.");
    } finally {
      setIsSigning(false);
    }
  };

  if (!open) return null;

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const signedAt = signatureRecord?.signed_at ? new Date(signatureRecord.signed_at) : new Date();

  return (
    <>
      {/* Main viewer */}
      <Dialog open={open && viewerVisible} onOpenChange={() => handleCloseClick()}>
        <DialogContent
          className="max-w-[1500px] w-[80vw] h-[85vh] p-0 m-0 rounded-lg [&>button:last-child]:hidden"
        >
          <DialogHeader className="px-4 py-3 border-b flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FileEdit className="h-5 w-5 text-primary shrink-0" />
              <DialogTitle className="text-base font-semibold truncate">
                {documentName}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Document review viewer
              </DialogDescription>
              {documentFile && (
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {fileType.toUpperCase()}
                  {documentFile.size ? ` · ${formatFileSize(documentFile.size)}` : ""}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseClick}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex overflow-hidden" style={{ height: "calc(85vh - 57px)" }}>
            <div className="flex-1 overflow-hidden">
              {!hasServerUrl ? (
                <div className="flex items-center justify-center h-full p-8">
                  <Alert variant="destructive" className="max-w-lg">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>OnlyOffice Server Required</AlertTitle>
                    <AlertDescription>
                      Document preview is not available. The OnlyOffice Document Server
                      is not configured. Please contact your administrator.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : !editorKey ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !filePath ? (
                <div className="flex items-center justify-center h-full p-8">
                  <Alert className="max-w-lg">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Preview Not Available</AlertTitle>
                    <AlertDescription>
                      No file is attached to this document. The document has not been drafted in Document Studio yet. Please ask the author to create the draft and re-send for review.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <DocumentEditor
                  id={`review-editor-${documentId}`}
                  documentServerUrl={documentServerUrl}
                  config={{
                    document: {
                      fileType: getFileType(fileName || filePath || documentName),
                      key: editorKey,
                      title: fileName || documentName || "Document",
                      url: documentUrl,
                      permissions: {
                        edit: false,
                        comment: true,
                        download: true,
                        print: true,
                        review: false,
                      },
                    },
                    documentType: getDocumentType(fileName || documentName),
                    editorConfig: {
                      mode: "edit",
                      callbackUrl: filePath ? `${CALLBACK_URL}?path=${encodeURIComponent(filePath)}` : "",
                      user: {
                        id: user?.id || "anonymous",
                        name: userName,
                      },
                      customization: {
                        autosave: true,
                        forcesave: true,
                        goback: { blank: false },
                      },
                      lang: "en",
                    },
                    height: "100%",
                    width: "100%",
                  }}
                  onLoadComponentError={(errorCode: number, errorDescription: string) => {
                    console.error("ONLYOFFICE Error:", errorCode, errorDescription);
                  }}
                />
              )}
            </div>

          </div>
        </DialogContent>
      </Dialog>

      {/* Review Decision Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={(open) => {
        setShowReviewDialog(open);
        if (!open) {
          // Dismissed via X / escape — close the entire viewer so parent state resets
          handleActualClose();
        }
      }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5 text-primary" />
              {reviewStep === "decision" && (activeRole === 'approver' ? "Approval Decision" : "Review Decision")}
              {reviewStep === "sign" && (activeRole === 'approver' ? "E-Signature — Approve Document" : "E-Signature — Review Document")}
              {reviewStep === "complete" && "Signature Applied"}
            </DialogTitle>
            <DialogDescription>
              {reviewStep === "decision" && (activeRole === 'approver' ? `Provide your approval decision for "${documentName}"` : `Provide your review decision for "${documentName}"`)}
              {reviewStep === "sign" && (activeRole === 'approver' ? "Sign to confirm your approval per FDA 21 CFR Part 11" : "Sign to confirm your review per FDA 21 CFR Part 11")}
              {reviewStep === "complete" && "Your signature has been recorded"}
            </DialogDescription>
          </DialogHeader>

          {/* Step: Decision */}
          {reviewStep === "decision" && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Comments</Label>
                <Textarea
                  placeholder="Enter your review comments..."
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {activeRole === 'approver' ? (
                  <Button
                    onClick={handleApproveClick}
                    className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve & Sign
                  </Button>
                ) : (
                  <Button
                    onClick={handleApproveClick}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Review & Sign
                  </Button>
                )}
                <Button
                  onClick={() => handleRejectOrChanges("needs_changes")}
                  disabled={isSubmitting || !reviewComments.trim()}
                  variant="outline"
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 gap-2"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                  Request Changes
                </Button>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={handleContinueReviewing}>
                  Continue Reviewing
                </Button>
                <Button variant="outline" onClick={handleActualClose}>
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Step: E-Signature Form */}
          {reviewStep === "sign" && (
            <div className="space-y-6 py-2">
              {/* Signature Form */}
              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <PenTool className="h-4 w-4 text-primary" />
                  Electronic Signature
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Full Legal Name *
                    </Label>
                    <Input
                      value={fullLegalName}
                      onChange={(e) => setFullLegalName(e.target.value)}
                      placeholder="Type your full legal name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Meaning of Signature *
                    </Label>
                    <Select value={signatureMeaning} onValueChange={setSignatureMeaning} disabled={isMeaningLocked}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SIGNATURE_MEANINGS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {signatureMeaning === "other" && (
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs text-muted-foreground">Custom Meaning *</Label>
                      <Input
                        value={customMeaning}
                        onChange={(e) => setCustomMeaning(e.target.value)}
                        placeholder="Enter custom meaning of signature"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Date
                    </Label>
                    <Input value={dateStr} disabled className="bg-muted" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Time
                    </Label>
                    <Input value={timeStr} disabled className="bg-muted" />
                  </div>
                </div>
              </div>

              {/* Part 11 Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-xs text-blue-800">
                  By signing, you confirm that the information above is accurate. Your electronic signature is legally
                  equivalent to a handwritten signature per FDA 21 CFR Part 11. You will be required to re-authenticate
                  before your signature is applied.
                </p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setReviewStep("decision")} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleSignClick}
                  size="lg"
                  className="gap-2"
                  disabled={isSigning || !fullLegalName.trim()}
                >
                  {isSigning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PenTool className="h-4 w-4" />
                  )}
                  {isSigning ? "Applying Signature..." : activeRole === 'approver' ? "Sign & Approve" : "Sign & Complete Review"}
                </Button>
              </div>
            </div>
          )}

          {/* Step: Re-Authentication (inline) */}
          {reviewStep === "reauth" && (
            <div className="py-2">
              <ReAuthContent
                email={user?.email || ''}
                onAuthenticated={handleAuthenticated}
                onCancel={() => setReviewStep("sign")}
                active={true}
              />
            </div>
          )}

          {/* Step: Complete */}
          {reviewStep === "complete" && (
            <div className="space-y-6 py-2">
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-800">{activeRole === 'approver' ? "Document Approved & Signed" : "Document Reviewed & Signed"}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Signed by <span className="font-medium text-foreground">{fullLegalName}</span> on {dateStr} at {timeStr}
                </p>
              </div>

              {/* Signature Metadata */}
              <div className="border rounded-lg divide-y">
                <div className="px-4 py-3 bg-muted/30">
                  <h4 className="text-sm font-semibold">Signature Record</h4>
                  <p className="text-xs text-muted-foreground">This record is immutable and cannot be modified</p>
                </div>
                <div className="px-4 py-3 flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Signer</p>
                    <p className="text-sm">{fullLegalName} ({userEmail})</p>
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Meaning</p>
                    <p className="text-sm">{effectiveMeaning}</p>
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Timestamp (UTC)</p>
                    <p className="text-sm">{signedAt.toISOString()}</p>
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Authentication Method</p>
                    <p className="text-sm">{authMethod ? AUTH_METHOD_LABELS[authMethod] || authMethod : "Unknown"}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button variant="outline" onClick={() => setShowAuditTrail(true)} className="gap-2">
                  <Shield className="h-4 w-4" />
                  View Audit Trail
                </Button>
                <div className="flex gap-2">
                  {/* If user just reviewed and is also an approver, show "Proceed to Approve" */}
                  {activeRole === 'review' && isAlsoApprover && (
                    <Button
                      variant="default"
                      className="gap-2 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        // Switch to approver mode and reset dialog for approval flow
                        setActiveRole('approver');
                        setReviewStep("decision");
                        setReviewComments("");
                        setFullLegalName("");
                        setSignatureMeaning("approver");
                        setCustomMeaning("");
                        setSignatureRecord(null);
                        setAuthMethod(null);
                      }}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Proceed to Approve
                    </Button>
                  )}
                  <Button onClick={handleActualClose} variant={activeRole === 'review' && isAlsoApprover ? "outline" : "default"} className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {activeRole === 'review' && isAlsoApprover ? "Close" : "Close"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Audit Trail Drawer */}
      <AuditTrailDrawer
        open={showAuditTrail}
        onOpenChange={setShowAuditTrail}
        documentId={documentId}
        documentName={documentName}
      />
    </>
  );
}
