
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Bug } from "lucide-react";

interface DocumentDebugPanelProps {
  productId: string;
  companyId: string;
  currentLifecyclePhase?: string | null;
  currentPhaseInstances: any[];
  productSpecificDocuments: any[];
  phases: any[];
}

export function DocumentDebugPanel({
  productId,
  companyId,
  currentLifecyclePhase,
  currentPhaseInstances,
  productSpecificDocuments,
  phases
}: DocumentDebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isExpanded) {
    return (
      <Card className="border-dashed border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="w-full"
          >
            <Bug className="h-4 w-4 mr-2" />
            Show Debug Information
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Document Debug Information
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Product Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Product ID:</strong> {productId}
          </div>
          <div>
            <strong>Company ID:</strong> {companyId}
          </div>
          <div>
            <strong>Current Phase:</strong> 
            <Badge variant="outline" className="ml-2">
              {currentLifecyclePhase || 'Not Set'}
            </Badge>
          </div>
        </div>

        {/* Document Counts */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center p-2 bg-blue-100 rounded">
            <div className="font-medium">Template Instances</div>
            <div className="text-lg font-bold text-blue-700">
              {currentPhaseInstances.length}
            </div>
          </div>
          <div className="text-center p-2 bg-purple-100 rounded">
            <div className="font-medium">Product-Specific</div>
            <div className="text-lg font-bold text-purple-700">
              {productSpecificDocuments.length}
            </div>
          </div>
          <div className="text-center p-2 bg-green-100 rounded">
            <div className="font-medium">Available Phases</div>
            <div className="text-lg font-bold text-green-700">
              {phases.length}
            </div>
          </div>
        </div>

        {/* Current Phase Instances Details */}
        {currentPhaseInstances.length > 0 && (
          <div>
            <strong className="text-sm">Current Phase Instances ({currentPhaseInstances.length}):</strong>
            <div className="mt-2 space-y-1">
              {currentPhaseInstances.map((doc, index) => (
                <div key={doc.id || index} className="text-xs p-2 bg-blue-50 rounded border">
                  <div><strong>Name:</strong> {doc.name}</div>
                  <div><strong>Status:</strong> {doc.status}</div>
                  <div><strong>Phase ID:</strong> {doc.phase_id}</div>
                  <div><strong>Template Source:</strong> {doc.template_source_id ? 'Yes' : 'No'}</div>
                  <div><strong>Document Scope:</strong> {doc.document_scope}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Phases */}
        {phases.length > 0 && (
          <div>
            <strong className="text-sm">Available Phases ({phases.length}):</strong>
            <div className="mt-2 space-y-1">
              {phases.map((phase, index) => (
                <div key={phase.id || index} className="text-xs p-2 bg-green-50 rounded border">
                  <div><strong>Name:</strong> {phase.name}</div>
                  <div><strong>ID:</strong> {phase.id}</div>
                  <div><strong>Is Current:</strong> {phase.isCurrentPhase ? 'Yes' : 'No'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product-Specific Documents */}
        {productSpecificDocuments.length > 0 && (
          <div>
            <strong className="text-sm">Product-Specific Documents ({productSpecificDocuments.length}):</strong>
            <div className="mt-2 space-y-1">
              {productSpecificDocuments.map((doc, index) => (
                <div key={doc.id || index} className="text-xs p-2 bg-purple-50 rounded border">
                  <div><strong>Name:</strong> {doc.name}</div>
                  <div><strong>Status:</strong> {doc.status}</div>
                  <div><strong>Phase ID:</strong> {doc.phase_id || 'Unassigned'}</div>
                  <div><strong>Template Source:</strong> {doc.template_source_id ? 'Yes' : 'No'}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
