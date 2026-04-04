
import { supabase } from "@/integrations/supabase/client";

/**
 * Utility for making authenticated API requests to Supabase REST endpoints
 */
export const supabaseApiClient = {
  /**
   * Get the API URL for Supabase
   */
  getApiUrl(): string {
    return "https://wzzkbmmgxxrfhhxggrcl.supabase.co";
  },
  
  /**
   * Get common headers for Supabase API requests
   */
  async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Get the current session using the public API method
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    // Add the anonymous key - using the hardcoded value which is safe in this project
    const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6emtibW1neHhyZmhoeGdncmNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzOTY1OTksImV4cCI6MjA2MDk3MjU5OX0.IILyYxMvAEyt5DrRWvF7NR0omsg2DKbhh5b-C4N73ME";
    headers['apikey'] = anonKey;
    
    return headers;
  },
  
  /**
   * Call a Supabase RPC function
   */
  async callRpcFunction<T = any>(functionName: string, params?: any): Promise<T> {
    try {
      console.log(`Calling RPC function: ${functionName}`, params);
      const url = `${this.getApiUrl()}/rest/v1/rpc/${functionName}`;
      
      const headers = await this.getHeaders();
      console.log("Headers prepared for RPC call:", Object.keys(headers));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: params ? JSON.stringify(params) : undefined,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error calling ${functionName}:`, response.status, errorText);
        throw new Error(`Error calling ${functionName}: ${response.statusText} (${response.status})`);
      }
      
      return response.json();
    } catch (err) {
      console.error(`Exception during RPC function call to ${functionName}:`, err);
      throw err;
    }
  }
};
