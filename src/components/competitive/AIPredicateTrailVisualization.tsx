import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, GitBranch, Clock, Building } from 'lucide-react';

interface AIPredicateDevice {
  kNumber: string;
  deviceName: string;
  manufacturer: string;
  clearanceDate: string;
  predicateDevices?: AIPredicateDevice[];
  isTerminal?: boolean;
  notes?: string;
}

interface AIPredicateTrail {
  targetDevice: AIPredicateDevice;
  branches: AIPredicateDevice[][];
  summary: string;
  analysisDate: string;
}

interface AIPredicateTrailVisualizationProps {
  trail: AIPredicateTrail;
  kNumber: string;
}

export function AIPredicateTrailVisualization({ trail, kNumber }: AIPredicateTrailVisualizationProps) {
  // Function to convert K-numbers to FDA links
  const renderTextWithFDALinks = (text: string) => {
    const kNumberPattern = /(K\d{6})/g;
    const parts = text.split(kNumberPattern);
    
    return parts.map((part, index) => {
      if (part.match(kNumberPattern)) {
        return (
          <a
            key={index}
            href={`https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=${part}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline font-semibold"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <GitBranch className="w-5 h-5" />
          <span>AI Predicate Trail Analysis for {kNumber}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Target Device Info */}
        <div className="border border-primary bg-primary/5 rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-3">Target Device</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">K-Number:</span>
              <a
                href={`https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=${trail.targetDevice.kNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline font-semibold"
              >
                {trail.targetDevice.kNumber}
              </a>
            </div>
            <div><span className="font-medium">Device:</span> {trail.targetDevice.deviceName}</div>
            <div><span className="font-medium">Manufacturer:</span> {trail.targetDevice.manufacturer}</div>
            <div><span className="font-medium">Clearance Date:</span> {trail.targetDevice.clearanceDate}</div>
          </div>
        </div>

        {/* AI Analysis Results */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3">AI Analysis Results</h3>
          <div className="text-blue-800 text-sm whitespace-pre-line leading-relaxed">
            {renderTextWithFDALinks(trail.summary)}
          </div>
          <div className="text-xs text-blue-600 mt-3 pt-3 border-t border-blue-200">
            Analysis completed: {new Date(trail.analysisDate).toLocaleString()}
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">📋 How to Use</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Click any K-number link to view detailed FDA 510(k) information</li>
            <li>• Trail levels show the regulatory lineage from newest to oldest</li>
            <li>• Each predicate device establishes substantial equivalence</li>
            <li>• Links open FDA database pages in a new tab</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}