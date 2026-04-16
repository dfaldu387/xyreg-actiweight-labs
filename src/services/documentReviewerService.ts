
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DocumentReviewer {
  id: string;
  name: string;
  role: string;
  email?: string;
}

export interface DocumentReviewerGroupAssignment {
  groupId: string;
  groupName: string;
  groupType: 'internal' | 'external' | 'regulatory';
  assignedDate: string;
  dueDate?: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  members: DocumentReviewer[];
}

export class DocumentReviewerService {
  /**
   * Get available users from the company for reviewer assignment
   */
  async getAvailableReviewers(companyId: string): Promise<DocumentReviewer[]> {
    try {
      // Get users who have access to this company
      const { data: companyUsers, error } = await supabase
        .from('user_company_access')
        .select(`
          user_id,
          user_profiles!inner(
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('company_id', companyId);

      if (error) {
        console.error('Error fetching company users:', error);
        return [];
      }

      // Transform to reviewer format
      const reviewers: DocumentReviewer[] = companyUsers.map(user => ({
        id: user.user_profiles.id,
        name: `${user.user_profiles.first_name || ''} ${user.user_profiles.last_name || ''}`.trim() || user.user_profiles.email,
        role: 'Team Member',
        email: user.user_profiles.email
      }));

      return reviewers;
    } catch (error) {
      console.error('Error in getAvailableReviewers:', error);
      return [];
    }
  }

  /**
   * Update document reviewers in the database
   */
  async updateDocumentReviewers(documentId: string, reviewers: DocumentReviewer[]): Promise<boolean> {
    try {
      // Convert reviewers to Json format for database storage
      const reviewersJson = reviewers as unknown as any;
      
      // Store reviewers as JSONB in the documents table
      const { error } = await supabase
        .from('documents')
        .update({ 
          reviewers: reviewersJson,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (error) {
        console.error('Error updating document reviewers:', error);
        toast.error('Failed to update reviewers');
        return false;
      }

      toast.success('Reviewers updated successfully');
      return true;
    } catch (error) {
      console.error('Error in updateDocumentReviewers:', error);
      toast.error('Failed to update reviewers');
      return false;
    }
  }

  /**
   * Assign multiple reviewer groups to a document
   */
  async assignReviewerGroups(documentId: string, groupAssignments: DocumentReviewerGroupAssignment[]): Promise<boolean> {
    try {
      const assignmentsJson = groupAssignments as unknown as any;
      
      const { error } = await supabase
        .from('documents')
        .update({ 
          reviewer_groups: assignmentsJson,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', documentId);

      if (error) {
        console.error('Error assigning reviewer groups:', error);
        toast.error('Failed to assign reviewer groups');
        return false;
      }

      toast.success('Reviewer groups assigned successfully');
      return true;
    } catch (error) {
      console.error('Error in assignReviewerGroups:', error);
      toast.error('Failed to assign reviewer groups');
      return false;
    }
  }

  /**
   * Get reviewer group assignments for a document
   */
  async getDocumentReviewerGroups(documentId: string): Promise<DocumentReviewerGroupAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('reviewers')
        .eq('id', documentId)
        .single();

      if (error) {
        console.error('Error fetching document reviewer groups:', error);
        return [];
      }

      // For now, return empty array as we need to implement proper reviewer groups storage
      // This is a placeholder implementation
      return [];

      /*
      if (!data.reviewer_groups) {
        return [];
      }

      try {
        const groupsData = data.reviewer_groups as unknown as DocumentReviewerGroupAssignment[];
        if (Array.isArray(groupsData)) {
          return groupsData.filter(group => 
            group && 
            typeof group === 'object' && 
            'groupId' in group && 
            'groupName' in group
          );
        }
        return [];
      } catch (parseError) {
        console.error('Error parsing reviewer groups data:', parseError);
        return [];
      }
      */
    } catch (error) {
      console.error('Error in getDocumentReviewerGroups:', error);
      return [];
    }
  }

  /**
   * Get current reviewers for a document
   */
  async getDocumentReviewers(documentId: string): Promise<DocumentReviewer[]> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('reviewers')
        .eq('id', documentId)
        .single();

      if (error) {
        console.error('Error fetching document reviewers:', error);
        return [];
      }

      // Safely convert Json to DocumentReviewer[] with proper type checking
      if (!data.reviewers) {
        return [];
      }

      try {
        const reviewersData = data.reviewers as unknown as DocumentReviewer[];
        // Validate that the data has the expected structure
        if (Array.isArray(reviewersData)) {
          return reviewersData.filter(reviewer => 
            reviewer && 
            typeof reviewer === 'object' && 
            'id' in reviewer && 
            'name' in reviewer && 
            'role' in reviewer
          );
        }
        return [];
      } catch (parseError) {
        console.error('Error parsing reviewers data:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Error in getDocumentReviewers:', error);
      return [];
    }
  }
}
