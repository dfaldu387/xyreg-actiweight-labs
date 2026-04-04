
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Clock, CheckCircle, AlertCircle, Upload } from "lucide-react";
import { LifecyclePhases } from "./LifecyclePhases";
import { EnhancedDocumentPhaseDisplay } from "../documents/EnhancedDocumentPhaseDisplay";
import { cleanPhaseName } from "@/utils/phaseNumbering";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  name: string;
  status: string;
  document_type: string;
  phase_id?: string;
  phase_name?: string;
  uploaded_at?: string;
  file_name?: string;
}

interface Phase {
  id: string;
  name: string;
  position: number;
  description?: string;
}

interface UnifiedDocumentPhaseViewProps {
  companyId: string;
  phases: Phase[];
  documents: Document[];
  currentPhase?: string;
  onPhaseChange?: (phaseName: string) => void;
  onDocumentClick?: (document: Document) => void;
  onUploadClick?: (phaseId: string) => void;
}

export function UnifiedDocumentPhaseView({
  companyId,
  phases,
  documents,
  currentPhase,
  onPhaseChange,
  onDocumentClick,
  onUploadClick
}: UnifiedDocumentPhaseViewProps) {
  const [activeTab, setActiveTab] = useState('phases');

  // Calculate document statistics per phase
  const phaseStats = phases.map(phase => {
    const phaseDocuments = documents.filter(doc => doc.phase_id === phase.id);
    const completedDocs = phaseDocuments.filter(doc => doc.status === 'Completed').length;
    const progress = phaseDocuments.length > 0 ? (completedDocs / phaseDocuments.length) * 100 : 0;
    
    return {
      ...phase,
      documentCount: phaseDocuments.length,
      completedCount: completedDocs,
      progress: Math.round(progress)
    };
  });

  const getPhaseStatus = (phaseName: string) => {
    if (phaseName === currentPhase) return 'current';
    const currentIndex = phases.findIndex(p => p.name === currentPhase);
    const phaseIndex = phases.findIndex(p => p.name === phaseName);
    if (currentIndex === -1) return 'pending';
    return phaseIndex < currentIndex ? 'completed' : 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'current': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 border-green-200';
      case 'current': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const totalDocuments = documents.length;
  const completedDocuments = documents.filter(doc => doc.status === 'Completed').length;
  const overallProgress = totalDocuments > 0 ? (completedDocuments / totalDocuments) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{phases.length}</div>
              <div className="text-sm text-muted-foreground">Total Phases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalDocuments}</div>
              <div className="text-sm text-muted-foreground">Total Documents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{completedDocuments}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{Math.round(overallProgress)}%</div>
              <div className="text-sm text-muted-foreground">Overall Progress</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="phases">
            Lifecycle Phases
            <Badge variant="outline" className="ml-2">{phases.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="documents">
            Documents by Phase
            <Badge variant="outline" className="ml-2">{totalDocuments}</Badge>
          </TabsTrigger>
          <TabsTrigger value="unified">
            Unified View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="phases">
          <LifecyclePhases 
            companyId={companyId}
            currentPhase={currentPhase}
            onPhaseChange={onPhaseChange}
          />
        </TabsContent>

        <TabsContent value="documents">
          <EnhancedDocumentPhaseDisplay
            documents={documents}
            phases={phases}
            companyName={companyId}
            onDocumentClick={onDocumentClick}
            onUploadClick={onUploadClick}
            showCompanyInfo={false}
          />
        </TabsContent>

        <TabsContent value="unified">
          <div className="space-y-4">
            {phaseStats.map((phase) => {
              const status = getPhaseStatus(phase.name);
              const displayName = cleanPhaseName(phase.name);
              const phaseDocuments = documents.filter(doc => doc.phase_id === phase.id);
              
              return (
                <Card key={phase.id} className={cn("transition-colors", getStatusColor(status))}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(status)}
                        <div>
                          <CardTitle className="text-lg">{displayName}</CardTitle>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {phase.completedCount}/{phase.documentCount} docs
                        </Badge>
                        {onUploadClick && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onUploadClick(phase.id)}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Upload
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {phase.description && (
                      <p className="text-sm text-muted-foreground mt-2">{phase.description}</p>
                    )}
                    
                    {phase.documentCount > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Document Progress</span>
                          <span>{phase.progress}%</span>
                        </div>
                        <Progress value={phase.progress} className="h-2" />
                      </div>
                    )}
                  </CardHeader>
                  
                  {phaseDocuments.length > 0 && (
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {phaseDocuments.slice(0, 3).map((doc) => (
                          <div 
                            key={doc.id}
                            className="flex items-center justify-between p-2 bg-white/50 rounded border cursor-pointer hover:bg-white/80 transition-colors"
                            onClick={() => onDocumentClick?.(doc)}
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{doc.name}</span>
                            </div>
                            <Badge 
                              variant={doc.status === 'Completed' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {doc.status}
                            </Badge>
                          </div>
                        ))}
                        {phaseDocuments.length > 3 && (
                          <div className="text-center">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setActiveTab('documents')}
                            >
                              View all {phaseDocuments.length} documents
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
