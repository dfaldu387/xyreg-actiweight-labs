
import React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PermissionLevel } from "@/types/documentTypes";

interface PermissionToggleProps {
  value: PermissionLevel[];
  onChange: (permissions: PermissionLevel[]) => void;
  isInherited?: boolean;
  userPermissionLevel?: PermissionLevel;
}

export function PermissionToggle({
  value = [],
  onChange,
  isInherited = false,
  userPermissionLevel = "A"
}: PermissionToggleProps) {
  const handleValueChange = (newValues: string[]) => {
    // Convert string[] to PermissionLevel[]
    onChange(newValues as PermissionLevel[]);
  };

  // Define permission options with tooltips
  const permissionOptions = [
    {
      value: "V",
      label: "V",
      tooltip: "Viewer: Can view content but not edit",
      disabled: false
    },
    {
      value: "E",
      label: "E",
      tooltip: "Editor: Can edit content but not manage permissions",
      disabled: userPermissionLevel !== "A" // Only admins can grant edit permissions
    },
    {
      value: "A",
      label: "A",
      tooltip: "Admin: Can manage permissions and edit content",
      disabled: userPermissionLevel !== "A" // Only admins can grant admin permissions
    }
  ];

  return (
    <div className={`${isInherited ? "opacity-50" : ""}`}>
      <TooltipProvider>
        <ToggleGroup
          type="multiple"
          value={value}
          onValueChange={handleValueChange}
          disabled={isInherited}
          variant="outline"
          className="flex justify-center"
        >
          {permissionOptions.map((option) => (
            <Tooltip key={option.value}>
              <TooltipTrigger asChild>
                <ToggleGroupItem 
                  value={option.value} 
                  disabled={option.disabled || isInherited}
                  className="w-8 h-8 p-0"
                >
                  {option.label}
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                <p>{option.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </ToggleGroup>
      </TooltipProvider>
      {isInherited && (
        <div className="text-xs text-muted-foreground mt-1 text-center">
          Inherited
        </div>
      )}
    </div>
  );
}
