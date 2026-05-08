import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid, Users, BarChart3, Calculator, DollarSign, Coins,
  Shield, Target, Megaphone, Tag, Star, ArrowRight, Map,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface HubCardConfig {
  tab: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  /** 'business' (gold), 'design-risk' (teal), 'operations' (blue) */
  bucket: 'business' | 'design-risk' | 'operations';
  /** Whether this area has investor-essential fields */
  investorEssential?: boolean;
  /** 0-100 completion */
  completion: number;
}

interface BusinessCaseHubProps {
  productId: string;
  cards: HubCardConfig[];
  blueprint: {
    investorComplete: number;
    investorTotal: number;
    fullComplete: number;
    fullTotal: number;
    track: 'investor' | 'full';
  };
  onTrackChange: (track: 'investor' | 'full') => void;
  onContinueBlueprint: () => void;
}

const BUCKET_GRADIENT: Record<HubCardConfig['bucket'], string> = {
  business: 'from-amber-400 to-amber-600',
  'design-risk': 'from-teal-400 to-teal-600',
  operations: 'from-blue-400 to-blue-600',
};

const BUCKET_RING: Record<HubCardConfig['bucket'], string> = {
  business: 'group-hover:ring-amber-300',
  'design-risk': 'group-hover:ring-teal-300',
  operations: 'group-hover:ring-blue-300',
};

export function BusinessCaseHub({
  productId,
  cards,
  blueprint,
  onTrackChange,
  onContinueBlueprint,
}: BusinessCaseHubProps) {
  const navigate = useNavigate();

  const investorPct = blueprint.investorTotal === 0
    ? 0
    : Math.round((blueprint.investorComplete / blueprint.investorTotal) * 100);
  const fullPct = blueprint.fullTotal === 0
    ? 0
    : Math.round((blueprint.fullComplete / blueprint.fullTotal) * 100);

  return (
    <div className="space-y-6">
      {/* Hero strip — Venture Blueprint as the meta layer */}
      <Card className="relative overflow-hidden border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50 shadow-sm">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-amber-400 to-amber-600" />
        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md">
              <Map className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                  Guided plan · Sits on top of every section below
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Venture Blueprint</h2>
              <p className="max-w-2xl text-sm text-slate-600">
                One step-by-step path through your business plan. Each step writes to the
                same data the specialist tabs use — fill it here or open the tab directly.
              </p>
              <div className="flex flex-wrap gap-3 pt-1 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-900">
                  <Star className="h-3 w-3 fill-amber-600 text-amber-600" />
                  Investor essentials {blueprint.investorComplete}/{blueprint.investorTotal} ({investorPct}%)
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                  Full plan {blueprint.fullComplete}/{blueprint.fullTotal} ({fullPct}%)
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2.5">
            <div className="inline-flex rounded-md border border-amber-200 bg-white p-0.5">
              <button
                type="button"
                onClick={() => onTrackChange('investor')}
                className={cn(
                  'rounded-sm px-3 py-1 text-xs font-medium transition-colors',
                  blueprint.track === 'investor'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-amber-900 hover:bg-amber-50',
                )}
              >
                Investor track
              </button>
              <button
                type="button"
                onClick={() => onTrackChange('full')}
                className={cn(
                  'rounded-sm px-3 py-1 text-xs font-medium transition-colors',
                  blueprint.track === 'full'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-amber-900 hover:bg-amber-50',
                )}
              >
                Full plan
              </button>
            </div>
            <Button
              onClick={onContinueBlueprint}
              className="bg-amber-500 text-white hover:bg-amber-600"
              size="sm"
            >
              Continue blueprint
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Specialist views — each is the SSOT for its area */}
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Specialist views</h3>
            <p className="text-xs text-slate-500">
              Each card is the source of truth for its area — open one to edit in detail.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            const complete = card.completion >= 100;
            return (
              <button
                key={card.tab}
                type="button"
                onClick={() =>
                  navigate(`/app/product/${productId}/business-case?tab=${card.tab}`)
                }
                className={cn(
                  'group relative flex flex-col items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm ring-1 ring-transparent transition-all hover:-translate-y-0.5 hover:shadow-md',
                  BUCKET_RING[card.bucket],
                )}
              >
                <div className="flex w-full items-start justify-between">
                  <div
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm',
                      BUCKET_GRADIENT[card.bucket],
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  {card.investorEssential && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                      <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                      Investor
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-900">{card.label}</h4>
                  <p className="text-xs leading-relaxed text-slate-500 line-clamp-2">
                    {card.description}
                  </p>
                </div>
                <div className="mt-auto flex w-full items-center justify-between pt-2">
                  {complete ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Complete
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-500">
                      {card.completion}% complete
                    </span>
                  )}
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600" />
                </div>
                <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden rounded-b-xl bg-slate-100">
                  <div
                    className={cn(
                      'h-full bg-gradient-to-r transition-all',
                      BUCKET_GRADIENT[card.bucket],
                    )}
                    style={{ width: `${card.completion}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Default card configuration for Business Case landing — color-coded per the
 * 5-color domain system. Completion is supplied by the page using readiness data.
 */
export const HUB_CARD_DEFS: Omit<HubCardConfig, 'completion'>[] = [
  {
    tab: 'business-canvas',
    label: 'Business Canvas',
    description: 'Lean canvas: value proposition, segments, channels, revenue.',
    icon: LayoutGrid,
    bucket: 'business',
    investorEssential: true,
  },
  {
    tab: 'market-analysis',
    label: 'Market Analysis',
    description: 'TAM / SAM / SOM, competitors, and positioning.',
    icon: BarChart3,
    bucket: 'operations',
    investorEssential: true,
  },
  {
    tab: 'team-profile',
    label: 'Team',
    description: 'Roles, gaps, and hiring roadmap.',
    icon: Users,
    bucket: 'operations',
    investorEssential: true,
  },
  {
    tab: 'rnpv',
    label: 'rNPV Analysis',
    description: 'Risk-adjusted Net Present Value and revenue forecast.',
    icon: Calculator,
    bucket: 'business',
    investorEssential: true,
  },
  {
    tab: 'reimbursement',
    label: 'Reimbursement',
    description: 'Coding, payer mix, and health economics.',
    icon: DollarSign,
    bucket: 'business',
    investorEssential: true,
  },
  {
    tab: 'use-of-proceeds',
    label: 'Use of Proceeds',
    description: 'How investment capital is allocated across categories.',
    icon: Coins,
    bucket: 'business',
    investorEssential: true,
  },
  {
    tab: 'ip-strategy',
    label: 'IP Strategy',
    description: 'Patents, trade secrets, freedom-to-operate.',
    icon: Shield,
    bucket: 'design-risk',
    investorEssential: true,
  },
  {
    tab: 'exit-strategy',
    label: 'Strategic Horizon',
    description: 'M&A, IPO, licensing, or independent growth path.',
    icon: Target,
    bucket: 'business',
    investorEssential: true,
  },
  {
    tab: 'gtm-strategy',
    label: 'Go-to-Market',
    description: 'Channels, territory priority, and sales cycle.',
    icon: Megaphone,
    bucket: 'business',
    investorEssential: true,
  },
  {
    tab: 'pricing-strategy',
    label: 'Pricing',
    description: 'Pricing strategy across target markets.',
    icon: Tag,
    bucket: 'business',
    investorEssential: false,
  },
];
