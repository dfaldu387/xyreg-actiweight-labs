import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ExternalLink, Info, ArrowRight, Check } from 'lucide-react';
import { MARKET_REIMBURSEMENT_SYSTEMS, type ReimbursementSystem } from '@/utils/marketReimbursementSystems';
import { USReimbursementModule } from './us/USReimbursementModule';
import { GermanyReimbursementModule } from './germany/GermanyReimbursementModule';
import { EUCountryNavigator } from './eu/EUCountryNavigator';
import { useTranslation } from '@/hooks/useTranslation';

interface ReimbursementInfoHubProps {
  targetMarkets: string[];
  disabled?: boolean;
}

// Major markets to always show as educational content
const MAJOR_MARKETS = ['US', 'EU', 'UK', 'JP', 'CA', 'AU'];

// Helper to convert code type codes to safe i18n keys (replace spaces/dashes with underscores)
const toSafeKey = (code: string) => code.replace(/[ -]/g, '_');

// Helper for i18n with fallback: use translated value if available, otherwise fall back to original
const t = (lang: (key: string) => string, key: string, fallback: string) => {
  const translated = lang(key);
  return translated !== key ? translated : fallback;
};

export function ReimbursementInfoHub({ targetMarkets, disabled = false }: ReimbursementInfoHubProps) {
  const { lang } = useTranslation();

  // Normalize market codes (handle both 2-letter and 3-letter codes)
  const normalizedMarkets = targetMarkets.map(code => {
    // Handle USA -> US conversion
    if (code === 'USA') return 'US';
    return code;
  });

  // Get all major market systems for educational display
  const allMajorSystems = MAJOR_MARKETS
    .map(code => MARKET_REIMBURSEMENT_SYSTEMS[code])
    .filter(Boolean) as ReimbursementSystem[];

  // Check if a market is selected for this product
  const isMarketSelected = (systemCode: string) => {
    if (systemCode === 'COUNTRY_SPECIFIC') {
      // EU countries use COUNTRY_SPECIFIC code
      return normalizedMarkets.some(m => ['EU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PL', 'SE'].includes(m));
    }
    return normalizedMarkets.includes(systemCode);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          {lang('reimbursement.infoHub.title')}
        </CardTitle>
        <CardDescription>
          {lang('reimbursement.infoHub.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="US" className="w-full max-w-4xl mx-auto">
          <TabsList className="grid grid-cols-6 w-full">
            {allMajorSystems.map((system) => {
              const displayCode = system.code === 'COUNTRY_SPECIFIC' ? 'EU' : system.code;
              const isSelected = isMarketSelected(system.code);
              return (
                <TabsTrigger 
                  key={system.code} 
                  value={system.code} 
                  className="text-xs"
                >
                  {displayCode}
                  {isSelected && <Check className="h-3 w-3 text-green-500" />}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {allMajorSystems.map((system) => {
            const displayCode = system.code === 'COUNTRY_SPECIFIC' ? 'EU' : system.code;
            return (
            <TabsContent key={system.code} value={system.code} className="space-y-4">
              {/* Show badge if this market is selected */}
              {isMarketSelected(system.code) && (
                <Badge variant="secondary" className="mb-2">
                  <Check className="h-3 w-3 mr-1" />
                  {lang('reimbursement.infoHub.selectedTargetMarket')}
                </Badge>
              )}
              
              {/* Special handling for EU countries - use EUCountryNavigator */}
              {system.code === 'COUNTRY_SPECIFIC' ? (
                <EUCountryNavigator targetMarkets={targetMarkets} disabled={disabled} />
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{t(lang, `reimbursement.markets.${displayCode}.name`, system.name)}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{t(lang, `reimbursement.markets.${displayCode}.description`, system.description)}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">{lang('reimbursement.infoHub.codeTypes')}</h4>
                      <div className="space-y-3">
                        {system.codeTypes.map((codeType) => {
                          const codeKey = toSafeKey(codeType.code);
                          return (
                            <div key={codeType.code} className="border rounded-lg p-3 bg-secondary/30">
                              <div className="flex items-start gap-2">
                                <Badge variant="outline" className="mt-0.5">{codeType.code}</Badge>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{t(lang, `reimbursement.markets.${displayCode}.codeTypes.${codeKey}.name`, codeType.name)}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{t(lang, `reimbursement.markets.${displayCode}.codeTypes.${codeKey}.description`, codeType.description)}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {system.applicationProcess && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">{lang('reimbursement.infoHub.applicationProcess')}</h4>
                        <p className="text-sm text-muted-foreground">{t(lang, `reimbursement.markets.${displayCode}.applicationProcess`, system.applicationProcess)}</p>
                      </div>
                    )}

                    {system.typicalTimeline && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">{lang('reimbursement.infoHub.typicalTimeline')}</h4>
                        <p className="text-sm text-muted-foreground">{t(lang, `reimbursement.markets.${displayCode}.typicalTimeline`, system.typicalTimeline)}</p>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-semibold mb-2">{lang('reimbursement.infoHub.governingBody')}</h4>
                      <p className="text-sm text-muted-foreground">{t(lang, `reimbursement.markets.${displayCode}.governingBody`, system.governingBody)}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-2">{lang('reimbursement.infoHub.resources')}</h4>
                      <div className="space-y-2">
                        {system.resources.map((resource, idx) => (
                          <a
                            key={idx}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {resource.name}
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Deep Dive Module for US */}
                    {system.code === 'US' && (
                      <div className="pt-4 border-t">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="default" className="w-full" disabled={disabled}>
                              <ArrowRight className="h-4 w-4 mr-2" />
                              {lang('reimbursement.infoHub.usMarketDeepDive')}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                            <USReimbursementModule />
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </>
              )}
            </TabsContent>
          );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
