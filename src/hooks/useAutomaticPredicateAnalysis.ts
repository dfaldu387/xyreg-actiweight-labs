import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PredicateDevice, PredicateTrail } from '@/types/fdaPredicateTrail';
import { toast } from 'sonner';

export interface AutoAnalysisResult {
  kNumber: string;
  deviceName: string;
  enhancedAnalysis: any;
  trail: PredicateTrail | null;
  confidence: number;
  insights: string[];
  processingTime: number;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  error?: string;
}

export interface AutoAnalysisState {
  results: Map<string, AutoAnalysisResult>;
  isProcessing: boolean;
  processedCount: number;
  totalCount: number;
  startTime: number | null;
}

export function useAutomaticPredicateAnalysis() {
  const [state, setState] = useState<AutoAnalysisState>({
    results: new Map(),
    isProcessing: false,
    processedCount: 0,
    totalCount: 0,
    startTime: null
  });

  // Start automatic analysis for multiple devices
  const startBatchAnalysis = useCallback(async (devices: PredicateDevice[], maxDevices = 5) => {
    // Filter and prioritize devices
    const prioritizedDevices = prioritizeDevices(devices).slice(0, maxDevices);
    
    if (prioritizedDevices.length === 0) {
      toast.error('No suitable devices found for predicate trail analysis');
      return;
    }

    setState(prev => ({
      ...prev,
      isProcessing: true,
      processedCount: 0,
      totalCount: prioritizedDevices.length,
      startTime: Date.now(),
      results: new Map()
    }));

    toast.success(`Starting automatic predicate analysis for ${prioritizedDevices.length} devices`);

    // Process devices in parallel with controlled concurrency
    const processingPromises = prioritizedDevices.map(device => 
      processDevice(device).catch(error => {
        console.error(`Failed to process ${device.kNumber}:`, error);
        return {
          kNumber: device.kNumber,
          deviceName: device.deviceName || 'Unknown',
          analysis: null,
          trail: null,
          status: 'failed' as const,
          error: error.message
        };
      })
    );

    // Process with controlled concurrency (2 at a time)
    const batchSize = 2;
    for (let i = 0; i < processingPromises.length; i += batchSize) {
      const batch = processingPromises.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch);
      
      // Update results as they complete
      setState(prev => {
        const newResults = new Map(prev.results);
        batchResults.forEach(result => {
          if (result) {
            newResults.set(result.kNumber, result as AutoAnalysisResult);
          }
        });
        
        return {
          ...prev,
          results: newResults,
          processedCount: newResults.size
        };
      });
    }

    // Final completion
    setState(prev => ({
      ...prev,
      isProcessing: false
    }));

    const completedCount = Array.from(state.results.values())
      .filter(r => r.status === 'completed').length;
      
    toast.success(`Completed automatic analysis: ${completedCount} successful trails built`);
  }, []);

  // Process a single device
  const processDevice = async (device: PredicateDevice): Promise<AutoAnalysisResult | null> => {
    if (!device.kNumber) return null;

    const startTime = Date.now();

    try {
      // Update status to analyzing
      setState(prev => ({
        ...prev,
        results: new Map(prev.results.set(device.kNumber, {
          kNumber: device.kNumber,
          deviceName: device.deviceName || 'Unknown',
          enhancedAnalysis: null,
          trail: null,
          confidence: 0,
          insights: [],
          processingTime: 0,
          status: 'analyzing'
        }))
      }));

      // Use enhanced document parser
      const enhancedResult = await supabase.functions.invoke('fda-enhanced-document-parser', {
        body: { kNumber: device.kNumber, forceRefresh: false }
      });

      if (!enhancedResult.data) {
        throw new Error('No data returned from enhanced parser');
      }

      const enhancedDoc = enhancedResult.data;
      let trail: PredicateTrail | null = null;

      // Build predicate trail if references found
      if (enhancedDoc.predicateKNumbers && enhancedDoc.predicateKNumbers.length > 0) {
        try {
          const trailResult = await supabase.functions.invoke('fda-build-predicate-trail', {
            body: { kNumber: device.kNumber, maxDepth: 2 }
          });
          
          if (trailResult.data?.success) {
            trail = trailResult.data.data;
          }
        } catch (error) {
          console.warn(`Trail building failed for ${device.kNumber}, continuing with document analysis only`);
        }
      }

      // Generate insights based on enhanced analysis
      const insights = generateEnhancedInsights(enhancedDoc, trail, device);

      const result: AutoAnalysisResult = {
        kNumber: device.kNumber,
        deviceName: device.deviceName || 'Unknown',
        enhancedAnalysis: enhancedDoc,
        trail,
        confidence: enhancedDoc.confidence || 0,
        insights,
        processingTime: Date.now() - startTime,
        status: 'completed'
      };

      return result;
      
    } catch (error) {
      console.error(`Error processing device ${device.kNumber}:`, error);
      return {
        kNumber: device.kNumber,
        deviceName: device.deviceName || 'Unknown',
        enhancedAnalysis: null,
        trail: null,
        confidence: 0,
        insights: ['❌ Analysis failed - ' + (error instanceof Error ? error.message : 'Unknown error')],
        processingTime: Date.now() - startTime,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // Clear analysis results
  const clearResults = useCallback(() => {
    setState({
      results: new Map(),
      isProcessing: false,
      processedCount: 0,
      totalCount: 0,
      startTime: null
    });
  }, []);

  return {
    ...state,
    startBatchAnalysis,
    clearResults,
    getResult: (kNumber: string) => state.results.get(kNumber),
    getSuccessfulResults: () => Array.from(state.results.values())
      .filter(r => r.status === 'completed' && r.enhancedAnalysis),
    getProgress: () => state.totalCount > 0 ? (state.processedCount / state.totalCount) * 100 : 0,
    getElapsedTime: () => state.startTime ? Date.now() - state.startTime : 0
  };
}

// Prioritize devices for analysis based on likelihood of valuable predicate trails
function prioritizeDevices(devices: PredicateDevice[]): PredicateDevice[] {
  return devices
    .filter(device => device.kNumber && device.kNumber.length >= 7)
    .map(device => ({
      ...device,
      priority: calculateDevicePriority(device)
    }))
    .sort((a, b) => (b as any).priority - (a as any).priority);
}

function calculateDevicePriority(device: PredicateDevice): number {
  let priority = 0;
  
  // Prefer newer devices (more likely to have detailed documentation)
  if (device.kNumber && device.kNumber > 'K200000') priority += 30;
  else if (device.kNumber && device.kNumber > 'K100000') priority += 20;
  else priority += 10;
  
  // Prefer Class II devices (most use 510k pathway)
  if (device.deviceClass === '2') priority += 25;
  else if (device.deviceClass === '3') priority += 15;
  
  // Prefer devices with detailed statements
  if (device.statementOrSummary && device.statementOrSummary.length > 500) priority += 20;
  else if (device.statementOrSummary && device.statementOrSummary.length > 200) priority += 10;
  
  // Prefer devices from established manufacturers
  if (device.applicant && device.applicant.length > 15) priority += 10;
  
  // Product codes with rich predicate history
  const richPredicateCodes = ['LMH', 'GCX', 'LZI', 'KGI', 'NHA', 'MQV', 'DTB', 'DZE'];
  if (device.productCode && richPredicateCodes.includes(device.productCode)) priority += 15;
  
  return priority;
}

// Generate enhanced insights based on the new document analysis
function generateEnhancedInsights(enhancedDoc: any, trail: any, device: any): string[] {
  const insights: string[] = [];
  
  // Content quality insights
  if (enhancedDoc.source === 'pdf') {
    insights.push('📄 Full PDF document analyzed for comprehensive predicate extraction');
  } else if (enhancedDoc.contentLength < 50) {
    insights.push('⚠️ Limited document content - using fallback analysis strategies');
  }
  
  // Predicate analysis insights
  if (enhancedDoc.predicateKNumbers && enhancedDoc.predicateKNumbers.length > 0) {
    insights.push(`🔗 Identified ${enhancedDoc.predicateKNumbers.length} predicate reference${enhancedDoc.predicateKNumbers.length > 1 ? 's' : ''}`);
    
    if (enhancedDoc.predicateAnalysis?.explicitReferences?.length > 0) {
      insights.push(`✅ ${enhancedDoc.predicateAnalysis.explicitReferences.length} explicit predicate${enhancedDoc.predicateAnalysis.explicitReferences.length > 1 ? 's' : ''} found in document`);
    }
    
    if (enhancedDoc.predicateAnalysis?.similarDevices?.length > 0) {
      insights.push(`🎯 ${enhancedDoc.predicateAnalysis.similarDevices.length} similar device${enhancedDoc.predicateAnalysis.similarDevices.length > 1 ? 's' : ''} identified as backup options`);
    }
  } else {
    insights.push('🔍 No explicit predicates found in available documentation');
  }
  
  // Confidence-based insights
  if (enhancedDoc.confidence >= 70) {
    insights.push('🎯 High confidence analysis - strong predicate trail foundation');
  } else if (enhancedDoc.confidence >= 40) {
    insights.push('⚡ Moderate confidence - good starting point for predicate strategy');
  } else {
    insights.push('🔍 Lower confidence - consider manual document review and competitor analysis');
  }
  
  // Intended use insights
  if (enhancedDoc.intendedUse && enhancedDoc.intendedUse !== 'Not specified') {
    insights.push(`📋 Intended use documented: "${enhancedDoc.intendedUse}"`);
  }
  
  // Trail depth insights
  if (trail && trail.trailDepth > 0) {
    insights.push(`📊 Trail depth: ${trail.trailDepth} levels of predicate relationships mapped`);
    
    if (trail.upstreamPredicates?.length > 3) {
      insights.push('🏗️ Rich predicate history indicates well-established regulatory pathway');
    }
    
    if (trail.downstreamReferences?.length > 2) {
      insights.push('🌟 Device has been used as predicate by others - validates regulatory approach');
    }
  }
  
  return insights;
}