import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIPredicateDevice {
  kNumber: string;
  deviceName: string;
  manufacturer: string;
  clearanceDate: string;
  predicateDevices?: AIPredicateDevice[];
  isTerminal?: boolean;
  notes?: string;
}

interface AIPredicateTrail {
  targetDevice: AIPredicateDevice;
  branches: AIPredicateDevice[][];
  summary: string;
  analysisDate: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { kNumber, geminiApiKey } = await req.json();
    
    if (!kNumber) {
      throw new Error('K-number is required');
    }

    if (!geminiApiKey) {
      throw new Error('Gemini API key is required');
    }

    console.log(`Starting AI predicate trail analysis for: ${kNumber}`);

    // First, get basic device info from FDA API to validate K-number exists
    const deviceInfo = await fetchDeviceInfo(kNumber);
    
    if (!deviceInfo) {
      return new Response(JSON.stringify({
        success: false,
        error: `K-number ${kNumber} not found in FDA database. Please verify the K-number is correct.`
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Use AI to analyze the predicate trail comprehensively
    const aiTrail = await analyzePredicateTrailWithAI(kNumber, deviceInfo, geminiApiKey);

    return new Response(JSON.stringify({
      success: true,
      data: aiTrail
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI predicate trail analysis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchDeviceInfo(kNumber: string) {
  try {
    const response = await fetch(`https://api.fda.gov/device/510k.json?search=k_number:${kNumber}&limit=1`);
    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        console.log(`Found device info for ${kNumber}`);
        return data.results[0];
      } else {
        console.warn(`No device found in FDA database for K-number: ${kNumber}`);
        return null;
      }
    } else {
      console.error(`FDA API error for ${kNumber}: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`Failed to fetch device info for ${kNumber}:`, error);
    return null;
  }
}

async function analyzePredicateTrailWithAI(kNumber: string, deviceInfo: any, geminiApiKey: string): Promise<AIPredicateTrail> {
  console.log(`Starting AI analysis for ${kNumber}`);
  
  try {
    // Step 1: Find predicate device trail
    const findTrailPrompt = `You are a medical device regulatory expert. Find the complete predicate device trail for FDA 510(k) number ${kNumber}. 

Search the FDA database and provide a comprehensive analysis showing:
1. The target device: ${kNumber}
2. All predicate devices referenced by this device
3. The complete trail going back to the original predicate devices
4. Multiple branches if they exist
5. For each device in the trail, include: K-number, device name, manufacturer, clearance date

Be thorough and show the complete regulatory lineage. Format your response as detailed text showing the full trail structure.`;

    console.log('Making first Gemini API call to find trail...');
    const trailResponse = await callGeminiAPI(findTrailPrompt, geminiApiKey);
    
    if (!trailResponse) {
      throw new Error('Failed to get trail information from Gemini API');
    }
    
    // Step 2: Format the results into structured levels
    const formatPrompt = `Take this predicate device trail information and format it into clear levels showing the regulatory lineage:

${trailResponse}

Format this as a structured analysis with:
1. Clear level-by-level breakdown (Level 1, Level 2, etc.)
2. Show all branches separately if multiple predicate paths exist
3. Include device details for each K-number (name, manufacturer, date)
4. Show the relationships clearly with arrows or indentation
5. Provide a summary of the complete trail structure

Make it comprehensive and easy to follow the regulatory pathway.`;

    console.log('Making second Gemini API call to format results...');
    const formattedResponse = await callGeminiAPI(formatPrompt, geminiApiKey);
    
    if (!formattedResponse) {
      throw new Error('Failed to format trail information from Gemini API');
    }

    const trail: AIPredicateTrail = {
      targetDevice: {
        kNumber,
        deviceName: deviceInfo?.device_name || 'Unknown Device',
        manufacturer: deviceInfo?.applicant || 'Unknown Manufacturer',
        clearanceDate: deviceInfo?.decision_date || 'Unknown'
      },
      branches: [], // AI analysis will be in the summary
      summary: formattedResponse,
      analysisDate: new Date().toISOString()
    };

    return trail;
  } catch (error) {
    console.error('Error in AI analysis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      targetDevice: {
        kNumber,
        deviceName: 'Error',
        manufacturer: 'Error',
        clearanceDate: 'Error'
      },
      branches: [],
      summary: `Error analyzing predicate trail for ${kNumber}: ${errorMessage}`,
      analysisDate: new Date().toISOString()
    };
  }
}

async function callGeminiAPI(prompt: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 4096,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

function extractPredicatesFromText(text: string): string[] {
  const kNumberPattern = /K\d{6}/g;
  const matches = text.match(kNumberPattern) || [];
  return [...new Set(matches)]; // Remove duplicates
}