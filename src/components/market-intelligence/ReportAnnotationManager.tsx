import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Trash2, Edit, Users, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface DocumentAnnotation {
  id: string;
  annotation_id: string;
  annotation_type: string;
  content: string | null;
  page_number: number;
  position: any;
  style: any;
  metadata: any;
  created_at: string;
  user_id: string;
  user_profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}

interface ReportAnnotationManagerProps {
  reportId: string;
  companyId: string;
  webViewerInstance: any;
}

export function ReportAnnotationManager({ 
  reportId, 
  companyId, 
  webViewerInstance 
}: ReportAnnotationManagerProps) {
  const [annotations, setAnnotations] = useState<DocumentAnnotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterByUser, setFilterByUser] = useState<string | null>(null);
  const { user } = useAuth();

  // Load annotations from database
  useEffect(() => {
    loadAnnotations();
  }, [reportId]);

  const loadAnnotations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_annotations')
        .select(`
          *,
          user_profiles (
            first_name,
            last_name,
            email
          )
        `)
        .eq('report_id', reportId)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to load annotations');
        return;
      }

      setAnnotations((data || []) as unknown as DocumentAnnotation[]);
    } catch (error) {
      toast.error('Failed to load annotations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    try {
      const { error } = await supabase
        .from('document_annotations')
        .delete()
        .eq('annotation_id', annotationId)
        .eq('user_id', user?.id);

      if (error) {
        toast.error('Failed to delete annotation');
        return;
      }

      // Remove from local state
      setAnnotations(prev => prev.filter(ann => ann.annotation_id !== annotationId));
      
      // Remove from WebViewer if available
      if (webViewerInstance && webViewerInstance.Core) {
        const { annotationManager } = webViewerInstance.Core;
        const annotation = annotationManager.getAnnotationsList().find((ann: any) => ann.Id === annotationId);
        if (annotation) {
          annotationManager.deleteAnnotation(annotation);
        }
      }

      toast.success('Annotation deleted');
    } catch (error) {
      toast.error('Failed to delete annotation');
    }
  };

  const handleJumpToAnnotation = (annotation: DocumentAnnotation) => {
    if (webViewerInstance && webViewerInstance.Core) {
      const { documentViewer, annotationManager } = webViewerInstance.Core;
      
      // Jump to the page
      documentViewer.setCurrentPage(annotation.page_number);
      
      // Highlight the annotation if possible
      const viewerAnnotation = annotationManager.getAnnotationsList().find(
        (ann: any) => ann.Id === annotation.annotation_id
      );
      
      if (viewerAnnotation) {
        annotationManager.selectAnnotation(viewerAnnotation);
      }
    }
  };

  const getUserDisplayName = (annotation: DocumentAnnotation): string => {
    if (annotation.user_profiles) {
      const { first_name, last_name, email } = annotation.user_profiles;
      if (first_name || last_name) {
        return `${first_name || ''} ${last_name || ''}`.trim();
      }
      return email;
    }
    return 'Unknown User';
  };

  const getUserInitials = (annotation: DocumentAnnotation): string => {
    if (annotation.user_profiles) {
      const { first_name, last_name, email } = annotation.user_profiles;
      if (first_name || last_name) {
        return `${(first_name || '').charAt(0)}${(last_name || '').charAt(0)}`.toUpperCase();
      }
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getAnnotationTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      'highlight': 'Highlight',
      'note': 'Note',
      'stamp': 'Stamp',
      'drawing': 'Drawing',
      'text': 'Text',
      'y': 'Highlight',
      'e': 'Note'
    };
    return typeMap[type] || type;
  };

  const getAnnotationTypeColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      'highlight': 'bg-yellow-100 text-yellow-800',
      'note': 'bg-blue-100 text-blue-800',
      'stamp': 'bg-purple-100 text-purple-800',
      'drawing': 'bg-green-100 text-green-800',
      'text': 'bg-gray-100 text-gray-800',
      'y': 'bg-yellow-100 text-yellow-800',
      'e': 'bg-blue-100 text-blue-800'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  const uniqueUsers = Array.from(
    new Set(annotations.map(ann => ann.user_id))
  ).map(userId => {
    const annotation = annotations.find(ann => ann.user_id === userId);
    return annotation ? {
      id: userId,
      name: getUserDisplayName(annotation),
      initials: getUserInitials(annotation)
    } : null;
  }).filter(Boolean);

  const filteredAnnotations = filterByUser 
    ? annotations.filter(ann => ann.user_id === filterByUser)
    : annotations;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Annotations</h3>
          <Badge variant="outline" className="text-xs">
            {filteredAnnotations.length}
          </Badge>
        </div>
        
        {/* User Filter */}
        {uniqueUsers.length > 1 && (
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-3 h-3 text-muted-foreground" />
            <div className="flex gap-1 flex-wrap">
              <Button
                variant={filterByUser === null ? "default" : "outline"}
                size="sm"
                className="text-xs h-6"
                onClick={() => setFilterByUser(null)}
              >
                All
              </Button>
              {uniqueUsers.map((user) => user && (
                <Button
                  key={user.id}
                  variant={filterByUser === user.id ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-6"
                  onClick={() => setFilterByUser(user.id)}
                >
                  {user.initials}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading annotations...</p>
            </div>
          ) : filteredAnnotations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <h4 className="text-sm font-medium mb-2">No Annotations Yet</h4>
              <p className="text-xs text-muted-foreground">
                Start annotating the document to add highlights, notes, and comments.
              </p>
            </div>
          ) : (
            filteredAnnotations.map((annotation) => (
              <Card 
                key={annotation.id} 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleJumpToAnnotation(annotation)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {getUserInitials(annotation)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">
                        {getUserDisplayName(annotation)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getAnnotationTypeColor(annotation.annotation_type)}`}
                      >
                        {getAnnotationTypeLabel(annotation.annotation_type)}
                      </Badge>
                      {annotation.user_id === user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-6 h-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAnnotation(annotation.annotation_id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      Page {annotation.page_number}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(annotation.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>

                  {annotation.content && (
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {annotation.content}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}