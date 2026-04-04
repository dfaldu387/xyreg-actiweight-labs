
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Link, PlusCircle, X, FileText, Shield, CheckCircle, Trash2, ChevronDown } from 'lucide-react';
import { updateGapItemEvidence } from '@/services/gapAnalysisService';
import { toast } from 'sonner';
import { getPredefinedQuestions, extractClauseId, getSmartSuggestions, type PredefinedQuestion } from '@/utils/gapAnalysisQuestions';

type EvidenceItem = {
  url: string;
  name: string;
  type: 'Documentation' | 'Verification' | 'Compliance';
  description?: string;
};

interface GapAnalysisEvidenceManagerProps {
  itemId: string;
  initialLinks: (string | EvidenceItem)[];
  requirement?: string;
}

export function GapAnalysisEvidenceManager({ 
  itemId, 
  initialLinks, 
  requirement 
}: GapAnalysisEvidenceManagerProps) {
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceName, setEvidenceName] = useState("");
  const [evidenceType, setEvidenceType] = useState<'Documentation' | 'Verification' | 'Compliance'>('Documentation');
  const [evidenceDescription, setEvidenceDescription] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [quickAddForms, setQuickAddForms] = useState<{[key: string]: {url: string, description: string}}>({});
  
  // Extract GSPR clause from requirement
  const clauseId = requirement ? extractClauseId(requirement) : null;
  const predefinedQuestions = clauseId ? getPredefinedQuestions(clauseId) : [];
  
  // Normalize evidence links to handle both old string[] and new EvidenceItem[]
  const normalizeEvidence = (links: (string | EvidenceItem)[]): EvidenceItem[] => {
    return (links || []).map(link => {
      if (typeof link === 'string') {
        // Convert old format to new format
        try {
          const hostname = new URL(link).hostname.replace('www.', '');
          return {
            url: link,
            name: hostname,
            type: 'Documentation' as const,
            description: 'Migrated from old format'
          };
        } catch {
          return {
            url: link,
            name: 'Invalid URL',
            type: 'Documentation' as const
          };
        }
      }
      return link;
    });
  };
  
  const [evidenceLinks, setEvidenceLinks] = useState<EvidenceItem[]>(
    normalizeEvidence(initialLinks || [])
  );

  // Generate smart suggestions based on requirement and evidence type
  const getEvidenceSuggestions = () => {
    return getSmartSuggestions(evidenceType, clauseId || undefined);
  };

  const handleAddEvidence = async () => {
    if (!evidenceUrl || !evidenceName.trim()) {
      toast.error("Please enter both URL and name for the evidence");
      return;
    }

    try {
      new URL(evidenceUrl);
      
      const newEvidence: EvidenceItem = {
        url: evidenceUrl,
        name: evidenceName.trim(),
        type: evidenceType,
        description: evidenceDescription.trim() || undefined
      };
      
      const updatedLinks = [...evidenceLinks, newEvidence];
      setEvidenceLinks(updatedLinks);
      
      const success = await updateGapItemEvidence(itemId, updatedLinks);
      
      if (success) {
        setEvidenceUrl("");
        setEvidenceName("");
        setEvidenceDescription("");
        toast.success(`Added ${evidenceType.toLowerCase()} evidence: ${evidenceName}`);
      } else {
        setEvidenceLinks(evidenceLinks);
        toast.error("Failed to save evidence");
      }
    } catch {
      toast.error("Please enter a valid URL");
    }
  };

  const handleRemoveEvidence = async (evidenceToRemove: EvidenceItem) => {
    const updatedLinks = evidenceLinks.filter(evidence => 
      evidence.url !== evidenceToRemove.url || evidence.name !== evidenceToRemove.name
    );
    setEvidenceLinks(updatedLinks);
    
    const success = await updateGapItemEvidence(itemId, updatedLinks);
    
    if (success) {
      toast.success(`Removed evidence: ${evidenceToRemove.name}`);
    } else {
      setEvidenceLinks(evidenceLinks);
      toast.error("Failed to remove evidence");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Documentation':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'Verification':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Compliance':
        return <Shield className="h-4 w-4 text-purple-600" />;
      default:
        return <Link className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'Documentation':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Verification':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Compliance':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Group predefined questions by category
  const groupedQuestions = {
    Documentation: predefinedQuestions.filter(q => q.category === 'documentation'),
    Verification: predefinedQuestions.filter(q => q.category === 'verification'),
    Compliance: predefinedQuestions.filter(q => q.category === 'compliance')
  };

  // Check if evidence exists for a predefined question
  const hasEvidenceForQuestion = (questionId: string): boolean => {
    return evidenceLinks.some(link => 
      link.description?.includes(questionId) || 
      link.name.toLowerCase().includes(questionId.toLowerCase())
    );
  };

  const handleQuickAddEvidence = async (question: PredefinedQuestion) => {
    const quickForm = quickAddForms[question.id];
    if (!quickForm?.url) {
      toast.error("Please enter a URL for the evidence");
      return;
    }

    try {
      new URL(quickForm.url);
      
      const newEvidence: EvidenceItem = {
        url: quickForm.url,
        name: question.requirement,
        type: question.category.charAt(0).toUpperCase() + question.category.slice(1) as 'Documentation' | 'Verification' | 'Compliance',
        description: quickForm.description || `Evidence for ${question.clause}: ${question.requirement}`
      };
      
      const updatedLinks = [...evidenceLinks, newEvidence];
      setEvidenceLinks(updatedLinks);
      
      const success = await updateGapItemEvidence(itemId, updatedLinks);
      
      if (success) {
        // Clear the quick form
        setQuickAddForms(prev => ({
          ...prev,
          [question.id]: { url: '', description: '' }
        }));
        toast.success(`Added evidence for ${question.clause}`);
      } else {
        setEvidenceLinks(evidenceLinks);
        toast.error("Failed to save evidence");
      }
    } catch {
      toast.error("Please enter a valid URL");
    }
  };

  const updateQuickForm = (questionId: string, field: 'url' | 'description', value: string) => {
    setQuickAddForms(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Evidence & Links</Label>
      
      {/* Predefined GSPR Questions */}
      {predefinedQuestions.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Required Evidence for {clauseId}</Label>
                <Badge variant="outline">{predefinedQuestions.length} requirements</Badge>
              </div>
              
              {(['Documentation', 'Verification', 'Compliance'] as const).map(category => {
                const questions = groupedQuestions[category];
                if (questions.length === 0) return null;
                
                return (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(category)}
                      <Label className="text-sm font-medium">{category}</Label>
                      <Badge variant="secondary">{questions.length}</Badge>
                    </div>
                    
                    <div className="space-y-3 pl-6">
                      {questions.map(question => {
                        const hasEvidence = hasEvidenceForQuestion(question.id);
                        const quickForm = quickAddForms[question.id] || { url: '', description: '' };
                        
                        return (
                          <Collapsible key={question.id}>
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-3 p-3 rounded-lg border">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">{question.requirement}</p>
                                  {question.description && (
                                    <p className="text-xs text-muted-foreground mt-1">{question.description}</p>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2 shrink-0">
                                  {hasEvidence ? (
                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                      Added
                                    </Badge>
                                  ) : (
                                    <CollapsibleTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        <PlusCircle className="h-4 w-4 mr-1" />
                                        Add Evidence
                                      </Button>
                                    </CollapsibleTrigger>
                                  )}
                                </div>
                              </div>
                              
                              {!hasEvidence && (
                                <CollapsibleContent className="pl-3">
                                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                                    <div className="space-y-1">
                                      <Label htmlFor={`quick-url-${question.id}`} className="text-xs">Evidence URL</Label>
                                      <Input
                                        id={`quick-url-${question.id}`}
                                        placeholder="https://example.com/evidence.pdf"
                                        value={quickForm.url}
                                        onChange={(e) => updateQuickForm(question.id, 'url', e.target.value)}
                                        className="text-sm"
                                      />
                                    </div>
                                    
                                    <div className="space-y-1">
                                      <Label htmlFor={`quick-desc-${question.id}`} className="text-xs">Description (Optional)</Label>
                                      <Input
                                        id={`quick-desc-${question.id}`}
                                        placeholder="Additional context about this evidence"
                                        value={quickForm.description}
                                        onChange={(e) => updateQuickForm(question.id, 'description', e.target.value)}
                                        className="text-sm"
                                      />
                                    </div>
                                    
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleQuickAddEvidence(question)}
                                      disabled={!quickForm.url.trim()}
                                      className="w-full"
                                    >
                                      Add Evidence
                                    </Button>
                                  </div>
                                </CollapsibleContent>
                              )}
                            </div>
                          </Collapsible>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Need to add custom evidence?</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowCustomForm(!showCustomForm)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Custom Evidence
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Evidence Form */}
      {(showCustomForm || predefinedQuestions.length === 0) && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Add Custom Evidence</Label>
              {predefinedQuestions.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowCustomForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="evidence-url" className="text-sm">URL</Label>
              <Input 
                id="evidence-url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://example.com/document.pdf"
                className="text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="evidence-name" className="text-sm">Evidence Name</Label>
              <Input 
                id="evidence-name"
                value={evidenceName}
                onChange={(e) => setEvidenceName(e.target.value)}
                placeholder="Enter descriptive name for this evidence"
                className="text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="evidence-type" className="text-sm">Evidence Type</Label>
              <Select value={evidenceType} onValueChange={(value: any) => setEvidenceType(value)}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Documentation">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Documentation
                    </div>
                  </SelectItem>
                  <SelectItem value="Verification">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Verification
                    </div>
                  </SelectItem>
                  <SelectItem value="Compliance">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-purple-600" />
                      Compliance
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="evidence-description" className="text-sm">Description (Optional)</Label>
              <Input 
                id="evidence-description"
                value={evidenceDescription}
                onChange={(e) => setEvidenceDescription(e.target.value)}
                placeholder="Brief description of how this addresses the requirement"
                className="text-sm"
              />
            </div>
            
            {/* Smart Suggestions */}
            {getEvidenceSuggestions().length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Quick suggestions for {evidenceType}:</Label>
                <div className="flex flex-wrap gap-1">
                  {getEvidenceSuggestions().slice(0, 4).map((suggestion, index) => (
                    <Badge 
                      key={index}
                      variant="outline" 
                      className="text-xs cursor-pointer hover:bg-muted"
                      onClick={() => setEvidenceName(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleAddEvidence}
              className="w-full"
              disabled={!evidenceUrl || !evidenceName.trim()}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Evidence
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Evidence List - Grouped by Type */}
      {evidenceLinks.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Added Evidence</Label>
                <Badge variant="secondary">{evidenceLinks.length}</Badge>
              </div>
              
              {(['Documentation', 'Verification', 'Compliance'] as const).map(type => {
                const typeEvidence = evidenceLinks.filter(evidence => evidence.type === type);
                if (typeEvidence.length === 0) return null;
                
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(type)}
                      <Label className="text-sm font-medium">{type}</Label>
                      <Badge variant="secondary">{typeEvidence.length}</Badge>
                    </div>
                    
                    <div className="space-y-2 pl-6">
                      {typeEvidence.map((evidence, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <a 
                                href={evidence.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="font-medium text-primary hover:underline truncate"
                                title={evidence.name}
                              >
                                {evidence.name}
                              </a>
                            </div>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-auto p-1 text-muted-foreground hover:text-destructive shrink-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete evidence</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Evidence</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{evidence.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleRemoveEvidence(evidence)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                          
                          {evidence.description && (
                            <p className="text-xs text-muted-foreground pl-3">
                              {evidence.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {evidenceLinks.length === 0 && !showCustomForm && predefinedQuestions.length === 0 && (
        <div className="text-center py-6 text-sm text-muted-foreground border-2 border-dashed border-muted rounded-lg">
          <Link className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p>No evidence links added yet</p>
          <p className="text-xs">Add URLs to supporting documentation, verification records, or compliance certificates</p>
        </div>
      )}
    </div>
  );
}
