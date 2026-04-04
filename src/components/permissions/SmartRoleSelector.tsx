import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SmartRoleSelectorProps {
  companyId: string;
  selectedDepartment: string;
  selectedRole: string;
  onRoleChange: (role: string) => void;
  disabled?: boolean;
}

// Comprehensive role suggestions by department with aliases for better matching
const DEFAULT_ROLES_BY_DEPARTMENT = {
  // Research & Development variations
  "Research & Development": [
    "Head of R&D", "R&D Director", "R&D Manager", "Senior R&D Manager",
    "Product Manager", "Senior Product Manager", "Product Owner",
    "Design Engineer", "Senior Design Engineer", "Lead Design Engineer", "Principal Engineer",
    "Research Scientist", "Senior Research Scientist", "Research Associate",
    "Clinical Research Associate", "Clinical Research Coordinator", "Clinical Scientist",
    "Biomedical Engineer", "Senior Biomedical Engineer", "Medical Device Engineer",
    "Software Engineer", "Senior Software Engineer", "Firmware Engineer", "Embedded Systems Engineer",
    "Innovation Manager", "Technology Transfer Specialist", "Project Engineer", "Development Engineer"
  ],
  "Design & Development": [
    "Head of Design", "Design Director", "Design Manager", "Senior Design Manager",
    "Product Designer", "Senior Product Designer", "UX/UI Designer",
    "Industrial Designer", "Mechanical Designer", "Electronics Designer",
    "CAD Engineer", "Design Engineer", "Senior Design Engineer", "Lead Designer",
    "Prototype Engineer", "Design for Manufacturing Engineer", "Usability Engineer",
    "Human Factors Engineer", "Design Controls Specialist", "Innovation Designer"
  ],
  "R&D": [
    "R&D Director", "R&D Manager", "Research Manager", "Development Manager",
    "Research Scientist", "Development Engineer", "Innovation Engineer",
    "Technical Lead", "Research Associate", "Development Associate"
  ],

  // Quality & Regulatory variations
  "Quality Assurance": [
    "QA Director", "QA Manager", "Senior QA Manager", "QA Team Lead",
    "Quality Engineer", "Senior Quality Engineer", "Quality Systems Engineer",
    "Validation Engineer", "Senior Validation Engineer", "Validation Specialist",
    "QA Analyst", "Quality Analyst", "Quality Coordinator",
    "Compliance Officer", "Quality Compliance Manager", "Regulatory Compliance Officer",
    "Audit Manager", "Internal Auditor", "Quality Auditor", "Audit Specialist",
    "Quality Inspector", "Quality Control Technician", "QC Analyst",
    "Document Control Specialist", "Change Control Coordinator"
  ],
  "Quality Control": [
    "QC Manager", "Quality Control Manager", "QC Supervisor",
    "QC Analyst", "Quality Control Analyst", "QC Technician",
    "Testing Specialist", "Laboratory Technician", "Inspection Specialist"
  ],
  "Regulatory Affairs": [
    "Head of Regulatory", "Regulatory Director", "Regulatory Manager", "Senior Regulatory Manager",
    "Regulatory Specialist", "Senior Regulatory Specialist", "Regulatory Associate",
    "Compliance Manager", "Compliance Officer", "Regulatory Compliance Specialist",
    "Regulatory Consultant", "External Regulatory Consultant",
    "Clinical Affairs Manager", "Clinical Regulatory Manager", "Clinical Affairs Specialist",
    "Market Access Manager", "Market Access Specialist", "Reimbursement Specialist",
    "Regulatory Writer", "Regulatory Documentation Specialist", "Submission Manager",
    "Notified Body Liaison", "FDA Liaison", "International Regulatory Manager"
  ],
  "Regulatory": [
    "Regulatory Manager", "Regulatory Specialist", "Regulatory Associate",
    "Compliance Manager", "Regulatory Consultant", "Submission Specialist"
  ],

  // Manufacturing & Operations
  "Manufacturing": [
    "Manufacturing Director", "Manufacturing Manager", "Senior Manufacturing Manager",
    "Production Manager", "Production Supervisor", "Production Lead",
    "Process Engineer", "Senior Process Engineer", "Manufacturing Engineer",
    "Production Engineer", "Operations Engineer", "Industrial Engineer",
    "Manufacturing Technician", "Production Technician", "Assembly Technician",
    "Operations Manager", "Plant Manager", "Facility Manager",
    "Supply Chain Manager", "Materials Manager", "Inventory Manager",
    "Continuous Improvement Manager", "Lean Manufacturing Specialist"
  ],
  "Production": [
    "Production Director", "Production Manager", "Production Supervisor",
    "Production Engineer", "Production Technician", "Production Coordinator"
  ],
  "Operations": [
    "Operations Director", "Operations Manager", "Operations Supervisor",
    "Operations Analyst", "Process Improvement Manager", "Operations Coordinator"
  ],

  // Sales & Marketing variations
  "Sales & Marketing": [
    "Sales Director", "Sales Manager", "Regional Sales Manager", "Senior Sales Manager",
    "Marketing Director", "Marketing Manager", "Senior Marketing Manager",
    "Business Development Manager", "BD Manager", "Business Development Representative",
    "Account Manager", "Key Account Manager", "Senior Account Manager", "Customer Success Manager",
    "Marketing Specialist", "Digital Marketing Specialist", "Product Marketing Manager",
    "Sales Representative", "Sales Associate", "Territory Manager", "Field Sales Representative",
    "Market Research Manager", "Marketing Analyst", "Brand Manager",
    "Channel Partner Manager", "Distribution Manager", "Export Manager"
  ],
  "Sales": [
    "Sales Director", "Sales Manager", "Regional Sales Manager",
    "Account Manager", "Sales Representative", "Territory Manager",
    "Business Development Manager", "Channel Manager"
  ],
  "Marketing": [
    "Marketing Director", "Marketing Manager", "Product Marketing Manager",
    "Digital Marketing Manager", "Brand Manager", "Marketing Specialist",
    "Market Research Manager", "Marketing Coordinator"
  ],
  "Business Development": [
    "Business Development Director", "BD Manager", "Business Development Representative",
    "Strategic Partnerships Manager", "Market Development Manager"
  ],

  // Clinical & Medical Affairs
  "Clinical Affairs": [
    "Clinical Director", "Clinical Manager", "Senior Clinical Manager",
    "Clinical Research Manager", "Clinical Operations Manager",
    "Clinical Research Associate", "Senior CRA", "Clinical Research Coordinator",
    "Clinical Data Manager", "Clinical Data Analyst", "Clinical Database Manager",
    "Medical Affairs Manager", "Medical Affairs Director", "Medical Science Liaison",
    "Clinical Specialist", "Clinical Application Specialist", "Clinical Training Manager",
    "Principal Investigator", "Clinical Monitor", "Clinical Quality Assurance Manager"
  ],
  "Clinical": [
    "Clinical Manager", "Clinical Research Manager", "Clinical Operations Manager",
    "Clinical Research Associate", "Clinical Data Manager", "Clinical Specialist"
  ],
  "Medical Affairs": [
    "Medical Affairs Director", "Medical Affairs Manager", "Medical Science Liaison",
    "Clinical Evidence Manager", "Medical Writer", "Medical Information Specialist"
  ],

  // Post-Market & Safety
  "Post Market Surveillance": [
    "PMS Director", "PMS Manager", "Post-Market Surveillance Manager",
    "Vigilance Manager", "Safety Manager", "Product Safety Manager",
    "Vigilance Officer", "Safety Officer", "Pharmacovigilance Specialist",
    "Complaint Manager", "Complaint Handler", "Customer Complaint Specialist",
    "Risk Manager", "Risk Assessment Specialist", "Risk Management Coordinator",
    "Surveillance Analyst", "Safety Data Analyst", "Market Surveillance Specialist",
    "Field Safety Corrective Action Manager", "FSCA Coordinator"
  ],
  "Post-Market Surveillance": [
    "Post-Market Manager", "Surveillance Manager", "Safety Manager",
    "Vigilance Officer", "Risk Manager", "Complaint Handler"
  ],
  "Safety": [
    "Safety Manager", "Product Safety Manager", "Safety Officer",
    "Safety Specialist", "Vigilance Officer", "Risk Manager"
  ],

  // Support Functions
  "Finance": [
    "Finance Director", "Finance Manager", "Financial Analyst",
    "Controller", "Cost Accountant", "Budget Manager", "Treasury Manager"
  ],
  "Human Resources": [
    "HR Director", "HR Manager", "HR Business Partner",
    "Talent Acquisition Manager", "Training Manager", "Compensation Manager"
  ],
  "IT": [
    "IT Director", "IT Manager", "System Administrator",
    "Database Administrator", "Network Administrator", "IT Support Specialist"
  ],
  "Legal": [
    "General Counsel", "Legal Manager", "Legal Counsel",
    "Contracts Manager", "IP Manager", "Legal Assistant"
  ],
  "Supply Chain": [
    "Supply Chain Director", "Supply Chain Manager", "Procurement Manager",
    "Logistics Manager", "Vendor Manager", "Materials Manager"
  ]
};

// Department name aliases for better matching
const DEPARTMENT_ALIASES: Record<string, string[]> = {
  "Research & Development": ["R&D", "Design & Development", "Product Development", "Innovation", "Engineering"],
  "Quality Assurance": ["QA", "Quality", "Quality Control", "QC", "Quality Management"],
  "Regulatory Affairs": ["Regulatory", "Compliance", "RA", "Regulatory Compliance"],
  "Manufacturing": ["Production", "Operations", "Manufacturing Operations", "Plant Operations"],
  "Sales & Marketing": ["Sales", "Marketing", "Business Development", "Commercial"],
  "Clinical Affairs": ["Clinical", "Medical Affairs", "Clinical Operations", "Clinical Research"],
  "Post Market Surveillance": ["PMS", "Post-Market Surveillance", "Safety", "Vigilance", "Market Surveillance"]
};

// Function to find the best matching department for role suggestions
const findBestDepartmentMatch = (departmentName: string): string => {
  // Direct match
  if (DEFAULT_ROLES_BY_DEPARTMENT[departmentName]) {
    return departmentName;
  }
  
  // Check aliases
  for (const [mainDept, aliases] of Object.entries(DEPARTMENT_ALIASES)) {
    if (aliases.some(alias => 
      departmentName.toLowerCase().includes(alias.toLowerCase()) ||
      alias.toLowerCase().includes(departmentName.toLowerCase())
    )) {
      return mainDept;
    }
  }
  
  // Fuzzy matching for common variations
  const normalizedInput = departmentName.toLowerCase().replace(/[&\s-]/g, '');
  for (const deptName of Object.keys(DEFAULT_ROLES_BY_DEPARTMENT)) {
    const normalizedDept = deptName.toLowerCase().replace(/[&\s-]/g, '');
    if (normalizedInput.includes(normalizedDept.substring(0, 5)) || 
        normalizedDept.includes(normalizedInput.substring(0, 5))) {
      return deptName;
    }
  }
  
  return departmentName; // Return original if no match found
};

export function SmartRoleSelector({ 
  companyId, 
  selectedDepartment, 
  selectedRole, 
  onRoleChange, 
  disabled 
}: SmartRoleSelectorProps) {
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedDepartment) {
      loadRolesForDepartment();
    } else {
      setAvailableRoles([]);
    }
  }, [selectedDepartment, companyId]);

  const loadRolesForDepartment = async () => {
    try {
      setIsLoading(true);
      
      const { data: companyData, error } = await supabase
        .from('companies')
        .select('department_structure')
        .eq('id', companyId)
        .single();

      if (error) throw error;

      const departmentStructure = companyData?.department_structure as any[];
      if (departmentStructure && Array.isArray(departmentStructure)) {
        const department = departmentStructure.find((dept: any) => dept.name === selectedDepartment);
        
        // Only use roles from the department configuration (enabled roles)
        const allDepartmentRoles = (department?.roles as string[]) || [];
        const customRoles = (department?.customRoles as string[]) || [];
        const disabledRoles = (department?.disabledRoles as string[]) || [];
        
        // Combine default roles and custom roles, filter out disabled ones
        const enabledRoles = [...allDepartmentRoles, ...customRoles].filter(
          role => !disabledRoles.includes(role)
        );
        
        setAvailableRoles(enabledRoles);
      } else {
        setAvailableRoles([]);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      setAvailableRoles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addNewRole = async () => {
    if (!newRoleName.trim() || !selectedDepartment) return;

    try {
      // Get current department structure
      const { data: companyData, error: fetchError } = await supabase
        .from('companies')
        .select('department_structure')
        .eq('id', companyId)
        .single();

      if (fetchError) throw fetchError;

      let departmentStructure = (companyData?.department_structure as any[]) || [];
      
      // Find and update the department with the new role
      const updatedStructure = departmentStructure.map((dept: any) => {
        if (dept.name === selectedDepartment) {
          const currentRoles = dept.roles || [];
          if (!currentRoles.includes(newRoleName.trim())) {
            return {
              ...dept,
              roles: [...currentRoles, newRoleName.trim()]
            };
          }
        }
        return dept;
      });

      // Save back to database
      const { error: updateError } = await supabase
        .from('companies')
        .update({ department_structure: updatedStructure })
        .eq('id', companyId);

      if (updateError) throw updateError;

      // Update local state
      setAvailableRoles(prev => [...prev, newRoleName.trim()]);
      onRoleChange(newRoleName.trim());
      setNewRoleName("");
      setShowAddRole(false);
      
      toast.success(`Role "${newRoleName.trim()}" added successfully`);
    } catch (error) {
      console.error('Error adding new role:', error);
      toast.error('Failed to add new role');
    }
  };

  if (!selectedDepartment) {
    return (
      <div className="space-y-2">
        <Label className="text-muted-foreground">Role</Label>
        <div className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/20">
          Please select a functional area first
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Role</Label>
      
      {isLoading ? (
        <div className="flex items-center justify-center p-2 border rounded-md">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-2">
          <Select
            value={selectedRole}
            onValueChange={onRoleChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
              <SelectItem value="__add_new__" className="border-t mt-1 pt-1">
                <div className="flex items-center gap-2 text-primary">
                  <Plus className="h-3 w-3" />
                  Add new role
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {selectedRole === "__add_new__" && (
            <div className="flex gap-2 p-2 border rounded-md bg-muted/20">
              <Input
                placeholder="Enter new role name"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addNewRole();
                  }
                  if (e.key === 'Escape') {
                    setNewRoleName("");
                    onRoleChange("");
                  }
                }}
                autoFocus
              />
              <Button
                size="sm"
                onClick={addNewRole}
                disabled={!newRoleName.trim()}
              >
                Add
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setNewRoleName("");
                  onRoleChange("");
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          {availableRoles.length > 0 && selectedRole !== "__add_new__" && (
            <div className="text-xs text-muted-foreground">
              {availableRoles.length} roles available for {selectedDepartment}
            </div>
          )}
        </div>
      )}
    </div>
  );
}