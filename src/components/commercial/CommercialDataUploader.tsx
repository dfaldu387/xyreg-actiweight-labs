import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { Upload, Download, FileCheck, Info, AlertCircle } from "lucide-react";
import { CSVCommercialDataParser } from "@/services/csvCommercialDataParser";

interface CommercialDataUploaderProps {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommercialDataUploader({ companyId, open, onOpenChange }: CommercialDataUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();
  const { lang } = useTranslation();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setValidationErrors([]);
    
    try {
      // Read and parse CSV file
      const fileContent = await file.text();
      const parseResult = CSVCommercialDataParser.parseCSV(fileContent);
      
      if (parseResult.errors.length > 0) {
        const errorMessages = parseResult.errors.map(
          error => `Row ${error.row}, ${error.field}: ${error.message}${error.value ? ` (value: "${error.value}")` : ''}`
        );
        setValidationErrors(errorMessages);
        
        toast({
          title: "Validation failed",
          description: `Found ${parseResult.errors.length} errors in your CSV file. Please check the details below.`,
          variant: "destructive",
        });
        return;
      }

      // Show warnings if any
      if (parseResult.warnings.length > 0) {
        toast({
          title: "Upload warnings",
          description: parseResult.warnings.join('; '),
          variant: "default",
        });
      }

      // Upload data to database
      const uploadResult = await CSVCommercialDataParser.uploadCommercialData(parseResult.data, companyId);
      
      if (uploadResult.failed > 0) {
        toast({
          title: "Partial upload success",
          description: `Successfully uploaded ${uploadResult.success} records, ${uploadResult.failed} failed. Check console for details.`,
          variant: "default",
        });
        console.error('Upload errors:', uploadResult.errors);
      } else {
        toast({
          title: "Upload successful",
          description: `Successfully processed ${uploadResult.success} records from ${file.name}`,
        });
      }
      
      onOpenChange(false);
      setFile(null);
      setValidationErrors([]);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "There was an unexpected error processing your file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create enhanced CSV template with proper documentation
    const headers = [
      'Product ID',
      'Product Name',
      'Platform',
      'Category',
      'Market Code',
      'Period (YYYY-MM)',
      'Actual Revenue',
      'Actual COGS',
      'Units Sold',
      'Attributed Revenue',
      'Currency Code'
    ];
    
    const sampleData = [
      'prod_001,"Hearing Aid Pro","Core Platform","Hearing Aids","EU","2024-07",125000,75000,250,15000,"EUR"',
      'prod_002,"Cochlear Implant X","Advanced Platform","Implants","US","2024-07",450000,270000,45,,"USD"',
      'prod_003,"Replacement Battery","Accessory","Accessories","EU","2024-07",5000,2000,1000,,"EUR"'
    ];
    
    const documentation = [
      '# COMMERCIAL DATA UPLOAD TEMPLATE',
      '# ',
      '# FIELD DEFINITIONS:',
      '# - Product ID: Unique identifier for your product (required)',
      '# - Product Name: Display name of the product',
      '# - Platform: Product platform or family name',
      '# - Category: Product category (e.g., Hearing Aids, Implants, Accessories)',
      '# - Market Code: Market where revenue was generated (EU, US, CA, AU, JP, UK, DE, FR)',
      '# - Period (YYYY-MM): Revenue period in YYYY-MM format (e.g., 2024-07)',
      '# - Actual Revenue: Total revenue amount in local currency',
      '# - Actual COGS: Cost of goods sold in local currency', 
      '# - Units Sold: Number of units sold in this period',
      '# - Attributed Revenue: Revenue from accessories/consumables attributed to this main product (optional)',
      '# - Currency Code: Currency for revenue/COGS (EUR, USD, CAD, AUD, JPY, GBP)',
      '# ',
      '# ATTRIBUTED REVENUE EXPLANATION:',
      '# For medical devices, main products often generate ongoing revenue through:',
      '# - Replacement parts (batteries, filters, tubing)',
      '# - Consumables (electrode arrays, programming accessories)',
      '# - Service contracts and warranties',
      '# ',
      '# Use "Attributed Revenue" to track revenue from accessories/consumables that should',
      '# be credited to the main product for strategic analysis. Leave blank if not applicable.',
      '# ',
      '# EXAMPLE: A hearing aid (main product) generates €125,000 direct revenue',
      '# plus €15,000 from replacement batteries and service contracts.',
      '# Enter 125000 in "Actual Revenue" and 15000 in "Attributed Revenue".',
      '# ',
      '',
    ];
    
    const csvContent = [
      ...documentation,
      headers.join(','),
      ...sampleData
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'commercial_data_template.csv';
    a.click();
    
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{lang('commercialUploader.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <FileCheck className="h-4 w-4" />
            <AlertDescription>
              {lang('commercialUploader.uploadDescription')}
            </AlertDescription>
          </Alert>

          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>{lang('commercialUploader.attributedRevenue')}:</strong> {lang('commercialUploader.attributedRevenueDesc')}
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">{lang('commercialUploader.selectCsvFile')}</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>

            {file && (
              <div className="text-sm text-muted-foreground">
                {lang('commercialUploader.selected')}: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}

            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">{lang('commercialUploader.validationErrors')}:</div>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {validationErrors.map((error, index) => (
                        <div key={index} className="text-xs font-mono">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {lang('commercialUploader.downloadTemplate')}
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isUploading}
              >
                {lang('common.cancel')}
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {isUploading ? lang('commercialUploader.uploading') : lang('commercialUploader.upload')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}