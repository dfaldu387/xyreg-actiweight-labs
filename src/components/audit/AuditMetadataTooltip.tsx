
import { useState, useEffect } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { fetchAuditMetadata } from "@/services/auditService";
import { AuditMetadata } from "@/types/audit";
import { Info } from "lucide-react";

interface AuditMetadataTooltipProps {
  auditType: string;
}

export function AuditMetadataTooltip({ auditType }: AuditMetadataTooltipProps) {
  const [metadata, setMetadata] = useState<AuditMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetadata = async () => {
      if (!auditType) return;

      setLoading(true);
      const metadataList = await fetchAuditMetadata(auditType);
      const matchingMetadata = metadataList.find(m => m.audit_type === auditType) || null;
      setMetadata(matchingMetadata);
      setLoading(false);
    };

    loadMetadata();
  }, [auditType]);

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button 
          type="button" 
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <Info className="h-4 w-4" />
          <span className="sr-only">More information about {auditType}</span>
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        {loading ? (
          <div className="text-center py-2">Loading...</div>
        ) : metadata ? (
          <div className="space-y-2">
            <h4 className="font-semibold">{auditType}</h4>
            
            {metadata.lifecycle_phase && (
              <div className="grid grid-cols-2 gap-1">
                <span className="text-sm text-muted-foreground">Lifecycle Phase:</span>
                <span className="text-sm font-medium">{metadata.lifecycle_phase}</span>
              </div>
            )}
            
            {metadata.purpose && (
              <div className="grid grid-cols-2 gap-1">
                <span className="text-sm text-muted-foreground">Purpose:</span>
                <span className="text-sm">{metadata.purpose}</span>
              </div>
            )}
            
            {metadata.suggested_documents && (
              <div className="grid grid-cols-2 gap-1">
                <span className="text-sm text-muted-foreground">Suggested Documents:</span>
                <span className="text-sm">{metadata.suggested_documents}</span>
              </div>
            )}
            
            {metadata.duration && (
              <div className="grid grid-cols-2 gap-1">
                <span className="text-sm text-muted-foreground">Duration:</span>
                <span className="text-sm">{metadata.duration}</span>
              </div>
            )}
            
            {metadata.auditor_type && (
              <div className="grid grid-cols-2 gap-1">
                <span className="text-sm text-muted-foreground">Auditor:</span>
                <span className="text-sm">{metadata.auditor_type}</span>
              </div>
            )}
            
            {metadata.applies_to && (
              <div className="grid grid-cols-2 gap-1">
                <span className="text-sm text-muted-foreground">Applies to:</span>
                <span className="text-sm">{metadata.applies_to}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-2">No metadata available for this audit type.</div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
