
import { useState, useEffect } from "react";
import { CompanyAudit } from "@/types/audit";
import {
  fetchCompanyAudits,
  createCompanyAudit,
  updateCompanyAudit,
  deleteCompanyAudit
} from "@/services/auditService";
import { AuditFormData } from "@/components/audit/AuditForm";
import { withEffectiveStatus } from "@/utils/auditStatusUtils";

export function useCompanyAudits(companyId: string | undefined) {
  const [audits, setAudits] = useState<CompanyAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadAudits = async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchCompanyAudits(companyId);
      // Apply effective status calculation to all audits
      const auditsWithEffectiveStatus = data.map(withEffectiveStatus);
      setAudits(auditsWithEffectiveStatus);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load audits"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudits();
  }, [companyId]);

  const addAudit = async (formData: AuditFormData): Promise<void> => {
    if (!companyId) return;

    try {
      const auditData = {
        company_id: companyId,
        audit_name: formData.auditName,
        audit_type: formData.auditType,
        deadline_date: formData.deadlineDate?.toISOString().split('T')[0],
        status: formData.status,
        responsible_person_id: formData.responsiblePersonId,
        notes: formData.notes
      };

      const newAudit = await createCompanyAudit(auditData);
      if (newAudit) {
        const auditWithEffectiveStatus = withEffectiveStatus(newAudit);
        setAudits(prev => [...prev, auditWithEffectiveStatus]);
      }
    } catch (err) {
      throw err;
    }
  };

  const updateAudit = async (id: string, formData: AuditFormData): Promise<void> => {
    try {
      const auditData = {
        audit_name: formData.auditName,
        audit_type: formData.auditType,
        deadline_date: formData.deadlineDate?.toISOString().split('T')[0],
        status: formData.status,
        responsible_person_id: formData.responsiblePersonId,
        notes: formData.notes
      };

      const updatedAudit = await updateCompanyAudit(id, auditData);
      if (updatedAudit) {
        const auditWithEffectiveStatus = withEffectiveStatus(updatedAudit);
        setAudits(prev => prev.map(audit => audit.id === id ? auditWithEffectiveStatus : audit));
      }
    } catch (err) {
      throw err;
    }
  };

  const removeAudit = async (id: string): Promise<void> => {
    try {
      const success = await deleteCompanyAudit(id);
      if (success) {
        setAudits(prev => prev.filter(audit => audit.id !== id));
      }
    } catch (err) {
      throw err;
    }
  };

  return { audits, loading, error, addAudit, updateAudit, removeAudit, refetch: loadAudits };
}
