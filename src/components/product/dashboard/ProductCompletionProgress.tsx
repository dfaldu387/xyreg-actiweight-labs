
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Product, EnhancedProductMarket } from "@/types/client";
import { useDeviceProgress } from "@/hooks/useDeviceProgress";
import { ChevronRight, ChevronDown, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { DeviceCharacteristics } from "@/types/client";
import { useNavigate } from "react-router-dom";
import { convertToEnhancedMarkets } from "@/utils/enhancedMarketRiskClassMapping";

interface ProductCompletionProgressProps {
  product: Product;
}

export function ProductCompletionProgress({ product }: ProductCompletionProgressProps) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  
  // Helper function to process deviceType - it now accepts the union type
  const processDeviceType = (deviceType: string | DeviceCharacteristics | undefined) => {
    if (!deviceType) return undefined;
    return deviceType;
  };
  
  // Helper function to safely cast device class
  const getDeviceClass = (deviceClass: string | undefined): "I" | "IIa" | "IIb" | "III" | undefined => {
    if (!deviceClass) return undefined;
    if (deviceClass === "I" || deviceClass === "IIa" || deviceClass === "IIb" || deviceClass === "III") {
      return deviceClass;
    }
    return undefined;
  };

  // Convert markets to EnhancedProductMarket format
  const convertMarketsToEnhanced = (markets: any): EnhancedProductMarket[] => {
    if (!markets) return [];
    
    if (Array.isArray(markets)) {
      // Check if already EnhancedProductMarket format
      if (markets.length > 0 && typeof markets[0] === 'object' && 'name' in markets[0]) {
        return markets as EnhancedProductMarket[];
      }
      
      // Convert from ProductMarket format
      if (markets.length > 0 && typeof markets[0] === 'object' && 'code' in markets[0]) {
        return convertToEnhancedMarkets(markets);
      }
    }
    
    return [];
  };
  
  const { progress, sections } = useDeviceProgress({
    productName: product.name,
    modelReference: product.model_reference,
    deviceType: processDeviceType(product.device_type),
    deviceCategory: product.device_category,
    deviceClass: getDeviceClass(product.class),
    regulatoryStatus: product.regulatory_status,
    intendedUse: product.intended_use,
    intendedPurposeData: product.intended_purpose_data,
    contraindications: product.contraindications,
    keyFeatures: product.key_features,
    deviceComponents: product.device_components,
    images: typeof product.image === 'string' ? [product.image] : [],
    // UDI Information
    basicUdiDi: product.basic_udi_di,
    udiDi: product.udi_di,
    udiPi: product.udi_pi,
    gtin: product.gtin,
    modelVersion: product.model_version,
    // EUDAMED Registration
    registrationNumber: product.eudamed_registration_number,
    registrationStatus: product.registration_status,
    registrationDate: product.registration_date,
    marketAuthorizationHolder: product.market_authorization_holder,
    // Regulatory
    ceMarkStatus: product.ce_mark_status,
    notifiedBody: product.notified_body,
    isoCertifications: product.iso_certifications,
    designFreezeDate: product.design_freeze_date,
    currentLifecyclePhase: product.current_lifecycle_phase,
    projectedLaunchDate: product.projected_launch_date,
    conformityAssessmentRoute: product.conformity_assessment_route,
    intendedUsers: product.intended_users,
    clinicalBenefits: product.clinical_benefits,
    userInstructions: product.user_instructions,
    deviceCompliance: product.device_compliance,
    deviceSummary: product.device_summary,
    markets: convertMarketsToEnhanced(product.markets),
    // NPV Analysis - using correct property names from types
    totalNPV: (product as any).total_npv || 0,
    selectedCurrency: (product as any).selected_currency || 'USD',
  });

  // Section names for display and their corresponding tab values
  const sectionConfig = {
    deviceOverview: { name: "Device Overview", tab: "overview" },
    intendedPurpose: { name: "Intended Purpose", tab: "purpose" },
    udiInformation: { name: "UDI Information", tab: "udi" },
    targetMarkets: { name: "Target Markets", tab: "markets" },
    regulatoryInfo: { name: "Regulatory Information", tab: "regulatory" },
    npvAnalysis: { name: "NPV Analysis", tab: "npv" },
    lifecycleInfo: { name: "Lifecycle Information", tab: "lifecycle" },
    intendedUsers: { name: "Intended Users", tab: "users" },
    eudamedRegistration: { name: "EUDAMED Registration", tab: "eudamed" }
  };

  // Handle section click to navigate to device information page with specific tab
  const handleSectionClick = (sectionKey: string) => {
    const config = sectionConfig[sectionKey as keyof typeof sectionConfig];
    if (config) {
      navigate(`/app/product/${product.id}/device-information?tab=${config.tab}`);
    }
  };

  return (
    <Card>
      <CardContent className="p-2 sm:p-3 lg:p-4">
        <div className="space-y-2 sm:space-y-3">
          {/* Overall progress header with toggle */}
          <div 
            className="flex items-center justify-between cursor-pointer" 
            onClick={() => setExpanded(!expanded)}
          >
            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Device Information Completion
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-medium">{progress}%</span>
              {expanded ? 
                <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" /> : 
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              }
            </div>
          </div>
          
          {/* Overall progress bar */}
          <div>
            <Progress value={progress} className="h-2 sm:h-2.5" />
          </div>
          
          {/* Section progress bars (shown when expanded) */}
          {expanded && (
            <div className="pt-1 sm:pt-2 space-y-2 sm:space-y-3">
              {Object.entries(sections).map(([key, sectionProgress]) => {
                const config = sectionConfig[key as keyof typeof sectionConfig];
                const sectionName = config?.name || key;
                
                // Ensure sectionProgress is a number
                const progressValue = typeof sectionProgress === 'number' ? sectionProgress : 0;
                
                // Color classes based on completion percentage
                const colorClass = progressValue >= 70 
                  ? "bg-green-500" 
                  : progressValue >= 30 
                    ? "bg-amber-500" 
                    : "bg-red-500";
                
                return (
                  <div 
                    key={key} 
                    className="space-y-1 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors" 
                    onClick={() => handleSectionClick(key)}
                  >
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="truncate hover:text-primary transition-colors">{sectionName}</span>
                      <span className="flex-shrink-0">{Math.round(progressValue)}%</span>
                    </div>
                    <div className="h-1 sm:h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all", colorClass)}
                        style={{ width: `${progressValue}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
