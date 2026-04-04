import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PermissionLevel, UserRole, ReviewerType } from "@/types/documentTypes";

/**
 * Convert permission level to descriptive text
 */
export const getPermissionLevelName = (level: PermissionLevel): string => {
  switch (level) {
    case "A": return "Admin";
    case "E": return "Editor";
    case "V": return "Viewer";
    default: return "Unknown";
  }
};

/**
 * Convert role to permission level
 */
export const roleToPermissionLevel = (role: UserRole): PermissionLevel => {
  switch (role) {
    case "admin":
      return "A";
    case "editor":
      return "E";
    case "viewer":
      return "V";
    case "consultant":
      return "A"; // Consultant has admin-level permissions
    default:
      return "V";
  }
};

/**
 * Convert permission level to role
 */
export const permissionLevelToRole = (level: PermissionLevel): UserRole => {
  switch (level) {
    case "A": return "admin";
    case "E": return "editor";
    case "V": return "viewer";
    default: return "viewer";
  }
};

/**
 * Map role for database compatibility
 */
const mapRoleForDatabase = (role: UserRole): "admin" | "editor" | "viewer" => {
  // Map reviewer to viewer for database compatibility
  if (role === "reviewer") return "viewer";
  return role as "admin" | "editor" | "viewer";
};

/**
 * Fetch user permissions for a company using user_company_access table
 * Note: user_roles table removed in Phase 2 migration
 */
export const fetchUserCompanyPermissions = async (userId: string, companyId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_company_access')
      .select('*')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user company permissions:', error);
    return null;
  }
};

/**
 * Check if user is an expert
 */
export const isUserExpert = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('is_expert')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    return data.is_expert || false;
  } catch (error) {
    console.error('Error checking if user is expert:', error);
    return false;
  }
};

/**
 * Fetch user permissions for a product
 */
export const fetchUserProductPermissions = async (userId: string, productId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_product_permissions')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user product permissions:', error);
    return null;
  }
};

/**
 * Check if a user has access to a specific document
 */
export const fetchUserDocumentPermissions = async (userId: string, documentId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_document_permissions')
      .select('*')
      .eq('user_id', userId)
      .eq('document_id', documentId)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user document permissions:', error);
    return null;
  }
};


/**
 * Check if user is a reviewer for a document
 */
export const isUserDocumentReviewer = async (
  userId: string, 
  documentId: string
): Promise<{ isReviewer: boolean, reviewerType: ReviewerType, reviewScope?: string }> => {
  try {
    const { data, error } = await supabase
      .from('user_document_permissions')
      .select('is_internal_reviewer, is_external_reviewer, is_active_reviewer, review_scope')
      .eq('user_id', userId)
      .eq('document_id', documentId)
      .single() as { data: any; error: any };

    if (error) throw error;

    if (data?.is_internal_reviewer) {
      return { isReviewer: true, reviewerType: 'internal', reviewScope: data.review_scope };
    }
    if (data?.is_external_reviewer) {
      return { isReviewer: true, reviewerType: 'external', reviewScope: data.review_scope };
    }
    return { isReviewer: false, reviewerType: 'none' };
  } catch (error) {
    console.error('Error checking user document access:', error);
    return { isReviewer: false, reviewerType: 'none' };
  }
};

/**
 * Update user permissions for a company
 */
export const updateUserCompanyAccess = async (
  userId: string, 
  companyId: string,
  role: UserRole,
  isPrimary: boolean = false
): Promise<boolean> => {
  try {
    // Convert the role to database-compatible format
    const dbRole = mapRoleForDatabase(role);
    
    const { error } = await supabase
      .from('user_company_access')
      .upsert({
        user_id: userId,
        company_id: companyId,
        access_level: dbRole,
        affiliation_type: 'internal',
        is_primary: isPrimary,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,company_id' });
      
    if (error) throw error;
    
    toast.success("Company access updated successfully");
    return true;
  } catch (error) {
    console.error('Error updating user company access:', error);
    toast.error("Failed to update company access");
    return false;
  }
};

/**
 * Update user permissions for a product
 */
export const updateUserProductPermissions = async (
  userId: string,
  productId: string,
  permissions: PermissionLevel[],
  overrideCompanyPermissions: boolean = false
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_product_permissions')
      .upsert({
        user_id: userId,
        product_id: productId,
        permissions: permissions,
        override_company_permissions: overrideCompanyPermissions,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,product_id' });
      
    if (error) throw error;
    
    toast.success("Product permissions updated successfully");
    return true;
  } catch (error) {
    console.error('Error updating user product permissions:', error);
    toast.error("Failed to update product permissions");
    return false;
  }
};

/**
 * Update user document access (array-based)
 */
export const updateUserDocumentAccess = async (
  userId: string,
  documentId: string,
  permissions: PermissionLevel[],
  overrideProductPermissions: boolean = false,
  isInternalReviewer: boolean = false,
  isExternalReviewer: boolean = false,
  isActiveReviewer: boolean = false,
  reviewScope?: string,
  reviewDeadline?: Date,
  companyId?: string
): Promise<boolean> => {
  try {
    // Resolve company_id if not provided
    let resolvedCompanyId = companyId;
    if (!resolvedCompanyId) {
      const { data: docData } = await supabase
        .from('documents')
        .select('company_id')
        .eq('id', documentId)
        .single();
      resolvedCompanyId = docData?.company_id;
    }
    if (!resolvedCompanyId) throw new Error('Could not resolve company_id');

    const { error } = await supabase
      .from('user_document_permissions')
      .upsert({
        user_id: userId,
        document_id: documentId,
        company_id: resolvedCompanyId,
        permissions: permissions as any,
        override_product_permissions: overrideProductPermissions,
        is_internal_reviewer: isInternalReviewer,
        is_external_reviewer: isExternalReviewer,
        is_active_reviewer: isActiveReviewer,
        review_scope: reviewScope,
        review_deadline: reviewDeadline?.toISOString(),
        updated_at: new Date().toISOString()
      } as any, { onConflict: 'user_id,document_id' });
      
    if (error) throw error;

    toast.success("Document permissions updated successfully");
    return true;
  } catch (error) {
    console.error('Error updating user document permissions:', error);
    toast.error("Failed to update document permissions");
    return false;
  }
};

/**
 * Fetch all users with their basic profiles
 * Note: user_roles table removed, now using user_company_access for roles
 */
export const fetchUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*');
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

/**
 * Update user expert status
 */
export const updateUserExpertStatus = async (
  userId: string,
  isExpert: boolean
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_expert: isExpert })
      .eq('id', userId);
      
    if (error) throw error;
    
    toast.success(`User ${isExpert ? 'marked as expert' : 'unmarked as expert'} successfully`);
    return true;
  } catch (error) {
    console.error('Error updating user expert status:', error);
    toast.error("Failed to update user expert status");
    return false;
  }
};

/**
 * Fetch user profile by ID
 * Note: user_roles table removed, now using user_company_access for roles
 */
export const fetchUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

/**
 * Check if a user has a specific permission for a company
 * Uses user_company_access table since user_roles was removed
 */
export const hasCompanyPermission = async (
  userId: string,
  companyId: string,
  requiredRole: UserRole
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_company_access')
      .select('access_level')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .single();
      
    if (error) return false;
    
    // Cast the access_level to handle type mismatch until database is updated
    const accessLevel = data.access_level as any;
    
    // Admin can do anything (consultant maps to admin until database is updated)
    if (accessLevel === 'admin' || accessLevel === 'consultant') return true;

    // If requiring admin, must be admin or consultant
    if (requiredRole === 'admin') {
      return accessLevel === 'admin' || accessLevel === 'consultant';
    }

    // If requiring consultant, must be admin or consultant
    if (requiredRole === 'consultant') {
      return accessLevel === 'admin' || accessLevel === 'consultant';
    }

    // Editor can do editor and viewer tasks
    if (accessLevel === 'editor' && (requiredRole === 'editor' || requiredRole === 'viewer')) return true;

    // Author has viewer-level permissions (can view documents they're assigned to)
    if (accessLevel === 'author' && requiredRole === 'viewer') return true;

    // Viewer can only do viewer tasks
    return accessLevel === 'viewer' && requiredRole === 'viewer';
  } catch (error) {
    console.error('Error checking company permission:', error);
    return false;
  }
};

/**
 * Check if a user is an admin for a company
 * Uses user_company_access table since user_roles was removed
 */
export const isCompanyAdmin = async (userId: string, companyId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_company_access')
      .select('access_level')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('access_level', 'admin')
      .single();
      
    if (error) return false;
    return !!data;
  } catch (error) {
    console.error('Error checking if user is company admin:', error);
    return false;
  }
};

/**
 * Create a comment thread for a document
 */
export const createCommentThread = async (
  documentId: string,
  isInternal: boolean = true
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('comment_threads')
      .insert({
        document_id: documentId,
        is_internal: isInternal
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return data.id;
  } catch (error) {
    console.error('Error creating comment thread:', error);
    return null;
  }
};

/**
 * Add a comment to a thread
 */
export const addComment = async (
  threadId: string,
  userId: string,
  content: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('comments')
      .insert({
        thread_id: threadId,
        user_id: userId,
        content: content
      });
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error adding comment:', error);
    return false;
  }
};

/**
 * Fetch comments for a thread
 */
export const fetchComments = async (threadId: string) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user_profiles(*)
      `)
      .eq('thread_id', threadId)
      .order('created_at');
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

/**
 * Fetch comment threads for a document
 */
export const fetchCommentThreads = async (documentId: string) => {
  try {
    const { data, error } = await supabase
      .from('comment_threads')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at');
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching comment threads:', error);
    return [];
  }
};
