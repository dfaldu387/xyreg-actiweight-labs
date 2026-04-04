import { supabase } from "@/integrations/supabase/client";
import type { Supplier, SupplierEvaluation, ProductSupplier, SupplierCertification, SupplierPerformanceLog } from "@/types/supplier";
import { SupplierAuditService } from "./supplierAuditService";

export class SupplierService {
  // Supplier CRUD operations
  static async getSuppliers(companyId: string): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('company_id', companyId)
      .order('name');
    
    if (error) throw error;
    
    // Parse scope_of_supply for each supplier
    return (data || []).map(supplier => ({
      ...supplier,
      scope_of_supply: supplier.scope_of_supply 
        ? (typeof supplier.scope_of_supply === 'string' && supplier.scope_of_supply.startsWith('{')
            ? JSON.parse(supplier.scope_of_supply)
            : supplier.scope_of_supply)
        : undefined
    })) as Supplier[];
  }

  static async getSupplierById(id: string): Promise<Supplier | null> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    // Parse scope_of_supply back to object if it's a string
    const result = data ? {
      ...data,
      scope_of_supply: data.scope_of_supply 
        ? (typeof data.scope_of_supply === 'string' && data.scope_of_supply.startsWith('{')
            ? JSON.parse(data.scope_of_supply)
            : data.scope_of_supply)
        : undefined
    } : null;

    return result as Supplier;
  }

  static async createSupplier(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
    const supplierData: any = {
      ...supplier,
      scope_of_supply: typeof supplier.scope_of_supply === 'object' 
        ? JSON.stringify(supplier.scope_of_supply) 
        : supplier.scope_of_supply
    };

    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplierData)
      .select()
      .single();
    
    if (error) throw error;

    // Parse scope_of_supply back to object if it's a string
    const result = {
      ...data,
      scope_of_supply: data.scope_of_supply 
        ? (typeof data.scope_of_supply === 'string' && data.scope_of_supply.startsWith('{')
            ? JSON.parse(data.scope_of_supply)
            : data.scope_of_supply)
        : undefined
    };

    return result as Supplier;
  }

  static async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    // Get the current supplier data to check for audit scheduling changes
    const currentSupplier = await this.getSupplierById(id);
    if (!currentSupplier) {
      throw new Error('Supplier not found');
    }

    const updateData: any = {
      ...updates,
      scope_of_supply: updates.scope_of_supply && typeof updates.scope_of_supply === 'object' 
        ? JSON.stringify(updates.scope_of_supply) 
        : updates.scope_of_supply
    };

    const { data, error } = await supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;

    // Check if next_scheduled_audit was added or changed
    const hasNewAuditDate = updates.next_scheduled_audit && 
      updates.next_scheduled_audit !== currentSupplier.next_scheduled_audit;

    if (hasNewAuditDate) {
      // Automatically create an audit record when scheduling
      try {
        await SupplierAuditService.createSupplierAudit({
          supplierId: id,
          companyId: data.company_id,
          auditDate: updates.next_scheduled_audit!,
          auditType: 'Supplier Audit',
          supplierName: data.name,
          notes: `Scheduled supplier audit for ${data.name}`
        });
        console.log(`Audit record created for supplier ${data.name} on ${updates.next_scheduled_audit}`);
      } catch (auditError) {
        console.error('Failed to create audit record:', auditError);
        // Continue with supplier update even if audit creation fails
      }
    }

    // Parse scope_of_supply back to object if it's a string
    const result = {
      ...data,
      scope_of_supply: data.scope_of_supply 
        ? (typeof data.scope_of_supply === 'string' && data.scope_of_supply.startsWith('{')
            ? JSON.parse(data.scope_of_supply)
            : data.scope_of_supply)
        : undefined
    };

    return result as Supplier;
  }

  static async deleteSupplier(id: string): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Evaluation operations
  static async getSupplierEvaluations(supplierId: string): Promise<SupplierEvaluation[]> {
    const { data, error } = await supabase
      .from('supplier_evaluations')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('evaluation_date', { ascending: false });
    
    if (error) throw error;
    return (data || []) as SupplierEvaluation[];
  }

  static async createEvaluation(evaluation: Omit<SupplierEvaluation, 'id' | 'created_at' | 'updated_at'>): Promise<SupplierEvaluation> {
    const { data, error } = await supabase
      .from('supplier_evaluations')
      .insert(evaluation)
      .select()
      .single();
    
    if (error) throw error;
    return data as SupplierEvaluation;
  }

  static async updateEvaluation(id: string, updates: Partial<SupplierEvaluation>): Promise<SupplierEvaluation> {
    const { data, error } = await supabase
      .from('supplier_evaluations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as SupplierEvaluation;
  }

  // Product-supplier relationships
  static async getProductSuppliers(productId: string): Promise<ProductSupplier[]> {
    const { data, error } = await supabase
      .from('product_suppliers')
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .eq('product_id', productId)
      .order('component_name');
    
    if (error) throw error;
    return (data || []) as ProductSupplier[];
  }

  static async linkSupplierToProduct(productSupplier: Omit<ProductSupplier, 'id' | 'created_at' | 'updated_at' | 'supplier'>): Promise<ProductSupplier> {
    const { data, error } = await supabase
      .from('product_suppliers')
      .insert(productSupplier)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async unlinkSupplierFromProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('product_suppliers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Certification operations
  static async getSupplierCertifications(supplierId: string): Promise<SupplierCertification[]> {
    const { data, error } = await supabase
      .from('supplier_certifications')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('expiry_date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  static async createCertification(certification: Omit<SupplierCertification, 'id' | 'created_at' | 'updated_at'>): Promise<SupplierCertification> {
    const { data, error } = await supabase
      .from('supplier_certifications')
      .insert(certification)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateCertification(id: string, updates: Partial<SupplierCertification>): Promise<SupplierCertification> {
    const { data, error } = await supabase
      .from('supplier_certifications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteCertification(id: string): Promise<void> {
    const { error } = await supabase
      .from('supplier_certifications')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Performance log operations
  static async getPerformanceLogs(supplierId: string): Promise<SupplierPerformanceLog[]> {
    const { data, error } = await supabase
      .from('supplier_performance_logs')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('log_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createPerformanceLog(log: Omit<SupplierPerformanceLog, 'id' | 'created_at'>): Promise<SupplierPerformanceLog> {
    const { data, error } = await supabase
      .from('supplier_performance_logs')
      .insert(log)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Helper functions
  static async getApprovedSuppliers(companyId: string): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'Approved')
      .order('name');
    
    if (error) throw error;
    return (data || []) as Supplier[];
  }

  static async getAvailableSuppliers(companyId: string): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('company_id', companyId)
      .in('status', ['Approved', 'Probationary'])
      .order('name');
    
    if (error) throw error;
    return (data || []) as Supplier[];
  }

  static async getExpiringCertifications(companyId: string, daysAhead: number = 60): Promise<SupplierCertification[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    const { data, error } = await supabase
      .from('supplier_certifications')
      .select(`
        *,
        supplier:suppliers!inner(id, name, company_id)
      `)
      .eq('supplier.company_id', companyId)
      .lte('expiry_date', futureDate.toISOString().split('T')[0])
      .order('expiry_date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  // Create audit records for suppliers with scheduled audits but no existing audit records
  static async createMissingAuditRecords(companyId: string): Promise<number> {
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('id, name, company_id, next_scheduled_audit')
      .eq('company_id', companyId)
      .not('next_scheduled_audit', 'is', null);
    
    if (error) throw error;
    
    let createdCount = 0;
    
    for (const supplier of suppliers || []) {
      try {
        // Check if audit already exists for this supplier and date
        const existingAudits = await SupplierAuditService.getSupplierAudits(supplier.id);
        const hasMatchingAudit = existingAudits.some(audit => 
          audit.start_date === supplier.next_scheduled_audit
        );
        
        if (!hasMatchingAudit) {
          await SupplierAuditService.createSupplierAudit({
            supplierId: supplier.id,
            companyId: supplier.company_id,
            auditDate: supplier.next_scheduled_audit,
            auditType: 'Supplier Audit',
            supplierName: supplier.name,
            notes: `Retroactively created audit record for scheduled supplier ${supplier.name}`
          });
          createdCount++;
          console.log(`Created missing audit record for supplier ${supplier.name}`);
        }
      } catch (auditError) {
        console.error(`Failed to create audit record for supplier ${supplier.name}:`, auditError);
      }
    }
    
    return createdCount;
  }
}