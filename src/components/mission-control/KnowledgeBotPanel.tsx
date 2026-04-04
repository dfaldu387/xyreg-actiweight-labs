import React, { useState, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Upload, Send, Loader2, FileJson, Trash2, Pencil, RefreshCw, Archive } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import JSZip from "jszip";

interface KnowledgeBotPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: string;
}

interface ZipProgress {
  isRunning: boolean;
  total: number;
  completed: number;
  succeeded: number;
  failed: number;
  currentFile?: string;
  errors: string[];
}

export function KnowledgeBotPanel({
  open,
  onOpenChange,
  companyId,
}: KnowledgeBotPanelProps) {
  const [question, setQuestion] = useState("");
  const [clusterFilter, setClusterFilter] = useState("all");
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [isAsking, setIsAsking] = useState(false);
  const [editingCluster, setEditingCluster] = useState<{
    id: string;
    value: string;
  } | null>(null);
  const [zipProgress, setZipProgress] = useState<ZipProgress>({
    isRunning: false, total: 0, completed: 0, succeeded: 0, failed: 0, errors: [],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch entries
  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ["slack-knowledge-entries", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("slack_knowledge_entries")
        .select("*")
        .eq("company_id", companyId)
        .order("source_date", { ascending: false });
      return data || [];
    },
    enabled: !!companyId && open,
  });

  // Fetch chat history
  const { data: chatHistory = [] } = useQuery({
    queryKey: ["slack-knowledge-chats", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("slack_knowledge_chats")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!companyId && open,
  });

  // Fetch sync state
  const { data: syncState = [], refetch: refetchSyncState } = useQuery({
    queryKey: ["slack-sync-state", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("slack_sync_state")
        .select("*")
        .eq("company_id", companyId)
        .order("last_synced_at", { ascending: false });
      return data || [];
    },
    enabled: !!companyId && open,
  });

  // Get unique clusters
  const clusters = [...new Set(entries.map((e: any) => e.cluster).filter(Boolean))];

  // Process a single JSON file via the edge function
  const ingestFile = async (slackData: any, sourceDate: string | null, channelName: string | null) => {
    const { data, error } = await supabase.functions.invoke("slack-knowledge-bot", {
      body: { action: "ingest", companyId, slackData, sourceDate, channelName },
    });
    if (error) throw new Error(error.message || "Edge function error");
    if (data?.error) throw new Error(data.error);
    return data;
  };

  // Handle ZIP file processing
  const processZipFile = async (file: File) => {
    const zip = await JSZip.loadAsync(file);
    
    // Collect all JSON files grouped by channel
    const jsonFiles: { path: string; channelName: string; sourceDate: string | null; entry: JSZip.JSZipObject }[] = [];
    
    zip.forEach((relativePath, entry) => {
      if (entry.dir || !relativePath.endsWith(".json")) return;
      // Slack export structure: channel-name/YYYY-MM-DD.json
      const parts = relativePath.split("/").filter(Boolean);
      // Skip top-level metadata files like channels.json, users.json
      if (parts.length < 2) return;
      
      const channelName = parts[parts.length - 2];
      const fileName = parts[parts.length - 1];
      const dateMatch = fileName.match(/(\d{4}-\d{2}-\d{2})/);
      
      jsonFiles.push({
        path: relativePath,
        channelName,
        sourceDate: dateMatch ? dateMatch[1] : null,
        entry,
      });
    });

    if (jsonFiles.length === 0) {
      throw new Error("No channel JSON files found in ZIP. Expected structure: channel-name/YYYY-MM-DD.json");
    }

    setZipProgress({
      isRunning: true, total: jsonFiles.length, completed: 0, succeeded: 0, failed: 0, errors: [],
    });

    const BATCH_SIZE = 10;
    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < jsonFiles.length; i += BATCH_SIZE) {
      const batch = jsonFiles.slice(i, i + BATCH_SIZE);
      
      const results = await Promise.allSettled(
        batch.map(async (item) => {
          setZipProgress((prev) => ({ ...prev, currentFile: item.path }));
          const text = await item.entry.async("text");
          const slackData = JSON.parse(text);
          return ingestFile(slackData, item.sourceDate, item.channelName);
        })
      );

      for (const r of results) {
        if (r.status === "fulfilled") succeeded++;
        else {
          failed++;
          errors.push(r.reason?.message || "Unknown error");
        }
      }

      setZipProgress((prev) => ({
        ...prev,
        completed: Math.min(i + BATCH_SIZE, jsonFiles.length),
        succeeded,
        failed,
        errors: errors.slice(0, 10),
      }));
    }

    setZipProgress((prev) => ({ ...prev, isRunning: false, currentFile: undefined }));
    return { succeeded, failed, total: jsonFiles.length };
  };

  // Upload mutation for individual JSON files
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (files.length === 0) throw new Error("No files selected");

      // Check if it's a ZIP file
      const zipFile = files.find((f) => f.name.endsWith(".zip"));
      if (zipFile) {
        return processZipFile(zipFile);
      }

      // Regular JSON file processing
      const results = [];
      for (const file of files) {
        const text = await file.text();
        let slackData: any;
        try {
          slackData = JSON.parse(text);
        } catch {
          throw new Error(`File "${file.name}" is not valid JSON`);
        }
        const dateMatch = file.name.match(/(\d{4}-\d{2}-\d{2})/);
        const sourceDate = dateMatch ? dateMatch[1] : null;
        results.push(await ingestFile(slackData, sourceDate, null));
      }
      return results;
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["slack-knowledge-entries", companyId] });
      queryClient.invalidateQueries({ queryKey: ["slack-knowledge-count", companyId] });
      if (result?.total) {
        toast({ title: `ZIP processed: ${result.succeeded}/${result.total} files ingested${result.failed > 0 ? `, ${result.failed} failed` : ""}` });
      } else {
        toast({ title: "Files ingested successfully" });
      }
    },
    onError: (err: any) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    },
  });

  // Manual sync trigger
  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("slack-knowledge-sync", {
        body: { companyId },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data: any) => {
      refetchSyncState();
      queryClient.invalidateQueries({ queryKey: ["slack-knowledge-entries", companyId] });
      queryClient.invalidateQueries({ queryKey: ["slack-knowledge-count", companyId] });
      toast({ title: "Sync complete", description: `${data?.channelsSynced || 0} channels synced` });
    },
    onError: (err: any) => {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    },
  });

  // Delete entry mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("slack_knowledge_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slack-knowledge-entries", companyId] });
      queryClient.invalidateQueries({ queryKey: ["slack-knowledge-count", companyId] });
    },
  });

  // Update cluster mutation
  const updateClusterMutation = useMutation({
    mutationFn: async ({ id, cluster }: { id: string; cluster: string }) => {
      const { error } = await supabase.from("slack_knowledge_entries").update({ cluster }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slack-knowledge-entries", companyId] });
      setEditingCluster(null);
    },
  });

  const handleAsk = async () => {
    if (!question.trim() || !companyId || isAsking) return;
    const userMsg = question.trim();
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setQuestion("");
    setIsAsking(true);

    try {
      const { data, error } = await supabase.functions.invoke("slack-knowledge-bot", {
        body: { action: "query", companyId, question: userMsg, clusterFilter: clusterFilter === "all" ? null : clusterFilter },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch (err: any) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err.message || "Failed to get answer"}` }]);
    } finally {
      setIsAsking(false);
      queryClient.invalidateQueries({ queryKey: ["slack-knowledge-chats", companyId] });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    if (selectedFiles.length > 0) {
      uploadMutation.mutate(selectedFiles);
      e.target.value = "";
    }
  };

  const zipPercentage = zipProgress.total > 0 ? Math.round((zipProgress.completed / zipProgress.total) * 100) : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Knowledge Bot</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="chat" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="sync">Auto-Sync</TabsTrigger>
            <TabsTrigger value="clusters">Clusters</TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-3">
            <div className="flex items-center gap-2">
              <Select value={clusterFilter} onValueChange={setClusterFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All topics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All topics</SelectItem>
                  {clusters.map((c: string) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">Filter by topic</span>
            </div>

            <ScrollArea className="h-[400px] border rounded-md p-3">
              {chatMessages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  Ask a question about your Slack conversations
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`mb-3 ${msg.role === "user" ? "text-right" : ""}`}>
                  <div className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : msg.content}
                  </div>
                </div>
              ))}
              {isAsking && (
                <div className="mb-3">
                  <div className="inline-block bg-muted rounded-lg px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                placeholder="Ask about your Slack data..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                disabled={isAsking || entries.length === 0}
              />
              <Button size="icon" onClick={handleAsk} disabled={isAsking || !question.trim() || entries.length === 0}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {entries.length === 0 && (
              <p className="text-xs text-muted-foreground text-center">
                Upload Slack export files first to start asking questions
              </p>
            )}
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.zip"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              className="w-full h-24 border-dashed"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending || zipProgress.isRunning}
            >
              {uploadMutation.isPending || zipProgress.isRunning ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    <Archive className="h-5 w-5" />
                  </div>
                  <span className="text-sm">Upload Slack JSON or ZIP export</span>
                  <span className="text-xs text-muted-foreground">Supports full Slack workspace exports</span>
                </div>
              )}
            </Button>

            {/* ZIP Progress */}
            {zipProgress.isRunning && (
              <Card className="p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Processing ZIP export...</span>
                  <span className="text-muted-foreground">{zipProgress.completed}/{zipProgress.total} files</span>
                </div>
                <Progress value={zipPercentage} className="h-2" />
                {zipProgress.currentFile && (
                  <p className="text-xs text-muted-foreground truncate">
                    {zipProgress.currentFile}
                  </p>
                )}
                <div className="flex gap-3 text-xs">
                  <span className="text-green-600">{zipProgress.succeeded} succeeded</span>
                  {zipProgress.failed > 0 && (
                    <span className="text-destructive">{zipProgress.failed} failed</span>
                  )}
                </div>
              </Card>
            )}

            {/* Completed ZIP progress summary */}
            {!zipProgress.isRunning && zipProgress.total > 0 && (
              <Card className="p-3 space-y-1">
                <p className="text-sm font-medium">
                  ZIP processing complete: {zipProgress.succeeded}/{zipProgress.total} files
                </p>
                {zipProgress.errors.length > 0 && (
                  <div className="text-xs text-destructive space-y-0.5">
                    {zipProgress.errors.slice(0, 3).map((err, i) => (
                      <p key={i}>• {err}</p>
                    ))}
                  </div>
                )}
              </Card>
            )}

            <ScrollArea className="h-[350px]">
              {entriesLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : entries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No files uploaded yet
                </p>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry: any) => (
                    <Card key={entry.id} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileJson className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {entry.channel_name ? `#${entry.channel_name}` : ""}{" "}
                            {entry.source_date || "Unknown date"}
                          </p>
                          <div className="flex gap-1 items-center">
                            <Badge variant="secondary" className="text-xs">{entry.cluster || "General"}</Badge>
                            <span className="text-xs text-muted-foreground">{entry.message_count} msgs</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => deleteMutation.mutate(entry.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Auto-Sync Tab */}
          <TabsContent value="sync" className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Connect your Slack workspace to automatically sync new messages daily.
              </p>
              <Button
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="w-full"
              >
                {syncMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {syncMutation.isPending ? "Syncing..." : "Sync Now"}
              </Button>
            </div>

            <ScrollArea className="h-[400px]">
              {syncState.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <p className="text-sm text-muted-foreground">No sync history yet.</p>
                  <p className="text-xs text-muted-foreground">
                    Click "Sync Now" to pull messages from connected Slack channels.
                    A daily cron job will keep data fresh automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {syncState.map((state: any) => (
                    <Card key={state.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">#{state.channel_name || state.channel_id}</p>
                          <p className="text-xs text-muted-foreground">
                            Last synced: {new Date(state.last_synced_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">Active</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Clusters Tab */}
          <TabsContent value="clusters" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              AI-suggested topic clusters. Click to rename.
            </p>
            <ScrollArea className="h-[450px]">
              {clusters.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No clusters yet. Upload files to generate clusters.
                </p>
              ) : (
                <div className="space-y-2">
                  {clusters.map((cluster: string) => {
                    const clusterEntries = entries.filter((e: any) => e.cluster === cluster);
                    return (
                      <Card key={cluster} className="p-3">
                        <div className="flex items-center justify-between">
                          {editingCluster && clusterEntries.some((e: any) => e.id === editingCluster.id) ? (
                            <Input
                              value={editingCluster.value}
                              onChange={(e) => setEditingCluster({ ...editingCluster, value: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  clusterEntries.forEach((entry: any) => {
                                    updateClusterMutation.mutate({ id: entry.id, cluster: editingCluster.value });
                                  });
                                }
                                if (e.key === "Escape") setEditingCluster(null);
                              }}
                              className="h-7 text-sm"
                              autoFocus
                            />
                          ) : (
                            <div>
                              <p className="text-sm font-medium">{cluster}</p>
                              <p className="text-xs text-muted-foreground">
                                {clusterEntries.length} file{clusterEntries.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setEditingCluster({ id: clusterEntries[0]?.id, value: cluster })}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
