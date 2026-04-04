import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Info, ChevronRight, X } from "lucide-react";
import { IssuingAgencyCard } from './IssuingAgencyCard';
import { ISSUING_AGENCIES, type IssuingAgency } from '@/types/issuingAgency';
import { useTranslation } from '@/hooks/useTranslation';

interface IssuingAgencyDiscoveryToolProps {
  onAgencySelect: (agencyCode: string) => void;
  selectedAgency?: string;
  onClose?: () => void;
}

export function IssuingAgencyDiscoveryTool({ 
  onAgencySelect, 
  selectedAgency,
  onClose 
}: IssuingAgencyDiscoveryToolProps) {
  const { lang } = useTranslation();

  return (
    <Card className="border-primary/20 bg-gradient-to-b from-primary/5 to-background">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Choose Your UDI Issuing Agency
            </CardTitle>
            <CardDescription className="mt-1">
              Each agency provides unique identifier prefixes. You must register with them first to get your prefix.
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Process Steps */}
        <div className="flex items-center gap-2 mt-4 text-sm">
          <Badge variant="default" className="gap-1">
            <span className="font-bold">1</span> Choose Agency
          </Badge>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline" className="gap-1">
            <span className="font-bold">2</span> Register & Get Prefix
          </Badge>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline" className="gap-1">
            <span className="font-bold">3</span> Enter Prefix
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert className="border-primary/20 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription>
            <strong>Important:</strong> You must contact your chosen agency to register and receive a company prefix before you can create UDI codes. 
            Click "Register" to visit their website.
          </AlertDescription>
        </Alert>

        {/* Quick Decision Helper */}
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <p className="font-medium mb-1">Quick guide:</p>
          <ul className="space-y-0.5 text-xs">
            <li>• <strong>Most devices:</strong> GS1 (globally recognized, numeric codes)</li>
            <li>• <strong>US healthcare:</strong> HIBCC (alphanumeric, hospital-focused)</li>
            <li>• <strong>Blood/tissue products:</strong> ICCBBA (specialized for transfusion medicine)</li>
            <li>• <strong>German pharmacies:</strong> IFA (PZN-based identification)</li>
            <li>• <strong>Legacy/directive devices:</strong> EUDAMED (B-/D- prefix, SRN-embedded)</li>
          </ul>
        </div>

        {/* Agency Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ISSUING_AGENCIES.map((agency) => (
            <IssuingAgencyCard
              key={agency.code}
              agency={agency}
              isSelected={selectedAgency === agency.code}
              onSelect={onAgencySelect}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
