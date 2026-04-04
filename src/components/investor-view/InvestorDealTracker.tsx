import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Star, StickyNote, Tag, X, Loader2, Lock, Share2, EyeOff, Plus, Pencil, Trash2, ChevronDown, ChevronRight, Check, ClipboardList } from "lucide-react";
import { useInvestorDealNotes, DealStatus, NoteItem } from "@/hooks/useInvestorDealNotes";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface InvestorDealTrackerProps {
  shareSettingsId: string;
}

const STATUS_OPTIONS: { value: DealStatus; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: 'bg-muted text-muted-foreground' },
  { value: 'watching', label: 'Watching', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'interested', label: 'Interested', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
  { value: 'passed', label: 'Passed', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  { value: 'invested', label: 'Invested', color: 'bg-primary/20 text-primary' },
];

const SUGGESTED_TAGS = [
  'great-team',
  'strong-market',
  'innovative',
  'early-stage',
  'series-a-ready',
  'follow-up',
  'high-risk',
  'competitive',
];

function DealTrackerContent({ shareSettingsId }: { shareSettingsId: string }) {
  const {
    dealNote,
    isLoading,
    setRating,
    setStatus,
    addTag,
    removeTag,
    addNote,
    updateNote,
    deleteNote,
    isSaving,
  } = useInvestorDealNotes(shareSettingsId);

  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [shareWithCompany, setShareWithCompany] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [notesExpanded, setNotesExpanded] = useState(true);

  // Inline editing state
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineContent, setInlineContent] = useState('');
  const [inlineShareWithCompany, setInlineShareWithCompany] = useState(false);
  const [inlineIsAnonymous, setInlineIsAnonymous] = useState(false);

  const handleOpenAddNote = () => {
    setNoteContent('');
    setShareWithCompany(false);
    setIsAnonymous(false);
    setNotesDialogOpen(true);
  };

  const handleSaveNote = () => {
    if (!noteContent.trim()) return;
    addNote(noteContent, shareWithCompany, isAnonymous);
    setNotesDialogOpen(false);
    setNoteContent('');
    setShareWithCompany(false);
    setIsAnonymous(false);
  };

  // Inline editing handlers
  const handleStartInlineEdit = (note: NoteItem) => {
    setInlineEditingId(note.id);
    setInlineContent(note.content);
    setInlineShareWithCompany(note.share_with_company);
    setInlineIsAnonymous(note.is_anonymous);
  };

  const handleCancelInlineEdit = () => {
    setInlineEditingId(null);
    setInlineContent('');
    setInlineShareWithCompany(false);
    setInlineIsAnonymous(false);
  };

  const handleSaveInlineEdit = () => {
    if (!inlineContent.trim() || !inlineEditingId) return;
    updateNote(inlineEditingId, inlineContent, inlineShareWithCompany, inlineIsAnonymous);
    handleCancelInlineEdit();
  };

  const handleDeleteNote = () => {
    if (deleteNoteId) {
      deleteNote(deleteNoteId);
      setDeleteNoteId(null);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      addTag(newTag.trim().toLowerCase().replace(/\s+/g, '-'));
      setNewTag('');
    }
  };

  const currentStatus = dealNote?.status || 'new';
  const currentRating = dealNote?.rating || 0;
  const currentTags = Array.isArray(dealNote?.tags) ? dealNote.tags : [];
  const notes = Array.isArray(dealNote?.notes) ? dealNote.notes : [];
  const sharedNotesCount = notes.filter(n => n.share_with_company).length;
  const privateNotesCount = notes.filter(n => !n.share_with_company).length;

  const getNoteStatusBadge = (note: NoteItem) => {
    if (!note.share_with_company) {
      return (
        <Badge variant="outline" className="text-xs gap-1">
          <Lock className="h-3 w-3" />
          Private
        </Badge>
      );
    }
    if (note.is_anonymous) {
      return (
        <Badge variant="secondary" className="text-xs gap-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
          <EyeOff className="h-3 w-3" />
          Anonymous
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-xs gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
        <Share2 className="h-3 w-3" />
        Shared
      </Badge>
    );
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm font-medium">Your Deal Tracker</span>
        <span className="text-xs text-muted-foreground">(Private)</span>
        {isSaving && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
      </div>

      {/* Star Rating */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs text-muted-foreground mr-2">Rating:</span>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star === currentRating ? null : star)}
            className="p-0.5 hover:scale-110 transition-transform"
            disabled={isLoading}
          >
            <Star
              className={cn(
                "h-5 w-5 transition-colors",
                star <= currentRating
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/40 hover:text-amber-400/60"
              )}
            />
          </button>
        ))}
        {currentRating > 0 && (
          <span className="text-xs text-muted-foreground ml-2">{currentRating}/5</span>
        )}
      </div>

      {/* Status Dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Status:</span>
        <Select
          value={currentStatus}
          onValueChange={(value) => setStatus(value as DealStatus)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <Badge variant="outline" className={cn("text-xs", option.color)}>
                  {option.label}
                </Badge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Tag className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          {currentTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-xs gap-1 pr-1"
            >
              #{tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-1.5">
          <Input
            placeholder="Add tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
            className="h-7 text-xs flex-1"
          />
          <Button size="sm" variant="outline" onClick={handleAddTag} className="h-7 text-xs flex-shrink-0">
            Add
          </Button>
        </div>
        {currentTags.length === 0 && (
          <div className="flex gap-1 flex-wrap">
            {SUGGESTED_TAGS.slice(0, 4).map((tag) => (
              <Button
                key={tag}
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2 text-muted-foreground"
                onClick={() => addTag(tag)}
              >
                +{tag}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Notes Section - Collapsible */}
      <Collapsible open={notesExpanded} onOpenChange={setNotesExpanded}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 hover:bg-muted/50 rounded-md px-1.5 py-1 -ml-1.5 transition-colors">
              {notesExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">
                Notes
                <span className="text-muted-foreground font-normal ml-1">
                  ({notes.length})
                </span>
                {sharedNotesCount > 0 && (
                  <span className="ml-1.5 text-blue-600 font-normal">• {sharedNotesCount} shared</span>
                )}
              </span>
            </button>
          </CollapsibleTrigger>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleOpenAddNote}
          >
            <Plus className="h-3 w-3" />
            Add
          </Button>
        </div>

        <CollapsibleContent className="pt-2">
          {/* Notes List */}
          {notes.length > 0 && (
            <ScrollArea className="max-h-[200px] sm:max-h-[280px]">
              <div className="space-y-2">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className={cn(
                      "rounded-lg border transition-all group",
                      inlineEditingId === note.id
                        ? "bg-background ring-2 ring-primary/20 border-primary/30"
                        : "bg-gradient-to-br from-muted/40 to-muted/20 hover:from-muted/60 hover:to-muted/30"
                    )}
                  >
                    {inlineEditingId === note.id ? (
                      // Inline Edit Mode
                      <div className="p-3 space-y-3">
                        <Textarea
                          value={inlineContent}
                          onChange={(e) => setInlineContent(e.target.value)}
                          rows={3}
                          className="resize-none text-sm bg-background"
                          autoFocus
                        />

                        {/* Inline sharing options */}
                        <div className="flex items-center gap-4 text-xs flex-wrap">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <Switch
                              checked={inlineShareWithCompany}
                              onCheckedChange={setInlineShareWithCompany}
                              className="scale-75"
                            />
                            <span className="text-muted-foreground">Share</span>
                          </label>
                          {inlineShareWithCompany && (
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <Switch
                                checked={inlineIsAnonymous}
                                onCheckedChange={setInlineIsAnonymous}
                                className="scale-75"
                              />
                              <span className="text-muted-foreground">Anonymous</span>
                            </label>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={handleCancelInlineEdit}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={handleSaveInlineEdit}
                            disabled={isSaving || !inlineContent.trim()}
                          >
                            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="p-3">
                        <div className="flex items-start gap-2">
                          {/* Status indicator */}
                          <div className="flex-shrink-0 mt-0.5">
                            {!note.share_with_company ? (
                              <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <Lock className="h-2.5 w-2.5 text-slate-500" />
                              </div>
                            ) : note.is_anonymous ? (
                              <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                                <EyeOff className="h-2.5 w-2.5 text-purple-600 dark:text-purple-400" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                <Share2 className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" />
                              </div>
                            )}
                          </div>

                          {/* Note content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {note.content}
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                              </span>
                              <span className="text-[10px] text-muted-foreground">•</span>
                              <span className="text-[10px] text-muted-foreground">
                                {!note.share_with_company ? 'Private' : note.is_anonymous ? 'Anonymous' : 'Shared'}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-0.5 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-muted"
                              onClick={() => handleStartInlineEdit(note)}
                            >
                              <Pencil className="h-3 w-3 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteNoteId(note.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {notes.length === 0 && (
            <div className="text-center py-4 sm:py-6 px-4">
              <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-2">
                <StickyNote className="h-5 w-5 text-muted-foreground/60" />
              </div>
              <p className="text-xs text-muted-foreground">
                No notes yet. Add your first note to track insights.
              </p>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Add Note Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-muted-foreground" />
              Add Note
            </DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Your note about this deal..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            rows={4}
            className="resize-none"
          />

          {/* Sharing Options */}
          <div className="space-y-4 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="share-with-company" className="text-sm font-medium">
                  Share with company
                </Label>
              </div>
              <Switch
                id="share-with-company"
                checked={shareWithCompany}
                onCheckedChange={setShareWithCompany}
              />
            </div>
            {shareWithCompany && (
              <p className="text-xs text-muted-foreground ml-6">
                This note will be visible to the startup team.
              </p>
            )}

            {shareWithCompany && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="is-anonymous" className="text-sm font-medium">
                    Share anonymously
                  </Label>
                </div>
                <Switch
                  id="is-anonymous"
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                />
              </div>
            )}
            {shareWithCompany && isAnonymous && (
              <p className="text-xs text-muted-foreground ml-6">
                Your identity will be hidden from the startup.
              </p>
            )}
            {shareWithCompany && !isAnonymous && (
              <p className="text-xs text-amber-600 ml-6">
                The startup will see your name and profile.
              </p>
            )}
          </div>

          {!shareWithCompany && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" />
              This note is completely private and will never be shared.
            </p>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setNotesDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSaveNote} disabled={isSaving || !noteContent.trim()} className="w-full sm:w-auto">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteNoteId} onOpenChange={() => setDeleteNoteId(null)}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNote} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function InvestorDealTracker({ shareSettingsId }: InvestorDealTrackerProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <>
      {/* Mobile: Floating button + Sheet */}
      <div className="md:hidden">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button
              size="lg"
              className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
            >
              <ClipboardList className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
            <SheetHeader className="pb-4">
              <SheetTitle>Deal Tracker</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(85vh-80px)]">
              <div className="pb-8">
                <DealTrackerContent shareSettingsId={shareSettingsId} />
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Fixed card */}
      <div className="hidden md:block">
        <Card className="sticky bottom-4 border-primary/20 bg-card/95 backdrop-blur shadow-lg w-80">
          <CardContent className="p-4">
            <DealTrackerContent shareSettingsId={shareSettingsId} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
