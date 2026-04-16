import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListTodo, X, Plus, ChevronDown, ChevronRight, Loader2, Trash2, Calendar, Paperclip, Link2, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isPast, isToday } from "date-fns";
import { hasEditorPrivileges } from "@/utils/roleUtils";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DocumentDraftDrawer } from '@/components/product/documents/DocumentDraftDrawer';

const isImagePath = (path: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(path);

interface TaskListWidgetProps {
  companyId?: string;
  onRemove?: () => void;
}

interface McTask {
  id: string;
  company_id: string;
  assigned_to: string;
  created_by: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  linked_document_id: string | null;
  attachment_path: string | null;
}

interface CompanyDoc {
  id: string;
  name: string;
  document_number: string | null;
  document_type?: string;
  product_id?: string;
  product_name?: string;
}

export function TaskListWidget({ companyId, onRemove }: TaskListWidgetProps) {
  const queryClient = useQueryClient();
  const { companyRoles } = useCompanyRole();
  const currentRole = companyId ? companyRoles.find(r => r.companyId === companyId)?.role : undefined;
  const canCreate = hasEditorPrivileges(currentRole || 'viewer');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [drawerDoc, setDrawerDoc] = useState<{ id: string; name: string; type: string; companyId?: string; companyName?: string; productId?: string } | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAssignee, setNewAssignee] = useState<string>("");
  const [newDueDate, setNewDueDate] = useState<Date | undefined>();
  const [newLinkedDocId, setNewLinkedDocId] = useState<string>("");
  const [newAttachmentFile, setNewAttachmentFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['mc-tasks', companyId],
    queryFn: async () => {
      let query = supabase
        .from('mc_tasks')
        .select('*')
        .order('is_completed', { ascending: true })
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as McTask[];
    },
    enabled: !!companyId,
  });

  // Fetch company members for user picker
  const { data: members = [] } = useQuery({
    queryKey: ['company-members-for-tasks', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_company_access')
        .select('user_id, user_profiles!inner(id, first_name, last_name, email)')
        .eq('company_id', companyId!);

      if (error) throw error;
      return (data || []).map((m: any) => {
        const p = m.user_profiles;
        const name = [p?.first_name, p?.last_name].filter(Boolean).join(' ') || p?.email || 'Unknown';
        return { id: m.user_id, name };
      });
    },
    enabled: !!companyId && canCreate,
  });

  // Fetch company documents for linking — join with products to differentiate
  const { data: companyDocs = [] } = useQuery({
    queryKey: ['company-docs-for-tasks', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phase_assigned_document_template')
        .select('id, name, document_number, document_type, product_id, products(name)')
        .eq('company_id', companyId!)
        .order('name', { ascending: true })
        .limit(200);

      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        document_number: d.document_number,
        document_type: d.document_type,
        product_id: d.product_id,
        product_name: d.products?.name || null,
      })) as CompanyDoc[];
    },
    enabled: !!companyId && canCreate,
  });

  // Signed URL cache for attachment previews
  const { data: attachmentUrls = {} } = useQuery({
    queryKey: ['task-attachment-urls', companyId, tasks.map(t => t.attachment_path).filter(Boolean).join(',')],
    queryFn: async () => {
      const paths = tasks.map(t => t.attachment_path).filter(Boolean) as string[];
      if (!paths.length) return {};
      const urls: Record<string, string> = {};
      await Promise.all(
        paths.map(async (path) => {
          if (isImagePath(path)) {
            const { data } = await supabase.storage.from('document-templates').createSignedUrl(path, 3600);
            if (data?.signedUrl) urls[path] = data.signedUrl;
          }
        })
      );
      return urls;
    },
    enabled: !!companyId && tasks.some(t => t.attachment_path && isImagePath(t.attachment_path)),
    staleTime: 1000 * 60 * 30,
  });

  // Upload attachment helper
  const uploadAttachment = async (file: File): Promise<string> => {
    if (!companyId || !currentUser) throw new Error('Missing context');
    const ext = file.name.includes('.') ? '.' + file.name.split('.').pop() : '';
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const sanitized = baseName
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 100);
    const filePath = `${companyId}/tasks/${Date.now()}_${sanitized}${ext}`;

    const { error } = await supabase.storage
      .from('document-templates')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (error) throw error;
    return filePath;
  };

  // Create task
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser || !companyId) throw new Error('Missing context');
      setIsUploading(true);

      let attachmentPath: string | null = null;
      if (newAttachmentFile) {
        attachmentPath = await uploadAttachment(newAttachmentFile);
      }

      const assignee = newAssignee || currentUser.id;
      const { error } = await supabase.from('mc_tasks').insert({
        company_id: companyId,
        assigned_to: assignee,
        created_by: currentUser.id,
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        due_date: newDueDate?.toISOString() || null,
        linked_document_id: newLinkedDocId && newLinkedDocId !== '__none__' ? newLinkedDocId : null,
        attachment_path: attachmentPath,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mc-tasks', companyId] });
      setNewTitle("");
      setNewDescription("");
      setNewAssignee("");
      setNewDueDate(undefined);
      setNewLinkedDocId("");
      setNewAttachmentFile(null);
      setShowAddForm(false);
      setIsUploading(false);
      toast.success("Task created");
    },
    onError: () => {
      setIsUploading(false);
      toast.error("Failed to create task");
    },
  });

  // Toggle completion
  const toggleMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from('mc_tasks')
        .update({
          is_completed: completed,
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mc-tasks', companyId] }),
  });

  // Delete task
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mc_tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mc-tasks', companyId] });
      toast.success("Task deleted");
    },
  });

  const activeTasks = tasks.filter(t => !t.is_completed);
  const completedTasks = tasks.filter(t => t.is_completed);

  const getMemberName = (userId: string) => {
    const member = members.find(m => m.id === userId);
    return member?.name || 'Unknown';
  };

  const getDocName = (docId: string | null) => {
    if (!docId) return null;
    const doc = companyDocs.find(d => d.id === docId);
    return doc ? (doc.document_number || doc.name) : null;
  };

  const getDocDisplayName = (doc: CompanyDoc) => {
    const base = doc.document_number ? `${doc.document_number} – ${doc.name}` : doc.name;
    return doc.product_name ? `${base} (${doc.product_name})` : base;
  };

  const handleDownloadAttachment = async (path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('document-templates')
        .createSignedUrl(path, 3600);
      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch {
      toast.error("Failed to download attachment");
    }
  };

  const handleDocClick = async (docId: string) => {
    if (!companyId) return;
    // Always fetch full context to ensure drawer gets complete metadata
    const { data } = await supabase
      .from('phase_assigned_document_template')
      .select('id, name, document_type, company_id, product_id')
      .eq('id', docId)
      .maybeSingle();
    if (data) {
      const companyName = companyRoles.find(r => r.companyId === companyId)?.companyName;
      setDrawerDoc({
        id: data.id,
        name: data.name,
        type: data.document_type || 'document',
        companyId: data.company_id,
        companyName: companyName || undefined,
        productId: data.product_id,
      });
    }
  };

  const getDueDateBadge = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const overdue = isPast(date) && !isToday(date);
    const today = isToday(date);
    return (
      <Badge variant="outline" className={
        overdue ? "bg-destructive/15 text-destructive border-destructive/30 text-xs" :
        today ? "bg-yellow-500/15 text-yellow-700 border-yellow-500/30 text-xs" :
        "text-xs"
      }>
        {format(date, "MMM d")}
      </Badge>
    );
  };

  const renderTaskRow = (task: McTask, isCompleted: boolean) => {
    const isExpanded = expandedTaskId === task.id;
    const hasDetail = task.description || task.attachment_path || task.linked_document_id;

    return (
      <div key={task.id} className={`border rounded-md ${isCompleted ? 'opacity-60' : ''}`}>
        {/* Main row */}
        <div className="flex items-start gap-2 group py-2 px-2.5">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={() => toggleMutation.mutate({ id: task.id, completed: !isCompleted })}
            className="mt-0.5"
          />
          <div
            className={`flex-1 min-w-0 ${hasDetail ? 'cursor-pointer' : ''}`}
            onClick={() => hasDetail && setExpandedTaskId(isExpanded ? null : task.id)}
          >
            <p className={`text-sm leading-tight ${isCompleted ? 'line-through' : ''}`}>{task.title}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {!isCompleted && task.assigned_to !== task.created_by && currentUser?.id === task.created_by && (
                <span className="text-[10px] text-muted-foreground">→ {getMemberName(task.assigned_to)}</span>
              )}
              {!isCompleted && task.assigned_to === currentUser?.id && task.created_by !== currentUser?.id && (
                <span className="text-[10px] text-muted-foreground">from {getMemberName(task.created_by)}</span>
              )}
              {!isCompleted && getDueDateBadge(task.due_date)}
              {task.linked_document_id && (
                <Badge
                  variant="outline"
                  className="text-[10px] gap-0.5 cursor-pointer hover:bg-accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDocClick(task.linked_document_id!);
                  }}
                >
                  <Link2 className="h-2.5 w-2.5" />
                  {getDocName(task.linked_document_id) || 'Doc'}
                </Badge>
              )}
              {task.attachment_path && (
                <Badge
                  variant="outline"
                  className="text-[10px] gap-0.5 cursor-pointer hover:bg-accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadAttachment(task.attachment_path!);
                  }}
                >
                  <Paperclip className="h-2.5 w-2.5" />
                  Attachment
                </Badge>
              )}
              {hasDetail && (
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {isExpanded ? <ChevronDown className="h-3 w-3 inline" /> : <ChevronRight className="h-3 w-3 inline" />}
                </span>
              )}
            </div>
          </div>
          {currentUser?.id === task.created_by && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => deleteMutation.mutate(task.id)}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </Button>
          )}
        </div>

        {/* Expanded detail panel */}
        {isExpanded && (
          <div className="border-t px-3 py-2.5 space-y-2 bg-muted/30">
            {task.description && (
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{task.description}</p>
            )}
            {task.attachment_path && isImagePath(task.attachment_path) && attachmentUrls[task.attachment_path] && (
              <div className="rounded-md overflow-hidden border border-border max-w-[240px]">
                <img
                  src={attachmentUrls[task.attachment_path]}
                  alt="Attachment"
                  className="w-full h-auto cursor-pointer"
                  onClick={() => handleDownloadAttachment(task.attachment_path!)}
                />
              </div>
            )}
            {task.attachment_path && !isImagePath(task.attachment_path) && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => handleDownloadAttachment(task.attachment_path!)}
              >
                <Paperclip className="h-3 w-3" />
                Open attachment
              </Button>
            )}
            {task.linked_document_id && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => handleDocClick(task.linked_document_id!)}
              >
                <Link2 className="h-3 w-3" />
                Open linked document
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ListTodo className="h-4 w-4" />
          Task List
          {activeTasks.length > 0 && (
            <Badge variant="secondary" className="text-xs">{activeTasks.length}</Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-1">
          {canCreate && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
          {onRemove && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Add task form */}
        {showAddForm && canCreate && (
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg border">
            <Input
              placeholder="Task title..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="h-8 text-sm"
            />
            <Textarea
              placeholder="Description (optional)..."
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              className="text-sm min-h-[60px] resize-none"
              rows={2}
            />
            <div className="flex gap-2">
              <Select value={newAssignee} onValueChange={setNewAssignee}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Assign to..." />
                </SelectTrigger>
                <SelectContent>
                  {members.map(m => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                    <Calendar className="h-3 w-3" />
                    {newDueDate ? format(newDueDate, "MMM d") : "Due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={newDueDate}
                    onSelect={setNewDueDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Document link */}
            <div className="flex gap-2">
              <Select value={newLinkedDocId} onValueChange={setNewLinkedDocId}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Link document (optional)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" className="text-xs text-muted-foreground">No document</SelectItem>
                  {companyDocs.map(d => (
                    <SelectItem key={d.id} value={d.id} className="text-xs">
                      {getDocDisplayName(d)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* File upload */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) setNewAttachmentFile(f);
                }}
              />
              <Button
                variant={newAttachmentFile ? "default" : "outline"}
                size="sm"
                className={`h-8 text-xs gap-1 shrink-0 ${newAttachmentFile ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                onClick={() => fileInputRef.current?.click()}
              >
                {newAttachmentFile ? <CheckCircle2 className="h-3 w-3" /> : <Paperclip className="h-3 w-3" />}
                {newAttachmentFile ? "Attached" : "Attach"}
              </Button>
            </div>

            {/* Attachment confirmation strip */}
            {newAttachmentFile && (
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-2 py-1.5">
                {newAttachmentFile.type.startsWith("image/") && (
                  <img
                    src={URL.createObjectURL(newAttachmentFile)}
                    alt="preview"
                    className="h-8 w-8 rounded object-cover border border-border"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-foreground">{newAttachmentFile.name}</p>
                  <p className="text-[10px] text-muted-foreground">{(newAttachmentFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 shrink-0" onClick={() => setNewAttachmentFile(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setShowAddForm(false); setNewAttachmentFile(null); setNewLinkedDocId(""); setNewDescription(""); }}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                disabled={!newTitle.trim() || createMutation.isPending || isUploading}
                onClick={() => createMutation.mutate()}
              >
                {(createMutation.isPending || isUploading) ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add Task"}
              </Button>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Active tasks */}
        {!isLoading && activeTasks.length === 0 && completedTasks.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No tasks yet</p>
        )}

        {activeTasks.map(task => renderTaskRow(task, false))}

        {/* Completed tasks toggle */}
        {completedTasks.length > 0 && (
          <div>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              {showCompleted ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {completedTasks.length} completed
            </button>
            {showCompleted && completedTasks.map(task => renderTaskRow(task, true))}
          </div>
        )}

        {/* Document Draft Side Drawer */}
        <DocumentDraftDrawer
          open={!!drawerDoc}
          onOpenChange={(open) => { if (!open) setDrawerDoc(null); }}
          documentId={drawerDoc?.id || ''}
          documentName={drawerDoc?.name || ''}
          documentType={drawerDoc?.type || ''}
          companyId={drawerDoc?.companyId}
          companyName={drawerDoc?.companyName}
          productId={drawerDoc?.productId}
        />
      </CardContent>
    </Card>
  );
}
