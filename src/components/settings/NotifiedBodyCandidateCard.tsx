
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Eye, Clock, Users } from "lucide-react";
import { NotifiedBody } from "@/types/notifiedBody";
import { NotifiedBodyDetailModal } from "./NotifiedBodyDetailModal";
import { formatNotifiedBodyNumber } from "@/utils/notifiedBodyUtils";

interface NotifiedBodyCandidateCardProps {
  notifiedBody: NotifiedBody;
  onSelect?: (notifiedBody: NotifiedBody) => void;
}

export function NotifiedBodyCandidateCard({ 
  notifiedBody, 
  onSelect 
}: NotifiedBodyCandidateCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getScopeBadges = () => {
    const scopeItems = [
      { key: 'mdr', label: 'MDR', enabled: notifiedBody.scope.mdr },
      { key: 'ivdr', label: 'IVDR', enabled: notifiedBody.scope.ivdr },
      { key: 'highRiskActiveImplantables', label: 'High Risk Active', enabled: notifiedBody.scope.highRiskActiveImplantables },
      { key: 'highRiskImplantsNonActive', label: 'High Risk Non-Active', enabled: notifiedBody.scope.highRiskImplantsNonActive },
      { key: 'medicalSoftware', label: 'Medical Software', enabled: notifiedBody.scope.medicalSoftware },
      { key: 'sterilizationMethods', label: 'Sterilization', enabled: notifiedBody.scope.sterilizationMethods },
      { key: 'drugDeviceCombinations', label: 'Drug-Device', enabled: notifiedBody.scope.drugDeviceCombinations },
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

  const getWaitlistIndicator = () => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      open: { color: 'bg-green-500', label: 'Open' },
      closed: { color: 'bg-red-500', label: 'Closed' },
      limited: { color: 'bg-yellow-500', label: 'Limited' },
      unknown: { color: 'bg-gray-400', label: '' },
    };
    
    const status = notifiedBody.waitlistStatus || 'unknown';
    return statusConfig[status] || statusConfig.unknown;
  };

  const handleViewDetails = () => {
    setIsModalOpen(true);
  };

  const handleSelect = (selectedNotifiedBody: NotifiedBody) => {
    if (onSelect) {
      onSelect(selectedNotifiedBody);
    }
  };

  const categoryBadge = getCategoryBadge();
  const waitlistIndicator = getWaitlistIndicator();

  return (
    <>
      <Card className="w-full hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-semibold">{notifiedBody.name}</span>
              <Badge variant="secondary">NB {formatNotifiedBodyNumber(notifiedBody.nb_number)}</Badge>
              {notifiedBody.category && notifiedBody.category !== 'standard' && (
                <Badge variant={categoryBadge.variant} className="text-xs">
                  {categoryBadge.label}
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{notifiedBody.country}</span>
            </div>
            {/* Waitlist status indicator */}
            {notifiedBody.waitlistStatus && notifiedBody.waitlistStatus !== 'unknown' && (
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${waitlistIndicator.color}`} />
                <span className="text-xs">{waitlistIndicator.label}</span>
              </div>
            )}
          </div>

          {/* Quick stats row */}
          {(notifiedBody.typicalLeadTimeMonthsMin || notifiedBody.typicalLeadTimeMonthsMax) && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  {notifiedBody.typicalLeadTimeMonthsMin && notifiedBody.typicalLeadTimeMonthsMax 
                    ? `${notifiedBody.typicalLeadTimeMonthsMin}-${notifiedBody.typicalLeadTimeMonthsMax}mo`
                    : `${notifiedBody.typicalLeadTimeMonthsMin || notifiedBody.typicalLeadTimeMonthsMax}mo`
                  }
                </span>
              </div>
              {(notifiedBody.auditFeePerDayMin || notifiedBody.auditFeePerDayMax) && (
                <span>
                  €{notifiedBody.auditFeePerDayMin && notifiedBody.auditFeePerDayMax 
                    ? `${(notifiedBody.auditFeePerDayMin/1000).toFixed(0)}-${(notifiedBody.auditFeePerDayMax/1000).toFixed(0)}k`
                    : `${((notifiedBody.auditFeePerDayMin || notifiedBody.auditFeePerDayMax || 0)/1000).toFixed(0)}k`
                  }/day
                </span>
              )}
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-medium mb-2">Authorized Scopes</h4>
            <div className="flex flex-wrap gap-2">
              {getScopeBadges().map((scope) => (
                <Badge key={scope.key} variant="outline" className="text-xs">
                  {scope.label}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="pt-2">
            <Button 
              onClick={handleViewDetails}
              variant="outline" 
              size="sm"
              className="w-full"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>

      <NotifiedBodyDetailModal
        notifiedBody={notifiedBody}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelect}
      />
    </>
  );
}
