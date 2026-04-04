import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Check, Globe, Building2, FlaskConical, Pill, Database } from "lucide-react";
import type { IssuingAgency } from '@/types/issuingAgency';

interface IssuingAgencyCardProps {
  agency: IssuingAgency;
  isSelected?: boolean;
  onSelect: (agencyCode: string) => void;
}

const AGENCY_ICONS: Record<string, React.ReactNode> = {
  'GS1': <Globe className="h-5 w-5" />,
  'HIBCC': <Building2 className="h-5 w-5" />,
  'ICCBBA': <FlaskConical className="h-5 w-5" />,
  'IFA': <Pill className="h-5 w-5" />,
  'EUDAMED': <Database className="h-5 w-5" />
};

export function IssuingAgencyCard({ agency, isSelected, onSelect }: IssuingAgencyCardProps) {
  return (
    <Card 
      className={`transition-all ${
        isSelected 
          ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
          : 'hover:border-muted-foreground/30 hover:shadow-sm'
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              {AGENCY_ICONS[agency.code] || <Globe className="h-5 w-5" />}
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {agency.name}
                {isSelected && <Check className="h-4 w-4 text-primary" />}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{agency.fullName}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{agency.description}</p>
        
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Best suited for:</p>
          <div className="flex flex-wrap gap-1">
            {agency.bestFor.map((use, i) => (
              <Badge key={i} variant="secondary" className="text-xs font-normal">
                {use}
              </Badge>
            ))}
          </div>
        </div>

        <div className="pt-1 border-t">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Format:</span> {agency.prefixFormat}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Example:</span> <code className="bg-muted px-1 rounded">{agency.prefixExample}</code>
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            asChild
          >
            <a 
              href={agency.registrationUrl || agency.websiteUrl} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Register
            </a>
          </Button>
          <Button
            variant={isSelected ? "secondary" : "default"}
            size="sm"
            className="flex-1"
            onClick={() => onSelect(agency.code)}
          >
            {isSelected ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1.5" />
                Selected
              </>
            ) : (
              'I have a prefix'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
