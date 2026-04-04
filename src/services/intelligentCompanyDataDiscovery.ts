import { supabase } from '@/integrations/supabase/client';

export interface DiscoveredCompanyData {
  basicInfo: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    srn?: string;
    contact_person?: string;
    description?: string;
  };
  organizationalData: {
    documentNumbering?: any;
    retentionPeriods?: any;
    edmSystem?: any;
    approvalWorkflow?: any;
    departmentStructure?: any[];
  };
  personnel: {
    users: any[];
    qaHead?: any;
    management?: any[];
    departments?: any[];
  };
  templateSettings: {
    [key: string]: any;
  };
  apiConfiguration: {
    hasOpenAI: boolean;
    hasGemini: boolean;
    hasAnthropic: boolean;
  };
  categories: any[];
  deviceCategories: any[];
  productPlatforms: any[];
  productModels: any[];
  phases: any[];
  chosenPhases: any[];
  completeness: {
    score: number;
    availableFields: string[];
    missingFields: string[];
  };
}

/**
 * Intelligent Company Data Discovery Service
 * Automatically scans ALL possible sources to discover available company information
 */
export class IntelligentCompanyDataDiscovery {
  
  /**
   * Comprehensively scan and discover ALL available company data
   */
  static async discoverAllCompanyData(companyId: string): Promise<DiscoveredCompanyData> {
    console.log('[IntelligentDiscovery] Starting comprehensive company data discovery for:', companyId);
    
    try {
      // Parallel data fetching for maximum efficiency
      const [
        basicCompanyData,
        organizationalData,
        personnelData,
        templateSettingsData,
        apiConfigData,
        categoriesData,
        deviceCategoriesData,
        productPlatformsData,
        productModelsData,
        phasesData,
        chosenPhasesData
      ] = await Promise.all([
        this.scanBasicCompanyInfo(companyId),
        this.scanOrganizationalData(companyId),
        this.scanPersonnelData(companyId),
        this.scanTemplateSettings(companyId),
        this.scanApiConfiguration(companyId),
        this.scanCategories(companyId),
        this.scanDeviceCategories(companyId),
        this.scanProductPlatforms(companyId),
        this.scanProductModels(companyId),
        this.scanPhases(companyId),
        this.scanChosenPhases(companyId)
      ]);

      const discoveredData: DiscoveredCompanyData = {
        basicInfo: basicCompanyData,
        organizationalData,
        personnel: personnelData,
        templateSettings: templateSettingsData,
        apiConfiguration: apiConfigData,
        categories: categoriesData,
        deviceCategories: deviceCategoriesData,
        productPlatforms: productPlatformsData,
        productModels: productModelsData,
        phases: phasesData,
        chosenPhases: chosenPhasesData,
        completeness: this.calculateCompleteness(basicCompanyData, organizationalData, personnelData, templateSettingsData)
      };

      console.log('[IntelligentDiscovery] Discovery completed:', {
        completenessScore: discoveredData.completeness.score,
        availableFields: discoveredData.completeness.availableFields.length,
        missingFields: discoveredData.completeness.missingFields.length
      });

      return discoveredData;
    } catch (error) {
      console.error('[IntelligentDiscovery] Error during comprehensive discovery:', error);
      throw error;
    }
  }

  /**
   * Scan basic company information
   */
  private static async scanBasicCompanyInfo(companyId: string) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error) throw error;
      
      return {
        name: data?.name,
        address: data?.address,
        phone: data?.phone || data?.telephone,
        email: data?.email,
        website: data?.website,
        srn: data?.srn,
        contact_person: data?.contact_person,
        description: data?.description,
        city: data?.city,
        postal_code: data?.postal_code,
        country: data?.country,
        ar_name: data?.ar_name,
        ar_address: data?.ar_address,
        ar_city: data?.ar_city,
        ar_postal_code: data?.ar_postal_code,
        ar_country: data?.ar_country,
        production_site_name: data?.production_site_name,
        production_site_address: data?.production_site_address,
        production_site_city: data?.production_site_city,
        production_site_postal_code: data?.production_site_postal_code,
        production_site_country: data?.production_site_country,
        department_structure: data?.department_structure,
        default_markets: data?.default_markets,
        importers: data?.importers,
        notified_body_id: data?.notified_body_id
      };
    } catch (error) {
      console.error('[IntelligentDiscovery] Error scanning basic company info:', error);
      return {};
    }
  }

  /**
   * Scan organizational data from CompanyDataUpdateService
   */
  private static async scanOrganizationalData(companyId: string) {
    try {
      const { CompanyDataUpdateService } = await import('./companyDataUpdateService');
      const orgData = await CompanyDataUpdateService.getCompanyOrganizationalData(companyId);
      
      return {
        documentNumbering: orgData?.documentNumberingSystem,
        retentionPeriods: orgData?.retentionPeriods,
        edmSystem: orgData?.edmSystem,
        approvalWorkflow: orgData?.approvalWorkflow,
        departmentStructure: orgData?.departmentStructure
      };
    } catch (error) {
      console.error('[IntelligentDiscovery] Error scanning organizational data:', error);
      return {};
    }
  }

  /**
   * Scan personnel and user data
   */
  private static async scanPersonnelData(companyId: string) {
    try {
      // Get user company access data
      const { data: userAccess, error: accessError } = await supabase
        .from('user_company_access')
        .select(`
          user_id,
          access_level,
          user_profiles!inner(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('company_id', companyId);

      if (accessError) throw accessError;

      const users = userAccess?.map(access => ({
        id: access.user_profiles?.id,
        first_name: access.user_profiles?.first_name,
        last_name: access.user_profiles?.last_name,
        email: access.user_profiles?.email,
        access_level: access.access_level
      })) || [];

      const qaHead = users.find(user => 
        user.access_level === 'admin' || 
        user.first_name?.toLowerCase().includes('qa') ||
        user.last_name?.toLowerCase().includes('quality')
      );

      const management = users.filter(user => 
        user.access_level === 'admin'
      );

      // Extract unique departments from company department structure
      const { data: companyData } = await supabase
        .from('companies')
        .select('department_structure')
        .eq('id', companyId)
        .single();

      let departments: any[] = [];
      if (companyData?.department_structure && Array.isArray(companyData.department_structure)) {
        departments = companyData.department_structure;
      }

      return {
        users,
        qaHead,
        management,
        departments
      };
    } catch (error) {
      console.error('[IntelligentDiscovery] Error scanning personnel data:', error);
      return { users: [], management: [], departments: [] };
    }
  }

  /**
   * Scan template settings
   */
  private static async scanTemplateSettings(companyId: string) {
    try {
      const { data, error } = await supabase
        .from('template_settings')
        .select('*')
        .eq('company_id', companyId);

      if (error) throw error;

      const settings: { [key: string]: any } = {};
      data?.forEach(setting => {
        settings[setting.setting_key] = setting.setting_value;
      });

      return settings;
    } catch (error) {
      console.error('[IntelligentDiscovery] Error scanning template settings:', error);
      return {};
    }
  }

  /**
   * Scan API configuration
   */
  private static async scanApiConfiguration(companyId: string) {
    try {
      const { data, error } = await supabase
        .from('company_api_keys')
        .select('key_type')
        .eq('company_id', companyId);

      if (error) throw error;

      return {
        hasOpenAI: data?.some(key => key.key_type === 'openai') || false,
        hasGemini: data?.some(key => key.key_type === 'gemini') || false,
        hasAnthropic: data?.some(key => key.key_type === 'anthropic') || false
      };
    } catch (error) {
      console.error('[IntelligentDiscovery] Error scanning API configuration:', error);
      return { hasOpenAI: false, hasGemini: false, hasAnthropic: false };
    }
  }

  /**
   * Scan company categories
   */
  private static async scanCategories(companyId: string) {
    try {
      const { data, error } = await supabase
        .from('company_category_preferences')
        .select('*')
        .eq('company_id', companyId);

      return data || [];
    } catch (error) {
      console.error('[IntelligentDiscovery] Error scanning categories:', error);
      return [];
    }
  }

  /**
   * Scan device categories
   */
  private static async scanDeviceCategories(companyId: string) {
    try {
      const { data, error } = await supabase
        .from('company_device_categories')
        .select('*')
        .eq('company_id', companyId);

      return data || [];
    } catch (error) {
      console.error('[IntelligentDiscovery] Error scanning device categories:', error);
      return [];
    }
  }

  /**
   * Scan product platforms - using existing products table
   */
  private static async scanProductPlatforms(companyId: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('product_platform')
        .eq('company_id', companyId)
        .not('product_platform', 'is', null);

      const platforms = [...new Set(data?.map(p => p.product_platform).filter(Boolean))];
      return platforms.map(platform => ({ name: platform, company_id: companyId }));
    } catch (error) {
      console.error('[IntelligentDiscovery] Error scanning product platforms:', error);
      return [];
    }
  }

  /**
   * Scan product models - using existing products table
   */
  private static async scanProductModels(companyId: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('model_reference, name')
        .eq('company_id', companyId)
        .not('model_reference', 'is', null);

      return data?.map(p => ({ 
        model_reference: p.model_reference, 
        name: p.name,
        company_id: companyId 
      })) || [];
    } catch (error) {
      console.error('[IntelligentDiscovery] Error scanning product models:', error);
      return [];
    }
  }

  /**
   * Scan available phases - using lifecycle_phases table
   */
  private static async scanPhases(companyId: string) {
    try {
      const { data, error } = await supabase
        .from('lifecycle_phases')
        .select('*');

      return data || [];
    } catch (error) {
      console.error('[IntelligentDiscovery] Error scanning phases:', error);
      return [];
    }
  }

  /**
   * Scan chosen/active phases
   */
  private static async scanChosenPhases(companyId: string) {
    try {
      const { data, error } = await supabase
        .from('company_chosen_phases')
        .select('*')
        .eq('company_id', companyId)
        .order('position');

      return data || [];
    } catch (error) {
      console.error('[IntelligentDiscovery] Error scanning chosen phases:', error);
      return [];
    }
  }

  /**
   * Calculate data completeness score
   */
  private static calculateCompleteness(basicInfo: any, orgData: any, personnel: any, settings: any) {
    const availableFields: string[] = [];
    const missingFields: string[] = [];

    // Check basic info
    const basicFields = ['name', 'address', 'phone', 'email', 'contact_person'];
    basicFields.forEach(field => {
      if (basicInfo[field]) {
        availableFields.push(`basic_${field}`);
      } else {
        missingFields.push(`basic_${field}`);
      }
    });

    // Check organizational data
    if (orgData.documentNumbering) availableFields.push('document_numbering');
    else missingFields.push('document_numbering');

    if (orgData.retentionPeriods) availableFields.push('retention_periods');
    else missingFields.push('retention_periods');

    if (orgData.edmSystem) availableFields.push('edm_system');
    else missingFields.push('edm_system');

    // Check personnel
    if (personnel.qaHead) availableFields.push('qa_head');
    else missingFields.push('qa_head');

    if (personnel.users?.length > 0) availableFields.push('personnel');
    else missingFields.push('personnel');

    // Calculate score (0-100)
    const totalFields = availableFields.length + missingFields.length;
    const score = totalFields > 0 ? Math.round((availableFields.length / totalFields) * 100) : 0;

    return {
      score,
      availableFields,
      missingFields
    };
  }
}