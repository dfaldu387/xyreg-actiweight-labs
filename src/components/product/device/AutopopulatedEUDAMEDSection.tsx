
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { EnhancedProductMarket } from '@/utils/enhancedMarketRiskClassMapping';
import { CONFORMITY_ROUTES } from '@/utils/conformityRouteUtils';

interface AutopopulatedEUDAMEDSectionProps {
  // Auto-populated fields
  productName?: string;
  deviceClass?: string;
  intendedUse?: string;
  manufacturerName?: string;
  manufacturerAddress?: string;
  basicUdiDi?: string;
  udiDi?: string;
  euMarkets?: EnhancedProductMarket[];
  
  // EUDAMED specific fields
  registrationNumber?: string;
  registrationStatus?: string;
  registrationDate?: Date | string;
  marketAuthorizationHolder?: string;
  notifiedBody?: string;
  ceMarkStatus?: string;
  conformityAssessmentRoute?: string;
  
  // Handlers
  onRegistrationNumberChange?: (value: string) => void;
  onRegistrationStatusChange?: (value: string) => void;
  onRegistrationDateChange?: (date: Date | undefined) => void;
  onMarketAuthorizationHolderChange?: (value: string) => void;
  onNotifiedBodyChange?: (value: string) => void;
  onCeMarkStatusChange?: (value: string) => void;
  onConformityAssessmentRouteChange?: (value: string) => void;
  isLoading?: boolean;
}

export function AutopopulatedEUDAMEDSection({
  // Auto-populated fields
  productName = '',
  deviceClass = '',
  intendedUse = '',
  manufacturerName = '',
  manufacturerAddress = '',
  basicUdiDi = '',
  udiDi = '',
  euMarkets = [],
  
  // EUDAMED specific fields
  registrationNumber = '',
  registrationStatus = '',
  registrationDate,
  marketAuthorizationHolder = '',
  notifiedBody = '',
  ceMarkStatus = '',
  conformityAssessmentRoute = '',
  
  // Handlers
  onRegistrationNumberChange,
  onRegistrationStatusChange,
  onRegistrationDateChange,
  onMarketAuthorizationHolderChange,
  onNotifiedBodyChange,
  onCeMarkStatusChange,
  onConformityAssessmentRouteChange,
  isLoading = false,
}: AutopopulatedEUDAMEDSectionProps) {
  // Format date for display
  const formattedDate = registrationDate 
    ? registrationDate instanceof Date 
      ? format(registrationDate, 'PPP') 
      : format(new Date(registrationDate), 'PPP')
    : undefined;

  // Find EU market data if available
  const euMarket = euMarkets.find(m => m.code === 'EU' && m.selected);
  
  // Determine auto-populated values
  const euRiskClass = euMarket?.riskClass || deviceClass;
  const euNotifiedBody = euMarket?.certificateNumber 
    ? `${notifiedBody || ''} (${euMarket.certificateNumber})` 
    : notifiedBody;
  const euConformityRoute = euMarket?.conformityAssessmentRoute || conformityAssessmentRoute;
  const euCeMarkStatus = euMarket?.regulatoryStatus || ceMarkStatus;
  
  // Helper to show auto-populated status
  const isAutopopulated = (field: string, marketField: string | undefined): boolean => {
    return !!marketField && field !== marketField;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>8. EUDAMED Registration</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          European Database on Medical Devices (EUDAMED) registration details are required for 
          medical devices sold in the European market. Fields may be auto-populated from other sections.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-6">
          {/* Auto-populated fields section */}
          <div className="bg-muted p-4 rounded-md">
            <h4 className="font-medium text-sm mb-3">Auto-populated Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Device Name</Label>
                <p className="text-sm font-medium">{productName || "Not provided"}</p>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">Risk Classification</Label>
                <p className="text-sm font-medium">{euRiskClass || "Not specified"}</p>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">Basic UDI-DI</Label>
                <p className="text-sm font-medium">{basicUdiDi || "Not provided"}</p>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">UDI-DI</Label>
                <p className="text-sm font-medium">{udiDi || "Not provided"}</p>
              </div>
              
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Intended Purpose</Label>
                <p className="text-sm font-medium line-clamp-2">
                  {intendedUse || "Not provided"}
                </p>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">Manufacturer</Label>
                <p className="text-sm font-medium">{manufacturerName || "Not provided"}</p>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">Manufacturer Address</Label>
                <p className="text-sm font-medium line-clamp-1">
                  {manufacturerAddress || "Not provided"}
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="eudamed-registration-number">EUDAMED Registration Number</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>The unique identifier assigned to your device in the EUDAMED database.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative">
              <Input
                id="eudamed-registration-number"
                value={registrationNumber}
                onChange={(e) => onRegistrationNumberChange?.(e.target.value)}
                placeholder="e.g., EU-MF-000012345"
                className="pr-8"
              />
              {isLoading && (
                <Loader2 className="w-4 h-4 absolute right-3 top-3 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="registration-status">Registration Status</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>The current status of your device's registration in EUDAMED.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={registrationStatus}
              onValueChange={(value) => onRegistrationStatusChange?.(value)}
            >
              <SelectTrigger id="registration-status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
                <SelectItem value="Registered">Registered</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Pending Revision">Pending Revision</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="registration-date">Registration Date</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>The date when the device was registered in EUDAMED.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formattedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formattedDate || "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={registrationDate instanceof Date ? registrationDate : (registrationDate ? new Date(registrationDate) : undefined)}
                  onSelect={onRegistrationDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="market-authorization-holder">Market Authorization Holder</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>The legal entity responsible for placing the device on the EU market.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative">
              <Input
                id="market-authorization-holder"
                value={marketAuthorizationHolder || manufacturerName}
                onChange={(e) => onMarketAuthorizationHolderChange?.(e.target.value)}
                placeholder="e.g., Medical Devices Corp. EU"
                className={cn("pr-8", isAutopopulated(marketAuthorizationHolder, manufacturerName) && "border-blue-300")}
              />
              {isLoading && (
                <Loader2 className="w-4 h-4 absolute right-3 top-3 animate-spin text-muted-foreground" />
              )}
              {isAutopopulated(marketAuthorizationHolder, manufacturerName) && (
                <div className="text-xs text-muted-foreground mt-1">Auto-populated from manufacturer information</div>
              )}
            </div>
          </div>

          {/* Notified Body field */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="notified-body">Notified Body</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>The certified organization evaluating conformity assessment for your device.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative">
              <Input
                id="notified-body"
                value={notifiedBody}
                onChange={(e) => onNotifiedBodyChange?.(e.target.value)}
                placeholder="e.g., TÜV SÜD (0123)"
                className={cn("pr-8", isAutopopulated(notifiedBody, euNotifiedBody) && "border-blue-300")}
              />
              {isLoading && (
                <Loader2 className="w-4 h-4 absolute right-3 top-3 animate-spin text-muted-foreground" />
              )}
              {isAutopopulated(notifiedBody, euNotifiedBody) && (
                <div className="text-xs text-muted-foreground mt-1">Auto-populated from EU market information</div>
              )}
            </div>
          </div>

          {/* CE Mark Status field */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="ce-mark-status">CE Mark Status</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>The current status of your device's CE marking.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={ceMarkStatus}
              onValueChange={(value) => onCeMarkStatusChange?.(value)}
            >
              <SelectTrigger 
                id="ce-mark-status" 
                className={cn("w-full", isAutopopulated(ceMarkStatus, euCeMarkStatus) && "border-blue-300")}
              >
                <SelectValue placeholder="Select CE status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Self-Declared">Self-Declared</SelectItem>
                <SelectItem value="Certified">Certified</SelectItem>
                <SelectItem value="Renewal Required">Renewal Required</SelectItem>
                <SelectItem value="Not Applicable">Not Applicable</SelectItem>
              </SelectContent>
            </Select>
            {isAutopopulated(ceMarkStatus, euCeMarkStatus) && (
              <div className="text-xs text-muted-foreground mt-1">Auto-populated from EU market regulatory status</div>
            )}
          </div>

          {/* Conformity Assessment Route field */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="conformity-route">Conformity Assessment Route</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>The conformity assessment procedure followed for your device.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={conformityAssessmentRoute}
              onValueChange={(value) => onConformityAssessmentRouteChange?.(value)}
            >
              <SelectTrigger 
                id="conformity-route" 
                className={cn("w-full", isAutopopulated(conformityAssessmentRoute, euConformityRoute) && "border-blue-300")}
              >
                <SelectValue placeholder="Select conformity route" />
              </SelectTrigger>
              <SelectContent>
                {CONFORMITY_ROUTES.map((route) => (
                  <SelectItem key={route.value} value={route.value}>{route.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isAutopopulated(conformityAssessmentRoute, euConformityRoute) && (
              <div className="text-xs text-muted-foreground mt-1">Auto-populated from EU market conformity route</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
