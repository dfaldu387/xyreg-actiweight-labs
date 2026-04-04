
import { supabase } from "@/integrations/supabase/client";
import { CompanyResolutionResult } from "@/types/company";

/**
 * Checks if a string is a valid UUID
 */
export function isValidUUID(str: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
}

/**
 * Safely decodes a URI component, returning the original string if decoding fails
 */
export function safeDecodeURIComponent(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch (err) {
    console.error("Failed to decode URI component:", str, err);
    return str;
  }
}

/**
 * Validates that an identifier is not empty, null, or malformed
 */
function validateIdentifier(identifier: string | null | undefined): boolean {
  if (!identifier || identifier.trim() === '') {
    return false;
  }
  
  // Check for malformed patterns that could cause query issues
  if (identifier.includes(':') && !identifier.includes('://')) {
    console.error("Malformed identifier detected:", identifier);
    return false;
  }
  
  return true;
}

/**
 * Resolves a company identifier (id or name) to a company ID and name
 * This centralizes the company lookup logic in one place with proper validation
 */
export async function resolveCompanyIdentifier(
  identifier: string | null | undefined
): Promise<CompanyResolutionResult> {
  if (!validateIdentifier(identifier)) {
    return { 
      companyId: null, 
      companyName: null, 
      source: 'unknown', 
      error: 'Invalid or empty company identifier provided' 
    };
  }

  const cleanIdentifier = identifier!.trim();
  console.log("Resolving company identifier:", cleanIdentifier);
  
  try {
    // Check if the identifier is a UUID
    if (isValidUUID(cleanIdentifier)) {
      console.log("Identifier is UUID, querying by ID:", cleanIdentifier);
      
      // If it's a UUID, query directly by ID
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', cleanIdentifier)
        .maybeSingle();
        
      if (error) {
        console.error("Error querying company by ID:", error);
        throw error;
      }
      
      if (!data) {
        return {
          companyId: null,
          companyName: null,
          error: `No company found with ID: ${cleanIdentifier}`,
          source: 'id'
        };
      }
      
      console.log("Successfully resolved company by ID:", data);
      return {
        companyId: data.id,
        companyName: data.name,
        source: 'id'
      };
    }
    
    // If it's not a UUID, it might be an encoded name
    let decodedName = cleanIdentifier;
    let source: 'name' | 'encoded-name' = 'name';
    
    // Check if the name needs decoding (contains URL-encoded characters)
    if (cleanIdentifier.includes('%')) {
      try {
        decodedName = safeDecodeURIComponent(cleanIdentifier);
        source = 'encoded-name';
        console.log("Decoded company name from:", cleanIdentifier, "to:", decodedName);
      } catch (decodeError) {
        console.error("Error decoding company name:", decodeError);
        // Continue with the original name if decoding fails
      }
    }
    
    // Validate decoded name
    if (!decodedName || decodedName.trim() === '') {
      return {
        companyId: null,
        companyName: null,
        error: 'Company name is empty after decoding',
        source
      };
    }
    
    console.log("Querying company by name:", decodedName);
    
    // Query by name
    const { data, error } = await supabase
      .from('companies')
      .select('id, name')
      .eq('name', decodedName.trim())
      .maybeSingle();
      
    if (error) {
      console.error("Error querying company by name:", error);
      throw error;
    }
    
    if (!data) {
      return {
        companyId: null,
        companyName: decodedName,
        error: `No company found with name: ${decodedName}`,
        source
      };
    }
    
    console.log("Successfully resolved company by name:", data);
    return {
      companyId: data.id,
      companyName: data.name,
      source
    };
  } catch (error) {
    console.error("Error resolving company identifier:", error);
    return {
      companyId: null,
      companyName: null,
      error: `Error resolving company: ${error.message || 'Unknown error'}`,
      source: 'unknown'
    };
  }
}
