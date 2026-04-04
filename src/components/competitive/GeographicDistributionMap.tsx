import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/integrations/supabase/client';

interface GeographicDistributionMapProps {
  emdnCode?: string;
  companyId?: string;
  competitorsByCountry: Record<string, number>;
  totalCompetitors: number;
}

interface CountryStats {
  country: string;
  totalDevices: number;
  manufacturerCount: number;
  marketShare: number;
}

interface EudamedMarketDistribution {
  country: string;
  deviceCount: number;
}

export function GeographicDistributionMap({ 
  emdnCode, 
  companyId, 
  competitorsByCountry, 
  totalCompetitors 
}: GeographicDistributionMapProps) {
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);
  const [eudamedDistribution, setEudamedDistribution] = useState<EudamedMarketDistribution[]>([]);
  const [isLoadingEudamed, setIsLoadingEudamed] = useState(true);

  // Fetch EUDAMED market distribution data
  useEffect(() => {
    const fetchEudamedDistribution = async () => {
      if (!emdnCode) {
        setIsLoadingEudamed(false);
        return;
      }

      try {
        // Get all devices for this EMDN code from all manufacturers with market distribution
        const { data, error } = await supabase.rpc('get_eudamed_devices_by_emdn_with_markets', {
          emdn_code: emdnCode,
          limit_count: 1000
        });

        if (error) {
          console.error('Error fetching EUDAMED distribution:', error);
          setIsLoadingEudamed(false);
          return;
        }

        // Process market distribution data from the market_distribution column (if available)
        const distributionCounts: Record<string, number> = {};
        
        data?.forEach((device: any) => {
          if (device.market_distribution) {
            // Parse market_distribution which contains countries where the product is sold
            const markets = device.market_distribution.split(',').map((country: string) => country.trim());
            markets.forEach((country: string) => {
              if (country && country !== '') {
                distributionCounts[country] = (distributionCounts[country] || 0) + 1;
              }
            });
          }
        });

        const distributionArray = Object.entries(distributionCounts)
          .map(([country, deviceCount]) => ({ country, deviceCount }))
          .sort((a, b) => b.deviceCount - a.deviceCount);

        setEudamedDistribution(distributionArray);
      } catch (error) {
        console.error('Error in fetchEudamedDistribution:', error);
      } finally {
        setIsLoadingEudamed(false);
      }
    };

    fetchEudamedDistribution();
  }, [emdnCode]);

  // Convert competitor data to country stats
  useEffect(() => {
    const stats = Object.entries(competitorsByCountry).map(([country, deviceCount]) => ({
      country,
      totalDevices: deviceCount,
      manufacturerCount: 0, // This would need additional data to calculate
      marketShare: (deviceCount / totalCompetitors) * 100
    })).sort((a, b) => b.totalDevices - a.totalDevices);
    
    setCountryStats(stats);
  }, [competitorsByCountry, totalCompetitors]);

  if (isLoadingEudamed) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <LoadingSpinner />
            <p className="text-muted-foreground">Loading geographic distribution data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* EUDAMED Market Distribution Statistics */}
      {eudamedDistribution.length > 0 && (
        <div>
          <h4 className="flex items-center gap-2 font-semibold mb-4">
            🌍 Market Distribution by Country
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            Countries where devices for EMDN {emdnCode} are sold based on EUDAMED market_distribution data
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {eudamedDistribution.slice(0, 12).map((item, index) => (
              <div key={item.country} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{item.country}</span>
                  <Badge variant={index < 3 ? "default" : "secondary"} className="text-xs">
                    #{index + 1}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.deviceCount} devices
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manufactured Products by Country */}
      <div>
        <h4 className="flex items-center gap-2 font-semibold mb-4">
          🏭 Manufacturing by Country
        </h4>
        <p className="text-sm text-muted-foreground mb-4">
          Countries where competing devices are manufactured for EMDN {emdnCode}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {countryStats.slice(0, 9).map((stat, index) => (
            <div key={stat.country} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{stat.country}</span>
                <Badge variant={index < 3 ? "default" : "secondary"}>
                  #{index + 1}
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>Total Devices: {stat.totalDevices}</div>
                <div>Market Share: {stat.marketShare.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Geographic Distribution Summary</CardTitle>
          <CardDescription>
            Market presence and manufacturing statistics for EMDN {emdnCode}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium">Market Presence</h4>
              <p className="text-2xl font-bold text-primary">
                {eudamedDistribution.length} countries
              </p>
              <p className="text-sm text-muted-foreground">
                Total markets where devices are sold
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Manufacturing Locations</h4>
              <p className="text-2xl font-bold text-primary">
                {countryStats.length} countries
              </p>
              <p className="text-sm text-muted-foreground">
                Countries with competing manufacturers
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}