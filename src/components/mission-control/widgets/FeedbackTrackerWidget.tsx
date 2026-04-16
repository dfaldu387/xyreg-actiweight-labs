import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, X, Loader2, ChevronRight, ChevronDown, Save, Bug, Lightbulb, Sparkles, ArrowUp, ArrowDown, ArrowUpDown, Upload, Trash2, ImageIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";


interface FeedbackTrackerWidgetProps {
  companyId?: string;
  onRemove?: () => void;
  readOnly?: boolean;
  hideHeader?: boolean;
  onCountReady?: (count: number) => void;
  externalShowClosed?: boolean;
  externalSearchTerm?: string;
  externalTypeFilter?: string;
  externalStatusFilter?: string;
  externalPriorityFilter?: string;
}

const typeBadgeVariant: Record<string, string> = {
  bug_report: "bg-destructive/15 text-destructive border-destructive/30",
  improvement_suggestion: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
  feature_request: "bg-blue-500/15 text-blue-700 border-blue-500/30",
};

const formatLabel = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

const statusBadgeVariant: Record<string, string> = {
  open: "bg-orange-500/15 text-orange-700 border-orange-500/30",
  in_review: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  resolved: "bg-green-500/15 text-green-700 border-green-500/30",
  closed: "bg-muted text-muted-foreground border-border",
};

const STATUS_OPTIONS = ["open", "in_review", "resolved", "closed"];
const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"];

function getScreenshotUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = supabase.storage.from("feedback-screenshots").getPublicUrl(path);
  return data.publicUrl;
}

export function FeedbackTrackerWidget({ companyId, onRemove, readOnly = false, defaultExpanded = false, hideHeader = false, onCountReady, externalShowClosed, externalSearchTerm, externalTypeFilter, externalStatusFilter, externalPriorityFilter }: FeedbackTrackerWidgetProps & { defaultExpanded?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showClosed, setShowClosed] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackPageSize, setFeedbackPageSize] = useState(20);
  const queryClient = useQueryClient();

  const { data: feedback = [], isLoading, error } = useQuery({
    queryKey: ["feedback-tracker-widget", companyId, isExpanded],
    queryFn: async () => {
      let query = supabase
        .from("feedback_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(isExpanded ? 50 : 10);

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Feedback query error:", error);
        throw error;
      }
      return data || [];
    },
  });

  const userIds = [...new Set(feedback.map(f => f.user_id).filter(Boolean))] as string[];
  const { data: profiles = [] } = useQuery({
    queryKey: ["feedback-profiles", userIds],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data } = await supabase
        .from("user_profiles")
        .select("id, first_name, last_name")
        .in("id", userIds);
      return data || [];
    },
    enabled: userIds.length > 0,
  });

  const profileMap = new Map(profiles.map(p => [p.id, `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Unknown"]));

  const toggleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection(column === "created_at" ? "desc" : "asc");
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDirection === "asc"
      ? <ArrowUp className="h-3 w-3 ml-1 text-primary" />
      : <ArrowDown className="h-3 w-3 ml-1 text-primary" />;
  };

  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const statusOrder: Record<string, number> = { open: 0, in_review: 1, resolved: 2, closed: 3 };

  const effectiveShowClosed = externalShowClosed !== undefined ? externalShowClosed : showClosed;
  const filteredFeedback = useMemo(() => {
    let base = effectiveShowClosed ? feedback : feedback.filter(f => f.status !== 'closed');

    // Apply external filters when in hideHeader mode
    if (externalSearchTerm) {
      const term = externalSearchTerm.toLowerCase();
      base = base.filter(f =>
        f.title?.toLowerCase().includes(term) ||
        (f.user_id && profileMap.get(f.user_id)?.toLowerCase().includes(term))
      );
    }
    if (externalTypeFilter && externalTypeFilter !== 'all') {
      base = base.filter(f => f.type === externalTypeFilter);
    }
    if (externalStatusFilter && externalStatusFilter !== 'all') {
      base = base.filter(f => f.status === externalStatusFilter);
    }
    if (externalPriorityFilter && externalPriorityFilter !== 'all') {
      base = base.filter(f => f.priority === externalPriorityFilter);
    }
    return [...base].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortColumn) {
        case "created_at":
          aVal = a.created_at; bVal = b.created_at; break;
        case "submitted_by":
          aVal = (a.user_id ? profileMap.get(a.user_id) : "") || "";
          bVal = (b.user_id ? profileMap.get(b.user_id) : "") || "";
          break;
        case "type":
          aVal = a.type; bVal = b.type; break;
        case "title":
          aVal = a.title; bVal = b.title; break;
        case "assigned_to":
          aVal = (a as any).assigned_to || ""; bVal = (b as any).assigned_to || ""; break;
        case "priority":
          aVal = priorityOrder[a.priority || "medium"] ?? 99;
          bVal = priorityOrder[b.priority || "medium"] ?? 99;
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        case "status":
          aVal = statusOrder[a.status || "open"] ?? 99;
          bVal = statusOrder[b.status || "open"] ?? 99;
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        default:
          aVal = a.created_at; bVal = b.created_at;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [feedback, effectiveShowClosed, sortColumn, sortDirection, profileMap, externalSearchTerm, externalTypeFilter, externalStatusFilter, externalPriorityFilter]);

  // Notify parent of count & reset page
  React.useEffect(() => {
    onCountReady?.(filteredFeedback.length);
    setFeedbackPage(1);
  }, [filteredFeedback.length, onCountReady]);

  const feedbackTotalPages = Math.ceil(filteredFeedback.length / feedbackPageSize);
  const paginatedFeedback = hideHeader
    ? filteredFeedback.slice((feedbackPage - 1) * feedbackPageSize, feedbackPage * feedbackPageSize)
    : filteredFeedback;

  // Summary counts (always from full feedback)
  const statusCounts = {
    open: feedback.filter(f => f.status === 'open').length,
    in_review: feedback.filter(f => f.status === 'in_review').length,
    resolved: feedback.filter(f => f.status === 'resolved').length,
    closed: feedback.filter(f => f.status === 'closed').length,
  };
  const typeCounts = {
    bug_report: feedback.filter(f => f.type === 'bug_report').length,
    improvement_suggestion: feedback.filter(f => f.type === 'improvement_suggestion').length,
    feature_request: feedback.filter(f => f.type === 'feature_request').length,
  };


  const selectItem = (item: typeof feedback[0]) => {
    if (selectedId === item.id) {
      setSelectedId(null);
      return;
    }
    setSelectedId(item.id);
    setEditStatus(item.status || "open");
    setEditPriority(item.priority || "medium");
    setEditNotes((item as any).admin_notes || "");
    setEditAssignedTo((item as any).assigned_to || undefined);
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const updateData: Record<string, any> = {
        status: editStatus,
        priority: editPriority,
        admin_notes: editNotes,
        assigned_to: editAssignedTo || null,
      };
      if (editStatus === "resolved") {
        const { data: { user } } = await supabase.auth.getUser();
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = user?.id || null;
      }
      const { error } = await supabase
        .from("feedback_submissions")
        .update(updateData as any)
        .eq("id", selectedId);
      if (error) throw error;
      toast.success("Feedback updated");
      queryClient.invalidateQueries({ queryKey: ["feedback-tracker-widget"] });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update feedback");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadScreenshot = async (feedbackId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;
      setUploading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        
        // Get existing screenshot_urls
        const { data: existing } = await supabase
          .from('feedback_submissions')
          .select('screenshot_url')
          .eq('id', feedbackId)
          .single();
        
        // Use raw query to also get screenshot_urls (not in TS types yet)
        const { data: rawExisting } = await supabase
          .from('feedback_submissions')
          .select('*')
          .eq('id', feedbackId)
          .single();
        
        const existingUrls: string[] = (rawExisting as any)?.screenshot_urls?.length 
          ? (rawExisting as any).screenshot_urls 
          : (existing?.screenshot_url ? [existing.screenshot_url] : []);
        const newPaths: string[] = [];

        for (const file of Array.from(files)) {
          const fileName = `feedback-${Date.now()}-${newPaths.length}.png`;
          const filePath = `${user.id}/${fileName}`;
          const { error: uploadError } = await supabase.storage
            .from('feedback-screenshots')
            .upload(filePath, file);
          if (uploadError) throw uploadError;
          newPaths.push(filePath);
        }

        const allUrls = [...existingUrls, ...newPaths];
        const updateData: any = { 
          screenshot_url: allUrls[0] || null,
          screenshot_urls: allUrls 
        };
        const { error: updateError } = await supabase
          .from('feedback_submissions')
          .update(updateData)
          .eq('id', feedbackId);
        if (updateError) throw updateError;
        toast.success(`${newPaths.length} screenshot(s) uploaded`);
        queryClient.invalidateQueries({ queryKey: ['feedback-tracker-widget'] });
      } catch (err) {
        console.error(err);
        toast.error('Failed to upload screenshot');
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const handleRemoveScreenshot = async (feedbackId: string, screenshotPath: string) => {
    try {
      await supabase.storage.from('feedback-screenshots').remove([screenshotPath]);
      
      // Get current urls and remove the deleted one
      const { data: rawExisting } = await supabase
        .from('feedback_submissions')
        .select('*')
        .eq('id', feedbackId)
        .single();
      
      const existingUrls: string[] = (rawExisting as any)?.screenshot_urls || [];
      const updatedUrls = existingUrls.filter((u: string) => u !== screenshotPath);
      
      const updateData: any = { 
        screenshot_url: updatedUrls[0] || null,
        screenshot_urls: updatedUrls 
      };
      await supabase
        .from('feedback_submissions')
        .update(updateData)
        .eq('id', feedbackId);
      toast.success('Screenshot removed');
      queryClient.invalidateQueries({ queryKey: ['feedback-tracker-widget'] });
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove screenshot');
    }
  };

  const detailPanel = (item: typeof feedback[0]) => (
    <div className="bg-muted/30 border border-border rounded-md p-4 space-y-3">
      <div className="grid grid-cols-2 gap-4 text-sm">
        {/* Row 1: Title left, Submitted By right */}
        <div>
          <span className="text-muted-foreground text-xs">Title</span>
          <p className="font-medium">{item.title}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Submitted By</span>
          <p className="font-medium">{item.user_id ? (profileMap.get(item.user_id) || "Unknown") : "Anonymous"}</p>
        </div>
        {/* Row 2: Date, Type */}
        <div>
          <span className="text-muted-foreground text-xs">Date</span>
          <p className="font-medium">{format(new Date(item.created_at), "MMM d, yyyy HH:mm")}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Type</span>
          <p><Badge variant="outline" className={`text-xs px-1.5 py-0 ${typeBadgeVariant[item.type] || ""}`}>{formatLabel(item.type)}</Badge></p>
        </div>
        {/* Row 3: Description */}
        <div className="col-span-2">
          <span className="text-muted-foreground text-xs">Description</span>
          <p className="text-sm mt-0.5">{item.description || "No description provided"}</p>
        </div>
        {/* Row 4: Screenshots */}
        <div className="col-span-2">
          <span className="text-muted-foreground text-xs">Screenshots</span>
          {(() => {
            const urls: string[] = (item as any).screenshot_urls?.length 
              ? (item as any).screenshot_urls 
              : ((item as any).screenshot_url ? [(item as any).screenshot_url] : []);
            return (
              <>
                {urls.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {urls.map((path: string, idx: number) => {
                      const url = getScreenshotUrl(path);
                      return (
                        <div key={idx} className="relative group">
                          <img
                            src={url!}
                            alt={`Screenshot ${idx + 1}`}
                            className="max-h-32 rounded border border-border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setLightboxUrl(url)}
                          />
                          {!readOnly && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 bg-background/80 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveScreenshot(item.id, path)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  !readOnly ? null : <p className="text-xs text-muted-foreground mt-1">No screenshots</p>
                )}
                {!readOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 gap-1.5 text-xs"
                    onClick={() => handleUploadScreenshot(item.id)}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    {uploading ? 'Uploading...' : 'Add Screenshot'}
                  </Button>
                )}
              </>
            );
          })()}
        </div>
      </div>
      {/* Row 5: Status, Priority, Assigned To */}
      <div className={`border-t border-border pt-3 grid ${isSuperAdminMode ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Status</label>
          {readOnly ? (
            <Badge variant="outline" className={`text-xs px-1.5 py-0 ${statusBadgeVariant[item.status] || ""}`}>{formatLabel(item.status || "")}</Badge>
          ) : (
            <Select value={editStatus} onValueChange={setEditStatus}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
          {readOnly ? (
            <p className="text-sm font-medium capitalize">{item.priority || "—"}</p>
          ) : (
            <Select value={editPriority} onValueChange={setEditPriority}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{formatLabel(p)}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        {isSuperAdminMode && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Assigned To</label>
            {readOnly ? (
              <p className="text-sm font-medium">{(item as any).assigned_to || "Unassigned"}</p>
            ) : (
              <Select value={editAssignedTo || "none"} onValueChange={(v) => setEditAssignedTo(v === "none" ? undefined : v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {assigneeList.map(u => (
                    <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
        {/* Row 6: Admin Notes */}
        <div className={isSuperAdminMode ? "col-span-3" : "col-span-2"}>
          <label className="text-xs text-muted-foreground mb-1 block">Admin Notes</label>
          {readOnly ? (
            <p className="text-sm">{(item as any).admin_notes || "—"}</p>
          ) : (
            <Textarea
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              placeholder="Add internal notes..."
              className="text-xs min-h-[60px]"
            />
          )}
        </div>
        {/* Row 7: Save */}
        {!readOnly && (
          <div className={`${isSuperAdminMode ? "col-span-3" : "col-span-2"} flex justify-end`}>
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
              <Save className="h-3 w-3" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const summaryView = (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground font-medium mr-1">Status:</span>
        <Badge variant="outline" className={`text-xs px-2 py-0.5 ${statusBadgeVariant.open}`}>Open: {statusCounts.open}</Badge>
        <Badge variant="outline" className={`text-xs px-2 py-0.5 ${statusBadgeVariant.in_review}`}>In Review: {statusCounts.in_review}</Badge>
        <Badge variant="outline" className={`text-xs px-2 py-0.5 ${statusBadgeVariant.resolved}`}>Resolved: {statusCounts.resolved}</Badge>
        <Badge variant="outline" className={`text-xs px-2 py-0.5 ${statusBadgeVariant.closed}`}>Closed: {statusCounts.closed}</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground font-medium mr-1">Type:</span>
        <Badge variant="outline" className={`text-xs px-2 py-0.5 ${typeBadgeVariant.bug_report}`}>
          <Bug className="h-3 w-3 mr-1" />Bug Reports: {typeCounts.bug_report}
        </Badge>
        <Badge variant="outline" className={`text-xs px-2 py-0.5 ${typeBadgeVariant.improvement_suggestion}`}>
          <Lightbulb className="h-3 w-3 mr-1" />Suggestions: {typeCounts.improvement_suggestion}
        </Badge>
        <Badge variant="outline" className={`text-xs px-2 py-0.5 ${typeBadgeVariant.feature_request}`}>
          <Sparkles className="h-3 w-3 mr-1" />Feature Requests: {typeCounts.feature_request}
        </Badge>
      </div>
    </div>
  );

  // Resolve assigned_to names
  const assignedIds = [...new Set(feedback.map(f => (f as any).assigned_to).filter(Boolean))] as string[];
  const { data: assignedProfiles = [] } = useQuery({
    queryKey: ["feedback-assigned-profiles", assignedIds],
    queryFn: async () => {
      if (assignedIds.length === 0) return [];
      const { data } = await supabase
        .from("user_profiles")
        .select("id, first_name, last_name")
        .in("id", assignedIds);
      return data || [];
    },
    enabled: assignedIds.length > 0,
  });
  const assignedMap = new Map(assignedProfiles.map(p => [p.id, `${p.first_name || ""} ${p.last_name || ""}`.trim() || "—"]));

  const isSuperAdminMode = !companyId;

  // Hardcoded assignees for Super Admin mode
  const superAdminAssignees = [
    { id: 'ravi', name: 'Ravi' },
    { id: 'denish', name: 'Denish' },
    { id: 'arnar', name: 'Arnar' },
  ];

  // Fetch company users for Assigned To dropdown (only in Mission Control)
  const { data: companyUsers = [] } = useQuery({
    queryKey: ["feedback-company-users", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("user_company_access")
        .select("user_id, user_profiles!inner(id, first_name, last_name)")
        .eq("company_id", companyId);
      return (data || []).map((item: any) => ({
        id: item.user_profiles.id,
        name: `${item.user_profiles.first_name || ""} ${item.user_profiles.last_name || ""}`.trim() || item.user_profiles.id,
      }));
    },
    enabled: !!companyId,
  });

  const assigneeList = isSuperAdminMode ? superAdminAssignees : companyUsers;

  const expandedTable = (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="w-8"></th>
            <th className="text-left py-2 pr-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("created_at")}>
              <span className="inline-flex items-center">Date<SortIcon column="created_at" /></span>
            </th>
            <th className="text-left py-2 pr-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("submitted_by")}>
              <span className="inline-flex items-center">Submitted By<SortIcon column="submitted_by" /></span>
            </th>
            <th className="text-left py-2 pr-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("type")}>
              <span className="inline-flex items-center">Type<SortIcon column="type" /></span>
            </th>
            <th className="text-left py-2 pr-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("title")}>
              <span className="inline-flex items-center">Title<SortIcon column="title" /></span>
            </th>
            {isSuperAdminMode && (
              <th className="text-left py-2 pr-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("assigned_to")}>
                <span className="inline-flex items-center">Responsible<SortIcon column="assigned_to" /></span>
              </th>
            )}
            <th className="text-left py-2 pr-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("priority")}>
              <span className="inline-flex items-center">Priority<SortIcon column="priority" /></span>
            </th>
            <th className="text-left py-2 font-medium cursor-pointer select-none" onClick={() => toggleSort("status")}>
              <span className="inline-flex items-center">Status<SortIcon column="status" /></span>
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedFeedback.map((item) => (
            <React.Fragment key={item.id}>
              <tr
                className={`border-b border-border/50 hover:bg-muted/50 cursor-pointer [&>td]:py-3 ${item.status === 'closed' ? 'line-through opacity-50' : ''}`}
                onClick={() => selectItem(item)}
              >
                <td className="py-2 pl-3 pr-3">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                    {selectedId === item.id
                      ? <ChevronDown className="h-3.5 w-3.5 text-primary" />
                      : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                </td>
                <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                  {format(new Date(item.created_at), "MMM d, yyyy")}
                </td>
                <td className="py-2 pr-3 whitespace-nowrap">
                  {item.user_id ? (profileMap.get(item.user_id) || "Unknown") : "Anonymous"}
                </td>
                <td className="py-2 pr-3">
                  <Badge variant="outline" className={`text-xs px-1.5 py-0 ${typeBadgeVariant[item.type] || ""}`}>
                    {formatLabel(item.type)}
                  </Badge>
                </td>
                <td className="py-2 pr-3 font-medium max-w-[200px] truncate">{item.title}</td>
                {isSuperAdminMode && (
                  <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                    {(item as any).assigned_to || "—"}
                  </td>
                )}
                <td className="py-2 pr-3 capitalize text-muted-foreground">{item.priority || "—"}</td>
                <td className="py-2">
                  <Badge variant="outline" className={`text-xs px-1.5 py-0 ${statusBadgeVariant[item.status] || ""}`}>
                    {formatLabel(item.status || "")}
                  </Badge>
                </td>
              </tr>
              {selectedId === item.id && (
                <tr>
                  <td colSpan={isSuperAdminMode ? 8 : 7} className="p-3">
                    {detailPanel(item)}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      {hideHeader && (
        <div className="flex items-center justify-between px-16 py-2.5 border-t text-sm text-slate-700">
          <span>
            Showing {filteredFeedback.length} items · Page {feedbackPage}
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <Select value={String(feedbackPageSize)} onValueChange={(v) => { setFeedbackPageSize(Number(v)); setFeedbackPage(1); }}>
                <SelectTrigger className="w-[65px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span>Page {feedbackPage}</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={feedbackPage === 1} onClick={() => setFeedbackPage(p => p - 1)}>
                ‹
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={feedbackPage >= feedbackTotalPages} onClick={() => setFeedbackPage(p => p + 1)}>
                ›
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const content = error ? (
    <p className="text-xs text-destructive text-center py-4">Unable to load feedback</p>
  ) : isLoading ? (
    <div className="flex items-center justify-center py-4">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    </div>
  ) : feedback.length === 0 ? (
    <p className="text-xs text-muted-foreground text-center py-4">No feedback submitted yet</p>
  ) : null;

  return (
    <Card className={hideHeader ? "border-0 shadow-none bg-transparent" : "border-border"}>
      {!hideHeader && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Feedback Tracker
            {filteredFeedback.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{filteredFeedback.length}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {isExpanded && (
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <Checkbox
                  checked={showClosed}
                  onCheckedChange={(checked) => setShowClosed(checked === true)}
                  className="h-3.5 w-3.5"
                />
                Show closed
              </label>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
            {onRemove && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className="px-4 pb-4 pt-2">
        {isExpanded
          ? (content || expandedTable)
          : (content || summaryView)
        }
      </CardContent>

      {/* Screenshot lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={(open) => !open && setLightboxUrl(null)}>
        <DialogContent className="sm:max-w-4xl p-2">
          {lightboxUrl && (
            <img src={lightboxUrl} alt="Screenshot" className="w-full h-auto rounded" />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
