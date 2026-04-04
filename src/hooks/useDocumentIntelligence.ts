
import { useState, useEffect } from 'react';
import { DocumentIntelligenceService, DocumentIntelligence, IntelligenceOptimizationPlan } from '@/services/documentIntelligenceService';
import { toast } from 'sonner';

export function useDocumentIntelligence(companyId: string) {
  const [intelligence, setIntelligence] = useState<DocumentIntelligence | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);

  const analyzeIntelligence = async () => {
    if (!companyId) return;
    
    setIsAnalyzing(true);
    try {
      const result = await DocumentIntelligenceService.analyzeDocumentIntelligence(companyId);
      setIntelligence(result);
      setLastAnalyzed(new Date());
    } catch (error) {
      console.error('Intelligence analysis failed:', error);
      toast.error('Failed to analyze document intelligence');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const performOptimization = async () => {
    if (!companyId || !intelligence) return false;
    
    setIsOptimizing(true);
    try {
      const plan = await DocumentIntelligenceService.generateOptimizationPlan(companyId, intelligence);
      const result = await DocumentIntelligenceService.executeIntelligenceOptimizations(companyId, plan);
      
      if (result.success) {
        setIntelligence(null); // Clear to force refresh
        toast.success('Phase 4 intelligence optimization completed successfully!');
        return true;
      } else {
        toast.error(`Phase 4 optimization failed: ${result.errors.join(', ')}`);
        return false;
      }
    } catch (error) {
      console.error('Phase 4 optimization failed:', error);
      toast.error('Failed to perform Phase 4 optimization');
      return false;
    } finally {
      setIsOptimizing(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      analyzeIntelligence();
    }
  }, [companyId]);

  const getIntelligenceScore = (): number => {
    if (!intelligence) return 0;
    
    const contentScore = Math.max(0, 100 - (intelligence.contentAnalysis.duplicateContentGroups.length * 10));
    const workflowScore = intelligence.workflowOptimization.bottleneckAnalysis.reduce((avg, b) => avg + b.completionRate, 0) / 
                         Math.max(intelligence.workflowOptimization.bottleneckAnalysis.length, 1);
    const complianceScore = intelligence.complianceIntelligence.complianceScore;
    
    return Math.round((contentScore + workflowScore + complianceScore) / 3);
  };

  const getCriticalRecommendations = () => {
    if (!intelligence) return [];
    return intelligence.recommendations.filter(r => r.priority === 'critical');
  };

  const getOptimizationCount = (): number => {
    if (!intelligence) return 0;
    return intelligence.contentAnalysis.duplicateContentGroups.length +
           intelligence.workflowOptimization.phaseSequenceIssues.length +
           intelligence.complianceIntelligence.regulatoryGaps.length;
  };

  return {
    intelligence,
    isAnalyzing,
    isOptimizing,
    lastAnalyzed,
    intelligenceScore: getIntelligenceScore(),
    criticalRecommendations: getCriticalRecommendations(),
    optimizationCount: getOptimizationCount(),
    analyzeIntelligence,
    performOptimization
  };
}
