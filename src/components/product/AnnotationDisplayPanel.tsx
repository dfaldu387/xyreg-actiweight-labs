import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Highlighter, 
  StickyNote, 
  Type, 
  Square, 
  Circle, 
  Minus, 
  ArrowRight, 
  Hexagon, 
  Stamp, 
  PenTool,
  Eye,
  EyeOff,
  Filter,
  Database,
  FileText,
  User
} from 'lucide-react';
import { AnnotationService, ANNOTATION_TYPES, AnnotationData } from '@/services/annotationService';

interface AnnotationDisplayPanelProps {
  documentId: string;
  onAnnotationFilterChange?: (filteredTypes: string[]) => void;
  onAnnotationVisibilityChange?: (visibleTypes: string[]) => void;
}

interface AnnotationStats {
  [key: string]: number;
}

const annotationTypeIcons: Record<string, React.ReactNode> = {
  [ANNOTATION_TYPES.TEXT_HIGHLIGHT]: <Highlighter className="h-4 w-4" />,
  [ANNOTATION_TYPES.STICKY]: <StickyNote className="h-4 w-4" />,
  [ANNOTATION_TYPES.FREE_TEXT]: <Type className="h-4 w-4" />,
  [ANNOTATION_TYPES.RECTANGLE]: <Square className="h-4 w-4" />,
  [ANNOTATION_TYPES.CIRCLE]: <Circle className="h-4 w-4" />,
  [ANNOTATION_TYPES.LINE]: <Minus className="h-4 w-4" />,
  [ANNOTATION_TYPES.ARROW]: <ArrowRight className="h-4 w-4" />,
  [ANNOTATION_TYPES.POLYGON]: <Hexagon className="h-4 w-4" />,
  [ANNOTATION_TYPES.STAMP]: <Stamp className="h-4 w-4" />,
  [ANNOTATION_TYPES.SIGNATURE]: <PenTool className="h-4 w-4" />
};

export function AnnotationDisplayPanel({ 
  documentId, 
  onAnnotationFilterChange,
  onAnnotationVisibilityChange 
}: AnnotationDisplayPanelProps) {
  const [stats, setStats] = useState<AnnotationStats>({});
  const [annotations, setAnnotations] = useState<AnnotationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [visibleTypes, setVisibleTypes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('database');

  useEffect(() => {
    loadAnnotationData();
  }, [documentId]);

  const loadAnnotationData = async () => {
    if (!documentId) return;
    
    setLoading(true);
    try {
      // Load all annotations from database
      const allAnnotations = await AnnotationService.loadAnnotations(documentId);
      setAnnotations(allAnnotations);

      // Load statistics
      const annotationStats = await AnnotationService.getAnnotationStats(documentId);
      setStats(annotationStats);

      // Initialize visible types with all types that have annotations
      const typesWithAnnotations = Object.keys(annotationStats);
      setVisibleTypes(typesWithAnnotations);
      setSelectedTypes(typesWithAnnotations);
    } catch (error) {
      // Error loading annotation data
    } finally {
      setLoading(false);
    }
  };

  const handleTypeToggle = (type: string) => {
    const newSelectedTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    
    setSelectedTypes(newSelectedTypes);
    onAnnotationFilterChange?.(newSelectedTypes);
  };

  const handleVisibilityToggle = (type: string) => {
    const newVisibleTypes = visibleTypes.includes(type)
      ? visibleTypes.filter(t => t !== type)
      : [...visibleTypes, type];
    
    setVisibleTypes(newVisibleTypes);
    onAnnotationVisibilityChange?.(newVisibleTypes);
  };

  const getAnnotationsByType = (type: string) => {
    return annotations.filter(ann => ann.annotation_type === type);
  };

  const totalAnnotations = Object.values(stats).reduce((sum, count) => sum + count, 0);

  const refreshData = () => {
    loadAnnotationData();
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Annotations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-muted-foreground">Loading annotations from database...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Annotations
          <Badge variant="secondary">{totalAnnotations}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="types">Types</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="filter">Filter</TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">All Annotations from Database</h4>
              <Button variant="outline" size="sm" onClick={refreshData}>
                Refresh
              </Button>
            </div>
            
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {annotations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No annotations found in database</p>
                  </div>
                ) : (
                  annotations.map((annotation, index) => (
                    <div key={annotation.annotation_id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {annotationTypeIcons[annotation.annotation_type] || <Square className="h-4 w-4" />}
                          <Badge variant="outline" className="text-xs">
                            {annotation.annotation_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Page {annotation.page_number}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant={visibleTypes.includes(annotation.annotation_type) ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleVisibilityToggle(annotation.annotation_type)}
                          >
                            {visibleTypes.includes(annotation.annotation_type) ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                      
                      {annotation.content && (
                        <div className="text-sm">
                          <FileText className="h-3 w-3 inline mr-1" />
                          {annotation.content}
                        </div>
                      )}
                      
                      {annotation.metadata?.author && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {annotation.metadata.author}
                        </div>
                      )}
                      
                      {annotation.metadata?.subject && (
                        <div className="text-xs text-muted-foreground">
                          Subject: {annotation.metadata.subject}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="types" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{totalAnnotations}</div>
                <div className="text-sm text-muted-foreground">Total Annotations</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{Object.keys(stats).length}</div>
                <div className="text-sm text-muted-foreground">Annotation Types</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Annotation Types Found</h4>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(stats).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      {annotationTypeIcons[type] || <Square className="h-4 w-4" />}
                      <span className="text-sm">
                        {AnnotationService.getAnnotationTypeDisplayName(type)}
                      </span>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <ScrollArea className="h-64">
              <div className="space-y-4">
                {Object.entries(stats).map(([type, count]) => (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {annotationTypeIcons[type] || <Square className="h-4 w-4" />}
                        <span className="font-medium">
                          {AnnotationService.getAnnotationTypeDisplayName(type)}
                        </span>
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                    
                    <div className="space-y-1">
                      {getAnnotationsByType(type).slice(0, 3).map((annotation, index) => (
                        <div key={annotation.annotation_id} className="text-sm text-muted-foreground pl-6">
                          {index + 1}. {annotation.content || 'No content'} 
                          <span className="ml-2 text-xs">(Page {annotation.page_number})</span>
                          {annotation.metadata?.author && (
                            <span className="ml-2 text-xs">by {annotation.metadata.author}</span>
                          )}
                        </div>
                      ))}
                      {getAnnotationsByType(type).length > 3 && (
                        <div className="text-sm text-muted-foreground pl-6">
                          ... and {getAnnotationsByType(type).length - 3} more
                        </div>
                      )}
                    </div>
                    
                    {Object.entries(stats).indexOf([type, count]) < Object.entries(stats).length - 1 && (
                      <Separator />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="filter" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Filter & Visibility Controls</h4>
                <div className="grid grid-cols-1 gap-2">
                  {AnnotationService.getSupportedAnnotationTypes().map((type) => {
                    const count = stats[type] || 0;
                    const isSelected = selectedTypes.includes(type);
                    const isVisible = visibleTypes.includes(type);
                    
                    return (
                      <div key={type} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {annotationTypeIcons[type] || <Square className="h-4 w-4" />}
                          <span className="text-sm">
                            {AnnotationService.getAnnotationTypeDisplayName(type)}
                          </span>
                          {count > 0 && <Badge variant="outline">{count}</Badge>}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant={isVisible ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleVisibilityToggle(type)}
                            disabled={count === 0}
                            title={count === 0 ? "No annotations of this type" : "Toggle visibility"}
                          >
                            {isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleTypeToggle(type)}
                            disabled={count === 0}
                            title={count === 0 ? "No annotations of this type" : "Toggle filter"}
                          >
                            <Filter className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allTypes = AnnotationService.getSupportedAnnotationTypes();
                    setSelectedTypes(allTypes);
                    setVisibleTypes(allTypes);
                    onAnnotationFilterChange?.(allTypes);
                    onAnnotationVisibilityChange?.(allTypes);
                  }}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTypes([]);
                    setVisibleTypes([]);
                    onAnnotationFilterChange?.([]);
                    onAnnotationVisibilityChange?.([]);
                  }}
                >
                  Clear All
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 