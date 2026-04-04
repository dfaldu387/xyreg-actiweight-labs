
import { InclusionRule, DocumentInclusionStatus, DeviceClass, Market } from "@/types/documentInclusion";

interface ProductCharacteristics {
  deviceClass?: DeviceClass;
  targetMarkets?: Market[];
  deviceType?: string;
}

export class DocumentInclusionEngine {
  static evaluateInclusion(
    rule: InclusionRule, 
    productCharacteristics: ProductCharacteristics
  ): DocumentInclusionStatus {
    switch (rule.type) {
      case 'always_include':
        return {
          isIncluded: true,
          reason: 'Document is always included',
          appliedRule: rule
        };
      
      case 'not_included':
        return {
          isIncluded: false,
          reason: 'Document is excluded from all products',
          appliedRule: rule
        };
      
      case 'class_based':
        const deviceClass = productCharacteristics.deviceClass;
        const requiredClasses = rule.conditions?.deviceClasses || [];
        
        if (!deviceClass) {
          return {
            isIncluded: false,
            reason: 'Product device class not specified',
            appliedRule: rule
          };
        }
        
        const isClassMatch = requiredClasses.includes(deviceClass);
        return {
          isIncluded: isClassMatch,
          reason: isClassMatch 
            ? `Included for device class ${deviceClass}` 
            : `Not required for device class ${deviceClass}`,
          appliedRule: rule
        };
      
      case 'market_based':
        const targetMarkets = productCharacteristics.targetMarkets || [];
        const requiredMarkets = rule.conditions?.markets || [];
        
        const hasMarketMatch = requiredMarkets.some(market => 
          targetMarkets.includes(market)
        );
        
        return {
          isIncluded: hasMarketMatch,
          reason: hasMarketMatch 
            ? `Included for target market(s): ${requiredMarkets.join(', ')}` 
            : `Not required for current target markets`,
          appliedRule: rule
        };
      
      case 'custom_conditions':
        // For now, default to included for custom conditions
        // This could be extended with a custom logic evaluator
        return {
          isIncluded: true,
          reason: 'Custom inclusion logic applied',
          appliedRule: rule
        };
      
      default:
        return {
          isIncluded: true,
          reason: 'Default inclusion',
          appliedRule: rule
        };
    }
  }

  static getInclusionSummary(rule: InclusionRule): string {
    switch (rule.type) {
      case 'always_include':
        return 'Always included';
      case 'not_included':
        return 'Not included';
      case 'class_based':
        const classes = rule.conditions?.deviceClasses?.join(', ') || 'Unknown';
        return `Class ${classes} only`;
      case 'market_based':
        const markets = rule.conditions?.markets?.join(', ') || 'Unknown';
        return `${markets} market(s) only`;
      case 'custom_conditions':
        return 'Custom conditions';
      default:
        return 'Unknown rule';
    }
  }
}
