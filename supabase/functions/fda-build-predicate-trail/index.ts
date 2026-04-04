import { corsHeaders } from '../_shared/cors.ts';

const FDA_API_BASE = 'https://api.fda.gov';

interface PredicateDevice {
  kNumber: string;
  deviceName?: string;
  applicant?: string;
  productCode?: string;
  deviceClass?: string;
  decisionDate?: string;
  statementOrSummary?: string;
  documentUrl?: string;
}

interface PredicateTrail {
  deviceKNumber: string;
  targetDevice: PredicateDevice | null;
  upstreamPredicates: PredicateDevice[];
  downstreamReferences: PredicateDevice[];
  predicateChain: PredicateDevice[];
  relatedEudamedDevices: any[];
  trailDepth: number;
  searchDirection: 'both' | 'upstream' | 'downstream';
  hasUpstream: boolean;
  hasDownstream: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { kNumber, maxDepth = 3 } = await req.json();

    if (!kNumber) {
      return new Response(
        JSON.stringify({ success: false, error: 'K-number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Building predicate trail for ${kNumber} with max depth ${maxDepth}`);

    const trail = await buildPredicateTrail(kNumber, maxDepth);

    return new Response(
      JSON.stringify({ success: true, data: trail }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error building predicate trail:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to build predicate trail' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function buildPredicateTrail(kNumber: string, maxDepth: number): Promise<PredicateTrail> {
  console.log(`Building bidirectional predicate trail for ${kNumber}`);
  
  // Start with the target device
  const targetDevice = await fetchDeviceDetails(kNumber);
  if (!targetDevice) {
    return {
      deviceKNumber: kNumber,
      targetDevice: null,
      upstreamPredicates: [],
      downstreamReferences: [],
      predicateChain: [],
      relatedEudamedDevices: [],
      trailDepth: 0,
      searchDirection: 'both',
      hasUpstream: false,
      hasDownstream: false
    };
  }

  // Build upstream predicates (devices that this device references)
  const upstreamDevices = new Map<string, PredicateDevice>();
  const upstreamVisited = new Set<string>();
  
  await buildUpstreamTrail(targetDevice, maxDepth, 0, upstreamVisited, upstreamDevices);

  // Build downstream references (devices that reference this device)
  const downstreamDevices = new Map<string, PredicateDevice>();
  
  await buildDownstreamTrail(kNumber, maxDepth, downstreamDevices);

  // Create predicate chain from target through upstream devices
  const predicateChain = [targetDevice];
  const upstreamPredicates = Array.from(upstreamDevices.values());
  const downstreamReferences = Array.from(downstreamDevices.values());

  console.log(`Found ${upstreamPredicates.length} upstream and ${downstreamReferences.length} downstream devices`);

  return {
    deviceKNumber: kNumber,
    targetDevice,
    upstreamPredicates,
    downstreamReferences,
    predicateChain: [...predicateChain, ...upstreamPredicates],
    relatedEudamedDevices: [],
    trailDepth: upstreamPredicates.length + downstreamReferences.length,
    searchDirection: 'both',
    hasUpstream: upstreamPredicates.length > 0,
    hasDownstream: downstreamReferences.length > 0
  };
}

async function buildUpstreamTrail(
  device: PredicateDevice,
  maxDepth: number,
  currentDepth: number,
  visited: Set<string>,
  allDevices: Map<string, PredicateDevice>
): Promise<void> {
  if (currentDepth >= maxDepth || visited.has(device.kNumber)) {
    return;
  }

  visited.add(device.kNumber);
  console.log(`[Upstream] Processing ${device.kNumber} at depth ${currentDepth}`);

  // Fetch and parse full document content if possible
  const fullDocumentText = await fetchAndParseDocument(device);
  
  // Extract predicate K-numbers from enhanced document analysis
  const predicateKNumbers = extractPredicateKNumbers(fullDocumentText, device.kNumber);
  console.log(`[Upstream] Found ${predicateKNumbers.length} predicate references in ${device.kNumber}: [${predicateKNumbers.join(', ')}]`);
  
  // Process each predicate reference
  for (const predicateK of predicateKNumbers) {
    if (!visited.has(predicateK) && predicateK !== device.kNumber) {
      console.log(`[Upstream] Fetching predicate device: ${predicateK}`);
      
      try {
        const predicateDevice = await fetchDeviceDetails(predicateK);
        if (predicateDevice) {
          allDevices.set(predicateK, predicateDevice);
          console.log(`[Upstream] Successfully added ${predicateK} to trail`);
          
          // Recursively build upstream trail (limited depth to prevent infinite loops)
          if (currentDepth < maxDepth - 1) {
            await buildUpstreamTrail(
              predicateDevice,
              maxDepth,
              currentDepth + 1,
              visited,
              allDevices
            );
          }
        } else {
          console.log(`[Upstream] No device found for ${predicateK}`);
        }
      } catch (error) {
        console.error(`[Upstream] Error fetching ${predicateK}:`, error);
      }
    }
  }
}

async function buildDownstreamTrail(
  kNumber: string,
  maxDepth: number,
  allDevices: Map<string, PredicateDevice>
): Promise<void> {
  try {
    // Search for devices that reference this K-number in their statement/summary
    const searchUrl = `${FDA_API_BASE}/device/510k.json?search=statement_or_summary:"${kNumber}"&limit=50`;
    console.log(`Searching for downstream references: ${searchUrl}`);
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.log(`FDA API error for downstream search: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      console.log(`Found ${data.results.length} devices that reference ${kNumber}`);
      
      for (const device of data.results) {
        if (device.k_number && device.k_number !== kNumber) {
          const predicateDevice: PredicateDevice = {
            kNumber: device.k_number,
            deviceName: device.device_name,
            applicant: device.applicant,
            productCode: device.product_code,
            deviceClass: device.device_class,
            decisionDate: device.decision_date,
            statementOrSummary: device.statement_or_summary,
            documentUrl: `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=${device.k_number}`
          };
          
          allDevices.set(device.k_number, predicateDevice);
        }
      }
    } else {
      console.log(`No downstream references found for ${kNumber}`);
    }
  } catch (error) {
    console.error(`Error searching for downstream references for ${kNumber}:`, error);
    // Don't throw - just log and continue
  }
}

async function fetchDeviceDetails(kNumber: string): Promise<PredicateDevice | null> {
  try {
    const cleanKNumber = kNumber.replace(/[^A-Z0-9]/g, '');
    
    // Validate K-number format before making API call
    if (!/^K\d{5,6}$/.test(cleanKNumber)) {
      console.error(`Invalid K-number format: ${cleanKNumber}`);
      return null;
    }
    
    const searchUrl = `${FDA_API_BASE}/device/510k.json?search=k_number:${cleanKNumber}&limit=1`;
    
    console.log(`Fetching device details for ${cleanKNumber} from: ${searchUrl}`);
    
    // Test the URL by trying to fetch it first
    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.error(`FDA API error for ${cleanKNumber}: ${response.status} ${response.statusText}`);
      if (response.status === 404) {
        console.log(`[Device Fetch] No device found for ${cleanKNumber} in FDA database`);
      }
      return null;
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.log(`[Device Fetch] No results returned for ${cleanKNumber}`);
      return null;
    }

    const device = data.results[0];
    console.log(`[Device Fetch] Successfully found device: ${device.device_name} (${device.k_number})`);
    
    return {
      kNumber: device.k_number || cleanKNumber,
      deviceName: device.device_name,
      applicant: device.applicant,
      productCode: device.product_code,
      deviceClass: device.device_class,
      decisionDate: device.decision_date,
      statementOrSummary: device.statement_or_summary,
      documentUrl: `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=${cleanKNumber}`
    };

  } catch (error) {
    console.error(`Error fetching device ${kNumber}:`, error);
    return null;
  }
}

async function fetchAndParseDocument(device: PredicateDevice): Promise<string> {
  try {
    console.log(`[Document Fetch] Attempting to get enhanced content for ${device.kNumber}`);
    
    // Use the enhanced document parser for full content extraction
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/fda-enhanced-document-parser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({ kNumber: device.kNumber, forceRefresh: false })
    });
    
    if (response.ok) {
      const enhancedData = await response.json();
      if (enhancedData.fullContent && enhancedData.fullContent.length > 100) {
        console.log(`[Enhanced] Using enhanced content for ${device.kNumber} (${enhancedData.fullContent.length} chars vs ${(device.statementOrSummary || '').length} chars)`);
        
        // Log a preview of the enhanced content to help debug
        console.log(`[Enhanced Content Preview] ${enhancedData.fullContent.substring(0, 500)}...`);
        
        return enhancedData.fullContent;
      } else {
        console.log(`[Enhanced] Enhanced content too short for ${device.kNumber}, using fallback`);
      }
    } else {
      console.log(`[Enhanced] HTTP error ${response.status} for ${device.kNumber}`);
    }
  } catch (error) {
    console.log(`[Enhanced] Failed to get enhanced content for ${device.kNumber}: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // Fallback to original statement/summary with context analysis
  const text = device.statementOrSummary || '';
  console.log(`[Fallback] Using original content for ${device.kNumber} (${text.length} chars)`);
  
  if (text.length > 50) {
    return analyzeDocumentContext(text);
  }
  
  return text;
}

function analyzeDocumentContext(text: string): string {
  // Add context markers for better predicate extraction
  let enhancedText = text;
  
  // Mark sections that are likely to contain predicate information
  const predicateIndicators = [
    'predicate device',
    'substantially equivalent',
    'same intended use',
    'similar technological characteristics',
    'performance data',
    'clinical data',
    'biocompatibility',
    '510(k) number'
  ];
  
  predicateIndicators.forEach(indicator => {
    const regex = new RegExp(`(${indicator})`, 'gi');
    enhancedText = enhancedText.replace(regex, `[PREDICATE_CONTEXT]$1[/PREDICATE_CONTEXT]`);
  });
  
  return enhancedText;
}

function extractPredicateKNumbers(text: string, sourceKNumber?: string): string[] {
  if (!text) {
    console.log('[Predicate Extraction] No text provided');
    return [];
  }
  
  console.log(`[Predicate Extraction] Analyzing text of length ${text.length} for source: ${sourceKNumber}`);
  console.log(`[Predicate Extraction] Text preview: ${text.substring(0, 300)}...`);
  
  // Enhanced K-number validation function
  function isValidKNumber(kStr: string): boolean {
    const cleaned = kStr.toUpperCase().replace(/[^K0-9]/g, '');
    if (cleaned === sourceKNumber) return false;
    
    // Must be K followed by 5 or 6 digits
    if (!/^K\d{5,6}$/.test(cleaned)) return false;
    
    const numericPart = cleaned.substring(1);
    
    // Should not be all zeros or obviously invalid patterns
    if (numericPart === '000000' || numericPart === '00000') return false;
    if (numericPart.match(/^(\d)\1{4,5}$/)) return false; // All same digit
    
    return true;
  }
  
  // First, find all K-number patterns in the text with multiple strategies
  const kNumberPatterns = [
    /\bK\d{6}\b/gi,                    // Standard 6-digit: K123456
    /\bK\d{5}\b/gi,                    // 5-digit: K12345 (older format)
    /\bK\s?\d{6}\b/gi,                 // With optional space: K 123456
    /\bK\s?\d{5}\b/gi,                 // With optional space: K 12345
  ];
  
  const allMatches = new Set<string>();
  let allKNumbers: string[] = [];
  
  // Extract with multiple patterns
  kNumberPatterns.forEach((pattern, index) => {
    const matches = text.match(pattern) || [];
    console.log(`[Pattern ${index + 1}] "${pattern}" found ${matches.length} matches: ${matches.slice(0, 5).join(', ')}${matches.length > 5 ? '...' : ''}`);
    
    matches.forEach(match => {
      const cleaned = match.replace(/\s/g, '').toUpperCase();
      allKNumbers.push(cleaned);
    });
  });
  
  console.log(`[Direct K-Number Search] Total raw K-numbers found: ${allKNumbers.length}`);
  
  // Validate and filter K-numbers
  allKNumbers.forEach(kNumber => {
    console.log(`[Direct] Processing K-number: ${kNumber}, length: ${kNumber.length}, valid: ${isValidKNumber(kNumber)}`);
    
    if (isValidKNumber(kNumber)) {
      allMatches.add(kNumber);
      console.log(`[Direct] ✓ Added valid K-number: ${kNumber}`);
    } else {
      console.log(`[Direct] ✗ Skipped K-number: ${kNumber} (validation failed or same as source)`);
    }
  });
  
  // Enhanced contextual patterns for finding predicate references
  const contextualPatterns = [
    // Explicit predicate references
    /predicate\s+device[s]?\s*:?\s*K\d{5,6}/gi,
    /substantially\s+equivalent\s+to\s+K\d{5,6}/gi,
    /based\s+on\s+K\d{5,6}/gi,
    /compared\s+to\s+K\d{5,6}/gi,
    /similar\s+to\s+K\d{5,6}/gi,
    /equivalent\s+to\s+K\d{5,6}/gi,
    /cleared\s+(?:under|as)\s+K\d{5,6}/gi,
    
    // Document references
    /510\(k\)\s*(?:number|#)?\s*K\d{5,6}/gi,
    /clearance\s+K\d{5,6}/gi,
    /submission\s+K\d{5,6}/gi,
    
    // Contextual indicators
    /(?:reference|ref)\s+K\d{5,6}/gi,
    /K\d{5,6}\s+(?:was|is|has been)\s+cleared/gi,
    
    // Table/structured patterns
    /K-?Number[:\s]+K\d{5,6}/gi,
    /Predicate[:\s]+K\d{5,6}/gi,
    
    // Citation patterns
    /\(K\d{5,6}\)/gi,
    /\[K\d{5,6}\]/gi,
  ];
  
  let totalContextualMatches = 0;
  
  contextualPatterns.forEach((pattern, index) => {
    const matches = text.match(pattern) || [];
    console.log(`[Contextual Pattern ${index + 1}] Found ${matches.length} matches: ${matches.slice(0, 3).join(', ')}${matches.length > 3 ? '...' : ''}`);
    totalContextualMatches += matches.length;
    
    matches.forEach((match, matchIndex) => {
      // Extract K-numbers from contextual matches
      const kNumberMatches = match.match(/K\d{5,6}/gi) || [];
      kNumberMatches.forEach(kMatch => {
        const cleaned = kMatch.toUpperCase();
        console.log(`[Contextual ${index + 1}.${matchIndex}] Extracted: "${cleaned}" from "${match}"`);
        
        if (isValidKNumber(cleaned)) {
          allMatches.add(cleaned);
          console.log(`[Contextual ${index + 1}.${matchIndex}] ✓ Added: ${cleaned}`);
        } else {
          console.log(`[Contextual ${index + 1}.${matchIndex}] ✗ Skipped: ${cleaned} (validation failed)`);
        }
      });
    });
  });
  
  // Special handling for concatenated K-numbers and edge cases
  const specialPatterns = [
    // Concatenated patterns like "K964924S171997PK932972"
    /K\d{6}[A-Z]*\d*[A-Z]*P?K\d{6}/gi,
    // Line break or formatting issues
    /K\d{3}\s*\d{3}/gi,
    /K\d{2}\s*\d{4}/gi,
    // With punctuation
    /K\d{5,6}[,;\.]/gi,
  ];
  
  specialPatterns.forEach((pattern, index) => {
    const matches = text.match(pattern) || [];
    console.log(`[Special Pattern ${index + 1}] Found ${matches.length} matches: ${matches.join(', ')}`);
    
    matches.forEach((match, matchIndex) => {
      if (pattern.source.includes('P?K')) {
        // Handle concatenated K-numbers
        const kNumbers = match.match(/K\d{6}/gi) || [];
        console.log(`[Special ${index + 1}.${matchIndex}] Concatenated "${match}" -> K-numbers: ${kNumbers.join(', ')}`);
        kNumbers.forEach(k => {
          const cleaned = k.toUpperCase();
          if (isValidKNumber(cleaned)) {
            allMatches.add(cleaned);
            console.log(`[Special ${index + 1}.${matchIndex}] ✓ Added: ${cleaned}`);
          }
        });
      } else {
        // Handle other special formats
        const cleanedMatch = match.replace(/[^\dK]/g, '').toUpperCase();
        if (isValidKNumber(cleanedMatch)) {
          allMatches.add(cleanedMatch);
          console.log(`[Special ${index + 1}.${matchIndex}] ✓ Added formatted: ${cleanedMatch} from "${match}"`);
        }
      }
    });
  });
  
  const result = Array.from(allMatches);
  console.log(`[Predicate Extraction] FINAL RESULT: Total contextual matches: ${totalContextualMatches}, Unique K-numbers extracted: ${result.length}`);
  console.log(`[Predicate Extraction] Extracted K-numbers: [${result.join(', ')}]`);
  
  // Log the source of each found K-number for debugging
  if (result.length > 0) {
    result.forEach(kNumber => {
      const occurrences = [];
      const regex = new RegExp(kNumber.replace('K', 'K\\s?'), 'gi');
      const matches = text.match(regex) || [];
      console.log(`[K-Number Context] ${kNumber} found ${matches.length} times in text`);
    });
  }
  
  return result;
}

function extractContextualKNumbers(text: string): string[] {
  const contextualNumbers: string[] = [];
  
  // Look for K-numbers near predicate-related terms - fixed patterns
  const contextPatterns = [
    /(?:predicate|equivalent|similar|reference|cleared|approved)[\s\w,.:]{0,50}K\d{5,6}/gi,
    /K\d{5,6}[\s\w,.:]{0,50}(?:predicate|equivalent|similar|reference|cleared|approved)/gi,
    /(?:based on|compared to|similar to)[\s\w,.:]{0,30}K\d{5,6}/gi,
    /(?:I\.V\.|IV)[\s\w]{0,30}by[\s\w]{0,30}K\d{5,6}/gi, // Match "I.V. Administration Set by ... K932972"
  ];
  
  contextPatterns.forEach((pattern, index) => {
    const matches = text.match(pattern) || [];
    console.log(`[Context Pattern ${index + 1}] Found ${matches.length} contextual matches: ${matches.join(', ')}`);
    matches.forEach(match => {
      const kMatch = match.match(/K\d{5,6}/);
      if (kMatch) {
        console.log(`[Context Pattern ${index + 1}] Extracted contextual K-number: ${kMatch[0]}`);
        contextualNumbers.push(kMatch[0]);
      }
    });
  });
  
  return contextualNumbers;
}