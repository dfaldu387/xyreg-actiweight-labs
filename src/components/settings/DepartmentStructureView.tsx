import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Building, Plus, Save, Sparkles, Users, Move, Edit, Trash2, User, Palette, ChevronsUpDown, Check, LayoutGrid, GitBranch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { UserCard } from "@/components/users/UserCard";
import { DepartmentPeople } from "@/components/users/DepartmentPeople";
import { useTranslation } from "@/hooks/useTranslation";
import { ValueChainView } from "./ValueChainView";

interface Department {
  id: string;
  name: string;
  departmentHead?: string;
  departmentHeadName?: string;
  keyResponsibilities: string;
  position: number;
  isEnabled?: boolean;
  x?: number;
  y?: number;
  color?: string;
  width?: number;
  height?: number;
  roles?: string[];
  category?: 'support' | 'primary';
}

interface CompanyUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  functional_area?: string;
  avatar_url?: string | null;
}

interface DepartmentStructureViewProps {
  companyId: string;
}

const CARD_COLORS = [
  { name: 'Blue', value: 'from-blue-500 to-blue-600' },
  { name: 'Emerald', value: 'from-emerald-500 to-emerald-600' },
  { name: 'Purple', value: 'from-purple-500 to-purple-600' },
  { name: 'Orange', value: 'from-orange-500 to-orange-600' },
  { name: 'Pink', value: 'from-pink-500 to-pink-600' },
  { name: 'Indigo', value: 'from-indigo-500 to-indigo-600' },
  { name: 'Teal', value: 'from-teal-500 to-teal-600' },
  { name: 'Red', value: 'from-red-500 to-red-600' },
  { name: 'Amber', value: 'from-amber-500 to-amber-600' },
  { name: 'Cyan', value: 'from-cyan-500 to-cyan-600' },
  { name: 'Slate', value: 'from-slate-500 to-slate-600' },
  { name: 'Rose', value: 'from-rose-500 to-rose-600' }
];

const SUGGESTED_DEPARTMENTS = [
  "Quality Assurance",
  "Research & Development", 
  "Regulatory Affairs",
  "Manufacturing",
  "Clinical Affairs",
  "Product Development",
  "Quality Control",
  "Post Market Surveillance",
  "Design & Development",
  "Risk Management",
  "Supplier Management",
  "Validation",
  "Verification",
  "Documentation Control",
  "Training & Competence",
  "Management Review",
  "Corrective & Preventive Actions (CAPA)",
  "Customer Service",
  "Sales & Marketing",
  "Finance & Administration"
];

// Map department names to functional area enum values
// Normalize department names for matching (handles "Regulatory Affairs" vs "regulatory_affairs")
const normalizeDepartmentName = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
};

const mapDepartmentToFunctionalArea = (departmentName: string): string => {
  switch (departmentName) {
    case "Design & Development":
      return "design_development";
    case "Sales & Marketing":
      return "sales_marketing";
    case "Regulatory Affairs":
      return "regulatory_affairs";
    case "Quality Assurance":
      return "quality_assurance";
    case "Research & Development":
      return "research_development";
    case "Manufacturing":
      return "manufacturing";
    case "Clinical Affairs":
      return "clinical_affairs";
    default:
      return departmentName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  }
};

const DEFAULT_POSITIONS = [
  { x: 100, y: 100 },
  { x: 400, y: 100 },
  { x: 700, y: 100 },
  { x: 1000, y: 100 },
  { x: 250, y: 300 },
  { x: 550, y: 300 },
  { x: 850, y: 300 },
  { x: 400, y: 500 },
  { x: 700, y: 500 },
  { x: 550, y: 700 }
];

interface DraggableCardProps {
  department: Department;
  index: number;
  users: CompanyUser[];
  employeeCount: number;
  employees: CompanyUser[];
  totalFTE: number;
  onEdit: () => void;
  onDelete: () => void;
  onPositionChange: (x: number, y: number) => void;
  onSizeChange: (width: number, height: number) => void;
  onUserUpdate: () => void;
  lang: (key: string, params?: Record<string, any>) => string;
}

function DraggableCard({ department, index, users, employeeCount, employees, totalFTE, onEdit, onDelete, onPositionChange, onSizeChange, onUserUpdate, lang }: DraggableCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const cardColor = department.color || CARD_COLORS[index % CARD_COLORS.length].value;
  const cardWidth = department.width || 256;
  const cardHeight = department.height || 'auto';

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Only allow dragging from the drag-handle area
    if (!target.closest('.drag-handle')) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - (department.x || 0),
      y: e.clientY - (department.y || 0)
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      onPositionChange(Math.max(0, newX), Math.max(0, newY));
    } else if (isResizing) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      const newWidth = Math.max(200, cardWidth + deltaX);
      const newHeight = Math.max(120, (typeof cardHeight === 'number' ? cardHeight : 120) + deltaY);
      onSizeChange(newWidth, newHeight);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart]);

  return (
    <Card 
      ref={cardRef}
      className={`absolute cursor-move transition-all duration-200 hover:shadow-xl border-0 bg-gradient-to-br ${cardColor} rounded-lg overflow-hidden ${
        isDragging ? 'shadow-2xl scale-105 z-50' : 'hover:scale-102 z-10'
      }`}
      style={{ 
        left: department.x || 0, 
        top: department.y || 0,
        width: cardWidth,
        height: cardHeight,
        transform: isDragging ? 'rotate(2deg)' : 'rotate(0deg)'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="text-white">
        <CardHeader className="pb-3 relative">
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-white/70 hover:text-white hover:bg-white/20 h-6 w-6 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              className="text-white/70 hover:text-white hover:bg-white/20 h-6 w-6 p-0"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          <div className="drag-handle cursor-grab text-center">
            <h3 className="font-semibold text-sm leading-tight mb-2">
              {department.name || lang('companySettings.departments.untitledDepartment')}
            </h3>
            
            <div className="flex items-center justify-start gap-2 flex-wrap">
              <Building className="h-4 w-4" />
              {employeeCount > 0 && (
                <>
                  <Badge variant="secondary" className="text-xs bg-white/30 text-white border-white/40 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {employeeCount} • {Math.round(totalFTE)}% FTE
                  </Badge>
                  <DepartmentPeople
                    departmentName={department.name}
                    users={employees}
                    onUserUpdate={onUserUpdate}
                  />
                </>
              )}
            </div>

            {department.departmentHeadName && (
              <div className="flex items-center justify-start gap-1 mt-2 text-xs text-white/90">
                <User className="h-3 w-3" />
                <span className="truncate">{department.departmentHeadName}</span>
              </div>
            )}
          </div>
        </CardHeader>
        
      </div>
      

      {/* Resize Handle */}
      <div 
        className="absolute bottom-0 right-0 w-4 h-4 bg-muted/50 cursor-nw-resize hover:bg-muted"
        onMouseDown={handleResizeMouseDown}
        style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lang('companySettings.departments.deleteDepartment')}</AlertDialogTitle>
            <AlertDialogDescription>
              {lang('companySettings.departments.deleteConfirmation', { name: department.name || lang('companySettings.departments.thisDepartment') })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{lang('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
              {lang('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export function DepartmentStructureView({ companyId }: DepartmentStructureViewProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [employeesByDept, setEmployeesByDept] = useState<Record<string, { employees: CompanyUser[]; totalFTE: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [viewMode, setViewMode] = useState<'canvas' | 'valuechain'>('valuechain');
  const { toast } = useToast();
  const { lang } = useTranslation();

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch company users with their functional areas
      const { data: companyUsers, error: usersError } = await supabase
        .from('user_company_access')
        .select(`
          user_id,
          functional_area,
          user_profiles!inner(
            id,
            email,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('company_id', companyId);

      if (usersError) throw usersError;

      const usersList = companyUsers?.map(u => ({
        id: u.user_profiles.id,
        email: u.user_profiles.email,
        first_name: u.user_profiles.first_name,
        last_name: u.user_profiles.last_name,
        functional_area: u.functional_area,
        avatar_url: u.user_profiles.avatar_url,
      })) || [];

      setUsers(usersList);
      
      // Group employees by normalized department name
      // Load employee assignments from user_department_assignments table
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_department_assignments')
        .select('user_id, department_name, fte_allocation')
        .eq('company_id', companyId);

      if (assignmentsError) throw assignmentsError;

      // Get unique user IDs from assignments
      const userIds = [...new Set(assignments?.map(a => a.user_id) || [])];
      
      // Fetch user profiles and access levels in parallel
      const [profilesResult, accessResult] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('id, email, first_name, last_name, avatar_url')
          .in('id', userIds),
        supabase
          .from('user_company_access')
          .select('user_id, access_level')
          .eq('company_id', companyId)
          .in('user_id', userIds)
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (accessResult.error) throw accessResult.error;

      const profilesData = profilesResult.data;
      // Build set of consultant user IDs to exclude from department groupings
      const consultantUserIds = new Set(
        (accessResult.data || [])
          .filter(a => a.access_level === 'consultant')
          .map(a => a.user_id)
      );

      // Create a map of user profiles for quick lookup
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      // Group employees by normalized department name with FTE
      const groupedEmployees: Record<string, { employees: CompanyUser[]; totalFTE: number }> = {};
      
      assignments?.forEach((a: any) => {
        // Include consultants in their assigned departments
        const profile = profilesMap.get(a.user_id);
        if (!profile) return;

        const normalizedDept = normalizeDepartmentName(a.department_name);
        if (!groupedEmployees[normalizedDept]) {
          groupedEmployees[normalizedDept] = { employees: [], totalFTE: 0 };
        }
        
        const employee: CompanyUser = {
          id: profile.id,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          avatar_url: profile.avatar_url,
        };
        groupedEmployees[normalizedDept].employees.push(employee);
        groupedEmployees[normalizedDept].totalFTE += ((a.fte_allocation || 0) * 100); // Convert to percentage
      });
      setEmployeesByDept(groupedEmployees);

      // Fetch existing department structure
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError && companyError.code !== 'PGRST116') throw companyError;

      const departmentStructure = (companyData as any)?.department_structure;
      if (departmentStructure && Array.isArray(departmentStructure)) {
        const deps = departmentStructure as Department[];
        
        // Only show departments that have employees assigned
        const depsToShow = deps.filter(dept => {
          const normalizedDeptName = normalizeDepartmentName(dept.name);
          const hasEmployees = groupedEmployees[normalizedDeptName] && groupedEmployees[normalizedDeptName].employees.length > 0;
          return hasEmployees;
        });
        
        const depsWithNames = depsToShow.map((dept, index) => {
          const headUser = usersList.find(u => u.id === dept.departmentHead);
          
          return {
            ...dept,
            departmentHeadName: headUser ? `${headUser.first_name || ''} ${headUser.last_name || ''}`.trim() || headUser.email : undefined,
            x: dept.x || DEFAULT_POSITIONS[index % DEFAULT_POSITIONS.length].x,
            y: dept.y || DEFAULT_POSITIONS[index % DEFAULT_POSITIONS.length].y,
            color: dept.color || CARD_COLORS[index % CARD_COLORS.length].value,
            width: dept.width || 256,
            height: dept.height || undefined
          };
        });
        setDepartments(depsWithNames);
      } else {
        // Initialize with default departments
        const defaultDepts = [
          { id: '1', name: 'Research & Development', keyResponsibilities: 'Product development, clinical trials, design controls', position: 0 },
          { id: '2', name: 'Regulatory Affairs', keyResponsibilities: 'Regulatory submissions, market approvals, compliance monitoring', position: 1 },
          { id: '3', name: 'Manufacturing', keyResponsibilities: 'Production, process validation, supply chain management', position: 2 },
          { id: '4', name: 'Quality Assurance', keyResponsibilities: 'Quality management, regulatory compliance, audits', position: 3 },
        ].map((dept, index) => ({
          ...dept,
          x: DEFAULT_POSITIONS[index].x,
          y: DEFAULT_POSITIONS[index].y,
          color: CARD_COLORS[index % CARD_COLORS.length].value,
          width: 256
        }));
        setDepartments(defaultDepts);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: lang('common.error'),
        description: lang('companySettings.departments.failedToLoad'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addDepartment = () => {
    const newDept: Department = {
      id: Date.now().toString(),
      name: '',
      keyResponsibilities: '',
      position: departments.length,
      x: DEFAULT_POSITIONS[departments.length % DEFAULT_POSITIONS.length].x,
      y: DEFAULT_POSITIONS[departments.length % DEFAULT_POSITIONS.length].y,
      color: CARD_COLORS[departments.length % CARD_COLORS.length].value,
      width: 256,
      roles: []
    };
    // Don't add to departments array yet - wait for user to save
    setEditingDepartment(newDept);
  };

  const updateDepartment = (id: string, updates: Partial<Department>) => {
    setDepartments(departments.map(dept => {
      if (dept.id === id) {
        const updated = { ...dept, ...updates };
        if (updates.departmentHead) {
          const headUser = users.find(u => u.id === updates.departmentHead);
          updated.departmentHeadName = headUser ? `${headUser.first_name || ''} ${headUser.last_name || ''}`.trim() || headUser.email : undefined;
        }
        return updated;
      }
      return dept;
    }));
  };

  const updateDepartmentPosition = (id: string, x: number, y: number) => {
    updateDepartment(id, { x, y });
    // Force re-render to ensure color is maintained during drag
    setDepartments(prevDepts => [...prevDepts]);
    
    // Auto-save position changes after a short delay
    setTimeout(() => {
      saveDepartmentStructure();
    }, 1000);
  };

  const updateDepartmentSize = (id: string, width: number, height: number) => {
    updateDepartment(id, { width, height });
    // Force re-render to ensure color is maintained during resize
    setDepartments(prevDepts => [...prevDepts]);
    
    // Auto-save size changes after a short delay
    setTimeout(() => {
      saveDepartmentStructure();
    }, 1000);
  };

  const removeDepartment = async (id: string) => {
    const updatedDepartments = departments.filter(dept => dept.id !== id);
    setDepartments(updatedDepartments);
    
    // Auto-save after deletion
    try {
      const cleanDepartments = updatedDepartments.map(({ departmentHeadName, ...dept }) => dept);
      
      const { error } = await supabase
        .from('companies')
        .update({ department_structure: cleanDepartments } as any)
        .eq('id', companyId);

      if (error) throw error;

      toast({
        title: lang('common.success'),
        description: lang('companySettings.departments.deletedSuccess')
      });
    } catch (error) {
      console.error('Error saving after deletion:', error);
      toast({
        title: lang('common.error'),
        description: lang('companySettings.departments.failedToSave'),
        variant: "destructive"
      });
    }
  };

  const saveDepartmentStructure = async () => {
    try {
      setIsSaving(true);
      
      const cleanDepartments = departments.map(({ departmentHeadName, ...dept }) => dept);
      
      const { error } = await supabase
        .from('companies')
        .update({ department_structure: cleanDepartments } as any)
        .eq('id', companyId);

      if (error) throw error;

      toast({
        title: lang('common.success'),
        description: lang('companySettings.departments.savedSuccess')
      });
    } catch (error) {
      console.error('Error saving department structure:', error);
      toast({
        title: lang('common.error'),
        description: lang('companySettings.departments.failedToSave'),
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{lang('companySettings.departments.title')}</h2>
              <p className="text-sm text-muted-foreground font-normal">
                {lang('companySettings.departments.subtitle')}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Department Overview Table */}
          {departments.length > 0 && (
            <div className="mb-6 p-4 bg-white rounded-lg border">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Building className="h-4 w-4" />
                {lang('companySettings.departments.overview')}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">{lang('companySettings.departments.department')}</th>
                      <th className="text-center py-2 px-3 font-medium text-muted-foreground">{lang('companySettings.departments.employees')}</th>
                      <th className="text-center py-2 px-3 font-medium text-muted-foreground">{lang('companySettings.departments.totalFTE')}</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">{lang('companySettings.departments.head')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((dept, index) => {
                      const normalizedDeptName = normalizeDepartmentName(dept.name);
                      const deptData = employeesByDept[normalizedDeptName] || { employees: [], totalFTE: 0 };
                      return (
                        <tr key={dept.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-2 px-3 font-medium">{dept.name}</td>
                          <td className="py-2 px-3 text-center">{deptData.employees.length}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                              {(deptData.totalFTE / 100).toFixed(2)}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-muted-foreground">
                            {dept.departmentHeadName || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Move className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                {viewMode === 'canvas' ? lang('companySettings.departments.dragInstructions') : 'Porter\'s Value Chain view — click a department to edit'}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'valuechain' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('valuechain')}
                className="gap-1.5 h-8"
              >
                <GitBranch className="h-4 w-4" />
                Value Chain
              </Button>
              <Button
                variant={viewMode === 'canvas' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('canvas')}
                className="gap-1.5 h-8"
              >
                <LayoutGrid className="h-4 w-4" />
                Canvas
              </Button>
            </div>
          </div>

          {viewMode === 'canvas' ? (
            <>
              {/* Canvas Area */}
              <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border min-h-[800px] overflow-hidden">
                {departments.map((department, index) => {
                  const normalizedDeptName = normalizeDepartmentName(department.name);
                  const deptData = employeesByDept[normalizedDeptName] || { employees: [], totalFTE: 0 };
                  
                  return (
                    <DraggableCard
                      key={department.id}
                      department={department}
                      index={index}
                      users={users}
                      employeeCount={deptData.employees.length}
                      employees={deptData.employees}
                      totalFTE={deptData.totalFTE}
                      onEdit={() => setEditingDepartment(department)}
                      onDelete={() => removeDepartment(department.id)}
                      onPositionChange={(x, y) => updateDepartmentPosition(department.id, x, y)}
                      onSizeChange={(width, height) => updateDepartmentSize(department.id, width, height)}
                      onUserUpdate={fetchData}
                      lang={lang}
                    />
                  );
                })}
                
                {departments.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">{lang('companySettings.departments.noDepartmentsYet')}</h3>
                      <p className="text-muted-foreground mb-4">
                        {lang('companySettings.departments.createFirstDesc')}
                      </p>
                      <Button onClick={addDepartment} className="gap-2">
                        <Plus className="h-4 w-4" />
                        {lang('companySettings.departments.createFirstDepartment')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <ValueChainView
              departments={departments}
              employeesByDept={employeesByDept}
              normalizeDepartmentName={normalizeDepartmentName}
              onDepartmentClick={(dept) => setEditingDepartment(dept)}
              onUserUpdate={fetchData}
              onCategoryChange={async (deptId, category) => {
                const updatedDepartments = departments.map(d =>
                  d.id === deptId ? { ...d, category } : d
                );
                setDepartments(updatedDepartments);
                try {
                  const cleanDepartments = updatedDepartments.map(({ departmentHeadName, ...dept }) => dept);
                  const { error } = await supabase
                    .from('companies')
                    .update({ department_structure: cleanDepartments } as any)
                    .eq('id', companyId);
                  if (error) throw error;
                } catch (error) {
                  console.error('Error saving category change:', error);
                }
              }}
              onReorder={async (deptId, targetIndex, category) => {
                // Remove dept from current position, update category, insert at target index within that category's list
                const dept = departments.find(d => d.id === deptId);
                if (!dept) return;

                const updatedDept = { ...dept, category };
                const otherDepts = departments.filter(d => d.id !== deptId);

                // Get depts in the target category (sorted by position)
                const categoryDepts = otherDepts
                  .filter(d => (d.category || undefined) === (category || undefined))
                  .sort((a, b) => a.position - b.position);
                const nonCategoryDepts = otherDepts.filter(d => (d.category || undefined) !== (category || undefined));

                // Insert at target index
                categoryDepts.splice(targetIndex, 0, updatedDept);

                // Recalculate positions for all depts
                const allDepts = [...nonCategoryDepts, ...categoryDepts].map((d, i) => ({ ...d, position: i }));
                setDepartments(allDepts);

                try {
                  const cleanDepartments = allDepts.map(({ departmentHeadName, ...d }) => d);
                  const { error } = await supabase
                    .from('companies')
                    .update({ department_structure: cleanDepartments } as any)
                    .eq('id', companyId);
                  if (error) throw error;
                } catch (error) {
                  console.error('Error saving reorder:', error);
                }
              }}
              companyId={companyId}
            />
          )}

          {departments.length > 0 && (
            <div className="mt-4 p-4 bg-muted/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  {departments.length} department{departments.length !== 1 ? 's' : ''} configured •{' '}
                  {departments.filter(d => d.departmentHead).length} with assigned heads
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={!!editingDepartment} onOpenChange={() => setEditingDepartment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDepartment?.name ? lang('companySettings.departments.editDepartmentName', { name: editingDepartment.name }) : lang('companySettings.departments.editDepartment')}
            </DialogTitle>
          </DialogHeader>
          
          {editingDepartment && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{lang('companySettings.departments.departmentName')}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={editingDepartment.name}
                      onChange={(e) => setEditingDepartment({
                        ...editingDepartment,
                        name: e.target.value
                      })}
                      placeholder={lang('companySettings.departments.typeDepartmentName')}
                      className="flex-1"
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-3 shrink-0"
                          type="button"
                        >
                          <ChevronsUpDown className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0 z-[9992]" align="end">
                        <Command>
                          <CommandInput placeholder={lang('companySettings.departments.searchSuggestions')} />
                          <CommandEmpty>{lang('companySettings.departments.noDepartmentsFound')}</CommandEmpty>
                          <CommandGroup heading={lang('companySettings.departments.suggestedDepartments')}>
                            {SUGGESTED_DEPARTMENTS.map((suggestion) => (
                              <CommandItem
                                key={suggestion}
                                value={suggestion}
                                onSelect={() => {
                                  setEditingDepartment({
                                    ...editingDepartment,
                                    name: suggestion
                                  });
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    editingDepartment.name === suggestion ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {suggestion}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>{lang('companySettings.departments.departmentHead')}</Label>
                  <Select
                    value={editingDepartment.departmentHead || 'none'}
                    onValueChange={(value) => setEditingDepartment({
                      ...editingDepartment,
                      departmentHead: value === 'none' ? '' : value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={lang('companySettings.departments.selectDepartmentHead')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{lang('companySettings.departments.noHeadAssigned')}</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.first_name && user.last_name 
                            ? `${user.first_name} ${user.last_name} (${user.email})`
                            : user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={editingDepartment.category || 'none'}
                    onValueChange={(value) => setEditingDepartment({
                      ...editingDepartment,
                      category: value === 'none' ? undefined : value as 'support' | 'primary'
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      <SelectItem value="support">Support Activity</SelectItem>
                      <SelectItem value="primary">Primary Activity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    {lang('companySettings.departments.cardColor')}
                  </Label>
                  <Select
                    value={editingDepartment.color}
                    onValueChange={(value) => setEditingDepartment({
                      ...editingDepartment,
                      color: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={lang('companySettings.departments.selectColor')} />
                    </SelectTrigger>
                    <SelectContent>
                      {CARD_COLORS.map((color) => (
                        <SelectItem key={color.name} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded bg-gradient-to-r ${color.value}`}></div>
                            {color.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{lang('companySettings.departments.cardSize')}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder={lang('companySettings.departments.width')}
                      value={editingDepartment.width || 256}
                      onChange={(e) => setEditingDepartment({
                        ...editingDepartment,
                        width: parseInt(e.target.value) || 256
                      })}
                      className="w-20"
                    />
                    <span className="text-muted-foreground">×</span>
                    <Input
                      type="number"
                      placeholder={lang('companySettings.departments.height')}
                      value={editingDepartment.height || ''}
                      onChange={(e) => setEditingDepartment({
                        ...editingDepartment,
                        height: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      className="w-20"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{lang('companySettings.departments.leaveHeightEmpty')}</p>
                </div>
              </div>
              
                 
                 <div className="space-y-3">
                   <Label>{lang('companySettings.departments.departmentRoles')}</Label>
                   <div className="space-y-2">
                     {editingDepartment.roles && editingDepartment.roles.length > 0 ? (
                       <div className="flex flex-wrap gap-2">
                         {editingDepartment.roles.map((role: string, index: number) => (
                           <Badge key={index} variant="secondary" className="text-xs">
                             {role}
                           </Badge>
                         ))}
                       </div>
                     ) : (
                       <p className="text-sm text-muted-foreground">{lang('companySettings.departments.noRolesDefined')}</p>
                     )}
                   </div>
                 </div>

              <div className="space-y-2">
                <Label>{lang('companySettings.departments.keyResponsibilities')}</Label>
                <Textarea
                  value={editingDepartment.keyResponsibilities}
                  onChange={(e) => setEditingDepartment({
                    ...editingDepartment,
                    keyResponsibilities: e.target.value
                  })}
                  placeholder={lang('companySettings.departments.describeResponsibilities')}
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setEditingDepartment(null)}>
                  {lang('common.cancel')}
                </Button>
                <Button onClick={async () => {
                  // Check if this is a new department (not yet saved)
                  const existingDept = departments.find(d => d.id === editingDepartment.id);
                  
                  let updatedDepartments: Department[];
                  
                  if (existingDept) {
                    // Update existing department
                    updatedDepartments = departments.map(dept => 
                      dept.id === editingDepartment.id ? editingDepartment : dept
                    );
                  } else {
                    // Add new department
                    updatedDepartments = [...departments, editingDepartment];
                  }
                  
                  setDepartments(updatedDepartments);
                  setEditingDepartment(null);
                  
                   // Auto-save to database
                   try {
                     const cleanDepartments = updatedDepartments.map(({ departmentHeadName, ...dept }) => dept);
                    
                    const { error } = await supabase
                      .from('companies')
                      .update({ department_structure: cleanDepartments } as any)
                      .eq('id', companyId);

                    if (error) throw error;

                    toast({
                      title: lang('common.success'),
                      description: lang('companySettings.departments.departmentSaved')
                    });
                  } catch (error) {
                    console.error('Error saving department:', error);
                    toast({
                      title: lang('common.error'),
                      description: lang('companySettings.departments.failedToSaveDepartment'),
                      variant: "destructive"
                    });
                  }
                }}>
                  {lang('common.saveChanges')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}