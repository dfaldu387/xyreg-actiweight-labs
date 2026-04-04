/**
 * useDeviceHelixPulseStatus - Device-specific hook for helix node statuses
 * 
 * Fetches RBR and document statuses for a specific product (Rungs 2-5 for device level).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  HELIX_NODE_CONFIGS,
  type HelixNodeConfig,
  type HelixNodeStatus,
} from '@/config/helixNodeConfig';
import type { RBRDocumentPrefix } from '@/types/riskBasedRationale';
import type { PendingItem as BasePendingItem } from './useRBRPulseStatus';

// Extended PendingItem with dueDate for CAPA nodes
export interface DevicePendingItem extends BasePendingItem {
  dueDate?: string;
}

export interface DeviceHelixPulseData {
  nodeId: string;
  status: HelixNodeStatus;
  nestedRBR?: {
    type: string;
    label: string;
    status: HelixNodeStatus;
  };
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
  // Gatekeeper flag - set on device nodes when company foundation is blocked
  isGatekeeperBlocked?: boolean;
  // Detailed diagnostics
  pendingItems?: DevicePendingItem[];
  approvedItems?: DevicePendingItem[];
  criticalIssues?: string[];
}

// Get all nodes (both company and device) to support the "Company Context" toggle
const getAllNodes = () => HELIX_NODE_CONFIGS;

// Demo mock data for visualization (company + device)
const DEMO_HELIX_DATA: Record<string, Partial<DeviceHelixPulseData>> = {
  // ========== RUNG 1 - Company Foundation ==========
  'mgmt-resp': {
    status: 'validated',
    lastUpdated: '2026-01-15T09:00:00Z',
  },
  'resource-strategy': {
    status: 'validated',
    nestedRBR: {
      type: 'RBR-TRN',
      label: 'Training Effectiveness',
      status: 'validated',
    },
    lastUpdated: '2026-01-20T10:00:00Z',
  },
  'infra-training': {
    status: 'active',
    pendingCount: 1,
    lastUpdated: '2026-01-25T14:00:00Z',
  },

  // ========== RUNG 2 - Device Upstream ==========
  'reg-planning': {
    status: 'validated',
    nestedRBR: {
      type: 'RBR-REG',
      label: 'Pathway Selection',
      status: 'validated',
    },
    lastUpdated: '2026-01-28T10:00:00Z',
  },
  'design-inputs': {
    status: 'validated',
    lastUpdated: '2026-01-27T14:00:00Z',
  },
  'supplier-selection': {
    status: 'active',
    nestedRBR: {
      type: 'RBR-SUP',
      label: 'Supplier Criticality',
      status: 'active',
    },
    pendingCount: 2,
    lastUpdated: '2026-01-28T09:00:00Z',
  },

  // ========== RUNG 3 - Device Execution ==========
  'risk-mgmt': {
    status: 'active',
    nestedRBR: {
      type: 'RBR-RSK',
      label: 'Risk Controls',
      status: 'active',
    },
    pendingCount: 1,
    lastUpdated: '2026-01-26T11:00:00Z',
  },
  'design-dev': {
    status: 'active',
    nestedRBR: {
      type: 'RBR-DCH',
      label: 'Design Change',
      status: 'active',
    },
    pendingCount: 3,
    lastUpdated: '2026-01-27T16:00:00Z',
  },
  'supplier-controls': {
    status: 'validated',
    lastUpdated: '2026-01-24T08:30:00Z',
  },

  // ========== RUNG 4 - Device Verification ==========
  'vv-testing': {
    status: 'active',
    nestedRBR: {
      type: 'RBR-SAM',
      label: 'Statistical Rationale',
      status: 'active',
    },
    pendingCount: 2,
    lastUpdated: '2026-01-28T11:00:00Z',
  },
  'process-validation': {
    status: 'dormant',
    nestedRBR: {
      type: 'RBR-ENG',
      label: 'Validation Approach',
      status: 'dormant',
    },
    lastUpdated: null,
  },
  'production-monitoring': {
    status: 'dormant',
    lastUpdated: null,
  },

  // ========== RUNG 5 - Feedback (Company-level) ==========
  'pms': {
    status: 'validated',
    nestedRBR: {
      type: 'RBR-CLE',
      label: 'Clinical Evaluation',
      status: 'validated',
    },
    lastUpdated: '2026-01-22T16:00:00Z',
  },
  'capa-loop': {
    status: 'active',
    nestedRBR: {
      type: 'RBR-CAP',
      label: 'CAPA Priority',
      status: 'active',
    },
    pendingCount: 3,
    lastUpdated: '2026-01-27T10:00:00Z',
  },

  // ========== RUNG 5 - Feedback (Device-level) ==========
  'device-pms': {
    status: 'active',
    pendingCount: 1,
    lastUpdated: '2026-01-28T12:00:00Z',
  },
  'device-capa': {
    status: 'critical',
    nestedRBR: {
      type: 'RBR-CAP',
      label: 'CAPA Priority',
      status: 'critical',
    },
    pendingCount: 2,
    pendingItems: [
      { 
        id: '1', 
        documentId: 'CAPA-2026-001', 
        name: 'Sterilization Process Failure - Batch 2024-12', 
        status: 'investigation',
        createdAt: '2026-01-10T08:00:00Z',
        dueDate: '2026-01-24T00:00:00Z', // overdue!
      },
      { 
        id: '2', 
        documentId: 'CAPA-2026-003', 
        name: 'Assembly Line 2 Dimensional Defect', 
        status: 'planning',
        createdAt: '2026-01-20T09:30:00Z',
        dueDate: '2026-02-05T00:00:00Z',
      },
    ],
    criticalIssues: [
      'CAPA-2026-001: Investigation phase overdue by 8 days (target was Jan 24)',
      '2 open CAPAs require attention before device release validation',
    ],
    lastUpdated: '2026-01-28T08:00:00Z',
  },
};

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

async function fetchDeviceNodeStatus(
  productId: string,
  companyId: string | undefined,
  config: HelixNodeConfig,
  useMockData: boolean = true
): Promise<DeviceHelixPulseData> {
  const baseStatus: DeviceHelixPulseData = {
    nodeId: config.id,
    status: 'dormant',
    lastUpdated: null,
    daysSinceUpdate: null,
    timeStatus: 'unknown',
  };

  // Add nested RBR from config if present
  if (config.nestedRBR && config.nestedRBRLabel) {
    baseStatus.nestedRBR = {
      type: config.nestedRBR,
      label: config.nestedRBRLabel,
      status: 'dormant',
    };
  }

  // If no table exists yet, use mock data if available
  if (!config.table) {
    if (useMockData && DEMO_HELIX_DATA[config.id]) {
      const mockData = { ...baseStatus, ...DEMO_HELIX_DATA[config.id] };
      const timeFields = calculateTimeFields(mockData.lastUpdated);
      return { ...mockData, ...timeFields };
    }
    return baseStatus;
  }

  try {
    // Fetch rationales for this specific product
    const query = supabase
      .from(config.table as any)
      .select('id, status, created_at, updated_at')
      .eq('product_id', productId)
      .order('updated_at', { ascending: false });

    const { data, error } = await query as { data: any[] | null; error: any };

    if (error) {
      console.error(`Error fetching ${config.table}:`, error);
      if (useMockData && DEMO_HELIX_DATA[config.id]) {
        const mockData = { ...baseStatus, ...DEMO_HELIX_DATA[config.id] };
        const timeFields = calculateTimeFields(mockData.lastUpdated);
        return { ...mockData, ...timeFields };
      }
      return baseStatus;
    }

    if (!data || data.length === 0) {
      if (useMockData && DEMO_HELIX_DATA[config.id]) {
        const mockData = { ...baseStatus, ...DEMO_HELIX_DATA[config.id] };
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

    const result: DeviceHelixPulseData = {
      ...baseStatus,
      status,
      pendingCount,
      approvedCount,
      lastUpdated,
      ...timeFields,
    };

    // Update nested RBR status if present
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
    if (useMockData && DEMO_HELIX_DATA[config.id]) {
      const mockData = { ...baseStatus, ...DEMO_HELIX_DATA[config.id] };
      const timeFields = calculateTimeFields(mockData.lastUpdated);
      return { ...mockData, ...timeFields };
    }
    return baseStatus;
  }
}

export function useDeviceHelixPulseStatus(productId: string | undefined, companyId?: string, useMockData: boolean = true) {
  return useQuery({
    queryKey: ['device-helix-pulse-status', productId, companyId, useMockData],
    queryFn: async () => {
      // Fetch ALL nodes (company + device) to support the "Company Context" toggle
      const allNodeConfigs = getAllNodes();

      if (!productId) {
        // Return mock data even without product ID for demo
        const pulseData: DeviceHelixPulseData[] = allNodeConfigs.map(config => {
          const baseStatus: DeviceHelixPulseData = {
            nodeId: config.id,
            status: 'dormant',
            lastUpdated: null,
            daysSinceUpdate: null,
            timeStatus: 'unknown',
          };
          
          if (useMockData && DEMO_HELIX_DATA[config.id]) {
            const mockData = { ...baseStatus, ...DEMO_HELIX_DATA[config.id] };
            const timeFields = calculateTimeFields(mockData.lastUpdated);
            Object.assign(mockData, timeFields);
            if (config.nestedRBR && config.nestedRBRLabel && !mockData.nestedRBR) {
              mockData.nestedRBR = {
                type: config.nestedRBR,
                label: config.nestedRBRLabel,
                status: mockData.status,
              };
            }
            return mockData;
          }
          
          if (config.nestedRBR && config.nestedRBRLabel) {
            baseStatus.nestedRBR = {
              type: config.nestedRBR,
              label: config.nestedRBRLabel,
              status: 'dormant',
            };
          }
          
          return baseStatus;
        });

        // Calculate Gatekeeper status - check if any Rung 1 node is critical
        const rung1Nodes = pulseData.filter(p => {
          const nodeConfig = HELIX_NODE_CONFIGS.find(c => c.id === p.nodeId);
          return nodeConfig?.rung === 1;
        });
        const foundationBlocked = rung1Nodes.some(p => p.status === 'critical');
        const foundationCriticalCount = rung1Nodes.filter(p => p.status === 'critical').length;

        const criticalCount = pulseData.filter(p => p.status === 'critical').length;
        const activeCount = pulseData.filter(p => p.status === 'active').length;
        const dormantCount = pulseData.filter(p => p.status === 'dormant').length;

        let overallHealth: 'healthy' | 'attention' | 'critical' = 'healthy';
        if (criticalCount > 0) {
          overallHealth = 'critical';
        } else if (activeCount > 3 || dormantCount > 5) {
          overallHealth = 'attention';
        }

        return { pulseData, overallHealth, foundationBlocked, foundationCriticalCount };
      }

      // Fetch status for ALL nodes (company + device) in parallel
      const pulseData = await Promise.all(
        allNodeConfigs.map(config => fetchDeviceNodeStatus(productId, companyId, config, useMockData))
      );

      // Calculate Gatekeeper status - check if any Rung 1 node is critical
      const rung1Nodes = pulseData.filter(p => {
        const nodeConfig = HELIX_NODE_CONFIGS.find(c => c.id === p.nodeId);
        return nodeConfig?.rung === 1;
      });
      const foundationBlocked = rung1Nodes.some(p => p.status === 'critical');
      const foundationCriticalCount = rung1Nodes.filter(p => p.status === 'critical').length;

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

      return { pulseData, overallHealth, foundationBlocked, foundationCriticalCount };
    },
    enabled: true,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}
