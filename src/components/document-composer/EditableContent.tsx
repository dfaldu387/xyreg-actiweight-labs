import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent, NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Extension } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import { DocumentContent } from '@/types/documentComposer';
import { Button } from '@/components/ui/button';
import { Edit3, X, Check, Bold, Italic, Strikethrough, List, ListOrdered, Undo, Redo, Quote, Code, Type, ImagePlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { HighlightedContent } from './HighlightedContent';
import { DocumentTemplatePersistenceService } from '@/services/documentTemplatePersistenceService';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Custom Image node view with delete button overlay
function ImageNodeView({ node, deleteNode, selected }: NodeViewProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <NodeViewWrapper className="relative inline-block">
      <div
        className="relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <img
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          title={node.attrs.title || ''}
          className={`max-w-full h-auto rounded ${selected ? 'ring-2 ring-primary' : ''}`}
          draggable={false}
        />
        {(hovered || selected) && (
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              onClick={deleteNode}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition-colors"
              title="Delete image"
              type="button"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

// Extend the official Image extension with custom node view for delete button
const ImageWithDelete = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

// Custom FontSize extension for inline text sizing
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
      },
    };
  },
});

// Font size options
const FONT_SIZES = [
  { label: 'Small', value: '12px' },
  { label: 'Normal', value: '14px' },
  { label: 'Medium', value: '16px' },
  { label: 'Large', value: '20px' },
  { label: 'X-Large', value: '24px' },
  { label: 'XX-Large', value: '32px' },
];

interface EditableContentProps {
  content: DocumentContent;
  className?: string;
  onContentUpdate?: (contentId: string, newContent: string) => void;
  companyId?: string;
  templateId?: string;
  refreshTrigger?: number;
  isEditing?: boolean;
}

export function EditableContent({
  content,
  className = '',
  onContentUpdate,
  companyId,
  templateId,
  refreshTrigger,
  isEditing: isEditingProp,
}: EditableContentProps) {
  const [isEditingLocal, setIsEditingLocal] = useState(false);
  const isEditing = isEditingProp !== undefined ? isEditingProp : isEditingLocal;
  const setIsEditing = (val: boolean) => { if (isEditingProp === undefined) setIsEditingLocal(val); };
  const editorRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `editor-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('document-templates')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('document-templates')
        .getPublicUrl(filePath);

      if (editorRef.current) {
        editorRef.current.chain().focus().setImage({ src: publicUrl }).run();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontSize,
      ImageWithDelete.configure({
        inline: false,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: 'Start typing...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: content.content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[100px] p-3 prose-headings:text-gray-800 prose-p:text-gray-700 prose-strong:text-gray-800',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            handleImageUpload(file);
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
              event.preventDefault();
              const file = item.getAsFile();
              if (file) handleImageUpload(file);
              return true;
            }
          }
        }
        return false;
      },
    },
    onUpdate: () => {
      // No auto-save — changes are committed only on explicit Save
    },
  });

  // Sync editorRef to avoid circular dependency
  editorRef.current = editor;

  const handleEdit = () => {
    setIsEditing(true);
    editor?.commands.focus();
  };

  const handleSave = async () => {
    if (!editor) return;

    const newContent = editor.getHTML();

    // Call the content update handler
    if (onContentUpdate) {
      onContentUpdate(content.id, newContent);
    }

    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset editor content to original
    editor?.commands.setContent(content.content);
    // Revert parent state to original content
    if (onContentUpdate) {
      onContentUpdate(content.id, content.content);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Save on Ctrl+Enter or Cmd+Enter
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      handleSave();
    }

    // Enter key is handled by TipTap (new paragraphs) — no interception needed

    // Cancel on Escape
    if (event.key === 'Escape') {
      event.preventDefault();
      handleCancel();
    }
  };

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && !isEditing) {
      editor.commands.setContent(content.content);
    }
  }, [content.content, editor, isEditing]);

  if (!isEditing) {
    return (
      <div
        className={`group relative cursor-pointer ${className}`}
        onClick={handleEdit}
        title="Click to edit"
      >
        <div className="prose prose-sm max-w-none p-3 rounded-md border border-transparent hover:border-primary/20 transition-colors prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-foreground prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-li:text-foreground/80 prose-table:text-sm prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2 prose-th:border prose-th:border-border prose-th:px-3 prose-th:py-2 prose-th:bg-muted/50 prose-th:font-semibold">
          <HighlightedContent
            content={content.content}
            contentId={content.id}
            onContentUpdate={onContentUpdate}
            refreshTrigger={refreshTrigger}
            onAIGenerate={(prompt) => {
              if (onContentUpdate) {
                onContentUpdate(content.id, `Generating AI content for: ${prompt}...`);
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-primary/20 rounded-md ${className}`}>
      {/* Editor toolbar */}
      <div className="flex flex-col gap-2 p-2 border-b bg-gray-50 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <span>Editing content</span>
          </div>
           <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Ctrl+Enter to save
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
            >
              <Check className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </div>

        {/* Rich text formatting toolbar */}
        {editor && (
          <div className="flex items-center gap-1 flex-wrap">
            {/* Text formatting */}
            <Button
              variant={editor.isActive('bold') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className="h-8 w-8 p-0"
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              variant={editor.isActive('italic') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className="h-8 w-8 p-0"
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              variant={editor.isActive('strike') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className="h-8 w-8 p-0"
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </Button>

            {/* Font Size Dropdown - for inline text sizing */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 gap-1"
                  title="Font Size (applies to selected text only)"
                >
                  <Type className="w-4 h-4" />
                  <span className="text-xs">Size</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {FONT_SIZES.map((size) => (
                  <DropdownMenuItem
                    key={size.value}
                    onClick={() => (editor.commands as any).setFontSize(size.value)}
                    className="cursor-pointer"
                  >
                    <span style={{ fontSize: size.value }}>{size.label}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem
                  onClick={() => (editor.commands as any).unsetFontSize()}
                  className="cursor-pointer text-muted-foreground"
                >
                  Reset Size
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Lists */}
            <Button
              variant={editor.isActive('bulletList') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className="h-8 w-8 p-0"
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={editor.isActive('orderedList') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className="h-8 w-8 p-0"
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Image upload */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 px-2 gap-1"
              title="Insert Image"
            >
              <ImagePlus className="w-4 h-4" />
              <span className="text-xs">Image</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleImageUpload(file);
                  e.target.value = '';
                }
              }}
            />

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Undo/Redo */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              className="h-8 w-8 p-0"
              title="Undo (Ctrl+Z)"
              disabled={!editor.can().undo()}
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              className="h-8 w-8 p-0"
              title="Redo (Ctrl+Y)"
              disabled={!editor.can().redo()}
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Editor content */}
      <div onKeyDown={handleKeyDown}>
        <EditorContent
          editor={editor}
          className="min-h-[200px]"
        />
      </div>

    </div>
  );
}
