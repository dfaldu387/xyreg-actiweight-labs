import React, { useState } from "react";
import { Download, Upload, FileText, AlertCircle, Check, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { GapAnalysisTemplate, ImportanceLevel, TemplateScope, GapTemplateImportData, GapTemplateImportItem } from "@/types/gapAnalysisTemplate";

interface GapTemplateImportProps {
  onImport: (template: GapAnalysisTemplate) => void;
}

export function GapTemplateImport({ onImport }: GapTemplateImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateFramework, setTemplateFramework] = useState("");
  const [templateImportance, setTemplateImportance] = useState<ImportanceLevel>("medium");
  const [templateScope, setTemplateScope] = useState<TemplateScope>("product");
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [showFormatHelp, setShowFormatHelp] = useState(false);
  const [parsedData, setParsedData] = useState<GapTemplateImportItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setUploadError(null);
        
        // Extract name from file for template name
        const baseName = selectedFile.name.replace('.csv', '');
        setTemplateName(baseName);
        
        // Preview the CSV content
        try {
          const text = await selectedFile.text();
          const parsedItems = parseCSV(text);
          setParsedData(parsedItems);
          setShowPreview(true);
        } catch (error) {
          console.error("Error parsing CSV:", error);
          setUploadError("Error parsing CSV file. Please check the format.");
        }
      } else {
        setFile(null);
        setUploadError("Please select a CSV file");
        setParsedData([]);
        setShowPreview(false);
      }
    }
  };
  
  const parseCSV = (csvText: string): GapTemplateImportItem[] => {
    // Basic CSV parsing (in a real app, use a robust CSV parser)
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Check if required header exists
    if (!headers.includes('Requirement')) {
      throw new Error('CSV must include a "Requirement" column');
    }
    
    const items: GapTemplateImportItem[] = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Skip empty lines
      
      const values = lines[i].split(',').map(v => v.trim());
      const item: GapTemplateImportItem = {
        requirement: '',
        checklistItems: []
      };
      
      // Map columns to appropriate fields
      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        switch (header) {
          case 'Requirement':
            item.requirement = value.replace(/^"|"$/g, ''); // Remove quotes if present
            break;
          case 'Section':
            item.section = value;
            break;
          case 'Clause ID':
            item.clauseId = value;
            break;
          case 'Clause Summary':
            item.clauseSummary = value.replace(/^"|"$/g, '');
            break;
          case 'Documentation':
            if (value) {
              item.checklistItems.push({
                description: value.replace(/^"|"$/g, ''),
                category: 'documentation'
              });
            }
            break;
          case 'Verification':
            if (value) {
              item.checklistItems.push({
                description: value.replace(/^"|"$/g, ''),
                category: 'verification'
              });
            }
            break;
          case 'Compliance Method':
            if (value) {
              item.checklistItems.push({
                description: value.replace(/^"|"$/g, ''),
                category: 'compliance'
              });
            }
            break;
        }
      });
      
      // Only add item if it has a requirement
      if (item.requirement) {
        items.push(item);
      }
    }
    
    return items;
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/gap-analysis-template.csv';
    link.download = 'gap-analysis-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Template downloaded successfully");
  };
  
  const handleImport = async () => {
    if (isManualEntry) {
      if (!templateName || !templateDescription || !templateFramework) {
        setUploadError("Please fill in all required fields");
        return;
      }
      
      // Create a template from manual entry
      const newTemplate: GapAnalysisTemplate = {
        id: `custom-${Date.now()}`,
        name: templateName,
        framework: templateFramework,
        description: templateDescription,
        importance: templateImportance,
        scope: templateScope,
        isActive: true,
        isCustom: true,
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      onImport(newTemplate);
      toast.success("Template created successfully");
      return;
    }
    
    if (!file) {
      setUploadError("Please select a CSV file");
      return;
    }
    
    try {
      setIsUploading(true);
      
      // In a real implementation, we would process the actual parsed data
      // For now, we'll create a template with the file name
      const template: GapAnalysisTemplate = {
        id: `custom-${Date.now()}`,
        name: templateName || file.name.replace('.csv', ''),
        framework: templateFramework || "Custom Framework",
        description: templateDescription || `Imported from ${file.name}`,
        importance: templateImportance,
        scope: templateScope,
        isActive: true,
        isCustom: true,
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      onImport(template);
      setIsUploading(false);
      toast.success("Template imported successfully");
      setShowPreview(false);
      
    } catch (error) {
      console.error("Error importing template:", error);
      setUploadError("Failed to import template");
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button 
          variant={isManualEntry ? "default" : "outline"} 
          size="sm" 
          onClick={() => {
            setIsManualEntry(false);
            setUploadError(null);
          }}
        >
          CSV Import
        </Button>
        <Button 
          variant={isManualEntry ? "outline" : "default"} 
          size="sm" 
          onClick={() => {
            setIsManualEntry(true);
            setUploadError(null);
          }}
        >
          Manual Entry
        </Button>
      </div>
      
      {!isManualEntry && (
        <Alert className="bg-muted/50">
          <Info className="h-4 w-4" />
          <AlertTitle>CSV Format Instructions</AlertTitle>
          <AlertDescription>
            <p className="mb-2">Your CSV file must include a <strong>Requirement</strong> column and can include these optional columns:</p>
            <div className="flex justify-between">
              <Button 
                variant="link" 
                onClick={() => setShowFormatHelp(!showFormatHelp)} 
                className="p-0 h-auto text-xs"
              >
                {showFormatHelp ? "Hide format details" : "Show format details"}
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleDownloadTemplate} 
                className="flex items-center gap-2 text-xs"
              >
                <Download className="h-3 w-3" />
                Download Template
              </Button>
            </div>
            
            <Collapsible open={showFormatHelp} className="mt-2">
              <CollapsibleContent>
                <div className="text-xs space-y-2 mt-2 bg-background p-3 rounded-md">
                  <p className="font-medium">Required columns:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong>Requirement</strong>: The regulatory requirement text</li>
                  </ul>
                  <p className="font-medium mt-2">Optional columns:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong>Section</strong>: The section number in the regulatory document</li>
                    <li><strong>Clause ID</strong>: Specific clause identifier</li>
                    <li><strong>Clause Summary</strong>: Brief summary of the clause</li>
                    <li><strong>Documentation</strong>: Required documentation (creates a checklist item)</li>
                    <li><strong>Verification</strong>: Verification method (creates a checklist item)</li>
                    <li><strong>Compliance Method</strong>: Method to ensure compliance (creates a checklist item)</li>
                  </ul>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </AlertDescription>
        </Alert>
      )}
      
      {isManualEntry ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input 
              id="template-name" 
              placeholder="Enter template name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="template-framework">Regulatory Framework</Label>
            <Input 
              id="template-framework" 
              placeholder="E.g., MDR, ISO, IEC"
              value={templateFramework}
              onChange={(e) => setTemplateFramework(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea 
              id="template-description" 
              placeholder="Describe the purpose of this template"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="csv-upload">Upload CSV</Label>
          <div className="flex items-center gap-2">
            <Input 
              id="csv-upload" 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange} 
            />
          </div>
          {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{file.name}</span>
            </div>
          )}
        </div>
      )}
      
      {showPreview && parsedData.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Data Preview</CardTitle>
            <CardDescription>
              Showing {Math.min(3, parsedData.length)} of {parsedData.length} requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3">
            <div className="text-xs space-y-3 max-h-40 overflow-y-auto">
              {parsedData.slice(0, 3).map((item, idx) => (
                <div key={idx} className="border-b pb-2 last:border-0 last:pb-0">
                  <p className="font-medium">{item.requirement}</p>
                  {item.section && <span className="text-muted-foreground mr-2">Section: {item.section}</span>}
                  {item.clauseId && <span className="text-muted-foreground">ID: {item.clauseId}</span>}
                </div>
              ))}
              {parsedData.length > 3 && (
                <p className="text-muted-foreground italic">
                  ... and {parsedData.length - 3} more items
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="importance">Importance</Label>
          <Select 
            value={templateImportance} 
            onValueChange={(value) => setTemplateImportance(value as ImportanceLevel)}
          >
            <SelectTrigger id="importance">
              <SelectValue placeholder="Select importance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">Recommended Strongly</SelectItem>
              <SelectItem value="medium">Recommended Medium</SelectItem>
              <SelectItem value="low">Recommended Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="scope">Scope</Label>
          <Select 
            value={templateScope} 
            onValueChange={(value) => setTemplateScope(value as TemplateScope)}
          >
            <SelectTrigger id="scope">
              <SelectValue placeholder="Select scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="company">Company-Wide</SelectItem>
              <SelectItem value="product">Product-Specific</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Import Error</AlertTitle>
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-end">
        <Button 
          onClick={handleImport} 
          disabled={isUploading || (!isManualEntry && !file)}
          className="gap-2"
        >
          {isUploading ? (
            <>Loading...</>
          ) : (
            <>
              <Check className="h-4 w-4" />
              {isManualEntry ? "Create Template" : "Import Template"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
