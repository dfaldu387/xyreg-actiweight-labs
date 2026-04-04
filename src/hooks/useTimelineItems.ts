
import { useEffect, useState } from "react";
import { ProductPhase } from "@/types/client";

export function useTimelineItems(
  phases: ProductPhase[], 
  auditsPerPhase: Record<string, any[]> = {}
): any[] {
  const [timelineItems, setTimelineItems] = useState<any[]>([]);
  
  useEffect(() => {
    try {
      if (!phases || !Array.isArray(phases) || phases.length === 0) {
        console.log("No phases provided to useTimelineItems");
        setTimelineItems([]);
        return;
      }
      
      const items: any[] = [];
      
      // Add phase items
      phases.forEach(phase => {
        if (!phase || !phase.id || !phase.name) {
          console.warn("Invalid phase object encountered:", phase);
          return;
        }
        
        items.push({
          id: phase.id,
          type: 'phase',
          name: phase.name,
          description: phase.description,
          deadline: phase.deadline,
          isCurrentPhase: phase.isCurrentPhase,
          status: phase.status,
          progress: phase.progress,
          estimated_budget: phase.estimated_budget,
          is_pre_launch: phase.is_pre_launch,
          cost_category: phase.cost_category,
          budget_currency: phase.budget_currency
        });
        
        // Add audits for this phase if any
        const audits = auditsPerPhase[phase.id] || [];
        audits.forEach(audit => {
          if (!audit || !audit.id) {
            console.warn("Invalid audit object:", audit);
            return;
          }
          
          items.push({
            id: audit.id,
            type: audit.type || 'audit',
            name: audit.name || `${audit.type || 'Audit'} - ${phase.name}`,
            description: audit.description,
            deadline: audit.deadline || audit.date,
            status: audit.status
          });
        });
      });
      
      console.log(`Generated ${items.length} timeline items (${phases.length} phases)`);
      setTimelineItems(items);
    } catch (error) {
      console.error("Error in useTimelineItems:", error);
      setTimelineItems([]);
    }
  }, [phases, auditsPerPhase]);
  
  return timelineItems;
}
