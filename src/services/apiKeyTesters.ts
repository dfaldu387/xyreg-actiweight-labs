// API endpoint for testing Gemini API key
// This would typically be implemented as a serverless function or API route

export async function testGeminiApiKey(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Test Gemini API with a simple request
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Hello, this is a test message."
          }]
        }],
        generationConfig: {
          maxOutputTokens: 10,
          temperature: 0.1
        }
      })
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error?.message || 'API request failed' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Mock implementation for development/testing
export async function mockTestGeminiApiKey(apiKey: string): Promise<{ success: boolean; error?: string }> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simple validation - check if key looks like a valid API key
  if (apiKey.length < 20) {
    return { success: false, error: 'API key appears to be too short' };
  }
  
  if (!apiKey.startsWith('AIza')) {
    return { success: false, error: 'API key format appears invalid' };
  }
  
  return { success: true };
}
