import React, { useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  ImageIcon,
  Undo,
  Redo,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RichTextFieldProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  disabled?: boolean;
}

export function RichTextField({
  value,
  onChange,
  placeholder = 'Add detailed description...',
  minHeight = '120px',
  maxHeight,
  disabled = false,
}: RichTextFieldProps) {
  const [focused, setFocused] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  });

  // Sync value prop → editor when data loads asynchronously
  React.useEffect(() => {
    if (editor && !focused && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor, focused]);

  const uploadImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are supported');
      return;
    }
    const ext = file.name.split('.').pop();
    const path = `rich-text-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('document-templates').upload(path, file);
    if (error) {
      toast.error('Image upload failed');
      return;
    }
    const { data: urlData } = supabase.storage.from('document-templates').getPublicUrl(path);
    editor?.chain().focus().setImage({ src: urlData.publicUrl }).run();
  }, [editor]);

  const handleImageClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) uploadImage(file);
    };
    input.click();
  }, [uploadImage]);

  if (!editor) return null;

  const ToolBtn = ({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={`h-7 w-7 p-0 ${active ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {children}
    </Button>
  );

  return (
    <div className={`border rounded-md bg-background overflow-auto resize-y ${focused ? 'border-primary/50 ring-1 ring-primary/20' : ''}`} style={{ minHeight, maxHeight }}>
      {/* Compact toolbar - only visible when focused */}
      {focused && (
        <div className="flex items-center gap-0.5 px-1.5 py-1 border-b bg-muted/30 flex-wrap" onMouseDown={(e) => e.preventDefault()}>
          <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
            <Bold className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
            <Italic className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
            <Strikethrough className="h-3.5 w-3.5" />
          </ToolBtn>
          <div className="w-px h-4 bg-border mx-0.5" />
          <ToolBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
            <List className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered List">
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote">
            <Quote className="h-3.5 w-3.5" />
          </ToolBtn>
          <div className="w-px h-4 bg-border mx-0.5" />
          <ToolBtn onClick={handleImageClick} title="Insert Image">
            <ImageIcon className="h-3.5 w-3.5" />
          </ToolBtn>
          <div className="flex-1" />
          <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">
            <Undo className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">
            <Redo className="h-3.5 w-3.5" />
          </ToolBtn>
        </div>
      )}

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none px-3 py-2 focus-within:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[var(--min-h)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded-md"
        style={{ '--min-h': minHeight } as React.CSSProperties}
      />
    </div>
  );
}
