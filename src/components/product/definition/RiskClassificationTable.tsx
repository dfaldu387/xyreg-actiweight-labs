import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EnhancedProductMarket } from "@/utils/enhancedMarketRiskClassMapping";
import { formatDeviceClassLabel, mapEudamedRiskClass } from "@/utils/deviceClassUtils";
import { useTranslation } from '@/hooks/useTranslation';

interface RiskClassificationData {
  market: string;
  regulation: string;
  riskClass: string;
  pathway: string;
  notifiedBody: boolean;
  estimatedTimeline: string;
}

interface RiskClassificationTableProps {
  selectedMarkets?: EnhancedProductMarket[];
  onRiskDataChange?: (riskData: RiskClassificationData[]) => void;
  productClass?: string; // EUDAMED risk class from product
  hasEudamedData?: boolean;
  disabled?: boolean;
}

const markets = ["EU", "USA", "CA", "JP", "AU", "BR", "CN", "IN", "KR"];

const regulations = {
  "EU": ["MDR", "IVDR"],
  "USA": ["FDA 510(k)", "FDA PMA", "FDA De Novo"],
  "CA": ["CMDCAS", "Health Canada"],
  "JP": ["PMDA", "QMS"],
  "AU": ["TGA"],
  "BR": ["ANVISA"],
  "CN": ["NMPA"],
  "IN": ["CDSCO"],
  "KR": ["MFDS"]
};

const riskClasses = {
  "MDR": ["Class I", "Class IIa", "Class IIb", "Class III"],
  "IVDR": ["Class A", "Class B", "Class C", "Class D"],
  "FDA 510(k)": ["Class I", "Class II"],
  "FDA PMA": ["Class III"],
  "FDA De Novo": ["Class II"],
  "CMDCAS": ["Class I", "Class II", "Class III", "Class IV"],
  "Health Canada": ["Class I", "Class II", "Class III", "Class IV"],
  "PMDA": ["Class I", "Class II", "Class III", "Class IV"],
  "QMS": ["Class I", "Class II", "Class III"],
  "TGA": ["Class I", "Class IIa", "Class IIb", "Class III"],
  "ANVISA": ["Class I", "Class II", "Class III", "Class IV"],
  "NMPA": ["Class I", "Class II", "Class III"],
  "CDSCO": ["Class A", "Class B", "Class C", "Class D"],
  "MFDS": ["Class I", "Class II", "Class III", "Class IV"]
};

const pathways = {
  "MDR": ["Self-Declaration", "Conformity Assessment", "Clinical Evaluation"],
  "IVDR": ["Self-Declaration", "Notified Body Assessment"],
  "FDA 510(k)": ["510(k) Premarket Notification", "510(k) Traditional", "510(k) Special"],
  "FDA PMA": ["PMA Application", "PMA Supplement"],
  "FDA De Novo": ["De Novo Classification Request"],
  "CMDCAS": ["Medical Device License", "Quality System Certification"],
  "Health Canada": ["Medical Device License", "Custom Device"],
  "PMDA": ["Approval Application", "Consultation", "QMS Certification"],
  "QMS": ["QMS Certification", "ISO 13485"],
  "TGA": ["Conformity Assessment", "TGA Approval"],
  "ANVISA": ["ANVISA Registration", "Good Manufacturing Practices"],
  "NMPA": ["NMPA Registration", "Clinical Trial Approval"],
  "CDSCO": ["CDSCO Registration", "Clinical Trial Permission"],
  "MFDS": ["MFDS Registration", "QMS Certification"]
};

const timelines = [
  "3-6 months",
  "6-12 months", 
  "12-18 months",
  "18-24 months",
  "24+ months"
];

export function RiskClassificationTable({
  selectedMarkets = [],
  onRiskDataChange,
  productClass,
  hasEudamedData = false,
  disabled = false
}: RiskClassificationTableProps) {
  const { lang } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);

  // Generate risk data from selected markets
  const riskData = useMemo((): RiskClassificationData[] => {
    return selectedMarkets
      .filter(market => market.selected)
      .map(market => {
        // Get risk class from product's EUDAMED data or market data
        let riskClass = "Not determined";
        
        if (hasEudamedData && productClass) {
          // For EUDAMED products, use the product's class field
          const mappedClass = mapEudamedRiskClass(productClass);
          if (mappedClass) {
            riskClass = `Class ${mappedClass}`;
          }
        } else {
          // Try to get from market's riskClass property
          if (market.riskClass) {
            riskClass = market.riskClass;
          }
        }

        return {
          market: market.code,
          regulation: getDefaultRegulation(market.code),
          riskClass,
          pathway: getDefaultPathway(market.code),
          notifiedBody: getRiskClassRequiresNotifiedBody(riskClass, market.code),
          estimatedTimeline: getDefaultTimeline(market.code)
        };
      });
  }, [selectedMarkets, productClass, hasEudamedData]);

  // Helper functions to get default values based on market
  function getDefaultRegulation(marketCode: string): string {
    const defaultRegs: Record<string, string> = {
      'EU': 'MDR',
      'USA': 'FDA 510(k)',
      'CA': 'CMDCAS',
      'JP': 'PMDA',
      'AU': 'TGA',
      'BR': 'ANVISA',
      'CN': 'NMPA',
      'IN': 'CDSCO',
      'KR': 'MFDS'
    };
    return defaultRegs[marketCode] || '';
  }

  function getDefaultPathway(marketCode: string): string {
    const defaultPathways: Record<string, string> = {
      'EU': 'Conformity Assessment',
      'USA': '510(k) Premarket Notification',
      'CA': 'Medical Device License',
      'JP': 'Approval Application',
      'AU': 'Conformity Assessment',
      'BR': 'ANVISA Registration',
      'CN': 'NMPA Registration',
      'IN': 'CDSCO Registration',
      'KR': 'MFDS Registration'
    };
    return defaultPathways[marketCode] || '';
  }

  function getDefaultTimeline(marketCode: string): string {
    const defaultTimelines: Record<string, string> = {
      'EU': '12-18 months',
      'USA': '6-12 months',
      'CA': '8-14 months',
      'JP': '10-16 months',
      'AU': '6-12 months',
      'BR': '12-18 months',
      'CN': '18-24 months',
      'IN': '12-18 months',
      'KR': '10-16 months'
    };
    return defaultTimelines[marketCode] || '6-12 months';
  }

  function getRiskClassRequiresNotifiedBody(riskClass: string, marketCode: string): boolean {
    // For EU MDR, Class IIa, IIb, and III require notified body
    if (marketCode === 'EU') {
      return riskClass.includes('IIa') || riskClass.includes('IIb') || riskClass.includes('III');
    }
    
    // For other markets, generally Class II and above require some form of third-party assessment
    if (marketCode === 'USA') {
      return riskClass.includes('II') || riskClass.includes('III');
    }
    
    // Default logic for other markets
    return riskClass.includes('II') || riskClass.includes('III') || riskClass.includes('IV');
  }

  const updateMarketData = (index: number, field: keyof RiskClassificationData, value: any) => {
    if (disabled || !onRiskDataChange) return;
    
    const updatedData = riskData.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    onRiskDataChange(updatedData);
  };

  const handleSave = async () => {
    if (disabled || !onRiskDataChange) return;
    
    setIsSaving(true);
    // TODO: Implement actual API call to save risk classification data
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success(lang('risk.classification.savedSuccessfully'));
  };

  const getRiskClassBadgeColor = (riskClass: string) => {
    if (riskClass.includes("I") && !riskClass.includes("II")) return "bg-green-100 text-green-800";
    if (riskClass.includes("IIa") || riskClass.includes("II")) return "bg-yellow-100 text-yellow-800";
    if (riskClass.includes("IIb")) return "bg-orange-100 text-orange-800";
    if (riskClass.includes("III") || riskClass.includes("IV")) return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className={`space-y-6 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{lang('risk.classification.title')}</h3>
          <p className="text-sm text-muted-foreground">{lang('risk.classification.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={disabled || isSaving || !onRiskDataChange} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? lang('risk.classification.saving') : lang('risk.classification.saveChanges')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{lang('risk.classification.matrixTitle')}</CardTitle>
          <CardDescription>
            {lang('risk.classification.matrixDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{lang('risk.classification.market')}</TableHead>
                  <TableHead>{lang('risk.classification.regulation')}</TableHead>
                  <TableHead>{lang('risk.classification.riskClass')}</TableHead>
                  <TableHead>{lang('risk.classification.regulatoryPathway')}</TableHead>
                  <TableHead>{lang('risk.classification.notifiedBody')}</TableHead>
                  <TableHead>{lang('risk.classification.estTimeline')}</TableHead>
                  <TableHead className="w-[50px]">{lang('risk.classification.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riskData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Select
                        value={row.market}
                        onValueChange={(value) => updateMarketData(index, 'market', value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder={lang('risk.classification.selectMarket')} />
                        </SelectTrigger>
                        <SelectContent>
                          {markets.map(market => (
                            <SelectItem key={market} value={market}>{market}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.regulation}
                        onValueChange={(value) => updateMarketData(index, 'regulation', value)}
                        disabled={disabled || !row.market}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder={lang('risk.classification.selectRegulation')} />
                        </SelectTrigger>
                        <SelectContent>
                          {row.market && regulations[row.market as keyof typeof regulations]?.map(reg => (
                            <SelectItem key={reg} value={reg}>{reg}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.riskClass}
                        onValueChange={(value) => updateMarketData(index, 'riskClass', value)}
                        disabled={disabled || !row.regulation}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder={lang('risk.classification.selectClass')} />
                        </SelectTrigger>
                        <SelectContent>
                          {row.regulation && riskClasses[row.regulation as keyof typeof riskClasses]?.map(cls => (
                            <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.pathway}
                        onValueChange={(value) => updateMarketData(index, 'pathway', value)}
                        disabled={disabled || !row.regulation}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder={lang('risk.classification.selectPathway')} />
                        </SelectTrigger>
                        <SelectContent>
                          {row.regulation && pathways[row.regulation as keyof typeof pathways]?.map(path => (
                            <SelectItem key={path} value={path}>{path}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.notifiedBody ? "default" : "secondary"}>
                        {row.notifiedBody ? lang('risk.classification.required') : lang('risk.classification.notRequired')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.estimatedTimeline}
                        onValueChange={(value) => updateMarketData(index, 'estimatedTimeline', value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder={lang('risk.classification.timeline')} />
                        </SelectTrigger>
                        <SelectContent>
                          {timelines.map(timeline => (
                            <SelectItem key={timeline} value={timeline}>{timeline}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">
                        {lang('risk.classification.autoSynced')}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {riskData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>{lang('risk.classification.noMarketsSelected')}</p>
            </div>
          )}

          {hasEudamedData && riskData.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <span className="text-sm font-medium">{lang('risk.classification.eudamedSync')}</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {lang('risk.classification.autoPopulated')}
                </Badge>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                {lang('risk.classification.eudamedSyncDescription')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {riskData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{lang('risk.classification.totalMarkets')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{riskData.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{lang('risk.classification.highestRiskClass')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={getRiskClassBadgeColor(
                riskData.reduce((highest, current) => {
                  if (current.riskClass.includes("III") || current.riskClass.includes("IV")) return current.riskClass;
                  if (highest.includes("III") || highest.includes("IV")) return highest;
                  if (current.riskClass.includes("IIb")) return current.riskClass;
                  if (highest.includes("IIb")) return highest;
                  if (current.riskClass.includes("IIa") || current.riskClass.includes("II")) return current.riskClass;
                  return highest;
                }, "Class I")
              )}>
                {riskData.reduce((highest, current) => {
                  if (current.riskClass.includes("III") || current.riskClass.includes("IV")) return current.riskClass;
                  if (highest.includes("III") || highest.includes("IV")) return highest;
                  if (current.riskClass.includes("IIb")) return current.riskClass;
                  if (highest.includes("IIb")) return highest;
                  if (current.riskClass.includes("IIa") || current.riskClass.includes("II")) return current.riskClass;
                  return highest;
                }, "Class I")}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{lang('risk.classification.notifiedBodyRequired')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {riskData.filter(item => item.notifiedBody).length}
              </div>
              <p className="text-xs text-muted-foreground">{lang('risk.classification.ofMarkets').replace('{count}', String(riskData.length))}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}