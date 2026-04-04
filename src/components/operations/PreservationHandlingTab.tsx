import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Thermometer, BoxSelect, AlertCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface PreservationHandlingTabProps {
  productId: string;
  companyId: string;
}

export function PreservationHandlingTab({ productId, companyId }: PreservationHandlingTabProps) {
  const { lang } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{lang('deviceOperations.preservation.title')}</h2>
        <p className="text-sm text-muted-foreground">
          {lang('deviceOperations.preservation.isoRef')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              {lang('deviceOperations.preservation.packagingTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="mb-3">{lang('deviceOperations.preservation.packagingDesc')}</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>{lang('deviceOperations.preservation.packagingItems.primarySecondary')}</li>
              <li>{lang('deviceOperations.preservation.packagingItems.shippingContainer')}</li>
              <li>{lang('deviceOperations.preservation.packagingItems.validation')}</li>
              <li>{lang('deviceOperations.preservation.packagingItems.labeling')}</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-primary" />
              {lang('deviceOperations.preservation.storageTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="mb-3">{lang('deviceOperations.preservation.storageDesc')}</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>{lang('deviceOperations.preservation.storageItems.tempHumidity')}</li>
              <li>{lang('deviceOperations.preservation.storageItems.envControls')}</li>
              <li>{lang('deviceOperations.preservation.storageItems.shelfLife')}</li>
              <li>{lang('deviceOperations.preservation.storageItems.areaQualification')}</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BoxSelect className="h-4 w-4 text-primary" />
              {lang('deviceOperations.preservation.handlingTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="mb-3">{lang('deviceOperations.preservation.handlingDesc')}</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>{lang('deviceOperations.preservation.handlingItems.fragile')}</li>
              <li>{lang('deviceOperations.preservation.handlingItems.esd')}</li>
              <li>{lang('deviceOperations.preservation.handlingItems.coldChain')}</li>
              <li>{lang('deviceOperations.preservation.handlingItems.damagedPackage')}</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              {lang('deviceOperations.preservation.distributionTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{lang('deviceOperations.preservation.distributionDesc')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
