/**
 * Derives all 9 Business Model Canvas fields from existing Genesis inputs.
 * Used by both InvestorViewPage and useInvestorPreviewData for consistency.
 */

interface DeriveCanvasParams {
  product: {
    intended_use?: string | null;
    description?: string | null;
    ip_strategy_summary?: string | null;
    markets?: any; // JSONB data from database - parsed at runtime
    strategic_partners?: {
      distributionPartners?: string;
      manufacturingPartners?: string;
      clinicalPartners?: string;
      regulatoryPartners?: string;
    } | null;
  };
  gtmStrategyData?: {
    channels?: any;
    territory_priority?: any;
    buyer_persona?: string | null;
    sales_cycle_weeks?: number | null;
    budget_cycle?: string | null;
  } | null;
  blueprintData?: {
    activity_notes?: any;
  } | null;
  reimbursementStrategyData?: {
    value_proposition?: string | null;
    coverage_status?: string | null;
    payer_mix?: any;
    target_codes?: any;
  } | null;
  teamMembers?: Array<{ name: string; role?: string | null }> | null;
  // Financial KPIs for Revenue Streams
  npvData?: {
    npv: number;
    peakRevenue?: number;
    grossMargin?: number;
    breakEvenYear?: number | null;
    totalRevenue?: number;
    totalCosts?: number;
    developmentCosts?: number;
  } | null;
}

export interface DerivedCanvas {
  keyPartners: string;
  keyActivities: string;
  keyResources: string;
  valuePropositions: string;
  customerRelationships: string;
  channels: string;
  customerSegments: string;
  costStructure: string;
  revenueStreams: string;
}

// Helper to add labeled line if value exists
const addLine = (label: string, value: string | null | undefined): string => {
  if (!value || value.trim() === '') return '';
  return `${label}: ${value.trim()}`;
};

// Format channels array into readable text
const formatChannels = (channels: any): string => {
  if (!channels || !Array.isArray(channels)) return '';
  
  const enabled = channels.filter((c: any) => c.enabled !== false);
  if (enabled.length === 0) return '';
  
  return enabled
    .map((c: any) => {
      if (typeof c === 'string') return `• ${c}`;
      const name = c.name || c.channel || '';
      const details = c.details || '';
      return details ? `• ${name}: ${details}` : `• ${name}`;
    })
    .filter(Boolean)
    .join('\n');
};

// Format territories/markets into readable segments
const formatTerritories = (territories: any): string => {
  if (!territories || !Array.isArray(territories)) return '';
  
  return territories
    .filter((t: any) => t.buyerType || t.procurementPath)
    .map((t: any) => {
      const market = t.code?.toUpperCase() || t.name || 'Market';
      const parts: string[] = [];
      if (t.buyerType) parts.push(`Buyer: ${t.buyerType}`);
      if (t.procurementPath) parts.push(`Path: ${t.procurementPath}`);
      return `${market}: ${parts.join(', ')}`;
    })
    .join('\n');
};

// Format markets array
const formatMarkets = (markets: any): string => {
  if (!markets || !Array.isArray(markets)) return '';
  
  const selected = markets.filter((m: any) => m.selected);
  if (selected.length === 0) return '';
  
  return selected.map((m: any) => m.name || m.code?.toUpperCase()).filter(Boolean).join(', ');
};

// Format payer mix
const formatPayerMix = (payerMix: any): string => {
  if (!payerMix || !Array.isArray(payerMix) || payerMix.length === 0) return '';
  
  return payerMix
    .filter((p: any) => p.payer && p.percentage)
    .map((p: any) => `• ${p.payer}: ${p.percentage}%`)
    .join('\n');
};

export function deriveBusinessModelCanvas(params: DeriveCanvasParams): DerivedCanvas {
  const { product, gtmStrategyData, blueprintData, reimbursementStrategyData, teamMembers } = params;
  const notes = blueprintData?.activity_notes as Record<string, string> | null;

  // VALUE PROPOSITIONS: Primary value proposition from multiple sources
  const valuePropositionParts: string[] = [];
  if (product.intended_use) {
    valuePropositionParts.push(addLine('Intended Use', product.intended_use));
  }
  if (product.description) {
    valuePropositionParts.push(addLine('Description', product.description));
  }
  if (reimbursementStrategyData?.value_proposition) {
    valuePropositionParts.push(addLine('Value Proposition', reimbursementStrategyData.value_proposition));
  }
  if (reimbursementStrategyData?.coverage_status) {
    valuePropositionParts.push(addLine('Coverage Status', reimbursementStrategyData.coverage_status));
  }

  // CUSTOMER SEGMENTS: Who we're targeting
  const customerSegmentParts: string[] = [];
  if (gtmStrategyData?.buyer_persona) {
    customerSegmentParts.push(addLine('Buyer Persona', gtmStrategyData.buyer_persona));
  }
  const markets = formatMarkets(product.markets);
  if (markets) {
    customerSegmentParts.push(addLine('Target Markets', markets));
  }
  const territoryBuyers = formatTerritories(gtmStrategyData?.territory_priority);
  if (territoryBuyers) {
    customerSegmentParts.push('\nMarket-Specific:\n' + territoryBuyers);
  }

  // CHANNELS: How we reach customers
  const channelParts: string[] = [];
  const formattedChannels = formatChannels(gtmStrategyData?.channels);
  if (formattedChannels) {
    channelParts.push(formattedChannels);
  }
  if (gtmStrategyData?.sales_cycle_weeks) {
    channelParts.push(addLine('Sales Cycle', `${gtmStrategyData.sales_cycle_weeks} weeks`));
  }
  if (gtmStrategyData?.budget_cycle) {
    channelParts.push(addLine('Budget Cycle', gtmStrategyData.budget_cycle));
  }

  // CUSTOMER RELATIONSHIPS: How we maintain relationships
  const relationshipParts: string[] = [];
  // Infer from channels
  const channelsArray = gtmStrategyData?.channels as any[] | null;
  if (channelsArray && Array.isArray(channelsArray)) {
    const enabledChannels = channelsArray.filter((c: any) => c.enabled !== false);
    const hasDirect = enabledChannels.some((c: any) => 
      (c.name?.toLowerCase() || '').includes('direct')
    );
    const hasDistributor = enabledChannels.some((c: any) => 
      (c.name?.toLowerCase() || '').includes('distributor') || 
      (c.name?.toLowerCase() || '').includes('partner')
    );
    if (hasDirect) relationshipParts.push('• Direct Sales Relationship');
    if (hasDistributor) relationshipParts.push('• Partner/Distributor Network');
  }
  // From blueprint if available
  if (notes?.['11']) {
    relationshipParts.push(addLine('Customer Engagement', notes['11']));
  }

  // REVENUE STREAMS: How we make money
  const revenueParts: string[] = [];
  
  // Add Financial KPIs from Lifecycle Summary
  const { npvData } = params;
  if (npvData) {
    const kpiLines: string[] = [];
    if (npvData.npv !== 0) {
      kpiLines.push(`• 5-Year NPV: $${Math.round(npvData.npv).toLocaleString()}`);
    }
    if (npvData.totalRevenue && npvData.totalRevenue > 0) {
      kpiLines.push(`• Total Revenue (5Y): $${Math.round(npvData.totalRevenue).toLocaleString()}`);
    }
    if (npvData.peakRevenue && npvData.peakRevenue > 0) {
      kpiLines.push(`• Peak Annual Revenue: $${Math.round(npvData.peakRevenue).toLocaleString()}`);
    }
    if (npvData.grossMargin && npvData.grossMargin > 0) {
      kpiLines.push(`• Gross Margin: ${npvData.grossMargin.toFixed(1)}%`);
    }
    if (npvData.developmentCosts && npvData.developmentCosts > 0) {
      kpiLines.push(`• Development Costs: $${Math.round(npvData.developmentCosts).toLocaleString()}`);
    }
    if (npvData.breakEvenYear && npvData.breakEvenYear > 0) {
      kpiLines.push(`• Break-even: Year ${npvData.breakEvenYear}`);
    } else if (npvData.breakEvenYear === null && npvData.npv < 0) {
      kpiLines.push(`• Break-even: Not within forecast period`);
    }
    if (kpiLines.length > 0) {
      revenueParts.push('Financial Projections:\n' + kpiLines.join('\n'));
    }
  }
  
  const payerMix = formatPayerMix(reimbursementStrategyData?.payer_mix);
  if (payerMix) {
    revenueParts.push('Payer Mix:\n' + payerMix);
  }
  if (reimbursementStrategyData?.target_codes && Array.isArray(reimbursementStrategyData.target_codes)) {
    const codes = reimbursementStrategyData.target_codes
      .filter((c: any) => c.code)
      .map((c: any) => `• ${c.code}${c.description ? `: ${c.description}` : ''}`)
      .slice(0, 5)
      .join('\n');
    if (codes) revenueParts.push('Reimbursement Codes:\n' + codes);
  }

  // KEY RESOURCES: What we need to deliver value
  const resourceParts: string[] = [];
  if (teamMembers && teamMembers.length > 0) {
    const roles = teamMembers
      .filter(m => m.role)
      .map(m => m.role)
      .slice(0, 5);
    resourceParts.push(`Team: ${teamMembers.length} member${teamMembers.length > 1 ? 's' : ''}`);
    if (roles.length > 0) {
      resourceParts.push(`Key Roles: ${roles.join(', ')}`);
    }
  }
  if (product.ip_strategy_summary) {
    resourceParts.push(addLine('IP Strategy', product.ip_strategy_summary));
  }

  // KEY ACTIVITIES: What we do
  const activityParts: string[] = [];
  if (notes?.['6']) activityParts.push(addLine('Regulatory Strategy', notes['6']));
  if (notes?.['7']) activityParts.push(addLine('Technical Development', notes['7']));
  if (notes?.['9']) activityParts.push(addLine('Clinical Strategy', notes['9']));
  if (notes?.['12']) activityParts.push(addLine('Reimbursement Strategy', notes['12']));

  // KEY PARTNERS: Who we work with
  const partnerParts: string[] = [];
  
  // Aggregate market-specific strategic partners (new structured data)
  const marketsArray = product.markets;
  if (marketsArray && Array.isArray(marketsArray)) {
    const selectedMarkets = marketsArray.filter((m: any) => m.selected);
    
    // Collect unique partners by category across all markets
    const distributionSet = new Map<string, { name: string; markets: string[] }>();
    const clinicalSet = new Map<string, { name: string; markets: string[] }>();
    const regulatorySet = new Map<string, { name: string; markets: string[] }>();
    const notifiedBodySet = new Map<string, { name: string; nbNumber: number; markets: string[] }>();
    
    selectedMarkets.forEach((market: any) => {
      const marketLabel = market.name || market.code?.toUpperCase() || 'Market';
      
      // Distribution partners
      if (market.distributionPartners && Array.isArray(market.distributionPartners)) {
        market.distributionPartners.forEach((p: any) => {
          if (p.name) {
            const existing = distributionSet.get(p.name);
            if (existing) {
              existing.markets.push(marketLabel);
            } else {
              distributionSet.set(p.name, { name: p.name, markets: [marketLabel] });
            }
          }
        });
      }
      
      // Clinical partners
      if (market.clinicalPartners && Array.isArray(market.clinicalPartners)) {
        market.clinicalPartners.forEach((p: any) => {
          if (p.name) {
            const existing = clinicalSet.get(p.name);
            if (existing) {
              existing.markets.push(marketLabel);
            } else {
              clinicalSet.set(p.name, { name: p.name, markets: [marketLabel] });
            }
          }
        });
      }
      
      // Regulatory partners
      if (market.regulatoryPartners && Array.isArray(market.regulatoryPartners)) {
        market.regulatoryPartners.forEach((p: any) => {
          if (p.name) {
            const existing = regulatorySet.get(p.name);
            if (existing) {
              existing.markets.push(marketLabel);
            } else {
              regulatorySet.set(p.name, { name: p.name, markets: [marketLabel] });
            }
          }
        });
      }
      
      // Notified Body (EU markets)
      if (market.notifiedBody && typeof market.notifiedBody === 'object' && market.notifiedBody.name) {
        const nbName = market.notifiedBody.name;
        const nbNumber = market.notifiedBody.nb_number || 0;
        const existing = notifiedBodySet.get(nbName);
        if (existing) {
          existing.markets.push(marketLabel);
        } else {
          notifiedBodySet.set(nbName, { name: nbName, nbNumber, markets: [marketLabel] });
        }
      }
    });
    
    // Format Notified Body (first, as it's regulatory-critical)
    if (notifiedBodySet.size > 0) {
      const lines = Array.from(notifiedBodySet.values())
        .map(nb => `• ${nb.name} (NB ${nb.nbNumber.toString().padStart(4, '0')})`)
        .join('\n');
      partnerParts.push('Notified Body:\n' + lines);
    } else {
      // Check if EU market is selected and determine NB requirement based on risk class
      const euMarket = selectedMarkets.find((m: any) => m.code === 'EU');
      if (euMarket) {
        // Normalize risk class to check for Class I
        const riskClass = (euMarket.riskClass || '').toString().trim();
        const normalizedRiskClass = riskClass.toLowerCase().replace(/^class[\s_-]*/i, '');
        const isClassI = normalizedRiskClass === 'i' || normalizedRiskClass === '1';
        
        if (isClassI) {
          // Class I devices do not require a Notified Body
          partnerParts.push('Notified Body: Not needed');
        } else {
          // Higher risk classes require NB but none is defined yet
          partnerParts.push('Notified Body: Not defined');
        }
      }
    }
    
    // Format distribution partners
    if (distributionSet.size > 0) {
      const lines = Array.from(distributionSet.values())
        .map(p => `• ${p.name}${p.markets.length > 1 ? ` (${p.markets.join(', ')})` : ''}`)
        .join('\n');
      partnerParts.push('Distribution Partners:\n' + lines);
    }
    
    // Format clinical partners
    if (clinicalSet.size > 0) {
      const lines = Array.from(clinicalSet.values())
        .map(p => `• ${p.name}${p.markets.length > 1 ? ` (${p.markets.join(', ')})` : ''}`)
        .join('\n');
      partnerParts.push('Clinical Partners:\n' + lines);
    }
    
    // Format regulatory partners
    if (regulatorySet.size > 0) {
      const lines = Array.from(regulatorySet.values())
        .map(p => `• ${p.name}${p.markets.length > 1 ? ` (${p.markets.join(', ')})` : ''}`)
        .join('\n');
      partnerParts.push('Regulatory Partners:\n' + lines);
    }
  }
  
  // Fallback to legacy strategic_partners field if no market-specific partners
  if (partnerParts.length === 0) {
    const strategicPartners = product.strategic_partners;
    if (strategicPartners) {
      if (strategicPartners.distributionPartners) {
        partnerParts.push(addLine('Distribution Partners', strategicPartners.distributionPartners));
      }
      if (strategicPartners.manufacturingPartners) {
        partnerParts.push(addLine('Manufacturing Partners', strategicPartners.manufacturingPartners));
      }
      if (strategicPartners.clinicalPartners) {
        partnerParts.push(addLine('Clinical Partners', strategicPartners.clinicalPartners));
      }
      if (strategicPartners.regulatoryPartners) {
        partnerParts.push(addLine('Regulatory Partners', strategicPartners.regulatoryPartners));
      }
    }
  }
  
  // Secondary fallback to blueprint notes
  if (partnerParts.length === 0 && notes?.['8']) {
    partnerParts.push(addLine('Resource Partners', notes['8']));
  }
  
  // Infer from GTM channels (tertiary source)
  if (partnerParts.length === 0 && channelsArray && Array.isArray(channelsArray)) {
    const partners = channelsArray
      .filter((c: any) => c.enabled !== false && c.details)
      .map((c: any) => `• ${c.name}: ${c.details}`)
      .slice(0, 3);
    if (partners.length > 0) {
      partnerParts.push('Channel Partners:\n' + partners.join('\n'));
    }
  }

  // COST STRUCTURE: Major cost areas
  const costParts: string[] = [];
  if (notes?.['8']) costParts.push(addLine('Resource & Project Costs', notes['8']));
  if (notes?.['18']) costParts.push(addLine('Launch Costs', notes['18']));
  // Default cost categories if nothing specific
  if (costParts.length === 0) {
    costParts.push('Major Cost Categories:');
    costParts.push('• R&D and Product Development');
    costParts.push('• Regulatory and Clinical');
    costParts.push('• Manufacturing');
    costParts.push('• Sales & Marketing');
  }

  return {
    valuePropositions: valuePropositionParts.filter(Boolean).join('\n\n'),
    customerSegments: customerSegmentParts.filter(Boolean).join('\n'),
    channels: channelParts.filter(Boolean).join('\n'),
    customerRelationships: relationshipParts.filter(Boolean).join('\n'),
    revenueStreams: revenueParts.filter(Boolean).join('\n\n'),
    keyResources: resourceParts.filter(Boolean).join('\n'),
    keyActivities: activityParts.filter(Boolean).join('\n'),
    keyPartners: partnerParts.filter(Boolean).join('\n\n'),
    costStructure: costParts.filter(Boolean).join('\n'),
  };
}
