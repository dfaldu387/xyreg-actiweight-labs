import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2, Building2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { resizeImageToSquare } from '@/utils/imageProcessingUtils';
import { useTranslation } from '@/hooks/useTranslation';

interface CompanyLogoUploadProps {
  companyId: string;
  currentLogoUrl?: string | null;
}

export function CompanyLogoUpload({ companyId, currentLogoUrl }: CompanyLogoUploadProps) {
  const { lang } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentLogoUrl || null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: lang('company.logo.invalidFileType'),
        description: lang('company.logo.invalidFileTypeDesc'),
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB for original file)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: lang('company.logo.fileTooLarge'),
        description: lang('company.logo.fileTooLargeDesc'),
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Automatically resize image to 400x400
      const resizedBlob = await resizeImageToSquare(file, 400);
      // Upload to Supabase Storage (using resized image)
      const fileName = `${companyId}-logo-${Date.now()}.png`;
      const filePath = `company-logos/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-media')
        .upload(filePath, resizedBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/png',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('company-media')
        .getPublicUrl(uploadData.path);

      // Update company record
      const { error: updateError } = await supabase
        .from('companies')
        .update({ logo_url: urlData.publicUrl })
        .eq('id', companyId);

      if (updateError) throw updateError;

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      queryClient.invalidateQueries({ queryKey: ['company-info', companyId] });
      const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setPreviewUrl(newUrl);
      toast({
        title: lang('company.logo.uploadSuccess'),
        description: lang('company.logo.uploadSuccessDesc'),
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: lang('company.logo.uploadFailed'),
        description: lang('company.logo.uploadFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{lang('company.logo.title')}</CardTitle>
        <CardDescription>
          {lang('company.logo.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Logo Preview */}
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 rounded-lg border-2 border-dashed border-border bg-muted/20 overflow-hidden flex items-center justify-center">
            
            {/* Loader Overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-10">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              </div>
            )}

            {/* Logo Preview */}
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={lang('company.logo.altText')}
                className={`w-full h-full object-contain transition-opacity ${
                  isUploading ? "opacity-50" : "opacity-100"
                }`}
              />
            ) : (
              <Building2 className="h-8 w-8 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1">
            <input
              type="file"
              id="logo-upload"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
            />
            <Button
              variant="outline"
              disabled={isUploading}
              onClick={() => document.getElementById('logo-upload')?.click()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {lang('company.logo.processing')}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {currentLogoUrl ? lang('company.logo.changeLogo') : lang('company.logo.uploadLogo')}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
