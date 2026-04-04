import React, { useState, useEffect, useMemo } from "react";
import { DocumentEditor } from "@onlyoffice/document-editor-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileEdit, Loader2, FileWarning } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { supabase } from "@/integrations/supabase/client";

// Allowed file extensions for editing
const ALLOWED_EXTENSIONS = ["doc", "docx"];

// Supabase Edge Function URL for ONLYOFFICE callback
const SUPABASE_URL = "https://wzzkbmmgxxrfhhxggrcl.supabase.co";
const CALLBACK_URL = `${SUPABASE_URL}/functions/v1/onlyoffice-callback`;
const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public`;

// JWT Secret for ONLYOFFICE - should match the secret configured in Document Server
// For production, store this in environment variables
const ONLYOFFICE_JWT_SECRET = import.meta.env.VITE_ONLYOFFICE_JWT_SECRET || "";

const getDocumentUrl = (filePath?: string): string => {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
  const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
  return `${STORAGE_URL}/document-templates/${cleanPath}`;
};

interface OnlyOfficeEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    name: string;
    file_path?: string;
    file_name?: string;
  } | null;
  documentServerUrl?: string;
  onDocumentSaved?: (document: any) => void;
}

export function OnlyOfficeEditorDialog({
  open,
  onOpenChange,
  document,
  documentServerUrl = "", // User must configure their ONLYOFFICE server URL
  onDocumentSaved,
}: OnlyOfficeEditorDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState<string | null>(null);
  const { user } = useAuth();
  const { activeCompanyRole } = useCompanyRole();
  const activeRole = activeCompanyRole?.role;
  const canEdit = activeRole !== 'viewer';

  // Fetch or create a stable editor key from DB for collaboration
  useEffect(() => {
    if (!open || !document?.id) {
      setEditorKey(null);
      return;
    }
    const fetchOrCreateKey = async () => {
      const { data } = await supabase
        .from('document_editor_sessions')
        .select('editor_key')
        .eq('document_id', document.id)
        .single();
      if (data) {
        setEditorKey(data.editor_key);
      } else {
        const newKey = `collab-${document.id}-v1`;
        await supabase.from('document_editor_sessions').insert({
          document_id: document.id,
          editor_key: newKey,
          version: 1,
        });
        setEditorKey(newKey);
      }
    };
    fetchOrCreateKey();
  }, [open, document?.id]);

  // Get file type from file name
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

  // Get document type based on file extension
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
        return "word"; // PDFs open in word mode for viewing
      default:
        return "word";
    }
  };

  const handleDocumentReady = () => {
    console.log("Document is loaded and ready");
    setIsLoading(false);
    setError(null);
  };

  const documentUrl = getDocumentUrl(document?.file_path);
  const handleLoadComponentError = (errorCode: number, errorDescription: string) => {
    console.error("ONLYOFFICE Error:", errorCode, errorDescription);
    setIsLoading(false);
    setError(errorDescription || "Failed to load document editor");
  };

  const handleDocumentStateChange = (event: any) => {
    console.log("Document state changed:", event);
  };

  // Check if we have a valid document server URL
  const hasValidServerUrl = documentServerUrl && documentServerUrl.trim() !== "";

  // Check if the file type is allowed (only DOC and DOCX)
  const isValidFileType = useMemo(() => {
    const fileName = document?.file_name || document?.file_path || document?.name || "";
    const extension = fileName.split(".").pop()?.toLowerCase() || "";
    return ALLOWED_EXTENSIONS.includes(extension);
  }, [document]);

  // Get the file extension for display
  const fileExtension = useMemo(() => {
    const fileName = document?.file_name || document?.file_path || document?.name || "";
    return fileName.split(".").pop()?.toLowerCase() || "unknown";
  }, [document]);

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] p-0 z-[1400] overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b">
          <div className="flex items-center gap-2">
            <FileEdit className="h-5 w-5 text-primary" />
            <DialogTitle>Edit Template: {document.name}</DialogTitle>
          </div>
          {/* <DialogDescription>
            Edit your document with rich text formatting, add images, tables, and more.
          </DialogDescription> */}
        </DialogHeader>

        <div className="flex-1 h-[calc(90vh-80px)] overflow-hidden relative">
          {!isValidFileType ? (
            <div className="flex items-center justify-center h-full p-8">
              <Alert variant="destructive" className="max-w-lg">
                <FileWarning className="h-4 w-4" />
                <AlertTitle>Invalid File Type</AlertTitle>
                <AlertDescription className="mt-2 space-y-2">
                  <p>
                    The file type <strong>.{fileExtension}</strong> is not supported for editing.
                  </p>
                  <p className="text-sm">
                    Only <strong>DOC</strong> and <strong>DOCX</strong> files can be edited in the template editor.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => onOpenChange(false)}
                  >
                    Close
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          ) : !hasValidServerUrl ? (
            <div className="flex items-center justify-center h-full p-8">
              <Alert variant="destructive" className="max-w-lg">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>ONLYOFFICE Server Required</AlertTitle>
                <AlertDescription className="mt-2 space-y-2">
                  <p>
                    To use the document editor, you need to configure an ONLYOFFICE Document Server.
                  </p>
                  <p className="text-sm">
                    You can deploy ONLYOFFICE Document Server using Docker:
                  </p>
                  <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                    docker run -i -t -d -p 80:80 onlyoffice/documentserver
                  </pre>
                  <p className="text-sm mt-2">
                    Then configure the server URL in your application settings.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => window.open("https://api.onlyoffice.com/docs/docs-api/get-started/", "_blank")}
                  >
                    View Documentation
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          ) : !editorKey ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Loading editor...</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                  <Alert variant="destructive" className="max-w-lg">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Editor</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}

              <DocumentEditor
                id="onlyoffice-editor"
                documentServerUrl={documentServerUrl}
                config={{
                  document: {
                    fileType: getFileType(document.file_name || document.file_path || document.name),
                    key: editorKey!,
                    title: document.file_name || document.name || "Document",
                    url: documentUrl,
                  },
                  documentType: getDocumentType(document.file_name || document.name),
                  editorConfig: {
                    mode: canEdit ? "edit" : "view",
                    callbackUrl: canEdit && document?.file_path ? `${CALLBACK_URL}?path=${encodeURIComponent(document.file_path)}` : "",
                    user: {
                      id: user?.id || "anonymous",
                      name: [user?.user_metadata?.first_name, user?.user_metadata?.last_name].filter(Boolean).join(" ") || user?.email || "Anonymous",
                    },
                    customization: {
                      autosave: true,
                      forcesave: true,
                      features: {
                        spellcheck: {
                          mode: true,
                        },
                      },
                      goback: {
                        blank: false,
                      },
                    },
                    lang: "en",
                  },
                  events: {
                    onDocumentReady: handleDocumentReady,
                    onDocumentStateChange: handleDocumentStateChange,
                  },
                  height: "100%",
                  width: "100%",
                }}
                onLoadComponentError={handleLoadComponentError}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
