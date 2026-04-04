import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisConfig {
  marketSizing: boolean;
  competitiveLandscape: boolean;
  growthOpportunities: boolean;
  regulatoryHurdles: boolean;
  adjacentMarkets: boolean;
  swotAnalysis: boolean;
  customQuestions?: string;
}

interface CompetitiveAnalysisRequest {
  emdnCode?: string;
  fdaProductCode?: string;
  companyId: string;
  config?: AnalysisConfig;
  analysisData: {
    totalCompetitors: number;
    competitorsByOrganization: Record<string, number>;
    competitorsByCountry: Record<string, number>;
    competitorsByRiskClass: Record<string, number>;
    marketInsights: any;
    // Combined analysis specific fields
    market_sources?: {
      eu: number;
      us: number;
    };
    cross_market_insights?: {
      global_competitors: any[];
      market_overlap: number;
      regulatory_complexity_score: number;
    };
  };
}

serve(async (req) => {
  console.log('🚀 Competitive Analysis AI function called');
  console.log('📋 Request method:', req.method);
  console.log('📍 Request URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📥 Parsing request body...');
    const requestBody = await req.json();
    console.log('📦 Request body parsed successfully');
    console.log('🔍 Request structure:', Object.keys(requestBody || {}));
    
    const { emdnCode, fdaProductCode, companyId, analysisData, config }: CompetitiveAnalysisRequest = requestBody;
    console.log('📊 Request data:', { 
      emdnCode, 
      fdaProductCode,
      companyId, 
      hasAnalysisData: !!analysisData,
      totalCompetitors: analysisData?.totalCompetitors,
      hasMarketSources: !!analysisData?.market_sources,
      hasCrossMarketInsights: !!analysisData?.cross_market_insights
    });

    if ((!emdnCode && !fdaProductCode) || !companyId || !analysisData) {
      console.error('❌ Missing required fields:', { 
        hasEmdnCode: !!emdnCode,
        hasFdaProductCode: !!fdaProductCode, 
        hasCompanyId: !!companyId, 
        hasAnalysisData: !!analysisData 
      });
      throw new Error('Either EMDN code or FDA product code, company ID, and analysis data are required');
    }

    console.log('🔧 Setting up Supabase client...');
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    console.log('🌐 Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      supabaseUrlLength: supabaseUrl?.length || 0,
      supabaseKeyLength: supabaseKey?.length || 0
    });

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables');
      throw new Error('Supabase configuration not found');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created successfully');

    console.log('🔑 Fetching API key for company:', companyId);
    // Get company's Gemini API key from the new company_api_keys table
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('company_api_keys')
      .select('encrypted_key')
      .eq('company_id', companyId)
      .eq('key_type', 'gemini')
      .single();

    console.log('🔐 API key query results:', {
      hasData: !!apiKeyData,
      hasError: !!apiKeyError,
      errorCode: apiKeyError?.code,
      errorMessage: apiKeyError?.message,
      dataKeys: apiKeyData ? Object.keys(apiKeyData) : null
    });

    if (apiKeyError) {
      console.error('❌ Database error fetching API key:', apiKeyError);
      throw new Error(`Database error: ${apiKeyError.message}`);
    }

    if (!apiKeyData?.encrypted_key) {
      console.error('❌ No API key found for company:', companyId);
      throw new Error('Gemini API key not configured for this company. Please add it in Company Settings → AI API Keys.');
    }

    console.log('🔓 Processing API key...');
    console.log('🔒 Raw encrypted key:', apiKeyData.encrypted_key);
    console.log('🔒 Key length:', apiKeyData.encrypted_key.length);
    console.log('🔒 Key starts with:', apiKeyData.encrypted_key.substring(0, 20));

    // Decrypt the API key (simple XOR decryption)
    const decryptApiKey = (encryptedKey: string): string => {
      console.log('🔓 Starting decryption process...');
      
      try {
        // If key looks like a plain text API key (starts with common prefixes), return as-is
        if (encryptedKey.startsWith('AIza') || encryptedKey.startsWith('sk-') || encryptedKey.startsWith('gpt-')) {
          console.log('✅ Key appears to be plain text, using directly');
          return encryptedKey;
        }

        console.log('🔄 Attempting XOR decryption...');
        const ENCRYPTION_KEY = 'medtech-api-key-2024';
        const base64Decoded = atob(encryptedKey);
        console.log('📦 Base64 decoded, length:', base64Decoded.length);
        
        const decrypted = Array.from(base64Decoded)
          .map((char, index) => 
            String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length))
          )
          .join('');
        
        console.log('🔓 Decryption completed');
        console.log('🔑 Decrypted key starts with:', decrypted.substring(0, 10));
        console.log('🔑 Decrypted key length:', decrypted.length);
        
        // Check if decrypted key looks valid
        if (decrypted.startsWith('AIza') || decrypted.length > 30) {
          console.log('✅ Decrypted key appears valid');
          return decrypted;
        } else {
          console.log('⚠️ Decrypted key doesn\'t look valid, using as-is');
          return encryptedKey;
        }
      } catch (error) {
        console.error('❌ Error during decryption:', error);
        console.log('🔄 Fallback: using key as-is');
        return encryptedKey;
      }
    };

    const geminiApiKey = decryptApiKey(apiKeyData.encrypted_key);
    console.log('🎯 Final API key starts with:', geminiApiKey.substring(0, 10));
    console.log('🎯 Final API key length:', geminiApiKey.length);

    console.log('🤖 Preparing AI analysis...');
    console.log('📈 Analysis data summary:', {
      totalCompetitors: analysisData.totalCompetitors,
      orgCount: Object.keys(analysisData.competitorsByOrganization).length,
      countryCount: Object.keys(analysisData.competitorsByCountry).length,
      riskClassCount: Object.keys(analysisData.competitorsByRiskClass).length
    });

    // Prepare data summary for AI analysis
    const topCompetitors = Object.entries(analysisData.competitorsByOrganization)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    const topCountries = Object.entries(analysisData.competitorsByCountry)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    const marketConcentration = calculateMarketConcentration(analysisData);
    const competitiveIntensity = calculateCompetitiveIntensity(analysisData);

    console.log('📊 Calculated metrics:', { marketConcentration, competitiveIntensity });

    // Determine analysis type and create appropriate prompt
    const isGlobalAnalysis = analysisData.market_sources && (analysisData.market_sources.eu > 0 && analysisData.market_sources.us > 0);
    const marketIdentifier = emdnCode && fdaProductCode ? `EMDN code ${emdnCode} and FDA product code ${fdaProductCode}` :
                           emdnCode ? `EMDN code ${emdnCode}` : `FDA product code ${fdaProductCode}`;
    
    let marketOverview = `**Market Overview:**
- Total competing products: ${analysisData.totalCompetitors}
- Number of organizations: ${Object.keys(analysisData.competitorsByOrganization).length}
- Market concentration index: ${marketConcentration}%
- Competitive intensity: ${competitiveIntensity}%`;

    // Add global market insights if available
    if (isGlobalAnalysis && analysisData.market_sources) {
      marketOverview += `
- EU market products: ${analysisData.market_sources.eu}
- US market products: ${analysisData.market_sources.us}
- Market overlap: ${analysisData.cross_market_insights?.market_overlap || 0}%
- Regulatory complexity score: ${analysisData.cross_market_insights?.regulatory_complexity_score || 0}/100`;
    }

    // Build dynamic prompt based on configuration
    const buildAnalysisPrompt = (config?: AnalysisConfig) => {
      let analysisAreas: string[] = [];
      
      if (config?.marketSizing) {
        analysisAreas.push("1. **Market Sizing & Revenue Forecast**: Estimate market size, growth potential, and revenue opportunities based on competitive density.");
      }
      
      if (config?.competitiveLandscape) {
        analysisAreas.push(`${analysisAreas.length + 1}. **Competitive Landscape & Key Players**: Detailed analysis of top competitors, their market positions, and competitive threats.`);
      }
      
      if (config?.growthOpportunities) {
        analysisAreas.push(`${analysisAreas.length + 1}. **Growth Opportunities & Unmet Needs**: Identify market gaps, underserved segments, and growth opportunities.`);
      }
      
      if (config?.regulatoryHurdles) {
        analysisAreas.push(`${analysisAreas.length + 1}. **Regulatory & Reimbursement Hurdles**: Analysis of regulatory barriers, approval pathways, and reimbursement challenges.`);
      }
      
      if (config?.adjacentMarkets) {
        analysisAreas.push(`${analysisAreas.length + 1}. **Adjacent Market Opportunities (Cross-Pollination)**: Explore related medical device categories and cross-market expansion opportunities.`);
      }
      
      if (config?.swotAnalysis) {
        analysisAreas.push(`${analysisAreas.length + 1}. **SWOT Analysis**: Comprehensive strengths, weaknesses, opportunities, and threats analysis for market entry.`);
      }
      
      // Default areas if none selected
      if (analysisAreas.length === 0) {
        analysisAreas = [
          "1. **Market Position Assessment**: How concentrated vs. fragmented is this market? What does this mean for new entrants?",
          "2. **Competitive Threats**: Which organizations pose the biggest competitive threats and why?",
          "3. **Market Opportunities**: What gaps or opportunities exist based on the data?",
          "4. **Strategic Recommendations**: Specific actionable recommendations for competing in this space."
        ];
      }
      
      // Add global strategy section for global analysis
      if (isGlobalAnalysis) {
        analysisAreas.push(`${analysisAreas.length + 1}. **Cross-Market Strategy**: Analysis of EU vs US market dynamics and recommendations for global expansion.`);
        analysisAreas.push(`${analysisAreas.length + 1}. **Regulatory Pathway**: Recommendations for navigating both EU (EUDAMED) and US (FDA) regulatory requirements.`);
      }
      
      // Add custom questions if provided
      let customSection = '';
      if (config?.customQuestions?.trim()) {
        customSection = `\n\n**Additional Analysis Requirements:**
${config.customQuestions}`;
      }
      
      return `You are a medtech competitive intelligence analyst. Analyze the following ${isGlobalAnalysis ? 'global (EU + US)' : 'regional'} competitive landscape data for ${marketIdentifier} and provide strategic insights.

FORMATTING REQUIREMENTS:
- Use clean section headers without asterisks or markdown
- For SWOT Analysis: Format as "STRENGTHS:|Strength 1|Strength 2|WEAKNESSES:|Weakness 1|Weakness 2|OPPORTUNITIES:|Opportunity 1|Opportunity 2|THREATS:|Threat 1|Threat 2|"
- Use bullet points with proper formatting
- No markdown syntax (**, *, etc.) - use plain text
- Keep content professional and structured

${marketOverview}

**Top Competitors by Product Count:**
${topCompetitors.map(([org, count]) => `- ${org}: ${count} products`).join('\n')}

**Geographic Distribution:**
${topCountries.map(([country, count]) => `- ${country}: ${count} products`).join('\n')}

**Risk Class Distribution:**
${Object.entries(analysisData.competitorsByRiskClass).map(([risk, count]) => `- ${risk}: ${count} products`).join('\n')}

Please provide a comprehensive competitive analysis focusing on the following areas:

${analysisAreas.join('\n\n')}${customSection}

Format your response with clear section headers and actionable insights for medtech product managers and strategists. Ensure all content is clean, professional, and ready for business presentation.`;
    };

    const prompt = buildAnalysisPrompt(config);

    console.log('📤 Making request to Gemini API...');
    console.log('🔗 API endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an expert medtech competitive intelligence analyst with deep knowledge of medical device markets, regulations, and competitive strategy.\n\n${prompt}`
              }
            ]
          }
        ]
      }),
    });

    console.log('📨 Gemini API response received');
    console.log('📊 Response status:', response.status);
    console.log('📊 Response statusText:', response.statusText);
    console.log('📊 Response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Gemini API error response:', errorData);
      throw new Error(`Gemini API error (${response.status}): ${response.statusText}`);
    }

    console.log('📋 Parsing Gemini response...');
    const data = await response.json();
    console.log('✅ Gemini response parsed successfully');
    console.log('🔍 Response structure:', Object.keys(data || {}));
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('❌ Unexpected Gemini response structure:', data);
      throw new Error('Invalid response structure from Gemini API');
    }

    const analysis = data.candidates[0].content.parts[0].text;
    console.log('📝 Analysis generated, length:', analysis?.length || 0);

    const responseData = { 
      success: true,
      analysis,
      metadata: {
        emdnCode,
        fdaProductCode,
        isGlobalAnalysis,
        totalCompetitors: analysisData.totalCompetitors,
        organizationCount: Object.keys(analysisData.competitorsByOrganization).length,
        marketConcentration,
        competitiveIntensity,
        marketSources: analysisData.market_sources,
        crossMarketInsights: analysisData.cross_market_insights,
        generatedAt: new Date().toISOString()
      }
    };

    console.log('✅ Returning successful response');
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error in competitive-analysis-ai function:', error);
    console.error('💥 Error name:', error.name);
    console.error('💥 Error message:', error.message);
    console.error('💥 Error stack:', error.stack);
    
    const errorResponse = { 
      success: false,
      error: error.message,
      errorType: error.name || 'UnknownError'
    };

    console.log('❌ Returning error response:', errorResponse);
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculateMarketConcentration(analysisData: any): number {
  const orgCounts = Object.values(analysisData.competitorsByOrganization) as number[];
  const totalDevices = analysisData.totalCompetitors;
  
  // Calculate top 3 organizations' market share
  const topThreeShare = orgCounts
    .sort((a, b) => b - a)
    .slice(0, 3)
    .reduce((sum, count) => sum + count, 0);
  
  return Math.round((topThreeShare / totalDevices) * 100);
}

function calculateCompetitiveIntensity(analysisData: any): number {
  const orgCount = Object.keys(analysisData.competitorsByOrganization).length;
  const avgDevicesPerOrg = analysisData.totalCompetitors / orgCount;
  
  // Higher number of organizations with fewer devices each = higher intensity
  const intensity = Math.min(100, (orgCount / avgDevicesPerOrg) * 20);
  return Math.round(intensity);
}