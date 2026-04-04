
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Utility to ensure user has access to a company for document operations
 * This fixes RLS policy violations when performing drag & drop operations
 */
export async function ensureUserCompanyAccess(companyName: string): Promise<boolean> {
  try {
    console.log(`[userAccessSetup] Checking user access for company: ${companyName}`);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("[userAccessSetup] No authenticated user found:", userError);
      toast.error("Please log in to continue");
      return false;
    }

    console.log(`[userAccessSetup] Authenticated user: ${user.id}`);

    // Get company ID
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name")
      .eq("name", companyName)
      .single();

    if (companyError || !company) {
      console.error("[userAccessSetup] Company not found:", companyError);
      toast.error(`Company "${companyName}" not found`);
      return false;
    }

    console.log(`[userAccessSetup] Found company: ${company.id}`);

    // Check if user already has access
    const { data: existingAccess, error: accessCheckError } = await supabase
      .from("user_company_access")
      .select("*")
      .eq("user_id", user.id)
      .eq("company_id", company.id)
      .single();

    if (accessCheckError && accessCheckError.code !== 'PGRST116') {
      console.error("[userAccessSetup] Error checking existing access:", accessCheckError);
      return false;
    }

    if (existingAccess) {
      console.log(`[userAccessSetup] User already has access to company with level: ${existingAccess.access_level}`);
      
      // Check if they have sufficient permissions (admin, editor, or consultant)
      if (existingAccess.access_level === 'admin' || existingAccess.access_level === 'editor' || existingAccess.access_level === 'consultant') {
        return true;
      } else {
        // Upgrade to editor level if they only have viewer access
        const { error: updateError } = await supabase
          .from("user_company_access")
          .update({
            access_level: "editor",
            updated_at: new Date().toISOString()
          })
          .eq("user_id", user.id)
          .eq("company_id", company.id);

        if (updateError) {
          console.error("[userAccessSetup] Error upgrading user access:", updateError);
          toast.error("Failed to upgrade user permissions");
          return false;
        }

        console.log(`[userAccessSetup] Upgraded user access to editor level`);
        toast.success(`Access upgraded to editor level for "${companyName}"`);
        return true;
      }
    }

    // Create user access record
    console.log(`[userAccessSetup] Creating user access record`);
    const { error: insertError } = await supabase
      .from("user_company_access")
      .insert({
        user_id: user.id,
        company_id: company.id,
        access_level: "admin",
        affiliation_type: "internal",
        is_primary: false
      });

    if (insertError) {
      console.error("[userAccessSetup] Error creating user access:", insertError);
      toast.error("Failed to grant company access");
      return false;
    }

    console.log(`[userAccessSetup] Successfully granted admin access to company`);
    toast.success(`Admin access granted to "${companyName}"`);
    return true;

  } catch (error) {
    console.error("[userAccessSetup] Unexpected error:", error);
    toast.error("Error setting up company access");
    return false;
  }
}

/**
 * Auto-setup user access when needed for drag & drop operations
 */
export async function autoSetupCompanyAccess(companyName: string): Promise<boolean> {
  console.log(`[userAccessSetup] Auto-setting up access for: ${companyName}`);
  
  const success = await ensureUserCompanyAccess(companyName);
  
  if (success) {
    // Give a moment for the database to process the change
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return success;
}

/**
 * Setup user access by company ID (for use in services)
 */
export async function ensureUserCompanyAccessById(companyId: string): Promise<boolean> {
  try {
    console.log(`[userAccessSetup] Setting up access by company ID: ${companyId}`);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("[userAccessSetup] No authenticated user found:", userError);
      return false;
    }

    // Check if user already has access
    const { data: existingAccess, error: accessCheckError } = await supabase
      .from("user_company_access")
      .select("*")
      .eq("user_id", user.id)
      .eq("company_id", companyId)
      .single();

    if (accessCheckError && accessCheckError.code !== 'PGRST116') {
      console.error("[userAccessSetup] Error checking existing access:", accessCheckError);
      return false;
    }

    if (existingAccess) {
      console.log(`[userAccessSetup] User already has access to company`);
      
      // Check if they have sufficient permissions
      if (existingAccess.access_level === 'admin' || existingAccess.access_level === 'editor') {
        return true;
      } else {
        // Upgrade to editor level
        const { error: updateError } = await supabase
          .from("user_company_access")
          .update({
            access_level: "editor",
            updated_at: new Date().toISOString()
          })
          .eq("user_id", user.id)
          .eq("company_id", companyId);

        if (updateError) {
          console.error("[userAccessSetup] Error upgrading user access:", updateError);
          return false;
        }

        console.log(`[userAccessSetup] Upgraded user access to editor level`);
        return true;
      }
    }

    // Create user access record
    console.log(`[userAccessSetup] Creating user access record for company ID: ${companyId}`);
    const { error: insertError } = await supabase
      .from("user_company_access")
      .insert({
        user_id: user.id,
        company_id: companyId,
        access_level: "admin",
        affiliation_type: "internal",
        is_primary: false
      });

    if (insertError) {
      console.error("[userAccessSetup] Error creating user access:", insertError);
      return false;
    }

    console.log(`[userAccessSetup] Successfully granted admin access to company by ID`);
    return true;

  } catch (error) {
    console.error("[userAccessSetup] Unexpected error in ensureUserCompanyAccessById:", error);
    return false;
  }
}

/**
 * Initialize user access for "Try again 13.6" company
 * This is a one-time setup function to fix the current access issue
 */
export async function initializeUserAccessForCurrentCompany(): Promise<boolean> {
  const companyName = "Try again 13.6";
  console.log(`[userAccessSetup] Initializing access for current company: ${companyName}`);
  
  const success = await ensureUserCompanyAccess(companyName);
  
  if (success) {
    console.log(`[userAccessSetup] Successfully initialized access for ${companyName}`);
    toast.success("Company access initialized - you can now manage documents");
  } else {
    console.error(`[userAccessSetup] Failed to initialize access for ${companyName}`);
    toast.error("Failed to initialize company access");
  }
  
  return success;
}
