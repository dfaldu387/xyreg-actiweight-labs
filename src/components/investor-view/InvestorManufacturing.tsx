import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Factory, Building2, AlertTriangle, MapPin, DollarSign } from 'lucide-react';

interface CMOPartner {
  name: string;
  status: string;
  notes?: string;
}

interface SingleSourceComponent {
  component: string;
  supplier: string;
  risk_level: 'low' | 'medium' | 'high';
}

interface ManufacturingData {
  current_stage: string | null;
  commercial_location: string | null;
  commercial_model: string | null;
  cmo_partners: CMOPartner[];
  cogs_at_scale: number | null;
  cogs_at_scale_currency: string;
  single_source_components: SingleSourceComponent[];
  supply_chain_risks: string | null;
  notes: string | null;
}

interface InvestorManufacturingProps {
  data: ManufacturingData;
}

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  prototype: { label: 'Prototype', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  pilot: { label: 'Pilot Production', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  scale_up: { label: 'Scale-Up', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  commercial: { label: 'Commercial', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

const MODEL_LABELS: Record<string, string> = {
  in_house: 'In-House Manufacturing',
  cmo: 'Contract Manufacturing (CMO)',
  hybrid: 'Hybrid Model',
};

export function InvestorManufacturing({ data }: InvestorManufacturingProps) {
  const hasContent = data.current_stage || data.commercial_model || 
    (data.cmo_partners && data.cmo_partners.length > 0) ||
    (data.single_source_components && data.single_source_components.length > 0) ||
    data.cogs_at_scale;

  if (!hasContent) {
    return null;
  }

  const stageConfig = data.current_stage ? STAGE_LABELS[data.current_stage] : null;
  const modelLabel = data.commercial_model ? MODEL_LABELS[data.commercial_model] || data.commercial_model : null;

  const formatCurrency = (amount: number | null, currency: string) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const riskColors = {
    low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
          <Factory className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Manufacturing & Supply Chain</h2>
          <p className="text-sm text-muted-foreground">Production strategy and operational readiness</p>
        </div>
      </div>

      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardContent className="pt-6">
          {/* Top row: Stage, Model, Location, COGS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {stageConfig && (
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-xs text-muted-foreground mb-1">Current Stage</p>
                <Badge className={stageConfig.color}>{stageConfig.label}</Badge>
              </div>
            )}
            
            {modelLabel && (
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-xs text-muted-foreground mb-1">Model</p>
                <p className="font-medium text-sm">{modelLabel}</p>
              </div>
            )}
            
            {data.commercial_location && (
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-xs text-muted-foreground mb-1">Location</p>
                <div className="flex items-center justify-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <p className="font-medium text-sm">{data.commercial_location}</p>
                </div>
              </div>
            )}
            
            {data.cogs_at_scale && (
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-xs text-muted-foreground mb-1">Target COGS</p>
                <div className="flex items-center justify-center gap-1">
                  <DollarSign className="h-3 w-3 text-emerald-600" />
                  <p className="font-medium text-sm text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(data.cogs_at_scale, data.cogs_at_scale_currency)}/unit
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CMO Partners */}
            {data.cmo_partners && data.cmo_partners.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Manufacturing Partners
                </h3>
                <div className="space-y-2">
                  {data.cmo_partners.map((partner, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{partner.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {partner.status}
                        </Badge>
                      </div>
                      {partner.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{partner.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Single Source Components */}
            {data.single_source_components && data.single_source_components.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Single-Source Components
                </h3>
                <div className="space-y-2">
                  {data.single_source_components.map((comp, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{comp.component}</span>
                        <Badge className={riskColors[comp.risk_level]}>
                          {comp.risk_level} risk
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supplier: {comp.supplier}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Supply Chain Risks */}
          {data.supply_chain_risks && (
            <div className="mt-6 p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Supply Chain Risks & Mitigations
              </h3>
              <p className="text-sm text-muted-foreground">{data.supply_chain_risks}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
