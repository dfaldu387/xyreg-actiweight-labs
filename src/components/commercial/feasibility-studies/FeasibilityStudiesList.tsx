import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Rocket, Package2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CompanyBundle } from '@/hooks/useCompanyBundles';
import { useTranslation } from '@/hooks/useTranslation';

interface FeasibilityStudiesListProps {
  feasibilityBundles: CompanyBundle[];
  isLoading: boolean;
  onSelectBundle: (bundleId: string) => void;
  onCreateNew: () => void;
  disabled?: boolean;
}

export function FeasibilityStudiesList({
  feasibilityBundles,
  isLoading,
  onSelectBundle,
  onCreateNew,
  disabled = false,
}: FeasibilityStudiesListProps) {
  const { lang } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (feasibilityBundles.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <Rocket className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-lg">{lang('commercial.feasibilityStudies.noStudiesYet')}</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {lang('commercial.feasibilityStudies.noStudiesDescription')}
              </p>
            </div>
            <Button onClick={onCreateNew} disabled={disabled}>
              <Plus className="h-4 w-4 mr-2" />
              {lang('commercial.feasibilityStudies.createFeasibilityStudy')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{lang('commercial.feasibilityStudies.title')}</h2>
          <p className="text-muted-foreground">
            {lang('commercial.feasibilityStudies.subtitle')}
          </p>
        </div>
        <Button onClick={onCreateNew} disabled={disabled}>
          <Plus className="h-4 w-4 mr-2" />
          {lang('commercial.feasibilityStudies.createNewStudy')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {feasibilityBundles.map((bundle) => (
          <Card
            key={bundle.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onSelectBundle(bundle.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{bundle.bundle_name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {bundle.description || lang('commercial.feasibilityStudies.noDescription')}
                  </p>
                </div>
                <Badge variant="secondary" className="ml-2">
                  <Rocket className="h-3 w-3 mr-1" />
                  {lang('commercial.feasibilityStudies.study')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bundle.target_markets && bundle.target_markets.length > 0 && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">{lang('commercial.feasibilityStudies.markets')} </span>
                    <span className="font-medium">{bundle.target_markets.join(', ')}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package2 className="h-4 w-4" />
                  <span>{bundle.member_count} {bundle.member_count !== 1 ? lang('commercial.feasibilityStudies.items') : lang('commercial.feasibilityStudies.item')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
