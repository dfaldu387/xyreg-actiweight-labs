
import React, { useState } from "react";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { DocumentReviewersList } from "./DocumentReviewersList";
import { FileText, Calendar, UserPlus, Edit, FolderOpen } from "lucide-react";
import { formatDate } from "@/lib/date";
import { DocumentDraftDrawer } from './DocumentDraftDrawer';
// AssignReviewersDialog removed for template instances
import { getDocumentType, validateDocumentForContext } from "@/utils/documentTypeUtils";
import { useComplianceSections } from "@/hooks/useComplianceSections";
import { toast } from "sonner";

interface PhaseDocumentListProps {
  documents: any[];
  onDocumentUpdated: (document: any) => void;
  companyId?: string;
  productId?: string;
}

export function PhaseDocumentList({ documents, onDocumentUpdated, companyId, productId }: PhaseDocumentListProps) {
  const [draftDrawerDocument, setDraftDrawerDocument] = useState<any | null>(null);

  // Fetch sections for displaying section names
  const { sections } = useComplianceSections(companyId);

  // Helper function to get section names from section_ids
  const getSectionNames = (document: any): string[] => {
    if (!document.section_ids || !Array.isArray(document.section_ids) || document.section_ids.length === 0) {
      return [];
    }
    return document.section_ids
      .map((id: string) => sections.find(s => s.id === id)?.name)
      .filter(Boolean) as string[];
  };
  
  const handleEditDocument = (document: any) => {
    console.log("PhaseDocumentList: Attempting to edit document:", document.name);
    
    if (!productId || !companyId) {
      console.error("PhaseDocumentList: Missing productId or companyId");
      toast.error("Cannot edit document: missing product or company information");
      return;
    }

    // Determine document type using centralized utility
    const typeInfo = getDocumentType(document);
    console.log("PhaseDocumentList: Document type analysis:", typeInfo);

    if (!typeInfo.isValid) {
      console.error("PhaseDocumentList: Invalid document structure:", typeInfo.reason);
      toast.error(`Cannot edit document: ${typeInfo.reason}`);
      return;
    }

    // Company templates cannot be edited from product document lists
    if (typeInfo.type === 'company-template') {
      console.error("PhaseDocumentList: Cannot edit company template from product context");
      toast.error("Company templates cannot be edited from this view. Please use the company settings page.");
      return;
    }

    // Validate document for this product context
    const validation = validateDocumentForContext(document, typeInfo.type, productId);
    if (!validation.isValid) {
      console.error("PhaseDocumentList: Document validation failed:", validation.error);
      toast.error(`Cannot edit document: ${validation.error}`);
      return;
    }

    console.log("PhaseDocumentList: Document validation passed, opening draft drawer");
    setDraftDrawerDocument(document);
  };
  
  const handleAssignReviewers = (document: any) => {
    console.log("PhaseDocumentList: Attempting to assign reviewers to document:", document.name);
    
    if (!companyId || !productId) {
      console.error("PhaseDocumentList: Missing companyId or productId");
      toast.error("Cannot assign reviewers: missing company or product information");
      return;
    }

    // Determine document type using centralized utility
    const typeInfo = getDocumentType(document);
    console.log("PhaseDocumentList: Document type analysis for reviewers:", typeInfo);

    if (!typeInfo.isValid) {
      console.error("PhaseDocumentList: Invalid document structure:", typeInfo.reason);
      toast.error(`Cannot assign reviewers: ${typeInfo.reason}`);
      return;
    }

    // Company templates cannot have reviewers assigned from product document lists
    if (typeInfo.type === 'company-template') {
      console.error("PhaseDocumentList: Cannot assign reviewers to company template from product context");
      toast.error("Company templates cannot be modified from this view. Please use the company settings page.");
      return;
    }

    // Validate document for this product context
    const validation = validateDocumentForContext(document, typeInfo.type, productId);
    if (!validation.isValid) {
      console.error("PhaseDocumentList: Document validation failed for reviewers:", validation.error);
      toast.error(`Cannot assign reviewers: ${validation.error}`);
      return;
    }

    console.log("PhaseDocumentList: Document validation passed, opening draft drawer for reviewers");
    setDraftDrawerDocument(document);
  };
  
  // Helper function to get the deadline from either due_date or deadline field
  const getDocumentDeadline = (document: any) => {
    return document.deadline || document.due_date || null;
  };

  // Helper function to get the document type for dialogs (excludes company-template)
  const getProductDocumentType = (document: any): "product-specific" | "template-instance" | null => {
    const typeInfo = getDocumentType(document);
    if (typeInfo.type === 'company-template') {
      return null; // Cannot be edited from product context
    }
    return typeInfo.type as "product-specific" | "template-instance";
  };
  
  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Document</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Reviewers</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((document) => {
              const deadline = getDocumentDeadline(document);
              const typeInfo = getDocumentType(document);
              const canEditInProductContext = typeInfo.type !== 'company-template';
              const hasDraggableFile = !!document.file_path;

              // Drag handlers for Gemini sidebar
              const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>) => {
                if (!hasDraggableFile) {
                  e.preventDefault();
                  return;
                }
                e.dataTransfer.setData('application/json', JSON.stringify({
                  id: document.id,
                  name: document.name,
                  file_path: document.file_path,
                  document_type: document.document_type,
                  phase_name: document.phase_name,
                }));
                e.dataTransfer.effectAllowed = 'copy';
                (e.target as HTMLElement).style.opacity = '0.5';
              };

              const handleDragEnd = (e: React.DragEvent<HTMLTableRowElement>) => {
                (e.target as HTMLElement).style.opacity = '1';
              };

              return (
                <TableRow
                  key={document.id}
                  draggable={hasDraggableFile}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  className={hasDraggableFile ? 'cursor-grab active:cursor-grabbing' : ''}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{document.name}</span>
                      {typeInfo.isValid && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          typeInfo.type === 'template-instance' 
                            ? 'bg-blue-100 text-blue-700' 
                            : typeInfo.type === 'company-template'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {typeInfo.type === 'template-instance' ? 'Template' : 
                           typeInfo.type === 'company-template' ? 'Company' : 'Product'}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getSectionNames(document).length > 0 ? (
                      <div className="flex items-center gap-1 text-sm">
                        <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{getSectionNames(document).join(', ')}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DocumentStatusBadge status={document.status} />
                  </TableCell>
                  <TableCell>
                    {deadline ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(deadline)}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No deadline</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DocumentReviewersList document={document} companyId={companyId} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleAssignReviewers(document)}
                        disabled={!companyId || !productId || !typeInfo.isValid || !canEditInProductContext}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleEditDocument(document)}
                        disabled={!productId || !companyId || !typeInfo.isValid || !canEditInProductContext}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      {/* Document Draft Drawer */}
      <DocumentDraftDrawer
        open={!!draftDrawerDocument}
        onOpenChange={(open) => {
          if (!open) {
            setDraftDrawerDocument(null);
            onDocumentUpdated({});
          }
        }}
        documentId={draftDrawerDocument?.id || ''}
        documentName={draftDrawerDocument?.name || ''}
        documentType={draftDrawerDocument?.document_type || 'Standard'}
        productId={productId || ''}
        companyId={companyId || ''}
        onDocumentSaved={() => {
          setDraftDrawerDocument(null);
          onDocumentUpdated({});
        }}
        filePath={draftDrawerDocument?.file_path}
        fileName={draftDrawerDocument?.file_name}
      />
      
      {/* Assign Reviewers Dialog removed for template instances */}
    </>
  );
}
