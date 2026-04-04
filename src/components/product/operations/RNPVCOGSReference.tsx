import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ExternalLink, Loader2, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NPVPersistenceService, MarketNPVInputData } from "@/services/npvPersistenceService";
import { useTranslation } from "@/hooks/useTranslation";

interface RNPVCOGSReferenceProps {
  productId: string;
}

const MARKET_INFO: Record<string, { name: string; flag: string; currency: string; symbol: string }> = {
  EU: { name: "European Union", flag: "🇪🇺", currency: "EUR", symbol: "€" },
  USA: { name: "United States", flag: "🇺🇸", currency: "USD", symbol: "$" },
  UK: { name: "United Kingdom", flag: "🇬🇧", currency: "GBP", symbol: "£" },
  JP: { name: "Japan", flag: "🇯🇵", currency: "JPY", symbol: "¥" },
  CN: { name: "China", flag: "🇨🇳", currency: "CNY", symbol: "¥" },
  AU: { name: "Australia", flag: "🇦🇺", currency: "AUD", symbol: "A$" },
  CA: { name: "Canada", flag: "🇨🇦", currency: "CAD", symbol: "C$" },
  BR: { name: "Brazil", flag: "🇧🇷", currency: "BRL", symbol: "R$" },
  KR: { name: "South Korea", flag: "🇰🇷", currency: "KRW", symbol: "₩" },
  IN: { name: "India", flag: "🇮🇳", currency: "INR", symbol: "₹" },
  CH: { name: "Switzerland", flag: "🇨🇭", currency: "CHF", symbol: "CHF" },
};

export function RNPVCOGSReference({ productId }: RNPVCOGSReferenceProps) {
  const navigate = useNavigate();
  const [marketData, setMarketData] = useState<Record<string, MarketNPVInputData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const { lang } = useTranslation();

  useEffect(() => {
    const loadRNPVData = async () => {
      try {
        const service = new NPVPersistenceService();
        const analysis = await service.loadNPVAnalysis(productId, "Base Case");
        if (analysis) {
          setMarketData(analysis.marketInputData || {});
          setSelectedCurrency(analysis.selectedCurrency || "USD");
        }
      } catch (error) {
        console.error("Failed to load rNPV data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadRNPVData();
  }, [productId]);

  const handleNavigateToRNPV = () => {
    navigate(`/app/product/${productId}/business-case?tab=rnpv`);
  };

  const marketEntries = Object.entries(marketData);
  const hasData = marketEntries.length > 0;

  const formatCurrency = (value: number, marketCode: string) => {
    const info = MARKET_INFO[marketCode];
    const symbol = info?.symbol || "$";
    return `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <Card className="border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20">
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-indigo-600" />
            <span className="text-indigo-900 dark:text-indigo-300">{lang('manufacturing.rnpvReference.title')}</span>
          </div>
          <Badge variant="outline" className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700">
            {lang('manufacturing.rnpvReference.readOnly')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasData ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {marketEntries.map(([marketCode, data]) => {
                const info = MARKET_INFO[marketCode] || { name: marketCode, flag: "🌐", currency: "USD", symbol: "$" };
                return (
                  <div
                    key={marketCode}
                    className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-secondary/50 border border-border"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{info.flag}</span>
                      <span className="text-sm font-medium">{info.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(data.initialVariableCost, marketCode)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="h-3 w-3" />
              <span>{lang('manufacturing.rnpvReference.hint')}</span>
            </div>
          </>
        ) : (
          <div className="text-center py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              {lang('manufacturing.rnpvReference.noData')}
            </p>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleNavigateToRNPV}
          className="w-full border-indigo-300 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
        >
          {hasData ? lang('manufacturing.rnpvReference.editButton') : lang('manufacturing.rnpvReference.goToButton')}
          <ExternalLink className="h-3 w-3 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
