import { BundleCard } from './BundleCard';
import type { CompanyBundle } from '@/hooks/useCompanyBundles';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface BundleGridProps {
  bundles: CompanyBundle[];
  cardsPerRow?: number;
  companyName?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  showFeasibilityOnly?: boolean;
  onFeasibilityToggle?: (enabled: boolean) => void;
}

export function BundleGrid({
  bundles,
  cardsPerRow = 3,
  companyName,
  searchQuery = '',
  onSearchChange,
  showFeasibilityOnly = false,
  onFeasibilityToggle
}: BundleGridProps) {
  const { lang } = useTranslation();

  // Filter bundles based on search and feasibility toggle
  const filteredBundles = bundles.filter(bundle => {
    // Search filter - check bundle name, product members, and target markets
    const matchesSearch = !searchQuery || 
      bundle.bundle_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bundle.product_members.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      bundle.sibling_group_members.some(g => g.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (bundle.target_markets && bundle.target_markets.some(m => m.toLowerCase().includes(searchQuery.toLowerCase())));
    
    // Feasibility filter
    const matchesFeasibility = !showFeasibilityOnly || bundle.is_feasibility_study;
    
    return matchesSearch && matchesFeasibility;
  });

  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[cardsPerRow] || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={lang('bundleGrid.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="feasibility-toggle"
            checked={showFeasibilityOnly}
            onCheckedChange={onFeasibilityToggle}
          />
          <Label htmlFor="feasibility-toggle" className="cursor-pointer">
            {lang('bundleGrid.feasibilityOnly')}
          </Label>
        </div>
      </div>

      {/* Header with Count */}
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">{lang('bundleGrid.title')}</h3>
        <span className="text-sm text-muted-foreground">
          ({filteredBundles.length}{bundles.length !== filteredBundles.length && ` ${lang('bundleGrid.of')} ${bundles.length}`})
        </span>
      </div>

      {/* Bundles Grid */}
      {filteredBundles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {bundles.length === 0
            ? lang('bundleGrid.noBundles')
            : lang('bundleGrid.noMatchingBundles')}
        </div>
      ) : (
        <div className={`grid ${gridCols} gap-6`}>
          {filteredBundles.map((bundle) => (
            <BundleCard
              key={bundle.id}
              bundle={bundle}
              companyName={companyName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
