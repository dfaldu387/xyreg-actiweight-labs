/**
 * QMS Node Process Service
 * 
 * Manages internal process descriptions and SOP links for QMS map nodes.
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface QmsNodeProcess {
  id: string;
  company_id: string;
  node_id: string;
  process_description: string | null;
  process_steps: ProcessStep[] | null;
  updated_at: string;
  updated_by: string | null;
}

export interface ProcessStep {
  step: number;
  description: string;
}

export interface QmsNodeSopLink {
  id: string;
  company_id: string;
  node_id: string;
  document_id: string;
  created_at: string;
  created_by: string | null;
  // Joined from phase_assigned_document_template
  document?: {
    id: string;
    name: string;
    status: string | null;
    document_type: string | null;
    file_path: string | null;
  };
}

/**
 * Default SOP templates for each QMS node — aligned with Xyreg SOP numbering
 */
export const DEFAULT_QMS_NODE_SOPS: Array<{
  nodeId: string;
  sopName: string;
  sopType: string;
  defaultDescription?: string;
}> = [
  // Rung 1 - Company Foundation
  { nodeId: 'mgmt-resp', sopName: 'SOP-001 Quality Management System', sopType: 'SOP', defaultDescription: 'QMS framework, quality policy, and process interactions' },
  { nodeId: 'resource-strategy', sopName: 'SOP-006 Training and Competence', sopType: 'SOP', defaultDescription: 'Training identification, delivery, and effectiveness evaluation' },
  { nodeId: 'infra-training', sopName: 'SOP-018 Control of Monitoring and Measuring Equipment', sopType: 'SOP', defaultDescription: 'Calibration and maintenance procedures' },
  
  // Rung 2 - Device Upstream
  { nodeId: 'reg-planning', sopName: 'SOP-034 Regulatory Submission Management', sopType: 'SOP', defaultDescription: 'Regulatory submission planning and lifecycle management' },
  { nodeId: 'design-inputs', sopName: 'SOP-008 Design and Development', sopType: 'SOP', defaultDescription: 'Design planning, inputs, outputs, reviews, and transfer' },
  { nodeId: 'supplier-selection', sopName: 'SOP-009 Supplier Management', sopType: 'SOP', defaultDescription: 'Supplier evaluation, qualification, and monitoring' },
  
  // Rung 3 - Device Execution
  { nodeId: 'risk-mgmt', sopName: 'SOP-007 Risk Management', sopType: 'SOP', defaultDescription: 'Risk management per ISO 14971' },
  { nodeId: 'design-dev', sopName: 'SOP-008 Design and Development', sopType: 'SOP', defaultDescription: 'Design output, review, and transfer activities' },
  { nodeId: 'supplier-controls', sopName: 'SOP-009 Supplier Management', sopType: 'SOP', defaultDescription: 'Purchasing information, verification, and supplier monitoring' },
  
  // Rung 4 - Device Verification
  { nodeId: 'vv-testing', sopName: 'SOP-015 Clinical Evaluation', sopType: 'SOP', defaultDescription: 'Clinical evaluation, literature review, and CER generation' },
  { nodeId: 'process-validation', sopName: 'SOP-030 Process Validation', sopType: 'SOP', defaultDescription: 'IQ/OQ/PQ protocols and process capability assessment' },
  { nodeId: 'production-monitoring', sopName: 'SOP-010 Production and Process Controls', sopType: 'SOP', defaultDescription: 'Production planning, controls, and monitoring' },
  
  // Rung 5 - Feedback
  { nodeId: 'pms', sopName: 'SOP-013 Complaint Handling', sopType: 'SOP', defaultDescription: 'Complaint intake, investigation, and regulatory reporting' },
  { nodeId: 'capa-loop', sopName: 'SOP-012 Corrective and Preventive Action (CAPA)', sopType: 'SOP', defaultDescription: 'CAPA process including root cause analysis and verification' },
  { nodeId: 'device-pms', sopName: 'SOP-014 Post-Market Surveillance (PMS)', sopType: 'SOP', defaultDescription: 'PMS activities, trend analysis, and PSUR generation' },
  { nodeId: 'device-capa', sopName: 'SOP-012 Corrective and Preventive Action (CAPA)', sopType: 'SOP', defaultDescription: 'Product-specific CAPA procedures' },
  
  // Additional key nodes
  { nodeId: 'doc-control', sopName: 'SOP-002 Document Control', sopType: 'SOP', defaultDescription: 'Document creation, review, approval, and distribution' },
  { nodeId: 'mgmt-review', sopName: 'SOP-004 Management Review', sopType: 'SOP', defaultDescription: 'Management review process and action tracking' },
  { nodeId: 'internal-audit', sopName: 'SOP-005 Internal Audits', sopType: 'SOP', defaultDescription: 'Internal audit program, scheduling, and CAPA linkage' },
  { nodeId: 'vigilance', sopName: 'SOP-022 Vigilance and Field Safety', sopType: 'SOP', defaultDescription: 'Vigilance reporting and field safety corrective actions' },
];

export class QmsNodeProcessService {
  /**
   * Get the internal process content for a specific node
   */
  static async getNodeProcess(companyId: string, nodeId: string): Promise<QmsNodeProcess | null> {
    try {
      const { data, error } = await supabase
        .from('qms_node_internal_processes')
        .select('*')
        .eq('company_id', companyId)
        .eq('node_id', nodeId)
        .maybeSingle();

      if (error) {
        console.error('[QmsNodeProcessService] Error fetching node process:', error);
        return null;
      }

      if (!data) return null;

      return {
        ...data,
        process_steps: data.process_steps as ProcessStep[] | null,
      };
    } catch (error) {
      console.error('[QmsNodeProcessService] Error in getNodeProcess:', error);
      return null;
    }
  }

  /**
   * Update or create internal process content for a node
   */
  static async upsertNodeProcess(
    companyId: string,
    nodeId: string,
    processDescription: string,
    processSteps?: ProcessStep[]
  ): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('qms_node_internal_processes')
        .upsert({
          company_id: companyId,
          node_id: nodeId,
          process_description: processDescription,
          process_steps: processSteps ? JSON.stringify(processSteps) : null,
          updated_at: new Date().toISOString(),
          updated_by: user?.user?.id || null,
        }, {
          onConflict: 'company_id,node_id'
        });

      if (error) {
        console.error('[QmsNodeProcessService] Error upserting node process:', error);
        toast.error('Failed to save internal process');
        return false;
      }

      toast.success('Internal process saved');
      return true;
    } catch (error) {
      console.error('[QmsNodeProcessService] Error in upsertNodeProcess:', error);
      toast.error('Failed to save internal process');
      return false;
    }
  }

  /**
   * Get all linked SOPs for a specific node
   */
  static async getLinkedSOPs(companyId: string, nodeId: string): Promise<QmsNodeSopLink[]> {
    try {
      const { data, error } = await supabase
        .from('qms_node_sop_links')
        .select(`
          *,
          document:phase_assigned_document_template(
            id,
            name,
            status,
            document_type,
            file_path
          )
        `)
        .eq('company_id', companyId)
        .eq('node_id', nodeId);

      if (error) {
        console.error('[QmsNodeProcessService] Error fetching linked SOPs:', error);
        return [];
      }

      return (data || []).map(row => ({
        ...row,
        document: row.document as QmsNodeSopLink['document'],
      }));
    } catch (error) {
      console.error('[QmsNodeProcessService] Error in getLinkedSOPs:', error);
      return [];
    }
  }

  /**
   * Link an SOP document to a node
   */
  static async linkSOP(
    companyId: string,
    nodeId: string,
    documentId: string
  ): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('qms_node_sop_links')
        .insert({
          company_id: companyId,
          node_id: nodeId,
          document_id: documentId,
          created_by: user?.user?.id || null,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('This SOP is already linked to this node');
        } else {
          console.error('[QmsNodeProcessService] Error linking SOP:', error);
          toast.error('Failed to link SOP');
        }
        return false;
      }

      toast.success('SOP linked successfully');
      return true;
    } catch (error) {
      console.error('[QmsNodeProcessService] Error in linkSOP:', error);
      toast.error('Failed to link SOP');
      return false;
    }
  }

  /**
   * Unlink an SOP from a node
   */
  static async unlinkSOP(linkId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('qms_node_sop_links')
        .delete()
        .eq('id', linkId);

      if (error) {
        console.error('[QmsNodeProcessService] Error unlinking SOP:', error);
        toast.error('Failed to unlink SOP');
        return false;
      }

      toast.success('SOP unlinked');
      return true;
    } catch (error) {
      console.error('[QmsNodeProcessService] Error in unlinkSOP:', error);
      toast.error('Failed to unlink SOP');
      return false;
    }
  }

  /**
   * Get all company SOP documents that could be linked
   */
  static async getAvailableSOPs(companyId: string): Promise<Array<{
    id: string;
    name: string;
    status: string | null;
    document_type: string | null;
  }>> {
    try {
      const { data, error } = await supabase
        .from('phase_assigned_document_template')
        .select('id, name, status, document_type')
        .eq('company_id', companyId)
        .in('document_scope', ['company_document', 'company_template'])
        .in('document_type', ['SOP', 'Quality', 'Policy'])
        .order('name');

      if (error) {
        console.error('[QmsNodeProcessService] Error fetching available SOPs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[QmsNodeProcessService] Error in getAvailableSOPs:', error);
      return [];
    }
  }
}
