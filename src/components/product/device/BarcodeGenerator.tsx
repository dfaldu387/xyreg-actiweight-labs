import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  Copy, 
  Settings, 
  Info,
  RefreshCw,
  Barcode,
  Image as ImageIcon
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface BarcodeGeneratorProps {
  udiId: string | null;
  onClose: () => void;
}

interface BarcodeConfig {
  format: 'GS1-128' | 'Data Matrix' | 'QR Code';
  width: number;
  height: number;
  includeText: boolean;
  fontSize: number;
  margin: number;
  backgroundColor: string;
  foregroundColor: string;
}

interface PIData {
  lotNumber: string;
  serialNumber: string;
  expirationDate: string;
  manufacturingDate: string;
  useBy: string;
}

const defaultConfig: BarcodeConfig = {
  format: 'GS1-128',
  width: 300,
  height: 100,
  includeText: true,
  fontSize: 12,
  margin: 10,
  backgroundColor: '#ffffff',
  foregroundColor: '#000000'
};

const defaultPIData: PIData = {
  lotNumber: '',
  serialNumber: '',
  expirationDate: '',
  manufacturingDate: '',
  useBy: ''
};

export function BarcodeGenerator({ udiId, onClose }: BarcodeGeneratorProps) {
  const [config, setConfig] = useState<BarcodeConfig>(defaultConfig);
  const [piData, setPiData] = useState<PIData>(defaultPIData);
  const [sampleUDI] = useState('(01)00123456789012(17)231215(10)ABC123(21)1234567890');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleConfigChange = (field: keyof BarcodeConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePIDataChange = (field: keyof PIData, value: string) => {
    setPiData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateBarcodeData = () => {
    let barcodeData = sampleUDI;
    
    // Add Production Identifiers if provided
    if (piData.lotNumber) {
      barcodeData += `(10)${piData.lotNumber}`;
    }
    if (piData.serialNumber) {
      barcodeData += `(21)${piData.serialNumber}`;
    }
    if (piData.expirationDate) {
      barcodeData += `(17)${piData.expirationDate.replace(/-/g, '')}`;
    }
    if (piData.manufacturingDate) {
      barcodeData += `(11)${piData.manufacturingDate.replace(/-/g, '')}`;
    }
    
    return barcodeData;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Simulate barcode generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Barcode generated successfully');
    } catch (error) {
      toast.error('Failed to generate barcode');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (format: 'PNG' | 'SVG' | 'PDF') => {
    // Simulate file download
    const filename = `barcode-${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
    toast.success(`Barcode downloaded as ${filename}`);
  };

  const copyBarcodeData = () => {
    navigator.clipboard.writeText(generateBarcodeData());
    toast.success('Barcode data copied to clipboard');
  };

  const piStructureGuide = [
    { ai: '01', description: 'Global Trade Item Number (GTIN)', example: '(01)00123456789012' },
    { ai: '10', description: 'Batch/Lot Number', example: '(10)ABC123' },
    { ai: '11', description: 'Production Date (YYMMDD)', example: '(11)231215' },
    { ai: '17', description: 'Expiration Date (YYMMDD)', example: '(17)251215' },
    { ai: '21', description: 'Serial Number', example: '(21)1234567890' },
    { ai: '7003', description: 'Expiration Date/Time (YYMMDDHHMMSS)', example: '(7003)23121512' }
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Barcode className="h-5 w-5" />
            Barcode Generator
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="generator" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generator">Generator</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="guide">PI Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Barcode Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Barcode Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="format">Barcode Format</Label>
                    <Select value={config.format} onValueChange={(value) => handleConfigChange('format', value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GS1-128">GS1-128 (Linear)</SelectItem>
                        <SelectItem value="Data Matrix">Data Matrix (2D)</SelectItem>
                        <SelectItem value="QR Code">QR Code (2D)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="width">Width (px)</Label>
                      <Input
                        id="width"
                        type="number"
                        value={config.width}
                        onChange={(e) => handleConfigChange('width', parseInt(e.target.value))}
                        min="100"
                        max="800"
                      />
                    </div>
                    <div>
                      <Label htmlFor="height">Height (px)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={config.height}
                        onChange={(e) => handleConfigChange('height', parseInt(e.target.value))}
                        min="50"
                        max="400"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeText"
                      checked={config.includeText}
                      onChange={(e) => handleConfigChange('includeText', e.target.checked)}
                    />
                    <Label htmlFor="includeText">Include human-readable text</Label>
                  </div>

                  {config.includeText && (
                    <div>
                      <Label htmlFor="fontSize">Font Size</Label>
                      <Input
                        id="fontSize"
                        type="number"
                        value={config.fontSize}
                        onChange={(e) => handleConfigChange('fontSize', parseInt(e.target.value))}
                        min="8"
                        max="24"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="backgroundColor">Background Color</Label>
                      <Input
                        id="backgroundColor"
                        type="color"
                        value={config.backgroundColor}
                        onChange={(e) => handleConfigChange('backgroundColor', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="foregroundColor">Foreground Color</Label>
                      <Input
                        id="foregroundColor"
                        type="color"
                        value={config.foregroundColor}
                        onChange={(e) => handleConfigChange('foregroundColor', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Production Identifiers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Production Identifiers (PI)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="lotNumber">Lot/Batch Number (AI: 10)</Label>
                    <Input
                      id="lotNumber"
                      value={piData.lotNumber}
                      onChange={(e) => handlePIDataChange('lotNumber', e.target.value)}
                      placeholder="e.g., ABC123"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="serialNumber">Serial Number (AI: 21)</Label>
                    <Input
                      id="serialNumber"
                      value={piData.serialNumber}
                      onChange={(e) => handlePIDataChange('serialNumber', e.target.value)}
                      placeholder="e.g., 1234567890"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="expirationDate">Expiration Date (AI: 17)</Label>
                    <Input
                      id="expirationDate"
                      type="date"
                      value={piData.expirationDate}
                      onChange={(e) => handlePIDataChange('expirationDate', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="manufacturingDate">Manufacturing Date (AI: 11)</Label>
                    <Input
                      id="manufacturingDate"
                      type="date"
                      value={piData.manufacturingDate}
                      onChange={(e) => handlePIDataChange('manufacturingDate', e.target.value)}
                    />
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Production Identifiers are variable data that changes for each batch, lot, or individual device.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>

            {/* Barcode Data Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Generated Barcode Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">UDI-DI + PI</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyBarcodeData}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="font-mono text-sm bg-muted p-3 rounded border">
                    {generateBarcodeData()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Barcode Preview</span>
                  <div className="flex items-center gap-2">
                    <Button onClick={handleGenerate} disabled={isGenerating}>
                      {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                      Generate
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div 
                    className="inline-block border-2 border-dashed border-gray-300 rounded-lg p-8"
                    style={{ 
                      width: config.width + 40, 
                      height: config.height + 40,
                      backgroundColor: config.backgroundColor 
                    }}
                  >
                    <div className="text-center">
                      <Barcode 
                        className="mx-auto mb-2" 
                        size={Math.min(config.width, config.height) / 4}
                        style={{ color: config.foregroundColor }}
                      />
                      <div className="text-xs text-muted-foreground">
                        {config.format} Barcode Preview
                      </div>
                      {config.includeText && (
                        <div 
                          className="mt-2 font-mono"
                          style={{ 
                            fontSize: config.fontSize,
                            color: config.foregroundColor
                          }}
                        >
                          {generateBarcodeData()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center gap-2 mt-4">
                  <Button variant="outline" onClick={() => handleDownload('PNG')}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PNG
                  </Button>
                  <Button variant="outline" onClick={() => handleDownload('SVG')}>
                    <Download className="h-4 w-4 mr-2" />
                    Download SVG
                  </Button>
                  <Button variant="outline" onClick={() => handleDownload('PDF')}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guide" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Production Identifier (PI) Structure Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      The Production Identifier (PI) part of the UDI contains variable data that identifies the specific production unit of a device.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold">GS1 Application Identifiers (AI)</h4>
                    <div className="space-y-2">
                      {piStructureGuide.map((item) => (
                        <div key={item.ai} className="flex items-center gap-4 p-3 border rounded">
                          <Badge variant="outline" className="font-mono">
                            {item.ai}
                          </Badge>
                          <div className="flex-1">
                            <div className="font-medium">{item.description}</div>
                            <div className="text-sm text-muted-foreground font-mono">
                              {item.example}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Implementation Notes</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• The UDI-DI (Device Identifier) remains constant for a device model</li>
                      <li>• The PI (Production Identifier) varies for each production unit</li>
                      <li>• Date formats use YYMMDD format (e.g., 231215 for December 15, 2023)</li>
                      <li>• Serial numbers should be unique within the scope of the UDI-DI</li>
                      <li>• Lot/batch numbers identify groups of devices manufactured together</li>
                      <li>• Use appropriate AI codes based on your production processes</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}