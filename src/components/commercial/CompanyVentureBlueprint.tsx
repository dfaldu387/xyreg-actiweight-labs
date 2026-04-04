import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DocumentFileUpload } from "@/components/common/DocumentFileUpload";
import { SaveStatusIndicator } from "@/components/ui/save-status-indicator";
import { ChevronDown, CheckCircle2, Circle, StickyNote, Paperclip, ExternalLink, FileDown, Lightbulb, Save, Sparkles, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useAutoSave } from "@/hooks/useAutoSave";
import { supabase } from '@/integrations/supabase/client';
import { BlueprintDashboard } from './blueprint/BlueprintDashboard';
import { ActivityComments } from './blueprint/ActivityComments';
import { FrameworkTemplates } from './blueprint/FrameworkTemplates';
import { exportBlueprintToPDF } from '@/utils/blueprintPdfExport';
import { BlueprintCollaborationService } from '@/services/blueprintCollaborationService';
import { CompanyVentureBlueprintData, BlueprintComment, PhaseData, FrameworkTemplate } from '@/types/blueprint';
import { toast } from 'sonner';
import { AIFieldButton } from '@/components/product/device/ai-assistant/AIFieldButton';
import { productDefinitionAIService } from '@/services/productDefinitionAIService';
import { useRestrictedFeature } from '@/contexts/RestrictedFeatureContext';
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { PORTFOLIO_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { useTranslation } from '@/hooks/useTranslation';

interface Activity {
  id: number;
  title: string;
  description: string;
  questions: string;
  linkedTab?: { name: string; tab: string };
}

// Phase structure for translation - activity IDs map to translation keys
const PHASE_STRUCTURE = [
  {
    id: 1,
    titleKey: 'commercial.phases.phase1Title',
    goalKey: 'commercial.phases.phase1Goal',
    activityIds: [1, 2, 3, 4]
  },
  {
    id: 2,
    titleKey: 'commercial.phases.phase2Title',
    goalKey: 'commercial.phases.phase2Goal',
    activityIds: [5, 6, 7, 8]
  },
  {
    id: 3,
    titleKey: 'commercial.phases.phase3Title',
    goalKey: 'commercial.phases.phase3Goal',
    activityIds: [9, 10, 11, 12, 13]
  },
  {
    id: 4,
    titleKey: 'commercial.phases.phase4Title',
    goalKey: 'commercial.phases.phase4Goal',
    activityIds: [14, 15, 16, 17, 18]
  },
  {
    id: 5,
    titleKey: 'commercial.phases.phase5Title',
    goalKey: 'commercial.phases.phase5Goal',
    activityIds: [23, 24, 25, 26, 27, 28]
  },
  {
    id: 6,
    titleKey: 'commercial.phases.phase6Title',
    goalKey: 'commercial.phases.phase6Goal',
    activityIds: [29, 30, 31, 32, 33]
  }
];

// Activity linked tabs configuration
const ACTIVITY_LINKED_TABS: Record<number, { tab: string; labelKey: string }> = {
  5: { tab: 'market-analysis', labelKey: 'commercial.linkedTabs.marketAnalysis' },
  6: { tab: 'market-analysis', labelKey: 'commercial.linkedTabs.marketAnalysis' },
  9: { tab: 'commercial-performance', labelKey: 'commercial.linkedTabs.commercialPerformance' },
  11: { tab: 'feasibility-studies', labelKey: 'commercial.linkedTabs.viabilityStudies' },
  23: { tab: 'commercial-performance', labelKey: 'commercial.linkedTabs.commercialPerformance' },
  24: { tab: 'commercial-performance', labelKey: 'commercial.linkedTabs.commercialPerformance' }
};

// Function to create translated phases
const createTranslatedPhases = (lang: (key: string) => string): PhaseData[] => {
  return PHASE_STRUCTURE.map(phase => ({
    id: phase.id,
    title: lang(phase.titleKey),
    goal: lang(phase.goalKey),
    activities: phase.activityIds.map(activityId => {
      const linkedTab = ACTIVITY_LINKED_TABS[activityId];
      return {
        id: activityId,
        phaseId: phase.id,
        title: lang(`commercial.activities.activity${activityId}Title`),
        description: lang(`commercial.activities.activity${activityId}Desc`),
        questions: lang(`commercial.activities.activity${activityId}Questions`),
        ...(linkedTab && {
          linkedTab: linkedTab.tab,
          linkedTabLabel: lang(linkedTab.labelKey)
        })
      };
    })
  }));
};

interface CompanyVentureBlueprintProps {
  companyId: string;
}

export function CompanyVentureBlueprint({ companyId }: CompanyVentureBlueprintProps) {
  const navigate = useNavigate();
  const { companyName } = useParams();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const { lang } = useTranslation();

  // Create translated phases
  const phases = useMemo(() => createTranslatedPhases(lang), [lang]);

  // Restriction check - double security pattern
  const { isRestricted: contextRestricted } = useRestrictedFeature();
  const { isMenuAccessKeyEnabled } = usePlanMenuAccess();
  const isFeatureEnabled = isMenuAccessKeyEnabled(PORTFOLIO_MENU_ACCESS.COMMERCIAL_STRATEGIC_BLUEPRINT);
  const isRestricted = contextRestricted || !isFeatureEnabled;

  const [activityNotes, setActivityNotes] = useState<Record<number, string>>({});
  const [activityFiles, setActivityFiles] = useState<Record<number, { name: string; path: string; uploadedAt?: string } | null>>({});
  const [completedActivities, setCompletedActivities] = useState<Set<number>>(new Set());
  const [activityComments, setActivityComments] = useState<Record<number, BlueprintComment[]>>({});
  const [openPhases, setOpenPhases] = useState<Set<number>>(new Set([1])); // First phase open by default
  const [openActivitySections, setOpenActivitySections] = useState<Set<string>>(new Set());
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [aiLoading, setAiLoading] = useState<Record<number, boolean>>({});

  // Load blueprint data and comments from Supabase
  useEffect(() => {
    const loadData = async () => {
      // Load blueprint data
      const blueprintData = await BlueprintCollaborationService.loadBlueprintData(companyId);
      if (blueprintData) {
        setActivityNotes(blueprintData.activityNotes || {});
        setActivityFiles(blueprintData.activityFiles || {});
        setCompletedActivities(new Set(blueprintData.completedActivities || []));
      }

      // Load comments
      const comments = await BlueprintCollaborationService.loadComments(companyId);
      setActivityComments(comments);
    };

    loadData();
  }, [companyId]);

  const handleGenerateAiNote = async (activityId: number, currentText: string, title: string) => {
    if (isRestricted) return;
    if (!companyId || aiLoading[activityId]) return;

    setAiLoading(prev => ({ ...prev, [activityId]: true }));

    try {
      const response = await productDefinitionAIService.generateConciseFieldSuggestion(
        title,
        "Notes & Ideas",
        "Generate helpful strategic suggestions or insights.",
        currentText || "",
        `notes_${activityId}`,
        companyId
      );

      if (response.success && response.suggestions?.[0]) {
        const suggestion = response.suggestions[0].suggestion;

        // update notes
        updateActivityNotes(activityId, suggestion);

        // (optional) you can save "accepted suggestion" for analytics
        // Not required — only if you use onAcceptAISuggestion
      }
    } catch {
      // AI suggestion failed
    } finally {
      setAiLoading(prev => ({ ...prev, [activityId]: false }));
    }
  };


  // Subscribe to real-time updates
  useEffect(() => {
    const channel = BlueprintCollaborationService.subscribeToChanges(
      companyId,
      (updatedBlueprint) => {
        // Handle blueprint updates from other users
        setActivityNotes(updatedBlueprint.activity_notes || {});
        setActivityFiles(updatedBlueprint.activity_files || {});
        setCompletedActivities(new Set(updatedBlueprint.completed_activities || []));
      },
      (newComment) => {
        // Handle new comment
        setActivityComments(prev => ({
          ...prev,
          [newComment.activity_id]: [
            ...(prev[newComment.activity_id] || []),
            {
              id: newComment.id,
              activityId: newComment.activity_id,
              userId: newComment.user_id,
              userName: newComment.user_name,
              content: newComment.content,
              createdAt: newComment.created_at,
              updatedAt: newComment.updated_at
            }
          ]
        }));
      },
      (deletedCommentId) => {
        // Handle deleted comment
        setActivityComments(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(activityId => {
            updated[Number(activityId)] = updated[Number(activityId)].filter(
              c => c.id !== deletedCommentId
            );
          });
          return updated;
        });
      }
    );

    return () => {
      BlueprintCollaborationService.unsubscribe();
    };
  }, [companyId]);

  // Prepare data for auto-save
  const blueprintData: CompanyVentureBlueprintData = {
    activityNotes,
    activityFiles,
    completedActivities: Array.from(completedActivities),
    activityComments,
    lastUpdated: new Date().toISOString()
  };

  // Auto-save with Supabase - disabled when restricted
  const { saveStatus, lastSaved, forceSave } = useAutoSave({
    data: blueprintData,
    onSave: async (data) => {
      // Security check - block save if no plan access
      const hasAccess = isMenuAccessKeyEnabled(PORTFOLIO_MENU_ACCESS.COMMERCIAL_STRATEGIC_BLUEPRINT);
      if (!hasAccess) {
        return;
      }
      await BlueprintCollaborationService.saveBlueprintData(companyId, data);
    },
    delay: 3000, // 3 seconds for real-time feel
    enabled: !isRestricted
  });

  const togglePhase = (phaseId: number) => {
    const newOpenPhases = new Set(openPhases);
    if (newOpenPhases.has(phaseId)) {
      newOpenPhases.delete(phaseId);
    } else {
      newOpenPhases.add(phaseId);
    }
    setOpenPhases(newOpenPhases);
  };

  const toggleActivity = (activityId: number) => {
    if (isRestricted) return;
    const newCompleted = new Set(completedActivities);
    if (newCompleted.has(activityId)) {
      newCompleted.delete(activityId);
    } else {
      newCompleted.add(activityId);
    }
    setCompletedActivities(newCompleted);
  };

  const toggleActivitySection = (activityId: number, section: 'notes' | 'documents' | 'comments') => {
    const key = `${activityId}-${section}`;
    const newOpenSections = new Set(openActivitySections);
    if (newOpenSections.has(key)) {
      newOpenSections.delete(key);
    } else {
      newOpenSections.add(key);
    }
    setOpenActivitySections(newOpenSections);
  };

  const updateActivityNotes = (activityId: number, notes: string) => {
    if (isRestricted) return;
    setActivityNotes(prev => ({ ...prev, [activityId]: notes }));
  };

  const updateActivityFile = (activityId: number, file: File, filePath: string) => {
    if (isRestricted) return;
    setActivityFiles(prev => ({
      ...prev,
      [activityId]: {
        name: file.name,
        path: filePath,
        uploadedAt: new Date().toISOString()
      }
    }));
  };

  const handleNavigateToTab = (tab: string) => {
    navigate(`/app/company/${encodeURIComponent(companyName || '')}/commercial?tab=${tab}`);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportBlueprintToPDF({
        companyName: decodeURIComponent(companyName || ''),
        data: blueprintData,
        phases
      });
      toast.success(lang('commercial.blueprint.exportSuccess'));
    } catch {
      toast.error(lang('commercial.blueprint.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleApplyTemplate = (template: FrameworkTemplate) => {
    if (isRestricted) return;
    // Merge template notes with existing notes
    const newNotes = { ...activityNotes };
    Object.entries(template.notes).forEach(([activityIdStr, templateNote]) => {
      const activityId = parseInt(activityIdStr);
      const existingNote = newNotes[activityId] || '';
      if (existingNote.trim()) {
        // Append template to existing notes with separator
        newNotes[activityId] = `${existingNote}\n\n---\n\n${templateNote}`;
      } else {
        // Just use template note
        newNotes[activityId] = templateNote;
      }
    });
    setActivityNotes(newNotes);

    // Auto-expand affected phases and activities
    const affectedPhases = new Set(openPhases);
    template.affectedPhases.forEach(phaseId => affectedPhases.add(phaseId));
    setOpenPhases(affectedPhases);

    // Open notes sections for affected activities
    const newOpenSections = new Set(openActivitySections);
    Object.keys(template.notes).forEach(activityIdStr => {
      newOpenSections.add(`${activityIdStr}-notes`);
    });
    setOpenActivitySections(newOpenSections);
  };

  const handleAddComment = async (activityId: number, content: string) => {
    if (isRestricted) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error(lang('commercial.blueprint.mustBeLoggedIn'));
      return;
    }

    const newComment = await BlueprintCollaborationService.addComment(
      companyId,
      activityId,
      content,
      user.id,
      user.email || 'Anonymous'
    );

    // Comment will be added via real-time subscription
  };

  const handleDeleteComment = async (activityId: number, commentId: string) => {
    if (isRestricted) return;
    await BlueprintCollaborationService.deleteComment(commentId);
    // Comment will be removed via real-time subscription
  };

  // Remove unused old delete logic
  const _oldDeleteComment = (activityId: number, commentId: string) => {
    setActivityComments(prev => ({
      ...prev,
      [activityId]: (prev[activityId] || []).filter(c => c.id !== commentId)
    }));
  };

  const scrollToPhase = (phaseId: number) => {
    // Open the phase if not already open
    if (!openPhases.has(phaseId)) {
      setOpenPhases(prev => new Set([...prev, phaseId]));
    }
    
    // Scroll after a brief delay to allow collapsible to open
    setTimeout(() => {
      const phaseElement = document.getElementById(`phase-${phaseId}`);
      if (phaseElement) {
        phaseElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const hasActivityContent = (activityId: number) => {
    return !!(activityNotes[activityId]?.trim() || activityFiles[activityId]);
  };

  const hasExistingNotes = Object.values(activityNotes).some(note => note?.trim());

  return (
    <div className="space-y-6">
      {/* Dashboard Overview */}
      <div ref={dashboardRef}>
        <BlueprintDashboard
          phases={phases}
          data={blueprintData}
          onPhaseClick={scrollToPhase}
        />
      </div>

      {/* Main Blueprint Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle className="text-2xl">{lang('commercial.blueprint.title')}</CardTitle>
              <CardDescription>
                {lang('commercial.blueprint.subtitle')}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplatesDialog(true)}
                disabled={isRestricted}
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                {lang('commercial.blueprint.applyFramework')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={forceSave}
                disabled={isRestricted}
              >
                <Save className="h-4 w-4 mr-2" />
                {lang('commercial.blueprint.saveNow')}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleExportPDF}
                disabled={isExporting || isRestricted}
              >
                <FileDown className="h-4 w-4 mr-2" />
                {isExporting ? lang('commercial.blueprint.exporting') : lang('commercial.blueprint.exportPDF')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {lang('commercial.blueprint.description')}
            </p>
            <SaveStatusIndicator
              status={saveStatus}
              lastSaved={lastSaved}
            />
          </div>
        </CardContent>
      </Card>

      {/* Phases */}
      <div className="space-y-4">
        {phases.map((phase) => {
          const phaseCompletedCount = phase.activities.filter(a => completedActivities.has(a.id)).length;
          const phaseTotal = phase.activities.length;
          
          return (
            <Card key={phase.id} id={`phase-${phase.id}`}>
              <Collapsible 
                open={openPhases.has(phase.id)} 
                onOpenChange={() => togglePhase(phase.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1.5 flex-1">
                        <CardTitle className="text-lg">
                          {lang('commercial.blueprint.phase')} {phase.id}: {phase.title}
                        </CardTitle>
                        <CardDescription>
                          <strong>{lang('commercial.blueprint.goal')}</strong> {phase.goal}
                        </CardDescription>
                        <div className="text-xs text-muted-foreground pt-1">
                          {lang('commercial.blueprint.activitiesCompleted').replace('{{completed}}', String(phaseCompletedCount)).replace('{{total}}', String(phaseTotal))}
                        </div>
                      </div>
                      <ChevronDown 
                        className={cn(
                          "h-5 w-5 transition-transform text-muted-foreground flex-shrink-0 ml-4",
                          openPhases.has(phase.id) && "rotate-180"
                        )} 
                      />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    {phase.activities.map((activity) => (
                      <div 
                        key={activity.id} 
                        className="border border-border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleActivity(activity.id)}
                            className={cn("mt-0.5 flex-shrink-0", isRestricted && "cursor-not-allowed opacity-50")}
                            disabled={isRestricted}
                          >
                            {completedActivities.has(activity.id) ? (
                              <CheckCircle2 className="h-5 w-5 text-success" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </button>
                          <div className="flex-1 space-y-2">
                            <div>
                              <h4 className="font-semibold text-sm">{activity.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {activity.description}
                              </p>
                            </div>
                            <div className="text-sm italic text-muted-foreground">
                              <strong>{lang('commercial.blueprint.questionsToAnswer')}</strong> {activity.questions}
                            </div>

                            {activity.linkedTab && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleNavigateToTab(activity.linkedTab!)}
                                className="mt-2"
                                disabled={isRestricted}
                              >
                                <ExternalLink className="h-3 w-3 mr-2" />
                                {lang('commercial.blueprint.viewIn').replace('{{tabName}}', activity.linkedTabLabel || '')}
                              </Button>
                            )}

                            {/* Notes Section */}
                            <div className="border-t pt-3 mt-3">
                              <div className="flex items-center">
                                {/* LEFT: Notes button */}
                                <button
                                  onClick={() => toggleActivitySection(activity.id, 'notes')}
                                  className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                                >
                                  <StickyNote className="h-4 w-4" />
                                  {lang('commercial.blueprint.notesAndIdeas')}

                                  {hasActivityContent(activity.id) && activityNotes[activity.id]?.trim() && (
                                    <span className="text-xs text-muted-foreground ml-1">
                                      ({activityNotes[activity.id].trim().split(/\s+/).length} {lang('commercial.blueprint.words')})
                                    </span>
                                  )}
                                </button>

                                {/* RIGHT: AI BUTTON */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={aiLoading[activity.id] || isRestricted}
                                  onClick={() =>
                                    handleGenerateAiNote(
                                      activity.id,
                                      activityNotes[activity.id] || "",
                                      activity.title
                                    )
                                  }
                                  className="hover:bg-transparent"
                                >
                                  {aiLoading[activity.id] ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Sparkles className="h-4 w-4 text-purple-600" />
                                  )}
                                </Button>
                              </div>

                              {/* OPENED SECTION CONTENT */}
                              {openActivitySections.has(`${activity.id}-notes`) && (
                                <div className="space-y-2 mt-3">
                                  <Textarea
                                    className={cn("min-h-[80px]", isRestricted && "cursor-not-allowed opacity-70")}
                                    value={activityNotes[activity.id] || ""}
                                    onChange={(e) => updateActivityNotes(activity.id, e.target.value)}
                                    readOnly={isRestricted}
                                  />

                                  {!isRestricted && (
                                    <AIFieldButton
                                      fieldType={`notes_${activity.id}`}
                                      currentValue={activityNotes[activity.id] || ""}
                                      suggestions={[]}
                                      onAcceptSuggestion={(suggestion) => {
                                        updateActivityNotes(activity.id, suggestion);
                                      }}
                                      className="mt-2"
                                    />
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Documents Section */}
                            <div className="border-t pt-3">
                              <button
                                onClick={() => toggleActivitySection(activity.id, 'documents')}
                                className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors w-full text-left"
                              >
                                <Paperclip className="h-4 w-4" />
                                {lang('commercial.blueprint.documents')}
                                {activityFiles[activity.id] && (
                                  <span className="text-xs text-muted-foreground ml-auto">
                                    {lang('commercial.blueprint.fileAttached')}
                                  </span>
                                )}
                              </button>

                              {openActivitySections.has(`${activity.id}-documents`) && (
                                <div className="mt-2">
                                  {isRestricted ? (
                                    <div className="text-sm text-muted-foreground">
                                      {activityFiles[activity.id] ? (
                                        <span>File: {activityFiles[activity.id]?.name}</span>
                                      ) : (
                                        <span>{lang('commercial.blueprint.noFilesAttached')}</span>
                                      )}
                                    </div>
                                  ) : (
                                    <DocumentFileUpload
                                      onFileChange={(file, filePath) => updateActivityFile(activity.id, file, filePath)}
                                      currentFile={activityFiles[activity.id] || undefined}
                                    />
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Comments Section */}
                            <div className="border-t pt-3">
                              <ActivityComments
                                activityId={activity.id}
                                comments={activityComments[activity.id] || []}
                                onAddComment={handleAddComment}
                                onDeleteComment={handleDeleteComment}
                                currentUserName="Current User" // In production, get from user context
                                disabled={isRestricted}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Framework Templates Dialog */}
      <FrameworkTemplates
        isOpen={showTemplatesDialog}
        onClose={() => setShowTemplatesDialog(false)}
        onApplyTemplate={handleApplyTemplate}
        hasExistingNotes={hasExistingNotes}
      />
    </div>
  );
}
