
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  AuditorType, 
  AuditCategoryType,
  filterAuditTypes,
  getAuditorTypeForAudit, 
  getAuditScope, 
} from "@/utils/auditTypeUtils";
import { AuditMetadataTooltip } from "./AuditMetadataTooltip";
import { AUDIT_TYPES } from "@/types/audit";

interface FilteredAuditTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
  scopeFilter: AuditCategoryType;
  lifecyclePhaseFilter: string;
  auditorTypeFilter: AuditorType;
  className?: string;
}

export function FilteredAuditTypeSelect({ 
  value, 
  onChange, 
  scopeFilter, 
  lifecyclePhaseFilter,
  auditorTypeFilter, 
  className 
}: FilteredAuditTypeSelectProps) {
  const [filteredTypes, setFilteredTypes] = useState<string[]>([]);
  
  useEffect(() => {
    const filtered = filterAuditTypes(
      AUDIT_TYPES, 
      scopeFilter, 
      lifecyclePhaseFilter, 
      auditorTypeFilter
    );
    setFilteredTypes(filtered);
    
    // If current value is not in filtered list, reset to empty
    if (value && !filtered.includes(value)) {
      onChange("");
    }
  }, [scopeFilter, lifecyclePhaseFilter, auditorTypeFilter, value, onChange]);
  
  return (
    <div className={className}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select audit type" />
        </SelectTrigger>
        <SelectContent className="z-50 max-h-60 overflow-auto">
          {filteredTypes.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">
              No audit types match the selected filters
            </div>
          ) : (
            filteredTypes.map((auditType) => (
              <SelectItem key={auditType} value={auditType} className="flex justify-between">
                <div className="flex items-center gap-2">
                  {auditType}
                  <div className="flex space-x-1">
                    {getAuditorTypeForAudit(auditType) === "internal" && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">Int</Badge>
                    )}
                    {getAuditorTypeForAudit(auditType) === "external" && (
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 text-xs">Ext</Badge>
                    )}
                    {getAuditorTypeForAudit(auditType) === "both" && (
                      <Badge variant="outline" className="bg-gray-100 text-gray-800 text-xs">Both</Badge>
                    )}
                    {getAuditScope(auditType) === "company" && (
                      <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">Co</Badge>
                    )}
                    {getAuditScope(auditType) === "product" && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 text-xs">Prod</Badge>
                    )}
                  </div>
                  <AuditMetadataTooltip auditType={auditType} />
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
