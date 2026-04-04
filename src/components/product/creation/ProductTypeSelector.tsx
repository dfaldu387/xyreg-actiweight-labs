import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import { PRODUCT_TYPE_OPTIONS } from "@/data/productTypeOptions";
import { useTranslation } from "@/hooks/useTranslation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isDeviceTypeAllowedForGenesis } from "@/hooks/useGenesisRestrictions";

interface ProductTypeSelectorProps {
  selectedProductType: string;
  onProductTypeSelect: (productType: string) => void;
  isGenesis?: boolean;
}

export function ProductTypeSelector({
  selectedProductType,
  onProductTypeSelect,
  isGenesis = false
}: ProductTypeSelectorProps) {
  const { lang } = useTranslation();

  // For Genesis plan, only 'new_product' is allowed
  const isOptionLocked = (optionId: string): boolean => {
    if (!isGenesis) return false;
    return !isDeviceTypeAllowedForGenesis(optionId);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3">
        {PRODUCT_TYPE_OPTIONS.map((option) => {
          const locked = isOptionLocked(option.id);

          const cardContent = (
            <Card
              className={`transition-all ${
                locked
                  ? 'cursor-not-allowed opacity-60 bg-muted/30'
                  : `cursor-pointer hover:shadow-md ${
                      selectedProductType === option.id
                        ? `ring-2 ring-primary ${option.bgColor}`
                        : 'hover:bg-muted/50'
                    }`
              }`}
              onClick={() => !locked && onProductTypeSelect(option.id)}
            >
              <CardContent className="!p-4">
                <div className="flex items-start gap-3">
                  <div className={`${locked ? 'text-muted-foreground' : option.color} mt-1`}>
                    <option.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-medium ${locked ? 'text-muted-foreground' : ''}`}>
                        {lang(option.titleKey)}
                      </h4>
                      {locked && (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                      {selectedProductType === option.id && !locked && (
                        <Badge variant="secondary" className="text-xs border-primary">{lang('deviceCreation.selected')}</Badge>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${locked ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                      {lang(option.descriptionKey)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );

          if (locked) {
            return (
              <Tooltip key={option.id} delayDuration={0}>
                <TooltipTrigger asChild>
                  <div className="w-full">
                    {cardContent}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={5} className="z-[9999]">
                  <p>{lang('deviceCreation.upgradeToXyRegOS')}</p>
                </TooltipContent>
              </Tooltip>
            );
          }

          return <div key={option.id}>{cardContent}</div>;
        })}
      </div>
    </div>
  );
}
