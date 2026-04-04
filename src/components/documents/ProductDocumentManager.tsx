
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, File, Edit, Trash2, Upload, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductDocument {
  id: string;
  name: string;
  document_type: string;
  status: string;
  tech_applicability: string;
  file_name?: string;
  file_size?: number;
  uploaded_at?: string;
  phase_id?: string;
  phase_name?: string;
  created_at: string;
  updated_at: string;
}

interface ProductDocumentManagerProps {
  productId: string;
  companyId: string;
  currentPhase?: string;
  onDocumentUpdate?: (document: any) => void;
  disabled?: boolean;
}

export function ProductDocumentManager({
  productId,
  companyId,
  currentPhase,
  onDocumentUpdate,
  disabled = false
}: ProductDocumentManagerProps) {
  const [documents, setDocuments] = useState<ProductDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_documents_by_scope', {
          p_scope: 'product_document',
          p_product_id: productId
        });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching product documents:', error);
      toast.error('Failed to load product documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [productId]);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [...new Set(documents.map(doc => doc.status).filter(Boolean))];

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading device documents...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Product Documents
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage documents specific to this product. These are separate from company-wide templates.
          </p>
          {currentPhase && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">Current Phase:</span>
              <Badge variant="outline">{currentPhase}</Badge>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusOptions.map(status => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button disabled={disabled}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
            <Button variant="outline" disabled={disabled}>
              <Plus className="h-4 w-4 mr-2" />
              Create Document
            </Button>
          </div>

          {/* Documents List */}
          <div className="space-y-3">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No product documents found</p>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Upload or create your first product document'}
                </p>
              </div>
            ) : (
              filteredDocuments.map(document => (
                <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{document.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {document.document_type}
                      </Badge>
                      {document.status && (
                        <Badge 
                          variant={document.status === 'Completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {document.status}
                        </Badge>
                      )}
                      {document.phase_name && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          {document.phase_name}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {document.file_name && (
                        <span>File: {document.file_name}</span>
                      )}
                      {document.file_size && (
                        <span> • Size: {formatFileSize(document.file_size)}</span>
                      )}
                      <span> • Updated: {new Date(document.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {document.file_name && (
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    )}
                    <Button variant="outline" size="sm" disabled={disabled}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" disabled={disabled}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
