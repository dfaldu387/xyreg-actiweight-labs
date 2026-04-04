
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Globe, Building } from "lucide-react";
import { ReferenceDataService } from "@/services/referenceDataService";
import type { CountryRegulatory } from "@/types/referenceData";

export function CountriesReference() {
  const [countries, setCountries] = useState<CountryRegulatory[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<CountryRegulatory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    filterCountries();
  }, [countries, searchTerm, selectedRegion]);

  const loadCountries = async () => {
    setLoading(true);
    try {
      const data = await ReferenceDataService.getCountriesRegulatory();
      setCountries(data);
      setFilteredCountries(data);
    } catch (error) {
      console.error('Error loading countries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCountries = () => {
    let filtered = [...countries];

    if (searchTerm) {
      filtered = filtered.filter(country => 
        country.country_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.country_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedRegion) {
      filtered = filtered.filter(country => country.region === selectedRegion);
    }

    setFilteredCountries(filtered);
  };

  const getRegionColor = (region: string) => {
    const colors: Record<string, string> = {
      'Europe': 'bg-blue-100 text-blue-800 border-blue-200',
      'Americas': 'bg-green-100 text-green-800 border-green-200', 
      'APAC': 'bg-purple-100 text-purple-800 border-purple-200',
      'Africa': 'bg-orange-100 text-orange-800 border-orange-200',
      'Middle East': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[region] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const regions = [...new Set(countries.map(c => c.region))];

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Countries & Regulatory Authorities</h2>
          <p className="text-muted-foreground">Reference data for global medical device regulations</p>
        </div>
      </div>

      <div className="flex gap-4 items-end">
        <div className="flex-1 max-w-sm">
          <Label htmlFor="search">Search Countries</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-48">
          <Label htmlFor="region">Filter by Region</Label>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger>
              <SelectValue placeholder="All regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All regions</SelectItem>
              {regions.map((region) => (
                <SelectItem key={region} value={region}>{region}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCountries.map((country) => (
          <Card key={country.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {country.country_name}
                </CardTitle>
                <Badge className={getRegionColor(country.region)}>
                  {country.region}
                </Badge>
              </div>
              <div className="flex gap-2 text-sm text-muted-foreground">
                <span>{country.iso_alpha_2}</span>
                <span>•</span>
                <span>{country.iso_alpha_3}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {country.regulatory_framework && (
                <div>
                  <Label className="text-xs font-medium">Regulatory Framework</Label>
                  <p className="text-sm">{country.regulatory_framework}</p>
                </div>
              )}
              
              {country.medical_device_authority && (
                <div>
                  <Label className="text-xs font-medium flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    Regulatory Authority
                  </Label>
                  <p className="text-sm">{country.medical_device_authority}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Registration Required</Label>
                <Badge variant={country.registration_required ? "default" : "secondary"}>
                  {country.registration_required ? "Yes" : "No"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCountries.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No countries found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
