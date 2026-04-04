
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Product, LifecyclePhase, ProductPhase } from "@/types/client";
import { AuditMilestonesDialog } from "../AuditMilestonesDialog";
import { TimelineItem } from "./TimelineItem";
import { LoadingErrorState } from "./LoadingErrorState";
import { usePhaseFiltering } from "@/hooks/usePhaseFiltering";
import { useTimelineItems } from "@/hooks/useTimelineItems";
import { useAuditManagement } from "@/hooks/useAuditManagement";
import { calculateOverallProgress } from "@/utils/timelineUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { safeDecodeURIComponent } from "@/utils/companyUtils";

interface ProductPhasesProps {
  phases: ProductPhase[];
  onPhaseDeadlineChange: (phaseId: string, date: Date | undefined) => void;
  product?: Product;
  phaseAudits?: Record<string, any[]>;
  companyId?: string;
  onProductPhaseChange?: (productId: string, phaseId: string) => Promise<boolean>;
}

export function ProductPhases({ 
  phases, 
  onPhaseDeadlineChange, 
  product, 
  phaseAudits = {}, 
  companyId,
  onProductPhaseChange
}: ProductPhasesProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [phaseToAddTo, setPhaseToAddTo] = useState<ProductPhase | null>(null);
  const [timeoutOccurred, setTimeoutOccurred] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [internalError, setInternalError] = useState<string | null>(null);
  
  // Debug Props
  useEffect(() => {
    console.log("ProductPhases received props:", { 
      phasesCount: phases?.length || 0,
      hasProduct: !!product,
      companyId,
      hasPhaseAudits: Object.keys(phaseAudits || {}).length > 0
    });
    
    if (companyId) {
      console.log("Company ID (possibly name):", companyId);
    }
  }, [phases, product, companyId, phaseAudits]);
  
  // Use custom hooks to manage phases, audits and timeline with proper error handling
  const { 
    filteredPhases, 
    isLoading
  } = usePhaseFiltering(companyId || '');
  
  // Handle filtered phases changes for debugging
  useEffect(() => {
    console.log("Filtered phases updated:", filteredPhases?.length || 0);
    if (filteredPhases?.length > 0) {
      console.log("First filtered phase:", filteredPhases[0]);
    }
  }, [filteredPhases]);
  
  const { auditsPerPhase, addAuditToTimeline } = useAuditManagement(phases, phaseAudits);
  
  // Set up timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log("Loading timeout occurred in ProductPhases after 10 seconds");
        setTimeoutOccurred(true);
      }
    }, 15000); // Extended to 15 seconds to give more time for resolution
    
    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  // Generate timeline items with proper error handling
  let timelineItems: any[] = [];
  let timelineError: string | null = null;
  
  try {
    if (phases?.length > 0) {
      timelineItems = useTimelineItems(phases, auditsPerPhase);
      console.log("Generated timeline items:", timelineItems?.length || 0);
    } else {
      console.log("No phases available for timeline items");
    }
  } catch (error) {
    console.error("Error generating timeline items:", error);
    timelineError = "Failed to create timeline display";
    timelineItems = [];
  }

  const currentPhaseIndex = phases?.findIndex(phase => phase.isCurrentPhase) || -1;
  const overallProgress = calculateOverallProgress(phases || []);

  // Scroll to current phase when it changes
  useEffect(() => {
    if (currentPhaseIndex !== -1 && phases?.length > 0) {
      const container = document.getElementById('phases-container');
      const phaseElement = document.getElementById(`phase-card-${phases[currentPhaseIndex].id}`);
      if (container && phaseElement) {
        try {
          setTimeout(() => {
            const containerWidth = container.offsetWidth;
            const phaseWidth = phaseElement.offsetWidth;
            const scrollTo = phaseElement.offsetLeft - (containerWidth / 2) + (phaseWidth / 2);
            container.scrollLeft = scrollTo;
          }, 200);
        } catch (error) {
          console.error("Error scrolling to current phase:", error);
        }
      }
    }
  }, [currentPhaseIndex, phases]);

  const handleAddAuditOrReview = (phaseId: string, kind: "audit" | "design-review") => {
    const phase = phases?.find(p => p.id === phaseId);
    if (!phase) return;
    
    addAuditToTimeline(phase, kind);
    setAddDialogOpen(false);
    setPhaseToAddTo(null);
  };

  const handleOpenDialog = (phase: ProductPhase) => {
    setPhaseToAddTo(phase);
    setAddDialogOpen(true);
  };
  
  const handleRetry = () => {
    console.log("Retrying ProductPhases...");
    setTimeoutOccurred(false);
    setInternalError(null);
    setRetryCount(prev => prev + 1);
  };
  
  // Show error state if there are any major errors
  const errorOccurred = timeoutOccurred || timelineError || internalError;
  
  // Render a fallback if timeout occurs or there's an error
  if (errorOccurred) {
    return (
      <>
        <div className="flex flex-col items-end mb-3">
          <div className="flex items-center gap-3">
            <span className="bg-gray-100 text-slate-500 text-xs font-semibold rounded-full px-3 py-1">
              {overallProgress || 0}%
            </span>
            <Progress value={overallProgress || 0} className="h-3 w-40 bg-[#F1F0FB] rounded-full" />
          </div>
        </div>
        
        <LoadingErrorState
          title="Timeline Error"
          message={timeoutOccurred ? "Timeline is taking too long to load." : 
                  timelineError || internalError || 
                  "There was a problem loading the product timeline."}
          details={`We're having trouble matching phases for this product. Try refreshing the page or contact support if this issue persists.`}
          onRetry={handleRetry}
        />
      </>
    );
  }

  // No phases at all - show a helpful message
  if (!isLoading && (!phases || phases.length === 0)) {
    const companyName = companyId ? safeDecodeURIComponent(String(companyId)) : 'this company';
    
    return (
      <>
        <div className="flex flex-col items-end mb-3">
          <div className="flex items-center gap-3">
            <span className="bg-gray-100 text-slate-500 text-xs font-semibold rounded-full px-3 py-1">
              0%
            </span>
            <Progress value={0} className="h-3 w-40 bg-[#F1F0FB] rounded-full" />
          </div>
        </div>
        
        <LoadingErrorState
          title="No Timeline Data"
          message={`No phases found for ${companyName}.`}
          severity="info"
          details={`Please set up phases in the company settings or check that this product has phases assigned.`}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col items-end mb-3">
        <div className="flex items-center gap-3">
          <span className="bg-gray-100 text-slate-500 text-xs font-semibold rounded-full px-3 py-1">
            {overallProgress || 0}%
          </span>
          <Progress 
            value={overallProgress || 0} 
            className="h-3 w-40 bg-[#F1F0FB] rounded-full" 
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex space-x-4 pb-4 px-4 overflow-x-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-[280px] flex-shrink-0">
              <Skeleton className="h-40 w-full" />
            </div>
          ))}
        </div>
      ) : phases?.length > 0 && timelineItems.length > 0 ? (
        <ScrollArea className="w-full">
          <div 
            id="phases-container"
            className="flex space-x-4 pb-4 px-4 min-w-full"
          >
            {timelineItems.map((item) => (
              <TimelineItem 
                key={item.id}
                item={item}
                onDeadlineChange={onPhaseDeadlineChange}
                onScheduleMilestone={handleOpenDialog}
                companyId={companyId || ''}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-gray-600">
          <p className="text-sm">No timeline phases are available. Please configure phases in company settings.</p>
        </div>
      )}
      
      <AuditMilestonesDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        phaseName={phaseToAddTo?.name}
        onAudit={() => phaseToAddTo && handleAddAuditOrReview(phaseToAddTo.id, "audit")}
        onDesignReview={() => phaseToAddTo && handleAddAuditOrReview(phaseToAddTo.id, "design-review")}
      />
    </>
  );
}
