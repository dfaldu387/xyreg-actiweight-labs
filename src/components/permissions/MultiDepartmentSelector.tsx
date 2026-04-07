import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Pencil, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DepartmentAssignment {
  department_name: string;
  fte_allocation: number;
  role?: string[];
}

interface MultiDepartmentSelectorProps {
  companyId: string;
  userId: string;
  currentAssignments: DepartmentAssignment[];
  onChange: (assignments: DepartmentAssignment[]) => void;
  disabled?: boolean;
}

interface Department {
  id: string;
  name: string;
  roles: string[];
}

export interface MultiDepartmentSelectorRef {
  commitPendingAssignment: () => DepartmentAssignment[] | null;
}

export const MultiDepartmentSelector = forwardRef<MultiDepartmentSelectorRef, MultiDepartmentSelectorProps>(function MultiDepartmentSelector({
  companyId,
  userId,
  currentAssignments,
  onChange,
  disabled
}: MultiDepartmentSelectorProps, ref) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [assignments, setAssignments] = useState<DepartmentAssignment[]>(currentAssignments);
  const [newDepartment, setNewDepartment] = useState("");
  const [newFTE, setNewFTE] = useState("100");
  const [newRole, setNewRole] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDepartment, setEditDepartment] = useState("");
  const [editRole, setEditRole] = useState("");

  useEffect(() => {
    loadDepartments();
  }, [companyId]);

  useEffect(() => {
    setAssignments(currentAssignments);
    // Update suggested FTE to remaining percentage whenever assignments change
    const remaining = Math.round((1.0 - currentAssignments.reduce((sum, a) => sum + parseFloat(a.fte_allocation.toString()), 0)) * 100);
    setNewFTE(String(Math.max(0, remaining)));
  }, [currentAssignments]);

  const loadDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('department_structure')
        .eq('id', companyId)
        .single();

      if (error) throw error;

      const structure = (data?.department_structure as any[]) || [];
      const enabledDepts = structure
      .filter((dept: any) => dept.isEnabled !== false)
        .map((dept: any) => {
          const allRoles = [...(dept.roles || []), ...(dept.customRoles || [])];
          const disabledRoles = dept.disabledRoles || [];
          return {
            id: dept.id || dept.name,
            name: dept.name,
            roles: allRoles.filter((r: string) => !disabledRoles.includes(r))
          };
        });

      setDepartments(enabledDepts);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const getTotalFTE = () => {
    return assignments.reduce((sum, a) => sum + parseFloat(a.fte_allocation.toString()), 0);
  };

  const getTotalPercentage = () => {
    return Math.round(getTotalFTE() * 100);
  };

  const getRemainingFTE = () => {
    return Math.max(0, 1.0 - getTotalFTE());
  };

  const getRemainingPercentage = () => {
    return Math.round(getRemainingFTE() * 100);
  };

  const handleAddAssignment = () => {
    if (!newDepartment) {
      return assignments;
    }

    // Normalize FTE input - handle both comma and decimal formats, convert from percentage to decimal
    const normalizedInput = newFTE.replace(',', '.');
    const percentageValue = parseFloat(normalizedInput);
    
    if (isNaN(percentageValue) || percentageValue <= 0 || percentageValue > 100) {
      toast.info("FTE must be between 0 and 100%");
      return null;
    }

    // Convert percentage to decimal (e.g., 40% -> 0.4)
    const fteValue = percentageValue / 100;

    const totalAfterAdd = getTotalFTE() + fteValue;
    if (totalAfterAdd > 1.0) {
      toast.info(`Total FTE cannot exceed 100%. You have ${getRemainingPercentage()}% remaining.`);
      return null;
    }

    // Check if department already assigned
    if (assignments.some(a => a.department_name === newDepartment)) {
      toast.info("This department is already assigned");
      return null;
    }

    const newAssignment: DepartmentAssignment = {
      department_name: newDepartment,
      fte_allocation: fteValue,
      role: newRole ? [newRole] : undefined
    };

    const updatedAssignments = [...assignments, newAssignment];
    setAssignments(updatedAssignments);
    onChange(updatedAssignments);

    // Reset form
    setNewDepartment("");
    setNewFTE(String(getRemainingPercentage()));
    setNewRole("");

    return updatedAssignments;
  };

  useImperativeHandle(ref, () => ({
    commitPendingAssignment: () => handleAddAssignment()
  }), [assignments, newDepartment, newFTE, newRole]);

  const handleRemoveAssignment = (index: number) => {
    const updatedAssignments = assignments.filter((_, i) => i !== index);
    setAssignments(updatedAssignments);
    onChange(updatedAssignments);
  };

  const handleUpdateFTE = (index: number, newPercentage: string) => {
    // Normalize input - handle both comma and decimal formats
    const normalizedInput = newPercentage.replace(',', '.');
    let percentageValue = parseFloat(normalizedInput);

    if (isNaN(percentageValue) || percentageValue <= 0) {
      return;
    }

    // Calculate max allowed for this assignment
    const totalExcludingCurrent = assignments
      .filter((_, i) => i !== index)
      .reduce((sum, a) => sum + parseFloat(a.fte_allocation.toString()), 0);
    const maxAllowed = Math.round((1.0 - totalExcludingCurrent) * 100);

    // Clamp to max allowed — just stop at the limit
    if (percentageValue > maxAllowed) {
      percentageValue = maxAllowed;
      toast.info(`Maximum FTE for this department is ${maxAllowed}%. Total allocation cannot exceed 100%.`);
    }

    if (percentageValue > 100) percentageValue = 100;

    const fteValue = percentageValue / 100;

    const updatedAssignments = assignments.map((assignment, i) =>
      i === index
        ? { ...assignment, fte_allocation: fteValue }
        : assignment
    );

    setAssignments(updatedAssignments);
    onChange(updatedAssignments);
  };

  const getAvailableDepartments = () => {
    const assignedDepts = new Set(assignments.map(a => a.department_name));
    return departments.filter(d => !assignedDepts.has(d.name));
  };

  const getSelectedDeptRoles = () => {
    const dept = departments.find(d => d.name === newDepartment);
    return dept?.roles || [];
  };

  const getEditDeptRoles = () => {
    const dept = departments.find(d => d.name === editDepartment);
    return dept?.roles || [];
  };

  const startEditing = (index: number) => {
    const assignment = assignments[index];
    setEditingIndex(index);
    setEditDepartment(assignment.department_name);
    setEditRole(assignment.role?.[0] || "");
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditDepartment("");
    setEditRole("");
  };

  const saveEditing = () => {
    if (editingIndex === null) return;

    const updatedAssignments = assignments.map((assignment, i) =>
      i === editingIndex
        ? {
            ...assignment,
            department_name: editDepartment || assignment.department_name,
            role: editRole ? [editRole] : undefined,
          }
        : assignment
    );

    setAssignments(updatedAssignments);
    onChange(updatedAssignments);
    setEditingIndex(null);
    setEditDepartment("");
    setEditRole("");
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block">Department Assignments</Label>
        
        {/* Current Assignments */}
        {assignments.length > 0 ? (
          <div className="space-y-2 mb-4">
            {assignments.map((assignment, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
              >
                {editingIndex === index ? (
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Department</Label>
                        <Select
                          value={editDepartment}
                          onValueChange={(value) => {
                            setEditDepartment(value);
                            setEditRole("");
                          }}
                          disabled={disabled}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={assignment.department_name}>
                              {assignment.department_name}
                            </SelectItem>
                            {getAvailableDepartments().map((dept) => (
                              <SelectItem key={dept.id} value={dept.name}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">FTE Allocation (%)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          step="1"
                          value={Math.round(assignment.fte_allocation * 100)}
                          onChange={(e) => handleUpdateFTE(index, e.target.value)}
                          disabled={disabled}
                          className="h-9"
                        />
                      </div>
                    </div>

                    {getEditDeptRoles().length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs">Role (Optional)</Label>
                        <Select
                          value={editRole}
                          onValueChange={setEditRole}
                          disabled={disabled}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {getEditDeptRoles().map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={saveEditing}
                        className="flex-1 bg-black text-white hover:bg-black/90"
                      >
                        <Check className="h-4 w-4 mr-1" /> Save Changes
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{assignment.department_name}</span>
                      </div>
                      {assignment.role && assignment.role.length > 0 && (
                        <span className="text-sm text-muted-foreground">{assignment.role[0]}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        value={Math.round(assignment.fte_allocation * 100)}
                        onChange={(e) => handleUpdateFTE(index, e.target.value)}
                        disabled={disabled}
                        className="h-8 w-20 text-center"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(index)}
                      disabled={disabled}
                      className="h-8 w-8 p-0"
                      title="Edit department & role"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAssignment(index)}
                      disabled={disabled}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
            
            <div className="text-sm text-muted-foreground">
              Total FTE: <span className="font-medium">{getTotalPercentage()}%</span> / 100%
              {getRemainingPercentage() > 0 && (
                <span className="ml-2">
                  ({getRemainingPercentage()}% remaining)
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">
            No department assignments yet
          </p>
        )}

        {/* Add New Assignment */}
        {getRemainingPercentage() > 0 && getAvailableDepartments().length > 0 && (
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-medium">Add Department Assignment</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Department</Label>
                <Select
                  value={newDepartment}
                  onValueChange={(value) => {
                    setNewDepartment(value);
                    setNewRole(""); // Reset role when department changes
                  }}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableDepartments().map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">FTE Allocation (%)</Label>
                <Input
                  type="number"
                  min="1"
                  max={getRemainingPercentage()}
                  step="1"
                  value={newFTE}
                  onChange={(e) => setNewFTE(e.target.value)}
                  disabled={disabled}
                  className="h-9"
                  placeholder="e.g., 40"
                />
              </div>
            </div>

            {newDepartment && getSelectedDeptRoles().length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs">Role (Optional)</Label>
                <Select
                  value={newRole}
                  onValueChange={setNewRole}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSelectedDeptRoles().map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddAssignment}
              disabled={disabled || !newDepartment}
              className="w-full"
            >
              + Add Department
            </Button>
          </div>
        )}

        {getRemainingPercentage() === 0 && (
          <p className="text-sm text-muted-foreground italic">
            Total FTE allocation reached (100%)
          </p>
        )}
      </div>
    </div>
  );
});
