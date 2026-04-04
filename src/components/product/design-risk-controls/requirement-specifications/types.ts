export interface RequirementSpecification {
  id: string;
  requirement_id: string; // RS-001 format
  product_id: string;
  company_id: string;
  description: string;
  traces_to: string;
  linked_risks: string;
  verification_status: 'Not Started' | 'In Progress' | 'Passed' | 'Failed';
  category: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  component_id?: string | null;
}

export interface CreateRequirementSpecificationData {
  description: string;
  traces_to: string;
  linked_risks: string;
  verification_status: 'Not Started' | 'In Progress' | 'Passed' | 'Failed';
  category: string;
  component_id?: string | null;
}

export interface UpdateRequirementSpecificationData {
  description?: string;
  traces_to?: string;
  linked_risks?: string;
  verification_status?: 'Not Started' | 'In Progress' | 'Passed' | 'Failed';
  category?: string;
  component_id?: string | null;
}

// Define requirement categories for dropdowns
export const REQUIREMENT_CATEGORIES = [
  { id: 'system_use', label: 'System Use', description: 'Overall system functionality and operational requirements' },
  { id: 'safety', label: 'Safety', description: 'Patient and user safety requirements' },
  { id: 'risk_control', label: 'Risk Control', description: 'Risk mitigation and control measures' },
  { id: 'usability', label: 'Usability', description: 'Human factors and user interface requirements' },
  { id: 'regulatory', label: 'Regulatory', description: 'Compliance with standards and regulations' },
  { id: 'lifetime', label: 'Lifetime', description: 'Durability, shelf life, and lifecycle requirements' },
  { id: 'environmental', label: 'Environmental', description: 'Storage, transport, and environmental conditions' },
  { id: 'packaging', label: 'Packaging', description: 'Packaging integrity, labeling, and sterility' },
  { id: 'mechanical', label: 'Mechanical', description: 'Physical properties and mechanical performance' },
  { id: 'electronics', label: 'Electronics', description: 'Electrical safety and electronic performance' },
  { id: 'software', label: 'Software', description: 'Software functionality and validation' },
  { id: 'user_documentation', label: 'User Documentation', description: 'Instructions, training, and warnings' }
] as const;