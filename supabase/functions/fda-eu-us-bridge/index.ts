// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const FDA_API_BASE = 'https://api.fda.gov';

interface EUUSBridge {
  eudamedDevice: any;
  suggestedUSPredicates: Array<{ kNumber: string; similarity: number; reasoning: string }>;
  regulatoryGaps: string[];
  marketEntryStrategy: {
    recommendedPathway: string;
    estimatedTimeline: string;
    keyConsiderations: string[];
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eudamedDeviceId } = await req.json();

    if (!eudamedDeviceId) {
      return new Response(
        JSON.stringify({ success: false, error: 'EUDAMED device ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating EU-US bridge for EUDAMED device: ${eudamedDeviceId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const bridge = await generateEUUSBridge(supabase, eudamedDeviceId);

    return new Response(
      JSON.stringify({ success: true, data: bridge }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating EU-US bridge:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to generate EU-US bridge' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateEUUSBridge(supabase: any, eudamedDeviceId: string): Promise<EUUSBridge> {
  // Fetch EUDAMED device details
  const { data: eudamedDevice, error: eudamedError } = await supabase
    .from('eudamed.medical_devices')
    .select('*')
    .eq('udi_di', eudamedDeviceId)
    .single();

  if (eudamedError || !eudamedDevice) {
    throw new Error(`EUDAMED device not found: ${eudamedDeviceId}`);
  }

  console.log(`Found EUDAMED device: ${eudamedDevice.device_name || eudamedDevice.trade_names}`);

  // Search for similar US devices
  const suggestedUSPredicates = await findSimilarUSDevices(eudamedDevice);

  // Analyze regulatory gaps
  const regulatoryGaps = analyzeRegulatoryGaps(eudamedDevice);

  // Generate market entry strategy
  const marketEntryStrategy = generateMarketEntryStrategy(eudamedDevice, suggestedUSPredicates);

  return {
    eudamedDevice,
    suggestedUSPredicates,
    regulatoryGaps,
    marketEntryStrategy
  };
}

async function findSimilarUSDevices(eudamedDevice: any): Promise<Array<{ kNumber: string; similarity: number; reasoning: string }>> {
  try {
    const deviceName = eudamedDevice.device_name || eudamedDevice.trade_names || '';
    const searchTerms = generateSearchTerms(deviceName, eudamedDevice);

    const suggestions: Array<{ kNumber: string; similarity: number; reasoning: string }> = [];

    for (const term of searchTerms.slice(0, 3)) { // Limit to avoid rate limits
      try {
        const searchUrl = `${FDA_API_BASE}/device/510k.json?search=device_name:*${encodeURIComponent(term)}*&limit=5`;
        
        const response = await fetch(searchUrl);
        if (!response.ok) continue;

        const data = await response.json();
        
        if (data.results) {
          for (const result of data.results) {
            const similarity = calculateSimilarity(eudamedDevice, result);
            const reasoning = generateReasoningText(eudamedDevice, result, similarity);
            
            if (similarity > 0.3) { // Only include reasonably similar devices
              suggestions.push({
                kNumber: result.k_number,
                similarity,
                reasoning
              });
            }
          }
        }
      } catch (searchError) {
        console.error(`Error searching for term "${term}":`, searchError);
      }
    }

    // Sort by similarity and return top 10
    return suggestions
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);

  } catch (error) {
    console.error('Error finding similar US devices:', error);
    return [];
  }
}

function generateSearchTerms(deviceName: string, eudamedDevice: any): string[] {
  const terms = new Set<string>();
  
  // Add device name terms
  if (deviceName) {
    const words = deviceName.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    words.forEach(word => terms.add(word));
    
    // Add device name as phrase
    if (deviceName.length > 5) {
      terms.add(deviceName.toLowerCase());
    }
  }

  // Add trade names
  if (eudamedDevice.trade_names) {
    const tradeWords = eudamedDevice.trade_names.toLowerCase().split(/[;,\s]+/).filter((w: string) => w.length > 3);
    tradeWords.forEach((word: string) => terms.add(word));
  }

  // Add technical terms based on EMDN codes
  const nomenclatureCodes = eudamedDevice.nomenclature_codes;
  if (nomenclatureCodes) {
    // Add generic medical device terms
    terms.add('medical device');
    terms.add('surgical');
  }

  return Array.from(terms).slice(0, 10); // Limit search terms
}

function calculateSimilarity(eudamedDevice: any, fdaDevice: any): number {
  let similarity = 0;
  let factors = 0;

  // Device name similarity
  const euName = (eudamedDevice.device_name || '').toLowerCase();
  const usName = (fdaDevice.device_name || '').toLowerCase();
  
  if (euName && usName) {
    const nameWords = euName.split(/\s+/);
    const usWords = usName.split(/\s+/);
    const commonWords = nameWords.filter(word => usWords.some(usWord => usWord.includes(word) || word.includes(usWord)));
    similarity += (commonWords.length / Math.max(nameWords.length, usWords.length)) * 0.4;
    factors += 0.4;
  }

  // Risk class similarity (approximate)
  const euRisk = eudamedDevice.risk_class;
  const usClass = fdaDevice.device_class;
  
  if (euRisk && usClass) {
    // Rough mapping: EU Class I -> US Class I, EU Class IIa/IIb -> US Class II, EU Class III -> US Class III
    const euClassMapped = euRisk.includes('I') ? (euRisk === 'Class I' ? '1' : '2') : '3';
    if (euClassMapped === usClass) {
      similarity += 0.3;
    }
    factors += 0.3;
  }

  // Organization similarity (manufacturer)
  const euOrg = (eudamedDevice.organization || '').toLowerCase();
  const usApplicant = (fdaDevice.applicant || '').toLowerCase();
  
  if (euOrg && usApplicant) {
    if (euOrg.includes(usApplicant) || usApplicant.includes(euOrg)) {
      similarity += 0.3;
    }
    factors += 0.3;
  }

  return factors > 0 ? similarity / factors : 0;
}

function generateReasoningText(eudamedDevice: any, fdaDevice: any, similarity: number): string {
  const reasons = [];
  
  if (similarity > 0.7) {
    reasons.push('High similarity in device name and characteristics');
  } else if (similarity > 0.5) {
    reasons.push('Moderate similarity in key attributes');
  } else {
    reasons.push('Some similarity detected');
  }

  const euName = eudamedDevice.device_name || eudamedDevice.trade_names || '';
  const usName = fdaDevice.device_name || '';
  
  if (euName && usName) {
    const commonTerms = findCommonTerms(euName, usName);
    if (commonTerms.length > 0) {
      reasons.push(`Common terms: ${commonTerms.join(', ')}`);
    }
  }

  if (eudamedDevice.organization && fdaDevice.applicant) {
    if (eudamedDevice.organization.toLowerCase().includes(fdaDevice.applicant.toLowerCase()) ||
        fdaDevice.applicant.toLowerCase().includes(eudamedDevice.organization.toLowerCase())) {
      reasons.push('Same or related manufacturer');
    }
  }

  return reasons.join('. ') + '.';
}

function findCommonTerms(text1: string, text2: string): string[] {
  const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
  return words1.filter(w1 => words2.some(w2 => w1.includes(w2) || w2.includes(w1))).slice(0, 3);
}

function analyzeRegulatoryGaps(eudamedDevice: any): string[] {
  const gaps = [];

  // Risk class considerations
  if (eudamedDevice.risk_class) {
    if (eudamedDevice.risk_class.includes('III')) {
      gaps.push('High-risk device may require PMA pathway instead of 510(k)');
    } else if (eudamedDevice.risk_class.includes('IIb')) {
      gaps.push('Class IIb device may face stricter US requirements');
    }
  }

  // Clinical data requirements
  if (eudamedDevice.risk_class && (eudamedDevice.risk_class.includes('IIb') || eudamedDevice.risk_class.includes('III'))) {
    gaps.push('Clinical data requirements may differ between EU and US');
  }

  // Labeling and marking
  gaps.push('FDA labeling requirements differ from EU MDR requirements');
  
  // Quality system
  gaps.push('FDA QSR compliance required (differs from ISO 13485)');

  // Unique device identification
  if (!eudamedDevice.udi_di) {
    gaps.push('FDA UDI system compliance required');
  }

  return gaps;
}

function generateMarketEntryStrategy(eudamedDevice: any, predicates: Array<any>): {
  recommendedPathway: string;
  estimatedTimeline: string;
  keyConsiderations: string[];
} {
  let pathway = '510(k) Clearance';
  let timeline = '3-6 months';
  const considerations = [];

  // Determine pathway based on risk class and predicates
  if (eudamedDevice.risk_class) {
    if (eudamedDevice.risk_class.includes('III')) {
      pathway = 'PMA (Premarket Approval)';
      timeline = '12-18 months';
      considerations.push('PMA requires clinical studies and extensive documentation');
    } else if (eudamedDevice.risk_class.includes('IIb') && predicates.length === 0) {
      pathway = 'De Novo Classification';
      timeline = '8-12 months';
      considerations.push('Novel device may require De Novo pathway');
    }
  }

  // Add general considerations
  considerations.push('Establish FDA registration and device listing');
  considerations.push('Implement FDA QSR (21 CFR 820)');
  considerations.push('Prepare FDA-compliant labeling');

  if (predicates.length > 0) {
    considerations.push(`${predicates.length} potential predicate devices identified`);
  } else {
    considerations.push('Limited predicate devices found - consider De Novo pathway');
  }

  return {
    recommendedPathway: pathway,
    estimatedTimeline: timeline,
    keyConsiderations: considerations
  };
}