/**
 * Timeline Drift Detection Service
 * 
 * Detects when phases shift from their original baseline dates
 * and flags downstream phases as at-risk.
 */

import { supabase } from '@/integrations/supabase/client';

export interface DriftAlert {
  phaseId: string;
  phaseName: string;
  driftDays: number; // positive = delayed
  type: 'drifted' | 'downstream_at_risk';
  baselineStartDate: string;
  currentStartDate: string;
  position: number;
}

export interface DriftResult {
  productId: string;
  productName: string;
  driftAlerts: DriftAlert[];
  hasDrift: boolean;
  maxDriftDays: number;
  downstreamAtRiskCount: number;
}

const DRIFT_THRESHOLD_DAYS = 3;

export class TimelineDriftService {
  /**
   * Snapshot baseline dates for phases that don't have them yet.
   * Only writes baseline columns if they're currently null.
   */
  static async snapshotBaseline(productId: string): Promise<number> {
    const { data: phases, error } = await supabase
      .from('lifecycle_phases')
      .select('id, start_date, end_date, baseline_start_date, baseline_end_date')
      .eq('product_id', productId);

    if (error || !phases) return 0;

    let snapshotCount = 0;

    for (const phase of phases) {
      const needsStartBaseline = !phase.baseline_start_date && phase.start_date;
      const needsEndBaseline = !phase.baseline_end_date && phase.end_date;

      if (needsStartBaseline || needsEndBaseline) {
        const updateData: Record<string, string> = {};
        if (needsStartBaseline) updateData.baseline_start_date = phase.start_date!;
        if (needsEndBaseline) updateData.baseline_end_date = phase.end_date!;

        const { error: updateError } = await supabase
          .from('lifecycle_phases')
          .update(updateData as any)
          .eq('id', phase.id);

        if (!updateError) snapshotCount++;
      }
    }

    return snapshotCount;
  }

  /**
   * Detect drift for a single product's phases.
   */
  static async detectDrift(productId: string, productName: string): Promise<DriftResult> {
    const { data: phases } = await supabase
      .from('lifecycle_phases')
      .select('id, name, start_date, end_date, baseline_start_date, baseline_end_date, position')
      .eq('product_id', productId)
      .order('position', { ascending: true });

    const result: DriftResult = {
      productId,
      productName,
      driftAlerts: [],
      hasDrift: false,
      maxDriftDays: 0,
      downstreamAtRiskCount: 0,
    };

    if (!phases || phases.length === 0) return result;

    // Find drifted phases
    let earliestDriftPosition = Infinity;

    for (const phase of phases) {
      if (!phase.baseline_start_date || !phase.start_date) continue;

      const baselineStart = new Date(phase.baseline_start_date).getTime();
      const currentStart = new Date(phase.start_date).getTime();
      const driftDays = Math.round((currentStart - baselineStart) / (1000 * 60 * 60 * 24));

      if (driftDays >= DRIFT_THRESHOLD_DAYS) {
        result.driftAlerts.push({
          phaseId: phase.id,
          phaseName: phase.name,
          driftDays,
          type: 'drifted',
          baselineStartDate: phase.baseline_start_date,
          currentStartDate: phase.start_date,
          position: phase.position ?? 0,
        });

        if ((phase.position ?? 0) < earliestDriftPosition) {
          earliestDriftPosition = phase.position ?? 0;
        }

        if (driftDays > result.maxDriftDays) {
          result.maxDriftDays = driftDays;
        }
      }
    }

    // Flag downstream phases as at-risk
    if (earliestDriftPosition < Infinity) {
      for (const phase of phases) {
        const pos = phase.position ?? 0;
        if (pos > earliestDriftPosition) {
          // Don't duplicate if already flagged as drifted
          if (!result.driftAlerts.some(a => a.phaseId === phase.id)) {
            result.driftAlerts.push({
              phaseId: phase.id,
              phaseName: phase.name,
              driftDays: 0,
              type: 'downstream_at_risk',
              baselineStartDate: phase.baseline_start_date || '',
              currentStartDate: phase.start_date || '',
              position: pos,
            });
            result.downstreamAtRiskCount++;
          }
        }
      }
    }

    result.hasDrift = result.driftAlerts.some(a => a.type === 'drifted');
    return result;
  }

  /**
   * Detect drift across multiple products (for personal alerts).
   */
  static async detectDriftForProducts(
    productIds: string[]
  ): Promise<DriftResult[]> {
    if (productIds.length === 0) return [];

    // Get product names
    const { data: products } = await supabase
      .from('products')
      .select('id, name')
      .in('id', productIds)
      .eq('is_archived', false);

    if (!products) return [];

    const results = await Promise.all(
      products.map(p => this.detectDrift(p.id, p.name))
    );

    return results.filter(r => r.hasDrift);
  }
}
