
import { supabase } from "@/integrations/supabase/client";
import { InclusionRule } from "@/types/documentInclusion";
import { toast } from "sonner";

type TableName = 'documents' | 'phase_assigned_documents' | 'company_document_templates';

export class DocumentInclusionService {
  static async updateInclusionRule(
    documentId: string, 
    rule: InclusionRule,
    table: TableName = 'documents'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(table)
        .update({ 
          inclusion_rules: rule,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', documentId);

      if (error) throw error;

      toast.success('Document inclusion settings updated');
      return true;
    } catch (error) {
      console.error('Error updating inclusion rule:', error);
      toast.error('Failed to update inclusion settings');
      return false;
    }
  }

  static async getDocumentsWithInclusionRules(
    companyId: string,
    table: TableName = 'documents'
  ): Promise<any[]> {
    try {
      console.log('Fetching documents with inclusion rules from table:', table);

      // Try to query with inclusion_rules and is_protected columns
      const { data, error } = await supabase
        .from(table as any)
        .select('id, name, inclusion_rules, is_protected')
        .eq('company_id', companyId)
        .order('name');

      // If successful and we have data, return it
      if (!error && data) {
        console.log('Successfully fetched documents with inclusion rules');
        return data.map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          inclusion_rules: doc.inclusion_rules || { type: 'always_include' } as InclusionRule,
          is_protected: doc.is_protected || false
        }));
      }

      // If the columns don't exist, fall back to basic query
      console.log('Inclusion rules columns not found, using fallback query');
      
      const { data: basicData, error: basicError } = await supabase
        .from(table as any)
        .select('id, name')
        .eq('company_id', companyId)
        .order('name');
        
      if (basicError) {
        console.error('Basic query failed:', basicError);
        return [];
      }
      
      // Add default inclusion rules to the results
      return (basicData || []).map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        inclusion_rules: { type: 'always_include' } as InclusionRule,
        is_protected: false
      }));

    } catch (error) {
      console.error('Error fetching documents with inclusion rules:', error);
      return [];
    }
  }

  static async markDocumentAsProtected(
    documentId: string,
    isProtected: boolean = true,
    table: TableName = 'documents'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(table)
        .update({ 
          is_protected: isProtected,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', documentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating document protection status:', error);
      return false;
    }
  }
}
