
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Papa from "papaparse";
import { CompanyDocumentTemplateImportService } from "@/services/companyDocumentTemplateImportService";
import { supabase } from "@/integrations/supabase/client";

interface PhaseImportDialogProps {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface PhaseImportRow {
  "Category Name": string;
  "Phase Name": string;
  "Phase Description": string;
  "Position": string;
  "Status": string;
  "Phase Type": string;
}

export function PhaseImportDialog({
  companyId,
  open,
  onOpenChange,
  onImportComplete
}: PhaseImportDialogProps) {
  const [csvData, setCsvData] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [detectedDelimiter, setDetectedDelimiter] = useState<string>("");

  // Detect CSV delimiter (comma vs semicolon for European Excel)
  const detectDelimiter = (csvText: string): string => {
    const lines = csvText.trim().split('\n').slice(0, 3); // Check first 3 lines
    let commaCount = 0;
    let semicolonCount = 0;
    
    lines.forEach(line => {
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (!inQuotes) {
          if (char === ',') commaCount++;
          if (char === ';') semicolonCount++;
        }
      }
    });
    
    const delimiter = semicolonCount > commaCount ? ';' : ',';
    console.log(`[PhaseImport] Detected delimiter: "${delimiter}" (commas: ${commaCount}, semicolons: ${semicolonCount})`);
    return delimiter;
  };

  // Parse CSV with automatic delimiter detection
  const parseCSVWithDetection = (csvText: string): PhaseImportRow[] => {
    const delimiter = detectDelimiter(csvText);
    setDetectedDelimiter(delimiter);
    
    const result = Papa.parse<PhaseImportRow>(csvText, {
      header: true,
      delimiter: delimiter,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim()
    });

    if (result.errors.length > 0) {
      console.error('[PhaseImport] Parse errors:', result.errors);
    }

    console.log(`[PhaseImport] Parsed ${result.data.length} rows using delimiter "${delimiter}"`);
    return result.data;
  };

  // Validate phase CSV data structure
  const validatePhaseCSVData = (data: PhaseImportRow[]): { isValid: boolean; errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (data.length === 0) {
      errors.push('No valid rows found in CSV');
      return { isValid: false, errors, warnings };
    }

    console.log(`[PhaseImport] Validating ${data.length} parsed rows`);

    // Check for required columns
    const requiredColumns = ["Category Name", "Phase Name", "Position"];
    const firstRow = data[0];
    
    for (const column of requiredColumns) {
      if (!(column in firstRow)) {
        errors.push(`Missing required column: "${column}"`);
      }
    }

    // Validate each row
    data.forEach((row, index) => {
      if (!row["Phase Name"] || !row["Phase Name"].trim()) {
        errors.push(`Row ${index + 1}: Phase Name is required`);
      }
      if (!row["Category Name"] || !row["Category Name"].trim()) {
        errors.push(`Row ${index + 1}: Category Name is required`);
      }
      
      const position = row["Position"];
      if (!position || isNaN(parseInt(position))) {
        errors.push(`Row ${index + 1}: Position must be a valid number`);
      }

      const status = row["Status"];
      if (status && !["Active", "Available"].includes(status)) {
        warnings.push(`Row ${index + 1}: Status "${status}" will be treated as "Available"`);
      }
    });

    console.log(`[PhaseImport] Validation complete - ${errors.length} errors, ${warnings.length} warnings`);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setCsvData(text);
        
        // Parse and validate to show preview
        try {
          const parsed = parseCSVWithDetection(text);
          const validation = validatePhaseCSVData(parsed);
          
          if (validation.warnings.length > 0) {
            toast.warning(`File loaded with warnings: ${validation.warnings.join(', ')}`);
          } else if (validation.errors.length > 0) {
            toast.error(`File has errors: ${validation.errors.slice(0, 2).join(', ')}`);
          } else {
            toast.success(`File loaded successfully with ${parsed.length} phases (delimiter: ${detectedDelimiter})`);
          }
        } catch (error) {
          console.error('Error parsing uploaded file:', error);
          toast.error('Error parsing CSV file');
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleCsvChange = (value: string) => {
    setCsvData(value);
    
    // Parse and validate for immediate feedback
    if (value.trim()) {
      try {
        const parsed = parseCSVWithDetection(value);
        const validation = validatePhaseCSVData(parsed);
        
        if (validation.errors.length === 0) {
          console.log(`[PhaseImport] Manual CSV valid: ${parsed.length} phases (delimiter: ${detectedDelimiter})`);
        }
      } catch (error) {
        console.error('Error parsing manual CSV:', error);
      }
    }
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast.error("Please provide CSV data");
      return;
    }

    setImporting(true);
    try {
      console.log('[PhaseImport] Starting import process');
      
      // Parse CSV data with delimiter detection
      const parsedData = parseCSVWithDetection(csvData);
      
      // Validate the parsed data
      const validation = validatePhaseCSVData(parsedData);
      
      if (!validation.isValid) {
        toast.error(`CSV validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      if (validation.warnings.length > 0) {
        console.warn('[PhaseImport] Validation warnings:', validation.warnings);
      }

      // Import phases to database
      console.log(`[PhaseImport] Importing ${parsedData.length} phases`);
      
      // Process each phase row
      const results = {
        success: 0,
        skipped: 0,
        errors: 0
      };

      for (const row of parsedData) {
        try {
          // First, ensure category exists or create it
          const { data: existingCategory, error: categoryFetchError } = await supabase
            .from('phase_categories')
            .select('id')
            .eq('name', row["Category Name"].trim())
            .eq('company_id', companyId)
            .single();

          let categoryId: string;

          if (categoryFetchError && categoryFetchError.code === 'PGRST116') {
            // Category doesn't exist, create it
            const { data: newCategory, error: categoryCreateError } = await supabase
              .from('phase_categories')
              .insert({
                name: row["Category Name"].trim(),
                company_id: companyId,
                is_system_category: false
              })
              .select('id')
              .single();

            if (categoryCreateError) {
              console.error('Error creating category:', categoryCreateError);
              results.errors++;
              continue;
            }
            categoryId = newCategory.id;
          } else if (categoryFetchError) {
            console.error('Error fetching category:', categoryFetchError);
            results.errors++;
            continue;
          } else {
            categoryId = existingCategory.id;
          }

          // Check if phase already exists
          const { data: existingPhase } = await supabase
            .from('company_phases')
            .select('id')
            .eq('name', row["Phase Name"].trim())
            .eq('company_id', companyId)
            .single();

          if (existingPhase) {
            console.log(`[PhaseImport] Phase "${row["Phase Name"]}" already exists, skipping`);
            results.skipped++;
            continue;
          }

          // Create the phase
          const { error: phaseError } = await supabase
            .from('company_phases')
            .insert({
              name: row["Phase Name"].trim(),
              description: row["Phase Description"]?.trim() || null,
              company_id: companyId,
              category_id: categoryId,
              position: parseInt(row["Position"]) || 0,
              duration_days: 30 // Default duration
            });

          if (phaseError) {
            console.error('Error creating phase:', phaseError);
            results.errors++;
          } else {
            results.success++;
          }

        } catch (error) {
          console.error('Error processing phase row:', error);
          results.errors++;
        }
      }

      console.log('[PhaseImport] Import completed:', results);
      
      if (results.success > 0) {
        toast.success(`Successfully imported ${results.success} phases${results.skipped > 0 ? ` (${results.skipped} skipped)` : ''}${results.errors > 0 ? ` (${results.errors} errors)` : ''}`);
        onImportComplete();
        onOpenChange(false);
      } else {
        toast.error(`Import failed: ${results.errors} errors, ${results.skipped} duplicates`);
      }

    } catch (error) {
      console.error('Import error:', error);
      toast.error("Failed to import phases");
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setCsvData("");
    setFile(null);
    setDetectedDelimiter("");
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Phases from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Expected CSV format with columns:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li><strong>Category Name</strong> - Phase category (required)</li>
              <li><strong>Phase Name</strong> - Name of the phase (required)</li>
              <li><strong>Phase Description</strong> - Optional description</li>
              <li><strong>Position</strong> - Numeric position for ordering (required)</li>
              <li><strong>Status</strong> - "Active" or "Available" (optional, defaults to Available)</li>
              <li><strong>Phase Type</strong> - "System Phase" or "Custom Phase" (optional)</li>
            </ul>
            <p className="mt-2 text-xs text-blue-600">
              ✓ Supports both comma (,) and semicolon (;) delimiters automatically
            </p>
            {detectedDelimiter && (
              <p className="mt-1 text-xs text-green-600">
                Detected delimiter: <code>"{detectedDelimiter}"</code>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload CSV File</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={importing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-data">Or Paste CSV Data</Label>
            <Textarea
              id="csv-data"
              placeholder="Paste your CSV data here..."
              value={csvData}
              onChange={(e) => handleCsvChange(e.target.value)}
              rows={10}
              disabled={importing}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleReset} disabled={importing}>
              Clear
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={importing || !csvData.trim()}>
              {importing ? 'Importing...' : 'Import Phases'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
