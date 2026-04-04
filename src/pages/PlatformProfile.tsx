import React from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { ArrowLeft, Edit, Settings, FileText, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Platform {
  id: string;
  name: string;
  version: string;
  status: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface PlatformDocument {
  id: string;
  name: string;
  document_type: string;
  document_category: string;
  status: string;
  created_at: string;
}

interface LinkedProduct {
  id: string;
  name: string;
  device_category?: string;
  status?: string;
}

export default function PlatformProfile() {
  const { companyName, platformId } = useParams<{ 
    companyName: string; 
    platformId: string; 
  }>();
  const companyId = useCompanyId();

  // Fetch platform details
  const { data: platform, isLoading: platformLoading, error: platformError } = useQuery({
    queryKey: ['platform', platformId],
    queryFn: async () => {
      if (!platformId || !companyId) return null;
      
      const { data, error } = await supabase
        .from('company_platforms')
        .select('*')
        .eq('id', platformId)
        .eq('company_id', companyId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Platform not found');
        }
        throw error;
      }
      
      return data as Platform;
    },
    enabled: !!(platformId && companyId),
  });

  // Fetch platform documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['platform-documents', platformId],
    queryFn: async () => {
      if (!platformId) return [];
      
      const { data, error } = await supabase
        .from('platform_documents')
        .select(`
          id,
          document_category,
          documents (
            id,
            name,
            document_type,
            status,
            created_at
          )
        `)
        .eq('platform_id', platformId);

      if (error) throw error;
      
      return data.map(item => ({
        id: item.documents.id,
        name: item.documents.name,
        document_type: item.documents.document_type,
        document_category: item.document_category,
        status: item.documents.status,
        created_at: item.documents.created_at
      })) as PlatformDocument[];
    },
    enabled: !!platformId,
  });

  // Fetch linked products
  const { data: linkedProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['platform-products', platform?.name],
    queryFn: async () => {
      if (!platform?.name || !companyId) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name, device_category, status')
        .eq('company_id', companyId)
        .eq('product_platform', platform.name)
        .eq('is_archived', false);

      if (error) throw error;
      
      return data as LinkedProduct[];
    },
    enabled: !!(platform?.name && companyId),
  });

  if (!companyName || !platformId) {
    return <Navigate to="/app" replace />;
  }

  if (platformError) {
    toast.error(platformError.message || 'Failed to load platform');
    return <Navigate to={`/app/company/${companyName}/portfolio`} replace />;
  }

  if (platformLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-48 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!platform) {
    return <Navigate to={`/app/company/${companyName}/portfolio`} replace />;
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'in development': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'obsolete': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const documentCategories = [
    'Architectural Diagrams',
    'Core Software V&V Reports',
    'Platform Risk Management File',
    'Biocompatibility Reports',
    'General'
  ];

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link 
          to={`/app/company/${companyName}/portfolio`}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Portfolio
        </Link>
        <span>/</span>
        <span>Platforms</span>
        <span>/</span>
        <span className="text-foreground font-medium">{platform.name}</span>
      </div>

      {/* Platform Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">{platform.name}</CardTitle>
                <Badge className={getStatusColor(platform.status)}>
                  {platform.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Version {platform.version}</span>
                <span>•</span>
                <span>Created {new Date(platform.created_at).toLocaleDateString()}</span>
                {platform.updated_at !== platform.created_at && (
                  <>
                    <span>•</span>
                    <span>Updated {new Date(platform.updated_at).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Manage
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
              <p className="text-sm leading-relaxed">
                {platform.description || 'No description provided for this platform.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Documentation Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Core Documentation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mt-1"></div>
                  </div>
                ))}
              </div>
            ) : documents.length > 0 ? (
              <div className="space-y-4">
                {documentCategories.map(category => {
                  const categoryDocs = documents.filter(doc => doc.document_category === category);
                  if (categoryDocs.length === 0) return null;
                  
                  return (
                    <div key={category}>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">{category}</h4>
                      <div className="space-y-2 ml-4">
                        {categoryDocs.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between p-2 border rounded-sm hover:bg-muted/50 transition-colors">
                            <div>
                              <p className="text-sm font-medium">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">{doc.document_type}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {doc.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {documents.every(doc => doc.document_category === 'General') && documents.length > 0 && (
                  <div className="space-y-2">
                    {documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-2 border rounded-sm hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.document_type}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {doc.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No core documentation assigned to this platform</p>
                <Button variant="outline" size="sm" className="mt-3">
                  Add Documentation
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Linked Products Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Linked Products
              <Badge variant="secondary" className="text-xs">
                {linkedProducts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mt-1"></div>
                  </div>
                ))}
              </div>
            ) : linkedProducts.length > 0 ? (
              <div className="space-y-2">
                {linkedProducts.map(product => (
                  <Link
                    key={product.id}
                    to={`/app/company/${companyName}/products/${product.id}`}
                    className="block p-3 border rounded-sm hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        {product.device_category && (
                          <p className="text-xs text-muted-foreground">{product.device_category}</p>
                        )}
                      </div>
                      {product.status && (
                        <Badge variant="outline" className="text-xs">
                          {product.status}
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No products are using this platform</p>
                <p className="text-xs mt-1">Products using "{platform.name}" will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}