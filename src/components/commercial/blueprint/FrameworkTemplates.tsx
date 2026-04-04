import { useState } from 'react';
import { FrameworkTemplate } from '@/types/blueprint';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Target, TrendingUp, Shield, BarChart3, Zap } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from '@/hooks/useTranslation';

interface FrameworkTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: FrameworkTemplate) => void;
  hasExistingNotes: boolean;
}

// Template definitions with translation keys
const getFrameworkTemplates = (lang: (key: string) => string): FrameworkTemplate[] => [
  {
    id: 'swot',
    name: lang('commercial.frameworks.templates.swot.name'),
    description: lang('commercial.frameworks.templates.swot.description'),
    category: 'strategic',
    affectedPhases: [2],
    notes: {
      5: `**Strengths (Internal Positive Factors):**
- What advantages does our company have?
- What do we do better than competitors?
- What unique resources or capabilities do we possess?

**Weaknesses (Internal Negative Factors):**
- What could we improve?
- Where do we have fewer resources than competitors?
- What are our limiting factors?

**Opportunities (External Positive Factors):**
- What market trends favor our business?
- What regulatory or technology changes create opportunities?
- What unmet customer needs can we address?

**Threats (External Negative Factors):**
- What obstacles do we face?
- What are competitors doing?
- What regulatory or market changes threaten our business?`,
      6: `**Strategic Response to SWOT:**
- How can we leverage strengths to capitalize on opportunities?
- How can we use strengths to mitigate threats?
- How can we address weaknesses to better pursue opportunities?
- What defensive strategies will protect against threats?`
    }
  },
  {
    id: 'porters-five-forces',
    name: lang('commercial.frameworks.templates.portersFiveForces.name'),
    description: lang('commercial.frameworks.templates.portersFiveForces.description'),
    category: 'competitive',
    affectedPhases: [2],
    notes: {
      6: `**1. Competitive Rivalry (Intensity of Competition):**
- Number and capability of direct competitors
- Rate of industry growth
- Product differentiation levels
- Exit barriers

**2. Threat of New Entrants:**
- Barriers to entry (capital requirements, regulations, patents)
- Economies of scale advantages
- Brand loyalty in the market
- Access to distribution channels

**3. Bargaining Power of Suppliers:**
- Number of suppliers available
- Uniqueness of supplier products/services
- Cost of switching suppliers
- Supplier concentration vs. industry concentration

**4. Bargaining Power of Buyers:**
- Number of customers and order volumes
- Customer price sensitivity
- Cost to customers of switching vendors
- Customer access to information

**5. Threat of Substitutes:**
- Availability of substitute products/services
- Relative price-performance of substitutes
- Switching costs for customers
- Customer propensity to substitute`
    }
  },
  {
    id: 'pestel',
    name: lang('commercial.frameworks.templates.pestel.name'),
    description: lang('commercial.frameworks.templates.pestel.description'),
    category: 'strategic',
    affectedPhases: [2],
    notes: {
      5: `**Political Factors:**
- Government stability and policies
- Healthcare regulations and reforms
- Trade restrictions and tariffs
- Political will for innovation in medtech

**Economic Factors:**
- Economic growth rates in target markets
- Healthcare spending trends
- Reimbursement landscapes
- Currency exchange rates
- Interest rates and access to capital

**Social Factors:**
- Demographic trends (aging population, etc.)
- Patient preferences and expectations
- Healthcare access and literacy
- Cultural attitudes toward medical technology

**Technological Factors:**
- Pace of technological innovation
- Digital health and AI adoption
- Cybersecurity requirements
- Technology infrastructure in target markets

**Environmental Factors:**
- Sustainability requirements and expectations
- Waste management regulations
- Carbon footprint considerations
- Resource scarcity (materials, energy)

**Legal Factors:**
- Medical device regulations (FDA, EU MDR, etc.)
- Intellectual property laws
- Employment and labor laws
- Data privacy regulations (HIPAA, GDPR, etc.)`
    }
  },
  {
    id: 'blue-ocean',
    name: lang('commercial.frameworks.templates.blueOcean.name'),
    description: lang('commercial.frameworks.templates.blueOcean.description'),
    category: 'strategic',
    affectedPhases: [2, 3],
    notes: {
      6: `**Eliminate:**
- Which factors that the industry takes for granted should be eliminated?
- Which features or services add cost but little customer value?
- What industry norms can we challenge?

**Reduce:**
- Which factors should be reduced well below industry standards?
- Where are we over-delivering relative to customer needs?
- What can we simplify without sacrificing core value?

**Raise:**
- Which factors should be raised well above industry standards?
- What aspects truly matter to customers but are underserved?
- Where can we create competitive advantage through excellence?

**Create:**
- Which factors should the industry create that have never been offered?
- What new sources of value can we unlock?
- What unmet or unarticulated customer needs exist?`,
      9: `**Value Innovation Strategy:**
- How does our blue ocean strategy enable differentiated yet cost-effective positioning?
- What is our unique value proposition that makes competition irrelevant?
- How will we protect this new market space from imitators?`
    }
  },
  {
    id: 'balanced-scorecard',
    name: lang('commercial.frameworks.templates.balancedScorecard.name'),
    description: lang('commercial.frameworks.templates.balancedScorecard.description'),
    category: 'performance',
    affectedPhases: [5],
    notes: {
      23: `**1. Financial Perspective:**
Revenue growth, profitability, ROI, cost efficiency

**2. Customer Perspective:**
Customer satisfaction, market share, customer retention, brand value

**3. Internal Business Process Perspective:**
Quality metrics, innovation pipeline, operational efficiency, time-to-market

**4. Learning & Growth Perspective:**
Employee capabilities, information systems, organizational culture, knowledge management`,
      24: `**Financial Metrics:**
- Revenue growth rate (YoY, QoQ)
- EBITDA and EBITDA margin
- Return on invested capital (ROIC)
- Cash flow and burn rate
- Product line profitability`,
      25: `**Market Position & Growth Metrics:**
- Market share in target segments
- Customer acquisition cost (CAC)
- Customer lifetime value (CLV)
- Net promoter score (NPS)
- Market penetration rate`,
      26: `**Innovation & R&D Metrics:**
- % of revenue from products launched in last 3 years
- R&D as % of revenue
- Patent applications and grants
- Time from concept to market
- Pipeline value (weighted by probability of success)`,
      27: `**ESG & Sustainability Metrics:**
- Carbon emissions reduction vs. baseline
- % of sustainable/recycled materials in products
- Diversity & inclusion metrics
- Supplier sustainability scores
- Regulatory compliance rate (zero major findings)`
    }
  },
  {
    id: 'okr',
    name: lang('commercial.frameworks.templates.okr.name'),
    description: lang('commercial.frameworks.templates.okr.description'),
    category: 'performance',
    affectedPhases: [1, 5],
    notes: {
      2: `**Strategic Pillar 1: [Name]**
Objective: [Aspirational goal]
Key Results:
- KR1: [Measurable outcome]
- KR2: [Measurable outcome]
- KR3: [Measurable outcome]

**Strategic Pillar 2: [Name]**
Objective: [Aspirational goal]
Key Results:
- KR1: [Measurable outcome]
- KR2: [Measurable outcome]
- KR3: [Measurable outcome]

**Strategic Pillar 3: [Name]**
Objective: [Aspirational goal]
Key Results:
- KR1: [Measurable outcome]
- KR2: [Measurable outcome]
- KR3: [Measurable outcome]

Note: Objectives should be ambitious and qualitative. Key Results should be specific, measurable, achievable, relevant, and time-bound (SMART).`,
      23: `**Company-Level OKRs for Strategic Execution:**

Each strategic pillar should translate into company-level OKRs that cascade throughout the organization.

**Example:**
Objective: Become the market leader in [specific segment]
Key Results:
- Achieve 25% market share by end of FY2026
- Launch 3 new products with >$10M revenue potential each
- Reach NPS of 70+ among target customers`
    }
  }
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'competitive': return <Target className="h-5 w-5" />;
    case 'strategic': return <Lightbulb className="h-5 w-5" />;
    case 'operational': return <Zap className="h-5 w-5" />;
    case 'performance': return <BarChart3 className="h-5 w-5" />;
    default: return <Shield className="h-5 w-5" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'competitive': return 'text-blue-600 bg-blue-50 dark:bg-blue-950';
    case 'strategic': return 'text-purple-600 bg-purple-50 dark:bg-purple-950';
    case 'operational': return 'text-orange-600 bg-orange-50 dark:bg-orange-950';
    case 'performance': return 'text-green-600 bg-green-50 dark:bg-green-950';
    default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950';
  }
};

export function FrameworkTemplates({
  isOpen,
  onClose,
  onApplyTemplate,
  hasExistingNotes
}: FrameworkTemplatesProps) {
  const { lang } = useTranslation();
  const frameworkTemplates = getFrameworkTemplates(lang);
  const [selectedTemplate, setSelectedTemplate] = useState<FrameworkTemplate | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleApplyClick = (template: FrameworkTemplate) => {
    setSelectedTemplate(template);
    if (hasExistingNotes) {
      setShowConfirmDialog(true);
    } else {
      applyTemplate(template);
    }
  };

  const applyTemplate = (template: FrameworkTemplate) => {
    onApplyTemplate(template);
    setShowConfirmDialog(false);
    setSelectedTemplate(null);
    onClose();
    toast.success(lang('commercial.frameworks.templateApplied').replace('{{name}}', template.name));
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              {lang('commercial.frameworks.dialogTitle')}
            </DialogTitle>
            <DialogDescription>
              {lang('commercial.frameworks.dialogDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {frameworkTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`p-2 rounded-lg ${getCategoryColor(template.category)}`}>
                      {getCategoryIcon(template.category)}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {Object.keys(template.notes).length} {lang('commercial.frameworks.activities')}
                    </Badge>
                  </div>
                  <CardTitle className="text-base mt-2">{template.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {template.affectedPhases.map((phaseId) => (
                      <Badge key={phaseId} variant="secondary" className="text-xs">
                        {lang('commercial.frameworks.phase')} {phaseId}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    onClick={() => handleApplyClick(template)}
                    className="w-full"
                    size="sm"
                  >
                    {lang('commercial.frameworks.applyFramework')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lang('commercial.frameworks.applyFrameworkTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {lang('commercial.frameworks.applyFrameworkDescription').replace('{{count}}', String(selectedTemplate ? Object.keys(selectedTemplate.notes).length : 0))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{lang('commercial.frameworks.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedTemplate && applyTemplate(selectedTemplate)}>
              {lang('commercial.frameworks.applyTemplate')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
