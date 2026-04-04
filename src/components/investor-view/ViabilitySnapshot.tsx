import { SemiCircleGauge } from "@/components/ui/semi-circle-gauge";
import { Badge } from "@/components/ui/badge";
import { RiskRadarChart } from "@/components/product/business-case/viability/RiskRadarChart";
import { ViabilityScoreBreakdown, ScoreBreakdownItem } from "./ViabilityScoreBreakdown";
import { EssentialLifecycleCashFlowChart } from "@/components/product/business-case/EssentialLifecycleCashFlowChart";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CategoryScore {
  score: number;
  maxScore: number;
  source: string;
  breakdown?: ScoreBreakdownItem[];
}

interface ScoreBreakdown {
  regulatory: CategoryScore;
  clinical: CategoryScore;
  reimbursement: CategoryScore;
  technical: CategoryScore;
  missingInputs: string[];
}

interface ViabilitySnapshotProps {
  viabilityScore: number;
  regulatoryScore: number;
  clinicalScore: number;
  reimbursementScore: number;
  technicalScore: number;
  intendedPurpose: string;
  deviceBadges: string[];
  scoreBreakdown?: ScoreBreakdown;
  productId?: string;
  launchDate?: string | Date | null;
  npvData?: {
    npv: number;
    marketInputData?: Record<string, any>;
  } | null;
  selectedMarketCode?: string;
}

export function ViabilitySnapshot({ 
  viabilityScore, 
  regulatoryScore,
  clinicalScore,
  reimbursementScore,
  technicalScore,
  intendedPurpose,
  deviceBadges,
  scoreBreakdown,
  productId,
  launchDate,
  npvData,
  selectedMarketCode
}: ViabilitySnapshotProps) {
  // Default breakdown if not provided
  const breakdown = scoreBreakdown || {
    regulatory: { score: regulatoryScore, maxScore: 30, source: 'Device Definition' },
    clinical: { score: clinicalScore, maxScore: 30, source: 'Clinical Evidence Plan' },
    reimbursement: { score: reimbursementScore, maxScore: 20, source: 'Reimbursement Strategy' },
    technical: { score: technicalScore, maxScore: 20, source: 'Risk Analysis' },
    missingInputs: [],
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Viability Score Gauge */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 relative">
        <ViabilityScoreBreakdown
          totalScore={viabilityScore}
          regulatory={breakdown.regulatory}
          clinical={breakdown.clinical}
          reimbursement={breakdown.reimbursement}
          technical={breakdown.technical}
          missingInputs={breakdown.missingInputs}
        >
          <button 
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
            aria-label="View score breakdown"
          >
            <Info className="w-5 h-5 text-muted-foreground group-hover:text-indigo-600 transition-colors" />
          </button>
        </ViabilityScoreBreakdown>
        <SemiCircleGauge score={viabilityScore} variant="investor" />
      </div>

      {/* Product Lifecycle Cash Flow Chart - Essential */}
      {productId && npvData && (
        <EssentialLifecycleCashFlowChart
          productId={productId}
          launchDate={launchDate}
          marketInputData={npvData.marketInputData}
          selectedMarketCode={selectedMarketCode}
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
        />
      )}

      {/* Risk Profile Radar Chart - Full width */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Risk Profile Analysis
          </h3>
          
          {/* Info Icon with Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <button 
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                aria-label="View risk profile explanation"
              >
                <Info className="w-5 h-5 text-muted-foreground group-hover:text-indigo-600 transition-colors" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-indigo-600" />
                  Risk Profile Analysis Explained
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Compare your device's risk profile against industry benchmarks across four key dimensions.
                </p>
                
                <div className="space-y-3">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2">Your Score</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Calculated from your Genesis checklist inputs:
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="font-medium text-blue-600 min-w-24">Regulatory:</span>
                        <span className="text-muted-foreground">Device classification & target markets (Steps 7 & 10)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-medium text-purple-600 min-w-24">Clinical:</span>
                        <span className="text-muted-foreground">Evidence strategy & literature (Step 14)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-medium text-emerald-600 min-w-24">Reimbursement:</span>
                        <span className="text-muted-foreground">Market access codes & payer mix (Step 16)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-medium text-orange-600 min-w-24">Technical:</span>
                        <span className="text-muted-foreground">TRL level, system architecture & team profile (Steps 6 & 22)</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2">Industry Benchmark</h4>
                    <p className="text-sm text-muted-foreground">
                      Illustrative medtech industry averages representing typical readiness thresholds 
                      for investment consideration. These are static reference values used for visual 
                      comparison, not real-time market data.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Regulatory:</span>
                        <span className="font-medium">65%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Clinical:</span>
                        <span className="font-medium">60%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reimbursement:</span>
                        <span className="font-medium">55%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Technical:</span>
                        <span className="font-medium">70%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Compare device risk profile against industry benchmarks
        </p>
        
        <RiskRadarChart
          regulatoryScore={regulatoryScore}
          clinicalScore={clinicalScore}
          reimbursementScore={reimbursementScore}
          technicalScore={technicalScore}
        />
      </div>

      {/* Device Badges - filter out device type since it's shown in TechnicalProfile */}
      {deviceBadges.filter(badge => 
        !['Non-invasive', 'Invasive', 'Active', 'Non-active', 'Implantable'].includes(badge)
      ).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {deviceBadges
            .filter(badge => !['Non-invasive', 'Invasive', 'Active', 'Non-active', 'Implantable'].includes(badge))
            .map((badge, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="px-3 py-1.5 text-sm"
              >
                {badge}
              </Badge>
            ))}
        </div>
      )}
    </div>
  );
}
