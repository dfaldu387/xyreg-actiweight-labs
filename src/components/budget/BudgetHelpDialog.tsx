import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { mapPhaseToBudgetKey } from '@/utils/phaseBudgetMapping';

interface BudgetHelpDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentPhaseName?: string;
}

const PHASE_BUDGETING_DATA = {
  "1. Concept & Feasibility": {
    fixedCosts: [
      "Market Research Reports",
      "Initial Patent Search & Filing Fees", 
      "User Needs Research (Surveys, Interviews)",
      "Preliminary Regulatory Strategy Consultation"
    ],
    variableCosts: [
      "Salaries for core team members (Product Manager, Lead Engineer) involved in ideation and planning"
    ],
    otherCosts: [
      "Travel for initial stakeholder meetings or conferences"
    ]
  },
  "2. Design & Development": {
    fixedCosts: [
      "CAD/Software Development Tool Licenses",
      "Prototype Materials & 3D Printing",
      "Initial Supplier Qualification Audits",
      "Usability/Human Factors Formative Studies"
    ],
    variableCosts: [
      "Full project team salaries (Engineers, QA/RA, Project Manager). This is the largest variable cost"
    ],
    otherCosts: [
      "External design consultant fees",
      "Shipping for prototype parts"
    ]
  },
  "3. Verification & Validation": {
    fixedCosts: [
      "External Test Lab Fees (e.g., Biocompatibility, Electrical Safety, EMC Testing)",
      "Test Equipment Purchases or Rentals",
      "Materials for Design Verification & Validation units"
    ],
    variableCosts: [
      "Salaries for the engineering and testing team executing the protocols"
    ],
    otherCosts: [
      "Calibration services for test equipment"
    ]
  },
  "4. Clinical Validation": {
    fixedCosts: [
      "Clinical Research Organization (CRO) contract fees",
      "Ethics Committee/IRB submission fees",
      "Clinical Trial Insurance",
      "Investigator Meeting costs"
    ],
    variableCosts: [
      "Per-patient enrollment costs",
      "Site monitoring fees",
      "Salaries for the clinical affairs team"
    ],
    otherCosts: [
      "Data management platform subscription fees"
    ]
  },
  "5. Regulatory Submission": {
    fixedCosts: [
      "Regulatory Body Submission Fees (e.g., Notified Body review fee, FDA 510(k) fee)",
      "External regulatory consultant review fees",
      "Technical translation costs for labeling/IFU"
    ],
    variableCosts: [
      "Salaries for the regulatory affairs team compiling and managing the submission"
    ],
    otherCosts: [
      "Notarization or legalization of documents"
    ]
  },
  "6. Design Transfer & Launch": {
    fixedCosts: [
      "Manufacturing equipment (IQ/OQ/PQ) validation costs",
      "Initial batch production costs",
      "Marketing materials and website development",
      "Final labeling and packaging print runs"
    ],
    variableCosts: [
      "Salaries for the manufacturing and operations teams during the transfer process"
    ],
    otherCosts: [
      "Trade show and conference fees for product launch"
    ]
  },
  "7. Post-Market Surveillance": {
    fixedCosts: [
      "Post-Market Clinical Follow-up (PMCF) study setup costs",
      "Subscription fees for literature search databases"
    ],
    variableCosts: [
      "Salaries for the quality and regulatory team members assigned to PMS activities"
    ],
    otherCosts: [
      "Costs associated with investigating and reporting vigilance events"
    ]
  }
};

export function BudgetHelpDialog({ isOpen, onOpenChange, currentPhaseName }: BudgetHelpDialogProps) {
  // Map current phase name to budget data key
  const budgetKey = currentPhaseName ? mapPhaseToBudgetKey(currentPhaseName) : null;
  const phaseData = budgetKey ? PHASE_BUDGETING_DATA[budgetKey as keyof typeof PHASE_BUDGETING_DATA] : null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {currentPhaseName ? `Budget Guidelines for ${currentPhaseName}` : 'Budgeting Guidelines'}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 pr-4">
            {phaseData ? (
              <>
                <div className="text-sm text-muted-foreground">
                  <p className="mb-4">
                    Smart suggestions for typical costs that occur during the <strong>{currentPhaseName}</strong> phase 
                    of a medical device project.
                  </p>
                  
                  <div className="bg-muted/50 p-4 rounded-lg mb-6">
                    <h4 className="font-medium mb-2">Budget Structure</h4>
                    <div className="space-y-2 text-sm">
                      <div><Badge variant="outline" className="mr-2">Fixed Costs</Badge>One-time, lump-sum expenses incurred during this phase.</div>
                      <div><Badge variant="outline" className="mr-2">Variable Costs (per day)</Badge>Ongoing operational costs proportional to time spent in this phase.</div>
                      <div><Badge variant="outline" className="mr-2">Other Costs</Badge>Miscellaneous or unexpected one-off expenses.</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">Fixed Costs</Badge>
                      </div>
                      <ul className="text-sm space-y-2">
                        {phaseData.fixedCosts.map((cost, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-muted-foreground">•</span>
                            <span>{cost}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">Variable Costs (per day)</Badge>
                      </div>
                      <ul className="text-sm space-y-2">
                        {phaseData.variableCosts.map((cost, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-muted-foreground">•</span>
                            <span>{cost}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">Other Costs</Badge>
                      </div>
                      <ul className="text-sm space-y-2">
                        {phaseData.otherCosts.map((cost, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-muted-foreground">•</span>
                            <span>{cost}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p className="mb-4">No specific budgeting guidelines available for this phase.</p>
                <p className="text-sm">
                  The budgeting guidelines are currently available for the standard lifecycle phases: 
                  Concept & Feasibility, Design & Development, Verification & Validation, Clinical Validation, 
                  Regulatory Submission, Design Transfer & Launch, and Post-Market Surveillance.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}