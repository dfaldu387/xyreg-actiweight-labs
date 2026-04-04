import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Package, Info, AlertCircle, ExternalLink, Building2 } from "lucide-react";
import { useTranslation } from '@/hooks/useTranslation';

export function UDIHelpContent() {
  const { lang } = useTranslation();

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="overview">{lang('udiHelp.tabs.overview')}</TabsTrigger>
        <TabsTrigger value="components">{lang('udiHelp.tabs.components')}</TabsTrigger>
        <TabsTrigger value="agencies">{lang('udiHelp.tabs.agencies')}</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-6">
        <div className="space-y-3">
          <h3 className="font-semibold text-base">{lang('udiHelp.whatIsUdi')}</h3>
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
            {lang('udiHelp.regulatoryRequirements')}
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
            <strong>{lang('udiHelp.bestPractice')}:</strong> {lang('udiHelp.bestPracticeText')}
          </p>
        </div>
      </TabsContent>

      <TabsContent value="components" className="space-y-6">
        <div className="space-y-4">
          <div className="p-4 border rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <h4 className="font-semibold">{lang('udiHelp.basicUdiDi')}</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              The Basic UDI-DI is used for regulatory database registration (EUDAMED, GUDID). 
              It groups device families that share the same intended purpose and risk classification.
            </p>
            <div className="mt-3 p-3 bg-muted/50 rounded text-xs">
              <strong>{lang('udiHelp.example')}:</strong> {lang('udiHelp.basicUdiDiExample')}
            </div>
          </div>

          <div className="p-4 border rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-500" />
              <h4 className="font-semibold">{lang('udiHelp.productUdiDi')}</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              The Product UDI-DI is used for device labeling and packaging. It&apos;s unique for 
              each packaging configuration and commercial presentation.
            </p>
            <div className="mt-3 p-3 bg-muted/50 rounded text-xs">
              <strong>{lang('udiHelp.example')}:</strong> {lang('udiHelp.productUdiDiExample')}
            </div>
          </div>

          <div className="p-4 border rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-purple-500" />
              <h4 className="font-semibold">{lang('udiHelp.udiPi')}</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              {lang('udiHelp.udiPiDescription')}
            </p>
            <div className="mt-3 p-3 bg-muted/50 rounded text-xs">
              <strong>{lang('udiHelp.requiredFor')}:</strong> {lang('udiHelp.udiPiRequiredFor')}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold">{lang('udiHelp.codeAnatomy')}</h4>
          <div className="p-4 bg-muted/30 rounded-lg space-y-2 font-mono text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">(01)</span>
              <span className="text-blue-600">0</span>
              <span className="text-gray-500">1569431111</span>
              <span className="text-green-600">0064</span>
              <span className="text-orange-500">3</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2 space-y-1">
              <p><span className="text-blue-600">■</span> {lang('udiHelp.packageLevel')}</p>
              <p><span className="text-gray-500">■</span> {lang('udiHelp.companyPrefix')}</p>
              <p><span className="text-green-600">■</span> {lang('udiHelp.itemReference')}</p>
              <p><span className="text-orange-500">■</span> {lang('udiHelp.checkDigit')}</p>
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
              <Badge>{lang('udiHelp.mostCommon')}</Badge>
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
            <strong>{lang('udiHelp.tip')}:</strong> {lang('udiHelp.tipText')}
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}