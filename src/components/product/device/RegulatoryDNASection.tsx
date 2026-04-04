import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  GitBranch,
  Clock,
  FileText,
  TrendingUp,
  AlertCircle,
  Building2,
  Globe,
  Search,
  BarChart3,
  Calendar,
  CheckCircle,
  Circle,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

// Field navigation mapping - maps field keys to their tab/subtab locations
const DNA_FIELD_NAVIGATION: Record<string, { tab: string; subtab: string }> = {
  // Classification fields - navigate to basics/classification
  'anatomicalLocation': { tab: 'basics', subtab: 'classification' },
  'invasiveness': { tab: 'basics', subtab: 'classification' },
  'activeNonActive': { tab: 'basics', subtab: 'classification' },
  'implantableStatus': { tab: 'basics', subtab: 'classification' },
  
  // Technical fields - navigate to basics/technical
  'energyDelivery': { tab: 'basics', subtab: 'technical' },
  'softwareType': { tab: 'basics', subtab: 'technical' },
  'sterilityRequirements': { tab: 'basics', subtab: 'technical' },
  'measuringFunction': { tab: 'basics', subtab: 'technical' },
  'reusableSingleUse': { tab: 'basics', subtab: 'technical' },
  
  // Context of use fields - navigate to purpose/context
  'durationOfUse': { tab: 'purpose', subtab: 'context' },
  'intendedUser': { tab: 'purpose', subtab: 'context' }
};

interface RegulatoryDNASectionProps {
  productId?: string;
  emdnCode?: string;
  currentFdaCode?: string;
  isLoading?: boolean;
  // Product data for dynamic field status computation
  keyTechnologyCharacteristics?: any;
  coreDeviceNature?: string;
  primaryRegulatoryType?: string;
  intendedPurposeData?: {
    intended_users?: string;
    duration_of_use?: string;
  };
}

// Helper to check if a value is meaningfully specified
const isSpecified = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    return trimmed !== '' && trimmed !== 'not_defined' && trimmed !== 'none' && trimmed !== 'not specified';
  }
  if (typeof value === 'boolean') return true;
  return !!value;
};

// Helper to get display description for a field value
const getFieldDescription = (fieldKey: string, value: any, lang: (key: string) => string): string => {
  if (!isSpecified(value)) return lang('regulatory.dna.notSpecified');
  
  // Map field values to human-readable descriptions
  const valueMap: Record<string, Record<string, string>> = {
    anatomicalLocation: {
      'skin_surface': 'Skin surface only',
      'body_orifice': 'Body orifice',
      'surgically_created_orifice': 'Surgically created orifice',
      'blood_contact': 'Blood contact',
      'tissue_bone': 'Tissue/bone contact',
      'central_nervous': 'Central nervous system',
      'heart_central_circulation': 'Heart/central circulation'
    },
    energyDelivery: {
      'none': lang('regulatory.dna.noEnergyDelivery'),
      'electrical': 'Electrical energy',
      'thermal': 'Thermal energy',
      'mechanical': 'Mechanical energy',
      'radiation': 'Radiation',
      'ultrasound': 'Ultrasound'
    },
    softwareType: {
      'samd': 'SaMD (Software as Medical Device)',
      'simd': 'SiMD (Software in Medical Device)',
      'none': 'No software'
    }
  };

  if (valueMap[fieldKey]?.[value]) {
    return valueMap[fieldKey][value];
  }
  
  // For boolean fields
  if (typeof value === 'boolean') {
    if (fieldKey === 'activeNonActive') return value ? 'Active' : 'Non-Active';
    if (fieldKey === 'measuringFunction') return value ? 'Has measuring function' : lang('regulatory.dna.noMeasuringFunction');
    if (fieldKey === 'sterilityRequirements') return value ? 'Sterile' : lang('regulatory.dna.nonSterile');
    if (fieldKey === 'implantableStatus') return value ? 'Implantable' : lang('regulatory.dna.nonImplantable');
  }
  
  // Capitalize first letter for display
  if (typeof value === 'string') {
    return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  
  return String(value);
};

export function RegulatoryDNASection({
  productId,
  emdnCode,
  currentFdaCode,
  isLoading,
  keyTechnologyCharacteristics,
  coreDeviceNature,
  primaryRegulatoryType,
  intendedPurposeData
}: RegulatoryDNASectionProps) {
  const { lang } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle navigation to a specific field's location
  const handleNavigateToField = (fieldKey: string) => {
    const navConfig = DNA_FIELD_NAVIGATION[fieldKey];
    if (!navConfig) return;

    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', navConfig.tab);
    newParams.set('subtab', navConfig.subtab);
    newParams.set('returnTo', 'regulatory-dna');
    setSearchParams(newParams);
  };

  // Compute field values from actual product data
  const ktc = keyTechnologyCharacteristics || {};
  
  const fieldValues = {
    anatomicalLocation: ktc.anatomicalLocation,
    energyDelivery: ktc.energyDelivery,
    durationOfUse: intendedPurposeData?.duration_of_use,
    invasiveness: coreDeviceNature,
    activeNonActive: ktc.isActiveDevice,
    softwareType: ktc.softwareType || (ktc.isSoftwareMobileApp ? 'samd' : undefined),
    sterilityRequirements: ktc.sterile !== undefined ? ktc.sterile : ktc.sterilityRequirements,
    intendedUser: intendedPurposeData?.intended_users,
    measuringFunction: ktc.hasMeasuringFunction,
    reusableSingleUse: ktc.reusable !== undefined ? (ktc.reusable ? 'reusable' : 'single_use') : ktc.singleUseReusable,
    implantableStatus: coreDeviceNature === 'Implantable' ? true : (ktc.isImplantable ?? false)
  };

  // Build critical fields dynamically based on actual data
  const criticalFields = [
    { 
      name: lang('regulatory.dna.fields.anatomicalLocation'), 
      fieldKey: 'anatomicalLocation', 
      status: isSpecified(fieldValues.anatomicalLocation) ? "specified" : "missing", 
      description: getFieldDescription('anatomicalLocation', fieldValues.anatomicalLocation, lang) 
    },
    { 
      name: lang('regulatory.dna.fields.energyDelivery'), 
      fieldKey: 'energyDelivery', 
      status: isSpecified(fieldValues.energyDelivery) ? "specified" : "missing", 
      description: getFieldDescription('energyDelivery', fieldValues.energyDelivery, lang) 
    },
    { 
      name: lang('regulatory.dna.fields.durationOfUse'), 
      fieldKey: 'durationOfUse', 
      status: isSpecified(fieldValues.durationOfUse) ? "specified" : "missing", 
      description: getFieldDescription('durationOfUse', fieldValues.durationOfUse, lang) 
    },
    { 
      name: lang('regulatory.dna.fields.invasiveness'), 
      fieldKey: 'invasiveness', 
      status: isSpecified(fieldValues.invasiveness) ? "specified" : "missing", 
      description: getFieldDescription('invasiveness', fieldValues.invasiveness, lang) 
    },
    { 
      name: lang('regulatory.dna.fields.activeNonActive'), 
      fieldKey: 'activeNonActive', 
      status: fieldValues.activeNonActive !== undefined ? "specified" : "missing", 
      description: getFieldDescription('activeNonActive', fieldValues.activeNonActive, lang) 
    },
    { 
      name: lang('regulatory.dna.fields.softwareType'), 
      fieldKey: 'softwareType', 
      status: isSpecified(fieldValues.softwareType) ? "specified" : "missing", 
      description: getFieldDescription('softwareType', fieldValues.softwareType, lang) 
    },
    { 
      name: lang('regulatory.dna.fields.sterilityRequirements'), 
      fieldKey: 'sterilityRequirements', 
      status: fieldValues.sterilityRequirements !== undefined ? "specified" : "missing", 
      description: getFieldDescription('sterilityRequirements', fieldValues.sterilityRequirements, lang) 
    },
    { 
      name: lang('regulatory.dna.fields.intendedUser'), 
      fieldKey: 'intendedUser', 
      status: isSpecified(fieldValues.intendedUser) ? "specified" : "missing", 
      description: getFieldDescription('intendedUser', fieldValues.intendedUser, lang) 
    },
    { 
      name: lang('regulatory.dna.fields.measuringFunction'), 
      fieldKey: 'measuringFunction', 
      status: fieldValues.measuringFunction !== undefined ? "specified" : "missing", 
      description: getFieldDescription('measuringFunction', fieldValues.measuringFunction, lang) 
    },
    { 
      name: lang('regulatory.dna.fields.reusableSingleUse'), 
      fieldKey: 'reusableSingleUse', 
      status: isSpecified(fieldValues.reusableSingleUse) ? "specified" : "missing", 
      description: getFieldDescription('reusableSingleUse', fieldValues.reusableSingleUse, lang) 
    },
    { 
      name: lang('regulatory.dna.fields.implantableStatus'), 
      fieldKey: 'implantableStatus', 
      // Implantable is derived from coreDeviceNature, so it's specified if coreDeviceNature is specified
      status: isSpecified(coreDeviceNature) ? "specified" : "missing", 
      description: getFieldDescription('implantableStatus', fieldValues.implantableStatus, lang) 
    }
  ];

  const specifiedCount = criticalFields.filter(field => field.status === "specified").length;
  const totalCount = criticalFields.length;
  const overallProgress = Math.round((specifiedCount / totalCount) * 100);

  const analysisCards = [
    {
      icon: GitBranch,
      title: lang('regulatory.dna.cards.pathwayAnalysis.title'),
      description: lang('regulatory.dna.cards.pathwayAnalysis.description'),
      status: "coming-soon"
    },
    {
      icon: Clock,
      title: lang('regulatory.dna.cards.timelineAnalysis.title'),
      description: lang('regulatory.dna.cards.timelineAnalysis.description'),
      status: "coming-soon"
    },
    {
      icon: FileText,
      title: lang('regulatory.dna.cards.precedentResearch.title'),
      description: lang('regulatory.dna.cards.precedentResearch.description'),
      status: "coming-soon"
    },
    {
      icon: TrendingUp,
      title: lang('regulatory.dna.cards.regulatoryIntelligence.title'),
      description: lang('regulatory.dna.cards.regulatoryIntelligence.description'),
      status: "coming-soon"
    },
    {
      icon: Building2,
      title: lang('regulatory.dna.cards.notifiedBodyMatching.title'),
      description: lang('regulatory.dna.cards.notifiedBodyMatching.description'),
      status: "coming-soon"
    },
    {
      icon: BarChart3,
      title: lang('regulatory.dna.cards.complianceGapAnalysis.title'),
      description: lang('regulatory.dna.cards.complianceGapAnalysis.description'),
      status: "coming-soon"
    }
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            {lang('regulatory.dna.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            {lang('regulatory.dna.loading')}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "specified":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "missing":
        return <Circle className="h-4 w-4 text-yellow-600" />;
      default:
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "specified":
        return "text-green-600";
      case "missing":
        return "text-yellow-600";
      default:
        return "text-red-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{lang('regulatory.dna.title')}</h2>
        </div>
        <div className="text-right">
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            {lang('regulatory.dna.lowConfidence')}
          </Badge>
          <div className="text-2xl font-bold mt-1">{overallProgress}%</div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{lang('regulatory.dna.overallProgress')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={overallProgress} className="h-2" />
              <p className="text-sm text-muted-foreground">{lang('regulatory.dna.percentComplete').replace('{percent}', String(overallProgress))}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{lang('regulatory.dna.criticalFields')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{specifiedCount}/{totalCount}</div>
            <p className="text-sm text-muted-foreground">{lang('regulatory.dna.fieldsSpecified')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Fields List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{lang('regulatory.dna.criticalFieldStatus')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {criticalFields.map((field, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                <div className="flex items-center gap-3">
                  {getStatusIcon(field.status)}
                  <div className="flex items-center">
                    {field.status === "missing" ? (
                      <button
                        onClick={() => handleNavigateToField(field.fieldKey)}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline cursor-pointer bg-transparent border-none p-0"
                      >
                        {field.name}
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    ) : (
                      <span className="text-sm font-medium">{field.name}</span>
                    )}
                    <span className="text-sm text-muted-foreground ml-2">-</span>
                    <span className={`text-sm ml-1 ${getStatusColor(field.status)}`}>
                      {field.status === "specified" ? lang('regulatory.dna.specified') : lang('regulatory.dna.missing')}
                    </span>
                    {field.status === "missing" && (
                      <span className="text-red-600 ml-2">*</span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {field.description}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Device Context */}
      {(emdnCode || currentFdaCode) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{lang('regulatory.dna.currentDeviceContext')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {emdnCode && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{lang('regulatory.dna.emdnCode')}</span>
                <Badge variant="outline">{emdnCode}</Badge>
              </div>
            )}
            {currentFdaCode && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{lang('regulatory.dna.fdaProductCode')}</span>
                <Badge variant="outline">{currentFdaCode}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analysis Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analysisCards.map((card, index) => (
          <Card key={index} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <card.icon className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">{card.title}</CardTitle>
                <Badge variant="secondary" className="text-xs ml-auto">
                  {lang('regulatory.dna.comingSoon')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {card.description}
              </p>
              <Button variant="outline" size="sm" disabled className="w-full">
                <Search className="h-4 w-4 mr-2" />
                {lang('regulatory.dna.analyze')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Roadmap Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-5 w-5" />
            {lang('regulatory.dna.developmentRoadmap')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{lang('regulatory.dna.roadmap.q1Title')}</p>
                  <p className="text-xs text-muted-foreground">{lang('regulatory.dna.roadmap.q1Description')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{lang('regulatory.dna.roadmap.q2Title')}</p>
                  <p className="text-xs text-muted-foreground">{lang('regulatory.dna.roadmap.q2Description')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{lang('regulatory.dna.roadmap.q3Title')}</p>
                  <p className="text-xs text-muted-foreground">{lang('regulatory.dna.roadmap.q3Description')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{lang('regulatory.dna.roadmap.q4Title')}</p>
                  <p className="text-xs text-muted-foreground">{lang('regulatory.dna.roadmap.q4Description')}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Early Access Information */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <h4 className="font-medium">{lang('regulatory.dna.earlyAccessTitle')}</h4>
            <p className="text-sm text-muted-foreground">
              {lang('regulatory.dna.earlyAccessDescription')}
            </p>
            <Button variant="outline" size="sm" disabled>
              {lang('regulatory.dna.joinWaitlist')}
              <TrendingUp className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}