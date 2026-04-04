import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Building2, Target, Clock, DollarSign, MapPin, Users } from 'lucide-react';

interface StakeholderProfilesData {
  // User/Patient Profile (Step 8)
  intendedPatientPopulation?: string[];
  environmentOfUse?: string[];
  intendedUsers?: string;
  clinicalBenefits?: string;
  // Buyer Profile (Step 9)
  buyerType?: string;
  budgetType?: string;
  salesCycleWeeks?: number;
}

interface InvestorStakeholderProfilesProps {
  data: StakeholderProfilesData | null;
}

const BUYER_TYPE_LABELS: Record<string, string> = {
  hospital: 'Hospital / Health System',
  clinic: 'Outpatient Clinic',
  physician: 'Physician Practice',
  patient: 'Direct to Patient/Consumer',
  distributor: 'Distributor',
  government: 'Government Agency',
  pharmacy: 'Pharmacy',
  lab: 'Laboratory',
  research: 'Research Institution',
};

const BUDGET_TYPE_LABELS: Record<string, string> = {
  capex: 'Capital Expenditure (CapEx)',
  opex: 'Operating Expenditure (OpEx)',
  mixed: 'Mixed CapEx/OpEx',
};

export function InvestorStakeholderProfiles({ data }: InvestorStakeholderProfilesProps) {
  if (!data) {
    return null;
  }

  const hasPatientProfile = (data.intendedPatientPopulation && data.intendedPatientPopulation.length > 0) || data.intendedUsers;
  const hasEnvironment = data.environmentOfUse && data.environmentOfUse.length > 0;
  const hasBuyerProfile = data.buyerType || data.budgetType || data.salesCycleWeeks;

  if (!hasPatientProfile && !hasEnvironment && !hasBuyerProfile) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Stakeholder Profiles</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Intended Patient Population */}
        {hasPatientProfile && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Patient Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.intendedPatientPopulation && data.intendedPatientPopulation.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Intended Patient Population</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.intendedPatientPopulation.map((pop, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {pop}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {data.intendedUsers && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Intended Users</p>
                  <p className="text-sm text-foreground">{data.intendedUsers}</p>
                </div>
              )}
              {data.clinicalBenefits && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Clinical Benefits</p>
                  <p className="text-sm text-foreground line-clamp-3">{data.clinicalBenefits}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Environment of Use */}
        {hasEnvironment && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Environment of Use
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {data.environmentOfUse!.map((env, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {env}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Economic Buyer Profile */}
        {hasBuyerProfile && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Economic Buyer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.buyerType && (
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Buyer Type</p>
                    <Badge variant="outline" className="mt-0.5 text-xs">
                      {BUYER_TYPE_LABELS[data.buyerType] || data.buyerType}
                    </Badge>
                  </div>
                </div>
              )}
              {data.budgetType && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Budget Type</p>
                    <Badge variant="secondary" className="mt-0.5 text-xs">
                      {BUDGET_TYPE_LABELS[data.budgetType] || data.budgetType}
                    </Badge>
                  </div>
                </div>
              )}
              {data.salesCycleWeeks && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Sales Cycle</p>
                    <p className="text-sm font-medium">{data.salesCycleWeeks} weeks</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
