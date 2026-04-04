import { TraceabilityLinksService, TraceabilityLink } from './traceabilityLinksService';
import { getBaselinedObjectIds } from './baselineLockService';

export interface ImpactItem {
  objectId: string;
  objectType: string;
  linkType: string;
  isBaselined: boolean;
}

export interface ImpactAnalysisReport {
  downstream: ImpactItem[];
  riskImpacts: ImpactItem[];
  baselineImpacts: ImpactItem[];
  totalAffected: number;
}

// Object types considered "downstream" in the V-model
const DOWNSTREAM_TYPES = ['software_requirement', 'hardware_requirement', 'test_case', 'verification_test'];
const RISK_TYPES = ['hazard'];

function classifyLink(
  link: TraceabilityLink,
  targetObjectId: string,
  baselinedIds: Set<string>
): { item: ImpactItem; category: 'downstream' | 'risk' } | null {
  // Determine the "other" end of the link
  const isSource = link.source_id === targetObjectId;
  const otherId = isSource ? link.target_id : link.source_id;
  const otherType = isSource ? link.target_type : link.source_type;

  const isBaselined = baselinedIds.has(otherId);

  if (RISK_TYPES.includes(otherType)) {
    return {
      item: { objectId: otherId, objectType: otherType, linkType: link.link_type, isBaselined },
      category: 'risk',
    };
  }

  // Everything else that's linked is considered downstream impact
  return {
    item: { objectId: otherId, objectType: otherType, linkType: link.link_type, isBaselined },
    category: 'downstream',
  };
}

export async function generateImpactAnalysis(
  objectId: string,
  _objectType: string,
  productId: string
): Promise<ImpactAnalysisReport> {
  // Fetch traceability links and baselined IDs in parallel
  const [allLinks, baselinedIds] = await Promise.all([
    TraceabilityLinksService.getByProduct(productId),
    getBaselinedObjectIds(productId),
  ]);

  // Filter to links involving the target object
  const relevantLinks = allLinks.filter(
    (l) => l.source_id === objectId || l.target_id === objectId
  );

  const downstream: ImpactItem[] = [];
  const riskImpacts: ImpactItem[] = [];
  const seen = new Set<string>();

  for (const link of relevantLinks) {
    const result = classifyLink(link, objectId, baselinedIds);
    if (!result || seen.has(result.item.objectId)) continue;
    seen.add(result.item.objectId);

    if (result.category === 'risk') {
      riskImpacts.push(result.item);
    } else {
      downstream.push(result.item);
    }
  }

  const baselineImpacts = [...downstream, ...riskImpacts].filter((i) => i.isBaselined);

  return {
    downstream,
    riskImpacts,
    baselineImpacts,
    totalAffected: seen.size,
  };
}
