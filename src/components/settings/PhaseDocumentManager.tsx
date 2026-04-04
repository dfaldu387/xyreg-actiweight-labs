
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Save, X } from "lucide-react";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PhaseDocument {
  id: string;
  name: string;
  status: string;
  document_type: string;
}

interface PhaseDocumentManagerProps {
  phaseId: string;
  phaseName: string;
}

export function PhaseDocumentManager({ phaseId, phaseName }: PhaseDocumentManagerProps) {
  const [documents, setDocuments] = useState<PhaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newDocName, setNewDocName] = useState("");
  const [editingDoc, setEditingDoc] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (phaseId) {
      fetchDocuments();
    }
  }, [phaseId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('phase_assigned_documents')
        .select('*')
        .eq('phase_id', phaseId)
        .order('name');

      if (fetchError) {
        throw fetchError;
      }

      setDocuments(data || []);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError(err instanceof Error ? err.message : "Failed to load documents");
      toast.error("Failed to load phase documents");
    } finally {
      setLoading(false);
    }
  };

  const addDocument = async () => {
    if (!newDocName.trim()) {
      toast.error("Please enter a document name");
      return;
    }

    try {
      setIsAdding(true);
      
      const { error: insertError } = await supabase
        .from('phase_assigned_documents')
        .insert({
          phase_id: phaseId,
          name: newDocName.trim(),
          status: 'Not Started',
          document_type: 'Standard'
        });

      if (insertError) {
        throw insertError;
      }

      toast.success("Document added successfully");
      setNewDocName("");
      await fetchDocuments();
    } catch (err) {
      console.error("Error adding document:", err);
      toast.error("Failed to add document");
    } finally {
      setIsAdding(false);
    }
  };

  const updateDocument = async (docId: string, newName: string) => {
    if (!newName.trim()) {
      toast.error("Document name cannot be empty");
      return;
    }

    try {
      setIsUpdating(true);
      
      const { error: updateError } = await supabase
        .from('phase_assigned_documents')
        .update({ name: newName.trim() })
        .eq('id', docId);

      if (updateError) {
        throw updateError;
      }

      toast.success("Document updated successfully");
      setEditingDoc(null);
      setEditingName("");
      await fetchDocuments();
    } catch (err) {
      console.error("Error updating document:", err);
      toast.error("Failed to update document");
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteDocument = async (docId: string, docName: string) => {
    if (!confirm(`Are you sure you want to delete "${docName}"?`)) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('phase_assigned_documents')
        .delete()
        .eq('id', docId);

      if (deleteError) {
        throw deleteError;
      }

      toast.success("Document deleted successfully");
      await fetchDocuments();
    } catch (err) {
      console.error("Error deleting document:", err);
      toast.error("Failed to delete document");
    }
  };

  const updateStatus = async (docId: string, newStatus: string) => {
    try {
      const { error: updateError } = await supabase
        .from('phase_assigned_documents')
        .update({ status: newStatus })
        .eq('id', docId);

      if (updateError) {
        throw updateError;
      }

      toast.success("Status updated successfully");
      await fetchDocuments();
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents for {phaseName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add new document */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter document name"
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addDocument()}
            />
            <Button onClick={addDocument} disabled={isAdding}>
              {isAdding ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
              Add
            </Button>
          </div>

          {/* Documents list */}
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  {editingDoc === doc.id ? (
                    <div className="flex gap-2 flex-1">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            updateDocument(doc.id, editingName);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => updateDocument(doc.id, editingName)}
                        disabled={isUpdating}
                      >
                        {isUpdating ? <LoadingSpinner className="h-3 w-3" /> : <Save className="h-3 w-3" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingDoc(null);
                          setEditingName("");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium">{doc.name}</span>
                      <Badge variant="outline">{doc.document_type}</Badge>
                      <select
                        value={doc.status}
                        onChange={(e) => updateStatus(doc.id, e.target.value)}
                        className="px-2 py-1 border rounded text-sm"
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Not Required">Not Required</option>
                      </select>
                    </>
                  )}
                </div>

                {editingDoc !== doc.id && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingDoc(doc.id);
                        setEditingName(doc.name);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteDocument(doc.id, doc.name)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {documents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No documents assigned to this phase yet.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
