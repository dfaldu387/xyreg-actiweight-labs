import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Handshake, Building2, Stethoscope, FileCheck, ShieldCheck, Globe } from 'lucide-react';

interface Partner {
  name: string;
  type?: string;
  status?: string;
  notes?: string;
}

interface NotifiedBody {
  name: string;
  nbNumber: number;
  markets: string[];
}

export interface StrategicPartnersData {
  distributionPartners: { name: string; markets: string[] }[];
  clinicalPartners: { name: string; markets: string[] }[];
  regulatoryPartners: { name: string; markets: string[] }[];
  notifiedBodies: NotifiedBody[];
  hasNotifiedBodyRequirement: boolean;
  notifiedBodyStatus: 'not_needed' | 'not_defined' | 'assigned' | null;
}

interface InvestorStrategicPartnersProps {
  data: StrategicPartnersData | null;
}

const categoryConfig = {
  distribution: {
    icon: Building2,
    label: 'Distribution Partners',
    description: 'Commercial and distribution network',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  clinical: {
    icon: Stethoscope,
    label: 'Clinical Partners',
    description: 'Clinical sites and research partners',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  regulatory: {
    icon: FileCheck,
    label: 'Regulatory Partners',
    description: 'Regulatory and compliance support',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
};

export function InvestorStrategicPartners({ data }: InvestorStrategicPartnersProps) {
  if (!data) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <Handshake className="h-6 w-6 text-primary" />
          Strategic Partners
        </h2>
        <Card className="border-dashed border-muted-foreground/30">
          <CardContent className="py-8 text-center text-muted-foreground">
            Strategic partners not yet defined
          </CardContent>
        </Card>
      </section>
    );
  }

  const { distributionPartners, clinicalPartners, regulatoryPartners, notifiedBodies, notifiedBodyStatus } = data;
  const hasAnyPartners = distributionPartners.length > 0 || clinicalPartners.length > 0 || regulatoryPartners.length > 0;
  const hasNotifiedBody = notifiedBodies.length > 0;

  if (!hasAnyPartners && !hasNotifiedBody && notifiedBodyStatus !== 'not_needed') {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <Handshake className="h-6 w-6 text-primary" />
          Strategic Partners
        </h2>
        <Card className="border-dashed border-muted-foreground/30">
          <CardContent className="py-8 text-center text-muted-foreground">
            No strategic partners documented yet
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
        <Handshake className="h-6 w-6 text-primary" />
        Strategic Partners
      </h2>

      <div className="space-y-4">
        {/* Notified Body - Critical for EU regulatory path */}
        {(hasNotifiedBody || notifiedBodyStatus) && (
          <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <CardTitle className="text-base font-semibold">Notified Body</CardTitle>
                </div>
                {notifiedBodyStatus === 'assigned' && (
                  <Badge variant="default" className="bg-emerald-500 text-white">Assigned</Badge>
                )}
                {notifiedBodyStatus === 'not_needed' && (
                  <Badge variant="secondary">Not Required</Badge>
                )}
                {notifiedBodyStatus === 'not_defined' && (
                  <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400">Pending</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {hasNotifiedBody ? (
                <div className="space-y-2">
                  {notifiedBodies.map((nb, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white/60 dark:bg-black/20 rounded-lg">
                      <div>
                        <p className="font-semibold text-foreground">{nb.name}</p>
                        <p className="text-sm text-muted-foreground">
                          NB {nb.nbNumber.toString().padStart(4, '0')}
                        </p>
                      </div>
                      {nb.markets.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{nb.markets.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : notifiedBodyStatus === 'not_needed' ? (
                <p className="text-sm text-muted-foreground">
                  Class I device — self-declaration of conformity applies. No Notified Body involvement required for CE marking.
                </p>
              ) : (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Notified Body selection pending. Required for EU CE marking of this device class.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Partner Categories Grid */}
        {hasAnyPartners && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Distribution Partners */}
            <Card className={`${categoryConfig.distribution.borderColor} ${categoryConfig.distribution.bgColor}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <categoryConfig.distribution.icon className={`h-4 w-4 ${categoryConfig.distribution.color}`} />
                  <CardTitle className="text-sm font-medium">{categoryConfig.distribution.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {distributionPartners.length > 0 ? (
                  <div className="space-y-2">
                    {distributionPartners.map((partner, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{partner.name}</span>
                        {partner.markets.length > 1 && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            {partner.markets.length} markets
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Not defined</p>
                )}
              </CardContent>
            </Card>

            {/* Clinical Partners */}
            <Card className={`${categoryConfig.clinical.borderColor} ${categoryConfig.clinical.bgColor}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <categoryConfig.clinical.icon className={`h-4 w-4 ${categoryConfig.clinical.color}`} />
                  <CardTitle className="text-sm font-medium">{categoryConfig.clinical.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {clinicalPartners.length > 0 ? (
                  <div className="space-y-2">
                    {clinicalPartners.map((partner, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{partner.name}</span>
                        {partner.markets.length > 1 && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            {partner.markets.length} markets
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Not defined</p>
                )}
              </CardContent>
            </Card>

            {/* Regulatory Partners */}
            <Card className={`${categoryConfig.regulatory.borderColor} ${categoryConfig.regulatory.bgColor}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <categoryConfig.regulatory.icon className={`h-4 w-4 ${categoryConfig.regulatory.color}`} />
                  <CardTitle className="text-sm font-medium">{categoryConfig.regulatory.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {regulatoryPartners.length > 0 ? (
                  <div className="space-y-2">
                    {regulatoryPartners.map((partner, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{partner.name}</span>
                        {partner.markets.length > 1 && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            {partner.markets.length} markets
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Not defined</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}
