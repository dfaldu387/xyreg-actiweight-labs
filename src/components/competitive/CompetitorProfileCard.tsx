import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Building2, ExternalLink, MapPin, Calendar, FileText, Zap } from 'lucide-react';
import { CompetitorDevice } from '@/services/competitiveAnalysisService';

interface CompetitorProfileCardProps {
  competitor: CompetitorDevice;
  className?: string;
  onViewDetails?: () => void;
}

export function CompetitorProfileCard({ competitor, className, onViewDetails }: CompetitorProfileCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <span className="text-lg">{competitor.organization}</span>
          </div>
          {competitor.risk_class && (
            <Badge variant="secondary">{competitor.risk_class}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          {competitor.device_name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Device Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">UDI-DI:</span>
            <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
              {competitor.basic_udi_di_code}
            </span>
          </div>
          
          {competitor.organization_country && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Country:</span>
              <span>{competitor.organization_country}</span>
            </div>
          )}
          
          {competitor.organization_status && (
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Status:</span>
              <Badge variant="outline" className="text-xs">
                {competitor.organization_status}
              </Badge>
            </div>
          )}
        </div>

        <Separator />

        {/* EMDN Codes */}
        {competitor.nomenclature_codes && competitor.nomenclature_codes.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">EMDN Classifications</div>
            <div className="flex flex-wrap gap-1">
              {competitor.nomenclature_codes.slice(0, 5).map((code, index) => (
                <Badge key={index} variant="outline" className="text-xs font-mono">
                  {code}
                </Badge>
              ))}
              {competitor.nomenclature_codes.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{competitor.nomenclature_codes.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onViewDetails && (
            <Button onClick={onViewDetails} variant="outline" size="sm" className="flex-1">
              <ExternalLink className="h-3 w-3 mr-1" />
              View Details
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Copy UDI-DI to clipboard
              navigator.clipboard.writeText(competitor.basic_udi_di_code);
            }}
            className="px-3"
          >
            Copy UDI-DI
          </Button>
        </div>

        {/* Competitive Intelligence */}
        <div className="bg-muted/50 rounded-lg p-3 mt-4">
          <div className="text-xs font-medium text-muted-foreground mb-1">
            Competitive Intelligence
          </div>
          <div className="space-y-1 text-xs">
            <div>• Same EMDN category as your device</div>
            <div>• Risk classification: {competitor.risk_class || 'Unknown'}</div>
            <div>• Manufacturing location: {competitor.organization_country || 'Unknown'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}