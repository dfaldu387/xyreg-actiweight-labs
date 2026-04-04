import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SemiCircleGauge } from '@/components/ui/semi-circle-gauge';
import { RiskRadarChart } from './RiskRadarChart';
import { ViabilityAnswers } from './ViabilityWizard';
import { ArrowRight, FileText, Target, Users, Link2 } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

interface ViabilityResultsProps {
  score: number;
  answers: ViabilityAnswers;
  onReset: () => void;
  disabled?: boolean;
}

export function ViabilityResults({ score, answers, onReset, disabled = false }: ViabilityResultsProps) {
  const navigate = useNavigate();
  const { id: productId } = useParams();
  const [searchParams] = useSearchParams();
  const isInInvestorFlow = searchParams.get('returnTo') === 'investor-share';

  // Calculate individual category scores
  const calculateCategoryScores = () => {
    let regulatory = 0;
    const deviceClass = answers.deviceClass.toLowerCase();
    
    // Map various class formats to risk scores
    if (deviceClass.includes('i') && !deviceClass.includes('ii') && !deviceClass.includes('iii')) {
      regulatory += 75; // Class I (lowest regulatory burden)
    } else if (deviceClass.includes('iia') || deviceClass.includes('ii-510k') || deviceClass === 'ivdr-class-b') {
      regulatory += 50; // Class IIa, II 510k, or IVDR Class B
    } else if (deviceClass.includes('iib') || deviceClass === 'ivdr-class-c') {
      regulatory += 35; // Class IIb or IVDR Class C
    } else if (deviceClass.includes('iii') || deviceClass.includes('pma') || deviceClass === 'ivdr-class-d') {
      regulatory += 25; // Class III, PMA, or IVDR Class D (highest burden)
    } else if (deviceClass === 'ivdr-class-a') {
      regulatory += 75; // IVDR Class A (lowest risk)
    }
    
    // Predicate device bonus (only for US FDA)
    if (answers.regulatoryFramework === 'us-fda' && answers.hasPredicate === 'yes') {
      regulatory = Math.min(100, regulatory + 25);
    }

    let clinical = 0;
    // Score based on BEST (least burdensome) strategy selected
    if (answers.clinicalStrategy.includes('literature')) clinical += 100;
    else if (answers.clinicalStrategy.includes('post-market')) clinical += 65;
    else if (answers.clinicalStrategy.includes('pre-market')) clinical += 30;

    let reimbursement = 0;
    if (answers.reimbursementCode === 'exact') reimbursement = 100;
    else if (answers.reimbursementCode === 'partial') reimbursement = 60;
    else if (answers.reimbursementCode === 'new') reimbursement = 25;

    let technical = 0;
    if (answers.technologyType === 'standard-hw') technical = 100;
    else if (answers.technologyType === 'samd') technical = 75;
    else if (answers.technologyType === 'novel') technical = 50;
    else if (answers.technologyType === 'combo') technical = 25;

    return { regulatory, clinical, reimbursement, technical };
  };

  const categoryScores = calculateCategoryScores();

  const getNextSteps = () => {
    const steps = [];
    
    if (score >= 71) {
      steps.push({
        title: 'Start Venture Blueprint',
        description: 'Define your go-to-market strategy and business model',
        icon: <FileText className="w-5 h-5" />,
        action: () => navigate(`/app/product/${productId}/business-case?tab=venture-blueprint`)
      });
      steps.push({
        title: 'Define Intended Purpose',
        description: 'Document the clinical indication and intended use',
        icon: <Target className="w-5 h-5" />,
        action: () => navigate(`/app/product/${productId}/device-definition/intended-purpose`)
      });
      steps.push({
        title: 'Draft User Needs',
        description: 'Capture stakeholder requirements and user expectations',
        icon: <Users className="w-5 h-5" />,
        action: () => navigate(`/app/product/${productId}/design-risk-controls`)
      });
    } else if (score >= 41) {
      steps.push({
        title: 'Schedule Regulatory Pre-Sub Meeting',
        description: 'Engage with regulators early to clarify pathway',
        icon: <FileText className="w-5 h-5" />
      });
      steps.push({
        title: 'Refine Clinical Strategy',
        description: 'Optimize your clinical evidence plan',
        icon: <Target className="w-5 h-5" />
      });
      steps.push({
        title: 'Explore Reimbursement Options',
        description: 'Research coding and payment pathways',
        icon: <Users className="w-5 h-5" />
      });
    } else {
      steps.push({
        title: 'Re-evaluate Device Classification',
        description: 'Consider design changes to lower regulatory risk',
        icon: <FileText className="w-5 h-5" />
      });
      steps.push({
        title: 'Explore Alternative Clinical Strategies',
        description: 'Assess literature-based or equivalence approaches',
        icon: <Target className="w-5 h-5" />
      });
      steps.push({
        title: 'Consult with Regulatory Expert',
        description: 'Get professional guidance on pathway options',
        icon: <Users className="w-5 h-5" />
      });
    }

    return steps;
  };

  const nextSteps = getNextSteps();

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Go/No-Go Gauge Card */}
      <Card>
        <CardHeader>
          <CardTitle>Viability Assessment</CardTitle>
          <CardDescription>
            Based on your inputs, here's the overall feasibility score for your device concept
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <SemiCircleGauge score={score} variant="investor" />
        </CardContent>
      </Card>

      {/* Risk Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Profile Analysis</CardTitle>
          <CardDescription>
            Compare your device's risk profile against industry benchmarks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RiskRadarChart
            regulatoryScore={categoryScores.regulatory}
            clinicalScore={categoryScores.clinical}
            reimbursementScore={categoryScores.reimbursement}
            technicalScore={categoryScores.technical}
          />
        </CardContent>
      </Card>

      {/* Next Steps - hidden in investor share flow since checklist is visible */}
      {!isInInvestorFlow && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Next Steps</CardTitle>
            <CardDescription>
              Based on your viability score, here's what you should focus on next
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {nextSteps.map((step, index) => (
              <div
                key={index}
                className={`flex items-start space-x-4 p-4 rounded-lg bg-secondary/50 transition-colors ${
                  disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-secondary cursor-pointer'
                }`}
                onClick={disabled ? undefined : step.action}
              >
                <div className="mt-1 text-primary">
                  {step.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                {step.action && <ArrowRight className="w-5 h-5 text-muted-foreground mt-1" />}
              </div>
            ))}

            <div className="flex items-center justify-center pt-4 border-t">
              <Link2 className="w-4 h-4 text-muted-foreground mr-2" />
              <p className="text-sm text-muted-foreground">
                Your scorecard data syncs automatically to <span className="font-semibold text-foreground">Venture Blueprint</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onReset} disabled={disabled}>
          Start New Assessment
        </Button>
        <Button onClick={() => alert('Export functionality coming soon!')} disabled={disabled}>
          Export Report
        </Button>
      </div>
    </div>
  );
}
