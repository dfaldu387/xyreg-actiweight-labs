import { supabase } from "@/integrations/supabase/client";

export interface KOLGroup {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  expertise_area?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  members?: KOLGroupMember[];
}

export interface KOLGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  expertise_notes?: string;
  is_lead: boolean;
  joined_at: string;
}

export interface HazardCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

export interface KOLAssignment {
  id: string;
  company_id: string;
  product_id: string;
  kol_group_id: string;
  hazard_category_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  deadline?: string;
  assigned_at: string;
  assigned_by?: string;
  completed_at?: string;
}

export interface KOLAssessment {
  id: string;
  assignment_id: string;
  hazard_id: string;
  assessor_id: string;
  initial_severity?: number;
  initial_probability?: number;
  initial_risk_rationale?: string;
  residual_severity?: number;
  residual_probability?: number;
  residual_risk_rationale?: string;
  risk_control_recommendations?: string;
  additional_controls_needed?: string;
  comments?: string;
  confidence_level?: number;
  status: 'draft' | 'submitted' | 'approved';
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

export const kolService = {
  // KOL Groups
  async getKOLGroups(companyId: string): Promise<KOLGroup[]> {
    const { data, error } = await supabase
      .from('kol_groups')
      .select(`
        *,
        members:kol_group_members(*)
      `)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch KOL groups: ${error.message}`);
    }

    return data || [];
  },

  async createKOLGroup(groupData: Required<Pick<KOLGroup, 'company_id' | 'name'>> & Partial<Omit<KOLGroup, 'id' | 'created_at' | 'updated_at'>>): Promise<KOLGroup> {
    const { data, error } = await supabase
      .from('kol_groups')
      .insert({
        company_id: groupData.company_id,
        name: groupData.name,
        description: groupData.description,
        expertise_area: groupData.expertise_area,
        is_active: true,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create KOL group: ${error.message}`);
    }

    return data;
  },

  async updateKOLGroup(id: string, updates: Partial<KOLGroup>): Promise<KOLGroup> {
    const { data, error } = await supabase
      .from('kol_groups')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update KOL group: ${error.message}`);
    }

    return data;
  },

  async deleteKOLGroup(id: string): Promise<void> {
    const { error } = await supabase
      .from('kol_groups')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete KOL group: ${error.message}`);
    }
  },

  // KOL Group Members
  async addKOLGroupMember(groupId: string, userId: string, memberData: Partial<KOLGroupMember>): Promise<KOLGroupMember> {
    const { data, error } = await supabase
      .from('kol_group_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        ...memberData,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add KOL group member: ${error.message}`);
    }

    return data;
  },

  async removeKOLGroupMember(groupId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('kol_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to remove KOL group member: ${error.message}`);
    }
  },

  // Hazard Categories
  async getHazardCategories(): Promise<HazardCategory[]> {
    const { data, error } = await supabase
      .from('hazard_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      throw new Error(`Failed to fetch hazard categories: ${error.message}`);
    }

    return data || [];
  },

  // KOL Assignments
  async getKOLAssignments(companyId: string, productId?: string): Promise<KOLAssignment[]> {
    let query = supabase
      .from('kol_assignments')
      .select(`
        *,
        kol_group:kol_groups(*),
        hazard_category:hazard_categories(*)
      `)
      .eq('company_id', companyId);

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query.order('assigned_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch KOL assignments: ${error.message}`);
    }

    return (data || []) as KOLAssignment[];
  },

  async createKOLAssignment(assignmentData: Required<Pick<KOLAssignment, 'company_id' | 'product_id' | 'kol_group_id' | 'hazard_category_id' | 'title'>> & Partial<Omit<KOLAssignment, 'id' | 'assigned_at'>>): Promise<KOLAssignment> {
    const { data, error } = await supabase
      .from('kol_assignments')
      .insert({
        company_id: assignmentData.company_id,
        product_id: assignmentData.product_id,
        kol_group_id: assignmentData.kol_group_id,
        hazard_category_id: assignmentData.hazard_category_id,
        title: assignmentData.title,
        description: assignmentData.description,
        status: 'pending',
        deadline: assignmentData.deadline,
        assigned_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create KOL assignment: ${error.message}`);
    }

    return data as KOLAssignment;
  },

  async updateKOLAssignment(id: string, updates: Partial<KOLAssignment>): Promise<KOLAssignment> {
    const { data, error } = await supabase
      .from('kol_assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update KOL assignment: ${error.message}`);
    }

    return data as KOLAssignment;
  },

  // KOL Assessments
  async getKOLAssessments(assignmentId: string): Promise<KOLAssessment[]> {
    const { data, error } = await supabase
      .from('kol_assessments')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch KOL assessments: ${error.message}`);
    }

    return (data || []) as KOLAssessment[];
  },

  async createKOLAssessment(assessmentData: Required<Pick<KOLAssessment, 'assignment_id' | 'hazard_id'>> & Partial<Omit<KOLAssessment, 'id' | 'assessor_id' | 'created_at' | 'updated_at'>>): Promise<KOLAssessment> {
    const { data, error } = await supabase
      .from('kol_assessments')
      .insert({
        assignment_id: assessmentData.assignment_id,
        hazard_id: assessmentData.hazard_id,
        initial_severity: assessmentData.initial_severity,
        initial_probability: assessmentData.initial_probability,
        initial_risk_rationale: assessmentData.initial_risk_rationale,
        residual_severity: assessmentData.residual_severity,
        residual_probability: assessmentData.residual_probability,
        residual_risk_rationale: assessmentData.residual_risk_rationale,
        risk_control_recommendations: assessmentData.risk_control_recommendations,
        additional_controls_needed: assessmentData.additional_controls_needed,
        comments: assessmentData.comments,
        confidence_level: assessmentData.confidence_level,
        status: 'draft',
        assessor_id: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create KOL assessment: ${error.message}`);
    }

    return data as KOLAssessment;
  },

  async updateKOLAssessment(id: string, updates: Partial<KOLAssessment>): Promise<KOLAssessment> {
    const { data, error } = await supabase
      .from('kol_assessments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update KOL assessment: ${error.message}`);
    }

    return data as KOLAssessment;
  },

  async submitKOLAssessment(id: string): Promise<KOLAssessment> {
    const { data, error } = await supabase
      .from('kol_assessments')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to submit KOL assessment: ${error.message}`);
    }

    return data as KOLAssessment;
  },

  // Update hazard with category and assignment
  async updateHazardCategory(hazardId: string, categoryId: string, assignmentId?: string): Promise<void> {
    const updates: any = {
      category_id: categoryId,
      assessment_status: assignmentId ? 'assigned' : 'unassessed',
    };

    if (assignmentId) {
      updates.kol_assignment_id = assignmentId;
    }

    const { error } = await supabase
      .from('hazards')
      .update(updates)
      .eq('id', hazardId);

    if (error) {
      throw new Error(`Failed to update hazard category: ${error.message}`);
    }
  },
};