import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileSearch, ShieldAlert, ClipboardList } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface CustomerPropertyTabProps {
  productId: string;
  companyId: string;
}

export function CustomerPropertyTab({ productId, companyId }: CustomerPropertyTabProps) {
  const { lang } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{lang('deviceOperations.customerProperty.title')}</h2>
        <p className="text-sm text-muted-foreground">
          {lang('deviceOperations.customerProperty.isoRef')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              {lang('deviceOperations.customerProperty.providedItemsTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="mb-3">{lang('deviceOperations.customerProperty.providedItemsDesc')}</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>{lang('deviceOperations.customerProperty.providedItemsItems.rawMaterials')}</li>
              <li>{lang('deviceOperations.customerProperty.providedItemsItems.referenceSamples')}</li>
              <li>{lang('deviceOperations.customerProperty.providedItemsItems.packaging')}</li>
              <li>{lang('deviceOperations.customerProperty.providedItemsItems.acceptanceCriteria')}</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-primary" />
              {lang('deviceOperations.customerProperty.dataIpTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="mb-3">{lang('deviceOperations.customerProperty.dataIpDesc')}</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>{lang('deviceOperations.customerProperty.dataIpItems.specifications')}</li>
              <li>{lang('deviceOperations.customerProperty.dataIpItems.confidentialData')}</li>
              <li>{lang('deviceOperations.customerProperty.dataIpItems.accessControl')}</li>
              <li>{lang('deviceOperations.customerProperty.dataIpItems.dataRetention')}</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" />
              {lang('deviceOperations.customerProperty.lossDamageTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{lang('deviceOperations.customerProperty.lossDamageDesc')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              {lang('deviceOperations.customerProperty.returnedDevicesTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{lang('deviceOperations.customerProperty.returnedDevicesDesc')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
