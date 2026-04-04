import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Settings, Calendar, FileText, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface InstallationServicingTabProps {
  productId: string;
  companyId: string;
}

export function InstallationServicingTab({ productId, companyId }: InstallationServicingTabProps) {
  const { lang } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{lang('deviceOperations.installation.title')}</h2>
        <p className="text-sm text-muted-foreground">
          {lang('deviceOperations.installation.isoRef')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              {lang('deviceOperations.installation.installationRecordsTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="mb-3">{lang('deviceOperations.installation.installationRecordsDesc')}</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>{lang('deviceOperations.installation.installationRecordsItems.iq')}</li>
              <li>{lang('deviceOperations.installation.installationRecordsItems.siteAcceptance')}</li>
              <li>{lang('deviceOperations.installation.installationRecordsItems.customerSignOff')}</li>
              <li>{lang('deviceOperations.installation.installationRecordsItems.procedureRef')}</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              {lang('deviceOperations.installation.serviceTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="mb-3">{lang('deviceOperations.installation.serviceDesc')}</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>{lang('deviceOperations.installation.serviceItems.preventive')}</li>
              <li>{lang('deviceOperations.installation.serviceItems.serviceVisit')}</li>
              <li>{lang('deviceOperations.installation.serviceItems.replacementParts')}</li>
              <li>{lang('deviceOperations.installation.serviceItems.personnelQual')}</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              {lang('deviceOperations.installation.maintenanceTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{lang('deviceOperations.installation.maintenanceDesc')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              {lang('deviceOperations.installation.fieldSafetyTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{lang('deviceOperations.installation.fieldSafetyDesc')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
