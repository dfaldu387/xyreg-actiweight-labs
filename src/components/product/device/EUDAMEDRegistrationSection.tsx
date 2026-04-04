
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
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

interface EUDAMEDRegistrationSectionProps {
  registrationNumber?: string;
  registrationStatus?: string;
  registrationDate?: Date | string;
  marketAuthorizationHolder?: string;
  notifiedBody?: string; // Added notifiedBody prop
  ceMarkStatus?: string; // Added ceMarkStatus prop
  conformityAssessmentRoute?: string; // Added conformityAssessmentRoute prop
  onRegistrationNumberChange?: (value: string) => void;
  onRegistrationStatusChange?: (value: string) => void;
  onRegistrationDateChange?: (date: Date | undefined) => void;
  onMarketAuthorizationHolderChange?: (value: string) => void;
  onNotifiedBodyChange?: (value: string) => void; // Added notifiedBody handler
  onCeMarkStatusChange?: (value: string) => void; // Added ceMarkStatus handler
  onConformityAssessmentRouteChange?: (value: string) => void; // Added conformityAssessmentRoute handler
  isLoading?: boolean;
}

export function EUDAMEDRegistrationSection({
  registrationNumber = '',
  registrationStatus = '',
  registrationDate,
  marketAuthorizationHolder = '',
  notifiedBody = '', // Added notifiedBody prop with default
  ceMarkStatus = '', // Added ceMarkStatus prop with default
  conformityAssessmentRoute = '', // Added conformityAssessmentRoute prop with default
  onRegistrationNumberChange,
  onRegistrationStatusChange,
  onRegistrationDateChange,
  onMarketAuthorizationHolderChange,
  onNotifiedBodyChange, // Added notifiedBody handler
  onCeMarkStatusChange, // Added ceMarkStatus handler
  onConformityAssessmentRouteChange, // Added conformityAssessmentRoute handler
  isLoading = false,
}: EUDAMEDRegistrationSectionProps) {
  // Format date for display
  const formattedDate = registrationDate 
    ? registrationDate instanceof Date 
      ? format(registrationDate, 'PPP') 
      : format(new Date(registrationDate), 'PPP')
    : undefined;

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
          European Database on Medical Devices (EUDAMED) registration details are required for 
          medical devices sold in the European market. Complete all applicable fields.
        </div>
        
        <div className="space-y-6">
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
                value={marketAuthorizationHolder}
                onChange={(e) => onMarketAuthorizationHolderChange?.(e.target.value)}
                placeholder="e.g., Medical Devices Corp. EU"
                className="pr-8"
              />
              {isLoading && (
                <Loader2 className="w-4 h-4 absolute right-3 top-3 animate-spin text-muted-foreground" />
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
                className="pr-8"
              />
              {isLoading && (
                <Loader2 className="w-4 h-4 absolute right-3 top-3 animate-spin text-muted-foreground" />
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
              <SelectTrigger id="ce-mark-status" className="w-full">
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
              <SelectTrigger id="conformity-route" className="w-full">
                <SelectValue placeholder="Select conformity route" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Annex IX (QMS + TD)">Annex IX (QMS + TD)</SelectItem>
                <SelectItem value="Annex X (Type Examination)">Annex X (Type Examination)</SelectItem>
                <SelectItem value="Annex XI Part A (Production QA)">Annex XI Part A (Production QA)</SelectItem>
                <SelectItem value="Annex XI Part B (Product Verification)">Annex XI Part B (Product Verification)</SelectItem>
                <SelectItem value="Annex XIII (Custom-made)">Annex XIII (Custom-made)</SelectItem>
                <SelectItem value="Self-Declaration (Annex IV)">Self-Declaration (Annex IV)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
