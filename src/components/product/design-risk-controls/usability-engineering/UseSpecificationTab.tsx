import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Settings, ExternalLink, AlertCircle, Target, Clock } from "lucide-react";
import { useProductDetails } from "@/hooks/useProductDetails";
import { Skeleton } from "@/components/ui/skeleton";

interface UseSpecificationTabProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function UseSpecificationTab({ productId, companyId, disabled }: UseSpecificationTabProps) {
  const navigate = useNavigate();
  const { data: product, isLoading } = useProductDetails(productId);

  const handleEditInDD = (subtab: string) => {
    // Navigate to Device Definition with return parameter
    navigate(`/app/product/${productId}/device-information?tab=purpose&subtab=${subtab}&returnTo=usability-engineering`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const DURATION_LABELS: Record<string, { label: string; description: string }> = {
    'transient': { label: 'Transient', description: 'Less than 60 minutes (EU MDR Annex VIII)' },
    'short_term': { label: 'Short-Term', description: '60 minutes to 30 days (EU MDR Annex VIII)' },
    'long_term': { label: 'Long-Term', description: 'More than 30 days (EU MDR Annex VIII)' },
  };

  // Extract data from product
  const purposeData = (product?.intended_purpose_data || {}) as any;
  const intendedUse = purposeData.clinicalPurpose || '';
  const indications = purposeData.indications || '';
  const modeOfAction = purposeData.modeOfAction || '';
  const targetPopulation = Array.isArray(purposeData.targetPopulation) 
    ? purposeData.targetPopulation 
    : purposeData.targetPopulation ? [purposeData.targetPopulation] : [];
  const useEnvironments = Array.isArray(purposeData.useEnvironment) 
    ? purposeData.useEnvironment 
    : purposeData.useEnvironment ? [purposeData.useEnvironment] : [];
  const rawDuration = purposeData.durationOfUse || '';
  const durationInfo = DURATION_LABELS[rawDuration];
  const durationLabel = durationInfo?.label || rawDuration;
  const durationDescription = durationInfo?.description || '';
  const intendedUsers = Array.isArray(product?.intended_users) 
    ? product.intended_users 
    : [];

  const EmptyState = ({ message, subtab }: { message: string; subtab: string }) => (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground mb-3">{message}</p>
      <Button variant="outline" size="sm" onClick={() => handleEditInDD(subtab)}>
        <ExternalLink className="h-4 w-4 mr-2" />
        Define in Device Definition
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with IEC reference */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Use Specification</h3>
          <p className="text-sm text-muted-foreground">IEC 62366-1 Clause 5.1 - Application Specification</p>
        </div>
        <Badge variant="outline" className="text-xs">
          Synced from Device Definition
        </Badge>
      </div>

      {/* Intended Use / Clinical Purpose */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Intended Use
              </CardTitle>
              <CardDescription>
                Medical purpose and clinical context for which the device is intended
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleEditInDD('statement')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {intendedUse || indications ? (
            <div className="space-y-4">
              {intendedUse && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Clinical Purpose</p>
                  <div className="text-sm bg-muted/50 rounded-md p-3 whitespace-pre-line">{intendedUse}</div>
                </div>
              )}
              {indications && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Indications for Use</p>
                  <div className="text-sm bg-muted/50 rounded-md p-3 whitespace-pre-line">{indications}</div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState message="Intended use not yet defined." subtab="statement" />
          )}
        </CardContent>
      </Card>

      {/* Intended Users */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Intended User Profiles
              </CardTitle>
              <CardDescription>
                User groups who will interact with the device
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleEditInDD('context')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {intendedUsers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {intendedUsers.map((user: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-sm py-1.5 px-3">
                  {user}
                </Badge>
              ))}
            </div>
          ) : (
            <EmptyState message="No intended users defined." subtab="context" />
          )}
        </CardContent>
      </Card>

      {/* Target Population */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Target Patient Population
              </CardTitle>
              <CardDescription>
                Patient groups for which the device is intended
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleEditInDD('context')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {targetPopulation.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {targetPopulation.map((pop: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-sm py-1.5 px-3">
                  {pop}
                </Badge>
              ))}
            </div>
          ) : (
            <EmptyState message="No target population defined." subtab="context" />
          )}
        </CardContent>
      </Card>

      {/* Use Environments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Use Environments
              </CardTitle>
              <CardDescription>
                Physical and operational environments where the device will be used
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleEditInDD('context')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {useEnvironments.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {useEnvironments.map((env: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-sm py-1.5 px-3">
                  {env}
                </Badge>
              ))}
            </div>
          ) : (
            <EmptyState message="No use environments defined." subtab="context" />
          )}
        </CardContent>
      </Card>

      {/* Duration of Use */}
      {durationLabel && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Duration of Use
                </CardTitle>
                <CardDescription>
                  Expected duration of device use
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleEditInDD('context')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-md p-3">
              <p className="text-sm font-medium">{durationLabel}</p>
              {durationDescription && (
                <p className="text-xs text-muted-foreground mt-1">{durationDescription}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operating Principle / Mode of Action */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Operating Principle</CardTitle>
              <CardDescription>
                How the device works from the user's perspective
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleEditInDD('statement')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {modeOfAction ? (
            <div className="text-sm bg-muted/50 rounded-md p-3 whitespace-pre-line">{modeOfAction}</div>
          ) : (
            <EmptyState message="Operating principle not yet defined." subtab="statement" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
