import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Code, Globe } from 'lucide-react';
import { FDAProductCodeService } from '@/services/fdaProductCodeService';
import type { FDAProductCodeInfo } from '@/types/fdaEnhanced';

interface CategoryCodeSelectorProps {
  onCodeSelect: (code: string) => void;
  selectedCode?: string;
  className?: string;
}

export function CategoryCodeSelector({ 
  onCodeSelect, 
  selectedCode = '', 
  className 
}: CategoryCodeSelectorProps) {
  const [inputCode, setInputCode] = useState(selectedCode);
  const [suggestions, setSuggestions] = useState<FDAProductCodeInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [validationInfo, setValidationInfo] = useState<FDAProductCodeInfo | null>(null);

  // Validate and get info for the current code
  useEffect(() => {
    const validateCode = async () => {
      if (inputCode.length >= 2) {
        try {
          const info = await FDAProductCodeService.getProductCodeInfo(inputCode.toUpperCase());
          setValidationInfo(info);
        } catch (error) {
          setValidationInfo(null);
        }
      } else {
        setValidationInfo(null);
      }
    };

    const timeoutId = setTimeout(validateCode, 300);
    return () => clearTimeout(timeoutId);
  }, [inputCode]);

  // Search for product code suggestions
  const handleSearch = async () => {
    if (inputCode.length < 2) return;

    setIsSearching(true);
    try {
      const results = await FDAProductCodeService.searchProductCodes(inputCode);
      setSuggestions(results.slice(0, 8)); // Limit to 8 suggestions
    } catch (error) {
      console.error('Error searching product codes:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCodeSubmit = () => {
    if (inputCode.trim()) {
      onCodeSelect(inputCode.trim().toUpperCase());
    }
  };

  const handleSuggestionSelect = (code: string) => {
    setInputCode(code);
    onCodeSelect(code);
    setSuggestions([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCodeSubmit();
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          Category Code Analysis
        </CardTitle>
        <CardDescription>
          Enter an FDA product code (e.g., GAA, KNW) or EMDN category code to analyze competitors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="category-code">Product/Category Code</Label>
          <div className="flex gap-2">
            <Input
              id="category-code"
              placeholder="e.g., GAA, KNW, L05010203..."
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              className="font-mono"
            />
            <Button onClick={handleCodeSubmit} disabled={!inputCode.trim()}>
              <Search className="h-4 w-4 mr-2" />
              Analyze
            </Button>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSearch}
              disabled={inputCode.length < 2 || isSearching}
            >
              {isSearching ? 'Searching...' : 'Find Codes'}
            </Button>
            <div className="flex gap-1">
              {['GAA', 'KNW', 'FBK', 'MBI'].map((code) => (
                <Button
                  key={code}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSuggestionSelect(code)}
                  className="font-mono"
                >
                  {code}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Code validation info */}
        {validationInfo && (
          <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-green-800 dark:text-green-200">
                    {validationInfo.code}
                  </span>
                  <Badge 
                    variant="outline" 
                    className="text-green-700 dark:text-green-300 border-green-300"
                  >
                    {FDAProductCodeService.getDeviceClassDescription(validationInfo.deviceClass)}
                  </Badge>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {validationInfo.description}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Medical Specialty: {validationInfo.medicalSpecialty}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Suggested Codes:</Label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {suggestions.map((code) => (
                <button
                  key={code.code}
                  onClick={() => handleSuggestionSelect(code.code)}
                  className="flex items-center gap-3 p-2 text-left border rounded hover:bg-muted transition-colors"
                >
                  <span className="font-mono font-bold text-primary">{code.code}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{code.description}</p>
                    <p className="text-xs text-muted-foreground">{code.medicalSpecialty}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Class {code.deviceClass}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• FDA Product Codes: 3-letter codes like GAA, KNW, FBK</p>
          <p>• EMDN Codes: EU medical device nomenclature (e.g., L05010203)</p>
          <p>• System will search both FDA and EU databases automatically</p>
        </div>
      </CardContent>
    </Card>
  );
}