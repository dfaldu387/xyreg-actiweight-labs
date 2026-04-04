import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  fte_allocation: number;
}

interface DepartmentEmployeeAvatarsProps {
  employees: Employee[];
  maxDisplay?: number;
}

export function DepartmentEmployeeAvatars({ employees, maxDisplay = 5 }: DepartmentEmployeeAvatarsProps) {
  const displayedEmployees = employees.slice(0, maxDisplay);
  const remainingCount = Math.max(0, employees.length - maxDisplay);
  
  if (employees.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Users className="h-4 w-4" />
        <span>No employees assigned</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {displayedEmployees.map((employee) => (
            <Tooltip key={employee.id}>
              <TooltipTrigger>
                <Avatar className="h-8 w-8 border-2 border-background ring-2 ring-white dark:ring-gray-800 transition-transform hover:scale-110 hover:z-10">
                  <AvatarImage src={employee.avatar_url || undefined} alt={employee.name} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    {employee.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <p className="font-medium">{employee.name}</p>
                  <p className="text-muted-foreground">{employee.email}</p>
                  <p className="mt-1 text-primary">{employee.fte_allocation} FTE</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          
          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger>
                <Avatar className="h-8 w-8 border-2 border-background ring-2 ring-white dark:ring-gray-800">
                  <AvatarFallback className="text-xs bg-muted">
                    +{remainingCount}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <p className="font-medium">{remainingCount} more employee{remainingCount !== 1 ? 's' : ''}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        
        <span className="text-sm text-muted-foreground">
          {employees.length} employee{employees.length !== 1 ? 's' : ''}
        </span>
      </div>
    </TooltipProvider>
  );
}
