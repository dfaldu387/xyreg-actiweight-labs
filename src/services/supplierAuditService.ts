import { supabase } from '@/integrations/supabase/client';

export class SupplierAuditService {
  static async createSupplierAudit(supplierData: {
    supplierId: string;
    companyId: string;
    auditDate: string;
    auditType?: string;
    notes?: string;
    supplierName?: string;
  }) {
    // Get supplier name if not provided
    let supplierName = supplierData.supplierName;
    if (!supplierName) {
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('name')
        .eq('id', supplierData.supplierId)
        .single();
      supplierName = supplier?.name || 'Unknown Supplier';
    }

    // Calculate proper dates - start date and deadline should be different
    const startDate = supplierData.auditDate;
    const deadlineDate = new Date(supplierData.auditDate);
    deadlineDate.setDate(deadlineDate.getDate() + 30); // Add 30 days buffer

    const { data, error } = await supabase
      .from('company_audits')
      .insert({
        company_id: supplierData.companyId,
        audit_type: supplierData.auditType || 'Supplier Audit',
        audit_name: `Supplier Audit - ${supplierName}`,
        start_date: startDate,
        deadline_date: deadlineDate.toISOString().split('T')[0], // Proper deadline
        status: 'Planned',
        notes: supplierData.notes || `Scheduled audit for supplier ${supplierName} (ID: ${supplierData.supplierId})`,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getSupplierAudits(supplierId: string) {
    // Get supplier name for better matching
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('name')
      .eq('id', supplierId)
      .single();
    
    if (!supplier) return [];
    
    const { data, error } = await supabase
      .from('company_audits')
      .select('*')
      .eq('audit_type', 'Supplier Audit')
      .or(`notes.ilike.%${supplierId}%,audit_name.ilike.%${supplier.name}%`)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async generateSupplierReport(supplierId: string) {
    // This would generate a comprehensive report including:
    // - Evaluation status
    // - CI issues and documents
    // - Audit history
    // - Compliance status
    
    // For now, return a mock structure that could be used to generate PDF/export
    return {
      supplierId,
      generatedAt: new Date().toISOString(),
      reportType: 'Supplier Evaluation Report',
      sections: [
        'Supplier Information',
        'Evaluation Status',
        'CI Issues & Documents',
        'Audit History',
        'Compliance Assessment',
        'Recommendations'
      ]
    };
  }

  static async createMissingSupplierAudits(companyId: string) {
    // Get all suppliers with scheduled audits
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('id, name, company_id, next_scheduled_audit')
      .eq('company_id', companyId)
      .not('next_scheduled_audit', 'is', null);
    
    if (error) throw error;
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const supplier of suppliers || []) {
      try {
        // Check if audit already exists for this supplier and date range
        const existingAudits = await this.getSupplierAudits(supplier.id);
        
        // More robust duplicate detection
        const hasMatchingAudit = existingAudits.some(audit => {
          // Check if audit name contains supplier name
          const auditNameMatch = audit.audit_name.includes(supplier.name);
          // Check if notes contain supplier ID
          const notesMatch = audit.notes?.includes(supplier.id);
          // Check if start date is within 7 days of scheduled date
          const dateMatch = audit.start_date && 
            Math.abs(new Date(audit.start_date).getTime() - new Date(supplier.next_scheduled_audit).getTime()) < (7 * 24 * 60 * 60 * 1000);
          
          return auditNameMatch && (notesMatch || dateMatch);
        });
        
        if (!hasMatchingAudit) {
          await this.createSupplierAudit({
            supplierId: supplier.id,
            companyId: supplier.company_id,
            auditDate: supplier.next_scheduled_audit,
            auditType: 'Supplier Audit',
            supplierName: supplier.name,
            notes: `Retroactively created audit record for scheduled supplier ${supplier.name} (ID: ${supplier.id})`
          });
          createdCount++;
        } else {
          skippedCount++;
        }
      } catch {
        // Failed to create audit record for supplier
      }
    }
    
    return {
      message: `Created ${createdCount} missing audit records`,
      createdCount,
      skippedCount
    };
  }
}