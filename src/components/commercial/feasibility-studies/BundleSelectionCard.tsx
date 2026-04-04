import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package2 } from 'lucide-react';
import { CompanyBundle } from '@/hooks/useCompanyBundles';
import { useTranslation } from '@/hooks/useTranslation';

interface BundleSelectionCardProps {
  bundle: CompanyBundle;
  isSelected: boolean;
  onSelect: () => void;
}

export function BundleSelectionCard({
  bundle,
  isSelected,
  onSelect,
}: BundleSelectionCardProps) {
  const { lang } = useTranslation();

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {bundle.thumbnail_url ? (
            <img
              src={bundle.thumbnail_url}
              alt={bundle.bundle_name}
              className="w-16 h-16 object-cover rounded"
            />
          ) : (
            <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
              <Package2 className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold truncate">{bundle.bundle_name}</h3>
              {isSelected && (
                <Badge variant="default" className="shrink-0">{lang('commercial.feasibilityStudies.selected')}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1 break-all">
              {bundle.description || lang('commercial.feasibilityStudies.noDescription')}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>{bundle.member_count} {bundle.member_count !== 1 ? lang('commercial.feasibilityStudies.items') : lang('commercial.feasibilityStudies.item')}</span>
              {bundle.target_markets && bundle.target_markets.length > 0 && (
                <span>{bundle.target_markets.length} {bundle.target_markets.length !== 1 ? lang('commercial.feasibilityStudies.marketPlural') : lang('commercial.feasibilityStudies.market')}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
