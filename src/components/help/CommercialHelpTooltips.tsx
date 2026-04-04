import React from 'react';
import { HelpTooltip } from '@/components/product/device/sections/HelpTooltip';
import { useTranslation } from '@/hooks/useTranslation';

// Wrapper component to use hooks
const TooltipWithTranslation = ({
  children,
  translationKey,
  className,
  position = 'absolute'
}: {
  children: React.ReactNode;
  translationKey: string;
  className?: string;
  position?: 'absolute' | 'top-right';
}) => {
  const { lang } = useTranslation();

  if (position === 'top-right') {
    return (
      <div className="relative">
        {children}
        <div className="absolute top-2 right-2">
          <HelpTooltip content={lang(translationKey)} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      {children}
      <div className="absolute -top-1 -right-1">
        <HelpTooltip
          content={lang(translationKey)}
          className={className || "h-3 w-3"}
        />
      </div>
    </div>
  );
};

// Commercial Performance specific tooltips for UI elements
export const CommercialHelpTooltips = {
  DatePicker: ({ children }: { children: React.ReactNode }) => (
    <TooltipWithTranslation translationKey="commercialHelp.tooltips.datePicker" className="h-3 w-3">
      {children}
    </TooltipWithTranslation>
  ),

  UploadCSVButton: ({ children }: { children: React.ReactNode }) => (
    <TooltipWithTranslation translationKey="commercialHelp.tooltips.uploadCSV" className="h-3 w-3">
      {children}
    </TooltipWithTranslation>
  ),

  SmartForecastingWidget: ({ children }: { children: React.ReactNode }) => (
    <TooltipWithTranslation translationKey="commercialHelp.tooltips.smartForecasting" position="top-right">
      {children}
    </TooltipWithTranslation>
  ),

  ProductRelationships: ({ children }: { children: React.ReactNode }) => (
    <TooltipWithTranslation translationKey="commercialHelp.tooltips.productRelationships" position="top-right">
      {children}
    </TooltipWithTranslation>
  ),

  InitialMultiplier: ({ children }: { children: React.ReactNode }) => (
    <TooltipWithTranslation translationKey="commercialHelp.tooltips.initialMultiplier" className="h-3 w-3">
      {children}
    </TooltipWithTranslation>
  ),

  RecurringMultiplier: ({ children }: { children: React.ReactNode }) => (
    <TooltipWithTranslation translationKey="commercialHelp.tooltips.recurringMultiplier" className="h-3 w-3">
      {children}
    </TooltipWithTranslation>
  ),

  LifecycleDuration: ({ children }: { children: React.ReactNode }) => (
    <TooltipWithTranslation translationKey="commercialHelp.tooltips.lifecycleDuration" className="h-3 w-3">
      {children}
    </TooltipWithTranslation>
  ),

  SeasonalityFactors: ({ children }: { children: React.ReactNode }) => (
    <TooltipWithTranslation translationKey="commercialHelp.tooltips.seasonalityFactors" position="top-right">
      {children}
    </TooltipWithTranslation>
  ),

  AIPrognosisFactors: ({ children }: { children: React.ReactNode }) => (
    <TooltipWithTranslation translationKey="commercialHelp.tooltips.aiPrognosisFactors" position="top-right">
      {children}
    </TooltipWithTranslation>
  ),

  ConfidenceLevels: ({ children }: { children: React.ReactNode }) => (
    <TooltipWithTranslation translationKey="commercialHelp.tooltips.confidenceLevels" className="h-3 w-3">
      {children}
    </TooltipWithTranslation>
  ),

  RNPVIntegration: ({ children }: { children: React.ReactNode }) => (
    <TooltipWithTranslation translationKey="commercialHelp.tooltips.rnpvIntegration" className="h-3 w-3">
      {children}
    </TooltipWithTranslation>
  ),

  FinancialDataTable: ({ children }: { children: React.ReactNode }) => (
    <TooltipWithTranslation translationKey="commercialHelp.tooltips.financialDataTable" position="top-right">
      {children}
    </TooltipWithTranslation>
  )
};
