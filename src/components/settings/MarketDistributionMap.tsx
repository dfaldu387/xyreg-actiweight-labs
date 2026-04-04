import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTemplateSettings } from '@/hooks/useTemplateSettings';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MarketDistributionData {
  country: string;
  deviceCount: number;
  devices: Array<{
    id: string;
    name: string;
    model: string;
  }>;
}

interface MarketDistributionSettingsProps {
  companyId: string;
}

export function MarketDistributionMap({ companyId }: MarketDistributionSettingsProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [distributionData, setDistributionData] = useState<MarketDistributionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { settings } = useTemplateSettings(companyId);

  // Country coordinates mapping (simplified for common EU countries)
  const countryCoordinates: Record<string, [number, number]> = {
    'Germany': [10.4515, 51.1657],
    'France': [2.2137, 46.2276],
    'Italy': [12.5674, 41.8719],
    'Spain': [3.7492, 40.4637],
    'Netherlands': [5.2913, 52.1326],
    'Belgium': [4.4699, 50.5039],
    'Austria': [14.5501, 47.5162],
    'Poland': [19.1343, 51.9194],
    'Czech Republic': [15.4730, 49.8175],
    'Sweden': [18.6435, 60.1282],
    'Denmark': [9.5018, 56.2639],
    'Finland': [25.7482, 61.9241],
    'Norway': [8.4689, 60.4720],
    'Switzerland': [8.2275, 46.8182],
    'United Kingdom': [-3.4360, 55.3781],
    'Ireland': [-8.2439, 53.4129],
    'Portugal': [-8.2245, 39.3999],
    'Hungary': [19.5033, 47.1625],
    'Romania': [24.9668, 45.9432],
    'Bulgaria': [25.4858, 42.7339],
    'Greece': [21.8243, 39.0742],
    'Croatia': [15.2, 45.1],
    'Slovenia': [14.9955, 46.1512],
    'Slovakia': [19.6990, 48.6690],
    'Lithuania': [23.8813, 55.1694],
    'Latvia': [24.6032, 56.8796],
    'Estonia': [25.0136, 58.5953],
    'Cyprus': [33.4299, 35.1264],
    'Malta': [14.3754, 35.9375],
    'Luxembourg': [6.1296, 49.8153]
  };

  useEffect(() => {
    fetchDistributionData();
  }, [companyId]);

  useEffect(() => {
    if (settings.mapbox_public_token && mapContainer.current && !map.current) {
      initializeMap();
    }
  }, [settings.mapbox_public_token, distributionData]);

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);


  const fetchDistributionData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch products with EUDAMED market distribution data
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          model_reference,
          eudamed_market_distribution
        `)
        .eq('company_id', companyId)
        .not('eudamed_market_distribution', 'is', null);

      if (error) {
        console.error('Error fetching distribution data:', error);
        toast.error('Failed to load market distribution data');
        return;
      }

      // Process and aggregate data by country
      const countryMap = new Map<string, MarketDistributionData>();

      products?.forEach(product => {
        if (product.eudamed_market_distribution) {
          // Parse market distribution - could be comma-separated countries or country codes
          const countries = product.eudamed_market_distribution
            .split(/[,;|]/)
            .map(c => c.trim())
            .filter(c => c.length > 0);

          countries.forEach(country => {
            // Normalize country name
            const normalizedCountry = normalizeCountryName(country);
            
            if (!countryMap.has(normalizedCountry)) {
              countryMap.set(normalizedCountry, {
                country: normalizedCountry,
                deviceCount: 0,
                devices: []
              });
            }

            const countryData = countryMap.get(normalizedCountry)!;
            countryData.deviceCount++;
            countryData.devices.push({
              id: product.id,
              name: product.name || 'Unknown Device',
              model: product.model_reference || 'Unknown Model'
            });
          });
        }
      });

      setDistributionData(Array.from(countryMap.values()));
    } catch (error) {
      console.error('Error processing distribution data:', error);
      toast.error('Failed to process market distribution data');
    } finally {
      setIsLoading(false);
    }
  };

  const normalizeCountryName = (country: string): string => {
    // Handle common country codes and variations
    const codeMap: Record<string, string> = {
      'DE': 'Germany',
      'FR': 'France',
      'IT': 'Italy',
      'ES': 'Spain',
      'NL': 'Netherlands',
      'BE': 'Belgium',
      'AT': 'Austria',
      'PL': 'Poland',
      'CZ': 'Czech Republic',
      'SE': 'Sweden',
      'DK': 'Denmark',
      'FI': 'Finland',
      'NO': 'Norway',
      'CH': 'Switzerland',
      'GB': 'United Kingdom',
      'UK': 'United Kingdom',
      'IE': 'Ireland',
      'PT': 'Portugal',
      'HU': 'Hungary',
      'RO': 'Romania',
      'BG': 'Bulgaria',
      'GR': 'Greece',
      'HR': 'Croatia',
      'SI': 'Slovenia',
      'SK': 'Slovakia',
      'LT': 'Lithuania',
      'LV': 'Latvia',
      'EE': 'Estonia',
      'CY': 'Cyprus',
      'MT': 'Malta',
      'LU': 'Luxembourg'
    };

    return codeMap[country.toUpperCase()] || country;
  };

  const initializeMap = () => {
    if (!mapContainer.current || !settings.mapbox_public_token) return;

    mapboxgl.accessToken = settings.mapbox_public_token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [10, 54],
      zoom: 3.5
    });

    map.current.on('load', () => {
      addMarkersToMap();
    });
  };

  const addMarkersToMap = () => {
    if (!map.current) return;

    distributionData.forEach((countryData) => {
      const coordinates = countryCoordinates[countryData.country];
      if (!coordinates) return;

      // Create a marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'custom-marker';
      markerEl.style.cssText = `
        background-color: hsl(var(--primary));
        color: hsl(var(--primary-foreground));
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s;
      `;
      markerEl.textContent = countryData.deviceCount.toString();

      // Create popup content
      const popupContent = `
        <div class="p-2 min-w-48">
          <h3 class="font-semibold text-lg mb-2">${countryData.country}</h3>
          <p class="text-sm text-muted-foreground mb-2">
            ${countryData.deviceCount} device${countryData.deviceCount > 1 ? 's' : ''} distributed
          </p>
          <div class="space-y-1 max-h-32 overflow-y-auto">
            ${countryData.devices.slice(0, 5).map(device => `
              <div class="text-xs">
                <span class="font-medium">${device.name}</span>
                ${device.model ? `<span class="text-gray-500"> - ${device.model}</span>` : ''}
              </div>
            `).join('')}
            ${countryData.devices.length > 5 ? `
              <div class="text-xs text-gray-500">
                +${countryData.devices.length - 5} more device${countryData.devices.length - 5 > 1 ? 's' : ''}
              </div>
            ` : ''}
          </div>
        </div>
      `;

      const popup = new mapboxgl.Popup({
        offset: 25,
        className: 'custom-popup'
      }).setHTML(popupContent);

      // Add hover effects
      markerEl.addEventListener('mouseenter', () => {
        markerEl.style.transform = 'scale(1.1)';
      });

      markerEl.addEventListener('mouseleave', () => {
        markerEl.style.transform = 'scale(1)';
      });

      // Add marker to map
      new mapboxgl.Marker(markerEl)
        .setLngLat(coordinates)
        .setPopup(popup)
        .addTo(map.current!);
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2 text-sm">Loading market distribution data...</span>
      </div>
    );
  }

  if (!settings.mapbox_public_token) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Mapbox token required. Please configure your Mapbox Public Token above to view the market distribution map.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Geographic distribution of your devices based on EUDAMED market distribution data.
        Found {distributionData.length} countries with device distribution.
      </p>
      
      <div ref={mapContainer} className="h-64 w-full rounded-lg overflow-hidden border" />
      
      {distributionData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-4">
          {distributionData
            .sort((a, b) => b.deviceCount - a.deviceCount)
            .slice(0, 8)
            .map((countryData) => (
              <div key={countryData.country} className="text-xs p-2 border rounded">
                <div className="flex justify-between items-center">
                  <span className="font-medium truncate">{countryData.country}</span>
                  <span className="text-xs bg-muted px-1 py-0.5 rounded ml-1">
                    {countryData.deviceCount}
                  </span>
                </div>
              </div>
            ))}
          {distributionData.length > 8 && (
            <div className="text-xs p-2 border rounded bg-muted/50 flex items-center justify-center">
              +{distributionData.length - 8} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}