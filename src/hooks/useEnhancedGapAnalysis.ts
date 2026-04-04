import { useState, useEffect, useCallback } from 'react';
import { GapAnalysisItem } from "@/types/client";
import { AIGapAnalysisService } from "@/services/aiGapAnalysisService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

interface UseEnhancedGapAnalysisProps {
  productId?: string;
  companyId?: string;
  items: GapAnalysisItem[];
}

interface AutoNAAnalysis {
  itemId: string;
  canExclude: boolean;
  reason?: string;
  confidence: 'high' | 'medium' | 'low';
  suggestedAction: 'auto_exclude' | 'flag_for_review' | 'keep_applicable';
}

export function useEnhancedGapAnalysis({ 
  productId, 
  companyId, 
  items 
}: UseEnhancedGapAnalysisProps) {
  const [deviceContext, setDeviceContext] = useState<DeviceContext>({});
  const [autoNAAnalysis, setAutoNAAnalysis] = useState<AutoNAAnalysis[]>([]);
  const [ownershipSuggestions, setOwnershipSuggestions] = useState<Record<string, any>>({});
  const [relatedGroups, setRelatedGroups] = useState<Record<string, string[]>>({});
  const [priorities, setPriorities] = useState<Record<string, number>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch device context from product data
  const fetchDeviceContext = useCallback(async () => {
    if (!productId) return;

    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('device_category, markets, description, name')
        .eq('id', productId)
        .single();

      if (error) throw error;

      if (product) {
        // Extract device characteristics from product data
        const context: DeviceContext = {
          deviceCategory: product.device_category,
          markets: Array.isArray(product.markets) ? product.markets.map(String) : [],
          intendedUse: product.description,
          // These would typically come from product specifications
          // For now, we'll use heuristics based on name/description
          isImplantable: product.name?.toLowerCase().includes('implant') || 
                        product.description?.toLowerCase().includes('implant'),
          isReusable: !product.name?.toLowerCase().includes('single') && 
                     !product.name?.toLowerCase().includes('disposable'),
          hasElectronics: product.name?.toLowerCase().includes('electronic') ||
                         product.description?.toLowerCase().includes('electronic') ||
                         product.description?.toLowerCase().includes('software'),
          hasSoftware: product.description?.toLowerCase().includes('software') ||
                      product.description?.toLowerCase().includes('algorithm'),
        };

        setDeviceContext(context);
      }
    } catch (error) {
      console.error('Error fetching device context:', error);
      toast.error('Failed to load device context');
    }
  }, [productId]);

  // Run AI analysis on items
  const runAIAnalysis = useCallback(async () => {
    if (items.length === 0 || Object.keys(deviceContext).length === 0) return;

    setIsAnalyzing(true);
    try {
      // Run auto N/A analysis
      const naAnalysis = await AIGapAnalysisService.analyzeItemsForAutoNA(items, deviceContext);
      setAutoNAAnalysis(naAnalysis);

      // Get ownership suggestions
      const ownerSuggestions = AIGapAnalysisService.suggestOwnerAssignments(items, deviceContext);
      setOwnershipSuggestions(ownerSuggestions);

      // Identify related requirements
      const groups = AIGapAnalysisService.identifyRelatedRequirements(items);
      setRelatedGroups(groups);

      // Calculate priorities
      const priorityScores = AIGapAnalysisService.calculateCompletionPriorities(items);
      setPriorities(priorityScores);

      toast.success(`AI analysis complete: ${naAnalysis.filter(a => a.canExclude).length} items can be excluded`);
    } catch (error) {
      console.error('Error running AI analysis:', error);
      toast.error('Failed to run AI analysis');
    } finally {
      setIsAnalyzing(false);
    }
  }, [items, deviceContext]);

  // Apply auto-exclusions
  const applyAutoExclusions = useCallback(async () => {
    if (!productId) return;

    const autoExclusions = autoNAAnalysis.filter(a => a.suggestedAction === 'auto_exclude');
    
    if (autoExclusions.length === 0) {
      toast.info('No items to auto-exclude');
      return;
    }

    try {
      await AIGapAnalysisService.saveAutoNAAnalysis(productId, autoNAAnalysis);
      toast.success(`Auto-excluded ${autoExclusions.length} items`);
    } catch (error) {
      console.error('Error applying auto-exclusions:', error);
      toast.error('Failed to apply auto-exclusions');
    }
  }, [productId, autoNAAnalysis]);

  // Update item with enhanced data
  const updateGapItem = useCallback(async (
    itemId: string, 
    updates: Partial<GapAnalysisItem>
  ) => {
    try {
      // Convert updates to proper database format
      const cleanUpdates: any = { ...updates };
      if (cleanUpdates.admin_approved_at && cleanUpdates.admin_approved_at instanceof Date) {
        cleanUpdates.admin_approved_at = cleanUpdates.admin_approved_at.toISOString();
      }

      const { error } = await supabase
        .from('gap_analysis_items')
        .update(cleanUpdates)
        .eq('id', itemId);

      if (error) throw error;

      toast.success('Item updated successfully');
    } catch (error) {
      console.error('Error updating gap item:', error);
      toast.error('Failed to update item');
    }
  }, []);

  // Bulk apply ownership suggestions
  const applyOwnershipSuggestions = useCallback(async () => {
    if (Object.keys(ownershipSuggestions).length === 0) {
      toast.info('No ownership suggestions available');
      return;
    }

    try {
      let updateCount = 0;
      for (const [itemId, suggestion] of Object.entries(ownershipSuggestions)) {
        const updateData: any = {};
        updateData[`${suggestion.primary}_owner`] = 'primary';
        if (suggestion.secondary) {
          updateData[`${suggestion.secondary}_owner`] = 'secondary';
        }

        const { error } = await supabase
          .from('gap_analysis_items')
          .update(updateData)
          .eq('id', itemId);

        if (error) throw error;
        updateCount++;
      }

      toast.success(`Applied ownership suggestions to ${updateCount} items`);
    } catch (error) {
      console.error('Error applying ownership suggestions:', error);
      toast.error('Failed to apply ownership suggestions');
    }
  }, [ownershipSuggestions]);

  // Initialize analysis when component mounts or context changes
  useEffect(() => {
    fetchDeviceContext();
  }, [fetchDeviceContext]);

  useEffect(() => {
    if (Object.keys(deviceContext).length > 0) {
      runAIAnalysis();
    }
  }, [runAIAnalysis, deviceContext]);

  return {
    deviceContext,
    setDeviceContext,
    autoNAAnalysis,
    ownershipSuggestions,
    relatedGroups,
    priorities,
    isAnalyzing,
    runAIAnalysis,
    applyAutoExclusions,
    updateGapItem,
    applyOwnershipSuggestions,
    // Summary statistics
    stats: {
      totalItems: items.length,
      autoExcludable: autoNAAnalysis.filter(a => a.canExclude).length,
      highConfidenceExclusions: autoNAAnalysis.filter(a => a.confidence === 'high' && a.canExclude).length,
      itemsWithSuggestions: Object.keys(ownershipSuggestions).length,
      relatedGroupsCount: Object.keys(relatedGroups).length,
    }
  };
}