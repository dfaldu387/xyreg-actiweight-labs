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
import { Microscope, Shield, Scale, ClipboardCheck, FileCheck, Stethoscope } from 'lucide-react';
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

interface ProductFrameworkTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: FrameworkTemplate) => void;
  hasExistingNotes: boolean;
  disabled?: boolean;
}

const PRODUCT_FRAMEWORK_TEMPLATES: FrameworkTemplate[] = [
  {
    id: 'design-control',
    name: 'Design Control Framework',
    description: 'FDA/ISO 13485 design control structure for medical device development',
    category: 'operational',
    affectedPhases: [3],
    notes: {
      9: `**User Needs:**
- What clinical problem does this device solve?
- Who are the primary users (clinicians, patients, technicians)?
- What are the critical use cases and scenarios?
- What are the user experience expectations?

**Design Requirements Traceability:**
- Link each user need to specific design requirements
- Establish acceptance criteria for each requirement
- Document requirement sources (regulatory, clinical, user feedback)
- Create requirements traceability matrix`,
      11: `**Design Output Specifications:**
- Engineering drawings and schematics
- Bill of Materials (BOM)
- Software architecture documents
- Manufacturing process specifications
- Packaging and labeling specifications

**Design Verification Plan:**
- Test protocols for each design requirement
- Acceptance criteria based on design inputs
- Test equipment and methods
- Pass/fail criteria`,
    }
  },
  {
    id: 'risk-management',
    name: 'ISO 14971 Risk Management',
    description: 'Comprehensive risk analysis and control framework for medical devices',
    category: 'operational',
    affectedPhases: [3, 4],
    notes: {
      12: `**Risk Analysis (FMEA):**
- Identify all potential hazards and hazardous situations
- Analyze failure modes for each component/subsystem
- Assign severity (1-5) based on patient harm potential
- Assign probability (1-5) based on likelihood of occurrence
- Calculate risk priority number (RPN = Severity × Probability)

**Risk Evaluation:**
- Define acceptable risk thresholds
- Classify risks as acceptable or unacceptable
- Document risk acceptability decisions

**Risk Control Measures:**
- Inherent safety by design (preferred)
- Protective measures in the device
- Information for safety (IFU warnings, training)
- Verify effectiveness of risk controls

**Residual Risk Assessment:**
- Re-evaluate risks after implementing controls
- Document residual risk acceptability
- Create risk management report`,
      13: `**Risk Verification Testing:**
- Test each risk control measure
- Document effectiveness of controls
- Update risk management file with test results
- Ensure residual risks are acceptable`,
    }
  },
  {
    id: 'regulatory-pathway',
    name: 'Regulatory Pathway Analysis',
    description: 'Strategic framework for determining optimal regulatory submission path',
    category: 'strategic',
    affectedPhases: [2],
    notes: {
      6: `**Device Classification:**
- Determine FDA device class (I, II, III)
- Determine EU MDR device class (I, IIa, IIb, III)
- Consider combination product classification
- Review predicate device landscape

**FDA 510(k) Pathway:**
- Identify potential predicate devices
- Document substantial equivalence claims
- List applicable consensus standards
- Plan special controls compliance

**EU MDR/CE Mark Pathway:**
- Determine conformity assessment route
- Identify applicable harmonized standards
- Plan clinical evidence strategy
- Select Notified Body if required

**Other Markets:**
- Consider PMDA (Japan), NMPA (China), TGA (Australia)
- Identify mutual recognition opportunities
- Plan timing and resource allocation`,
    }
  },
  {
    id: 'clinical-evaluation',
    name: 'Clinical Evaluation Framework',
    description: 'Structure for clinical evidence generation and usability validation',
    category: 'strategic',
    affectedPhases: [4],
    notes: {
      14: `**Clinical Evaluation Plan:**
- Define clinical safety and performance endpoints
- Literature review strategy
- Equivalence analysis with predicate devices
- Post-market clinical follow-up (PMCF) plan

**Usability Engineering (IEC 62366):**
- Use error analysis (task analysis)
- Critical use scenarios identification
- Formative usability testing protocols
- Summative validation testing with representative users
- Human factors validation acceptance criteria

**Clinical Testing:**
- Study design (if required)
- Study endpoints and success criteria
- Patient enrollment criteria
- Data analysis plan`,
    }
  },
  {
    id: 'post-market-surveillance',
    name: 'Post-Market Surveillance Framework',
    description: 'Comprehensive PMS system for ongoing safety monitoring',
    category: 'operational',
    affectedPhases: [6],
    notes: {
      21: `**PMS Plan:**
- Establish complaint handling procedure (ISO 13485 clause 8.2.1)
- Define adverse event reporting timelines (FDA MDR, EU FSCA)
- Create vigilance reporting workflows
- Set up periodic safety update reporting (PSUR/SSCP)

**Monitoring Activities:**
- Customer feedback collection mechanisms
- Field action procedures (recalls, corrections)
- Post-market clinical follow-up (PMCF) activities
- Trending analysis for complaints and adverse events

**Regulatory Reporting:**
- FDA MDR reporting (30-day, 5-day, supplemental reports)
- EU FSCA reporting to authorities and Notified Body
- Vigilance reporting to other regulatory authorities
- Medical device reporting thresholds and timelines`,
      22: `**Performance Analysis:**
- KPI tracking (complaint rates, field actions, adverse events)
- Safety signal detection methods
- Trend analysis for emerging risks
- Real-world evidence gathering

**Risk-Benefit Re-evaluation:**
- Periodic benefit-risk analysis updates
- Post-market risk management updates
- Integration of PMS data into risk management file`,
    }
  },
  {
    id: 'manufacturing-validation',
    name: 'Manufacturing Process Validation',
    description: 'IQ/OQ/PQ validation framework ensuring consistent device manufacture',
    category: 'operational',
    affectedPhases: [4],
    notes: {
      15: `**Installation Qualification (IQ):**
- Equipment specifications and acceptance criteria
- Utility requirements (power, compressed air, etc.)
- Calibration and maintenance procedures
- Documentation of as-built configuration

**Operational Qualification (OQ):**
- Process parameter challenge testing
- Worst-case scenario testing
- Equipment capability studies
- Standard operating procedures (SOPs) development

**Performance Qualification (PQ):**
- Production of commercial-scale batches
- Demonstration of process consistency
- In-process monitoring and control
- Final product acceptance criteria validation

**Process Validation Report:**
- Summary of validation activities
- Acceptance criteria and results
- Process capability analysis
- Continuous process verification plan`,
    }
  }
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'strategic': return <Scale className="h-5 w-5" />;
    case 'operational': return <ClipboardCheck className="h-5 w-5" />;
    default: return <FileCheck className="h-5 w-5" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'strategic': return 'text-purple-600 bg-purple-50 dark:bg-purple-950';
    case 'operational': return 'text-orange-600 bg-orange-50 dark:bg-orange-950';
    default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950';
  }
};

export function ProductFrameworkTemplates({
  isOpen,
  onClose,
  onApplyTemplate,
  hasExistingNotes,
  disabled = false
}: ProductFrameworkTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<FrameworkTemplate | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleApplyClick = (template: FrameworkTemplate) => {
    if (disabled) return;
    setSelectedTemplate(template);
    if (hasExistingNotes) {
      setShowConfirmDialog(true);
    } else {
      applyTemplate(template);
    }
  };

  const applyTemplate = (template: FrameworkTemplate) => {
    if (disabled) return;
    onApplyTemplate(template);
    setShowConfirmDialog(false);
    setSelectedTemplate(null);
    onClose();
    toast.success(`${template.name} framework applied successfully`);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              Medical Device Framework Templates
            </DialogTitle>
            <DialogDescription>
              Apply industry-standard medical device development frameworks to structure your venture blueprint. These templates provide guidance based on FDA, ISO 13485, and EU MDR requirements.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {PRODUCT_FRAMEWORK_TEMPLATES.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`p-2 rounded-lg ${getCategoryColor(template.category)}`}>
                      {getCategoryIcon(template.category)}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {Object.keys(template.notes).length} steps
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
                        Phase {phaseId}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    onClick={() => handleApplyClick(template)}
                    className="w-full"
                    size="sm"
                    disabled={disabled}
                  >
                    Apply Framework
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
            <AlertDialogTitle>Apply Framework Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will add notes to {selectedTemplate ? Object.keys(selectedTemplate.notes).length : 0} steps.
              Existing notes will be preserved and the framework content will be appended.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedTemplate && applyTemplate(selectedTemplate)} disabled={disabled}>
              Apply Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
