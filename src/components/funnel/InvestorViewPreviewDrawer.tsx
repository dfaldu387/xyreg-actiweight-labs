import { useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Eye, ChevronLeft, ExternalLink, Gauge, Cpu, Monitor, HardDrive, FileText, Sparkles, TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MediaGallery } from '@/components/investor-view/MediaGallery';
import { ViabilityScoreBreakdown, ScoreBreakdownItem } from '@/components/investor-view/ViabilityScoreBreakdown';
import { SemiCircleGauge } from '@/components/ui/semi-circle-gauge';
import { RiskRadarChart } from '@/components/product/business-case/viability/RiskRadarChart';
import { InvestorBusinessCanvas } from '@/components/investor-view/InvestorBusinessCanvas';
import { TechnicalProfile } from '@/components/investor-view/TechnicalProfile';
import { ExecutionTimeline } from '@/components/investor-view/ExecutionTimeline';
import { InvestorVentureBlueprint } from '@/components/investor-view/InvestorVentureBlueprint';
import { InvestorTeamProfile } from '@/components/investor-view/InvestorTeamProfile';
import { InvestorMarketSizing } from '@/components/investor-view/InvestorMarketSizing';
import { InvestorStakeholderProfiles } from '@/components/investor-view/InvestorStakeholderProfiles';
import { InvestorTargetMarkets } from '@/components/investor-view/InvestorTargetMarkets';
import { InvestorCompetitorAnalysis } from '@/components/investor-view/InvestorCompetitorAnalysis';
import { InvestorReimbursementStrategy } from '@/components/investor-view/InvestorReimbursementStrategy';
import { InvestorTeamGaps } from '@/components/investor-view/InvestorTeamGaps';
import { InvestorRegulatoryTimeline } from '@/components/investor-view/InvestorRegulatoryTimeline';
import { InvestorClinicalEvidence } from '@/components/investor-view/InvestorClinicalEvidence';
import { InvestorReadinessGates } from '@/components/investor-view/InvestorReadinessGates';
import { InvestorUseOfProceeds } from '@/components/investor-view/InvestorUseOfProceeds';
import { InvestorManufacturing } from '@/components/investor-view/InvestorManufacturing';
import { InvestorExitStrategy } from '@/components/investor-view/InvestorExitStrategy';
import { InvestorRiskSummary } from '@/components/investor-view/InvestorRiskSummary';
import { InvestorPartHeader } from '@/components/investor-view/InvestorPartHeader';
import { InvestorIPStrategy } from '@/components/investor-view/InvestorIPStrategy';
import { InvestorHEOR } from '@/components/investor-view/InvestorHEOR';
import { InvestorGTMStrategy } from '@/components/investor-view/InvestorGTMStrategy';
import { InvestorRevenueSnapshot } from '@/components/investor-view/InvestorRevenueSnapshot';
import { InvestorStrategicPartners } from '@/components/investor-view/InvestorStrategicPartners';
import { EssentialLifecycleCashFlowChart } from '@/components/product/business-case/EssentialLifecycleCashFlowChart';
import { useInvestorPreviewData } from '@/hooks/useInvestorPreviewData';
import { useQueryClient } from '@tanstack/react-query';
import { Users, Building2, Calendar,  } from 'lucide-react';

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

// Helper wrapper for the viability gauge
function ViabilityScoreBreakdownWrapper({
  viabilityScore,
  regulatoryScore,
  clinicalScore,
  reimbursementScore,
  technicalScore,
  scoreBreakdown,
}: {
  viabilityScore: number;
  regulatoryScore: number;
  clinicalScore: number;
  reimbursementScore: number;
  technicalScore: number;
  scoreBreakdown?: ScoreBreakdown;
}) {
  const breakdown = scoreBreakdown || {
    regulatory: { score: regulatoryScore, maxScore: 30, source: 'Device Definition' },
    clinical: { score: clinicalScore, maxScore: 30, source: 'Clinical Evidence Plan' },
    reimbursement: { score: reimbursementScore, maxScore: 20, source: 'Reimbursement Strategy' },
    technical: { score: technicalScore, maxScore: 20, source: 'Risk Analysis' },
    missingInputs: [],
  };

  return (
    <>
      <ViabilityScoreBreakdown
        totalScore={viabilityScore}
        regulatory={breakdown.regulatory}
        clinical={breakdown.clinical}
        reimbursement={breakdown.reimbursement}
        technical={breakdown.technical}
        missingInputs={breakdown.missingInputs}
      >
        <button 
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors group"
          aria-label="View score breakdown"
        >
          <Info className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
      </ViabilityScoreBreakdown>
      <SemiCircleGauge score={viabilityScore} variant="investor" />
    </>
  );
}

interface InvestorViewPreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InvestorViewPreviewDrawer({ isOpen, onClose }: InvestorViewPreviewDrawerProps) {
  const { productId } = useParams<{ productId: string }>();
  const drawerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useInvestorPreviewData(productId || '');

  // Refetch data every time the drawer opens to show latest Genesis changes
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !prevOpenRef.current && productId) {
      // Invalidate and refetch to get fresh data
      queryClient.invalidateQueries({ queryKey: ['investor-preview-data', productId] }).then(() => {
        refetch();
      });
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, productId, queryClient, refetch]);

  // Don't render if no product
  if (!productId) return null;

  return (
    <div
      ref={drawerRef}
      className={cn(
        "fixed right-0 top-0 h-full w-full sm:w-[calc(100vw-64px)] md:w-[calc(100vw-80px)] lg:w-[calc(100vw-100px)] xl:w-[1200px] 2xl:w-[1440px] bg-slate-50 dark:bg-slate-950 border-l shadow-2xl z-50 transition-transform duration-300 ease-out overflow-hidden",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-3 border-b bg-indigo-600 text-white">
        <Eye className="w-5 h-5" />
        <span className="font-semibold">Investor View Preview</span>
        <Badge variant="secondary" className="bg-white/20 text-white text-xs ml-2">
          Live Preview
        </Badge>
        <button 
          onClick={onClose}
          className="ml-auto p-1 hover:bg-white/20 rounded transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Content - Same structure as InvestorViewPage */}
      <ScrollArea className="h-[calc(100%-52px)]">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <div className="h-32 bg-muted animate-pulse rounded-lg" />
            <div className="h-48 bg-muted animate-pulse rounded-lg" />
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
          </div>
        ) : data ? (
          <div className="container py-8 space-y-12">
            {/* Company/Product Header */}
            <div className="flex items-center gap-4">
              {data.companyLogo && (
                <img
                  src={data.companyLogo}
                  alt={data.companyName}
                  className="h-12 w-12 rounded-lg object-contain border"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-foreground">{data.productName}</h1>
                <p className="text-muted-foreground">{data.companyName}</p>
              </div>
              {data.isVerified && (
                <Badge variant="outline" className="ml-auto text-emerald-600 border-emerald-600">
                  ✓ Verified
                </Badge>
              )}
            </div>

            {/* Executive Summary: 3 cards in a row */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Viability Scorecard - Compact */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 relative">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Viability Scorecard
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Overall product readiness assessment
                </p>
                <div className="mt-[100px] transform scale-[0.6] origin-top -mb-24">
                  <ViabilityScoreBreakdownWrapper
                    viabilityScore={data.viabilityScore}
                    regulatoryScore={data.regulatoryScore}
                    clinicalScore={data.clinicalScore}
                    reimbursementScore={data.reimbursementScore}
                    technicalScore={data.technicalScore}
                    scoreBreakdown={data.scoreBreakdown}
                  />
                </div>
              </div>

              {/* Product Lifecycle Cash Flow */}
              {productId && data.npvData && (
                <EssentialLifecycleCashFlowChart
                  productId={productId}
                  launchDate={data.launchDate}
                  marketInputData={data.npvData.marketInputData}
                  selectedMarketCode={data.selectedMarketCode}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              )}

              {/* Risk Profile Analysis */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Risk Profile Analysis
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Compare device risk profile against industry benchmarks
                </p>
                <RiskRadarChart
                  regulatoryScore={data.regulatoryScore}
                  clinicalScore={data.clinicalScore}
                  reimbursementScore={data.reimbursementScore}
                  technicalScore={data.technicalScore}
                />
              </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                PART I: PRODUCT & TECHNOLOGY FOUNDATION
                The "What" and the "How."
            ═══════════════════════════════════════════════════════════════ */}
            <InvestorPartHeader
              partNumber="I"
              title="Product & Technology Foundation"
              subtitle="The 'What' and the 'How.'"
            />

            {/* Hero Section: Media Gallery + Description (full width) */}
            <section>
              <div>
                {data.mediaItems.length > 0 ? (
                  <MediaGallery mediaItems={data.mediaItems} />
                ) : (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                    <p className="text-muted-foreground text-sm">No media uploaded yet</p>
                  </div>
                )}

                {/* Device Description + Intended Use + Key Features */}
                {(data.description || data.intendedPurpose || data.actualValueProposition || data.keyFeatures.length > 0) && (
                  <div className="mt-6 bg-card rounded-lg border p-6 space-y-4">
                    {data.description && (
                      <>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Device Description
                        </h3>
                        <p className="text-foreground leading-relaxed">{data.description}</p>
                      </>
                    )}
                    {data.intendedPurpose && (
                      <>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 pt-2 border-t">
                          <FileText className="h-4 w-4" />
                          Intended Use
                        </h3>
                        <p className="text-foreground leading-relaxed">{data.intendedPurpose}</p>
                      </>
                    )}
                    {data.actualValueProposition && (
                      <>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 pt-2 border-t">
                          <Sparkles className="h-4 w-4" />
                          Value Proposition
                        </h3>
                        <p className="text-foreground leading-relaxed">{data.actualValueProposition}</p>
                      </>
                    )}
                    {data.keyFeatures.length > 0 && (
                      <>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 pt-2 border-t">
                          <Sparkles className="h-4 w-4" />
                          Key Features
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {data.keyFeatures.map((feature, i) => (
                            <Badge key={i} variant="secondary" className="text-sm py-1 px-3">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </>
                    )}
                    {data.targetPopulation && data.targetPopulation.length > 0 && (
                      <>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 pt-2 border-t">
                          <Users className="h-4 w-4" />
                          Target Population
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {data.targetPopulation.map((pop: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-sm py-1 px-3">
                              {pop}
                            </Badge>
                          ))}
                        </div>
                      </>
                    )}
                    {data.useEnvironment && data.useEnvironment.length > 0 && (
                      <>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 pt-2 border-t">
                          <Building2 className="h-4 w-4" />
                          Use Environment
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {data.useEnvironment.map((env: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-sm py-1 px-3">
                              {env}
                            </Badge>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* TRL & System Architecture */}
            {(data.trlLevel || data.systemArchitecture) && (
              <section className="space-y-6">
                <h2 className="text-2xl font-semibold text-foreground">
                  Technology Readiness
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* TRL Card */}
                  {data.trlLevel && (
                    <Card className="p-6 hover:shadow-md transition-all">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Gauge className="h-6 w-6 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-muted-foreground mb-1">
                            Technology Readiness Level
                          </div>
                          <div className="text-lg font-semibold text-foreground">
                            {data.trlLabel}
                          </div>
                          {data.trlDescription && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {data.trlDescription}
                            </p>
                          )}
                          {data.trlNotes && (
                            <p className="text-sm text-muted-foreground mt-2 italic border-t pt-2">
                              {data.trlNotes}
                            </p>
                          )}
                          {/* TRL Progress */}
                          <div className="mt-3 flex gap-1">
                            {[3, 4, 5, 6, 7, 8].map(level => (
                              <div
                                key={level}
                                className={cn(
                                  "h-2 flex-1 rounded-full transition-colors",
                                  level <= data.trlLevel!
                                    ? "bg-primary"
                                    : "bg-muted"
                                )}
                              />
                            ))}
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-muted-foreground">TRL 3</span>
                            <span className="text-[10px] text-muted-foreground">TRL 8</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* System Architecture Card */}
                  {data.systemArchitecture && (
                    <Card className="p-6 hover:shadow-md transition-all">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                          {data.systemArchitecture === 'samd' ? (
                            <Monitor className="h-6 w-6 text-accent-foreground" />
                          ) : data.systemArchitecture === 'simd' ? (
                            <Cpu className="h-6 w-6 text-accent-foreground" />
                          ) : (
                            <HardDrive className="h-6 w-6 text-accent-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-muted-foreground mb-1">
                            System Architecture
                          </div>
                          <div className="text-lg font-semibold text-foreground">
                            {data.systemArchitecture === 'samd'
                              ? 'Software as a Medical Device (SaMD)'
                              : data.systemArchitecture === 'simd'
                              ? 'Software in a Medical Device (SiMD)'
                              : 'No Software Used'}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {data.systemArchitecture === 'samd'
                              ? 'Standalone software intended for medical purposes'
                              : data.systemArchitecture === 'simd'
                              ? 'Software embedded within a hardware medical device'
                              : 'Pure hardware device without software components'}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </section>
            )}

            {/* Technical Profile (Classification) */}
            <TechnicalProfile
              primaryRegulatoryType={data.primaryRegulatoryType}
              coreDeviceNature={data.coreDeviceNature}
              isActiveDevice={data.isActiveDevice}
              targetMarket={data.targetMarket}
              classification={data.classification}
            />

            {/* ═══════════════════════════════════════════════════════════════
                PART II: MARKET & STAKEHOLDER ANALYSIS
                The "Who" and the "Why."
            ═══════════════════════════════════════════════════════════════ */}
            <InvestorPartHeader
              partNumber="II"
              title="Market & Stakeholder Analysis"
              subtitle="The 'Who' and the 'Why.'"
            />

            {/* Stakeholder Profiles (Steps 8-9) */}
            <InvestorStakeholderProfiles data={data.stakeholderProfilesData} />

            {/* Target Markets (Step 10) */}
            {data.marketsData && data.marketsData.length > 0 && (
              <InvestorTargetMarkets 
                markets={data.marketsData} 
                territoryPriority={data.territoryPriority} 
              />
            )}

            {/* Market Sizing (Step 11) */}
            {data.marketSizingData && (
              <InvestorMarketSizing data={data.marketSizingData} />
            )}

            {/* Competitor Analysis (Step 12) */}
            {data.competitorsData && data.competitorsData.length > 0 && (
              <InvestorCompetitorAnalysis competitors={data.competitorsData} />
            )}

            {/* ═══════════════════════════════════════════════════════════════
                PART III: STRATEGY & EVIDENCE
                The "Barriers" and the "Validation."
            ═══════════════════════════════════════════════════════════════ */}
            <InvestorPartHeader
              partNumber="III"
              title="Strategy & Evidence"
              subtitle="The 'Barriers' and the 'Validation.'"
            />

            {/* IP Strategy (Step 13) */}
            {data.ipStrategyData && (
              <InvestorIPStrategy data={data.ipStrategyData} />
            )}

            {/* GTM Strategy */}
            {data.gtmData && (
              <InvestorGTMStrategy data={data.gtmData} />
            )}

            {/* Risk Assessment */}
            {data.riskSummaryData && (
              <InvestorRiskSummary data={data.riskSummaryData} />
            )}

            {/* IP Strategy */}
            {data.ipStrategyData && (
              <InvestorIPStrategy data={data.ipStrategyData} />
            )}

            {/* Regulatory Timeline */}
            {data.regulatoryTimelineData && (
              <InvestorRegulatoryTimeline data={data.regulatoryTimelineData} />
            )}

            {/* Clinical Evidence */}
            {data.clinicalEvidenceData && (
              <InvestorClinicalEvidence data={data.clinicalEvidenceData} deviceClass={data.classification} />
            )}

            {/* Health Economics (Step 15) */}
            {data.heorData && (
              <InvestorHEOR data={data.heorData} />
            )}

            {/* Reimbursement Strategy */}
            {data.reimbursementStrategyData && (
              <InvestorReimbursementStrategy data={data.reimbursementStrategyData} />
            )}


            {/* ═══════════════════════════════════════════════════════════════
                PART V: OPERATIONAL EXECUTION & LOGISTICS
                The "Action Plan."
            ═══════════════════════════════════════════════════════════════ */}
            <InvestorPartHeader
              partNumber="V"
              title="Operational Execution & Logistics"
              subtitle="The 'Action Plan.'"
            />

            {/* Team Profile */}
            {data.teamMembers && data.teamMembers.length > 0 && (
              <InvestorTeamProfile teamMembers={data.teamMembers} />
            )}

            {/* Strategic Partners (Step 20) */}
            {data.strategicPartnersData && (
              <InvestorStrategicPartners data={data.strategicPartnersData} />
            )}

            {/* Manufacturing */}
            {data.manufacturingData && (
              <InvestorManufacturing data={data.manufacturingData} />
            )}

            {/* Execution Timeline */}
            <ExecutionTimeline currentPhase={data.currentPhase} phaseDates={data.phaseDates} />

            {/* Executive Risk Summary */}
            {data.riskSummaryData && (
              <InvestorRiskSummary data={data.riskSummaryData} />
            )}

            {/* Readiness Gates */}
            {data.readinessGatesData && (
              <InvestorReadinessGates data={data.readinessGatesData} />
            )}

            {/* Use of Proceeds */}
            {data.useOfProceedsData && (
              <InvestorUseOfProceeds data={data.useOfProceedsData} />
            )}

            {/* Business Model Canvas (Step 24) */}
            <InvestorBusinessCanvas
              keyPartners={data.keyPartners}
              keyActivities={data.keyActivities}
              keyResources={data.keyResources}
              valuePropositions={data.valuePropositions}
              customerRelationships={data.customerRelationships}
              channels={data.channels}
              customerSegments={data.customerSegments}
              costStructure={data.costStructure}
              revenueStreams={data.revenueStreams}
              showEmptyBlocks={true}
            />

            {/* Strategic Blueprint (Venture Blueprint) */}
            {data.ventureBlueprintSteps && data.ventureBlueprintSteps.length > 0 && (
              <InvestorVentureBlueprint steps={data.ventureBlueprintSteps} />
            )}


            {/* Exit Strategy */}
            {data.exitStrategyData && (
              <InvestorExitStrategy data={data.exitStrategyData} />
            )}

            {/* Footer CTA */}
            <div className="text-center py-8 border-t">
              <Button
                size="lg"
                onClick={() => {
                  if (data.publicSlug) {
                    window.open(`/investor/${data.publicSlug}`, '_blank');
                  }
                }}
                disabled={!data.publicSlug}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open Full Investor View
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No data available</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
