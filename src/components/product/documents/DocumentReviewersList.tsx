
import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReviewerGroupService, ReviewerGroup } from "@/services/reviewerGroupService";
import { supabase } from "@/integrations/supabase/client";
import { Users, CheckCircle2, XCircle, Clock, MessageSquare, FileEdit, History, Upload, Download, RotateCcw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhaseDocumentVersionService, PhaseDocumentVersion } from "@/services/phaseDocumentVersionService";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DocumentReviewersListProps {
  document: any;
  companyId?: string;
}

interface ReviewerWithStatus {
  id: string;
  name: string;
  email?: string;
  status: 'pending' | 'in_review' | 'completed' | 'skipped' | 'rejected';
  decision?: 'approved' | 'rejected' | 'changes_requested' | 'abstain';
  comments?: string;
  decision_at?: string;
  assignment_id?: string;
  groupName?: string;
  groupColor?: string;
}

export function DocumentReviewersList({ document, companyId }: DocumentReviewersListProps) {
  const [reviewerGroups, setReviewerGroups] = useState<Array<ReviewerGroup & { decision?: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [detailedReviewers, setDetailedReviewers] = useState<ReviewerWithStatus[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [versions, setVersions] = useState<PhaseDocumentVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [changeNotes, setChangeNotes] = useState("");
  
  const documentReviewers = document.reviewers || [];

  const processReviewerGroups = () => {
    try {
      const groupsWithStatus = documentReviewers.map((reviewerGroup: any) => {
        const hasApproved = document.status === 'Approved' || document.status === 'Approve' || document.status === 'Approved';
        const hasRejected = document.status === 'Rejected' || document.status === 'Reject' || document.status === 'Rejected';
        const hasInReview = document.status === 'In Review' || document.status === 'In review' || document.status === 'In Review';
        
        let decision: string | undefined;
        if (hasApproved) decision = 'approved';
        else if (hasRejected) decision = 'rejected';
        else if (hasInReview) decision = 'in_review';

        return {
          ...reviewerGroup,
          decision
        };
      });

      setReviewerGroups(groupsWithStatus);
    } catch (error) {
      console.error('[DocumentReviewersList] Error processing reviewer groups:', error);
      setReviewerGroups([]);
    }
  };

  // Load detailed reviewer information with their decisions
  const loadDetailedReviewers = async () => {
    if (!document?.id) return;
    
    setIsLoadingDetails(true);
    try {
      // Determine doc type and normalized ID
      const isTemplateDocument = document.id.startsWith('template-');
      const actualDocId = isTemplateDocument ? document.id.replace('template-', '') : document.id;

      // 1) Fetch document review assignments for this document
      const { data: assignments, error: assignmentsError } = await supabase
        .from('document_review_assignments')
        .select(`
          id,
          reviewer_group_id,
          status,
          completed_at,
          reviewer_groups!document_review_assignments_reviewer_group_id_fkey(
            id,
            name,
            color
          )
        `)
        .eq('document_id', actualDocId);

      if (assignmentsError) throw assignmentsError;

      // 1b) Fetch individual reviewer decisions for this document
      const { data: individualDecisions } = await supabase
        .from('document_reviewer_decisions')
        .select('reviewer_id, decision, comment, updated_at')
        .eq('document_id', actualDocId);

      // Map of individual decisions by reviewer_id
      const decisionByReviewer = new Map(
        (individualDecisions || []).map(d => [d.reviewer_id, d])
      );

      // Create a map of reviewer group assignments
      const assignmentsByGroup = new Map(
        (assignments || []).map(a => [a.reviewer_group_id, a])
      );

      // 2) Fetch latest notes per reviewer for this document
      const { data: reviewNotes, error: notesError } = await supabase
        .from('document_review_notes')
        .select('id, reviewer_id, note, created_at')
        .eq('document_id', actualDocId)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      // Build latest note per reviewer
      const latestNoteByReviewer = new Map<string, { note: string; created_at: string }>();
      const noteReviewerIds: string[] = [];
      (reviewNotes || []).forEach(n => {
        if (!latestNoteByReviewer.has(n.reviewer_id)) {
          latestNoteByReviewer.set(n.reviewer_id, { note: n.note, created_at: n.created_at });
          noteReviewerIds.push(n.reviewer_id);
        }
      });

      // 3) Build list of reviewers from groups
      type ReviewerSource = { 
        id: string; 
        name?: string; 
        email?: string; 
        groupName?: string; 
        groupColor?: string; 
        groupId?: string;
        assignmentStatus?: 'pending' | 'in_review' | 'completed' | 'skipped' | 'rejected';
        completedAt?: string;
      };
      let reviewersSource: ReviewerSource[] = [];

      const reviewerGroupIds = document.reviewer_group_ids || (document.reviewer_group_id ? [document.reviewer_group_id] : []);
      if (reviewerGroupIds.length > 0) {
        // Fetch members of these groups with profiles
        const { data: groups, error: groupsError } = await supabase
          .from('reviewer_groups')
          .select(`
            id,
            name,
            color,
            reviewer_group_members_new!reviewer_group_members_new_group_id_fkey(
              user_id,
              user_profiles(id, first_name, last_name, email)
            )
          `)
          .in('id', reviewerGroupIds);

        if (groupsError) throw groupsError;

        groups?.forEach((g: any) => {
          const assignment = assignmentsByGroup.get(g.id);
          g.reviewer_group_members_new?.forEach((m: any) => {
            const p = m.user_profiles;
            reviewersSource.push({
              id: m.user_id,
              name: p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : undefined,
              email: p?.email,
              groupName: g.name,
              groupColor: g.color,
              groupId: g.id,
              assignmentStatus: assignment?.status as 'pending' | 'in_review' | 'completed' | 'skipped' | 'rejected' | undefined,
              completedAt: assignment?.completed_at,
            });
          });
        });
      } else if (Array.isArray(documentReviewers) && documentReviewers.length > 0) {
        reviewersSource = documentReviewers.map((r: any) => ({
          id: r.id || r.user_id,
          name: r.name,
          email: r.email,
        })).filter((r: any) => r.id);
      }

      // If no reviewers from groups/metadata, fallback to note authors and fetch their profiles
      if (reviewersSource.length === 0 && noteReviewerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name, email')
          .in('id', noteReviewerIds);
        const profileMap = new Map((profiles || []).map(p => [p.id, p]));
        reviewersSource = noteReviewerIds.map(id => {
          const p: any = profileMap.get(id);
          return {
            id,
            name: p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : undefined,
            email: p?.email,
          };
        });
      }

      // 4) Build list for UI - use individual decisions table first, then fallback to notes
      const reviewersWithStatus: ReviewerWithStatus[] = reviewersSource.map(u => {
        const latest = latestNoteByReviewer.get(u.id);
        const individualDecision = decisionByReviewer.get(u.id);

        let decision: ReviewerWithStatus['decision'] = undefined;
        let status: ReviewerWithStatus['status'] = 'pending';

        // Priority 1: Individual decision from document_reviewer_decisions table
        if (individualDecision) {
          decision = individualDecision.decision as ReviewerWithStatus['decision'];
          status = decision === 'approved' ? 'completed' : decision === 'rejected' ? 'rejected' : 'in_review';
        }
        // Priority 2: Check review notes for legacy data
        else if (latest?.note) {
          const noteText = latest.note.toLowerCase();
          if (noteText.includes('status changed to rejected') || noteText.includes('rejected')) {
            decision = 'rejected';
            status = 'rejected';
          } else if (noteText.includes('status changed to approved') || noteText.includes('approved')) {
            decision = 'approved';
            status = 'completed';
          } else if (noteText.includes('change') || noteText.includes('revision')) {
            decision = 'changes_requested';
            status = 'in_review';
          }
        }
        // Priority 3: No individual action — show as Not Started
        else if (u.assignmentStatus === 'completed' || u.assignmentStatus === 'rejected') {
          // Group is done but this reviewer hasn't acted individually — keep as pending
          status = 'pending';
        } else if (u.assignmentStatus) {
          status = (u.assignmentStatus as ReviewerWithStatus['status']) || 'pending';
        }
        
        return {
          id: u.id,
          name: u.name || 'Reviewer',
          email: u.email,
          status,
          decision,
          comments: latest?.note,
          decision_at: u.completedAt || latest?.created_at,
          assignment_id: undefined,
          groupName: u.groupName,
          groupColor: u.groupColor,
        };
      });

      setDetailedReviewers(reviewersWithStatus);
      setIsLoadingDetails(false);
      return;
    } catch (error) {
      console.error('[DocumentReviewersList] Error loading detailed reviewers:', error);
      setDetailedReviewers([]);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    processReviewerGroups();
    if (Array.isArray(documentReviewers) && documentReviewers.length > 0) {
      // Already processed
    } else if (document.reviewer_group_ids?.length > 0 || document.reviewer_group_id) {
      loadReviewerGroupsByIds();
    } else {
      setReviewerGroups([]);
    }
  }, []);

  const loadReviewerGroupsByIds = async () => {
    if (!companyId) return;

    setIsLoading(true);
    try {
      const reviewerGroupIds = document.reviewer_group_ids ||
        (document.reviewer_group_id ? [document.reviewer_group_id] : []);

      if (reviewerGroupIds.length === 0) {
        setReviewerGroups([]);
        return;
      }

      const reviewerGroupService = new ReviewerGroupService();
      const allGroups = await reviewerGroupService.getCompanyGroups(companyId);
      const groups = allGroups.filter(g => reviewerGroupIds.includes(g.id));

      setReviewerGroups(groups.map(g => ({ ...g, decision: undefined })));
    } catch (error) {
      console.error('[DocumentReviewersList] Error loading reviewer groups:', error);
      setReviewerGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgeStyle = (decision?: string) => {
    if (decision === 'approved') {
      return 'bg-green-500 text-white hover:bg-green-600';
    } else if (decision === 'rejected') {
      return 'bg-red-500 text-white hover:bg-red-600';
    } else if (decision === 'in_review') {
      return 'bg-blue-500 text-white hover:bg-blue-600';
    }
    return 'bg-muted text-muted-foreground hover:bg-muted/80';
  };

  const getStatusIcon = (status: string, decision?: string) => {
    if (decision === 'approved') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (decision === 'rejected') return <XCircle className="h-4 w-4 text-red-600" />;
    if (decision === 'changes_requested') return <FileEdit className="h-4 w-4 text-orange-600" />;
    return <Clock className="h-4 w-4 text-gray-400" />;
  };

  const getStatusLabel = (status: string, decision?: string) => {
    if (decision === 'approved') return 'Approved';
    if (decision === 'rejected') return 'Rejected';
    if (decision === 'changes_requested') return 'Changes Requested';
    if (status === 'in_review') return 'In Review';
    if (status === 'completed') return 'Completed';
    return 'Not Started';
  };

  const getStatusBadgeStyle = (status: string, decision?: string) => {
    if (decision === 'approved') return 'bg-green-100 text-green-700';
    if (decision === 'rejected') return 'bg-red-100 text-red-700';
    if (decision === 'changes_requested') return 'bg-orange-100 text-orange-700';
    if (status === 'in_review') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  // Load version history for the document
  const loadVersionHistory = async () => {
    const isTemplateDocument = document.id.startsWith('template-');
    const actualDocId = isTemplateDocument ? document.id.replace('template-', '') : document.id;
    
    if (!isTemplateDocument) {
      // Regular documents don't have versions yet in this implementation
      setVersions([]);
      return;
    }

    setIsLoadingVersions(true);
    try {
      const versionData = await PhaseDocumentVersionService.getVersions(actualDocId);
      setVersions(versionData);
    } catch (error) {
      console.error('Error loading version history:', error);
      toast.error('Failed to load version history');
    } finally {
      setIsLoadingVersions(false);
    }
  };

  // Handle file reupload
  const handleFileReupload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isTemplateDocument = document.id.startsWith('template-');
    if (!isTemplateDocument) {
      toast.error('File reupload is only supported for phase document templates');
      return;
    }

    const actualDocId = isTemplateDocument ? document.id.replace('template-', '') : document.id;

    setUploadingFile(true);
    try {
      // Upload to storage
      const filePath = `phase-documents/${companyId}/${actualDocId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('document-templates')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create new version
      await PhaseDocumentVersionService.createNewVersion(
        actualDocId,
        filePath,
        file.name,
        file.size,
        changeNotes || undefined
      );

      toast.success('Document uploaded successfully');
      setChangeNotes('');
      
      // Reload versions
      await loadVersionHistory();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploadingFile(false);
    }
  };

  // Handle version restore
  const handleRestoreVersion = async (versionId: string) => {
    try {
      await PhaseDocumentVersionService.restoreVersion(versionId);
      toast.success('Version restored successfully');
      await loadVersionHistory();
    } catch (error) {
      console.error('Error restoring version:', error);
      toast.error('Failed to restore version');
    }
  };

  // Download a specific version
  const handleDownloadVersion = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('document-templates')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading version:', error);
      toast.error('Failed to download version');
    }
  };

  if (reviewerGroups.length > 0) {
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs"
            onClick={() => {
              loadDetailedReviewers();
              loadVersionHistory();
            }}
          >
            <Users className="h-3.5 w-3.5 mr-1" />
            {reviewerGroups.map(g => g.name).join(', ')}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Review Status - {document.name}</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="reviewers" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="reviewers">
                <Users className="h-4 w-4 mr-2" />
                Reviewers
              </TabsTrigger>
              <TabsTrigger value="versions">
                <History className="h-4 w-4 mr-2" />
                Version History
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload New Version
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="reviewers" className="mt-4">
              {isLoadingDetails ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-muted-foreground">Loading reviewer details...</span>
                </div>
              ) : detailedReviewers.length > 0 ? (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {detailedReviewers.map((reviewer, index) => (
                  <div key={reviewer.id}>
                    <div className="flex items-start justify-between gap-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {getStatusIcon(reviewer.status, reviewer.decision)}
                          <p className="font-medium truncate">{reviewer.name}</p>
                          {reviewer.groupName && (
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={{ 
                                backgroundColor: reviewer.groupColor ? `${reviewer.groupColor}20` : undefined,
                                borderColor: reviewer.groupColor || undefined,
                                color: reviewer.groupColor || undefined
                              }}
                            >
                              {reviewer.groupName}
                            </Badge>
                          )}
                          <Badge 
                            variant="outline" 
                            className={`${getStatusBadgeStyle(reviewer.status, reviewer.decision)} text-xs`}
                          >
                            {getStatusLabel(reviewer.status, reviewer.decision)}
                          </Badge>
                        </div>
                        {reviewer.email && (
                          <p className="text-sm text-muted-foreground truncate">{reviewer.email}</p>
                        )}
                        {reviewer.comments && (
                          <div className="mt-2 p-3 bg-muted/50 rounded-md border">
                            <p className="text-xs font-medium mb-1 flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              Review Comments:
                            </p>
                            <p className="text-sm whitespace-pre-wrap">{reviewer.comments}</p>
                          </div>
                        )}
                        {reviewer.decision_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Reviewed on {new Date(reviewer.decision_at).toLocaleDateString()} at {new Date(reviewer.decision_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                    {index < detailedReviewers.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No reviewer details available</p>
                  <p className="text-sm mt-1">Reviewers will appear here once assigned</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="versions" className="mt-4" data-tour="version-history">
              {isLoadingVersions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-muted-foreground">Loading version history...</span>
                </div>
              ) : versions.length > 0 ? (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {versions.map((version, index) => (
                      <div key={version.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <History className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Version {version.version_number}</span>
                            {version.is_current && (
                              <Badge variant="default" className="text-xs">Current</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadVersion(version.file_path, version.file_name)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {!version.is_current && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestoreVersion(version.id)}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Restore
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="text-muted-foreground">
                            <strong>File:</strong> {version.file_name}
                          </p>
                          <p className="text-muted-foreground">
                            <strong>Size:</strong> {version.file_size ? `${(version.file_size / 1024).toFixed(2)} KB` : 'Unknown'}
                          </p>
                          <p className="text-muted-foreground">
                            <strong>Uploaded:</strong> {new Date(version.uploaded_at).toLocaleDateString()} at {new Date(version.uploaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {version.change_notes && (
                            <p className="text-sm mt-2 p-2 bg-muted/50 rounded">
                              <strong>Notes:</strong> {version.change_notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No version history available</p>
                  <p className="text-sm mt-1">Upload a new version to start tracking changes</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="upload" className="mt-4">
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">Upload New Document Version</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a new version of this document. The current version will be preserved in history.
                  </p>
                  
                  <div className="space-y-4 max-w-md mx-auto">
                    <div>
                      <Label htmlFor="change-notes">Change Notes (Optional)</Label>
                      <Textarea
                        id="change-notes"
                        placeholder="Describe what changed in this version..."
                        value={changeNotes}
                        onChange={(e) => setChangeNotes(e.target.value)}
                        rows={3}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <div className="flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md">
                          {uploadingFile ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              Select File
                            </>
                          )}
                        </div>
                      </Label>
                      <Input
                        id="file-upload"
                        type="file"
                        onChange={handleFileReupload}
                        disabled={uploadingFile}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoading) {
    return (
      <span className="text-muted-foreground text-sm">
        Loading reviewers...
      </span>
    );
  }

  return <span className="text-muted-foreground text-sm">No reviewers</span>;
}
