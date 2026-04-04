// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentSearchParams {
  query?: string;
  deviceClass?: string;
  productCode?: string;
  applicant?: string;
  dateFrom?: string;
  dateTo?: string;
  searchType: 'fulltext' | 'predicate' | 'similarity';
  kNumber?: string;
  limit?: number;
  skip?: number;
}

// Extract K-number references from text
function extractKNumbers(text: string): string[] {
  if (!text) return [];
  const kNumberPattern = /K\d{2}[-]?\d{4,5}/gi;
  const matches = text.match(kNumberPattern) || [];
  return matches.map(k => k.replace('-', '').toUpperCase());
}

// Calculate text similarity (simple implementation)
function calculateSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  
  return intersection.length / union.length;
}

// Build regulatory pattern analysis
function analyzeRegulatoryPatterns(devices: any[]): any[] {
  const patterns = new Map<string, { count: number; examples: string[] }>();
  
  devices.forEach(device => {
    if (device.statement_or_summary) {
      const text = device.statement_or_summary.toLowerCase();
      
      // Common regulatory phrases
      const regulatoryPhrases = [
        'substantial equivalence',
        'predicate device',
        'same intended use',
        'similar technological characteristics',
        'biocompatibility',
        'performance testing',
        'clinical data',
        'risk analysis'
      ];
      
      regulatoryPhrases.forEach(phrase => {
        if (text.includes(phrase)) {
          const pattern = patterns.get(phrase) || { count: 0, examples: [] };
          pattern.count++;
          if (pattern.examples.length < 3) {
            pattern.examples.push(device.k_number || 'Unknown');
          }
          patterns.set(phrase, pattern);
        }
      });
    }
  });
  
  return Array.from(patterns.entries()).map(([pattern, data]) => ({
    pattern,
    frequency: data.count,
    examples: data.examples
  }));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: DocumentSearchParams = await req.json();
    
    console.log('FDA predicate search request:', params);

    // Build FDA API query
    const fdaParams = new URLSearchParams();
    fdaParams.append('limit', Math.min(params.limit || 100, 1000).toString());
    fdaParams.append('skip', (params.skip || 0).toString());

    const searchTerms: string[] = [];

    // Handle different search types
    switch (params.searchType) {
      case 'fulltext':
        if (params.query) {
          // Use quoted phrase search for multi-word queries, simple term for single words
          const queryTerms = params.query.trim();
          if (queryTerms.includes(' ')) {
            searchTerms.push(`(device_name:"${queryTerms}" OR statement_or_summary:"${queryTerms}")`);
          } else {
            searchTerms.push(`(device_name:${queryTerms} OR statement_or_summary:${queryTerms})`);
          }
        }
        break;
        
      case 'predicate':
        if (params.kNumber) {
          // Find devices that reference this K-number as predicate
          searchTerms.push(`statement_or_summary:"${params.kNumber}"`);
        }
        break;
        
      case 'similarity':
        if (params.query) {
          // Extract key terms for similarity search
          const keywords = params.query.toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 3)
            .slice(0, 5); // Limit to top 5 keywords
          
          if (keywords.length > 0) {
            const keywordTerms = keywords.map(keyword => 
              `(device_name:"${keyword}" OR statement_or_summary:"${keyword}")`
            );
            searchTerms.push(`(${keywordTerms.join(' OR ')})`);
          }
        }
        break;
    }

    // Add additional filters - but make them optional if no main search term
    const additionalFilters: string[] = [];
    
    if (params.deviceClass) {
      additionalFilters.push(`openfda.device_class:${params.deviceClass}`);
    }
    
    if (params.productCode) {
      // Product code search - can be standalone
      additionalFilters.push(`product_code:${params.productCode.toUpperCase()}`);
    }
    
    if (params.applicant) {
      additionalFilters.push(`applicant:*${params.applicant}*`);
    }

    // Date range filtering
    if (params.dateFrom || params.dateTo) {
      const fromDate = params.dateFrom || '19760101';
      const toDate = params.dateTo || new Date().toISOString().slice(0, 10).replace(/-/g, '');
      additionalFilters.push(`decision_date:[${fromDate} TO ${toDate}]`);
    }

    // Combine search terms and filters
    let finalSearchTerms: string[] = [];
    
    if (searchTerms.length > 0) {
      // Main search exists, combine with filters
      finalSearchTerms = [...searchTerms, ...additionalFilters];
    } else if (additionalFilters.length > 0) {
      // No main search, use filters alone
      finalSearchTerms = additionalFilters;
    } else {
      // Default fallback search
      finalSearchTerms.push('device_name:*medical*');
    }

    const searchQuery = finalSearchTerms.join(' AND ');
    fdaParams.append('search', searchQuery);

    console.log('FDA predicate search query:', searchQuery);

    // Call FDA API
    const fdaApiUrl = `https://api.fda.gov/device/510k.json?${fdaParams.toString()}`;
    const response = await fetch(fdaApiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MedTech-Predicate-Analysis/1.0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('FDA API returned non-200:', response.status, errorText);
      
      // FDA API returns 404 when no results match - treat as empty results, not an error
      if (response.status === 404) {
        return new Response(JSON.stringify({
          success: true,
          data: {
            results: [],
            totalResults: 0,
            intelligence: {
              commonPredicates: [],
              regulatoryPatterns: [],
              predicateRecommendations: [],
              timelineAnalysis: []
            }
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`FDA API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('FDA API response received:', {
      totalResults: data.meta?.results?.total || 0,
      returnedResults: data.results?.length || 0
    });

    // Process results with predicate analysis
    const processedResults = (data.results || []).map((device: any) => {
      const predicateRefs = extractKNumbers(device.statement_or_summary || '');
      const relevanceScore = params.searchType === 'similarity' && params.query
        ? calculateSimilarity(params.query, device.statement_or_summary || '')
        : 1.0;

      // Extract meaningful content snippet
      const statement = device.statement_or_summary || '';
      const matchedContent = statement.length > 200 
        ? statement.substring(0, 200) + '...'
        : statement;

      return {
        device: {
          kNumber: device.k_number,
          deviceName: device.device_name,
          applicant: device.applicant,
          productCode: device.product_code,
          deviceClass: device.device_class,
          decisionDate: device.decision_date,
          statementOrSummary: device.statement_or_summary,
          documentUrl: device.k_number 
            ? `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=${device.k_number}`
            : undefined
        },
        relevanceScore,
        matchedContent,
        predicateReferences: predicateRefs.map(kNum => ({
          sourceKNumber: device.k_number,
          predicateKNumber: kNum,
          confidence: 0.8,
          extractedText: '',
          referenceType: 'explicit' as const
        }))
      };
    });

    // Sort by relevance for similarity searches
    if (params.searchType === 'similarity') {
      processedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    // Generate document intelligence
    const commonPredicates = new Map<string, { count: number; deviceName: string }>();
    const timelineData = new Map<number, { approvals: number; totalProcessingTime: number }>();

    processedResults.forEach(result => {
      // Track common predicates
      result.predicateReferences.forEach(ref => {
        const existing = commonPredicates.get(ref.predicateKNumber) || { count: 0, deviceName: '' };
        existing.count++;
        commonPredicates.set(ref.predicateKNumber, existing);
      });

      // Track timeline data
      if (result.device.decisionDate) {
        const year = new Date(result.device.decisionDate).getFullYear();
        if (year > 1975) { // Valid year
          const yearData = timelineData.get(year) || { approvals: 0, totalProcessingTime: 0 };
          yearData.approvals++;
          timelineData.set(year, yearData);
        }
      }
    });

    const intelligence = {
      commonPredicates: Array.from(commonPredicates.entries())
        .map(([kNumber, data]) => ({ kNumber, count: data.count, deviceName: data.deviceName }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      regulatoryPatterns: analyzeRegulatoryPatterns(data.results || []),
      predicateRecommendations: [], // Would need more sophisticated ML analysis
      timelineAnalysis: Array.from(timelineData.entries())
        .map(([year, data]) => ({
          year,
          approvals: data.approvals,
          avgProcessingTime: 180 // Placeholder - would need actual calculation
        }))
        .sort((a, b) => a.year - b.year)
    };

    const result = {
      success: true,
      data: {
        results: processedResults,
        totalResults: data.meta?.results?.total || processedResults.length,
        intelligence
      }
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fda-predicate-search function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});