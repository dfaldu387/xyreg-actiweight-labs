import { supabase } from '@/integrations/supabase/client';

export interface VVPlan {
  id: string;
  company_id: string;
  product_id: string;
  name: string;
  description?: string;
  scope?: string;
  methodology?: string;
  acceptance_criteria?: string;
  roles_responsibilities: any;
  status: string;
  version: string;
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  scope_type?: string;
  family_identifier?: string;
}

export interface TestCase {
  id: string;
  company_id: string;
  product_id: string;
  test_case_id: string;
  name: string;
  description?: string;
  test_type: string;
  test_level: string;
  category?: string;
  test_method?: string;
  preconditions?: string;
  test_steps: any;
  expected_results?: string;
  acceptance_criteria?: string;
  priority: string;
  estimated_duration?: number;
  sample_size?: number;
  status: string;
  created_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface TestExecution {
  id: string;
  test_case_id: string;
  execution_id: string;
  executed_by: string;
  execution_date: string;
  environment_info: any;
  software_version?: string;
  hardware_version?: string;
  actual_results?: string;
  status: string;
  notes?: string;
  attachments: any;
  execution_time_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface Defect {
  id: string;
  company_id: string;
  product_id: string;
  defect_id: string;
  title: string;
  description: string;
  severity: string;
  priority: string;
  status: string;
  defect_type?: string;
  root_cause?: string;
  resolution?: string;
  discovered_in_phase?: string;
  test_case_id?: string;
  test_execution_id?: string;
  reported_by: string;
  assigned_to?: string;
  resolved_by?: string;
  verified_by?: string;
  resolved_at?: string;
  verified_at?: string;
  jira_issue_key?: string;
  created_at: string;
  updated_at: string;
}

export class VVService {
  // V&V Plans
  static async getVVPlans(companyId: string, productId: string): Promise<VVPlan[]> {
    const { data, error } = await supabase
      .from('vv_plans')
      .select('*')
      .eq('company_id', companyId)
      .eq('product_id', productId)
      .or('scope_type.eq.individual,scope_type.is.null')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createVVPlan(plan: Omit<VVPlan, 'id' | 'created_at' | 'updated_at'>): Promise<VVPlan> {
    const { data, error } = await supabase
      .from('vv_plans')
      .insert(plan)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateVVPlan(id: string, updates: Partial<VVPlan>): Promise<VVPlan> {
    const { data, error } = await supabase
      .from('vv_plans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteVVPlan(id: string): Promise<void> {
    const { error } = await supabase
      .from('vv_plans')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getVVPlansByFamily(companyId: string, familyIdentifier: string): Promise<VVPlan[]> {
    const { data, error } = await supabase
      .from('vv_plans')
      .select('*')
      .eq('company_id', companyId)
      .eq('scope_type', 'product_family')
      .eq('family_identifier', familyIdentifier)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Test Cases
  static async getTestCases(companyId: string, productId: string, filters?: {
    test_type?: 'verification' | 'validation';
    test_level?: string;
    category?: string;
    status?: string;
  }): Promise<TestCase[]> {
    let query = supabase
      .from('test_cases')
      .select('*')
      .eq('company_id', companyId)
      .eq('product_id', productId);

    if (filters?.test_type) {
      query = query.eq('test_type', filters.test_type);
    }
    if (filters?.test_level) {
      query = query.eq('test_level', filters.test_level);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('test_case_id', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async createTestCase(testCase: Omit<TestCase, 'id' | 'created_at' | 'updated_at'>): Promise<TestCase> {
    const { data, error } = await supabase
      .from('test_cases')
      .insert(testCase)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTestCase(id: string, updates: Partial<TestCase>): Promise<TestCase> {
    const { data, error } = await supabase
      .from('test_cases')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteTestCase(id: string): Promise<void> {
    const { error } = await supabase
      .from('test_cases')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Test Executions
  static async getTestExecutions(testCaseId: string): Promise<TestExecution[]> {
    const { data, error } = await supabase
      .from('test_executions')
      .select('*')
      .eq('test_case_id', testCaseId)
      .order('execution_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createTestExecution(execution: Omit<TestExecution, 'id' | 'created_at' | 'updated_at'>): Promise<TestExecution> {
    const { data, error } = await supabase
      .from('test_executions')
      .insert(execution)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTestExecution(id: string, updates: Partial<TestExecution>): Promise<TestExecution> {
    const { data, error } = await supabase
      .from('test_executions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Defects
  static async getDefects(companyId: string, productId: string, filters?: {
    status?: string;
    severity?: string;
    defect_type?: string;
  }): Promise<Defect[]> {
    let query = supabase
      .from('defects')
      .select('*')
      .eq('company_id', companyId)
      .eq('product_id', productId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters?.defect_type) {
      query = query.eq('defect_type', filters.defect_type);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createDefect(defect: Omit<Defect, 'id' | 'created_at' | 'updated_at'>): Promise<Defect> {
    const { data, error } = await supabase
      .from('defects')
      .insert(defect)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateDefect(id: string, updates: Partial<Defect>): Promise<Defect> {
    const { data, error } = await supabase
      .from('defects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteDefect(id: string): Promise<void> {
    const { error } = await supabase
      .from('defects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Get all executions for a product (for dashboard stats)
  static async getAllTestExecutions(companyId: string, productId: string): Promise<(TestExecution & { test_case?: TestCase })[]> {
    // First get all test case IDs for this product
    const { data: testCases, error: tcError } = await supabase
      .from('test_cases')
      .select('id')
      .eq('company_id', companyId)
      .eq('product_id', productId);

    if (tcError) throw tcError;
    if (!testCases || testCases.length === 0) return [];

    const testCaseIds = testCases.map(tc => tc.id);

    const { data, error } = await supabase
      .from('test_executions')
      .select('*')
      .in('test_case_id', testCaseIds)
      .order('execution_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Generate next execution ID
  static async getNextExecutionId(companyId: string): Promise<string> {
    const { data, error } = await supabase
      .from('test_executions')
      .select('execution_id')
      .like('execution_id', 'EXE-%')
      .order('execution_id', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      return 'EXE-001';
    }

    const lastId = data[0].execution_id;
    const lastNumber = parseInt(lastId.split('-')[1] || '0');
    return `EXE-${(lastNumber + 1).toString().padStart(3, '0')}`;
  }

  // Generate unique IDs
  static async getNextTestCaseId(companyId: string, testType: 'verification' | 'validation'): Promise<string> {
    const prefix = testType === 'verification' ? 'TC' : 'VTC';
    
    const { data, error } = await supabase
      .from('test_cases')
      .select('test_case_id')
      .eq('company_id', companyId)
      .like('test_case_id', `${prefix}-%`)
      .order('test_case_id', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      return `${prefix}-001`;
    }

    const lastId = data[0].test_case_id;
    const lastNumber = parseInt(lastId.split('-')[1] || '0');
    const nextNumber = lastNumber + 1;
    
    return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
  }

  static async getNextDefectId(companyId: string): Promise<string> {
    const { data, error } = await supabase
      .from('defects')
      .select('defect_id')
      .eq('company_id', companyId)
      .like('defect_id', 'DEF-%')
      .order('defect_id', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      return 'DEF-001';
    }

    const lastId = data[0].defect_id;
    const lastNumber = parseInt(lastId.split('-')[1] || '0');
    const nextNumber = lastNumber + 1;
    
    return `DEF-${nextNumber.toString().padStart(3, '0')}`;
  }
}

export const vvService = VVService;