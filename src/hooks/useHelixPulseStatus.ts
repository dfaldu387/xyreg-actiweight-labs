import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  HELIX_NODE_CONFIGS,
  type HelixNodeConfig,
  type HelixNodeStatus,
} from '@/config/helixNodeConfig';
import type { RBRDocumentPrefix } from '@/types/riskBasedRationale';
import type { PendingItem } from './useRBRPulseStatus';

export interface LinkedSOPInfo {
  id: string;
  name: string;
  status: string | null;
}

export interface SOPStatusData {
  status: 'complete' | 'in-progress' | 'missing' | 'na';
  counts: { total: number; approved: number; pending: number };
  linkedSOPs: LinkedSOPInfo[];
}

export interface HelixPulseData {
  nodeId: string;
  status: HelixNodeStatus;
  nestedRBR?: {
    type: string;
    label: string;
    status: HelixNodeStatus;
  };
  productCount?: number;
  count?: number;
  pendingCount?: number;
  approvedCount?: number;
  lastUpdated: string | null;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  // Status Over Time fields
  daysSinceUpdate: number | null;
  timeStatus: 'recent' | 'attention' | 'overdue' | 'unknown';
  // Evidence Escalation field
  escalatedCount?: number;
  // SOP Status fields
  sopStatus?: SOPStatusData;
  // Detailed diagnostics
  pendingItems?: PendingItem[];
  approvedItems?: PendingItem[];
  criticalIssues?: string[];
}

// Demo mock data for visualization - makes the system feel alive
// NOTE: sopStatus is NOT included here - it's always fetched from real database
const DEMO_MOCK_DATA: Record<string, Partial<HelixPulseData>> = {
  // Rung 1 - Company Foundation
  'mgmt-resp': {
    status: 'validated',
    lastUpdated: '2026-01-28T10:00:00Z',
    pendingItems: [],
    approvedItems: [
      { id: 'mr1', documentId: 'QM-001', name: 'Quality Policy Review', status: 'approved', createdAt: '2026-01-15T09:00:00Z' },
    ],
    // sopStatus intentionally omitted - will be fetched from real DB
  },
  'resource-strategy': {
    status: 'critical',
    nestedRBR: {
      type: 'RBR-TRN',
      label: 'Training Effectiveness',
      status: 'critical',
    },
    pendingCount: 2,
    approvedCount: 0,
    lastUpdated: '2026-01-15T10:30:00Z',
    pendingItems: [
      { id: 'rs1', documentId: 'TRN-RBR-001', name: 'Operator Training Effectiveness', status: 'pending', createdAt: '2026-01-10T08:00:00Z', dueDate: '2026-01-25T00:00:00Z' },
      { id: 'rs2', documentId: 'TRN-RBR-002', name: 'QC Inspector Competency', status: 'draft', createdAt: '2026-01-12T09:30:00Z' },
    ],
    approvedItems: [],
    criticalIssues: [
      '2 training rationales awaiting review',
      'Training gap identified in CAPA-26-001',
    ],
    // sopStatus intentionally omitted - will be fetched from real DB
  },
  'infra-training': {
    status: 'active',
    pendingCount: 1,
    approvedCount: 2,
    lastUpdated: '2026-01-27T14:00:00Z',
    pendingItems: [
      { id: 'it1', documentId: 'INFRA-001', name: 'Equipment Qualification Protocol', status: 'pending', createdAt: '2026-01-26T10:00:00Z' },
    ],
    approvedItems: [
      { id: 'it2', documentId: 'INFRA-002', name: 'Facility Validation Report', status: 'approved', createdAt: '2026-01-20T11:00:00Z' },
      { id: 'it3', documentId: 'INFRA-003', name: 'Work Environment Controls', status: 'approved', createdAt: '2026-01-22T14:00:00Z' },
    ],
    // sopStatus intentionally omitted - will be fetched from real DB
  },

  // Rung 2 - Device Upstream
  'reg-planning': {
    status: 'active',
    nestedRBR: {
      type: 'RBR-REG',
      label: 'Pathway Selection',
      status: 'active',
    },
    productCount: 4,
    pendingCount: 2,
    approvedCount: 2,
    lastUpdated: '2026-01-27T16:45:00Z',
    pendingItems: [
      { id: 'rp1', documentId: 'REG-PATH-003', name: 'CE MDR Pathway Rationale', status: 'pending', createdAt: '2026-01-25T10:00:00Z' },
      { id: 'rp2', documentId: 'REG-PATH-004', name: 'FDA 510(k) Pathway Rationale', status: 'draft', createdAt: '2026-01-26T11:00:00Z' },
    ],
    approvedItems: [
      { id: 'rp3', documentId: 'REG-PATH-001', name: 'UK MHRA Pathway', status: 'approved', createdAt: '2026-01-10T10:00:00Z' },
      { id: 'rp4', documentId: 'REG-PATH-002', name: 'Health Canada Pathway', status: 'approved', createdAt: '2026-01-12T14:00:00Z' },
    ],
  },
  'design-inputs': {
    status: 'validated',
    productCount: 3,
    pendingCount: 0,
    approvedCount: 5,
    lastUpdated: '2026-01-25T09:00:00Z',
    pendingItems: [],
    approvedItems: [
      { id: 'di1', documentId: 'DI-001', name: 'User Requirements Specification', status: 'approved', createdAt: '2026-01-15T09:00:00Z' },
      { id: 'di2', documentId: 'DI-002', name: 'Design Input Requirements', status: 'approved', createdAt: '2026-01-18T10:00:00Z' },
    ],
  },
  'supplier-selection': {
    status: 'validated',
    nestedRBR: {
      type: 'RBR-SUP',
      label: 'Supplier Criticality',
      status: 'validated',
    },
    productCount: 5,
    pendingCount: 0,
    approvedCount: 12,
    lastUpdated: '2026-01-28T14:20:00Z',
    pendingItems: [],
    approvedItems: [
      { id: 'ss1', documentId: 'SUP-CRIT-001', name: 'Critical Component Supplier', status: 'approved', createdAt: '2026-01-05T09:00:00Z' },
      { id: 'ss2', documentId: 'SUP-CRIT-002', name: 'Secondary Supplier Qualification', status: 'approved', createdAt: '2026-01-08T10:00:00Z' },
      { id: 'ss3', documentId: 'SUP-CRIT-003', name: 'Packaging Material Supplier', status: 'approved', createdAt: '2026-01-10T11:00:00Z' },
    ],
  },

  // Rung 3 - Device Execution
  'risk-mgmt': {
    status: 'active',
    productCount: 4,
    pendingCount: 1,
    approvedCount: 3,
    lastUpdated: '2026-01-26T11:00:00Z',
    pendingItems: [
      { id: 'rm1', documentId: 'RISK-004', name: 'Updated Risk Analysis', status: 'pending', createdAt: '2026-01-24T09:00:00Z' },
    ],
    approvedItems: [
      { id: 'rm2', documentId: 'RISK-001', name: 'Initial Risk Assessment', status: 'approved', createdAt: '2026-01-10T09:00:00Z' },
      { id: 'rm3', documentId: 'RISK-002', name: 'FMEA Analysis', status: 'approved', createdAt: '2026-01-15T10:00:00Z' },
    ],
  },
  'design-dev': {
    status: 'active',
    nestedRBR: {
      type: 'RBR-DCH',
      label: 'Design Change',
      status: 'active',
    },
    productCount: 3,
    pendingCount: 3,
    approvedCount: 3,
    lastUpdated: '2026-01-26T11:00:00Z',
    pendingItems: [
      { id: 'dd1', documentId: 'DCH-004', name: 'Housing Material Change', status: 'pending', createdAt: '2026-01-20T14:00:00Z' },
      { id: 'dd2', documentId: 'DCH-005', name: 'Firmware v2.1 Update', status: 'pending', createdAt: '2026-01-22T09:00:00Z' },
      { id: 'dd3', documentId: 'DCH-006', name: 'Label Artwork Revision', status: 'draft', createdAt: '2026-01-24T16:00:00Z' },
    ],
    approvedItems: [
      { id: 'dd4', documentId: 'DCH-001', name: 'Connector Pin Upgrade', status: 'approved', createdAt: '2026-01-05T09:00:00Z' },
      { id: 'dd5', documentId: 'DCH-002', name: 'Power Supply Revision', status: 'approved', createdAt: '2026-01-08T11:00:00Z' },
      { id: 'dd6', documentId: 'DCH-003', name: 'IFU Update v3.0', status: 'approved', createdAt: '2026-01-15T10:00:00Z' },
    ],
  },
  'supplier-controls': {
    status: 'validated',
    productCount: 5,
    pendingCount: 0,
    approvedCount: 4,
    lastUpdated: '2026-01-24T08:30:00Z',
    pendingItems: [],
    approvedItems: [
      { id: 'sc1', documentId: 'SUP-CTL-001', name: 'Incoming Inspection Protocol', status: 'approved', createdAt: '2026-01-12T09:00:00Z' },
      { id: 'sc2', documentId: 'SUP-CTL-002', name: 'Supplier Audit Report', status: 'approved', createdAt: '2026-01-18T10:00:00Z' },
    ],
  },

  // Rung 4 - Device Verification
  'vv-testing': {
    status: 'validated',
    nestedRBR: {
      type: 'RBR-SAM',
      label: 'Statistical Rationale',
      status: 'validated',
    },
    productCount: 2,
    pendingCount: 0,
    approvedCount: 8,
    lastUpdated: '2026-01-25T09:15:00Z',
    pendingItems: [],
    approvedItems: [
      { id: 'vv1', documentId: 'SAM-001', name: 'Sterility Assurance Sample Size', status: 'approved', createdAt: '2026-01-12T08:00:00Z' },
      { id: 'vv2', documentId: 'SAM-002', name: 'Dimensional Testing Sample Size', status: 'approved', createdAt: '2026-01-15T09:00:00Z' },
    ],
  },
  'process-validation': {
    status: 'validated',
    nestedRBR: {
      type: 'RBR-ENG',
      label: 'Validation Approach',
      status: 'validated',
    },
    productCount: 2,
    pendingCount: 0,
    approvedCount: 5,
    lastUpdated: '2026-01-24T08:30:00Z',
    pendingItems: [],
    approvedItems: [
      { id: 'pv1', documentId: 'PV-001', name: 'Welding Process Validation', status: 'approved', createdAt: '2026-01-10T08:00:00Z' },
      { id: 'pv2', documentId: 'PV-002', name: 'Sterilization Cycle Validation', status: 'approved', createdAt: '2026-01-15T09:00:00Z' },
    ],
  },
  'production-monitoring': {
    status: 'dormant',
    productCount: 0,
    pendingCount: 0,
    approvedCount: 0,
    lastUpdated: null,
    pendingItems: [],
    approvedItems: [],
  },

  // Rung 5 - Company Feedback
  'pms': {
    status: 'active',
    nestedRBR: {
      type: 'RBR-CLE',
      label: 'Clinical Evaluation',
      status: 'active',
    },
    pendingCount: 2,
    approvedCount: 1,
    lastUpdated: '2026-01-20T13:00:00Z',
    pendingItems: [
      { id: 'pms1', documentId: 'PMS-003', name: 'PMCF Study Protocol', status: 'pending', createdAt: '2026-01-18T09:00:00Z' },
      { id: 'pms2', documentId: 'PMS-004', name: 'Clinical Evaluation Update', status: 'draft', createdAt: '2026-01-19T14:00:00Z' },
    ],
    approvedItems: [
      { id: 'pms3', documentId: 'PMS-001', name: 'Post-Market Surveillance Plan', status: 'approved', createdAt: '2026-01-05T10:00:00Z' },
    ],
    // sopStatus intentionally omitted - will be fetched from real DB
  },
  'capa-loop': {
    status: 'active',
    nestedRBR: {
      type: 'RBR-CAP',
      label: 'CAPA Priority',
      status: 'active',
    },
    pendingCount: 4,
    approvedCount: 3,
    escalatedCount: 2,
    lastUpdated: '2026-01-29T07:00:00Z',
    pendingItems: [
      { id: 'cap1', documentId: 'CAPA-PRI-004', name: 'Sterilization Failure Priority', status: 'pending', createdAt: '2026-01-27T08:00:00Z', dueDate: '2026-02-01T00:00:00Z' },
      { id: 'cap2', documentId: 'CAPA-PRI-005', name: 'Assembly Defect Priority', status: 'pending', createdAt: '2026-01-28T10:00:00Z' },
      { id: 'cap3', documentId: 'CAPA-PRI-006', name: 'Supplier NCR Priority', status: 'draft', createdAt: '2026-01-28T15:00:00Z' },
      { id: 'cap4', documentId: 'CAPA-PRI-007', name: 'Customer Complaint Priority', status: 'draft', createdAt: '2026-01-29T07:00:00Z' },
    ],
    approvedItems: [
      { id: 'cap5', documentId: 'CAPA-PRI-001', name: 'Packaging Defect Priority', status: 'approved', createdAt: '2026-01-05T09:00:00Z' },
      { id: 'cap6', documentId: 'CAPA-PRI-002', name: 'Labeling Error Priority', status: 'approved', createdAt: '2026-01-10T10:00:00Z' },
      { id: 'cap7', documentId: 'CAPA-PRI-003', name: 'Documentation Gap Priority', status: 'approved', createdAt: '2026-01-15T11:00:00Z' },
    ],
    // sopStatus intentionally omitted - will be fetched from real DB
  },
};

// Fetch real SOP status from qms_node_sop_links table
async function fetchSOPStatus(companyId: string, nodeId: string): Promise<SOPStatusData> {
  const emptyResult: SOPStatusData = { 
    status: 'missing', 
    counts: { total: 0, approved: 0, pending: 0 },
    linkedSOPs: [] 
  };
  
  try {
    // Get linked SOPs for this node with their document details
    const { data, error } = await supabase
      .from('qms_node_sop_links')
      .select(`
        id,
        document_id,
        phase_assigned_document_template:document_id (
          id,
          name,
          status
        )
      `)
      .eq('company_id', companyId)
      .eq('node_id', nodeId);

    if (error) {
      console.error(`Error fetching SOP links for ${nodeId}:`, error);
      return emptyResult;
    }

    if (!data || data.length === 0) {
      return emptyResult;
    }

    // Extract linked SOPs with their info
    const linkedSOPs: LinkedSOPInfo[] = data
      .map((link: any) => {
        const doc = link.phase_assigned_document_template;
        if (!doc) return null;
        return {
          id: doc.id,
          name: doc.name || 'Unnamed SOP',
          status: doc.status,
        };
      })
      .filter((s): s is LinkedSOPInfo => s !== null);

    const total = linkedSOPs.length;
    const approved = linkedSOPs.filter(s => s.status?.toLowerCase() === 'approved').length;
    const pending = total - approved;

    let status: SOPStatusData['status'] = 'missing';
    if (total === 0) {
      status = 'missing';
    } else if (approved === total) {
      status = 'complete';
    } else {
      status = 'in-progress';
    }

    return { status, counts: { total, approved, pending }, linkedSOPs };
  } catch (err) {
    console.error(`Error processing SOP status for ${nodeId}:`, err);
    return emptyResult;
  }
}

// Helper to calculate days since and time status
function calculateTimeFields(lastUpdated: string | null): { daysSinceUpdate: number | null; timeStatus: 'recent' | 'attention' | 'overdue' | 'unknown' } {
  if (!lastUpdated) {
    return { daysSinceUpdate: null, timeStatus: 'unknown' };
  }
  
  const date = new Date(lastUpdated);
  if (isNaN(date.getTime())) {
    return { daysSinceUpdate: null, timeStatus: 'unknown' };
  }
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  let timeStatus: 'recent' | 'attention' | 'overdue' | 'unknown' = 'unknown';
  if (days <= 30) timeStatus = 'recent';
  else if (days <= 90) timeStatus = 'attention';
  else timeStatus = 'overdue';
  
  return { daysSinceUpdate: days, timeStatus };
}

async function fetchNodeStatus(
  companyId: string,
  config: HelixNodeConfig,
  useMockData: boolean = true
): Promise<HelixPulseData> {
  const baseStatus: HelixPulseData = {
    nodeId: config.id,
    status: 'dormant',
    lastUpdated: null,
    daysSinceUpdate: null,
    timeStatus: 'unknown',
  };

  // If no table exists yet, use mock data if available
  if (!config.table) {
    if (useMockData && DEMO_MOCK_DATA[config.id]) {
      const mockData = { ...baseStatus, ...DEMO_MOCK_DATA[config.id] };
      const timeFields = calculateTimeFields(mockData.lastUpdated);
      return { ...mockData, ...timeFields };
    }
    return baseStatus;
  }

  try {
    // Fetch rationales for this type
    const { data, error } = await (supabase
      .from(config.table as any)
      .select('id, status, created_at, updated_at')
      .eq('company_id', companyId)
      .order('updated_at', { ascending: false })) as { data: any[] | null; error: any };

    if (error) {
      console.error(`Error fetching ${config.table}:`, error);
      if (useMockData && DEMO_MOCK_DATA[config.id]) {
        const mockData = { ...baseStatus, ...DEMO_MOCK_DATA[config.id] };
        const timeFields = calculateTimeFields(mockData.lastUpdated);
        return { ...mockData, ...timeFields };
      }
      return baseStatus;
    }

    if (!data || data.length === 0) {
      if (useMockData && DEMO_MOCK_DATA[config.id]) {
        const mockData = { ...baseStatus, ...DEMO_MOCK_DATA[config.id] };
        const timeFields = calculateTimeFields(mockData.lastUpdated);
        return { ...mockData, ...timeFields };
      }
      return baseStatus;
    }

    const count = data.length;
    const pendingCount = data.filter(r => r.status === 'draft' || r.status === 'pending').length;
    const approvedCount = data.filter(r => r.status === 'approved').length;
    const lastUpdated = data[0]?.updated_at || data[0]?.created_at || null;
    const timeFields = calculateTimeFields(lastUpdated);

    // Determine status based on rationale states
    let status: HelixNodeStatus = 'dormant';
    let nestedRBRStatus: HelixNodeStatus = 'dormant';

    if (count === 0) {
      status = 'dormant';
      nestedRBRStatus = 'dormant';
    } else if (approvedCount === count) {
      status = 'validated';
      nestedRBRStatus = 'validated';
    } else if (pendingCount > 0) {
      status = 'active';
      nestedRBRStatus = 'active';
    } else {
      status = 'active';
      nestedRBRStatus = 'active';
    }

    const result: HelixPulseData = {
      ...baseStatus,
      status,
      pendingCount,
      approvedCount,
      lastUpdated,
      ...timeFields,
    };

    // Add nested RBR if config has one
    if (config.nestedRBR && config.nestedRBRLabel) {
      result.nestedRBR = {
        type: config.nestedRBR,
        label: config.nestedRBRLabel,
        status: nestedRBRStatus,
      };
    }

    return result;
  } catch (err) {
    console.error(`Error processing ${config.table}:`, err);
    if (useMockData && DEMO_MOCK_DATA[config.id]) {
      const mockData = { ...baseStatus, ...DEMO_MOCK_DATA[config.id] };
      const timeFields = calculateTimeFields(mockData.lastUpdated);
      return { ...mockData, ...timeFields };
    }
    return baseStatus;
  }
}

// Reconcile a node's headline status against its real SOP approval data.
// When a node has linked SOPs, the dot must reflect actual approval state —
// mock/demo status is overridden so we never show green for unapproved SOPs.
function reconcileStatusWithSOPs(
  currentStatus: HelixNodeStatus,
  sopStatus: SOPStatusData | undefined
): HelixNodeStatus {
  if (!sopStatus || sopStatus.counts.total === 0) {
    // No SOPs linked → keep existing (mock or computed) status
    return currentStatus;
  }
  if (sopStatus.status === 'complete') return 'validated';
  if (sopStatus.status === 'in-progress') return 'active';
  // total > 0 but none approved → critical
  return 'critical';
}

export function useHelixPulseStatus(companyId: string, useMockData: boolean = true) {
  return useQuery({
    queryKey: ['helix-pulse-status', companyId, useMockData],
    queryFn: async () => {
      if (!companyId) {
        // Return mock data even without company ID for demo
        const pulseData: HelixPulseData[] = HELIX_NODE_CONFIGS.map(config => {
          const baseStatus: HelixPulseData = {
            nodeId: config.id,
            status: 'dormant',
            lastUpdated: null,
            daysSinceUpdate: null,
            timeStatus: 'unknown',
            // Default SOP status to missing when no company ID
            sopStatus: { status: 'missing', counts: { total: 0, approved: 0, pending: 0 }, linkedSOPs: [] },
          };
          
          if (useMockData && DEMO_MOCK_DATA[config.id]) {
            const mockData = { ...baseStatus, ...DEMO_MOCK_DATA[config.id] };
            const timeFields = calculateTimeFields(mockData.lastUpdated);
            Object.assign(mockData, timeFields);
            // Add nested RBR from config if present
            if (config.nestedRBR && config.nestedRBRLabel && !mockData.nestedRBR) {
              mockData.nestedRBR = {
                type: config.nestedRBR,
                label: config.nestedRBRLabel,
                status: mockData.status,
              };
            }
            // Keep sopStatus as missing - don't use mock for SOPs
            return mockData;
          }
          
          // Add nested RBR from config if present
          if (config.nestedRBR && config.nestedRBRLabel) {
            baseStatus.nestedRBR = {
              type: config.nestedRBR,
              label: config.nestedRBRLabel,
              status: 'dormant',
            };
          }
          
          return baseStatus;
        });

        const criticalCount = pulseData.filter(p => p.status === 'critical').length;
        const activeCount = pulseData.filter(p => p.status === 'active').length;
        const dormantCount = pulseData.filter(p => p.status === 'dormant').length;

        let overallHealth: 'healthy' | 'attention' | 'critical' = 'healthy';
        if (criticalCount > 0) {
          overallHealth = 'critical';
        } else if (activeCount > 4 || dormantCount > 6) {
          overallHealth = 'attention';
        }

        return { pulseData, overallHealth };
      }

      // Fetch status for all nodes in parallel, including real SOP status
      const pulseData = await Promise.all(
        HELIX_NODE_CONFIGS.map(async (config) => {
          const nodeStatus = await fetchNodeStatus(companyId, config, useMockData);
          // Always fetch real SOP status from database
          const sopStatus = await fetchSOPStatus(companyId, config.id);
          // Real SOP approval data trumps mock/computed status for the dot
          const reconciledStatus = reconcileStatusWithSOPs(nodeStatus.status, sopStatus);
          // Keep nestedRBR status in sync if it was mirroring the node status
          const nestedRBR = nodeStatus.nestedRBR
            ? { ...nodeStatus.nestedRBR, status: reconciledStatus }
            : undefined;
          return { ...nodeStatus, status: reconciledStatus, nestedRBR, sopStatus };
        })
      );

      // Calculate overall health
      const criticalCount = pulseData.filter(p => p.status === 'critical').length;
      const activeCount = pulseData.filter(p => p.status === 'active').length;
      const dormantCount = pulseData.filter(p => p.status === 'dormant').length;

      let overallHealth: 'healthy' | 'attention' | 'critical' = 'healthy';
      if (criticalCount > 0) {
        overallHealth = 'critical';
      } else if (activeCount > 4 || dormantCount > 6) {
        overallHealth = 'attention';
      }

      return { pulseData, overallHealth };
    },
    enabled: true,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}
