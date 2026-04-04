import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, Users, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface VVPlanSidebarCardProps {
  metadata: {
    vvPlanId?: string;
    vvPlanStatus?: string;
    vvScopeType?: string;
    vvFamilyIdentifier?: string;
    vvMethodology?: string;
    vvAcceptanceCriteria?: string;
    version?: string;
  };
}

export function VVPlanSidebarCard({ metadata }: VVPlanSidebarCardProps) {
  const statusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return <CheckCircle className="h-3 w-3" />;
      case 'draft': return <FileText className="h-3 w-3" />;
      case 'under_review': return <Clock className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const statusVariant = (status?: string): 'default' | 'secondary' | 'outline' => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'default';
      case 'draft': return 'secondary';
      case 'under_review': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-primary" />
          V&V Plan Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Status</span>
          <Badge variant={statusVariant(metadata.vvPlanStatus)} className="gap-1 text-xs">
            {statusIcon(metadata.vvPlanStatus)}
            {(metadata.vvPlanStatus || 'draft').replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        {/* Version */}
        {metadata.version && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium text-foreground">{metadata.version}</span>
          </div>
        )}

        {/* Scope Type */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Scope</span>
          <Badge variant="outline" className="gap-1 text-xs">
            {metadata.vvScopeType === 'product_family' ? (
              <><Users className="h-3 w-3" /> Product Family</>
            ) : (
              'Individual'
            )}
          </Badge>
        </div>

        {/* Family Identifier */}
        {metadata.vvFamilyIdentifier && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Family ID</span>
            <span className="font-mono text-xs text-foreground">{metadata.vvFamilyIdentifier}</span>
          </div>
        )}

        {/* Methodology */}
        {metadata.vvMethodology && (
          <div>
            <span className="text-muted-foreground block mb-1">Methodology</span>
            <div className="flex flex-wrap gap-1">
              {metadata.vvMethodology.split(', ').map((m, i) => (
                <Badge key={i} variant="outline" className="text-xs">{m}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Acceptance Criteria preview */}
        {metadata.vvAcceptanceCriteria && (
          <div>
            <span className="text-muted-foreground block mb-1">Acceptance Criteria</span>
            <p className="text-xs text-foreground line-clamp-3">{metadata.vvAcceptanceCriteria}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
