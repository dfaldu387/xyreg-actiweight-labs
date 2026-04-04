
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Mail, Phone, MapPin, Database, User, Clock, Euro, Target, Users } from "lucide-react";
import { NotifiedBody } from "@/types/notifiedBody";
import { formatNotifiedBodyNumber } from "@/utils/notifiedBodyUtils";

interface NotifiedBodyDisplayProps {
  notifiedBody: NotifiedBody;
}

export function NotifiedBodyDisplay({ notifiedBody }: NotifiedBodyDisplayProps) {
  const getScopeBadges = () => {
    // Add defensive check for scope property
    if (!notifiedBody?.scope) {
      console.warn('NotifiedBody scope is undefined:', notifiedBody);
      return [];
    }
    
    const scopeItems = [
      { key: 'mdr', label: 'MDR', enabled: notifiedBody.scope.mdr },
      { key: 'ivdr', label: 'IVDR', enabled: notifiedBody.scope.ivdr },
      { key: 'highRiskActiveImplantables', label: 'High Risk Active Implantables', enabled: notifiedBody.scope.highRiskActiveImplantables },
      { key: 'highRiskImplantsNonActive', label: 'High Risk Non-Active Implants', enabled: notifiedBody.scope.highRiskImplantsNonActive },
      { key: 'medicalSoftware', label: 'Medical Software', enabled: notifiedBody.scope.medicalSoftware },
      { key: 'sterilizationMethods', label: 'Sterilization Methods', enabled: notifiedBody.scope.sterilizationMethods },
      { key: 'drugDeviceCombinations', label: 'Drug-Device Combinations', enabled: notifiedBody.scope.drugDeviceCombinations },
    ];

    return scopeItems.filter(item => item.enabled);
  };

  const getCategoryBadge = () => {
    const categoryConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      big_four: { label: 'Big Four', variant: 'default' },
      established: { label: 'Established', variant: 'secondary' },
      new_entrant: { label: 'New Entrant', variant: 'outline' },
      standard: { label: 'Standard', variant: 'outline' },
    };
    
    const category = notifiedBody.category || 'standard';
    return categoryConfig[category] || categoryConfig.standard;
  };

  const getWaitlistBadge = () => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      open: { label: 'Accepting Applications', className: 'bg-green-100 text-green-800 border-green-200' },
      closed: { label: 'Waitlist Closed', className: 'bg-red-100 text-red-800 border-red-200' },
      limited: { label: 'Limited Availability', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      unknown: { label: 'Status Unknown', className: 'bg-gray-100 text-gray-600 border-gray-200' },
    };
    
    const status = notifiedBody.waitlistStatus || 'unknown';
    return statusConfig[status] || statusConfig.unknown;
  };

  const getScopeDepthLabel = () => {
    const depthConfig: Record<string, string> = {
      full: 'Full Scope (all MDA/MDN/MDS codes)',
      focused: 'Focused Scope (specialized areas)',
      standard: 'Standard Scope',
    };
    
    return depthConfig[notifiedBody.scopeDepth || 'standard'] || 'Standard Scope';
  };

  const hasComparisonData = notifiedBody.typicalLeadTimeMonthsMin || 
    notifiedBody.auditFeePerDayMin || 
    notifiedBody.waitlistStatus || 
    notifiedBody.strengths?.length;

  const categoryBadge = getCategoryBadge();
  const waitlistBadge = getWaitlistBadge();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 flex-wrap">
          <span>{notifiedBody.name}</span>
          <Badge variant="secondary">NB {formatNotifiedBodyNumber(notifiedBody.nb_number)}</Badge>
          {notifiedBody.category && notifiedBody.category !== 'standard' && (
            <Badge variant={categoryBadge.variant}>
              {categoryBadge.label}
            </Badge>
          )}
          {notifiedBody.source === 'manual' && (
            <Badge variant="outline" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Manual Entry
            </Badge>
          )}
          {notifiedBody.source === 'database' && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              Official Database
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm">{notifiedBody.address}</p>
              <p className="text-sm font-medium">{notifiedBody.country}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a href={`tel:${notifiedBody.contactNumber}`} className="text-sm hover:underline">
              {notifiedBody.contactNumber}
            </a>
          </div>
          
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a href={`mailto:${notifiedBody.email}`} className="text-sm hover:underline">
              {notifiedBody.email}
            </a>
          </div>
          
          {notifiedBody.website && (
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <a 
                href={notifiedBody.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm hover:underline"
              >
                {notifiedBody.website}
              </a>
            </div>
          )}
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2">Scope of Authorization</h4>
          <div className="flex flex-wrap gap-2">
            {getScopeBadges().map((scope) => (
              <Badge key={scope.key} variant="outline" className="text-xs">
                {scope.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Comparison Data Section */}
        {hasComparisonData && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Engagement Information</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Lead Time */}
              {(notifiedBody.typicalLeadTimeMonthsMin || notifiedBody.typicalLeadTimeMonthsMax) && (
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Lead Time (Class III)</p>
                    <p className="text-sm font-medium">
                      {notifiedBody.typicalLeadTimeMonthsMin && notifiedBody.typicalLeadTimeMonthsMax 
                        ? `${notifiedBody.typicalLeadTimeMonthsMin}-${notifiedBody.typicalLeadTimeMonthsMax} months`
                        : `${notifiedBody.typicalLeadTimeMonthsMin || notifiedBody.typicalLeadTimeMonthsMax} months`
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Audit Fees */}
              {(notifiedBody.auditFeePerDayMin || notifiedBody.auditFeePerDayMax) && (
                <div className="flex items-start gap-2">
                  <Euro className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Audit Fee / Day</p>
                    <p className="text-sm font-medium">
                      {notifiedBody.auditFeePerDayMin && notifiedBody.auditFeePerDayMax 
                        ? `€${notifiedBody.auditFeePerDayMin.toLocaleString()}-${notifiedBody.auditFeePerDayMax.toLocaleString()}`
                        : `€${(notifiedBody.auditFeePerDayMin || notifiedBody.auditFeePerDayMax)?.toLocaleString()}`
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Scope Depth */}
              {notifiedBody.scopeDepth && notifiedBody.scopeDepth !== 'standard' && (
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Code Scope</p>
                    <p className="text-sm font-medium">{getScopeDepthLabel()}</p>
                  </div>
                </div>
              )}

              {/* Waitlist Status */}
              {notifiedBody.waitlistStatus && notifiedBody.waitlistStatus !== 'unknown' && (
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Waitlist Status</p>
                    <Badge variant="outline" className={`text-xs ${waitlistBadge.className}`}>
                      {waitlistBadge.label}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Strengths */}
            {notifiedBody.strengths && notifiedBody.strengths.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1">Key Strengths</p>
                <div className="flex flex-wrap gap-1">
                  {notifiedBody.strengths.map((strength, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {strength}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {notifiedBody.notes && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm text-muted-foreground italic">{notifiedBody.notes}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
