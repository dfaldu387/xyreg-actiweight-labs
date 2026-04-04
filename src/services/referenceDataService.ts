
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { 
  CountryRegulatory, 
  DeviceClassificationRule, 
  ComplianceFramework,
  EnhancedGapAnalysisTemplate,
  GapTemplateItem 
} from "@/types/referenceData";

export class ReferenceDataService {
  /**
   * Fetch all countries with regulatory information
   */
  static async getCountriesRegulatory(): Promise<CountryRegulatory[]> {
    try {
      const { data, error } = await supabase
        .from('countries_regulatory')
        .select('*')
        .order('country_name');

      if (error) throw error;
      
      // Transform the data to match our interface
      return (data || []).map(item => ({
        ...item,
        harmonized_standards: Array.isArray(item.harmonized_standards) 
          ? item.harmonized_standards 
          : []
      })) as CountryRegulatory[];
    } catch (error) {
      console.error('Error fetching countries regulatory data:', error);
      toast.error('Failed to load countries data');
      return [];
    }
  }

  /**
   * Get countries by region
   */
  static async getCountriesByRegion(region: string): Promise<CountryRegulatory[]> {
    try {
      const { data, error } = await supabase
        .from('countries_regulatory')
        .select('*')
        .eq('region', region)
        .order('country_name');

      if (error) throw error;
      
      // Transform the data to match our interface
      return (data || []).map(item => ({
        ...item,
        harmonized_standards: Array.isArray(item.harmonized_standards) 
          ? item.harmonized_standards 
          : []
      })) as CountryRegulatory[];
    } catch (error) {
      console.error('Error fetching countries by region:', error);
      return [];
    }
  }

  /**
   * Fetch device classification rules by framework
   */
  static async getClassificationRules(framework: string): Promise<DeviceClassificationRule[]> {
    try {
      const { data, error } = await supabase
        .from('device_classification_rules')
        .select('*')
        .eq('regulatory_framework', framework)
        .order('rule_number');

      if (error) throw error;
      
      // Transform the data to match our interface
      return (data || []).map(item => ({
        ...item,
        decision_criteria: typeof item.decision_criteria === 'object' 
          ? item.decision_criteria as Record<string, any>
          : {},
        applicable_annexes: Array.isArray(item.applicable_annexes) 
          ? item.applicable_annexes 
          : [],
        examples: Array.isArray(item.examples) 
          ? item.examples 
          : []
      })) as DeviceClassificationRule[];
    } catch (error) {
      console.error('Error fetching classification rules:', error);
      toast.error('Failed to load classification rules');
      return [];
    }
  }

  /**
   * Get all compliance frameworks
   */
  static async getComplianceFrameworks(): Promise<ComplianceFramework[]> {
    try {
      const { data, error } = await supabase
        .from('compliance_frameworks')
        .select('*')
        .eq('is_active', true)
        .order('framework_name');

      if (error) throw error;
      
      // Transform the data to match our interface
      return (data || []).map(item => ({
        ...item,
        framework_config: typeof item.framework_config === 'object' 
          ? item.framework_config as Record<string, any>
          : {}
      })) as ComplianceFramework[];
    } catch (error) {
      console.error('Error fetching compliance frameworks:', error);
      toast.error('Failed to load compliance frameworks');
      return [];
    }
  }

  /**
   * Classify device based on characteristics
   */
  static async classifyDevice(
    framework: string,
    deviceCharacteristics: Record<string, any>
  ): Promise<{ class: string; rules: DeviceClassificationRule[] }> {
    try {
      const rules = await this.getClassificationRules(framework);
      const applicableRules: DeviceClassificationRule[] = [];

      for (const rule of rules) {
        if (this.matchesCriteria(deviceCharacteristics, rule.decision_criteria)) {
          applicableRules.push(rule);
        }
      }

      // Return the highest risk class from applicable rules
      const classes = applicableRules.map(r => r.resulting_class);
      const highestClass = this.getHighestRiskClass(classes);

      return {
        class: highestClass || 'Class I',
        rules: applicableRules
      };
    } catch (error) {
      console.error('Error classifying device:', error);
      toast.error('Failed to classify device');
      return { class: 'Class I', rules: [] };
    }
  }

  private static matchesCriteria(
    characteristics: Record<string, any>,
    criteria: Record<string, any>
  ): boolean {
    return Object.entries(criteria).every(([key, value]) => {
      const charValue = characteristics[key];
      if (typeof value === 'boolean') {
        return charValue === value;
      }
      if (typeof value === 'string') {
        return charValue === value;
      }
      return true;
    });
  }

  private static getHighestRiskClass(classes: string[]): string {
    const riskOrder = ['Class I', 'Class IIa', 'Class IIb', 'Class III'];
    let highest = 'Class I';
    
    for (const cls of classes) {
      if (riskOrder.indexOf(cls) > riskOrder.indexOf(highest)) {
        highest = cls;
      }
    }
    
    return highest;
  }
}
