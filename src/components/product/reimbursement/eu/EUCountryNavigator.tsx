import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, MapPin, Building2, ArrowRight, Info } from 'lucide-react';
import { EU_COUNTRY_REIMBURSEMENT_SYSTEMS, EU_OVERVIEW } from '@/utils/reimbursement/euCountryReimbursementSystems';
import { GermanyReimbursementModule } from '../germany/GermanyReimbursementModule';
import { FranceReimbursementModule } from '../france/FranceReimbursementModule';
import { useTranslation } from '@/hooks/useTranslation';

// Maps country codes to their system translation key paths
const SYSTEM_KEY_MAP: Record<string, Record<string, string>> = {
  DE: { 'Hospital Inpatient Codes': 'hospitalInpatient', 'Outpatient Codes': 'outpatient' },
  FR: { 'Procedure & Device Codes': 'procedureDevice' },
  IT: { 'National Framework': 'nationalFramework', 'Regional Systems': 'regionalSystems' },
  ES: { 'National System': 'nationalSystem', 'Regional Systems': 'regionalSystems' },
  NL: { 'Healthcare Products': 'healthcareProducts' },
  BE: { 'National Nomenclature': 'nationalNomenclature' },
  AT: { 'Hospital Financing': 'hospitalFinancing' },
  PL: { 'National Health Fund': 'nationalHealthFund' },
  SE: { 'Nordic System': 'nordicSystem' },
};

// Maps code identifiers to their translation key (sanitized for JSON keys)
function codeToKey(code: string): string {
  return code
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/\//g, '_');
}

const KEY_PRINCIPLE_KEYS = [
  'nationalSovereignty',
  'htaVariation',
  'pricingDiversity',
  'ceMarkingNotReimbursement',
  'regionalDifferences',
];

interface EUCountryNavigatorProps {
  targetMarkets: string[];
  disabled?: boolean;
}

export function EUCountryNavigator({ targetMarkets, disabled = false }: EUCountryNavigatorProps) {
  const { lang } = useTranslation();

  // Filter EU countries from target markets
  const euCountryCodes = Object.keys(EU_COUNTRY_REIMBURSEMENT_SYSTEMS);
  const availableEUMarkets = targetMarkets.filter(code => euCountryCodes.includes(code));

  // Default to first available EU market or Germany
  const [selectedCountry, setSelectedCountry] = useState<string>(
    availableEUMarkets.length > 0 ? availableEUMarkets[0] : 'DE'
  );

  const countryData = EU_COUNTRY_REIMBURSEMENT_SYSTEMS[selectedCountry];

  if (!countryData) return null;

  const translatedCountryName = lang(`reimbursement.eu.countries.${selectedCountry}`);

  return (
    <div className="space-y-6">
      {/* EU Overview */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            {lang('reimbursement.eu.overview.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{lang('reimbursement.eu.overview.description')}</p>
          <div>
            <h4 className="text-sm font-semibold mb-2">{lang('reimbursement.eu.overview.keyPrinciplesTitle')}</h4>
            <ul className="space-y-1">
              {KEY_PRINCIPLE_KEYS.map((principleKey, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{lang(`reimbursement.eu.overview.keyPrinciples.${principleKey}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Country Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {lang('reimbursement.eu.countrySelector.title')}
          </CardTitle>
          <CardDescription>
            {lang('reimbursement.eu.countrySelector.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(EU_COUNTRY_REIMBURSEMENT_SYSTEMS).map(([code, data]) => (
                <SelectItem key={code} value={code}>
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{data.flagEmoji}</span>
                    <span>{lang(`reimbursement.eu.countries.${code}`)}</span>
                    {data.hasDeepDive && (
                      <Badge variant="secondary" className="ml-2 text-xs">{lang('reimbursement.eu.deepDiveBadge')}</Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Country-Specific Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{countryData.flagEmoji}</span>
            <div>
              <CardTitle>{lang('reimbursement.eu.reimbursementSystem', { country: translatedCountryName })}</CardTitle>
              <CardDescription>{lang(`reimbursement.eu.countryDescriptions.${selectedCountry}`)}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Code Types by System */}
          {countryData.systems.map((system, sysIdx) => {
            const systemKeyMap = SYSTEM_KEY_MAP[selectedCountry] || {};
            const systemKey = systemKeyMap[system.name] || system.name;
            return (
              <div key={sysIdx}>
                <h4 className="text-sm font-semibold mb-3">
                  {lang(`reimbursement.eu.systems.${selectedCountry}.${systemKey}`)}
                </h4>
                <div className="space-y-3">
                  {system.codeTypes.map((codeType) => {
                    const ctKey = codeToKey(codeType.code);
                    return (
                      <div key={codeType.code} className="border rounded-lg p-3 bg-secondary/30">
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">{codeType.code}</Badge>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{lang(`reimbursement.eu.codeTypes.${ctKey}.name`)}</p>
                            <p className="text-xs text-muted-foreground mt-1">{lang(`reimbursement.eu.codeTypes.${ctKey}.description`)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* HTA Body */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {lang('reimbursement.eu.htaBodyTitle')}
            </h4>
            <a
              href={countryData.htaBody.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {countryData.htaBody.name}
            </a>
          </div>

          {/* Deep Dive Module */}
          {countryData.hasDeepDive && (
            <div className="pt-4 border-t">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="default" className="w-full" disabled={disabled}>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    {lang('reimbursement.eu.marketDeepDive', { country: translatedCountryName })}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                  {selectedCountry === 'DE' && <GermanyReimbursementModule />}
                  {selectedCountry === 'FR' && <FranceReimbursementModule />}
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
