import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RBRDocumentPrefix } from '@/types/riskBasedRationale';

// Detailed item for display in drawer
export interface PendingItem {
  id: string;
  documentId: string;  // e.g., RBR-ENG-001
  name: string;        // Description or title
  status: string;
  createdAt: string;
  dueDate?: string;
}

export interface RBRPulseStatus {
  nodeId: string;
  nodeType: RBRDocumentPrefix;
  label: string;
  isoClause: string;
  status: 'dormant' | 'active' | 'validated' | 'critical';
  count: number;
  pendingCount: number;
  approvedCount: number;
  linkedCAPA?: string;
  lastUpdated: string | null;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  track: 'engineering' | 'regulatory' | 'business';
  stage: 'genesis' | 'regulatory-automation' | 'operational-qms' | 'scaled-mfg';
  // Detailed item lists for diagnostics
  pendingItems: PendingItem[];
  approvedItems: PendingItem[];  // Detailed list of approved items
  criticalIssues: string[];  // List of specific issues causing critical status
}

interface RBRNodeConfig {
  nodeId: string;
  nodeType: RBRDocumentPrefix;
  label: string;
  isoClause: string;
  table: string | null;
  track: 'engineering' | 'regulatory' | 'business';
  stage: 'genesis' | 'regulatory-automation' | 'operational-qms' | 'scaled-mfg';
}

// Define all 9 RBR node types with their configurations
// Note: stageOffset is used when multiple nodes share the same track+stage
const RBR_NODE_CONFIGS: RBRNodeConfig[] = [
  // Engineering Track
  { 
    nodeId: 'rbr-sam', 
    nodeType: 'RBR-SAM', 
    label: 'Sample Size', 
    isoClause: '7.3.6',
    table: 'sample_size_rationales',
    track: 'engineering',
    stage: 'regulatory-automation'
  },
  { 
    nodeId: 'rbr-eng', 
    nodeType: 'RBR-ENG', 
    label: 'Process Validation', 
    isoClause: '7.5.6',
    table: 'process_validation_rationales',
    track: 'engineering',
    stage: 'operational-qms'
  },
  
  // Regulatory Track
  { 
    nodeId: 'rbr-reg', 
    nodeType: 'RBR-REG', 
    label: 'Pathway Selection', 
    isoClause: '4.2.3',
    table: null,
    track: 'regulatory',
    stage: 'genesis'
  },
  { 
    nodeId: 'rbr-sup', 
    nodeType: 'RBR-SUP', 
    label: 'Supplier Criticality', 
    isoClause: '7.4.1',
    table: 'supplier_criticality_rationales',
    track: 'regulatory',
    stage: 'regulatory-automation'
  },
  { 
    nodeId: 'rbr-cle', 
    nodeType: 'RBR-CLE', 
    label: 'Clinical Evaluation', 
    isoClause: '7.3.7',
    table: null,
    track: 'regulatory',
    stage: 'operational-qms'
  },
  
  // Business Track  
  { 
    nodeId: 'rbr-trn', 
    nodeType: 'RBR-TRN', 
    label: 'Training Effectiveness', 
    isoClause: '6.2',
    table: null,
    track: 'business',
    stage: 'genesis'
  },
  { 
    nodeId: 'rbr-dch', 
    nodeType: 'RBR-DCH', 
    label: 'Design Change', 
    isoClause: '7.3.9',
    table: 'design_change_rationales',
    track: 'business',
    stage: 'regulatory-automation'
  },
  { 
    nodeId: 'rbr-swv', 
    nodeType: 'RBR-SWV', 
    label: 'Software Validation', 
    isoClause: '7.5.6',
    table: null,
    track: 'business',
    stage: 'operational-qms'
  },
  { 
    nodeId: 'rbr-cap', 
    nodeType: 'RBR-CAP', 
    label: 'CAPA Priority', 
    isoClause: '8.5.2',
    table: 'capa_priority_rationales',
    track: 'business',
    stage: 'scaled-mfg'
  },
];

// Demo mock data for visualization - makes the system feel alive
const DEMO_MOCK_DATA: Partial<Record<string, Partial<RBRPulseStatus>>> = {
  'rbr-trn': {
    status: 'critical',
    count: 3,
    pendingCount: 2,
    approvedCount: 0,
    linkedCAPA: 'CAPA-26-001',
    riskLevel: 'critical',
    lastUpdated: '2026-01-15T10:30:00Z',
    pendingItems: [
      { id: '1', documentId: 'RBR-TRN-001', name: 'Operator Training Effectiveness', status: 'pending', createdAt: '2026-01-10T08:00:00Z' },
      { id: '2', documentId: 'RBR-TRN-002', name: 'QC Inspector Competency', status: 'draft', createdAt: '2026-01-12T09:30:00Z' },
    ],
    approvedItems: [],
    criticalIssues: [
      '2 training rationales awaiting review: RBR-TRN-001, RBR-TRN-002',
      'Open CAPA CAPA-26-001 linked to training gap',
    ],
  },
  'rbr-sup': {
    status: 'validated',
    count: 12,
    pendingCount: 0,
    approvedCount: 12,
    riskLevel: 'low',
    lastUpdated: '2026-01-28T14:20:00Z',
    pendingItems: [],
    approvedItems: [
      { id: 'a1', documentId: 'RBR-SUP-001', name: 'Critical Component Supplier', status: 'approved', createdAt: '2026-01-05T09:00:00Z' },
      { id: 'a2', documentId: 'RBR-SUP-002', name: 'Secondary Supplier Qualification', status: 'approved', createdAt: '2026-01-08T10:00:00Z' },
      { id: 'a3', documentId: 'RBR-SUP-003', name: 'Packaging Material Supplier', status: 'approved', createdAt: '2026-01-10T11:00:00Z' },
    ],
    criticalIssues: [],
  },
  'rbr-sam': {
    status: 'validated',
    count: 8,
    pendingCount: 0,
    approvedCount: 8,
    riskLevel: 'low',
    lastUpdated: '2026-01-25T09:15:00Z',
    pendingItems: [],
    approvedItems: [
      { id: 'a4', documentId: 'RBR-SAM-001', name: 'Sterility Assurance Sample', status: 'approved', createdAt: '2026-01-12T08:00:00Z' },
      { id: 'a5', documentId: 'RBR-SAM-002', name: 'Dimensional Testing Sample', status: 'approved', createdAt: '2026-01-15T09:00:00Z' },
    ],
    criticalIssues: [],
  },
  'rbr-reg': {
    status: 'active',
    count: 4,
    pendingCount: 2,
    approvedCount: 2,
    riskLevel: 'medium',
    lastUpdated: '2026-01-27T16:45:00Z',
    pendingItems: [
      { id: '3', documentId: 'RBR-REG-003', name: 'CE MDR Pathway Rationale', status: 'pending', createdAt: '2026-01-25T10:00:00Z' },
      { id: '4', documentId: 'RBR-REG-004', name: 'FDA 510(k) Pathway Rationale', status: 'draft', createdAt: '2026-01-26T11:00:00Z' },
    ],
    approvedItems: [
      { id: 'a6', documentId: 'RBR-REG-001', name: 'UK MHRA Pathway', status: 'approved', createdAt: '2026-01-10T10:00:00Z' },
      { id: 'a7', documentId: 'RBR-REG-002', name: 'Health Canada Pathway', status: 'approved', createdAt: '2026-01-12T14:00:00Z' },
    ],
    criticalIssues: [],
  },
  'rbr-dch': {
    status: 'active',
    count: 6,
    pendingCount: 3,
    approvedCount: 3,
    riskLevel: 'medium',
    lastUpdated: '2026-01-26T11:00:00Z',
    pendingItems: [
      { id: '5', documentId: 'RBR-DCH-004', name: 'Housing Material Change', status: 'pending', createdAt: '2026-01-20T14:00:00Z' },
      { id: '6', documentId: 'RBR-DCH-005', name: 'Firmware v2.1 Update', status: 'pending', createdAt: '2026-01-22T09:00:00Z' },
      { id: '7', documentId: 'RBR-DCH-006', name: 'Label Artwork Revision', status: 'draft', createdAt: '2026-01-24T16:00:00Z' },
    ],
    approvedItems: [
      { id: 'a8', documentId: 'RBR-DCH-001', name: 'Connector Pin Upgrade', status: 'approved', createdAt: '2026-01-05T09:00:00Z' },
      { id: 'a9', documentId: 'RBR-DCH-002', name: 'Power Supply Revision', status: 'approved', createdAt: '2026-01-08T11:00:00Z' },
      { id: 'a10', documentId: 'RBR-DCH-003', name: 'IFU Update v3.0', status: 'approved', createdAt: '2026-01-15T10:00:00Z' },
    ],
    criticalIssues: [],
  },
  'rbr-eng': {
    status: 'validated',
    count: 5,
    pendingCount: 0,
    approvedCount: 5,
    riskLevel: 'low',
    lastUpdated: '2026-01-24T08:30:00Z',
    pendingItems: [],
    approvedItems: [
      { id: 'a11', documentId: 'RBR-ENG-001', name: 'Welding Process Validation', status: 'approved', createdAt: '2026-01-10T08:00:00Z' },
      { id: 'a12', documentId: 'RBR-ENG-002', name: 'Sterilization Cycle Validation', status: 'approved', createdAt: '2026-01-15T09:00:00Z' },
    ],
    criticalIssues: [],
  },
  'rbr-cap': {
    status: 'active',
    count: 7,
    pendingCount: 4,
    approvedCount: 3,
    linkedCAPA: 'CAPA-26-003',
    riskLevel: 'high',
    lastUpdated: '2026-01-29T07:00:00Z',
    pendingItems: [
      { id: '8', documentId: 'RBR-CAP-004', name: 'Sterilization Failure Priority', status: 'pending', createdAt: '2026-01-27T08:00:00Z' },
      { id: '9', documentId: 'RBR-CAP-005', name: 'Assembly Defect Priority', status: 'pending', createdAt: '2026-01-28T10:00:00Z' },
      { id: '10', documentId: 'RBR-CAP-006', name: 'Supplier NCR Priority', status: 'draft', createdAt: '2026-01-28T15:00:00Z' },
      { id: '11', documentId: 'RBR-CAP-007', name: 'Customer Complaint Priority', status: 'draft', createdAt: '2026-01-29T07:00:00Z' },
    ],
    approvedItems: [
      { id: 'a13', documentId: 'RBR-CAP-001', name: 'Packaging Defect Priority', status: 'approved', createdAt: '2026-01-05T09:00:00Z' },
      { id: 'a14', documentId: 'RBR-CAP-002', name: 'Labeling Error Priority', status: 'approved', createdAt: '2026-01-10T10:00:00Z' },
      { id: 'a15', documentId: 'RBR-CAP-003', name: 'Documentation Gap Priority', status: 'approved', createdAt: '2026-01-15T11:00:00Z' },
    ],
    criticalIssues: [],
  },
  'rbr-cle': {
    status: 'dormant',
    count: 0,
    pendingCount: 0,
    approvedCount: 0,
    riskLevel: 'medium',
    lastUpdated: null,
    pendingItems: [],
    approvedItems: [],
    criticalIssues: ['No Clinical Evaluation rationales documented - ISO 7.3.7 evidence missing'],
  },
  'rbr-swv': {
    status: 'active',
    count: 2,
    pendingCount: 1,
    approvedCount: 1,
    riskLevel: 'medium',
    lastUpdated: '2026-01-20T13:00:00Z',
    pendingItems: [
      { id: '12', documentId: 'RBR-SWV-002', name: 'Manufacturing Software Validation', status: 'pending', createdAt: '2026-01-18T11:00:00Z' },
    ],
    approvedItems: [
      { id: 'a16', documentId: 'RBR-SWV-001', name: 'ERP Software Validation', status: 'approved', createdAt: '2026-01-08T09:00:00Z' },
    ],
    criticalIssues: [],
  },
};

async function fetchRationaleStatus(
  companyId: string,
  config: RBRNodeConfig,
  useMockData: boolean = true
): Promise<RBRPulseStatus> {
  const baseStatus: RBRPulseStatus = {
    nodeId: config.nodeId,
    nodeType: config.nodeType,
    label: config.label,
    isoClause: config.isoClause,
    status: 'dormant',
    count: 0,
    pendingCount: 0,
    approvedCount: 0,
    lastUpdated: null,
    riskLevel: 'low',
    track: config.track,
    stage: config.stage,
    pendingItems: [],
    approvedItems: [],
    criticalIssues: [],
  };

  // If no table exists yet, use mock data if available
  if (!config.table) {
    if (useMockData && DEMO_MOCK_DATA[config.nodeId]) {
      return { ...baseStatus, ...DEMO_MOCK_DATA[config.nodeId] };
    }
    return baseStatus;
  }

  try {
    // Fetch rationales for this type - include document_id and additional details
    const { data, error } = await (supabase
      .from(config.table as any)
      .select('id, document_id, status, created_at, updated_at')
      .eq('company_id', companyId)
      .order('updated_at', { ascending: false })) as { data: any[] | null; error: any };

    if (error) {
      console.error(`Error fetching ${config.table}:`, error);
      // Fall back to mock data on error
      if (useMockData && DEMO_MOCK_DATA[config.nodeId]) {
        return { ...baseStatus, ...DEMO_MOCK_DATA[config.nodeId] };
      }
      return baseStatus;
    }

    // If no real data, use mock data for demo
    if (!data || data.length === 0) {
      if (useMockData && DEMO_MOCK_DATA[config.nodeId]) {
        return { ...baseStatus, ...DEMO_MOCK_DATA[config.nodeId] };
      }
      return baseStatus;
    }

    const count = data.length;
    const pendingRecords = data.filter(r => r.status === 'draft' || r.status === 'pending');
    const approvedRecords = data.filter(r => r.status === 'approved');
    const pendingCount = pendingRecords.length;
    const approvedCount = approvedRecords.length;
    const lastUpdated = data[0]?.updated_at || data[0]?.created_at || null;

    // Build detailed pending items list
    const pendingItems: PendingItem[] = pendingRecords.map(r => ({
      id: r.id,
      documentId: r.document_id || `${config.nodeType}-???`,
      name: `${config.label} Rationale`,
      status: r.status,
      createdAt: r.created_at,
    }));

    // Build detailed approved items list
    const approvedItems: PendingItem[] = approvedRecords.map(r => ({
      id: r.id,
      documentId: r.document_id || `${config.nodeType}-???`,
      name: `${config.label} Rationale`,
      status: r.status,
      createdAt: r.created_at,
    }));

    // Build critical issues list
    const criticalIssues: string[] = [];
    if (pendingCount > 0) {
      criticalIssues.push(`${pendingCount} rationale(s) awaiting review: ${pendingRecords.map(r => r.document_id || r.id.slice(0, 8)).join(', ')}`);
    }
    if (count === 0) {
      criticalIssues.push(`No ${config.label} rationales documented - ISO ${config.isoClause} evidence missing`);
    }

    // Determine status based on rationale states
    let status: RBRPulseStatus['status'] = 'dormant';
    let riskLevel: RBRPulseStatus['riskLevel'] = 'low';

    if (count === 0) {
      status = 'dormant';
      riskLevel = 'low';
    } else if (approvedCount === count) {
      status = 'validated';
      riskLevel = 'low';
    } else if (pendingCount > 0) {
      status = 'active';
      riskLevel = pendingCount > 3 ? 'medium' : 'low';
    } else {
      status = 'active';
      riskLevel = 'medium';
    }

    // Check for linked CAPAs (critical status)
    if (config.nodeType === 'RBR-CAP') {
      const { data: capaData } = await (supabase
        .from('capa_priority_rationales' as any)
        .select('capa_id, status')
        .eq('company_id', companyId)
        .eq('promoted_to_capa', true)
        .not('capa_id', 'is', null)) as { data: any[] | null };

      if (capaData && capaData.length > 0) {
        status = 'critical';
        riskLevel = 'high';
      }
    }

    return {
      ...baseStatus,
      status,
      count,
      pendingCount,
      approvedCount,
      lastUpdated,
      riskLevel,
      pendingItems,
      approvedItems,
      criticalIssues,
    };
  } catch (err) {
    console.error(`Error processing ${config.table}:`, err);
    // Fall back to mock data on error
    if (useMockData && DEMO_MOCK_DATA[config.nodeId]) {
      return { ...baseStatus, ...DEMO_MOCK_DATA[config.nodeId] };
    }
    return baseStatus;
  }
}

export function useRBRPulseStatus(companyId: string, useMockData: boolean = true) {
  return useQuery({
    queryKey: ['rbr-pulse-status', companyId, useMockData],
    queryFn: async () => {
      if (!companyId) {
        // Return mock data even without company ID for demo
        const pulseData = RBR_NODE_CONFIGS.map(config => {
          const baseStatus: RBRPulseStatus = {
            nodeId: config.nodeId,
            nodeType: config.nodeType,
            label: config.label,
            isoClause: config.isoClause,
            status: 'dormant',
            count: 0,
            pendingCount: 0,
            approvedCount: 0,
            lastUpdated: null,
            riskLevel: 'low',
            track: config.track,
            stage: config.stage,
            pendingItems: [],
            approvedItems: [],
            criticalIssues: [],
          };
          if (useMockData && DEMO_MOCK_DATA[config.nodeId]) {
            return { ...baseStatus, ...DEMO_MOCK_DATA[config.nodeId] };
          }
          return baseStatus;
        });

        const criticalCount = pulseData.filter(p => p.status === 'critical').length;
        const activeCount = pulseData.filter(p => p.status === 'active').length;
        const dormantCount = pulseData.filter(p => p.status === 'dormant').length;

        let overallHealth: 'healthy' | 'attention' | 'critical' = 'healthy';
        if (criticalCount > 0) {
          overallHealth = 'critical';
        } else if (activeCount > 3 || dormantCount > 5) {
          overallHealth = 'attention';
        }

        return { pulseData, overallHealth };
      }

      // Fetch status for all RBR nodes in parallel
      const pulseData = await Promise.all(
        RBR_NODE_CONFIGS.map(config => fetchRationaleStatus(companyId, config, useMockData))
      );

      // Calculate overall health
      const criticalCount = pulseData.filter(p => p.status === 'critical').length;
      const activeCount = pulseData.filter(p => p.status === 'active').length;
      const dormantCount = pulseData.filter(p => p.status === 'dormant').length;

      let overallHealth: 'healthy' | 'attention' | 'critical' = 'healthy';
      if (criticalCount > 0) {
        overallHealth = 'critical';
      } else if (activeCount > 3 || dormantCount > 5) {
        overallHealth = 'attention';
      }

      return { pulseData, overallHealth };
    },
    enabled: true, // Always enabled to show mock data
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

export { RBR_NODE_CONFIGS };
