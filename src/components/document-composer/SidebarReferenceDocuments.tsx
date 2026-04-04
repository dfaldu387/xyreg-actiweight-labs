import React, { useState, useEffect, useMemo } from 'react';
import { Search, FileText, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { ReferenceDocumentService, ReferenceDocument } from '@/services/referenceDocumentService';
import { useTranslation } from '@/hooks/useTranslation';

interface SidebarReferenceDocumentsProps {
  companyId: string;
  onViewDocument?: (url: string, fileName: string) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

export function SidebarReferenceDocuments({ companyId, onViewDocument, selectedIds = [], onSelectionChange }: SidebarReferenceDocumentsProps) {
  const { lang } = useTranslation();
  const [documents, setDocuments] = useState<ReferenceDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    setIsLoading(true);
    ReferenceDocumentService.listDocuments(companyId)
      .then(setDocuments)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [companyId]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    documents.forEach(doc => doc.tags?.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [documents]);

  const filtered = useMemo(() => {
    return documents.filter(doc => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || doc.file_name.toLowerCase().includes(q) ||
        doc.tags?.some(t => t.toLowerCase().includes(q));
      const matchesTag = !selectedTag || doc.tags?.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [documents, searchQuery, selectedTag]);

  const handleToggle = (docId: string) => {
    if (!onSelectionChange) return;
    const newIds = selectedIds.includes(docId)
      ? selectedIds.filter(id => id !== docId)
      : [...selectedIds, docId];
    onSelectionChange(newIds);
  };

  const handleOpen = async (e: React.MouseEvent, doc: ReferenceDocument) => {
    e.stopPropagation();
    try {
      const url = await ReferenceDocumentService.getDownloadUrl(doc.file_path);
      if (onViewDocument) {
        onViewDocument(url, doc.file_name);
      } else {
        window.open(url, '_blank');
      }
    } catch (err) {
      console.error('Failed to get download URL', err);
    }
  };

  const isSelectable = !!onSelectionChange;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Reference Documents
          {selectedIds.length > 0 && (
            <Badge variant="secondary" className="text-xs ml-auto">
              {selectedIds.length} linked
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search name or tag..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedTag && (
              <Badge
                variant="outline"
                className="text-xs cursor-pointer hover:bg-muted"
                onClick={() => setSelectedTag(null)}
              >
                All
              </Badge>
            )}
            {allTags.map(tag => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? 'default' : 'outline'}
                className="text-xs cursor-pointer hover:bg-muted"
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Document list */}
        <ScrollArea className="max-h-48">
          {isLoading ? (
            <p className="text-xs text-muted-foreground py-2">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              {documents.length === 0 ? 'No reference documents uploaded.' : 'No matches found.'}
            </p>
          ) : (
            <div className="space-y-1">
              {filtered.map(doc => (
                <div
                  key={doc.id}
                  className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-muted text-left group cursor-pointer"
                  onClick={() => isSelectable && handleToggle(doc.id)}
                >
                  {isSelectable && (
                    <Checkbox
                      checked={selectedIds.includes(doc.id)}
                      onCheckedChange={() => handleToggle(doc.id)}
                      className="shrink-0"
                      onClick={e => e.stopPropagation()}
                    />
                  )}
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{doc.file_name}</p>
                    {doc.tags?.length > 0 && (
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {doc.tags.slice(0, 2).map(t => (
                          <span key={t} className="text-[10px] text-muted-foreground">#{t}</span>
                        ))}
                        {doc.tags.length > 2 && (
                          <span className="text-[10px] text-muted-foreground">+{doc.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleOpen(e, doc)}
                    className="shrink-0 opacity-0 group-hover:opacity-100"
                  >
                    <Eye className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
