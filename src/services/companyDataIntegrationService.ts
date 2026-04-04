import { supabase } from '@/integrations/supabase/client';
import { CompanyDataUpdateService } from './companyDataUpdateService';

export interface CompanyData {
  id: string;
  name: string;
  country?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  contact_person?: string;
  srn?: string;
  description?: string;
  ar_name?: string;
  ar_address?: string;
  ar_city?: string;
  ar_country?: string;
  production_site_name?: string;
  production_site_address?: string;
  production_site_city?: string;
  production_site_country?: string;
  department_structure?: any;
}

export interface PersonnelData {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  access_level?: string;
}

export interface PhaseData {
  id: string;
  name: string;
  position: number;
}

export interface ProductData {
  id: string;
  name: string;
  device_category?: string;
  risk_class?: string;
  status?: string;
}

export interface MissingDataIndicator {
  field: string;
  description: string;
  suggestion?: string;
  priority: 'critical' | 'important' | 'optional';
  regulatoryContext?: string;
}

export class CompanyDataIntegrationService {
  /**
   * Fetch comprehensive company data for template population
   */
  static async getCompanyData(companyId: string): Promise<{
    company: CompanyData | null;
    personnel: PersonnelData[];
    phases: PhaseData[];
    products: ProductData[];
    missingData: MissingDataIndicator[];
  }> {
    try {
      // Fetch company information including department structure
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, name, country, address, city, postal_code, phone, email, website, contact_person, srn, description, ar_name, ar_address, ar_city, ar_country, production_site_name, production_site_address, production_site_city, production_site_country, department_structure')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;

      // Fetch personnel with access levels
      const { data: personnelData, error: personnelError } = await supabase
        .from('user_company_access')
        .select(`
          user_id,
          access_level,
          user_profiles!inner (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('company_id', companyId);

      if (personnelError) throw personnelError;

      // Fetch company phases
      const { data: phasesData, error: phasesError } = await supabase
        .from('company_chosen_phases')
        .select(`
          position,
          company_phases!inner (
            id,
            name
          )
        `)
        .eq('company_id', companyId)
        .order('position');

      if (phasesError) throw phasesError;

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, device_category, status')
        .eq('company_id', companyId)
        .eq('is_archived', false);

      if (productsError) throw productsError;

      // Format personnel data
      const personnel: PersonnelData[] = personnelData?.map(item => ({
        id: item.user_profiles.id,
        first_name: item.user_profiles.first_name,
        last_name: item.user_profiles.last_name,
        email: item.user_profiles.email,
        access_level: item.access_level
      })) || [];

      // Format phases data
      const phases: PhaseData[] = phasesData?.map(item => ({
        id: item.company_phases.id,
        name: item.company_phases.name,
        position: item.position
      })) || [];

      // Format products data
      const products: ProductData[] = productsData || [];

      // Analyze missing data
      const missingData = await this.analyzeMissingData(companyData, personnel, phases, companyId);

      return {
        company: companyData as CompanyData,
        personnel,
        phases,
        products,
        missingData
      };
    } catch (error) {
      console.error('Error fetching company data:', error);
      return {
        company: null,
        personnel: [],
        phases: [],
        products: [],
        missingData: []
      };
    }
  }

  /**
   * Analyze what data is missing for complete template population
   */
  private static async analyzeMissingData(
    company: CompanyData | null,
    personnel: PersonnelData[],
    phases: PhaseData[],
    companyId: string
  ): Promise<MissingDataIndicator[]> {
    const missing: MissingDataIndicator[] = [];

    console.log('[CompanyDataIntegration] Starting missing data analysis for company:', companyId);

    if (!company) {
      missing.push({
        field: 'company_basic_info',
        description: 'Company basic information is missing',
        priority: 'critical',
        regulatoryContext: 'Required for regulatory submissions'
      });
      return missing;
    }

    try {
      // Get comprehensive company data including settings and organizational data
      const [companyOrgData, templateSettings] = await Promise.all([
        CompanyDataUpdateService.getCompanyOrganizationalData(companyId),
        this.getTemplateSettings(companyId)
      ]);

      console.log('[CompanyDataIntegration] Retrieved data:', {
        companyOrgData: JSON.stringify(companyOrgData, null, 2),
        templateSettings: JSON.stringify(templateSettings, null, 2)
      });

      // Check for Head of Quality Assurance - check both personnel and company settings
      const hasQAHead = (
        personnel.some(p => p.access_level === 'admin' && p.first_name && p.last_name) ||
        (companyOrgData.headOfQA?.name && companyOrgData.headOfQA?.name !== 'Unknown')
      );
      
      if (!hasQAHead) {
        missing.push({
          field: 'head_of_quality',
          description: 'Head of Quality Assurance not identified',
          suggestion: personnel.length > 0 ? 
            `Consider assigning ${personnel[0].first_name} ${personnel[0].last_name} as Head of QA` : 
            'Add Head of Quality Assurance to company personnel',
          priority: 'critical',
          regulatoryContext: 'ISO 13485 requires designated quality management responsible person'
        });
      }

      // Check for document numbering system - check actual saved data in company settings
      const hasDocumentNumbering = !!(
        companyOrgData.documentNumberingSystem?.prefix ||
        templateSettings.document_numbering_prefix
      );
      
      console.log('[CompanyDataIntegration] Document numbering check:', {
        hasOrgData: !!companyOrgData.documentNumberingSystem?.prefix,
        orgDataPrefix: companyOrgData.documentNumberingSystem?.prefix,
        hasTemplateSettings: !!templateSettings.document_numbering_prefix,
        templatePrefix: templateSettings.document_numbering_prefix,
        result: hasDocumentNumbering
      });
      
      if (!hasDocumentNumbering) {
        missing.push({
          field: 'document_numbering_system',
          description: 'Document numbering system not defined',
          suggestion: 'Recommended format: SOP-XXX, WI-XXX, FORM-XXX',
          priority: 'important',
          regulatoryContext: 'Required for document control per ISO 13485 clause 4.2.4'
        });
      }

      // Check for retention periods - ANY configured retention period is valid
      const hasRetentionPeriods = !!(
        companyOrgData.retentionPeriods?.sops ||
        templateSettings.retention_period_sops
      );
      
      if (!hasRetentionPeriods) {
        missing.push({
          field: 'document_retention_period',
          description: 'Document retention periods not specified',
          suggestion: 'Medical device industry standard: 7-10 years minimum',
          priority: 'important',
          regulatoryContext: 'Required by EU MDR Article 10.8 and FDA 21 CFR 820.180'
        });
      }

      // Check for electronic document management system - ANY configured EDM system is valid
      const hasEDMSystem = !!(
        companyOrgData.edmSystem?.platform ||
        templateSettings.edms_system
      );
      
      if (!hasEDMSystem) {
        missing.push({
          field: 'edm_system',
          description: 'Electronic Document Management System details not specified',
          suggestion: 'Define eDMS software and validation status',
          priority: 'important',
          regulatoryContext: 'Electronic systems require validation per 21 CFR Part 11'
        });
      }

      // Check for department structure - check both company data and organizational data
      const hasDepartmentStructure = (
        (company.department_structure && Array.isArray(company.department_structure) && company.department_structure.length > 0) ||
        (companyOrgData.departments && Array.isArray(companyOrgData.departments) && companyOrgData.departments.length > 0)
      );
      
      if (!hasDepartmentStructure) {
        missing.push({
          field: 'department_structure',
          description: 'Organizational departments and roles not defined',
          suggestion: 'Define key departments: QA, R&D, Manufacturing, Regulatory',
          priority: 'important',
          regulatoryContext: 'Organizational structure required for quality manual'
        });
      }

      // Only add signature authorities if approval workflow is not defined
      const hasApprovalWorkflow = (
        companyOrgData.approvalWorkflow && 
        Array.isArray(companyOrgData.approvalWorkflow) && 
        companyOrgData.approvalWorkflow.length > 0
      );
      
      if (!hasApprovalWorkflow) {
        missing.push({
          field: 'signature_authorities',
          description: 'Document signature authorities not defined',
          suggestion: 'Define who can approve different document types',
          priority: 'important',
          regulatoryContext: 'Clear approval authorities required for document control'
        });
      }

    } catch (error) {
      console.error('[CompanyDataIntegration] Error analyzing missing data:', error);
      // Add fallback missing items if there's an error
      missing.push(
        {
          field: 'document_numbering_system',
          description: 'Document numbering system not defined',
          priority: 'important',
          regulatoryContext: 'Required for document control per ISO 13485 clause 4.2.4'
        },
        {
          field: 'document_retention_period',
          description: 'Document retention periods not specified',
          priority: 'important',
          regulatoryContext: 'Required by EU MDR Article 10.8 and FDA 21 CFR 820.180'
        }
      );
    }

    console.log('[CompanyDataIntegration] Missing data analysis complete:', {
      missingCount: missing.length,
      missingFields: missing.map(m => m.field)
    });

    return missing;
  }

  /**
   * Get template settings from the database
   */
  private static async getTemplateSettings(companyId: string): Promise<any> {
    try {
      const { data: settings, error } = await supabase
        .from('template_settings')
        .select('setting_key, setting_value')
        .eq('company_id', companyId);

      if (error) throw error;

      // Convert to object for easier access
      const settingsObj: any = {};
      settings?.forEach(setting => {
        settingsObj[setting.setting_key] = setting.setting_value;
      });

      return settingsObj;
    } catch (error) {
      console.error('[CompanyDataIntegration] Error fetching template settings:', error);
      return {};
    }
  }

  /**
   * Generate contextual suggestions based on company data
   */
  static generateDocumentSuggestions(companyData: CompanyData | null, templateType: string): string[] {
    const suggestions: string[] = [];

    if (!companyData) return suggestions;

    // Company-specific suggestions
    if (companyData.country === 'Germany' || companyData.country === 'DE') {
      suggestions.push('Consider German language requirements for user instructions');
      suggestions.push('Ensure compliance with German Medical Device Law (MPG)');
    }

    if (companyData.srn) {
      suggestions.push(`Reference SRN ${companyData.srn} in regulatory documents`);
    }

    // Template-specific suggestions
    if (templateType === 'document-control-sop') {
      suggestions.push('Consider integration with existing quality management system');
      suggestions.push('Ensure alignment with company-specific lifecycle phases');
      
      if (companyData.production_site_name) {
        suggestions.push(`Include ${companyData.production_site_name} in document distribution matrix`);
      }
    }

    return suggestions;
  }
}