import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NotificationService } from './notificationService';

export interface ReviewerGroup {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  group_type: 'internal' | 'external' | 'regulatory';
  type?: 'internal' | 'external' | 'regulatory'; // For backward compatibility
  color?: string;
  is_default?: boolean;
  isDefault?: boolean; // For backward compatibility
  permissions: {
    canDownload: boolean;
    canComment: boolean;
    canUpload: boolean;
    canApprove: boolean;
    canViewInternal: boolean;
  };
  settings: {
    requireAllApprovals: boolean;
    allowSelfAssignment: boolean;
    enableNotifications: boolean;
    defaultDeadlineDays?: number;
  };
  created_at?: string;
  createdAt?: string; // For backward compatibility
  updated_at?: string;
  updatedAt?: string; // For backward compatibility
  created_by?: string;
  members?: ReviewerGroupMember[];
}

export interface ReviewerGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  is_lead: boolean;
  can_approve: boolean;
  can_request_changes: boolean;
  can_reject: boolean;
  notification_preferences: {
    email: boolean;
    in_app: boolean;
  };
  added_at: string;
  added_by?: string;
  is_active: boolean;
  // User profile data
  name?: string;
  email?: string;
  avatar_url?: string;
}

export class ReviewerGroupService {
  async getCompanyGroups(companyId: string): Promise<ReviewerGroup[]> {
    try {
      const { data, error } = await supabase
        .from('reviewer_groups')
        .select(`
          *,
          reviewer_group_members_new!reviewer_group_members_new_group_id_fkey(
            *,
            user_profiles(
              first_name,
              last_name,
              email,
              avatar_url
            )
          )
        `)
        .eq('company_id', companyId)
        .eq('is_removed', false)
        .order('created_at', { ascending: false });


      if (error) {
        console.error('[ReviewerGroupService] Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      const transformedGroups = (data || []).map(group => ({
        ...group,
        group_type: group.group_type as 'internal' | 'external' | 'regulatory',
        color: group.color || '#3b82f6',
        is_default: group.is_default || false,
        description: group.description || undefined,
        created_by: group.created_by || undefined,
        permissions: group.permissions as ReviewerGroup['permissions'],
        settings: group.settings as ReviewerGroup['settings'],
        members: group.reviewer_group_members_new?.map((member: any) => ({
          ...member,
          name: member.user_profiles
            ? `${member.user_profiles.first_name || ''} ${member.user_profiles.last_name || ''}`.trim()
            : 'Unknown User',
          email: member.user_profiles?.email,
          avatar_url: member.user_profiles?.avatar_url
        })) || []
      }));

      return transformedGroups;
    } catch (error) {
      console.error('[ReviewerGroupService] Error fetching reviewer groups:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load reviewer groups';
      throw new Error(errorMessage);
    }
  }

  async createGroup(groupData: Partial<ReviewerGroup>, createdBy?: string): Promise<ReviewerGroup | null> {
    try {
      // Validate required fields
      if (!groupData.company_id) {
        throw new Error('Company ID is required');
      }
      if (!groupData.name?.trim()) {
        throw new Error('Group name is required');
      }
      if (!groupData.group_type) {
        throw new Error('Group type is required');
      }

      // Store members for later addition
      const membersToAdd = groupData.members || [];

      // Prepare data for database insertion
      const insertData: any = {
        company_id: groupData.company_id,
        name: groupData.name.trim(),
        description: groupData.description || null,
        group_type: groupData.group_type,
        color: groupData.color || '#3b82f6',
        is_default: groupData.is_default || false,
        permissions: groupData.permissions || {
          canDownload: true,
          canComment: true,
          canUpload: false,
          canApprove: false,
          canViewInternal: false
        },
        settings: groupData.settings || {
          requireAllApprovals: false,
          allowSelfAssignment: true,
          enableNotifications: true,
          defaultDeadlineDays: 7
        },
        created_by: createdBy ?? groupData.created_by ?? null
      };

      const { data, error } = await supabase
        .from('reviewer_groups')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('[ReviewerGroupService] Insert error:', error);

        // Provide specific error messages for common issues
        if (error.code === '23505') {
          throw new Error('A reviewer group with this name already exists');
        } else if (error.code === '42501') {
          throw new Error('You do not have permission to create reviewer groups');
        } else if (error.code === '23503') {
          throw new Error('Invalid company reference');
        } else {
          throw new Error(`Failed to create group: ${error.message}`);
        }
      }

      // Add members to the group if any were provided
      if (membersToAdd.length > 0) {
        for (const member of membersToAdd) {
          try {
            await this.updateUserProfile(member.user_id);
            await this.addMemberToGroup(data.id, member.user_id, groupData.company_id, {
              role: member.role || 'reviewer',
              is_lead: member.is_lead || false,
              can_approve: member.can_approve || false,
              can_request_changes: member.can_request_changes || true,
              can_reject: member.can_reject || true,
              notification_preferences: member.notification_preferences || { email: true, in_app: true }
            }, createdBy);
          } catch (memberError) {
            console.error('[ReviewerGroupService] Error adding member:', member.user_id, memberError);
            // Continue with other members even if one fails
          }
        }
      }
      // Add notification for group creation
      const notificationService = new NotificationService();
      notificationService.addNotification({
        title: 'New Review Group Created ',
        message: `A new review group has been created: ${groupData.name}`,
        type: 'group_create',
        group_id: data.id,
        company_id: groupData.company_id,
        created_at: new Date().toISOString(),
        is_read: false,
      })
      toast.success('Reviewer group created successfully');

      // Transform the response to match our interface
      return {
        ...data,
        group_type: data.group_type as 'internal' | 'external' | 'regulatory',
        color: data.color || '#3b82f6',
        is_default: data.is_default || false,
        description: data.description || undefined,
        created_by: data.created_by || undefined,
        permissions: data.permissions as ReviewerGroup['permissions'],
        settings: data.settings as ReviewerGroup['settings'],
        members: []
      };
    } catch (error) {
      console.error('[ReviewerGroupService] Error creating reviewer group:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create reviewer group';
      throw new Error(errorMessage);
    }
  }

  async updateGroup(groupId: string, updates: Partial<ReviewerGroup>): Promise<boolean> {
    try {
      // Prepare updates for database
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.group_type !== undefined) updateData.group_type = updates.group_type;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.is_default !== undefined) updateData.is_default = updates.is_default;
      if (updates.permissions !== undefined) updateData.permissions = updates.permissions;
      if (updates.settings !== undefined) updateData.settings = updates.settings;

      const { error } = await supabase
        .from('reviewer_groups')
        .update(updateData)
        .eq('id', groupId);

      if (error) {
        console.error('[ReviewerGroupService] Update error:', error);
        throw new Error(`Failed to update group: ${error.message}`);
      }

      toast.success('Reviewer group updated successfully');
      const notificationService = new NotificationService();
      notificationService.addNotification({
        title: 'Review Group Updated ',
        message: `A review group has been updated: ${updates.name}`,
        type: 'group_updated',
        group_id: groupId,
        company_id: updates.company_id,
        created_at: new Date().toISOString(),
        is_read: false,
      })
      return true;
    } catch (error) {
      console.error('[ReviewerGroupService] Error updating reviewer group:', error);
      throw error;
    }
  }

  async deleteGroup(groupId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('reviewer_groups')
        .update({ is_removed: true })
        .eq('id', groupId).select().single();

      if (error) {
        console.error('[ReviewerGroupService] Delete error:', error);
        throw new Error(`Failed to delete group: ${error.message}`);
      }
      toast.success('Reviewer group deleted successfully');
      const notificationService = new NotificationService();
      notificationService.addNotification({
        title: 'Review Group Deleted ',
        message: `A review group has been deleted: ${data.name}`,
        type: 'group_delete',
        group_id: groupId,
        company_id: data.company_id,
        // created_at: new Date().toISOString(),
        is_read: false,
      })
      return true;
    } catch (error) {
      console.error('[ReviewerGroupService] Error deleting reviewer group:', error);
      throw error;
    }
  }
  async updateUserProfile(userId: string): Promise<any> {
    try {
      const { data: userProfile, error: userProfileError } = await supabase.from('user_profiles').update({
        is_reviewer: true
      }).eq('id', userId).select("*").maybeSingle();
      if (userProfileError) {
        console.error('[ReviewerGroupService] Error updating user profile:', userProfileError);
        throw new Error(`Failed to update user profile: ${userProfileError.message}`);
      }
    } catch (error) {
      console.error('[ReviewerGroupService] Error updating user profile:', error);
      throw error;
    }
  }
  async addMemberToGroup(
    groupId: string,
    userId: string,
    companyId: string,
    memberData: Partial<ReviewerGroupMember>,
    addedBy?: string | null
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reviewer_group_members_new')
        .insert({
          group_id: groupId,
          user_id: userId,
          added_by: addedBy ?? null,
          role: memberData.role || 'reviewer',
          is_lead: memberData.is_lead || false,
          can_approve: memberData.can_approve ?? true,
          can_request_changes: memberData.can_request_changes ?? true,
          can_reject: memberData.can_reject || false,
          notification_preferences: memberData.notification_preferences || { email: true, in_app: true },
          is_active: true,
        });

      if (error) {
        console.error('[ReviewerGroupService] Add member error:', error);
        throw new Error(`Failed to add member: ${error.message}`);
      }
      const notificationService = new NotificationService();
      notificationService.addNotification({
        title: 'New Review Group Member Added ',
        message: `A new member has been added to the review group`,
        type: 'group_member_added',
        group_id: groupId,
        company_id: companyId,
        is_read: false,
      })
      toast.success('Member added to group successfully');
      return true;
    } catch (error) {
      console.error('[ReviewerGroupService] Error adding member to group:', error);
      throw error;
    }
  }

  async removeMemberFromGroup(groupId: string, userId: string, companyId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reviewer_group_members_new')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) {
        console.error('[ReviewerGroupService] Remove member error:', error);
        throw new Error(`Failed to remove member: ${error.message}`);
      }
      const notificationService = new NotificationService();
      notificationService.addNotification({
        title: 'Review Group Member Removed ',
        message: `A member has been removed from the review group`,
        type: 'group_member_removed',
        group_id: groupId,
        company_id: companyId,
        is_read: false,
      })
      toast.success('Member removed from group successfully');
      return true;
    } catch (error) {
      console.error('[ReviewerGroupService] Error removing member from group:', error);
      throw error;
    }
  }

  async getCompanyUsers(companyId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_company_access')
        .select(`
          user_id,
          access_level,
          is_internal,
          user_profiles(
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq('company_id', companyId);

      if (error) {
        console.error('[ReviewerGroupService] Error fetching company users:', error);
        throw new Error(`Failed to fetch users: ${error.message}`);
      }

      return (data || []).map(access => ({
        id: access.user_id,
        name: access.user_profiles
          ? `${access.user_profiles.first_name || ''} ${access.user_profiles.last_name || ''}`.trim()
          : 'Unknown User',
        email: access.user_profiles?.email,
        avatar_url: access.user_profiles?.avatar_url,
        access_level: access.access_level,
        is_internal: access.is_internal
      }));
    } catch (error) {
      console.error('[ReviewerGroupService] Error fetching company users:', error);
      return [];
    }
  }
}
