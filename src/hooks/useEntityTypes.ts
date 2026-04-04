import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EntityType {
  value: string;
  label: string;
  table: string;
}

// Define all available entity types in the system
const ENTITY_TYPES: EntityType[] = [
  { value: 'Document', label: 'Documents', table: 'documents' },
  { value: 'Activity', label: 'Activities', table: 'activities' },
  { value: 'Audit', label: 'Audits', table: 'audits' },
  { value: 'Company Audit', label: 'Company Audits', table: 'company_audits' },
  { value: 'Certification', label: 'Certifications', table: 'certifications' },
  { value: 'Product', label: 'Products', table: 'products' },
  { value: 'Company', label: 'Companies', table: 'companies' },
  { value: 'Reviewer', label: 'Reviewers', table: 'review_assignments' },
  { value: 'Gap Analysis', label: 'Gap Analysis', table: 'gap_analyses' },
  { value: 'CI Instance', label: 'CI Instances', table: 'ci_instances' },
  { value: 'CI Template', label: 'CI Templates', table: 'ci_templates' },
  { value: 'Activity Template', label: 'Activity Templates', table: 'activity_templates' },
  { value: 'Audit Template', label: 'Audit Templates', table: 'audit_templates' },
  { value: 'Commercial Forecast', label: 'Commercial Forecasts', table: 'commercial_forecasts' },
  { value: 'Basic UDI DI Group', label: 'Basic UDI DI Groups', table: 'basic_udi_di_groups' },
  { value: 'Device Category', label: 'Device Categories', table: 'company_device_categories' },
  { value: 'Document Template', label: 'Document Templates', table: 'company_document_templates' },
  { value: 'Phase', label: 'Phases', table: 'company_phases' },
  { value: 'Comment', label: 'Comments', table: 'comments' },
  { value: 'Comment Thread', label: 'Comment Threads', table: 'comment_threads' }
];

export function useEntityTypes(companyId?: string) {
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [availableEntityTypes, setAvailableEntityTypes] = useState<string[]>(['All']);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAvailableEntityTypes = async () => {
      if (!companyId) {
        setEntityTypes(ENTITY_TYPES);
        setAvailableEntityTypes(['All', ...ENTITY_TYPES.map(et => et.value)]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Get unique entity types from actual audit logs
        const { data: auditData, error } = await supabase
          .from('document_audit_logs')
          .select('action, action_details')
          .eq('company_id', companyId);

        if (error) {
          console.error('Error fetching audit data:', error);
          // Fallback to all entity types
          setEntityTypes(ENTITY_TYPES);
          setAvailableEntityTypes(['All', ...ENTITY_TYPES.map(et => et.value)]);
          return;
        }

        // For now, we'll use all defined entity types since audit logs are document-specific
        // In a real implementation, you'd check which entity types have actual data
        const availableTypes = ['All', ...ENTITY_TYPES.map(et => et.value)];
        
        setEntityTypes(ENTITY_TYPES);
        setAvailableEntityTypes(availableTypes);
      } catch (error) {
        console.error('Error in fetchAvailableEntityTypes:', error);
        // Fallback to all entity types
        setEntityTypes(ENTITY_TYPES);
        setAvailableEntityTypes(['All', ...ENTITY_TYPES.map(et => et.value)]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableEntityTypes();
  }, [companyId]);

  return {
    entityTypes,
    availableEntityTypes,
    isLoading
  };
}