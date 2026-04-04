import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Package, Info, AlertCircle, CheckCircle, ExternalLink, Barcode, Building2 } from "lucide-react";

interface HelpSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contextTopic?: 'udi' | 'general';
}

export function HelpSidebar({ open, onOpenChange, contextTopic = 'udi' }: HelpSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Barcode className="h-5 w-5 text-primary" />
            UDI Help & Documentation
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-100px)]">
          <div className="p-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="components">Components</TabsTrigger>
                <TabsTrigger value="agencies">Agencies</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-base">What is UDI?</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Unique Device Identification (UDI) is a globally mandated regulatory requirement 
                    for medical devices that provides unique identification codes and key device information. 
                    The UDI system improves patient safety, enables efficient device tracking, and 
                    facilitates recalls when necessary.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    Regulatory Requirements
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">EU MDR</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Required for all medical devices placed on the EU market. Must be registered 
                        in EUDAMED database.
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">FDA (US)</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Mandatory for Class II & III devices. Must be registered in GUDID database.
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">Health Canada</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Required for Class II-IV medical devices.
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">TGA Australia</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Required for all medical device classes.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-primary/5">
                  <p className="text-sm">
                    <strong>Best Practice:</strong> Start with Basic UDI-DI for regulatory 
                    compliance, then generate Product UDI-DI for each packaging level. This ensures 
                    proper traceability from regulatory databases to physical product labeling.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="components" className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <h4 className="font-semibold">Basic UDI-DI</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      The Basic UDI-DI is used for regulatory database registration (EUDAMED, GUDID). 
                      It groups device families that share the same intended purpose and risk classification.
                    </p>
                    <div className="mt-3 p-3 bg-muted/50 rounded text-xs">
                      <strong>Example:</strong> All sizes of a surgical implant with the same intended 
                      use would share one Basic UDI-DI.
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-green-500" />
                      <h4 className="font-semibold">Product UDI-DI</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      The Product UDI-DI is used for device labeling and packaging. It's unique for 
                      each packaging configuration and commercial presentation.
                    </p>
                    <div className="mt-3 p-3 bg-muted/50 rounded text-xs">
                      <strong>Example:</strong> A box of 10 syringes has a different UDI-DI than a 
                      single syringe, even if they're the same product.
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-purple-500" />
                      <h4 className="font-semibold">UDI-PI (Production Identifiers)</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Production identifiers provide traceability data including lot/batch numbers, 
                      serial numbers, manufacturing dates, and expiration dates.
                    </p>
                    <div className="mt-3 p-3 bg-muted/50 rounded text-xs">
                      <strong>Required for:</strong> Implantable devices, devices with expiration dates, 
                      sterilized devices, and active devices.
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">UDI Code Anatomy (GS1 Format)</h4>
                  <div className="p-4 bg-muted/30 rounded-lg space-y-2 font-mono text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">(01)</span>
                      <span className="text-blue-600">0</span>
                      <span className="text-gray-500">1569431111</span>
                      <span className="text-green-600">0064</span>
                      <span className="text-orange-500">3</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 space-y-1">
                      <p><span className="text-blue-600">■</span> Package Level (0=Unit)</p>
                      <p><span className="text-gray-500">■</span> Company Prefix (fixed from GS1)</p>
                      <p><span className="text-green-600">■</span> Item Reference (your unique SKU - you choose this!)</p>
                      <p><span className="text-orange-500">■</span> Check Digit (auto-calculated)</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="agencies" className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  UDI codes must be issued by accredited agencies. Choose based on your existing 
                  supply chain infrastructure and target markets.
                </p>
                
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">GS1</h4>
                      </div>
                      <Badge>Most Common</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Global standards organization using GTIN-14 format. Used by over 2 million 
                      companies worldwide. Best choice for most medical device manufacturers.
                    </p>
                    <a 
                      href="https://www.gs1.org/industries/healthcare/udi" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Visit GS1 Healthcare <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">HIBCC</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Health Industry Business Communications Council. Popular in North American 
                      healthcare supply chains, particularly for surgical instruments.
                    </p>
                    <a 
                      href="https://www.hibcc.org" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Visit HIBCC <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">ICCBBA</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      International Council for Commonality in Blood Banking Automation. 
                      Specialized for blood, tissue, and cell therapy products.
                    </p>
                    <a 
                      href="https://www.iccbba.org" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Visit ICCBBA <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <div className="p-4 border-l-4 border-primary bg-muted/30 rounded-r-lg">
                  <p className="text-sm">
                    <strong>Tip:</strong> If you're already using GS1 barcodes for retail or 
                    logistics, you can leverage your existing company prefix for UDI codes.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
