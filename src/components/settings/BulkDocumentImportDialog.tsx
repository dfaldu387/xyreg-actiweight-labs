import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, AlertCircle, Download } from "lucide-react";
import { importCSVData, ParsedCSVRow } from "@/services/csvImportService";

interface BulkPhaseImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onImportComplete: () => void;
}

export function BulkPhaseImportDialog({
  open,
  onOpenChange,
  companyId,
  onImportComplete
}: BulkPhaseImportDialogProps) {
  const [csvData, setCsvData] = useState("");
  const [parsedData, setParsedData] = useState<ParsedCSVRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [renameExistingPhases, setRenameExistingPhases] = useState(false);

  const exportToCSV = async () => {
    try {
      console.log('Starting CSV export for company:', companyId);
      
      let actualCompanyId = companyId;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId);
      
      if (!isUUID) {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id')
          .eq('name', decodeURIComponent(companyId))
          .maybeSingle();
          
        if (companyError || !companyData) {
          console.error('Error resolving company ID:', companyError);
          toast.error('Failed to resolve company information');
          return;
        }
        actualCompanyId = companyData.id;
      }

      console.log('Using company ID for export:', actualCompanyId);
      
      const { data: phasesData, error: phasesError } = await supabase
        .from('phases')
        .select(`
          id,
          name,
          description,
          position,
          phase_categories (name)
        `)
        .eq('company_id', actualCompanyId)
        .order('position');

      if (phasesError) {
        console.error('Error fetching phases:', phasesError);
        toast.error('Failed to export phases data');
        return;
      }

      console.log('Phases data:', phasesData);

      if (!phasesData || phasesData.length === 0) {
        toast.info('No phases found to export');
        return;
      }

      const allDocuments = [];
      
      for (const phase of phasesData) {
        const { data: docsData, error: docsError } = await supabase
          .from('phase_assigned_documents')
          .select('name, document_type, status, tech_applicability')
          .eq('phase_id', phase.id);

        if (docsError) {
          console.error(`Error fetching documents for phase ${phase.name}:`, docsError);
          continue;
        }

        const categoryName = phase.phase_categories?.name || '';
        
        if (docsData && docsData.length > 0) {
          docsData.forEach(doc => {
            allDocuments.push({
              documentName: doc.name || '',
              documentType: doc.document_type || 'Standard',
              documentStatus: doc.status || 'Not Started',
              techApplicability: doc.tech_applicability || 'All device types',
              description: '',
              phaseName: phase.name || '',
              phaseDescription: phase.description || '',
              categoryName: categoryName
            });
          });
        } else {
          allDocuments.push({
            documentName: '',
            documentType: '',
            documentStatus: '',
            techApplicability: '',
            description: '',
            phaseName: phase.name || '',
            phaseDescription: phase.description || '',
            categoryName: categoryName
          });
        }
      }

      console.log('All documents for export:', allDocuments);

      const csvHeaders = 'Document Name,Document Type,Status,Tech Applicability,Description,Phase Name,Phase Description,Category Name\n';
      
      const csvRows = allDocuments.map(row => {
        return [
          `"${row.documentName}"`,
          `"${row.documentType}"`,
          `"${row.documentStatus}"`,
          `"${row.techApplicability}"`,
          `"${row.description}"`,
          `"${row.phaseName}"`,
          `"${row.phaseDescription}"`,
          `"${row.categoryName}"`
        ].join(',');
      });

      const csvContent = csvHeaders + csvRows.join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `phases_documents_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${allDocuments.length} document records`);
      
    } catch (error) {
      console.error('Error during CSV export:', error);
      toast.error('Failed to export data');
    }
  };

  const parseCSVData = (csvText: string): ParsedCSVRow[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const dataLines = lines.slice(1);
    const parsed: ParsedCSVRow[] = [];

    dataLines.forEach((line, index) => {
      if (!line.trim()) return;

      const columns = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          columns.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      columns.push(current.trim());

      if (columns.length >= 6) {
        parsed.push({
          documentName: columns[0]?.replace(/^"|"$/g, '') || '',
          documentType: columns[1]?.replace(/^"|"$/g, '') || 'Standard',
          documentStatus: columns[2]?.replace(/^"|"$/g, '') || 'Not Started',
          techApplicability: columns[3]?.replace(/^"|"$/g, '') || 'All device types',
          description: columns[4]?.replace(/^"|"$/g, '') || '',
          // CRITICAL: Preserve EXACT phase name from CSV - NO modifications
          phaseName: columns[5]?.replace(/^"|"$/g, '') || '',
          phaseDescription: columns[6]?.replace(/^"|"$/g, '') || '',
          categoryName: columns[7]?.replace(/^"|"$/g, '') || ''
        });
      }
    });

    console.log('[BulkPhaseImportDialog] Parsed CSV data with EXACT phase names:', parsed);
    return parsed;
  };

  const handlePreview = () => {
    try {
      const parsed = parseCSVData(csvData);
      setParsedData(parsed);
      setPreviewMode(true);
      
      if (parsed.length === 0) {
        toast.error('No valid data found in CSV');
      } else {
        toast.success(`Parsed ${parsed.length} rows`);
      }
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast.error('Failed to parse CSV data');
    }
  };

  const handleImport = async () => {
    if (!companyId || parsedData.length === 0) {
      toast.error('No data to import');
      return;
    }

    setIsProcessing(true);
    try {
      console.log('Starting enhanced CSV import for company:', companyId);
      
      const results = await importCSVData(parsedData, companyId, {
        renameExistingPhases
      });

      // Show detailed success message
      const summaryParts = [];
      if (results.phasesRenamed > 0) summaryParts.push(`${results.phasesRenamed} phases renamed with numbers`);
      if (results.categoriesCreated > 0) summaryParts.push(`${results.categoriesCreated} categories created`);
      if (results.phasesCreated > 0) summaryParts.push(`${results.phasesCreated} phases created`);
      if (results.phasesUpdated > 0) summaryParts.push(`${results.phasesUpdated} phases updated`);
      if (results.phasesSkipped > 0) summaryParts.push(`${results.phasesSkipped} phases skipped (identical)`);
      if (results.documentsCreated > 0) summaryParts.push(`${results.documentsCreated} documents created`);
      if (results.documentsUpdated > 0) summaryParts.push(`${results.documentsUpdated} documents updated`);
      if (results.documentsSkipped > 0) summaryParts.push(`${results.documentsSkipped} documents skipped (identical)`);

      if (summaryParts.length > 0) {
        toast.success(`Enhanced import completed: ${summaryParts.join(', ')}.`);
        onImportComplete();
        handleClose();
      } else {
        toast.info('No changes needed - all data was identical to existing records');
      }

    } catch (error) {
      console.error('Error during enhanced CSV import:', error);
      toast.error(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setCsvData("");
    setParsedData([]);
    setPreviewMode(false);
    setIsProcessing(false);
    setRenameExistingPhases(false);
    onOpenChange(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setCsvData(text);
        setPreviewMode(false);
      };
      reader.readAsText(file);
    }
  };

  const handleRenamePhaseChange = (checked: boolean | "indeterminate") => {
    setRenameExistingPhases(checked === true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Enhanced Import/Export Phases & Documents</DialogTitle>
          <DialogDescription>
            Enhanced import with phase renaming and smart update/create logic. Option to rename existing phases with numbers to match CSV format.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          <div className="flex gap-2 mb-4">
            <Button
              onClick={() => exportToCSV()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Current Data as CSV
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-file">Upload CSV File</Label>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-data">Or Paste CSV Data</Label>
            <Textarea
              id="csv-data"
              placeholder={`Document Name,Document Type,Status,Tech Applicability,Description,Phase Name,Phase Description,Category Name
"Business Case","Standard","Not Started","All device types","Initial business case document","(01) Concept & Feasibility","Initial concept development","Design Control"`}
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          <div className="flex items-center space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <Checkbox
              id="rename-phases"
              checked={renameExistingPhases}
              onCheckedChange={handleRenamePhaseChange}
              disabled={isProcessing}
            />
            <Label htmlFor="rename-phases" className="text-sm">
              <strong>Rename existing phases with numbers</strong> (e.g., "Concept & Feasibility" → "(01) Concept & Feasibility")
            </Label>
          </div>
          {renameExistingPhases && (
            <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
              This will add position-based numbers to your existing phase names to match the CSV format. Documents will then be associated with the newly numbered phases.
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={!csvData.trim() || isProcessing}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Preview Data
            </Button>
          </div>

          {previewMode && parsedData.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-2 font-medium">
                Preview ({parsedData.length} rows) - Enhanced import ready
              </div>
              <div className="max-h-60 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left">Phase</th>
                      <th className="p-2 text-left">Description</th>
                      <th className="p-2 text-left">Category</th>
                      <th className="p-2 text-left">Document</th>
                      <th className="p-2 text-left">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 10).map((row, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{row.phaseName}</td>
                        <td className="p-2">{row.phaseDescription}</td>
                        <td className="p-2">{row.categoryName}</td>
                        <td className="p-2">{row.documentName}</td>
                        <td className="p-2">{row.documentType}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 10 && (
                  <div className="p-2 text-center text-muted-foreground">
                    ...and {parsedData.length - 10} more rows
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!previewMode || parsedData.length === 0 || isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                Enhanced Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Enhanced Import {parsedData.length} Items
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { BulkPhaseImportDialog as BulkDocumentImportDialog };
