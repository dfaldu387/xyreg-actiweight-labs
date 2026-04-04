
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DocumentPhaseDialog } from "./DocumentPhaseDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DocumentCardProps {
  document: {
    id?: string;
    name: string;
    type?: string;
    status?: string;
    phases?: string[];
  };
  isExcluded: boolean;
  isLoading: boolean;
  availablePhases: string[];
  onToggle: () => Promise<void>;
  onPhaseSelect: (phases: string[]) => void;
  onUpdatePhases: (phases: string[]) => Promise<boolean>;
  showIncludeButton?: boolean;
  showExcludeButton?: boolean;
  hidePhaseEdit?: boolean;
}

export function DocumentCard({
  document,
  isExcluded,
  isLoading,
  availablePhases,
  onToggle,
  onPhaseSelect,
  onUpdatePhases,
  showIncludeButton = false,
  showExcludeButton = false,
  hidePhaseEdit = false
}: DocumentCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPhases, setSelectedPhases] = useState<string[]>(document.phases || []);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'failed'>('idle');
  
  // Update local state when document phases change from props
  useEffect(() => {
    setSelectedPhases(document.phases || []);
  }, [document.phases]);
  
  const handlePhaseDialogOpen = () => {
    setSelectedPhases(document.phases || []);
    setIsDialogOpen(true);
  };
  
  const handlePhasesChange = (phases: string[]) => {
    setSelectedPhases(phases);
    onPhaseSelect(phases);
  };
  
  const handleUpdatePhases = async (phases: string[]): Promise<boolean> => {
    setSyncStatus('syncing');
    try {
      const success = await onUpdatePhases(phases);
      
      if (success) {
        // If successful, update the document in Supabase using only phase_assigned_documents
        await syncWithDatabase(document.name, phases);
        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 2000); // Reset after showing success
      } else {
        setSyncStatus('failed');
      }
      
      return success;
    } catch (error) {
      console.error("Error updating phases:", error);
      setSyncStatus('failed');
      return false;
    }
  };
  
  // Sync the document phases with the database using only phase_assigned_documents
  const syncWithDatabase = async (documentName: string, phases: string[]): Promise<void> => {
    try {
      // Get the phase IDs for the phase names
      const { data: phaseData, error: phaseError } = await supabase
        .from('phases')
        .select('id, name')
        .in('name', phases);
        
      if (phaseError) {
        throw phaseError;
      }
      
      if (!phaseData || phaseData.length === 0) {
        console.warn("No phase data found for selected phases");
        return;
      }
      
      const phaseIds = phaseData.map(p => p.id);
      
      // Ensure the document exists in the documents table
      const { data: existingDoc, error: docCheckError } = await supabase
        .from('documents')
        .select('id')
        .eq('name', documentName)
        .maybeSingle();
        
      if (docCheckError) {
        console.error("Error checking document existence:", docCheckError);
        throw docCheckError;
      }
      
      if (!existingDoc) {
        // Document doesn't exist, create it
        const { error: docCreateError } = await supabase
          .from('documents')
          .insert({
            name: documentName,
            document_type: document.type || 'Standard',
            status: 'Not Started'
          });
          
        if (docCreateError) {
          console.error("Error creating document:", docCreateError);
          throw docCreateError;
        }
      }
      
      // Clear existing assignments and add new ones in phase_assigned_documents only
      const { error: deleteError } = await supabase
        .from('phase_assigned_documents')
        .delete()
        .eq('name', documentName);
        
      if (deleteError) {
        console.error("Error clearing existing assignments:", deleteError);
        throw deleteError;
      }
      
      // Insert new assignments
      if (phaseIds.length > 0) {
        const assignments = phaseIds.map(phaseId => ({
          phase_id: phaseId,
          name: documentName,
          status: 'Not Started',
          document_type: document.type || 'Standard'
        }));
        
        const { error: insertError } = await supabase
          .from('phase_assigned_documents')
          .insert(assignments);
          
        if (insertError) {
          console.error("Error inserting new assignments:", insertError);
          throw insertError;
        }
      }
    } catch (error) {
      console.error("Error syncing with database:", error);
      toast.error("Failed to sync document phases with database");
      throw error;
    }
  };
  
  // Sync status indicator
  const renderSyncIndicator = () => {
    if (syncStatus === 'syncing') {
      return <LoadingSpinner className="h-3 w-3 ml-1" />;
    } else if (syncStatus === 'synced') {
      return <Badge variant="outline" className="ml-1 text-xs">Synced</Badge>;
    } else if (syncStatus === 'failed') {
      return <Badge variant="destructive" className="ml-1 text-xs">Sync Failed</Badge>;
    }
    return null;
  };
  
  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex justify-between">
            <span className="truncate pr-2">{document.name}</span>
            {document.type && (
              <Badge variant="outline" className="ml-auto shrink-0">
                {document.type}
              </Badge>
            )}
          </CardTitle>
          {document.status && (
            <CardDescription className="text-xs">
              Status: {document.status}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="pb-2 flex-grow">
          {document.phases && document.phases.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium mb-1">Assigned to phases:</p>
              <div className="flex flex-wrap gap-1">
                {document.phases.map((phase) => (
                  <Badge key={phase} variant="secondary" className="text-xs">
                    {phase}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {(!document.phases || document.phases.length === 0) && (
            <p className="text-xs text-muted-foreground">Not assigned to any phases</p>
          )}
          {renderSyncIndicator()}
        </CardContent>
        <CardFooter className="pt-0">
          <div className="flex flex-col w-full space-y-2">
            <div className="flex justify-between gap-2">
              {!hidePhaseEdit && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                  onClick={handlePhaseDialogOpen}
                  disabled={isLoading}
                >
                  Manage Phases
                </Button>
              )}
              {showIncludeButton && (
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={onToggle}
                  disabled={isLoading}
                >
                  {isLoading ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
                  Include
                </Button>
              )}
              {showExcludeButton && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={onToggle}
                  disabled={isLoading}
                >
                  {isLoading ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
                  Exclude
                </Button>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
      
      <DocumentPhaseDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        document={document}
        phases={availablePhases.map(name => ({ id: name, name }))}
        onUpdatePhases={handleUpdatePhases}
      />
    </>
  );
}
