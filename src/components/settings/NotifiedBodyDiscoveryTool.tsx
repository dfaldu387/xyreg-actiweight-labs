
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Filter } from "lucide-react";
import { NotifiedBody, NotifiedBodyScope } from "@/types/notifiedBody";
import { NotifiedBodyCandidateCard } from "./NotifiedBodyCandidateCard";
import { useNotifiedBodies } from "@/hooks/useNotifiedBodies";
import { MultiSelect } from "./document-control/MultiSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NotifiedBodyDiscoveryToolProps {
  onSelect: (notifiedBody: NotifiedBody) => void;
}

export function NotifiedBodyDiscoveryTool({ onSelect }: NotifiedBodyDiscoveryToolProps) {
  const { notifiedBodies, loading, error, filterByCountry, filterByScope, refetch } = useNotifiedBodies();
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);

  // Scope options for the MultiSelect component
  const scopeOptions = [
    { label: "MDR", value: "mdr" },
    { label: "IVDR", value: "ivdr" },
    { label: "High Risk Active Implantables", value: "highRiskActiveImplantables" },
    { label: "High Risk Non-Active Implants", value: "highRiskImplantsNonActive" },
    { label: "Medical Software", value: "medicalSoftware" },
    { label: "Sterilization Methods", value: "sterilizationMethods" },
    { label: "Drug-Device Combinations", value: "drugDeviceCombinations" },
  ];

  const handleCountryFilter = (country: string) => {
    setSelectedCountry(country);
    applyFilters(country, selectedScopes);
  };

  const handleScopeFilter = (scopes: string[]) => {
    setSelectedScopes(scopes);
    applyFilters(selectedCountry, scopes);
  };

  const applyFilters = (country: string, scopes: string[]) => {
    if ((country === "all" || !country) && scopes.length === 0) {
      refetch();
      return;
    }

    // Apply country filter if selected
    if (country && country !== "all") {
      filterByCountry(country);
    }

    // Apply scope filters if selected
    if (scopes.length > 0) {
      const scopeFilter: Partial<NotifiedBodyScope> = {};
      scopes.forEach(scope => {
        scopeFilter[scope as keyof NotifiedBodyScope] = true;
      });
      filterByScope(scopeFilter);
    }

    // If only country is selected, filter by country
    if (country && country !== "all" && scopes.length === 0) {
      filterByCountry(country);
    }
    // If only scopes are selected, filter by scopes
    else if ((!country || country === "all") && scopes.length > 0) {
      const scopeFilter: Partial<NotifiedBodyScope> = {};
      scopes.forEach(scope => {
        scopeFilter[scope as keyof NotifiedBodyScope] = true;
      });
      filterByScope(scopeFilter);
    }
    // If no filters are selected, show all
    else if ((!country || country === "all") && scopes.length === 0) {
      refetch();
    }
  };

  const clearAllFilters = () => {
    setSelectedCountry("");
    setSelectedScopes([]);
    refetch();
  };

  // Get unique countries for filter - only when data is loaded
  const countries = React.useMemo(() => {
    if (!notifiedBodies || notifiedBodies.length === 0) return [];
    return Array.from(new Set(notifiedBodies.map(nb => nb.country))).sort();
  }, [notifiedBodies]);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <p className="text-red-600">Error loading Notified Bodies: {error}</p>
            <Button onClick={refetch} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Your Notified Body
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Use our discovery tool to find the right Notified Body for your medical device. 
            Filter by location and multiple scopes to narrow down your options.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Show loading state for filters */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-muted-foreground">Loading filters...</span>
            </div>
          ) : (
            <>
              {/* Filter Controls - Only show when data is loaded */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Filter by Country</label>
                  <Select value={selectedCountry} onValueChange={handleCountryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All countries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All countries</SelectItem>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Filter by Scopes (Multiple)</label>
                  {/* Only render MultiSelect when data is ready and options are available */}
                  {scopeOptions && scopeOptions.length > 0 ? (
                    <MultiSelect
                      options={scopeOptions}
                      selected={selectedScopes || []}
                      onChange={handleScopeFilter}
                      placeholder="Select scopes..."
                    />
                  ) : (
                    <div className="p-2 border border-input rounded-md bg-muted text-muted-foreground text-sm">
                      Loading scope options...
                    </div>
                  )}
                </div>
              </div>

              {/* Results Summary */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {notifiedBodies.length} Notified Bodies found
                </span>
                {selectedCountry && selectedCountry !== "all" && (
                  <Badge variant="secondary">Country: {selectedCountry}</Badge>
                )}
                {selectedScopes && selectedScopes.map(scope => {
                  const option = scopeOptions.find(opt => opt.value === scope);
                  return option ? (
                    <Badge key={scope} variant="secondary">
                      Scope: {option.label}
                    </Badge>
                  ) : null;
                })}
                {(selectedCountry && selectedCountry !== "all") || (selectedScopes && selectedScopes.length > 0) ? (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearAllFilters}
                    className="h-6 px-2 text-xs"
                  >
                    Clear All Filters
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Results Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-muted-foreground">Loading Notified Bodies...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notifiedBodies.map((notifiedBody) => (
            <NotifiedBodyCandidateCard
              key={notifiedBody.id}
              notifiedBody={notifiedBody}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}

      {!loading && notifiedBodies.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              No Notified Bodies found matching your criteria. Try adjusting your filters.
            </p>
            <Button 
              onClick={clearAllFilters} 
              variant="outline" 
              className="mt-4"
            >
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
