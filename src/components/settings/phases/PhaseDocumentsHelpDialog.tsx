import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Plus, Loader2, Trash2, Search, BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ConsolidatedPhase } from "@/services/consolidatedPhaseService";
import { standardDocData } from "@/data/standardDocData";

interface PhaseDocument {
  id: string;
  name: string;
  document_type: string | null;
  status: string | null;
  description: string | null;
}

interface PhaseDocumentsHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phase: ConsolidatedPhase;
  companyId: string;
}

const DOCUMENT_TYPES = [
  "SOP",
  "Work Instruction",
  "Policy",
  "Form",
  "Template",
  "Report",
  "Checklist",
  "Specification",
  "Procedure",
  "Record",
  "Other",
];

export function PhaseDocumentsHelpDialog({
  open,
  onOpenChange,
  phase,
  companyId,
}: PhaseDocumentsHelpDialogProps) {
  const [documents, setDocuments] = useState<PhaseDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: "", document_type: "SOP" });
  const [searchTerm, setSearchTerm] = useState("");
  const [showStandardDocs, setShowStandardDocs] = useState(true);
  const [addingDocName, setAddingDocName] = useState<string | null>(null);

  useEffect(() => {
    if (open && phase.id) {
      fetchDocuments();
      setSearchTerm("");
    }
  }, [open, phase.id]);

  // Get unique standard document templates, filtered by search
  const filteredStandardDocs = useMemo(() => {
    const uniqueDocs = standardDocData.filter(
      (doc, index, self) => self.findIndex(d => d.name === doc.name) === index
    );
    if (!searchTerm.trim()) return uniqueDocs;
    const term = searchTerm.toLowerCase();
    return uniqueDocs.filter(
      doc =>
        doc.name.toLowerCase().includes(term) ||
        doc.description.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  // Check which standard docs are already added
  const addedDocNames = useMemo(() => {
    return new Set(documents.map(d => d.name));
  }, [documents]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("phase_assigned_document_template")
        .select("id, name, document_type, status, description")
        .eq("phase_id", phase.id)
        .eq("company_id", companyId)
        .order("name");

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching phase documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocument = async () => {
    if (!newDoc.name.trim()) {
      toast.error("Document name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("phase_assigned_document_template")
        .insert({
          phase_id: phase.id,
          company_id: companyId,
          name: newDoc.name.trim(),
          document_type: newDoc.document_type,
          status: "not_started",
          document_scope: "company_template",
        });

      if (error) throw error;

      toast.success(`Document "${newDoc.name}" added to ${phase.name}`);
      setNewDoc({ name: "", document_type: "SOP" });
      setIsAdding(false);
      fetchDocuments();
    } catch (error) {
      console.error("Error adding document:", error);
      toast.error("Failed to add document");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddStandardDoc = async (docName: string, docDescription: string) => {
    setAddingDocName(docName);
    try {
      const { error } = await supabase
        .from("phase_assigned_document_template")
        .insert({
          phase_id: phase.id,
          company_id: companyId,
          name: docName,
          description: docDescription,
          document_type: "SOP",
          status: "not_started",
          document_scope: "company_template",
        });

      if (error) throw error;

      toast.success(`"${docName}" added to ${phase.name}`);
      fetchDocuments();
    } catch (error) {
      console.error("Error adding standard document:", error);
      toast.error("Failed to add document");
    } finally {
      setAddingDocName(null);
    }
  };

  const handleDeleteDocument = async (docId: string, docName: string) => {
    try {
      const { error } = await supabase
        .from("phase_assigned_document_template")
        .delete()
        .eq("id", docId);

      if (error) throw error;

      toast.success(`Document "${docName}" removed`);
      fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to remove document");
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "completed":
      case "approved":
        return "bg-green-100 text-green-800";
      case "in_progress":
      case "in_review":
        return "bg-yellow-100 text-yellow-800";
      case "draft":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {phase.name} — Documents
          </DialogTitle>
          <DialogDescription>
            View and manage documents assigned to this phase. Add from standard
            templates or create custom documents.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Phase Info */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Phase</span>
              <span className="font-medium">{phase.name}</span>
            </div>
            {phase.category && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Category</span>
                <Badge variant="outline" className="text-xs">
                  {phase.category.name}
                </Badge>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Documents</span>
              <span className="font-medium">{documents.length}</span>
            </div>
          </div>

          {/* Assigned Documents List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Assigned Documents</h4>
              {!isAdding && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdding(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Custom Document
                </Button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-4 border border-dashed rounded-lg">
                <FileText className="h-6 w-6 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-sm text-muted-foreground">
                  No documents assigned yet.
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add from standard templates below or create a custom document.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="group flex items-center justify-between p-2.5 rounded-md border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {doc.name}
                        </p>
                        {doc.document_type && (
                          <p className="text-xs text-muted-foreground">
                            {doc.document_type}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getStatusColor(doc.status)}`}
                      >
                        {(doc.status || "not_started").replace(/_/g, " ")}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={() => handleDeleteDocument(doc.id, doc.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Custom Document Form */}
          {isAdding && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Add Custom Document</h4>
                <div className="space-y-2">
                  <Label htmlFor="docName">Document Name</Label>
                  <Input
                    id="docName"
                    placeholder="e.g., Quality Manual, Risk Assessment..."
                    value={newDoc.name}
                    onChange={(e) =>
                      setNewDoc({ ...newDoc, name: e.target.value })
                    }
                    disabled={isSubmitting}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddDocument();
                      }
                      if (e.key === "Escape") {
                        setIsAdding(false);
                        setNewDoc({ name: "", document_type: "SOP" });
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="docType">Document Type</Label>
                  <Select
                    value={newDoc.document_type}
                    onValueChange={(value) =>
                      setNewDoc({ ...newDoc, document_type: value })
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAdding(false);
                      setNewDoc({ name: "", document_type: "SOP" });
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddDocument}
                    disabled={isSubmitting || !newDoc.name.trim()}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Document
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Standard Document Templates */}
          <div className="space-y-2">
            <button
              type="button"
              className="flex items-center gap-2 w-full text-left"
              onClick={() => setShowStandardDocs(!showStandardDocs)}
            >
              {showStandardDocs ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <BookOpen className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-medium">Standard Document Templates</h4>
              <Badge variant="secondary" className="text-xs ml-1">
                {standardDocData.filter((doc, i, self) => self.findIndex(d => d.name === doc.name) === i).length}
              </Badge>
            </button>

            {showStandardDocs && (
              <>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>

                <ScrollArea className="h-[250px] rounded-md border">
                  <div className="p-1">
                    {filteredStandardDocs.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground">
                          No templates match your search.
                        </p>
                      </div>
                    ) : (
                      filteredStandardDocs.map((doc) => {
                        const isAlreadyAdded = addedDocNames.has(doc.name);
                        const isCurrentlyAdding = addingDocName === doc.name;
                        return (
                          <div
                            key={doc.name}
                            className={`flex items-center justify-between p-2 rounded-md transition-colors ${
                              isAlreadyAdded
                                ? "bg-primary/5 opacity-60"
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                              <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-medium truncate">
                                  {doc.name}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {doc.description}
                                </p>
                              </div>
                            </div>
                            {isAlreadyAdded ? (
                              <Badge variant="secondary" className="text-xs flex-shrink-0">
                                Added
                              </Badge>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs flex-shrink-0"
                                disabled={isCurrentlyAdding}
                                onClick={() =>
                                  handleAddStandardDoc(doc.name, doc.description)
                                }
                              >
                                {isCurrentlyAdding ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
