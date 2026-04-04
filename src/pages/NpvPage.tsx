import React, { useEffect, useState } from 'react';
import { EnhancedProductMarket } from "@/types/client";
import { NPVAnalysisSection } from '@/components/product/device/sections/NPVAnalysisSection';
import { useParams } from 'react-router-dom';
import { useProductDetails } from '@/hooks/useProductDetails';

export default function ComprehensiveDeviceInformation() {
    const { productId } = useParams<{ productId: string }>();
    const { data: product, isLoading: isLoadingProduct } = useProductDetails(productId);

    // Get company ID from product
    const companyId = product?.company_id;

    // State for NPV-related data
    const [totalNPV, setTotalNPV] = useState<number>(0);
    const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
    const [markets, setMarkets] = useState<EnhancedProductMarket[]>([]);

    // Process markets data from product when it changes
    useEffect(() => {
        if (product?.markets) {
            let processedMarkets: EnhancedProductMarket[] = [];
            
            // Handle different formats of markets data
            if (Array.isArray(product.markets)) {
                processedMarkets = product.markets.map((market: any) => ({
                    code: market.code || '',
                    name: market.name || market.code || '',
                    selected: Boolean(market.selected),
                    riskClass: market.riskClass || 'medium',
                    launchDate: market.launchDate ? new Date(market.launchDate) : undefined,
                    // Include all other properties
                    ...market
                }));
            } else if (typeof product.markets === 'string') {
                try {
                    const parsedMarkets = JSON.parse(product.markets);
                    if (Array.isArray(parsedMarkets)) {
                        processedMarkets = parsedMarkets.map((market: any) => ({
                            code: market.code || '',
                            name: market.name || market.code || '',
                            selected: Boolean(market.selected),
                            riskClass: market.riskClass || 'medium',
                            launchDate: market.launchDate ? new Date(market.launchDate) : undefined,
                            // Include all other properties
                            ...market
                        }));
                    }
                } catch (error) {
                    console.error('Error parsing markets JSON:', error);
                }
            }
            
            // If no markets are selected, default to showing all markets as selected
            const hasSelectedMarkets = processedMarkets.some(market => market.selected);
            if (!hasSelectedMarkets && processedMarkets.length > 0) {
                processedMarkets = processedMarkets.map(market => ({
                    ...market,
                    selected: true
                }));
            }
            
            setMarkets(processedMarkets);
        } else {
            // If no markets data, create default markets for common regions
            const defaultMarkets: EnhancedProductMarket[] = [
                { code: 'US', name: 'United States', selected: true, riskClass: 'medium' },
                { code: 'EU', name: 'European Union', selected: true, riskClass: 'medium' },
                { code: 'CA', name: 'Canada', selected: true, riskClass: 'medium' },
                { code: 'AU', name: 'Australia', selected: true, riskClass: 'medium' }
            ];
            setMarkets(defaultMarkets);
        }
    }, [product?.markets]);

    // Handle currency change
    const handleCurrencyChange = (currency: string) => {
        setSelectedCurrency(currency);
    };

    // Handle market NPV change
    const handleMarketNPVChange = (marketCode: string, npvData: any) => {
        // Update the NPV data for the specific market
        console.log(`NPV changed for market ${marketCode}:`, npvData);
    };

    // Show loading state while product is loading
    if (isLoadingProduct) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-muted-foreground">Loading NPV analysis...</p>
                </div>
            </div>
        );
    }

    // Handle missing product
    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold">Product Not Found</h2>
                    <p className="text-muted-foreground">The requested product could not be found or you may not have access to it.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            <NPVAnalysisSection
                markets={markets}
                totalNPV={totalNPV}
                selectedCurrency={selectedCurrency}
                onCurrencyChange={handleCurrencyChange}
                onMarketNPVChange={handleMarketNPVChange}
                isLoading={isLoadingProduct}
                productId={productId}
                companyId={companyId}
            />
        </div>
    );
}
