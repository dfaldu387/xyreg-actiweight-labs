import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId } = await req.json();
    
    if (!companyId) {
      throw new Error('Company ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all processed reports for the company
    const { data: reports, error: reportsError } = await supabase
      .from('market_reports')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'Processed');

    if (reportsError) {
      console.error('[market-trends-analyzer] Error fetching reports:', reportsError);
      throw reportsError;
    }

    if (!reports || reports.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          totalReports: 0,
          trends: [],
          insights: [],
          riskPatterns: [],
          opportunities: []
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Analyze trends across all reports
    const analysisResult = {
      totalReports: reports.length,
      trends: extractMarketTrends(reports),
      insights: generateInsights(reports),
      riskPatterns: identifyRiskPatterns(reports),
      opportunities: findOpportunities(reports)
    };

    console.log('[market-trends-analyzer] Analysis completed:', {
      companyId,
      totalReports: reports.length,
      trendsFound: analysisResult.trends.length
    });

    return new Response(JSON.stringify({
      success: true,
      data: analysisResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[market-trends-analyzer] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractMarketTrends(reports: any[]) {
  const trends = [];
  
  // Analyze market size data trends
  const marketSizes = reports
    .filter(r => r.market_size_data)
    .map(r => ({
      date: r.report_date,
      size: r.market_size_data.market_value || r.market_size_data.size,
      source: r.source
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (marketSizes.length > 1) {
    const growth = calculateGrowthTrend(marketSizes);
    trends.push({
      type: 'market_growth',
      title: 'Market Size Trend',
      description: `Market showing ${growth.direction} trend with ${Math.abs(growth.rate)}% change`,
      confidence: growth.confidence,
      dataPoints: marketSizes.length
    });
  }

  // Analyze competitive landscape patterns
  const competitorMentions = extractCompetitorPatterns(reports);
  if (competitorMentions.length > 0) {
    trends.push({
      type: 'competitive_landscape',
      title: 'Competitive Activity',
      description: `${competitorMentions.length} key competitors frequently mentioned across reports`,
      confidence: 0.8,
      topCompetitors: competitorMentions.slice(0, 5)
    });
  }

  return trends;
}

function generateInsights(reports: any[]) {
  const insights = [];
  
  // Common themes analysis
  const commonThemes = extractCommonThemes(reports);
  if (commonThemes.length > 0) {
    insights.push({
      type: 'market_themes',
      title: 'Recurring Market Themes',
      content: `Key themes identified: ${commonThemes.join(', ')}`,
      reportCount: reports.length
    });
  }

  // Strategic recommendations consolidation
  const strategicRecs = reports
    .filter(r => r.strategic_recommendations && r.strategic_recommendations.length > 0)
    .flatMap(r => r.strategic_recommendations);

  if (strategicRecs.length > 0) {
    insights.push({
      type: 'strategic_recommendations',
      title: 'Consolidated Strategic Recommendations',
      content: `${strategicRecs.length} strategic recommendations identified across reports`,
      topRecommendations: strategicRecs.slice(0, 3)
    });
  }

  return insights;
}

function identifyRiskPatterns(reports: any[]) {
  const riskPatterns = [];
  
  // Look for risk-related keywords in key findings
  const riskKeywords = ['risk', 'threat', 'challenge', 'barrier', 'concern', 'issue'];
  const riskMentions = reports
    .filter(r => r.key_findings)
    .flatMap(r => r.key_findings.filter(finding => 
      riskKeywords.some(keyword => 
        finding.toLowerCase().includes(keyword)
      )
    ));

  if (riskMentions.length > 0) {
    riskPatterns.push({
      type: 'regulatory_risks',
      title: 'Regulatory & Compliance Risks',
      frequency: riskMentions.length,
      examples: riskMentions.slice(0, 3)
    });
  }

  return riskPatterns;
}

function findOpportunities(reports: any[]) {
  const opportunities = [];
  
  // Look for opportunity-related keywords
  const opportunityKeywords = ['opportunity', 'growth', 'potential', 'expansion', 'emerging'];
  const opportunityMentions = reports
    .filter(r => r.key_findings || r.strategic_recommendations)
    .flatMap(r => [
      ...(r.key_findings || []),
      ...(r.strategic_recommendations || [])
    ])
    .filter(text => 
      opportunityKeywords.some(keyword => 
        text.toLowerCase().includes(keyword)
      )
    );

  if (opportunityMentions.length > 0) {
    opportunities.push({
      type: 'market_opportunities',
      title: 'Market Growth Opportunities',
      count: opportunityMentions.length,
      examples: opportunityMentions.slice(0, 3)
    });
  }

  return opportunities;
}

function calculateGrowthTrend(marketSizes: any[]) {
  if (marketSizes.length < 2) return { direction: 'stable', rate: 0, confidence: 0 };
  
  const first = marketSizes[0].size;
  const last = marketSizes[marketSizes.length - 1].size;
  const rate = ((last - first) / first) * 100;
  
  return {
    direction: rate > 5 ? 'upward' : rate < -5 ? 'downward' : 'stable',
    rate: Math.round(rate * 100) / 100,
    confidence: marketSizes.length > 3 ? 0.9 : 0.7
  };
}

function extractCompetitorPatterns(reports: any[]) {
  // Simple competitor extraction - look for capitalized company names
  const competitors = new Set();
  const companyPattern = /\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\s+(?:Inc|Corp|Ltd|LLC|AG|GmbH)\b/g;
  
  reports.forEach(report => {
    const text = [
      report.executive_summary,
      ...(report.key_findings || []),
      ...(report.strategic_recommendations || [])
    ].join(' ');
    
    const matches = text.match(companyPattern) || [];
    matches.forEach(company => competitors.add(company));
  });
  
  return Array.from(competitors).slice(0, 10);
}

function extractCommonThemes(reports: any[]) {
  // Simple theme extraction - look for common buzzwords
  const themes = ['AI', 'digital transformation', 'sustainability', 'remote work', 'cloud computing', 'cybersecurity'];
  const foundThemes = [];
  
  const allText = reports.map(r => [
    r.executive_summary,
    ...(r.key_findings || []),
    ...(r.strategic_recommendations || [])
  ].join(' ')).join(' ').toLowerCase();
  
  themes.forEach(theme => {
    if (allText.includes(theme.toLowerCase())) {
      foundThemes.push(theme);
    }
  });
  
  return foundThemes;
}