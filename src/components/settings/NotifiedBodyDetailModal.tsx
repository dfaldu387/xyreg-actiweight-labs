
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Mail, Phone, MapPin, Database, User } from "lucide-react";
import { NotifiedBody } from "@/types/notifiedBody";
import { formatNotifiedBodyNumber } from "@/utils/notifiedBodyUtils";

interface NotifiedBodyDetailModalProps {
  notifiedBody: NotifiedBody | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (notifiedBody: NotifiedBody) => void;
}

export function NotifiedBodyDetailModal({
  notifiedBody,
  isOpen,
  onClose,
  onSelect
}: NotifiedBodyDetailModalProps) {
  if (!notifiedBody) return null;

  const getScopeBadges = () => {
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

  const handleSelect = () => {
    onSelect(notifiedBody);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-xl font-semibold">{notifiedBody.name}</span>
            <Badge variant="secondary" className="text-sm">
              NB {formatNotifiedBodyNumber(notifiedBody.nb_number)}
            </Badge>
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
          </DialogTitle>
          <DialogDescription>
            Complete profile and authorization details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contact Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Information</h3>
            
            <div className="grid gap-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm">{notifiedBody.address}</p>
                  <p className="text-sm font-medium">{notifiedBody.country}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <a 
                  href={`tel:${notifiedBody.contactNumber}`} 
                  className="text-sm hover:underline text-blue-600"
                >
                  {notifiedBody.contactNumber}
                </a>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <a 
                  href={`mailto:${notifiedBody.email}`} 
                  className="text-sm hover:underline text-blue-600"
                >
                  {notifiedBody.email}
                </a>
              </div>
              
              {notifiedBody.website && (
                <div className="flex items-center gap-3">
                  <ExternalLink className="h-5 w-5 text-muted-foreground" />
                  <a 
                    href={notifiedBody.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm hover:underline text-blue-600 flex items-center gap-1"
                  >
                    {notifiedBody.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Authorization Scope Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Authorization Scope</h3>
            <div className="flex flex-wrap gap-2">
              {getScopeBadges().map((scope) => (
                <Badge key={scope.key} variant="outline" className="text-xs">
                  {scope.label}
                </Badge>
              ))}
            </div>
            {getScopeBadges().length === 0 && (
              <p className="text-sm text-muted-foreground">
                No specific scope information available
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSelect} className="flex-1">
              Select This Notified Body
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
