import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, ExternalLink, MapPin, Package, Globe, UserPlus, Check } from 'lucide-react';

interface CompetitorCompany {
  organization: string;
  country?: string;
  productCount: number;
  website?: string;
  dominantRiskClass?: string;
  deviceTypes?: string[];
}

interface CompetitorCompanyCardProps {
  company: CompetitorCompany;
  className?: string;
  rank?: number;
  onAddToOverview?: (company: CompetitorCompany) => void;
  isAddedToOverview?: boolean;
}

export function CompetitorCompanyCard({ company, className, rank, onAddToOverview, isAddedToOverview }: CompetitorCompanyCardProps) {
  const handleVisitWebsite = () => {
    
    if (company.website) {
      window.open(company.website, '_blank');
    } else {
      try {
        navigator.clipboard.writeText(company.organization).then(() => {
          alert(`Company name "${company.organization}" copied to clipboard!`);
        }).catch((err) => {
          // console.error('Failed to copy to clipboard:', err);
          alert('Could not copy to clipboard. Please manually search for: ' + company.organization);
        });
      } catch (error) {
        // console.error('Clipboard API not available:', error);
        alert('Please manually search for: ' + company.organization);
      }
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                {rank && (
                  <Badge variant={rank === 1 ? "default" : "secondary"} className="text-xs">
                    #{rank}
                  </Badge>
                )}
                <span className="text-lg font-semibold">{company.organization}</span>
              </div>
            </div>
          </div>
          {company.dominantRiskClass && (
            <Badge variant="outline" className="text-xs">
              Class {company.dominantRiskClass}
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="flex items-center gap-4">
          {company.country && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{company.country}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            <span>{company.productCount} products</span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Product Information */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Market Presence</span>
            <span className="text-sm text-muted-foreground">
              {company.productCount} registered device{company.productCount !== 1 ? 's' : ''}
            </span>
          </div>
          
          {/* Product count visualization */}
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min((company.productCount / 50) * 100, 100)}%` // Assuming 50+ is high market presence
              }}
            />
          </div>
          
          {company.deviceTypes && company.deviceTypes.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Device Categories
              </div>
              <div className="flex flex-wrap gap-1">
                {company.deviceTypes.slice(0, 3).map((type, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {type}
                  </Badge>
                ))}
                {company.deviceTypes.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{company.deviceTypes.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onAddToOverview && (
            <Button
              onClick={() => onAddToOverview(company)}
              variant={isAddedToOverview ? "secondary" : "default"}
              size="sm"
              className="flex-1"
              disabled={isAddedToOverview}
            >
              {isAddedToOverview ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Added
                </>
              ) : (
                <>
                  <UserPlus className="h-3 w-3 mr-1" />
                  Add to List
                </>
              )}
            </Button>
          )}
          <Button 
            onClick={handleVisitWebsite} 
            variant="outline" 
            size="sm" 
            className={onAddToOverview ? "" : "flex-1"}
          >
            <Globe className="h-3 w-3 mr-1" />
            {company.website ? 'Visit Website' : 'Search Online'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Copy company name to clipboard
              navigator.clipboard.writeText(company.organization);
            }}
            className="px-3"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>

        {/* Competitive Intelligence */}
        <div className="bg-muted/50 rounded-lg p-3 mt-4">
          <div className="text-xs font-medium text-muted-foreground mb-1">
            Competitive Intelligence
          </div>
          <div className="space-y-1 text-xs">
            <div>• {company.productCount === 1 ? 'Single product' : `${company.productCount} products`} in this category</div>
            <div>• {company.dominantRiskClass ? `Primarily ${company.dominantRiskClass} risk class` : 'Mixed risk classifications'}</div>
            <div>• Based in {company.country || 'Unknown location'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}