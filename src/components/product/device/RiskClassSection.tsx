
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { ProductMarket, marketData, getMarketByCode, getRiskClassesForMarket } from "@/utils/marketRiskClassMapping";
import { ComponentRiskClassificationSection } from "./ComponentRiskClassificationSection";
import { ComponentRiskClassification } from "@/types/deviceComponents";
import { InvestorVisibleBadge } from '@/components/ui/investor-visible-badge';

interface RiskClassSectionProps {
  deviceClass?: "I" | "IIa" | "IIb" | "III" | "TBD";
  onDeviceClassChange?: (value: "I" | "IIa" | "IIb" | "III" | "TBD") => void;
  isLoading?: boolean;
  selectedMarkets?: ProductMarket[];
  onMarketRiskClassChange?: (marketCode: string, riskClass: string) => void;
  // Device characteristics for component-based classification
  keyTechnologyCharacteristics?: {
    isSystemOrProcedurePack?: boolean;
    isSoftwareMobileApp?: boolean;
  };
  onMarketComponentClassificationChange?: (marketCode: string, classification: ComponentRiskClassification) => void;
  deviceComponents?: Array<{ name: string; description: string; }>; // Components from Product Definition
  primaryRegulatoryType?: string; // Direct fallback trigger for System/Procedure Pack
}

export function RiskClassSection({
  deviceClass,
  onDeviceClassChange,
  isLoading = false,
  selectedMarkets = [],
  onMarketRiskClassChange,
  keyTechnologyCharacteristics,
  onMarketComponentClassificationChange,
  deviceComponents = [],
  primaryRegulatoryType
}: RiskClassSectionProps) {
  
  // EU Risk class descriptions
  const classDescriptions: Record<string, string> = {
    "TBD": "Classification not yet determined - Use the classification assistants to help determine the appropriate class",
    "I": "Low risk - Non-invasive devices with minimal risk to patients",
    "IIa": "Low-medium risk - Devices that may have moderate interaction with the human body",
    "IIb": "Medium-high risk - Devices with significant interaction or potential harm",
    "III": "High risk - Devices with significant potential for harm or life-sustaining functions"
  };

  // Get selected markets that should display risk class options
  const activeMarkets = selectedMarkets.filter(market => market.selected);
  
  // Check if device needs component-based classification
  // Also check primaryRegulatoryType directly as fallback
  const isSystemOrProcedurePack = keyTechnologyCharacteristics?.isSystemOrProcedurePack || primaryRegulatoryType === 'System/Procedure Pack';
  const isSiMD = keyTechnologyCharacteristics?.isSoftwareMobileApp;
  const needsComponentClassification = isSystemOrProcedurePack || isSiMD;
  
  // Enhanced fallback detection for System/Procedure Pack
  const hasSystemOrProcedurePackInCharacteristics = Boolean(
    keyTechnologyCharacteristics && 
    typeof keyTechnologyCharacteristics === 'object' && 
    'isSystemOrProcedurePack' in keyTechnologyCharacteristics &&
    keyTechnologyCharacteristics.isSystemOrProcedurePack === true
  );

  // Show component classification when device type requires it
  const shouldShowComponentClassification = needsComponentClassification;
  
  // If no markets are selected, show the default EU risk class selector
  const showDefaultSelector = activeMarkets.length === 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Device Classification</CardTitle>
            <InvestorVisibleBadge />
          </div>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showDefaultSelector ? (
          // Default EU MDR risk class selector (shown when no markets are selected)
          <div>
            <Label htmlFor="device-class">Medical Device Risk Classification (EU MDR)</Label>
            <Select value={deviceClass} onValueChange={onDeviceClassChange} disabled={isLoading}>
              <SelectTrigger className={`mt-2 ${deviceClass === 'TBD' ? 'border-amber-400 bg-amber-50 text-amber-700' : ''}`}>
                <SelectValue placeholder="Select device risk class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TBD" className="text-amber-600 font-medium">⏳ Not yet determined</SelectItem>
                <SelectItem value="I">Class I - Low Risk</SelectItem>
                <SelectItem value="IIa">Class IIa - Low-Medium Risk</SelectItem>
                <SelectItem value="IIb">Class IIb - Medium-High Risk</SelectItem>
                <SelectItem value="III">Class III - High Risk</SelectItem>
              </SelectContent>
            </Select>

            {deviceClass && (
              <div className="p-3 bg-muted rounded-md mt-2">
                <p className="text-sm font-medium">Class {deviceClass} Description:</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {classDescriptions[deviceClass]}
                </p>
              </div>
            )}
          </div>
        ) : shouldShowComponentClassification ? (
          // Component-based classification for System of Procedure Pack or SiMD
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="text-blue-800">
                <p className="font-medium text-sm">
                  {isSystemOrProcedurePack ? 'System/Procedure Pack Classification' : 'SiMD Classification'}
                </p>
                <p className="text-xs">
                  {isSystemOrProcedurePack 
                    ? 'Classify each component individually. The overall classification will be the highest risk class among components.'
                    : 'Classify both the hardware device and software component. The overall classification will be the highest risk class.'}
                </p>
              </div>
            </div>
            
            {activeMarkets.map(market => {
              const marketInfo = getMarketByCode(market.code);
              if (!marketInfo) return null;
              
              return (
                <ComponentRiskClassificationSection
                  key={market.code}
                  marketCode={market.code}
                  marketName={marketInfo.name}
                  componentClassification={(market as any).componentClassification}
                  onComponentClassificationChange={onMarketComponentClassificationChange || (() => {})}
                  deviceType={isSystemOrProcedurePack ? 'procedure-pack' : 'simd'}
                  availableComponents={deviceComponents}
                  isLoading={isLoading}
                  keyTechnologyCharacteristics={keyTechnologyCharacteristics}
                />
              );
            })}
          </div>
        ) : (
          // Standard market-based risk class selectors
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select the appropriate risk classification for each target market:
            </p>
            
            {activeMarkets.map(market => {
              const marketInfo = getMarketByCode(market.code);
              if (!marketInfo) return null;
              
              return (
                <div key={market.code} className="border rounded-md p-3">
                  <Label className="font-medium">{marketInfo.name}</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    {market.regulatoryStatus ? 
                      marketInfo.regulatoryStatuses.find(s => s.value === market.regulatoryStatus)?.label : 
                      "No regulatory status selected"
                    }
                  </p>
                  
                  <Select
                    value={market.riskClass || ""}
                    onValueChange={(value) => onMarketRiskClassChange && onMarketRiskClassChange(market.code, value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className={`mt-1 ${market.riskClass === 'TBD' ? 'border-amber-400 bg-amber-50 text-amber-700' : ''}`}>
                      <SelectValue placeholder={`Select ${marketInfo.name} risk class`} />
                    </SelectTrigger>
                    <SelectContent>
                      {getRiskClassesForMarket(market.code, primaryRegulatoryType === 'In Vitro Diagnostic (IVD)').map(riskClass => (
                        <SelectItem 
                          key={riskClass.value} 
                          value={riskClass.value}
                          className={riskClass.value === 'TBD' ? 'text-amber-600 font-medium' : ''}
                        >
                          {riskClass.value === 'TBD' ? '⏳ ' : ''}{riskClass.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {market.riskClass && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Selected Risk Class: {marketInfo.riskClasses.find(r => r.value === market.riskClass)?.label}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          The risk classification determines the regulatory pathway and conformity assessment requirements for your device.
        </p>
      </CardContent>
    </Card>
  );
}
