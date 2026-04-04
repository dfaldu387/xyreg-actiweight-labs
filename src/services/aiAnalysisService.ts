import { supabase } from '@/integrations/supabase/client';

export interface AnalysisConfig {
  marketSizing: boolean;
  competitiveLandscape: boolean;
  growthOpportunities: boolean;
  regulatoryHurdles: boolean;
  adjacentMarkets: boolean;
  swotAnalysis: boolean;
  customQuestions?: string;
}

export interface AIAnalysisRequest {
  emdnCode?: string;
  fdaProductCode?: string;
  companyId: string;
  analysisData: any;
  config?: AnalysisConfig;
}

export interface AIAnalysisResponse {
  success: boolean;
  analysis?: string;
  metadata?: {
    emdnCode?: string;
    fdaProductCode?: string;
    isGlobalAnalysis: boolean;
    totalCompetitors: number;
    organizationCount: number;
    marketConcentration: number;
    competitiveIntensity: number;
    marketSources?: {
      eu: number;
      us: number;
    };
    crossMarketInsights?: {
      global_competitors: any[];
      market_overlap: number;
      regulatory_complexity_score: number;
    };
    generatedAt: string;
  };
  error?: string;
  errorType?: string;
}

export class AIAnalysisService {
  static async generateCompetitiveAnalysis(
    request: AIAnalysisRequest
  ): Promise<AIAnalysisResponse> {
    try {
      console.log('[AIAnalysisService] Generating competitive analysis:', {
        hasEmdnCode: !!request.emdnCode,
        hasFdaProductCode: !!request.fdaProductCode,
        companyId: request.companyId,
        totalCompetitors: request.analysisData?.totalCompetitors
      });

      const { data, error } = await supabase.functions.invoke('competitive-analysis-ai', {
        body: request
      });

      if (error) {
        console.error('[AIAnalysisService] Error calling edge function:', error);
        throw error;
      }

      if (!data?.success) {
        console.error('[AIAnalysisService] Analysis failed:', data?.error);
        throw new Error(data?.error || 'AI analysis failed');
      }

      console.log('[AIAnalysisService] Analysis completed successfully');
      return data as AIAnalysisResponse;
    } catch (error) {
      console.error('[AIAnalysisService] Service error:', error);
      throw error;
    }
  }
}

export const aiAnalysisService = new AIAnalysisService();