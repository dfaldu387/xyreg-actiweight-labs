import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ShieldCheck, FlaskConical, FileCheck } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface SterilizationCleanlinessTabProps {
  productId: string;
  companyId: string;
}

export function SterilizationCleanlinessTab({ productId, companyId }: SterilizationCleanlinessTabProps) {
  const { lang } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{lang('deviceOperations.sterilization.title')}</h2>
        <p className="text-sm text-muted-foreground">
          {lang('deviceOperations.sterilization.isoRef')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {lang('deviceOperations.sterilization.cleanlinessTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="mb-3">{lang('deviceOperations.sterilization.cleanlinessDesc')}</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>{lang('deviceOperations.sterilization.cleanlinessItems.particulate')}</li>
              <li>{lang('deviceOperations.sterilization.cleanlinessItems.bioburden')}</li>
              <li>{lang('deviceOperations.sterilization.cleanlinessItems.cleaning')}</li>
              <li>{lang('deviceOperations.sterilization.cleanlinessItems.cleanroom')}</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {lang('deviceOperations.sterilization.sterileBarrierTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="mb-3">{lang('deviceOperations.sterilization.sterileBarrierDesc')}</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>{lang('deviceOperations.sterilization.sterileBarrierItems.packaging')}</li>
              <li>{lang('deviceOperations.sterilization.sterileBarrierItems.sealIntegrity')}</li>
              <li>{lang('deviceOperations.sterilization.sterileBarrierItems.configuration')}</li>
              <li>{lang('deviceOperations.sterilization.sterileBarrierItems.aging')}</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-primary" />
              {lang('deviceOperations.sterilization.validationTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="mb-3">{lang('deviceOperations.sterilization.validationDesc')}</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>{lang('deviceOperations.sterilization.validationItems.method')}</li>
              <li>{lang('deviceOperations.sterilization.validationItems.sal')}</li>
              <li>{lang('deviceOperations.sterilization.validationItems.doseAudit')}</li>
              <li>{lang('deviceOperations.sterilization.validationItems.revalidation')}</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-primary" />
              {lang('deviceOperations.sterilization.envMonitoringTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{lang('deviceOperations.sterilization.envMonitoringDesc')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
