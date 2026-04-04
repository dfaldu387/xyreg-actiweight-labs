
import React, { useState, useMemo, useEffect } from "react";
import { DocumentItem, ReviewerItem } from "@/types/client";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DocumentEditDialog } from "./DocumentEditDialog";
import { DocumentDeleteButton } from "../document-list/DocumentDeleteButton";
import { supabase } from "@/integrations/supabase/client";

interface DataTableProps {
  documents: DocumentItem[];
  onEdit: (doc: DocumentItem) => void;
  onDelete: (docId: string, phaseContext?: string) => void;
  phaseOrder: string[];
  availablePhases: string[];
  onDocumentUpdated?: () => void;
  phaseContext?: string;
  companyId?: string;
  hideStatusAndReviewers?: boolean;
}

export function DataTable({ 
  documents, 
  onEdit, 
  onDelete, 
  phaseOrder,
  availablePhases,
  onDocumentUpdated,
  phaseContext,
  companyId,
  hideStatusAndReviewers = false
}: DataTableProps) {
  const [editingDocument, setEditingDocument] = useState<DocumentItem | null>(null);
  const [protectedPhaseGroups, setProtectedPhaseGroups] = useState<Set<string>>(new Set());

  // Fetch protected phase groups
  useEffect(() => {
    const fetchProtectedPhaseGroups = async () => {
      if (!companyId) return;
      
      try {
        const { data: phaseGroups, error } = await supabase
          .from('phase_groups')
          .select('id, name')
          .eq('company_id', companyId)
          .eq('name', 'Detailed Design Control Steps');
          
        if (!error && phaseGroups && phaseGroups.length > 0) {
          setProtectedPhaseGroups(new Set(phaseGroups.map(group => group.id)));
        }
      } catch (error) {
        console.error('Error fetching protected phase groups:', error);
      }
    };
    
    fetchProtectedPhaseGroups();
  }, [companyId]);

  // Check if a document belongs to a protected phase group
  const isDocumentInProtectedGroup = async (document: DocumentItem): Promise<boolean> => {
    if (!companyId || protectedPhaseGroups.size === 0) return false;
    
    try {
      // For documents in "No assigned lifecycle phase", check if they have ANY phases in protected groups
      // This is important because when removing from phases, we need to check if the document
      // originally belonged to protected phases
      if (!document.phases || document.phases.length === 0) {
        // Check if this document exists in ANY phase that belongs to a protected group
        const { data: assignments, error: assignmentError } = await supabase
          .from('phase_assigned_documents')
          .select(`
            phase_id,
            phases!phase_assigned_documents_phase_id_fkey(group_id)
          `)
          .eq('name', document.name);
          
        if (assignmentError || !assignments) return false;
        
        return assignments.some(assignment => 
          assignment.phases && typeof assignment.phases === 'object' && 
          'group_id' in assignment.phases && 
          assignment.phases.group_id && 
          protectedPhaseGroups.has(assignment.phases.group_id)
        );
      }
      
      // Get the phase IDs for the document's current phases
      const { data: phases, error } = await supabase
        .from('phases')
        .select('id, group_id')
        .eq('company_id', companyId)
        .in('name', document.phases);
        
      if (error || !phases) return false;
      
      // Check if any of the document's phases belong to protected groups
      return phases.some(phase => 
        phase.group_id && protectedPhaseGroups.has(phase.group_id)
      );
    } catch (error) {
      console.error('Error checking document protection:', error);
      return false;
    }
  };

  const sortedDocuments = useMemo(() => {
    return [...documents].sort((a, b) => a.name.localeCompare(b.name));
  }, [documents]);

  const handleEdit = (document: DocumentItem) => {
    setEditingDocument(document);
  };

  const handleEditSubmit = async () => {
    if (onDocumentUpdated) {
      onDocumentUpdated();
    }
    setEditingDocument(null);
  };

  const getTypeColor = (type: string) => {
    const colors = {
      "Standard": "bg-blue-100 text-blue-800",
      "Regulatory": "bg-green-100 text-green-800", 
      "Technical": "bg-purple-100 text-purple-800",
      "Clinical": "bg-orange-100 text-orange-800",
      "Quality": "bg-yellow-100 text-yellow-800",
      "Design": "bg-pink-100 text-pink-800"
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  // Determine if the document should show delete button
  const shouldShowDeleteButton = (document: DocumentItem) => {
    // Only show delete button for documents in "No assigned lifecycle phase"
    return phaseContext === "UNASSIGNED_DOCUMENT" || 
           !document.phases || 
           document.phases.length === 0;
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No documents to display.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Tech Applicability</TableHead>
            <TableHead>Phases</TableHead>
            {!hideStatusAndReviewers && <TableHead>Status</TableHead>}
            {!hideStatusAndReviewers && <TableHead>Reviewers</TableHead>}
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedDocuments.map((document) => (
            <TableRow key={document.id}>
              <TableCell className="font-medium">{document.name}</TableCell>
              <TableCell>
                <Badge className={getTypeColor(document.type)}>
                  {document.type}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {document.techApplicability || "All device types"}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {document.phases?.map((phase) => (
                    <Badge key={phase} variant="outline" className="text-xs">
                      {phase}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              {!hideStatusAndReviewers && (
                <TableCell>
                  <Badge variant="outline">
                    {document.status || "Not Started"}
                  </Badge>
                </TableCell>
              )}
              {!hideStatusAndReviewers && (
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {document.reviewers?.length || 0}
                    </span>
                  </div>
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(document)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {shouldShowDeleteButton(document) && (
                    <DocumentDeleteButton
                      documentId={document.id}
                      name={document.name}
                      onDelete={() => onDelete(document.id, phaseContext)}
                      phaseContext={phaseContext}
                      isPredefinedCore={document.isPredefinedCore}
                      companyId={companyId}
                      isDocumentInProtectedGroup={() => isDocumentInProtectedGroup(document)}
                    />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingDocument && (
        <DocumentEditDialog
          document={editingDocument}
          open={!!editingDocument}
          onOpenChange={(open) => !open && setEditingDocument(null)}
          onDocumentUpdated={handleEditSubmit}
          companyId={companyId || ''}
        />
      )}
    </>
  );
}
