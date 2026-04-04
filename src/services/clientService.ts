
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/client";

/**
 * Service for managing client (company) data
 */
export const clientService = {
  /**
   * Get all client companies with their related data
   */
  async getClients(): Promise<Client[]> {
    // Fetch companies
    const { data: companies, error } = await supabase
      .from('companies')
      .select('*')
      .eq('is_archived', false)
      .order('name');
    
    if (error) {
      console.error('Error fetching clients:', error);
      throw new Error('Failed to fetch clients');
    }
    
    // Build the client list with calculated fields
    const clients: Client[] = [];
    
    for (const company of companies) {
      // Get products for this company
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, status, progress')
        .eq('company_id', company.id)
        .eq('is_archived', false);
      
      if (productsError) {
        console.error(`Error fetching products for company ${company.name}:`, productsError);
        continue;
      }
      
      // Get alerts (overdue documents, upcoming audits)
      const alerts = await this.getClientAlerts(company.id);
      
      // Calculate overall status based on products
      const status = this.calculateClientStatus(products);
      
      // Calculate overall progress as average of product progress values
      const progress = products.length > 0 
        ? Math.round(products.reduce((sum, product) => sum + (product.progress || 0), 0) / products.length) 
        : 0;
      
      clients.push({
        id: company.id,
        name: company.name,
        country: company.country || 'Unknown',
        products: products.length,
        progress,
        alerts,
        status,
      });
    }
    
    return clients;
  },
  
  /**
   * Get a single client by ID
   */
  async getClientById(id: string): Promise<Client | null> {
    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !company) {
      console.error('Error fetching client by ID:', error);
      return null;
    }
    
    // Get products for this company
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, status, progress')
      .eq('company_id', company.id)
      .eq('is_archived', false);
    
    if (productsError) {
      console.error(`Error fetching products for company ${company.name}:`, productsError);
      return null;
    }
    
    // Get alerts
    const alerts = await this.getClientAlerts(company.id);
    
    // Calculate status and progress
    const status = this.calculateClientStatus(products);
    const progress = products.length > 0 
      ? Math.round(products.reduce((sum, product) => sum + (product.progress || 0), 0) / products.length) 
      : 0;
    
    return {
      id: company.id,
      name: company.name,
      country: company.country || 'Unknown',
      products: products.length,
      progress,
      alerts,
      status,
    };
  },
  
  /**
   * Get alerts for a specific client
   */
  async getClientAlerts(companyId: string): Promise<string[]> {
    const alerts: string[] = [];
    
    // Fetch products for this company
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .eq('company_id', companyId)
      .eq('is_archived', false);
    
    if (productsError) {
      console.error('Error fetching products for alerts:', productsError);
      return alerts;
    }
    
    if (products.length === 0) {
      return alerts;
    }
    
    const productIds = products.map(p => p.id);
    
    // Check for overdue documents
    const { data: overdueDocuments, error: docError } = await supabase
      .from('documents')
      .select('id, name')
      .in('product_id', productIds)
      .lt('due_date', new Date().toISOString())
      .eq('status', 'Pending');
    
    if (!docError && overdueDocuments && overdueDocuments.length > 0) {
      alerts.push(`${overdueDocuments.length} documents overdue`);
    }
    
    // Check for incomplete audits
    const { data: incompleteAudits, error: auditError } = await supabase
      .from('product_audits')
      .select('id, audit_name')
      .in('product_id', productIds)
      .eq('status', 'Planned')
      .lt('deadline_date', new Date().toISOString());
    
    if (!auditError && incompleteAudits && incompleteAudits.length > 0) {
      alerts.push(`${incompleteAudits.length} ${incompleteAudits.length === 1 ? 'audit' : 'audits'} unscheduled`);
    }
    
    return alerts;
  },
  
  /**
   * Calculate client status based on product statuses
   */
  calculateClientStatus(products: any[]): "On Track" | "At Risk" | "Needs Attention" {
    if (products.length === 0) {
      return "On Track"; // Default for no products
    }
    
    const atRiskCount = products.filter(p => p.status === 'At Risk').length;
    const needsAttentionCount = products.filter(p => p.status === 'Needs Attention').length;
    
    if (atRiskCount > 0) {
      return "At Risk";
    } else if (needsAttentionCount > 0) {
      return "Needs Attention";
    } else {
      return "On Track";
    }
  }
};
