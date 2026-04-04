
export interface PhaseDocument {
  id?: string;
  name: string;
  description?: string;
  status?: "Completed" | "In Progress" | "Not Started" | "Not Required" | "Pending" | "Overdue";
  type?: string;
  phases?: string[];
  deadline?: string | Date;
  assignedTo?: string;
  version?: string;
  classes?: string[];
  position?: number;
  _matchAttempts?: string;
}
