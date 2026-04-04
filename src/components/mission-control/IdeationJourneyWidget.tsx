import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useIdeationJourneyProgress } from "@/hooks/useIdeationJourneyProgress";
import { useNavigate } from "react-router-dom";
import { 
  Rocket, 
  FileText, 
  Briefcase, 
  Share2, 
  Check, 
  ArrowRight,
  Lock,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IdeationJourneyWidgetProps {
  productId: string;
  companyId: string;
}

const journeySteps = [
  {
    step: 1,
    title: "Define Device",
    description: "Add intended use & description",
    icon: FileText,
    route: (productId: string) => `/app/product/${productId}/device-information`,
  },
  {
    step: 2,
    title: "Build Business Case",
    description: "Complete viability scorecard",
    icon: Briefcase,
    route: (productId: string) => `/app/product/${productId}/viability-scorecard`,
  },
  {
    step: 3,
    title: "Share with Investors",
    description: "Create & share investor link",
    icon: Share2,
    route: (productId: string) => `/app/product/${productId}/business-case?tab=venture-blueprint`,
  },
];

export function IdeationJourneyWidget({ productId, companyId }: IdeationJourneyWidgetProps) {
  const navigate = useNavigate();
  const { 
    step1Complete, 
    step2Complete, 
    step3Complete, 
    currentStep, 
    overallProgress,
    isLoading 
  } = useIdeationJourneyProgress(productId, companyId);

  const stepCompletion = [step1Complete, step2Complete, step3Complete];
  const allComplete = step1Complete && step2Complete && step3Complete;

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show completion state
  if (allComplete) {
    return (
      <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-transparent">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                  Ready for Investors!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your device is fully prepared. Share your investor page now.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                onClick={() => navigate(`/app/product/${productId}/business-case?tab=venture-blueprint`)}
              >
                Manage Share Link
              </Button>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => navigate(`/app/product/${productId}/business-case?tab=venture-blueprint`)}
              >
                View Investor Page
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Product Viability Assessment</CardTitle>
              <p className="text-sm text-muted-foreground">
                Assess your device's market readiness
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              {overallProgress}% Complete
            </span>
            <Progress value={overallProgress} className="w-24 h-2" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          {journeySteps.map((step, index) => {
            const isComplete = stepCompletion[index];
            const isCurrent = currentStep === step.step;
            const isLocked = step.step > currentStep && !isComplete;
            const Icon = step.icon;

            return (
              <React.Fragment key={step.step}>
                {/* Step Card */}
                <div 
                  className={cn(
                    "flex-1 relative p-4 rounded-lg border-2 transition-all",
                    isComplete && "border-emerald-500/50 bg-emerald-500/5",
                    isCurrent && !isComplete && "border-primary bg-primary/5",
                    isLocked && "border-muted bg-muted/30 opacity-60"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                      isComplete && "bg-emerald-500 text-white",
                      isCurrent && !isComplete && "bg-primary text-primary-foreground",
                      isLocked && "bg-muted text-muted-foreground"
                    )}>
                      {isComplete ? (
                        <Check className="h-5 w-5" />
                      ) : isLocked ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Step {step.step}
                        </span>
                        {isComplete && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            Done
                          </span>
                        )}
                        {isCurrent && !isComplete && (
                          <span className="text-xs text-primary font-medium">
                            In Progress
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm mt-0.5">{step.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {step.description}
                      </p>
                      {isCurrent && !isComplete && (
                        <Button 
                          size="sm" 
                          className="mt-3 h-8"
                          onClick={() => navigate(step.route(productId))}
                        >
                          Continue
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      )}
                      {isComplete && !isCurrent && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="mt-3 h-8 text-muted-foreground"
                          onClick={() => navigate(step.route(productId))}
                        >
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Connector Line */}
                {index < journeySteps.length - 1 && (
                  <div className={cn(
                    "w-8 h-0.5 mx-2 shrink-0",
                    stepCompletion[index] ? "bg-emerald-500" : "bg-muted"
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
