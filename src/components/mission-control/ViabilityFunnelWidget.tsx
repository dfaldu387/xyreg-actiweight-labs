import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useViabilityFunnelProgress, FunnelStep } from "@/hooks/useViabilityFunnelProgress";
import { useNavigate } from "react-router-dom";
import { 
  Rocket, 
  Check, 
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Sparkles,
  FileText,
  Target,
  Map,
  Layers,
  Users,
  Share2,
  Circle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ViabilityFunnelWidgetProps {
  productId: string;
  companyId: string;
}

const stepIcons: Record<number, React.ReactNode> = {
  1: <FileText className="h-4 w-4" />,
  2: <Target className="h-4 w-4" />,
  3: <Map className="h-4 w-4" />,
  4: <Layers className="h-4 w-4" />,
  5: <Users className="h-4 w-4" />,
  6: <Share2 className="h-4 w-4" />,
};

function StepItem({ step, isCurrent, navigate }: { step: FunnelStep; isCurrent: boolean; navigate: (path: string) => void }) {
  const [isOpen, setIsOpen] = useState(isCurrent);
  const isComplete = step.isComplete;
  const isLocked = step.step > 1 && !isComplete && !isCurrent;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn(
        "relative pl-8 pb-4",
        step.step < 6 && "border-l-2 ml-3",
        isComplete ? "border-emerald-500" : "border-muted"
      )}>
        {/* Step indicator circle */}
        <div className={cn(
          "absolute -left-3 top-0 h-6 w-6 rounded-full flex items-center justify-center ring-4 ring-background",
          isComplete && "bg-emerald-500 text-white",
          isCurrent && !isComplete && "bg-primary text-primary-foreground",
          !isCurrent && !isComplete && "bg-muted text-muted-foreground"
        )}>
          {isComplete ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            stepIcons[step.step] || <Circle className="h-3 w-3" />
          )}
        </div>

        <CollapsibleTrigger asChild>
          <div className={cn(
            "flex items-center justify-between cursor-pointer rounded-lg p-2 -ml-2 hover:bg-muted/50 transition-colors",
            isCurrent && "bg-primary/5"
          )}>
            <div className="flex items-center gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Step {step.step}
                  </span>
                  {isComplete && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Complete
                    </span>
                  )}
                  {isCurrent && !isComplete && (
                    <span className="text-xs text-primary font-medium">
                      Current
                    </span>
                  )}
                </div>
                <h4 className="font-semibold text-sm">{step.title}</h4>
              </div>
            </div>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-2 pl-2 space-y-2">
          <p className="text-sm text-muted-foreground">{step.description}</p>
          
          {step.subTasks && step.subTasks.length > 0 && (
            <ul className="space-y-1">
              {step.subTasks.map((task, idx) => (
                <li key={idx} className="flex items-center gap-2 text-xs">
                  {task.complete ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Circle className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className={task.complete ? "text-muted-foreground line-through" : ""}>
                    {task.label}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <Button 
            size="sm" 
            variant={isCurrent && !isComplete ? "default" : "ghost"}
            className="h-7 text-xs"
            onClick={() => navigate(step.route)}
            disabled={isLocked}
          >
            {isComplete ? "Review" : isCurrent ? "Continue" : "View"}
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function ViabilityFunnelWidget({ productId, companyId }: ViabilityFunnelWidgetProps) {
  const navigate = useNavigate();
  const { steps, currentStep, overallProgress, isLoading } = useViabilityFunnelProgress(productId, companyId);

  const allComplete = currentStep > 6;

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
                Prepare your device for investors
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
        <div className="space-y-0">
          {steps.map((step) => (
            <StepItem
              key={step.step}
              step={step}
              isCurrent={step.step === currentStep}
              navigate={navigate}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
