
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { DocumentCard } from "./DocumentCard";
import { PhaseDocument } from "@/types/phaseDocuments";

interface AdditionalDocumentsProps {
  phaseId: string;
  phaseName: string;
  onAddDocument: (name: string) => Promise<boolean>;
  availablePhases: string[];
}

export function AdditionalDocuments({
  phaseId,
  phaseName,
  onAddDocument,
  availablePhases
}: AdditionalDocumentsProps) {
  const [newDocName, setNewDocName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [additionalDocs, setAdditionalDocs] = useState<PhaseDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch additional (custom) documents when the phase changes
  useEffect(() => {
    if (!phaseId) return;
    
    const fetchAdditionalDocs = async () => {
      setIsLoading(true);
      try {
        // Get documents that were manually added (not part of recommended docs)
        const { data, error } = await supabase
          .from('phase_assigned_documents')
          .select('*')
          .eq('phase_id', phaseId);
          
        if (error) {
          throw error;
        }
        
        // Convert to the expected format
        const docs: PhaseDocument[] = (data || []).map(doc => ({
          id: doc.id,
          name: doc.name,
          status: doc.status as any || "Not Started",
          type: doc.document_type || "Custom",
          phases: doc.phases ? doc.phases.map((p: any) => String(p)) : [],
          classes: doc.classes ? doc.classes.map((c: any) => String(c)) : []
        }));
        
        setAdditionalDocs(docs);
      } catch (error) {
        console.error("Error fetching additional documents:", error);
        toast.error("Failed to load custom documents");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAdditionalDocs();
    
    // Set up real-time subscription for phase_assigned_documents
    const channel = supabase
      .channel('additional-docs-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'phase_assigned_documents',
          filter: `phase_id=eq.${phaseId}`
        }, 
        () => {
          fetchAdditionalDocs();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [phaseId]);

  const handleAddDocument = async () => {
    if (!newDocName.trim()) {
      toast.error("Please enter a document name");
      return;
    }
    
    setIsAdding(true);
    try {
      const success = await onAddDocument(newDocName.trim());
      if (success) {
        setNewDocName("");
        // Refetch documents instead of manually updating state
        // This ensures consistency with the database
      }
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleToggleDocument = async () => {
    // This is just a placeholder - we don't toggle additional documents
    return Promise.resolve();
  };
  
  const handlePhaseSelect = (phases: string[]) => {
    // Update phases for the document (if needed)
  };
  
  const handleUpdatePhases = async (phases: string[]): Promise<boolean> => {
    // Implementation for updating phases
    try {
      // This would be implemented to update phases for a specific document
      return true;
    } catch (error) {
      console.error("Error updating phases:", error);
      return false;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Additional Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex space-x-2">
          <Input
            placeholder="Enter document name"
            value={newDocName}
            onChange={(e) => setNewDocName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddDocument()}
          />
          <Button 
            onClick={handleAddDocument} 
            disabled={isAdding || !newDocName.trim()}
          >
            {isAdding ? "Adding..." : "Add"}
          </Button>
        </div>
        
        {isLoading ? (
          <div className="text-center py-4">Loading additional documents...</div>
        ) : additionalDocs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {additionalDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                isExcluded={false}
                isLoading={false}
                availablePhases={availablePhases}
                onToggle={handleToggleDocument}
                onPhaseSelect={handlePhaseSelect}
                onUpdatePhases={handleUpdatePhases}
                hidePhaseEdit={false}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No additional documents added yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
