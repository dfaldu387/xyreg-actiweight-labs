import { supabase } from '@/integrations/supabase/client';
import { CAPARecord, CAPAStatus } from '@/types/capa';

// Open statuses for filtering
const OPEN_STATUSES: CAPAStatus[] = ['draft', 'triage', 'investigation', 'planning', 'implementation', 'verification'];

// Calculate Risk Priority Number (RPN)
function calculateRPN(severity: number | null, probability: number | null): number {
  return (severity || 1) * (probability || 1);
}

// Get priority level from RPN
function getPriorityFromRPN(rpn: number): 'critical' | 'high' | 'medium' | 'low' {
  if (rpn >= 15) return 'critical';
  if (rpn >= 10) return 'high';
  if (rpn >= 5) return 'medium';
  return 'low';
}

export interface AggregatedStats {
  totalOpen: number;
  devicesWithCAPAs: number;
  totalDevices: number;
  byPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  overdue: number;
  escalatedCount: number;
}

export interface RootCausePattern {
  category: string;
  count: number;
  deviceIds: string[];
  capaIds: string[];
  capaNumbers: string[];
}

export interface EscalationAlert {
  type: 'root_cause_pattern' | 'overdue_critical' | 'volume_spike' | 'recurring_issue';
  severity: 'warning' | 'critical';
  title: string;
  description: string;
  affectedCAPAs: { id: string; capaId: string; deviceId?: string; deviceName?: string }[];
  recommendedAction: string;
}

export interface PatternDetectionResult {
  patterns: RootCausePattern[];
  alerts: EscalationAlert[];
  hasEscalationRecommendation: boolean;
}

// Mock CAPA data for demo - matches the device-level CAPA mock data
const MOCK_CAPAS: Partial<CAPARecord>[] = [
  {
    id: 'mock-capa-1',
    capa_id: 'CAPA-2026-001',
    company_id: 'mock-company',
    product_id: 'mock-device-1',
    source_type: 'internal',
    capa_type: 'corrective',
    problem_description: 'Sterilization Process Failure - Batch 2024-12',
    severity: 4,
    probability: 4,
    status: 'investigation',
    root_cause_category: 'process',
    created_at: '2026-01-10T08:00:00Z',
    target_closure_date: '2026-01-24T00:00:00Z', // overdue
  },
  {
    id: 'mock-capa-2',
    capa_id: 'CAPA-2026-003',
    company_id: 'mock-company',
    product_id: 'mock-device-1',
    source_type: 'internal',
    capa_type: 'corrective',
    problem_description: 'Assembly Line 2 Dimensional Defect',
    severity: 3,
    probability: 3,
    status: 'planning',
    root_cause_category: 'process',
    created_at: '2026-01-20T09:30:00Z',
    target_closure_date: '2026-02-05T00:00:00Z',
  },
  {
    id: 'mock-capa-3',
    capa_id: 'CAPA-2026-005',
    company_id: 'mock-company',
    product_id: 'mock-device-2',
    source_type: 'audit',
    capa_type: 'preventive',
    problem_description: 'Supplier qualification gap identified during audit',
    severity: 3,
    probability: 2,
    status: 'implementation',
    root_cause_category: 'process',
    created_at: '2026-01-15T10:00:00Z',
    target_closure_date: '2026-02-15T00:00:00Z',
  },
];

// Mock device names
const MOCK_DEVICE_NAMES: Record<string, string> = {
  'mock-device-1': 'New Idea #1',
  'mock-device-2': 'CardioMonitor Pro',
};

export const capaAggregationService = {
  /**
   * Get aggregated CAPA statistics across all devices for a company
   */
  async getAggregatedStats(companyId: string, useMockData: boolean = true): Promise<AggregatedStats> {
    // Fetch open CAPAs
    const { data, error } = await supabase
      .from('capa_records')
      .select('*')
      .eq('company_id', companyId)
      .in('status', OPEN_STATUSES);

    if (error) {
      console.error('Error fetching CAPAs for aggregation:', error);
    }

    // Fetch total device count for this company
    const { count: totalDevices, error: deviceError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('is_archived', false);

    if (deviceError) {
      console.error('Error fetching device count:', deviceError);
    }

    // Use real data if available, otherwise fall back to mock
    let records = (data || []) as unknown as CAPARecord[];
    
    if (records.length === 0 && useMockData) {
      records = MOCK_CAPAS as CAPARecord[];
    }

    const now = new Date();

    // Count unique devices WITH CAPAs
    const deviceIdsWithCAPAs = new Set(records.filter(r => r.product_id).map(r => r.product_id));
    
    // Count escalated (those with source_device_id)
    const escalatedCount = records.filter(r => r.source_device_id).length;

    // Group by priority
    const byPriority = { critical: 0, high: 0, medium: 0, low: 0 };
    records.forEach(r => {
      const rpn = calculateRPN(r.severity, r.probability);
      const priority = getPriorityFromRPN(rpn);
      byPriority[priority]++;
    });

    // Count overdue
    const overdue = records.filter(r => {
      if (!r.target_closure_date) return false;
      return new Date(r.target_closure_date) < now;
    }).length;

    return {
      totalOpen: records.length,
      devicesWithCAPAs: deviceIdsWithCAPAs.size,
      totalDevices: totalDevices || 0,
      byPriority,
      overdue,
      escalatedCount,
    };
  },

  /**
   * Detect patterns across device-level CAPAs that warrant company-wide attention
   */
  async detectEscalationPatterns(companyId: string, useMockData: boolean = true): Promise<PatternDetectionResult> {
    const { data, error } = await supabase
      .from('capa_records')
      .select('*')
      .eq('company_id', companyId)
      .in('status', OPEN_STATUSES);

    if (error) {
      console.error('Error fetching CAPAs for pattern detection:', error);
    }

    // Use real data if available, otherwise fall back to mock
    let records = (data || []) as unknown as CAPARecord[];
    
    if (records.length === 0 && useMockData) {
      records = MOCK_CAPAS as CAPARecord[];
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const patterns: RootCausePattern[] = [];
    const alerts: EscalationAlert[] = [];

    // 1. Root Cause Category Pattern Detection
    const byCauseCategory = new Map<string, CAPARecord[]>();
    records.forEach(r => {
      if (r.root_cause_category) {
        const existing = byCauseCategory.get(r.root_cause_category) || [];
        existing.push(r);
        byCauseCategory.set(r.root_cause_category, existing);
      }
    });

    // Find categories appearing in 2+ CAPAs (lowered for demo)
    byCauseCategory.forEach((capas, category) => {
      if (capas.length >= 2) {
        const uniqueDevices = new Set(capas.filter(c => c.product_id).map(c => c.product_id));
        patterns.push({
          category,
          count: capas.length,
          deviceIds: Array.from(uniqueDevices) as string[],
          capaIds: capas.map(c => c.id),
          capaNumbers: capas.map(c => c.capa_id),
        });

        alerts.push({
          type: 'root_cause_pattern',
          severity: 'warning',
          title: `Cross-Device Pattern: ${category.charAt(0).toUpperCase() + category.slice(1)}`,
          description: `${capas.length} CAPAs share the "${category}" root cause category.`,
          affectedCAPAs: capas.map(c => ({ 
            id: c.id, 
            capaId: c.capa_id, 
            deviceId: c.product_id || undefined,
            deviceName: c.product_id ? MOCK_DEVICE_NAMES[c.product_id] : undefined,
          })),
          recommendedAction: 'Review for systemic issue requiring company-wide action',
        });
      }
    });

    // 2. Overdue Critical CAPAs
    const overdueCriticals = records.filter(r => {
      const rpn = calculateRPN(r.severity, r.probability);
      const priority = getPriorityFromRPN(rpn);
      if (priority !== 'critical') return false;
      if (!r.target_closure_date) return false;
      return new Date(r.target_closure_date) < now;
    });

    if (overdueCriticals.length > 0) {
      alerts.push({
        type: 'overdue_critical',
        severity: 'critical',
        title: `${overdueCriticals.length} Overdue Critical CAPA(s)`,
        description: 'Critical CAPAs overdue require immediate management attention.',
        affectedCAPAs: overdueCriticals.map(c => ({ 
          id: c.id, 
          capaId: c.capa_id, 
          deviceId: c.product_id || undefined,
          deviceName: c.product_id ? MOCK_DEVICE_NAMES[c.product_id] : undefined,
        })),
        recommendedAction: 'Escalate to management and prioritize resolution',
      });
    }

    // 3. Volume Spike Detection (3+ new CAPAs in 30 days for same device - lowered for demo)
    const recentByDevice = new Map<string, CAPARecord[]>();
    records.forEach(r => {
      if (!r.product_id || !r.created_at) return;
      if (new Date(r.created_at) < thirtyDaysAgo) return;
      const existing = recentByDevice.get(r.product_id) || [];
      existing.push(r);
      recentByDevice.set(r.product_id, existing);
    });

    recentByDevice.forEach((capas, deviceId) => {
      if (capas.length >= 3) {
        const deviceName = MOCK_DEVICE_NAMES[deviceId] || 'Device';
        alerts.push({
          type: 'volume_spike',
          severity: 'warning',
          title: `Volume Spike: ${capas.length} CAPAs in 30 days`,
          description: `${deviceName} has ${capas.length} new CAPAs in the last 30 days.`,
          affectedCAPAs: capas.map(c => ({ 
            id: c.id, 
            capaId: c.capa_id, 
            deviceId,
            deviceName,
          })),
          recommendedAction: 'Review device quality trends and consider systemic investigation',
        });
      }
    });

    return {
      patterns,
      alerts,
      hasEscalationRecommendation: alerts.length > 0,
    };
  },

  /**
   * Get all CAPAs escalated from devices (for company CAPA node display)
   */
  async getEscalatedCAPAs(companyId: string): Promise<CAPARecord[]> {
    const { data, error } = await supabase
      .from('capa_records')
      .select('*')
      .eq('company_id', companyId)
      .not('source_device_id', 'is', null)
      .in('status', OPEN_STATUSES)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching escalated CAPAs:', error);
    }
    return (data || []) as unknown as CAPARecord[];
  },

  /**
   * Get all open CAPAs for aggregation display (with mock fallback)
   */
  async getOpenCAPAsForAggregation(companyId: string, useMockData: boolean = true): Promise<CAPARecord[]> {
    const { data, error } = await supabase
      .from('capa_records')
      .select('*')
      .eq('company_id', companyId)
      .in('status', OPEN_STATUSES)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching CAPAs:', error);
    }

    let records = (data || []) as unknown as CAPARecord[];
    
    if (records.length === 0 && useMockData) {
      records = MOCK_CAPAS as CAPARecord[];
    }

    return records;
  },

  /**
   * Get device names for a list of product IDs
   */
  async getDeviceNames(productIds: string[]): Promise<Map<string, string>> {
    if (productIds.length === 0) return new Map();

    const { data, error } = await supabase
      .from('products')
      .select('id, name')
      .in('id', productIds);

    if (error) {
      console.error('Error fetching device names:', error);
    }

    const map = new Map<string, string>();
    (data || []).forEach(p => map.set(p.id, p.name));
    
    // Add mock device names if not found
    productIds.forEach(id => {
      if (!map.has(id) && MOCK_DEVICE_NAMES[id]) {
        map.set(id, MOCK_DEVICE_NAMES[id]);
      }
    });

    return map;
  },
};
