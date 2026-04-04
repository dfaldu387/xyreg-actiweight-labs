import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, StickyNote, Trash2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface Note {
  id: string;
  content: string;
  sectionReference?: string;
  sectionTitle?: string; // Add fallback section title
  timestamp: Date;
  type: 'note' | 'generated-content' | 'reminder';
}

interface NotesPanelProps {
  documentSections?: Array<{ title: string; id: string }>;
  notes?: Note[];
  onNotesUpdate?: (notes: Note[]) => void;
  onNoteCreated?: (note: Note) => void;
}

export function NotesPanel({ 
  documentSections = [], 
  notes: externalNotes = [],
  onNotesUpdate,
  onNoteCreated 
}: NotesPanelProps) {
  const [internalNotes, setInternalNotes] = useState<Note[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('none');
  const [noteType, setNoteType] = useState<Note['type']>('note');

  // Use external notes if provided, otherwise use internal state
  const notes = externalNotes.length > 0 ? externalNotes : internalNotes;

  const handleAddNote = () => {
    if (!newNoteContent.trim()) {
      toast.error('Please enter note content');
      return;
    }

    const newNote: Note = {
      id: `note-${Date.now()}`,
      content: newNoteContent,
      sectionReference: selectedSection === 'none' ? undefined : selectedSection,
      timestamp: new Date(),
      type: noteType
    };

    if (onNotesUpdate) {
      const updatedNotes = [newNote, ...notes];
      onNotesUpdate(updatedNotes);
    } else {
      setInternalNotes(prev => [newNote, ...prev]);
    }
    setNewNoteContent('');
    setSelectedSection('none');
    onNoteCreated?.(newNote);
    toast.success('Note added successfully');
  };

  const handleDeleteNote = (noteId: string) => {
    if (onNotesUpdate) {
      const updatedNotes = notes.filter(note => note.id !== noteId);
      onNotesUpdate(updatedNotes);
    } else {
      setInternalNotes(prev => prev.filter(note => note.id !== noteId));
    }
    toast.success('Note deleted');
  };

  const getTypeIcon = (type: Note['type']) => {
    switch (type) {
      case 'generated-content':
        return <span className="text-blue-600">🤖</span>;
      case 'reminder':
        return <span className="text-orange-600">⏰</span>;
      default:
        return <StickyNote className="w-3 h-3 text-yellow-600" />;
    }
  };

  const getTypeColor = (type: Note['type']) => {
    switch (type) {
      case 'generated-content':
        return 'bg-blue-50 border-blue-200';
      case 'reminder':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <StickyNote className="w-4 h-4 text-yellow-600" />
          Document Notes
          <Badge variant="secondary" className="text-xs ml-auto">
            {notes.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Note */}
        {/* <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
          <div className="flex gap-2">
            <Select value={noteType} onValueChange={(value: Note['type']) => setNoteType(value)}>
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="note">Note</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
                <SelectItem value="generated-content">AI Content</SelectItem>
              </SelectContent>
            </Select>
            
            {documentSections.length > 0 && (
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="flex-1 h-8">
                  <SelectValue placeholder="Link to section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No section</SelectItem>
                  {documentSections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <Textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Enter your note or AI-generated content..."
            className="min-h-[80px] text-sm"
          />
          
          <Button
            onClick={handleAddNote}
            size="sm"
            className="w-full"
            disabled={!newNoteContent.trim()}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Note
          </Button>
        </div> */}

        {/* Notes List */}
        <ScrollArea className="h-60">
          <div className="space-y-2">
            {notes.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">No notes yet</div>
                <div className="text-xs">Add notes to track your thoughts and generated content</div>
              </div>
            ) : (
              notes.map((note) => (
                <div key={note.id} className={`p-3 border rounded-lg ${getTypeColor(note.type)}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1 text-xs">
                      {getTypeIcon(note.type)}
                      <span className="font-medium capitalize">{note.type}</span>
                       <div className="flex items-center gap-1 text-muted-foreground">
                         <MapPin className="w-3 h-3" />
                         <span>
                           {note.sectionReference 
                             ? (documentSections.find(s => s.id === note.sectionReference)?.title || note.sectionTitle || 'Unknown section')
                             : (note.sectionTitle || 'No section')
                           }
                         </span>
                       </div>
                    </div>
                    {/* <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                      className="h-5 w-5 p-0 hover:bg-red-100"
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </Button> */}
                  </div>
                  
                  <div className="text-sm text-foreground leading-relaxed mb-2">
                    {note.content}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {note.timestamp.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}