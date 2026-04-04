import { GapAnalysisItem } from "@/types/client";
import { supabase } from "@/integrations/supabase/client";

interface DeviceContext {
  deviceCategory?: string;
  deviceClass?: string;
  isImplantable?: boolean;
  isReusable?: boolean;
  hasElectronics?: boolean;
  hasSoftware?: boolean;
  markets?: string[];
  intendedUse?: string;
}

interface AutoNAAnalysis {
  itemId: string;
  canExclude: boolean;
  reason?: string;
  confidence: 'high' | 'medium' | 'low';
  suggestedAction: 'auto_exclude' | 'flag_for_review' | 'keep_applicable';
}

export class AIGapAnalysisService {
  /**
   * Analyzes gap analysis items for automatic N/A detection
   */
  static async analyzeItemsForAutoNA(
    items: GapAnalysisItem[], 
    deviceContext: DeviceContext
  ): Promise<AutoNAAnalysis[]> {
    const analyses: AutoNAAnalysis[] = [];

    for (const item of items) {
      const analysis = this.analyzeIndividualItem(item, deviceContext);
      analyses.push(analysis);
    }

    return analyses;
  }

  /**
   * Smart assignment suggestions based on ownership matrix and device type
   */
  static suggestOwnerAssignments(
    items: GapAnalysisItem[], 
    deviceContext: DeviceContext
  ): Record<string, { primary: string; secondary?: string; reason: string }> {
    const suggestions: Record<string, { primary: string; secondary?: string; reason: string }> = {};

    items.forEach(item => {
      const suggestion = this.getOwnershipSuggestion(item, deviceContext);
      if (suggestion) {
        suggestions[item.id] = suggestion;
      }
    });

    return suggestions;
  }

  /**
   * Groups related requirements for better workflow management
   */
  static identifyRelatedRequirements(items: GapAnalysisItem[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {};
    
    // Group by common themes and dependencies
    const themeGroups = {
      'Risk Management': ['risk', 'hazard', 'safety', 'fmea'],
      'Clinical Evidence': ['clinical', 'evidence', 'trial', 'study'],
      'Software': ['software', 'algorithm', 'cybersecurity', 'iec 62304'],
      'Biocompatibility': ['biocompatibility', 'material', 'biological'],
      'Usability': ['usability', 'human factors', 'use error', 'ergonomic'],
      'Manufacturing': ['manufacturing', 'production', 'quality control'],
      'Labeling': ['labeling', 'ifu', 'instructions', 'warning'],
      'Post-Market': ['post-market', 'surveillance', 'vigilance', 'complaint']
    };

    Object.entries(themeGroups).forEach(([theme, keywords]) => {
      const relatedItems = items.filter(item => 
        keywords.some(keyword => 
          (item.requirement || '').toLowerCase().includes(keyword) ||
          item.description?.toLowerCase().includes(keyword)
        )
      );

      if (relatedItems.length > 1) {
        groups[theme] = relatedItems.map(item => item.id);
      }
    });

    return groups;
  }

  /**
   * Calculates completion priorities based on dependencies and due dates
   */
  static calculateCompletionPriorities(items: GapAnalysisItem[]): Record<string, number> {
    const priorities: Record<string, number> = {};
    
    items.forEach(item => {
      let score = 50; // Base score
      
      // Factor in stated priority
      if (item.priority === 'high') score += 30;
      if (item.priority === 'medium') score += 10;
      if (item.priority === 'low') score -= 10;
      
      // Factor in current status
      if (item.status === 'In Progress') score += 20;
      if (item.status === 'Closed') score = 0;
      
      // Factor in due date proximity (if available)
      if (item.dueDate) {
        const daysUntilDue = Math.ceil(
          (new Date(item.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilDue < 0) score += 50; // Overdue
        else if (daysUntilDue < 7) score += 30; // Due soon
        else if (daysUntilDue < 30) score += 15; // Due this month
      }
      
      // Factor in framework importance (MDR is typically higher priority)
      if (item.framework?.toLowerCase().includes('mdr')) score += 15;
      if (item.framework?.toLowerCase().includes('iso 13485')) score += 10;
      
      priorities[item.id] = Math.min(100, Math.max(0, score));
    });
    
    return priorities;
  }

  private static analyzeIndividualItem(
    item: GapAnalysisItem, 
    deviceContext: DeviceContext
  ): AutoNAAnalysis {
    const analysis: AutoNAAnalysis = {
      itemId: item.id,
      canExclude: false,
      confidence: 'low',
      suggestedAction: 'keep_applicable'
    };

    // For now, no exclusion criteria since field doesn't exist
    analysis.reason = 'Manual review needed - no auto-exclusion criteria available';
    return analysis;
  }

  private static getOwnershipSuggestion(
    item: GapAnalysisItem, 
    deviceContext: DeviceContext
  ): { primary: string; secondary?: string; reason: string } | null {
    const requirement = (item.requirement || '').toLowerCase();
    const keyStandards = ''; // No key_standards field in GapAnalysisItem

    // Risk management items
    if (requirement.includes('risk') || requirement.includes('hazard') || keyStandards.includes('iso 14971')) {
      return {
        primary: 'qa_ra',
        secondary: 'rd',
        reason: 'Risk management requirements typically owned by QA/RA with R&D support'
      };
    }

    // Clinical requirements
    if (requirement.includes('clinical') || requirement.includes('evidence') || requirement.includes('study')) {
      return {
        primary: 'clinical',
        secondary: 'qa_ra',
        reason: 'Clinical evidence requirements owned by Clinical Affairs'
      };
    }

    // Software requirements
    if (requirement.includes('software') || keyStandards.includes('iec 62304') || requirement.includes('cybersecurity')) {
      return {
        primary: 'rd',
        secondary: 'qa_ra',
        reason: 'Software requirements primarily owned by R&D'
      };
    }

    // Manufacturing requirements
    if (requirement.includes('manufacturing') || requirement.includes('production') || requirement.includes('quality control')) {
      return {
        primary: 'mfg_ops',
        secondary: 'qa_ra',
        reason: 'Manufacturing requirements owned by Manufacturing/Operations'
      };
    }

    // Labeling requirements
    if (requirement.includes('labeling') || requirement.includes('ifu') || requirement.includes('instructions')) {
      return {
        primary: 'labeling',
        secondary: 'qa_ra',
        reason: 'Labeling requirements owned by Labeling/Technical Publications'
      };
    }

    // Usability requirements
    if (requirement.includes('usability') || requirement.includes('human factors') || keyStandards.includes('iec 62366')) {
      return {
        primary: 'rd',
        secondary: 'clinical',
        reason: 'Usability requirements typically owned by R&D with Clinical input'
      };
    }

    // Biocompatibility requirements
    if (requirement.includes('biocompatibility') || requirement.includes('material') || keyStandards.includes('iso 10993')) {
      return {
        primary: 'rd',
        secondary: 'qa_ra',
        reason: 'Biocompatibility requirements owned by R&D'
      };
    }

    // Default for general regulatory requirements
    if (requirement.includes('regulatory') || requirement.includes('compliance') || requirement.includes('regulation')) {
      return {
        primary: 'qa_ra',
        reason: 'General regulatory requirements owned by QA/RA'
      };
    }

    return null;
  }

  /**
   * Saves auto-exclusion analysis to database
   */
  static async saveAutoNAAnalysis(
    productId: string,
    analyses: AutoNAAnalysis[]
  ): Promise<void> {
    const autoExclusions = analyses
      .filter(analysis => analysis.suggestedAction === 'auto_exclude')
      .map(analysis => ({
        item_id: analysis.itemId,
        reason: analysis.reason,
        confidence: analysis.confidence,
        auto_excluded_at: new Date().toISOString()
      }));

    if (autoExclusions.length > 0) {
      const { error } = await supabase
        .from('gap_analysis_items')
        .update({ 
          status: 'not_applicable',
          automatic_na_reason: autoExclusions[0].reason,
          is_auto_excluded: true
        })
        .in('id', autoExclusions.map(e => e.item_id));

      if (error) {
        console.error('Error saving auto-exclusions:', error);
        throw error;
      }
    }
  }
}