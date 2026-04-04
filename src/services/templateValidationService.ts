
import { supabase } from "@/integrations/supabase/client";
import { DatabasePhaseService } from "./databasePhaseService";
import { EnhancedPhaseService } from "./enhancedPhaseService";
import { toast } from "sonner";

export interface CompanyTemplateStatus {
  companyId: string;
  companyName: string;
  isStandardized: boolean;
  phaseCount: number;
  missingPhases: string[];
  needsStandardization: boolean;
  lastValidated: Date;
}

export interface ValidationReport {
  totalCompanies: number;
  standardizedCompanies: number;
  companiesNeedingStandardization: CompanyTemplateStatus[];
  validationSummary: {
    compliant: number;
    partial: number;
    noncompliant: number;
  };
}

/**
 * Template Validation Service - Ensures all companies inherit from standard templates
 */
export class TemplateValidationService {
  /**
   * Validate template inheritance across all companies
   */
  static async validateAllCompanyTemplates(): Promise<ValidationReport> {
    try {
      const { data: companies, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('is_archived', false);

      if (error) throw error;

      const companyStatuses: CompanyTemplateStatus[] = [];
      let standardizedCount = 0;

      for (const company of companies || []) {
        const status = await this.validateCompanyTemplate(company.id, company.name);
        companyStatuses.push(status);
        
        if (status.isStandardized) {
          standardizedCount++;
        }
      }

      const companiesNeedingStandardization = companyStatuses.filter(
        status => status.needsStandardization
      );

      const validationSummary = {
        compliant: companyStatuses.filter(s => s.isStandardized && s.phaseCount === 15).length,
        partial: companyStatuses.filter(s => s.phaseCount >= 10 && s.phaseCount < 15).length,
        noncompliant: companyStatuses.filter(s => s.phaseCount < 10).length
      };

      return {
        totalCompanies: companies?.length || 0,
        standardizedCompanies: standardizedCount,
        companiesNeedingStandardization,
        validationSummary
      };
    } catch (error) {
      console.error('Error validating company templates:', error);
      throw error;
    }
  }

  /**
   * Validate individual company template
   */
  static async validateCompanyTemplate(companyId: string, companyName: string): Promise<CompanyTemplateStatus> {
    try {
      const isStandardized = await EnhancedPhaseService.isCompanyStandardized(companyId);
      const phasesData = await DatabasePhaseService.getPhases(companyId);
      const standardTemplate = EnhancedPhaseService.getStandardPhaseTemplate();

      const currentPhaseNames = phasesData.activePhases.map(p => p.name);
      const standardPhaseNames = standardTemplate.map(p => p.name);
      
      const missingPhases = standardPhaseNames.filter(
        standardName => !currentPhaseNames.includes(standardName)
      );

      return {
        companyId,
        companyName,
        isStandardized,
        phaseCount: phasesData.activePhases.length,
        missingPhases,
        needsStandardization: !isStandardized || missingPhases.length > 0,
        lastValidated: new Date()
      };
    } catch (error) {
      console.error(`Error validating company ${companyId}:`, error);
      return {
        companyId,
        companyName,
        isStandardized: false,
        phaseCount: 0,
        missingPhases: [],
        needsStandardization: true,
        lastValidated: new Date()
      };
    }
  }

  /**
   * Standardize all companies that need it
   */
  static async standardizeAllCompanies(): Promise<{
    successCount: number;
    failureCount: number;
    results: Array<{ companyId: string; companyName: string; success: boolean; error?: string }>;
  }> {
    const validation = await this.validateAllCompanyTemplates();
    const results: Array<{ companyId: string; companyName: string; success: boolean; error?: string }> = [];
    let successCount = 0;
    let failureCount = 0;

    for (const company of validation.companiesNeedingStandardization) {
      try {
        const success = await EnhancedPhaseService.standardizeCompanyPhases(company.companyId);
        
        if (success) {
          successCount++;
          results.push({
            companyId: company.companyId,
            companyName: company.companyName,
            success: true
          });
        } else {
          failureCount++;
          results.push({
            companyId: company.companyId,
            companyName: company.companyName,
            success: false,
            error: 'Standardization function returned false'
          });
        }
      } catch (error) {
        failureCount++;
        results.push({
          companyId: company.companyId,
          companyName: company.companyName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { successCount, failureCount, results };
  }

  /**
   * Generate validation dashboard data
   */
  static async generateValidationDashboard() {
    const validation = await this.validateAllCompanyTemplates();
    
    return {
      overview: {
        totalCompanies: validation.totalCompanies,
        compliantPercentage: Math.round((validation.validationSummary.compliant / validation.totalCompanies) * 100),
        requiresAction: validation.companiesNeedingStandardization.length
      },
      breakdown: validation.validationSummary,
      actionItems: validation.companiesNeedingStandardization.map(company => ({
        companyName: company.companyName,
        issueCount: company.missingPhases.length,
        priority: company.phaseCount < 5 ? 'high' : company.phaseCount < 10 ? 'medium' : 'low'
      }))
    };
  }
}
