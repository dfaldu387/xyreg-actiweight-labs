import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { TimelineDriftService } from '@/services/timelineDriftService';

export interface PersonalAlert {
  id: string;
  type: 'overdue_milestone' | 'delayed_launch' | 'at_risk_product' | 'timeline_drift';
  severity: 'critical' | 'warning';
  title: string;
  description: string;
  productId: string;
  productName: string;
  daysOverdue?: number;
  url?: string;
}

export interface GroupedAlerts {
  productId: string;
  productName: string;
  alerts: PersonalAlert[];
  maxSeverity: 'critical' | 'warning';
}

interface UsePersonalAlertsOptions {
  companyId?: string;
  selectedProductIds?: string[] | 'all';
}

export function usePersonalAlerts({ companyId, selectedProductIds = 'all' }: UsePersonalAlertsOptions) {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['personal-alerts', companyId, user?.id, selectedProductIds, today],
    queryFn: async () => {
      if (!user?.id) return [];

      const allAlerts: PersonalAlert[] = [];

      // 1. Overdue milestones assigned to current user
      let milestoneQuery = supabase
        .from('pms_milestones')
        .select('id, title, description, due_date, status, product_id, products!inner(name)')
        .eq('assigned_to', user.id)
        .lt('due_date', today)
        .neq('status', 'completed');

      if (companyId) {
        milestoneQuery = milestoneQuery.eq('company_id', companyId);
      }
      if (selectedProductIds !== 'all' && selectedProductIds.length > 0) {
        milestoneQuery = milestoneQuery.in('product_id', selectedProductIds);
      }

      const { data: milestones } = await milestoneQuery;

      if (milestones) {
        for (const m of milestones) {
          const daysOverdue = Math.floor((Date.now() - new Date(m.due_date).getTime()) / (1000 * 60 * 60 * 24));
          const productData = m.products as any;
          allAlerts.push({
            id: `milestone-${m.id}`,
            type: 'overdue_milestone',
            severity: daysOverdue > 7 ? 'critical' : 'warning',
            title: m.title,
            description: `${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`,
            productId: m.product_id,
            productName: productData?.name || 'Unknown',
            daysOverdue,
          });
        }
      }

      // 2. Delayed product launches (projected_launch_date passed, no actual_launch_date)
      let launchQuery = supabase
        .from('products')
        .select('id, name, projected_launch_date, status')
        .lt('projected_launch_date', today)
        .is('actual_launch_date', null)
        .eq('is_archived', false);

      if (companyId) {
        launchQuery = launchQuery.eq('company_id', companyId);
      }
      if (selectedProductIds !== 'all' && selectedProductIds.length > 0) {
        launchQuery = launchQuery.in('id', selectedProductIds);
      }

      const { data: delayedProducts } = await launchQuery;

      if (delayedProducts) {
        for (const p of delayedProducts) {
          const daysOverdue = Math.floor((Date.now() - new Date(p.projected_launch_date!).getTime()) / (1000 * 60 * 60 * 24));
          allAlerts.push({
            id: `launch-${p.id}`,
            type: 'delayed_launch',
            severity: daysOverdue > 30 ? 'critical' : 'warning',
            title: `Launch delayed`,
            description: `Projected launch was ${new Date(p.projected_launch_date!).toLocaleDateString()} (${daysOverdue} days ago)`,
            productId: p.id,
            productName: p.name,
            daysOverdue,
          });
        }
      }

      // 3. At-risk products
      let riskQuery = supabase
        .from('products')
        .select('id, name, status')
        .in('status', ['at_risk', 'delayed', 'blocked', 'on_hold'])
        .eq('is_archived', false);

      if (companyId) {
        riskQuery = riskQuery.eq('company_id', companyId);
      }
      if (selectedProductIds !== 'all' && selectedProductIds.length > 0) {
        riskQuery = riskQuery.in('id', selectedProductIds);
      }

      const { data: riskyProducts } = await riskQuery;

      if (riskyProducts) {
        for (const p of riskyProducts) {
          // Avoid duplicate if already flagged as delayed launch
          if (allAlerts.some(a => a.productId === p.id && a.type === 'delayed_launch')) continue;
          allAlerts.push({
            id: `risk-${p.id}`,
            type: 'at_risk_product',
            severity: p.status === 'blocked' ? 'critical' : 'warning',
            title: `Status: ${p.status?.replace(/_/g, ' ')}`,
            description: `Product requires attention`,
            productId: p.id,
            productName: p.name,
          });
        }
      }

      // 4. Timeline drift detection
      const productIdsForDrift: string[] = [];
      // Collect product IDs from previous queries
      if (delayedProducts) productIdsForDrift.push(...delayedProducts.map(p => p.id));
      if (riskyProducts) productIdsForDrift.push(...riskyProducts.map(p => p.id));
      
      // Also get all active products for drift detection
      let driftProductQuery = supabase
        .from('products')
        .select('id, name')
        .eq('is_archived', false);
      if (companyId) driftProductQuery = driftProductQuery.eq('company_id', companyId);
      if (selectedProductIds !== 'all' && selectedProductIds.length > 0) {
        driftProductQuery = driftProductQuery.in('id', selectedProductIds);
      }
      const { data: allProducts } = await driftProductQuery;
      
      if (allProducts) {
        const driftResults = await TimelineDriftService.detectDriftForProducts(
          allProducts.map(p => p.id)
        );

        for (const dr of driftResults) {
          const driftedPhases = dr.driftAlerts.filter(a => a.type === 'drifted');
          if (driftedPhases.length === 0) continue;

          const topDrift = driftedPhases.reduce((max, a) => a.driftDays > max.driftDays ? a : max, driftedPhases[0]);
          allAlerts.push({
            id: `drift-${dr.productId}`,
            type: 'timeline_drift',
            severity: topDrift.driftDays > 14 ? 'critical' : 'warning',
            title: `Timeline Drift: ${topDrift.phaseName} shifted +${topDrift.driftDays} days`,
            description: dr.downstreamAtRiskCount > 0
              ? `${dr.downstreamAtRiskCount} downstream phase${dr.downstreamAtRiskCount !== 1 ? 's' : ''} at risk`
              : 'Early phase change flags downstream risk',
            productId: dr.productId,
            productName: dr.productName,
            daysOverdue: topDrift.driftDays,
          });
        }
      }

      return allAlerts;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  // Group by product
  const groupedAlerts: GroupedAlerts[] = [];
  const productMap = new Map<string, GroupedAlerts>();

  for (const alert of alerts) {
    if (!productMap.has(alert.productId)) {
      productMap.set(alert.productId, {
        productId: alert.productId,
        productName: alert.productName,
        alerts: [],
        maxSeverity: 'warning',
      });
    }
    const group = productMap.get(alert.productId)!;
    group.alerts.push(alert);
    if (alert.severity === 'critical') {
      group.maxSeverity = 'critical';
    }
  }

  // Sort: critical groups first, then by number of alerts
  for (const group of productMap.values()) {
    group.alerts.sort((a, b) => (a.severity === 'critical' ? -1 : 1) - (b.severity === 'critical' ? -1 : 1));
    groupedAlerts.push(group);
  }
  groupedAlerts.sort((a, b) => {
    if (a.maxSeverity !== b.maxSeverity) return a.maxSeverity === 'critical' ? -1 : 1;
    return b.alerts.length - a.alerts.length;
  });

  return { groupedAlerts, totalAlerts: alerts.length, isLoading };
}
