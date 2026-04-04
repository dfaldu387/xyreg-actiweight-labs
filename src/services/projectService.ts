
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types/project';

/**
 * Get all projects for a company
 */
export async function getCompanyProjects(companyId: string): Promise<Project[]> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching company projects:', error);
      throw error;
    }

    // Convert Json type to string[] for project_types
    return (data || []).map(project => ({
      ...project,
      project_types: Array.isArray(project.project_types) 
        ? project.project_types as string[]
        : []
    }));
  } catch (error) {
    console.error('Error in getCompanyProjects:', error);
    throw error;
  }
}

/**
 * Get projects for a specific product
 */
export async function getProductProjects(productId: string): Promise<Project[]> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching product projects:', error);
      throw error;
    }

    // Convert Json type to string[] for project_types
    return (data || []).map(project => ({
      ...project,
      project_types: Array.isArray(project.project_types) 
        ? project.project_types as string[]
        : []
    }));
  } catch (error) {
    console.error('Error in getProductProjects:', error);
    throw error;
  }
}

/**
 * Get a project by ID
 */
export async function getProject(projectId: string): Promise<Project | null> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Error fetching project:', error);
      throw error;
    }

    // Convert Json type to string[] for project_types
    return data ? {
      ...data,
      project_types: Array.isArray(data.project_types) 
        ? data.project_types as string[]
        : []
    } : null;
  } catch (error) {
    console.error('Error in getProject:', error);
    throw error;
  }
}

/**
 * Update a project
 */
export async function updateProject(
  projectId: string, 
  updates: Partial<Project>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId);

    if (error) {
      console.error('Error updating project:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateProject:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Error deleting project:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteProject:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
