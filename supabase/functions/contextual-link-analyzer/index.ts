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
    const { reportId, companyId } = await req.json();
    
    if (!reportId || !companyId) {
      throw new Error('Report ID and Company ID are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the report
    const { data: report, error: reportError } = await supabase
      .from('market_reports')
      .select('*')
      .eq('id', reportId)
      .eq('company_id', companyId)
      .single();

    if (reportError || !report) {
      console.error('[contextual-link-analyzer] Error fetching report:', reportError);
      throw new Error('Report not found');
    }

    // Generate contextual suggestions
    const suggestions = await generateSuggestions(report, supabase);

    // Store suggestions in database
    for (const suggestion of suggestions) {
      const { error: insertError } = await supabase
        .from('contextual_suggestions')
        .insert({
          report_id: reportId,
          company_id: companyId,
          suggestion_type: suggestion.type,
          title: suggestion.title,
          description: suggestion.description,
          target_module: suggestion.targetModule,
          suggested_action: suggestion.action,
          confidence_score: suggestion.confidence
        });

      if (insertError) {
        console.error('[contextual-link-analyzer] Error storing suggestion:', insertError);
      }
    }

    console.log('[contextual-link-analyzer] Generated suggestions:', {
      reportId,
      suggestionsCount: suggestions.length
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        reportId,
        suggestions
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[contextual-link-analyzer] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateSuggestions(report: any, supabase: any) {
  const suggestions = [];
  
  // Analyze content for different types of suggestions
  const content = [
    report.executive_summary || '',
    ...(report.key_findings || []),
    ...(report.strategic_recommendations || [])
  ].join(' ').toLowerCase();

  // Product Requirement suggestions
  const productSuggestions = analyzeProductRequirements(content, report);
  suggestions.push(...productSuggestions);

  // Risk Management suggestions
  const riskSuggestions = analyzeRiskManagement(content, report);
  suggestions.push(...riskSuggestions);

  // Commercial Strategy suggestions
  const commercialSuggestions = analyzeCommercialStrategy(content, report);
  suggestions.push(...commercialSuggestions);

  // Activity/Task suggestions
  const activitySuggestions = analyzeActivities(content, report);
  suggestions.push(...activitySuggestions);

  return suggestions;
}

function analyzeProductRequirements(content: string, report: any) {
  const suggestions = [];
  
  // Look for feature-related keywords
  const featureKeywords = ['feature', 'functionality', 'capability', 'requirement', 'need', 'demand'];
  const needsKeywords = ['customer need', 'user need', 'market need', 'requirement'];
  
  if (featureKeywords.some(keyword => content.includes(keyword))) {
    suggestions.push({
      type: 'product_requirement',
      title: 'Create Product Requirement from Market Need',
      description: `This report identifies market needs that could translate to product requirements. Consider creating a new product requirement to address these needs.`,
      targetModule: 'Products',
      action: {
        type: 'create_product_requirement',
        prefill: {
          source: 'Market Intelligence',
          reportTitle: report.title,
          reportId: report.id,
          justification: `Based on market intelligence report: ${report.title}`
        }
      },
      confidence: 0.75
    });
  }

  if (needsKeywords.some(keyword => content.includes(keyword))) {
    suggestions.push({
      type: 'product_requirement',
      title: 'Product Enhancement Opportunity',
      description: `Market research indicates enhancement opportunities for existing products. Review current product portfolio against these insights.`,
      targetModule: 'Products',
      action: {
        type: 'review_product_portfolio',
        context: 'market_intelligence',
        reportId: report.id
      },
      confidence: 0.8
    });
  }

  return suggestions;
}

function analyzeRiskManagement(content: string, report: any) {
  const suggestions = [];
  
  const riskKeywords = ['risk', 'threat', 'vulnerability', 'compliance', 'regulatory', 'challenge'];
  const regulatoryKeywords = ['regulation', 'fda', 'ce mark', 'iso', 'audit', 'compliance'];
  
  if (riskKeywords.some(keyword => content.includes(keyword))) {
    suggestions.push({
      type: 'risk_management',
      title: 'Add Market Risk to Risk Registry',
      description: `This report identifies potential market risks that should be documented in the risk management system.`,
      targetModule: 'Risk Management',
      action: {
        type: 'create_risk',
        prefill: {
          category: 'Market Risk',
          source: 'Market Intelligence',
          reportTitle: report.title,
          reportId: report.id,
          description: `Risk identified from market intelligence report: ${report.title}`
        }
      },
      confidence: 0.85
    });
  }

  if (regulatoryKeywords.some(keyword => content.includes(keyword))) {
    suggestions.push({
      type: 'risk_management',
      title: 'Regulatory Compliance Review',
      description: `Report mentions regulatory aspects that may require compliance review and risk assessment.`,
      targetModule: 'Risk Management',
      action: {
        type: 'create_compliance_review',
        reportId: report.id,
        urgency: 'medium'
      },
      confidence: 0.9
    });
  }

  return suggestions;
}

function analyzeCommercialStrategy(content: string, report: any) {
  const suggestions = [];
  
  const strategyKeywords = ['strategy', 'market opportunity', 'competitive advantage', 'positioning'];
  const marketKeywords = ['market size', 'market share', 'growth', 'expansion', 'target market'];
  
  if (strategyKeywords.some(keyword => content.includes(keyword))) {
    suggestions.push({
      type: 'commercial_strategy',
      title: 'Update Commercial Strategy',
      description: `This report contains strategic insights that should be incorporated into the commercial strategy planning.`,
      targetModule: 'Commercial Strategy',
      action: {
        type: 'update_commercial_strategy',
        reportId: report.id,
        category: 'market_intelligence_insights'
      },
      confidence: 0.8
    });
  }

  if (marketKeywords.some(keyword => content.includes(keyword))) {
    suggestions.push({
      type: 'commercial_strategy',
      title: 'Market Analysis Update',
      description: `Report provides market data that should be integrated into market analysis and forecasting.`,
      targetModule: 'Commercial Strategy',
      action: {
        type: 'update_market_analysis',
        reportId: report.id,
        dataType: 'market_intelligence'
      },
      confidence: 0.75
    });
  }

  return suggestions;
}

function analyzeActivities(content: string, report: any) {
  const suggestions = [];
  
  const actionKeywords = ['should', 'must', 'recommend', 'action', 'implement', 'develop'];
  const urgentKeywords = ['urgent', 'critical', 'immediate', 'priority'];
  
  if (report.strategic_recommendations && report.strategic_recommendations.length > 0) {
    suggestions.push({
      type: 'activity',
      title: 'Create Action Items from Recommendations',
      description: `This report contains ${report.strategic_recommendations.length} strategic recommendations that should be converted to actionable tasks.`,
      targetModule: 'Activities',
      action: {
        type: 'create_activities_from_recommendations',
        reportId: report.id,
        recommendations: report.strategic_recommendations.slice(0, 3), // Top 3
        priority: urgentKeywords.some(keyword => content.includes(keyword)) ? 'high' : 'medium'
      },
      confidence: 0.9
    });
  }

  if (actionKeywords.some(keyword => content.includes(keyword))) {
    suggestions.push({
      type: 'activity',
      title: 'Follow-up Actions Required',
      description: `Report identifies specific actions that require follow-up and implementation.`,
      targetModule: 'Activities',
      action: {
        type: 'create_followup_activity',
        reportId: report.id,
        category: 'market_intelligence_followup'
      },
      confidence: 0.7
    });
  }

  return suggestions;
}