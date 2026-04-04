import React, { useState } from 'react';
import { Upload, File, Trash2, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useDataRoomContent } from '@/hooks/useDataRoomContent';
import { ContentType } from '@/types/dataRoom';
import { formatBytes } from '@/utils/formatBytes';

interface DataRoomContentSelectorProps {
  dataRoomId: string;
}

export function DataRoomContentSelector({ dataRoomId }: DataRoomContentSelectorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState<ContentType>('custom_document');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { contentList, uploadDocument, removeContent, isUploading, isRemoving } = useDataRoomContent(dataRoomId);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      // Auto-fill title if empty
      if (!title) {
        setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !title) return;

    uploadDocument(
      {
        dataRoomId,
        file: selectedFile,
        metadata: {
          content_type: contentType,
          document_title: title,
          document_description: description,
        },
      },
      {
        onSuccess: () => {
          // Reset form
          setTitle('');
          setDescription('');
          setContentType('custom_document');
          setSelectedFile(null);
          // Reset file input
          const fileInput = document.getElementById('file-upload') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        },
      }
    );
  };

  const getContentTypeBadge = (type: ContentType) => {
    const colors: Record<ContentType, string> = {
      product_overview: 'bg-blue-500',
      financials: 'bg-green-500',
      strategic_plans: 'bg-purple-500',
      custom_document: 'bg-gray-500',
    };
    return <Badge className={colors[type]}>{type.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">Select Document</Label>
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.docx,.xlsx,.pptx,.txt,.jpg,.jpeg,.png"
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {selectedFile.name} ({formatBytes(selectedFile.size)})
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Document Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Financial Statements 2024"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content-type">Content Type</Label>
            <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
              <SelectTrigger id="content-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product_overview">Product Overview</SelectItem>
                <SelectItem value="financials">Financials</SelectItem>
                <SelectItem value="strategic_plans">Strategic Plans</SelectItem>
                <SelectItem value="custom_document">Custom Document</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !title || isUploading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </CardContent>
      </Card>

      {/* Uploaded Documents List */}
      <div>
        <h4 className="font-semibold mb-3">Uploaded Documents ({contentList.length})</h4>
        {contentList.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <File className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No documents uploaded yet</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contentList.map((content) => (
                    <TableRow key={content.id}>
                      <TableCell className="font-medium">
                        {content.document_title}
                      </TableCell>
                      <TableCell>
                        {getContentTypeBadge(content.content_type)}
                      </TableCell>
                      <TableCell>
                        {new Date(content.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeContent(content.id)}
                          disabled={isRemoving}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
