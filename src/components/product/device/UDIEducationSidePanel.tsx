import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  ChevronRight,
  Barcode,
  Database,
  Settings,
  ExternalLink,
  CheckCircle,
  Lock,
  Pencil,
  Calculator,
  Lightbulb,
  Building2,
  FileText,
  Package,
  HelpCircle,
  AlertCircle
} from "lucide-react";

type UDIContext = 'overview' | 'basic-udi' | 'product-udi' | 'management';

interface UDIEducationSidePanelProps {
  basicUdiCount: number;
  productUdiCount: number;
  companyPrefix?: string;
  issuingAgency?: string;
  isConfigured: boolean;
  isLoading?: boolean;
  currentContext?: UDIContext;
  onCreateBasicUdi?: () => void;
  onGenerateProductUdi?: () => void;
  onOpenRegistry?: () => void;
  onOpenConfig?: () => void;
}

export function UDIEducationSidePanel({
  basicUdiCount,
  productUdiCount,
  companyPrefix,
  issuingAgency = 'GS1',
  isConfigured,
  isLoading = false,
  currentContext = 'overview',
  onCreateBasicUdi,
  onGenerateProductUdi,
  onOpenRegistry,
  onOpenConfig,
}: UDIEducationSidePanelProps) {
  // Auto-expand relevant sections based on context
  const [anatomyOpen, setAnatomyOpen] = useState(currentContext === 'basic-udi' || currentContext === 'overview');
  const [agenciesOpen, setAgenciesOpen] = useState(currentContext === 'basic-udi');
  const [tipsOpen, setTipsOpen] = useState(false);
  const [whatIsBasicOpen, setWhatIsBasicOpen] = useState(currentContext === 'basic-udi');
  const [whatIsProductOpen, setWhatIsProductOpen] = useState(currentContext === 'product-udi');

  // Update expanded sections when context changes
  useEffect(() => {
    if (currentContext === 'basic-udi') {
      setWhatIsBasicOpen(true);
      setAgenciesOpen(true);
      setAnatomyOpen(true);
    } else if (currentContext === 'product-udi') {
      setWhatIsProductOpen(true);
      setAnatomyOpen(true);
    }
  }, [currentContext]);

  const agencies = [
    {
      name: 'GS1',
      fullName: 'Global Standards 1',
      format: 'GTIN-14',
      description: 'Most widely used system for medical devices globally',
      website: 'https://www.gs1.org',
      howToGet: 'Register at your national GS1 Member Organization',
      cost: 'Annual membership fee varies by revenue',
    },
    {
      name: 'HIBCC',
      fullName: 'Health Industry Business Communications Council',
      format: 'HIBC',
      description: 'Healthcare industry focus, common in North America',
      website: 'https://www.hibcc.org',
      howToGet: 'Apply directly through HIBCC website',
      cost: 'One-time registration fee',
    },
    {
      name: 'ICCBBA',
      fullName: 'International Council for Commonality in Blood Banking Automation',
      format: 'ISBT 128',
      description: 'Specialized for blood, tissue, and cellular products',
      website: 'https://www.iccbba.org',
      howToGet: 'Register through ICCBBA for blood/tissue products',
      cost: 'Per-product licensing',
    },
  ];

  // Context-specific titles and descriptions
  const getContextTitle = () => {
    switch (currentContext) {
      case 'basic-udi':
        return { title: 'Basic UDI-DI Guide', subtitle: 'Understanding device family identification' };
      case 'product-udi':
        return { title: 'Product UDI-DI Guide', subtitle: 'Creating labeling codes for products' };
      case 'management':
        return { title: 'UDI Registry', subtitle: 'Manage your UDI codes' };
      default:
        return { title: 'UDI-DI Guide', subtitle: 'Learn about UDI codes and create them' };
    }
  };

  const { title, subtitle } = getContextTitle();

  return (
    <Card className="w-80 sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Barcode className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {subtitle}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Your UDI Statistics
          </p>
          {isLoading ? (
            <div className="flex items-center gap-4">
              <div className="text-center flex-1">
                <Skeleton className="h-8 w-12 mx-auto mb-1" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="text-center flex-1">
                <Skeleton className="h-8 w-12 mx-auto mb-1" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{basicUdiCount}</p>
                <p className="text-xs text-muted-foreground">Basic UDI-DIs</p>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="text-center">
                <p className="text-2xl font-bold">{productUdiCount}</p>
                <p className="text-xs text-muted-foreground">Product UDI-DIs</p>
              </div>
            </div>
          )}
        </div>

        {/* Configuration Status */}
        <div className={`p-3 rounded-lg border ${isConfigured ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'}`}>
          <div className="flex items-center gap-2 mb-2">
            {isConfigured ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <Settings className="h-4 w-4 text-amber-600" />
            )}
            <p className="text-sm font-medium">
              {isConfigured ? 'Configuration Complete' : 'Setup Required'}
            </p>
          </div>
          {isConfigured && companyPrefix && (
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Company Prefix:</span>
                <code className="font-mono font-medium bg-white dark:bg-background px-1.5 py-0.5 rounded">
                  {companyPrefix}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Agency:</span>
                <Badge variant="outline" className="text-xs">{issuingAgency}</Badge>
              </div>
            </div>
          )}
          {!isConfigured && (
            <Button size="sm" variant="outline" className="w-full mt-2" onClick={onOpenConfig}>
              Complete Setup
            </Button>
          )}
        </div>

        <Separator />

        {/* Context-specific: What is Basic UDI-DI? (shown when in basic-udi context) */}
        {(currentContext === 'basic-udi' || currentContext === 'overview') && (
          <>
            <Collapsible open={whatIsBasicOpen} onOpenChange={setWhatIsBasicOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 rounded px-2 -mx-2">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">What is Basic UDI-DI?</span>
                </div>
                {whatIsBasicOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 text-xs space-y-2">
                  <p className="text-blue-900 dark:text-blue-100">
                    <strong>Basic UDI-DI</strong> is the primary identifier for a <strong>device model/family</strong> in regulatory databases like EUDAMED.
                  </p>
                  <div className="space-y-1 text-blue-800 dark:text-blue-200">
                    <p>• Groups all variants of the same device</p>
                    <p>• Required before CE marking (EU MDR)</p>
                    <p>• Links to your technical documentation</p>
                    <p>• One Basic UDI-DI = one intended purpose</p>
                  </div>
                </div>
                <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800 text-xs">
                  <div className="flex gap-2">
                    <AlertCircle className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-amber-800 dark:text-amber-200">
                      Your company prefix ({companyPrefix || 'not set'}) comes from your <strong>Issuing Agency</strong> (e.g., GS1). You cannot change it.
                    </span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
            <Separator />
          </>
        )}

        {/* Context-specific: What is Product UDI-DI? (shown when in product-udi context) */}
        {currentContext === 'product-udi' && (
          <>
            <Collapsible open={whatIsProductOpen} onOpenChange={setWhatIsProductOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 rounded px-2 -mx-2">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">What is Product UDI-DI?</span>
                </div>
                {whatIsProductOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-3">
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 text-xs space-y-2">
                  <p className="text-green-900 dark:text-green-100">
                    <strong>Product UDI-DI</strong> identifies a <strong>specific product packaging</strong> for labeling and barcoding.
                  </p>
                  <div className="space-y-1 text-green-800 dark:text-green-200">
                    <p>• Goes on your physical product labels</p>
                    <p>• Different levels: unit, pack, case, pallet</p>
                    <p>• Encodes in barcodes (GS1-128, DataMatrix)</p>
                    <p>• Linked to a Basic UDI-DI</p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
            <Separator />
          </>
        )}

        {/* UDI-DI Anatomy - Collapsible */}
        <Collapsible open={anatomyOpen} onOpenChange={setAnatomyOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 rounded px-2 -mx-2">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">UDI-DI Anatomy</span>
            </div>
            {anatomyOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-3">
            {/* Visual Breakdown */}
            <div className="p-3 bg-muted/30 rounded-lg border">
              <p className="text-xs text-muted-foreground mb-2 text-center">
                {currentContext === 'basic-udi' ? 'Basic UDI-DI Structure' : 'Example UDI-DI Structure'}
              </p>
              <div className="font-mono text-sm text-center space-y-1">
                <div className="flex items-center justify-center gap-0.5">
                  <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
                    {companyPrefix || '1569431111'}
                  </span>
                  <span className="text-muted-foreground">+</span>
                  <span className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded font-bold">
                    {currentContext === 'basic-udi' ? 'REF' : '0064'}
                  </span>
                  <span className="text-muted-foreground">+</span>
                  <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                    ✓
                  </span>
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <Lock className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-amber-700 dark:text-amber-400 font-medium">Company Prefix</span>
                  <span className="text-muted-foreground"> – Fixed, from your issuing agency</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Pencil className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-green-700 dark:text-green-400 font-medium">
                    {currentContext === 'basic-udi' ? 'Internal Reference' : 'Item Reference'}
                  </span>
                  <span className="text-muted-foreground"> – You choose this! (e.g., your SKU)</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calculator className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-blue-700 dark:text-blue-400 font-medium">Check Digit</span>
                  <span className="text-muted-foreground"> – Auto-calculated by system</span>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Issuing Agencies - Collapsible (more prominent in basic-udi context) */}
        <Collapsible open={agenciesOpen} onOpenChange={setAgenciesOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 rounded px-2 -mx-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {currentContext === 'basic-udi' ? 'Who Gives You the Prefix?' : 'Issuing Agencies'}
              </span>
            </div>
            {agenciesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-3">
            {currentContext === 'basic-udi' && (
              <p className="text-xs text-muted-foreground pb-2">
                Your <strong>Company Prefix</strong> must be obtained from one of these official issuing agencies:
              </p>
            )}
            {agencies.map((agency) => (
              <div 
                key={agency.name} 
                className={`p-3 rounded-lg border text-xs ${
                  issuingAgency === agency.name 
                    ? 'bg-primary/5 border-primary/30' 
                    : 'bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">{agency.name}</span>
                  <Badge variant="outline" className="text-[10px]">{agency.format}</Badge>
                </div>
                <p className="text-muted-foreground mb-2">{agency.description}</p>
                <div className="space-y-1 text-muted-foreground">
                  <p>📍 {agency.howToGet}</p>
                  <p>💰 {agency.cost}</p>
                </div>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0 mt-2 text-xs"
                  onClick={() => window.open(agency.website, '_blank')}
                >
                  Visit {agency.name} <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Quick Tips - Collapsible */}
        <Collapsible open={tipsOpen} onOpenChange={setTipsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 rounded px-2 -mx-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Quick Tips</span>
            </div>
            {tipsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <ul className="space-y-2 text-xs text-muted-foreground">
              {currentContext === 'basic-udi' ? (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Use a meaningful internal reference (e.g., product line code)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>One Basic UDI-DI per device family (same intended purpose)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>All product variants share the same Basic UDI-DI</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Submit to EUDAMED before CE marking</span>
                  </li>
                </>
              ) : currentContext === 'product-udi' ? (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Create different UDI-DIs for each packaging level</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Use your internal SKU as the item reference</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>The barcode on labels encodes this Product UDI-DI</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Use your internal SKU as the item reference for easy tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Keep item reference numbers sequential for organization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>One Basic UDI-DI per device family (same intended use)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Multiple Product UDI-DIs per Basic (each packaging level)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Submit to EUDAMED before CE marking</span>
                  </li>
                </>
              )}
            </ul>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Quick Actions */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Quick Actions
          </p>
          <div className="space-y-2">
            <Button 
              variant={currentContext === 'basic-udi' ? 'default' : 'outline'}
              size="sm" 
              className="w-full justify-start"
              onClick={onCreateBasicUdi}
            >
              <FileText className="h-4 w-4 mr-2" />
              Create Basic UDI-DI
            </Button>
            <Button 
              variant={currentContext === 'product-udi' ? 'default' : 'outline'}
              size="sm" 
              className="w-full justify-start"
              onClick={onGenerateProductUdi}
            >
              <Package className="h-4 w-4 mr-2" />
              Generate Product UDI-DI
            </Button>
            <Button 
              variant={currentContext === 'management' ? 'default' : 'outline'}
              size="sm" 
              className="w-full justify-start"
              onClick={onOpenRegistry}
            >
              <Database className="h-4 w-4 mr-2" />
              Open Registry
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
