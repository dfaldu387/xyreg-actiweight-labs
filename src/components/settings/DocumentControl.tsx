
import React, { useCallback, useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhaseTemplateManager } from "./document-control/PhaseTemplateManager";
import { CompanyTemplatesList } from "./document-control/CompanyTemplatesList";
import { BulkDocumentImportDialog } from "./BulkDocumentImportDialog";
import { usePhaseTemplateManagement } from "@/hooks/usePhaseTemplateManagement";
import { initializeUserAccessForCurrentCompany } from "./document-control/utils/userAccessSetup";
import { toast } from "sonner";

interface DocumentControlProps {
  companyId?: string;
  companyName?: string;
}

/**
 * DocumentControl component for managing phase document templates with strict company isolation
 */
export function DocumentControl({ companyId, companyName }: DocumentControlProps) {
  const [showCsvImportDialog, setShowCsvImportDialog] = useState(false);
  const [accessInitialized, setAccessInitialized] = useState(false);
  
  const {
    templates,
    analysis,
    isLoading,
    assignedTemplates,
    unassignedTemplates,
    loadTemplates,
    addTemplate,
    updateTemplateAssignment,
    deleteTemplate
  } = usePhaseTemplateManagement(companyId || '');

  // Initialize user access on component mount
  useEffect(() => {
    const initializeAccess = async () => {
      if (companyName && !accessInitialized) {
        console.log("[DocumentControl] Initializing user access for company:", companyName);
        try {
          const success = await initializeUserAccessForCurrentCompany();
          setAccessInitialized(success);
          
          if (success) {
            // Refresh templates after access is granted
            await loadTemplates();
          }
        } catch (error) {
          console.error("[DocumentControl] Error initializing user access:", error);
          toast.error("Failed to initialize company access");
        }
      }
    };

    initializeAccess();
  }, [companyName, accessInitialized, loadTemplates]);

  // Enhanced document refresh callback
  const enhancedDocumentRefresh = useCallback(async () => {
    console.log("[DocumentControl] Enhanced refresh callback triggered for company:", companyId);
    try {
      await loadTemplates();
      console.log("[DocumentControl] Phase templates refreshed successfully");
    } catch (error) {
      console.error("[DocumentControl] Error during phase template refresh:", error);
    }
  }, [loadTemplates, companyId]);

  // Handle CSV export
  const handleCsvExport = useCallback(() => {
    try {
      const headers = ['Template Name', 'Document Type', 'Status', 'Tech Applicability', 'Phase Assignment', 'Assigned'];
      
      const csvData = templates.map(template => [
        template.name,
        'Standard', // Default document type
        'Not Started', // Default status
        'All device types', // Default tech applicability
        template.position?.toString() || 'Unassigned', // Use position instead of phase_name
        (template.documents && Array.isArray(template.documents) && template.documents.length > 0) ? 'Yes' : 'No' // Check if has documents instead of is_assigned
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${companyName || 'company'}-phase-templates-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Phase templates exported to CSV successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export phase templates to CSV');
    }
  }, [templates, companyName]);

  // Handle CSV import
  const handleCsvImport = useCallback(() => {
    setShowCsvImportDialog(true);
  }, []);

  if (!companyId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Phase Templates</CardTitle>
          <CardDescription>
            Company ID is required to manage phase document templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No company selected
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Document Templates */}
      <CompanyTemplatesList 
        companyId={companyId}
        companyName={companyName}
      />

      {/* Phase Document Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Phase Document Templates
                {companyName && (
                  <Badge variant="outline" className="text-xs">
                    {companyName}
                  </Badge>
                )}
                {accessInitialized && (
                  <Badge variant="default" className="text-xs bg-green-600">
                    Access Granted
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Manage phase document templates for {companyName || 'your company'} - assign templates to specific lifecycle phases or keep them unassigned for later use
              </CardDescription>
            </div>
            {analysis && (
              <div className="text-right text-sm text-muted-foreground">
                <div>Total: {analysis.totalTemplates}</div>
                <div>Assigned: {analysis.assignedTemplates}</div>
                <div>Unassigned: {analysis.unassignedTemplates}</div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <PhaseTemplateManager
            companyId={companyId}
            companyName={companyName}
            templates={templates}
            analysis={analysis}
            isLoading={isLoading}
            assignedTemplates={templates.filter(t => t.documents && Array.isArray(t.documents) && t.documents.length > 0)}
            unassignedTemplates={templates.filter(t => !t.documents || !Array.isArray(t.documents) || t.documents.length === 0)}
            onAddTemplate={addTemplate}
            onUpdateAssignment={updateTemplateAssignment}
            onDeleteTemplate={deleteTemplate}
            onRefresh={enhancedDocumentRefresh}
            onCsvExport={handleCsvExport}
            onCsvImport={handleCsvImport}
          />
        </CardContent>
      </Card>

      <BulkDocumentImportDialog
        open={showCsvImportDialog}
        onOpenChange={setShowCsvImportDialog}
        companyId={companyId}
        onImportComplete={enhancedDocumentRefresh}
      />
    </div>
  );
}
