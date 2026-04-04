import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  FileText, 
  Database,
  Check,
  AlertCircle,
  Info,
  Settings,
  RefreshCw
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface UDIExportDialogProps {
  companyId: string;
  onClose: () => void;
}

interface ExportConfig {
  format: 'CSV' | 'XML' | 'JSON' | 'Excel';
  database: 'GUDID' | 'EUDAMED' | 'Both';
  includeBasicUDI: boolean;
  includeProductUDI: boolean;
  includeRegulatoryData: boolean;
  includeProductInfo: boolean;
  includeDates: boolean;
  includeStatus: boolean;
  dateRange: 'All' | 'Last30Days' | 'Last90Days' | 'LastYear' | 'Custom';
  customStartDate: string;
  customEndDate: string;
  statusFilter: 'All' | 'Active' | 'Discontinued' | 'Pending';
}

const defaultConfig: ExportConfig = {
  format: 'CSV',
  database: 'Both',
  includeBasicUDI: true,
  includeProductUDI: true,
  includeRegulatoryData: true,
  includeProductInfo: true,
  includeDates: true,
  includeStatus: true,
  dateRange: 'All',
  customStartDate: '',
  customEndDate: '',
  statusFilter: 'All'
};

export function UDIExportDialog({ companyId, onClose }: UDIExportDialogProps) {
  const [config, setConfig] = useState<ExportConfig>(defaultConfig);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStats, setExportStats] = useState({
    totalBasicUDI: 0,
    totalProductUDI: 0,
    totalWithRegulatoryData: 0,
    estimatedRecords: 0
  });

  const handleConfigChange = (field: keyof ExportConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      // Simulate export process
      const steps = [
        'Fetching UDI data...',
        'Processing regulatory attributes...',
        'Formatting export data...',
        'Generating file...',
        'Finalizing export...'
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setExportProgress(((i + 1) / steps.length) * 100);
      }

      // Generate filename based on configuration
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `UDI-Export-${config.database}-${timestamp}.${config.format.toLowerCase()}`;
      
      toast.success(`Export completed: ${filename}`);
      
      // In a real implementation, this would trigger a file download
      // For now, we'll simulate it
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (error) {
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const gudidFields = [
    'UDI-DI',
    'Device Brand Name',
    'Version/Model',
    'Device Description',
    'Risk Class',
    'Regulation Number',
    'Product Code',
    'Sterility',
    'Latex',
    'MRI Safety',
    'Critical Warnings',
    'Contraindications',
    'Device Count',
    'Package Type',
    'Shelf Life',
    'Storage Conditions',
    'Manufacturer Name',
    'Manufacturer Address',
    'Marketing Date',
    'Pre-market Submission'
  ];

  const eudamedFields = [
    'Basic UDI-DI',
    'UDI-DI',
    'Device Brand Name',
    'Version/Model',
    'Device Description',
    'Risk Class',
    'Sterility',
    'Sterilization Methods',
    'Latex',
    'DEHP',
    'Natural Rubber',
    'MRI Safety',
    'Critical Warnings',
    'Contraindications',
    'Device Count',
    'Package Type',
    'Shelf Life',
    'Storage Conditions',
    'Manufacturer Name',
    'Manufacturer Address',
    'Authorized Representative',
    'Marketing Date',
    'Size Information'
  ];

  const getFieldCount = () => {
    let count = 0;
    if (config.includeBasicUDI) count += 5;
    if (config.includeProductUDI) count += 7;
    if (config.includeRegulatoryData) {
      count += config.database === 'GUDID' ? gudidFields.length : 
              config.database === 'EUDAMED' ? eudamedFields.length : 
              Math.max(gudidFields.length, eudamedFields.length);
    }
    if (config.includeProductInfo) count += 4;
    if (config.includeDates) count += 3;
    if (config.includeStatus) count += 1;
    return count;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export UDI Data
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="config" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export Format */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Export Format
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="format">File Format</Label>
                    <Select value={config.format} onValueChange={(value) => handleConfigChange('format', value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CSV">CSV (Comma Separated)</SelectItem>
                        <SelectItem value="XML">XML (Structured)</SelectItem>
                        <SelectItem value="JSON">JSON (JavaScript Object)</SelectItem>
                        <SelectItem value="Excel">Excel (.xlsx)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="database">Target Database</Label>
                    <Select value={config.database} onValueChange={(value) => handleConfigChange('database', value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GUDID">FDA GUDID</SelectItem>
                        <SelectItem value="EUDAMED">EU EUDAMED</SelectItem>
                        <SelectItem value="Both">Both (Separate Files)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      {config.database === 'GUDID' && 'GUDID format includes FDA-specific fields and validation rules.'}
                      {config.database === 'EUDAMED' && 'EUDAMED format includes EU MDR-specific fields and Basic UDI-DI.'}
                      {config.database === 'Both' && 'Separate files will be generated for each database with appropriate field mappings.'}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Data Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Data Selection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeBasicUDI"
                        checked={config.includeBasicUDI}
                        onCheckedChange={(checked) => handleConfigChange('includeBasicUDI', checked)}
                      />
                      <Label htmlFor="includeBasicUDI">Basic UDI-DI Data</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeProductUDI"
                        checked={config.includeProductUDI}
                        onCheckedChange={(checked) => handleConfigChange('includeProductUDI', checked)}
                      />
                      <Label htmlFor="includeProductUDI">Product UDI-DI Data</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeRegulatoryData"
                        checked={config.includeRegulatoryData}
                        onCheckedChange={(checked) => handleConfigChange('includeRegulatoryData', checked)}
                      />
                      <Label htmlFor="includeRegulatoryData">Regulatory Attributes</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeProductInfo"
                        checked={config.includeProductInfo}
                        onCheckedChange={(checked) => handleConfigChange('includeProductInfo', checked)}
                      />
                      <Label htmlFor="includeProductInfo">Product Information</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeDates"
                        checked={config.includeDates}
                        onCheckedChange={(checked) => handleConfigChange('includeDates', checked)}
                      />
                      <Label htmlFor="includeDates">Creation/Update Dates</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeStatus"
                        checked={config.includeStatus}
                        onCheckedChange={(checked) => handleConfigChange('includeStatus', checked)}
                      />
                      <Label htmlFor="includeStatus">Status Information</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="dateRange">Date Range</Label>
                    <Select value={config.dateRange} onValueChange={(value) => handleConfigChange('dateRange', value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Time</SelectItem>
                        <SelectItem value="Last30Days">Last 30 Days</SelectItem>
                        <SelectItem value="Last90Days">Last 90 Days</SelectItem>
                        <SelectItem value="LastYear">Last Year</SelectItem>
                        <SelectItem value="Custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {config.dateRange === 'Custom' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customStartDate">Start Date</Label>
                        <input
                          id="customStartDate"
                          type="date"
                          value={config.customStartDate}
                          onChange={(e) => handleConfigChange('customStartDate', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customEndDate">End Date</Label>
                        <input
                          id="customEndDate"
                          type="date"
                          value={config.customEndDate}
                          onChange={(e) => handleConfigChange('customEndDate', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="statusFilter">Status Filter</Label>
                    <Select value={config.statusFilter} onValueChange={(value) => handleConfigChange('statusFilter', value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Statuses</SelectItem>
                        <SelectItem value="Active">Active Only</SelectItem>
                        <SelectItem value="Discontinued">Discontinued Only</SelectItem>
                        <SelectItem value="Pending">Pending Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Export Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Export Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">24</div>
                      <div className="text-sm text-muted-foreground">Basic UDI-DI</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">87</div>
                      <div className="text-sm text-muted-foreground">Product UDI-DI</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">65</div>
                      <div className="text-sm text-muted-foreground">With Regulatory Data</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{getFieldCount()}</div>
                      <div className="text-sm text-muted-foreground">Total Fields</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      Estimated Records: 111
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <Badge variant="outline">{config.format}</Badge>
                      <div className="text-sm text-muted-foreground mt-1">Format</div>
                    </div>
                    <div className="text-center">
                      <Badge variant="outline">{config.database}</Badge>
                      <div className="text-sm text-muted-foreground mt-1">Database</div>
                    </div>
                    <div className="text-center">
                      <Badge variant="outline">{getFieldCount()} fields</Badge>
                      <div className="text-sm text-muted-foreground mt-1">Field Count</div>
                    </div>
                  </div>
                  
                  {config.database === 'GUDID' && (
                    <div>
                      <h4 className="font-semibold mb-2">GUDID Fields Preview</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {gudidFields.slice(0, 10).map((field) => (
                          <div key={field} className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-600" />
                            <span className="text-sm">{field}</span>
                          </div>
                        ))}
                        {gudidFields.length > 10 && (
                          <div className="text-sm text-muted-foreground">
                            ... and {gudidFields.length - 10} more fields
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {config.database === 'EUDAMED' && (
                    <div>
                      <h4 className="font-semibold mb-2">EUDAMED Fields Preview</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {eudamedFields.slice(0, 10).map((field) => (
                          <div key={field} className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-600" />
                            <span className="text-sm">{field}</span>
                          </div>
                        ))}
                        {eudamedFields.length > 10 && (
                          <div className="text-sm text-muted-foreground">
                            ... and {eudamedFields.length - 10} more fields
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {isExporting && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Exporting data...</span>
                      </div>
                      <Progress value={exportProgress} className="w-full" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Pre-configured export templates for common regulatory scenarios.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">FDA GUDID Submission</h4>
                            <p className="text-sm text-muted-foreground">
                              Complete GUDID export with all required fields
                            </p>
                          </div>
                          <Badge variant="outline">CSV</Badge>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">EU EUDAMED Submission</h4>
                            <p className="text-sm text-muted-foreground">
                              EUDAMED export with Basic UDI-DI and MDR fields
                            </p>
                          </div>
                          <Badge variant="outline">XML</Badge>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">Internal Audit</h4>
                            <p className="text-sm text-muted-foreground">
                              Comprehensive export for internal audits
                            </p>
                          </div>
                          <Badge variant="outline">Excel</Badge>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">Labeling Team</h4>
                            <p className="text-sm text-muted-foreground">
                              UDI codes and barcode data for labeling
                            </p>
                          </div>
                          <Badge variant="outline">CSV</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center mt-6 pt-6 border-t">
          <div className="text-sm text-muted-foreground">
            Export will include {getFieldCount()} fields across approximately 111 records
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={isExporting}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export Data
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}