import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, FileText, AlertTriangle, CheckCircle, Clock, TrendingUp, Loader2, X } from 'lucide-react';
import { FDAProductCodeService } from '@/services/fdaProductCodeService';
import { FDAProductCodeInfo } from '@/types/fdaEnhanced';

interface FDAProductCodeComparisonProps {
  productCodes: string[];
  onClose?: () => void;
  onCodesChange?: (codes: string[]) => void;
}

export function FDAProductCodeComparison({ productCodes, onClose, onCodesChange }: FDAProductCodeComparisonProps) {
  const [productCodeInfos, setProductCodeInfos] = useState<FDAProductCodeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [unknownCodesCount, setUnknownCodesCount] = useState(0);
  const [activeCodes, setActiveCodes] = useState<string[]>(productCodes);
  const [excludedCodes, setExcludedCodes] = useState<string[]>([]);
  const [markedForExclusion, setMarkedForExclusion] = useState<Set<string>>(new Set());

  useEffect(() => {
    setActiveCodes(productCodes);
  }, [productCodes]);

  useEffect(() => {
    const fetchProductCodes = async () => {
      setLoading(true);
      try {
        const allResults = await FDAProductCodeService.getMultipleProductCodeInfo(activeCodes);
        const validResults = allResults.filter(info => info !== null && info.description !== 'Unknown FDA product code');
        setProductCodeInfos(validResults);
        setUnknownCodesCount(activeCodes.length - validResults.length);
      } catch (error) {
        console.error('Error fetching product codes:', error);
        setProductCodeInfos([]);
        setUnknownCodesCount(activeCodes.length);
      } finally {
        setLoading(false);
      }
    };

    if (activeCodes.length > 0) {
      fetchProductCodes();
    } else {
      setProductCodeInfos([]);
      setLoading(false);
    }
  }, [activeCodes]);

  const handleToggleMarkForExclusion = (code: string) => {
    const newMarked = new Set(markedForExclusion);
    if (newMarked.has(code)) {
      newMarked.delete(code);
    } else {
      newMarked.add(code);
    }
    setMarkedForExclusion(newMarked);
  };

  const handleRemoveSelected = () => {
    const codesToExclude = Array.from(markedForExclusion);
    const newActiveCodes = activeCodes.filter(code => !markedForExclusion.has(code));
    const newExcludedCodes = [...excludedCodes, ...codesToExclude];
    
    setActiveCodes(newActiveCodes);
    setExcludedCodes(newExcludedCodes);
    setMarkedForExclusion(new Set());
    onCodesChange?.(newActiveCodes);
    
    // Store excluded codes in localStorage for cross-component sharing
    localStorage.setItem('fdaExcludedCodes', JSON.stringify(newExcludedCodes));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('fdaExcludedCodesChanged', { 
      detail: { excludedCodes: newExcludedCodes } 
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading FDA product code information...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (productCodeInfos.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">
              No known FDA product codes found for comparison
            </p>
            {unknownCodesCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {unknownCodesCount} unknown product codes were filtered out ({productCodes.join(', ')})
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRegulatoryCoverage = (deviceClass: string) => {
    switch (deviceClass) {
      case 'I': return { level: 'Low', color: 'text-green-600', description: 'General controls only' };
      case 'II': return { level: 'Moderate', color: 'text-amber-600', description: '510(k) clearance required' };
      case 'III': return { level: 'High', color: 'text-red-600', description: 'PMA approval required' };
      default: return { level: 'Unknown', color: 'text-gray-600', description: 'Classification unclear' };
    }
  };

  const getApprovalTimeline = (deviceClass: string) => {
    switch (deviceClass) {
      case 'I': return '0-3 months';
      case 'II': return '3-6 months';
      case 'III': return '12-18 months';
      default: return 'Variable';
    }
  };

  const getClinicalDataRequirement = (deviceClass: string) => {
    switch (deviceClass) {
      case 'I': return { requirement: 'Usually None', icon: CheckCircle, color: 'text-green-600' };
      case 'II': return { requirement: 'Limited/Predicate', icon: Clock, color: 'text-amber-600' };
      case 'III': return { requirement: 'Extensive Clinical', icon: AlertTriangle, color: 'text-red-600' };
      default: return { requirement: 'Unknown', icon: AlertTriangle, color: 'text-gray-600' };
    }
  };

  const inactiveCodes = productCodes.filter(code => !activeCodes.includes(code));

  return (
    <div className="space-y-6">
      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Product Code Analysis</span>
            <div className="flex items-center gap-2">
              <div className="flex gap-2 text-sm">
                <Badge variant="secondary">{activeCodes.length} Active</Badge>
                {inactiveCodes.length > 0 && (
                  <Badge variant="outline">{inactiveCodes.length} Excluded</Badge>
                )}
                {markedForExclusion.size > 0 && (
                  <Badge variant="destructive">{markedForExclusion.size} Marked for Removal</Badge>
                )}
              </div>
              {markedForExclusion.size > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleRemoveSelected}
                  className="ml-2"
                >
                  Remove Selected ({markedForExclusion.size})
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium">Active codes: </span>
              <span className="text-sm text-muted-foreground">{activeCodes.join(', ')}</span>
            </div>
            {inactiveCodes.length > 0 && (
              <div>
                <span className="text-sm font-medium">Excluded codes: </span>
                <span className="text-sm text-muted-foreground line-through">{inactiveCodes.join(', ')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              FDA Product Code Comparison
            </CardTitle>
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                Close Comparison
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {productCodeInfos.map((info) => (
                <Badge key={info.code} variant="secondary" className="text-sm">
                  {info.code} - {info.description}
                </Badge>
              ))}
            </div>
            {unknownCodesCount > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Filtered out {unknownCodesCount} unknown codes:
                </p>
                <div className="flex flex-wrap gap-1">
                  {productCodes
                    .filter(code => !productCodeInfos.some(info => info.code === code))
                    .map((code) => (
                      <Badge key={code} variant="outline" className="text-xs text-muted-foreground">
                        {code}
                      </Badge>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  These codes don't have detailed classification data available for meaningful comparison
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Comparison Factor</TableHead>
                  {productCodeInfos.map((info) => (
                    <TableHead key={info.code} className="text-center min-w-48">
                      <div className={`space-y-1 p-2 rounded ${markedForExclusion.has(info.code) ? 'bg-destructive/10 border border-destructive/20' : ''}`}>
                        <div className="flex items-center justify-center gap-1">
                          <Badge 
                            variant="outline" 
                            className={markedForExclusion.has(info.code) ? 'bg-destructive/20 text-destructive-foreground line-through' : ''}
                          >
                            {info.code}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-5 w-5 p-0 ${markedForExclusion.has(info.code) 
                              ? 'text-destructive hover:text-destructive/80' 
                              : 'text-muted-foreground hover:text-destructive'
                            }`}
                            onClick={() => handleToggleMarkForExclusion(info.code)}
                            title={markedForExclusion.has(info.code) ? "Unmark this code" : "Mark for exclusion"}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className={`text-xs text-muted-foreground font-normal ${markedForExclusion.has(info.code) ? 'line-through opacity-60' : ''}`}>
                          {info.medicalSpecialty}
                        </div>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Device Description</TableCell>
                  {productCodeInfos.map((info) => (
                    <TableCell key={info.code} className={`text-center ${markedForExclusion.has(info.code) ? 'opacity-50 line-through bg-destructive/5' : ''}`}>
                      <div className="text-sm">{info.description}</div>
                    </TableCell>
                  ))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Device Class</TableCell>
                  {productCodeInfos.map((info) => {
                    const regulatory = getRegulatoryCoverage(info.deviceClass);
                    const isMarked = markedForExclusion.has(info.code);
                    return (
                      <TableCell key={info.code} className={`text-center ${isMarked ? 'opacity-50 bg-destructive/5' : ''}`}>
                        <div className="space-y-1">
                          <Badge 
                            variant="secondary"
                            className={`${FDAProductCodeService.getDeviceClassColor(info.deviceClass)} ${isMarked ? 'line-through' : ''}`}
                          >
                            Class {info.deviceClass}
                          </Badge>
                          <div className={`text-xs ${regulatory.color} ${isMarked ? 'line-through' : ''}`}>
                            {regulatory.level} Risk
                          </div>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">Regulation Number</TableCell>
                  {productCodeInfos.map((info) => (
                    <TableCell key={info.code} className={`text-center ${markedForExclusion.has(info.code) ? 'opacity-50 line-through bg-destructive/5' : ''}`}>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {info.regulationNumber}
                      </code>
                    </TableCell>
                  ))}
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">Regulatory Pathway</TableCell>
                  {productCodeInfos.map((info) => {
                    const regulatory = getRegulatoryCoverage(info.deviceClass);
                    const isMarked = markedForExclusion.has(info.code);
                    return (
                      <TableCell key={info.code} className={`text-center ${isMarked ? 'opacity-50 bg-destructive/5' : ''}`}>
                        <div className="space-y-1">
                          <div className={`text-sm font-medium ${isMarked ? 'line-through' : ''}`}>{regulatory.description}</div>
                          <div className={`text-xs text-muted-foreground ${isMarked ? 'line-through' : ''}`}>
                            Typical timeline: {getApprovalTimeline(info.deviceClass)}
                          </div>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">Clinical Data Requirements</TableCell>
                  {productCodeInfos.map((info) => {
                    const clinical = getClinicalDataRequirement(info.deviceClass);
                    const IconComponent = clinical.icon;
                    const isMarked = markedForExclusion.has(info.code);
                    return (
                      <TableCell key={info.code} className={`text-center ${isMarked ? 'opacity-50 bg-destructive/5' : ''}`}>
                        <div className="flex flex-col items-center space-y-1">
                          <IconComponent className={`h-4 w-4 ${clinical.color} ${isMarked ? 'opacity-50' : ''}`} />
                          <div className={`text-sm ${isMarked ? 'line-through' : ''}`}>{clinical.requirement}</div>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">FDA Classification URL</TableCell>
                  {productCodeInfos.map((info) => (
                    <TableCell key={info.code} className={`text-center ${markedForExclusion.has(info.code) ? 'opacity-50 bg-destructive/5' : ''}`}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild 
                        className={markedForExclusion.has(info.code) ? 'opacity-50' : ''}
                      >
                        <a href={info.fdaUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Details
                        </a>
                      </Button>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Strategic Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Strategic Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Regulatory Complexity Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Regulatory Complexity Ranking</h4>
              <div className="space-y-2">
                {productCodeInfos
                  .sort((a, b) => (a.deviceClass || '').localeCompare(b.deviceClass || ''))
                  .map((info, index) => {
                    const regulatory = getRegulatoryCoverage(info.deviceClass);
                    return (
                      <div key={info.code} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{index + 1}.</span>
                          <Badge variant="outline">{info.code}</Badge>
                          <span className="text-sm">{info.description}</span>
                        </div>
                        <Badge variant="secondary" className={regulatory.color.replace('text-', 'bg-').replace('-600', '-100')}>
                          {regulatory.level}
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Market Entry Strategy</h4>
              <div className="space-y-2">
                {productCodeInfos.map((info) => {
                  const regulatory = getRegulatoryCoverage(info.deviceClass);
                  let strategy = '';
                  switch (info.deviceClass) {
                    case 'I':
                      strategy = 'Direct market entry with general controls';
                      break;
                    case 'II':
                      strategy = 'Identify strong predicates for 510(k) submission';
                      break;
                    case 'III':
                      strategy = 'Plan comprehensive clinical trials for PMA';
                      break;
                  }
                  
                  return (
                    <div key={info.code} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{info.code}</Badge>
                        <span className="text-sm font-medium">Class {info.deviceClass}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{strategy}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Key Differences Summary */}
          <div className="space-y-3">
            <h4 className="font-medium">Key Differences Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <h5 className="font-medium mb-2">Device Classes</h5>
                <div className="space-y-1">
                  {Array.from(new Set(productCodeInfos.map(info => info.deviceClass))).map(cls => (
                    <Badge key={cls} variant="secondary" className={FDAProductCodeService.getDeviceClassColor(cls)}>
                      Class {cls}: {productCodeInfos.filter(info => info.deviceClass === cls).length} device(s)
                    </Badge>
                  ))}
                </div>
                {unknownCodesCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    + {unknownCodesCount} unknown codes excluded
                  </p>
                )}
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <h5 className="font-medium mb-2">Medical Specialties</h5>
                <div className="space-y-1">
                  {Array.from(new Set(productCodeInfos.map(info => info.medicalSpecialty))).map(specialty => (
                    <div key={specialty} className="text-sm">
                      {specialty}: {productCodeInfos.filter(info => info.medicalSpecialty === specialty).length}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <h5 className="font-medium mb-2">Approval Timelines</h5>
                <div className="space-y-1">
                  {productCodeInfos.map(info => (
                    <div key={info.code} className="text-sm">
                      {info.code}: {getApprovalTimeline(info.deviceClass)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}