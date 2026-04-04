import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Save, Search, Globe, Users, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface MarketData {
  region: string;
  country: string;
  marketSize: string;
  populationSize: string;
  gdpPerCapita: string;
  healthcareSpending: string;
  regulatoryComplexity: 'Low' | 'Medium' | 'High';
  competitiveIntensity: 'Low' | 'Medium' | 'High';
  selected: boolean;
  priority: 'Primary' | 'Secondary' | 'Future';
}

const mockMarketData: MarketData[] = [
  {
    region: 'North America',
    country: 'United States',
    marketSize: '$2.3B',
    populationSize: '331M',
    gdpPerCapita: '$63,543',
    healthcareSpending: '17.8%',
    regulatoryComplexity: 'High',
    competitiveIntensity: 'High',
    selected: true,
    priority: 'Primary'
  },
  {
    region: 'Europe',
    country: 'Germany',
    marketSize: '$1.1B',
    populationSize: '83M',
    gdpPerCapita: '$46,259',
    healthcareSpending: '11.7%',
    regulatoryComplexity: 'High',
    competitiveIntensity: 'Medium',
    selected: true,
    priority: 'Primary'
  },
  {
    region: 'Europe',
    country: 'United Kingdom',
    marketSize: '$890M',
    populationSize: '67M',
    gdpPerCapita: '$42,330',
    healthcareSpending: '10.9%',
    regulatoryComplexity: 'Medium',
    competitiveIntensity: 'Medium',
    selected: true,
    priority: 'Secondary'
  },
  {
    region: 'Asia Pacific',
    country: 'Japan',
    marketSize: '$1.5B',
    populationSize: '125M',
    gdpPerCapita: '$39,285',
    healthcareSpending: '10.9%',
    regulatoryComplexity: 'High',
    competitiveIntensity: 'Medium',
    selected: false,
    priority: 'Future'
  },
  {
    region: 'North America',
    country: 'Canada',
    marketSize: '$320M',
    populationSize: '38M',
    gdpPerCapita: '$43,241',
    healthcareSpending: '10.8%',
    regulatoryComplexity: 'Medium',
    competitiveIntensity: 'Medium',
    selected: true,
    priority: 'Secondary'
  },
  {
    region: 'Asia Pacific',
    country: 'Australia',
    marketSize: '$180M',
    populationSize: '25M',
    gdpPerCapita: '$51,812',
    healthcareSpending: '9.3%',
    regulatoryComplexity: 'Medium',
    competitiveIntensity: 'Low',
    selected: false,
    priority: 'Future'
  },
  {
    region: 'Europe',
    country: 'France',
    marketSize: '$780M',
    populationSize: '68M',
    gdpPerCapita: '$38,625',
    healthcareSpending: '11.2%',
    regulatoryComplexity: 'High',
    competitiveIntensity: 'Medium',
    selected: false,
    priority: 'Future'
  },
  {
    region: 'Asia Pacific',
    country: 'South Korea',
    marketSize: '$410M',
    populationSize: '52M',
    gdpPerCapita: '$31,846',
    healthcareSpending: '8.1%',
    regulatoryComplexity: 'Medium',
    competitiveIntensity: 'High',
    selected: false,
    priority: 'Future'
  }
];

const priorities = ['Primary', 'Secondary', 'Future'] as const;
const regions = ['All', 'North America', 'Europe', 'Asia Pacific'] as const;

export function TargetMarketsSelector() {
  const [marketData, setMarketData] = useState<MarketData[]>(mockMarketData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [isSaving, setIsSaving] = useState(false);

  const filteredMarkets = marketData.filter(market => {
    const matchesSearch = market.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         market.region.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = selectedRegion === 'All' || market.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  const updateMarketSelection = (index: number, selected: boolean) => {
    setMarketData(prev => prev.map((market, i) => 
      i === index ? { ...market, selected } : market
    ));
  };

  const updateMarketPriority = (index: number, priority: 'Primary' | 'Secondary' | 'Future') => {
    setMarketData(prev => prev.map((market, i) => 
      i === index ? { ...market, priority } : market
    ));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success("Target markets saved successfully");
  };

  const selectedMarkets = marketData.filter(market => market.selected);
  const totalMarketSize = selectedMarkets.reduce((total, market) => {
    const size = parseFloat(market.marketSize.replace(/[$BM]/g, ''));
    const multiplier = market.marketSize.includes('B') ? 1000 : 1;
    return total + (size * multiplier);
  }, 0);

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Primary': return 'bg-blue-100 text-blue-800';
      case 'Secondary': return 'bg-purple-100 text-purple-800';
      case 'Future': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Target Market Selection</h3>
          <p className="text-sm text-muted-foreground">Select and prioritize your target markets for market entry</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Selection"}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search markets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {regions.map(region => (
            <Button
              key={region}
              variant={selectedRegion === region ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRegion(region)}
            >
              {region}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Selected Markets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedMarkets.length}</div>
            <p className="text-xs text-muted-foreground">of {marketData.length} total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Market Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMarketSize.toFixed(1)}B</div>
            <p className="text-xs text-muted-foreground">addressable market</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Population
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(selectedMarkets.reduce((total, market) => 
                total + parseFloat(market.populationSize.replace('M', '')), 0
              ))}M
            </div>
            <p className="text-xs text-muted-foreground">target population</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Primary Markets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {selectedMarkets.filter(m => m.priority === 'Primary').length}
            </div>
            <p className="text-xs text-muted-foreground">launch priority</p>
          </CardContent>
        </Card>
      </div>

      {/* Market Grid */}
      <div className="grid gap-4">
        {filteredMarkets.map((market, index) => (
          <Card key={`${market.country}-${index}`} className={`transition-all ${market.selected ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={market.selected}
                    onCheckedChange={(checked) => updateMarketSelection(index, checked as boolean)}
                  />
                  <div>
                    <CardTitle className="text-base">{market.country}</CardTitle>
                    <CardDescription>{market.region}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className={getComplexityColor(market.regulatoryComplexity)}>
                    {market.regulatoryComplexity} Complexity
                  </Badge>
                  <Badge className={getPriorityColor(market.priority)}>
                    {market.priority}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Market Size:</span>
                    <span className="font-medium">{market.marketSize}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Population:</span>
                    <span className="font-medium">{market.populationSize}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GDP per Capita:</span>
                    <span className="font-medium">{market.gdpPerCapita}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Healthcare Spending:</span>
                    <span className="font-medium">{market.healthcareSpending}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Competition:</span>
                    <Badge variant="outline" className={getComplexityColor(market.competitiveIntensity)}>
                      {market.competitiveIntensity}
                    </Badge>
                  </div>
                  {market.selected && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Priority:</span>
                      <div className="flex gap-1">
                        {priorities.map(priority => (
                          <Button
                            key={priority}
                            variant={market.priority === priority ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateMarketPriority(index, priority)}
                            className="h-6 px-2 text-xs"
                          >
                            {priority}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMarkets.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No markets match your current filters.</p>
        </div>
      )}
    </div>
  );
}