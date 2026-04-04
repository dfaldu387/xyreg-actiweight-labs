
import { useState, useEffect } from "react";
import { ProductAudit } from "@/types/audit";
import {
  fetchProductAudits,
  createProductAudit,
  updateProductAudit,
  deleteProductAudit
} from "@/services/auditService";
import { AuditFormData } from "@/components/audit/AuditForm";
import { withEffectiveStatus } from "@/utils/auditStatusUtils";

export function useProductAudits(productId: string | undefined) {
  const [audits, setAudits] = useState<ProductAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    const loadAudits = async () => {
      try {
        setLoading(true);
        const data = await fetchProductAudits(productId);
        // Apply effective status calculation to all audits
        const auditsWithEffectiveStatus = data.map(withEffectiveStatus);
        setAudits(auditsWithEffectiveStatus);
      } catch (err) {
        console.error("Error loading product audits:", err);
        setError(err instanceof Error ? err : new Error("Failed to load audits"));
      } finally {
        setLoading(false);
      }
    };

    loadAudits();
  }, [productId]);

  const addAudit = async (formData: any): Promise<void> => {
    if (!productId) return;

    try {
      // Handle both camelCase (from forms) and snake_case (from templates)
      const auditData = {
        product_id: productId,
        audit_name: formData.audit_name || formData.auditName,
        audit_type: formData.audit_type || formData.auditType,
        lifecycle_phase: formData.lifecycle_phase || formData.lifecyclePhase,
        start_date: formData.start_date,
        end_date: formData.end_date,
        deadline_date: formData.deadline_date || (formData.deadlineDate ? formData.deadlineDate.toISOString().split('T')[0] : null),
        status: formData.status || "Planned",
        responsible_person_id: formData.responsible_person_id || formData.responsiblePersonId,
        notes: formData.notes,
        // Preserve phase_id from formData if provided (company phase ID)
        phase_id: formData.phase_id !== undefined ? formData.phase_id : null
      };

      console.log('Adding audit with data:', auditData);
      const newAudit = await createProductAudit(auditData);
      if (newAudit) {
        const auditWithEffectiveStatus = withEffectiveStatus(newAudit);
        setAudits(prev => [...prev, auditWithEffectiveStatus]);
      }
    } catch (err) {
      console.error("Error adding audit:", err);
      throw err;
    }
  };

  const updateAudit = async (id: string, formData: any): Promise<void> => {
    try {
      const auditData = {
        audit_name: formData.auditName,
        audit_type: formData.auditType,
        lifecycle_phase: formData.lifecyclePhase,
        start_date: formData.start_date,
        end_date: formData.end_date,
        deadline_date: formData.deadlineDate ? formData.deadlineDate.toISOString().split('T')[0] : null,
        status: formData.status,
        responsible_person_id: formData.responsiblePersonId,
        notes: formData.notes,
        phase_id: formData.phase_id !== undefined ? formData.phase_id : undefined
      };

      const updatedAudit = await updateProductAudit(id, auditData);
      if (updatedAudit) {
        const auditWithEffectiveStatus = withEffectiveStatus(updatedAudit);
        setAudits(prev => prev.map(audit => audit.id === id ? auditWithEffectiveStatus : audit));
      }
    } catch (err) {
      console.error("Error updating audit:", err);
      throw err;
    }
  };

  const removeAudit = async (id: string): Promise<void> => {
    try {
      const success = await deleteProductAudit(id);
      if (success) {
        setAudits(prev => prev.filter(audit => audit.id !== id));
      }
    } catch (err) {
      console.error("Error removing audit:", err);
      throw err;
    }
  };

  return { audits, loading, error, addAudit, updateAudit, removeAudit };
}
