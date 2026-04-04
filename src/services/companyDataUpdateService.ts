import { supabase } from '@/integrations/supabase/client';

export interface CompanyOrganizationalData {
  type: 'head_of_qa' | 'department_structure' | 'document_numbering' | 'retention_periods' | 'edm_system' | 'approval_workflow' | 'variant_field' | 'document_due_date' | 'password_policy';
  data: any;
}

export class CompanyDataUpdateService {
  /**
   * Save or update company organizational data
   */
  static async saveCompanyData(companyId: string, organizationalData: CompanyOrganizationalData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Saving ${organizationalData.type} data for company ${companyId}:`, organizationalData.data);
      
      // Get existing company data
      const { data: existingCompany, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (fetchError) {
        console.error('Failed to fetch company data:', fetchError);
        throw new Error(`Failed to fetch company data: ${fetchError.message}`);
      }

      console.log('Existing company description:', existingCompany.description);

      // Prepare update data based on type
      let updateData: any = {};

      try {
        // Safely parse existing description, handling null/undefined/invalid JSON
        let existingOrgData = {};
        if (existingCompany.description) {
          try {
            existingOrgData = JSON.parse(existingCompany.description);
          } catch (parseError) {
            console.warn('Failed to parse existing description, starting fresh:', parseError);
            existingOrgData = {};
          }
        }

        switch (organizationalData.type) {
          case 'head_of_qa':
            updateData = {
              ar_name: organizationalData.data.name,
              ar_address: organizationalData.data.department,
              contact_person: organizationalData.data.name,
              email: organizationalData.data.email,
              phone: organizationalData.data.phone
            };
            break;

          case 'department_structure':
            updateData = {
              description: JSON.stringify({
                ...existingOrgData,
                departments: organizationalData.data
              })
            };
            break;

          case 'document_numbering':
            updateData = {
              description: JSON.stringify({
                ...existingOrgData,
                documentNumberingSystem: organizationalData.data
              })
            };
            console.log('Update data for document numbering:', updateData);
            break;

          case 'retention_periods':
            updateData = {
              description: JSON.stringify({
                ...existingOrgData,
                retentionPeriods: organizationalData.data
              })
            };
            break;

          case 'edm_system':
            updateData = {
              description: JSON.stringify({
                ...existingOrgData,
                edmSystem: organizationalData.data
              })
            };
            break;

          case 'approval_workflow':
            updateData = {
              description: JSON.stringify({
                ...existingOrgData,
                approvalWorkflow: organizationalData.data
              })
            };
            break;

          case 'variant_field':
            updateData = {
              variant_field: organizationalData.data
            };
            break;

          case 'document_due_date':
            updateData = {
              description: JSON.stringify({
                ...existingOrgData,
                documentDueDate: organizationalData.data
              })
            };
            break;

          case 'password_policy':
            updateData = {
              description: JSON.stringify({
                ...existingOrgData,
                passwordPolicy: organizationalData.data
              })
            };
            break;

          default:
            throw new Error(`Unknown data type: ${organizationalData.type}`);
        }
      } catch (dataError) {
        console.error('Error preparing update data:', dataError);
        throw new Error(`Failed to prepare update data: ${dataError instanceof Error ? dataError.message : 'Unknown error'}`);
      }

      // Update the company record
      console.log('Updating company with:', updateData);
      const { error: updateError } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', companyId);

      if (updateError) {
        console.error('Failed to update company:', updateError);
        throw new Error(`Failed to update company data: ${updateError.message}`);
      }

      console.log(`Successfully saved ${organizationalData.type} data for company ${companyId}`);
      
      // Dispatch event to notify other parts of the app
      window.dispatchEvent(new CustomEvent('company-data-updated', { 
        detail: { companyId, type: organizationalData.type, data: organizationalData.data } 
      }));
      
      return { success: true };
    } catch (error) {
      console.error('Error saving company data:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save company data' 
      };
    }
  }

  /**
   * Retrieve company organizational data
   */
  static async getCompanyOrganizationalData(companyId: string): Promise<any> {
    try {
      const { data: company, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch company data: ${error.message}`);
      }

      // Parse the stored organizational data
      const organizationalData = JSON.parse(company.description || '{}');

      const companyVariantFields = (company as any)?.variant_field ?? null;

      return {
        headOfQA: {
          name: company.ar_name || company.contact_person,
          email: company.email,
          phone: company.phone,
          department: company.ar_address || 'Quality Assurance'
        },
        departments: organizationalData.departments || [],
        documentNumberingSystem: organizationalData.documentNumberingSystem || {
          prefix: 'SOP',
          numberFormat: 'XXX',
          startingNumber: '001',
          versionFormat: 'V1.0'
        },
        retentionPeriods: organizationalData.retentionPeriods || {
          sops: '7 years',
          qualityRecords: '10 years',
          designFiles: 'Lifetime + 15 years',
          clinicalData: '25 years'
        },
        edmSystem: organizationalData.edmSystem || {
          platform: 'SharePoint',
          accessControls: 'Role-based',
          backupSchedule: 'Daily',
          auditTrail: 'Enabled'
        },
        approvalWorkflow: organizationalData.approvalWorkflow || [
          { role: 'Document Author', action: 'Create/Revise', order: 1 },
          { role: 'Department Head', action: 'Technical Review', order: 2 },
          { role: 'Quality Manager', action: 'Quality Review', order: 3 },
          { role: 'Head of QA', action: 'Final Approval', order: 4 }
        ],
        variantFields: companyVariantFields || organizationalData.variantFields || null,
        documentDueDate: organizationalData.documentDueDate || {
          days: 0,
          timing: 'before',
          phaseDateType: 'phase_end_date'
        }
      };
    } catch (error) {
      console.error('Error retrieving company organizational data:', error);
      throw error;
    }
  }

  /**
   * Check which organizational data is missing for a company
   */
  static async getMissingDataItems(companyId: string): Promise<string[]> {
    try {
      // Fetch company data directly to check for saved data
      const { data: company, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error) {
        console.error('Error fetching company for missing data check:', error);
        return ['head_of_qa', 'department_structure', 'document_numbering', 'retention_periods', 'edm_system', 'approval_workflow'];
      }

      const orgData = await this.getCompanyOrganizationalData(companyId);
      const missingItems: string[] = [];

      // Check Head of QA
      if (!orgData.headOfQA?.name || !orgData.headOfQA?.email) {
        missingItems.push('head_of_qa');
      }

      // Check Department Structure
      if (!orgData.departments || orgData.departments.length === 0) {
        missingItems.push('department_structure');
      }

      // Check Document Numbering System - only missing if no saved data exists
      let hasCustomDocNumbering = false;
      if (company.description) {
        try {
          const parsedData = JSON.parse(company.description);
          hasCustomDocNumbering = parsedData.documentNumberingSystem !== undefined;
        } catch (parseError) {
          console.warn('Failed to parse company description for missing data check:', parseError);
        }
      }
      if (!hasCustomDocNumbering) {
        missingItems.push('document_numbering');
      }

      // Check Retention Periods - only missing if no saved data exists
      let hasCustomRetentionPeriods = false;
      if (company.description) {
        try {
          const parsedData = JSON.parse(company.description);
          hasCustomRetentionPeriods = parsedData.retentionPeriods !== undefined;
        } catch (parseError) {
          console.warn('Failed to parse company description for retention periods check:', parseError);
        }
      }
      if (!hasCustomRetentionPeriods) {
        missingItems.push('retention_periods');
      }

      // Check EDM System - only missing if no saved data exists
      let hasCustomEdmSystem = false;
      if (company.description) {
        try {
          const parsedData = JSON.parse(company.description);
          hasCustomEdmSystem = parsedData.edmSystem !== undefined;
        } catch (parseError) {
          console.warn('Failed to parse company description for EDM system check:', parseError);
        }
      }
      if (!hasCustomEdmSystem) {
        missingItems.push('edm_system');
      }

      // Check Approval Workflow
      if (!orgData.approvalWorkflow || orgData.approvalWorkflow.length === 0) {
        missingItems.push('approval_workflow');
      }

      console.log(`Missing data items for company ${companyId}:`, missingItems);
      return missingItems;
    } catch (error) {
      console.error('Error checking missing data items:', error);
      return ['head_of_qa', 'department_structure', 'document_numbering', 'retention_periods', 'edm_system', 'approval_workflow'];
    }
  }
}