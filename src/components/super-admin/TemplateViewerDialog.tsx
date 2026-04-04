import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SuperAdminTemplate, SuperAdminTemplateManagementService } from '@/services/superAdminTemplateManagementService';
import { FileText, Download, Eye, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface TemplateViewerDialogProps {
    template: SuperAdminTemplate;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TemplateViewerDialog({
    template,
    open,
    onOpenChange
}: TemplateViewerDialogProps) {
    const [showFileViewer, setShowFileViewer] = useState(false);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const hasFile = template.file_path && template.file_name;

    const handleViewFile = async () => {
        if (!template.file_path || !template.file_name) {
            toast.error('No file available to view');
            return;
        }

        setIsLoading(true);
        try {
            // Get the public URL for the file
            const { data: urlData } = supabase.storage
                .from('documents')
                .getPublicUrl(template.file_path);

            if (urlData.publicUrl) {
                // Create Google Docs Viewer URL
                const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(urlData.publicUrl)}&embedded=true`;

                // Set the URL and show the file viewer dialog
                setFileUrl(googleViewerUrl);
                setShowFileViewer(true);
            } else {
                toast.error('Unable to generate public URL for viewing');
            }
        } catch (error) {
            console.error('Error viewing file:', error);
            toast.error('Failed to open file for viewing');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadFile = async () => {
        if (!template.file_path || !template.file_name) {
            toast.error('No file available to download');
            return;
        }

        try {
            await SuperAdminTemplateManagementService.downloadTemplateFile(template.file_path, template.file_name);
        } catch (error) {
            console.error('Error downloading file:', error);
            toast.error('Failed to download file');
        }
    };

    const formatFileSize = (bytes?: number): string => {
        if (!bytes) return 'Unknown size';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <DialogTitle className="text-lg font-semibold text-left pr-4">
                                    {template.name}
                                </DialogTitle>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                        {template.document_type || 'Template'}
                                    </span>
                                    {template.scope && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                            {template.scope === 'company' ? 'Company-wide' :
                                                template.scope === 'product' ? 'Product-specific' :
                                                    template.scope === 'both' ? 'Both' : template.scope}
                                        </span>
                                    )}
                                    {hasFile && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                                            <FileText className="h-3 w-3 mr-1" />
                                            File Attached
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Template Information */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-2">Template Details</h3>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                        {template.document_type && (
                                            <div>

                                                <span className="font-medium text-gray-700">Type:</span>
                                                <p className="text-gray-900">{template.document_type}</p>

                                            </div>
                                        )}

                                        {template.scope && (
                                            <div>
                                                <span className="font-medium text-gray-700">Scope:</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                                        {template.scope === 'company' ? 'Company-wide' :
                                                            template.scope === 'product' ? 'Product-specific' :
                                                                template.scope === 'both' ? 'Both' : template.scope}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {template.template_category && (
                                            <div>
                                                <span className="font-medium text-gray-700">Category:</span>
                                                <p className="text-gray-900 mt-1">{template.template_category}</p>
                                            </div>
                                        )}

                                        {template.description && (
                                            <div>
                                                <span className="font-medium text-gray-700">Description:</span>
                                                <p className="text-gray-900 mt-1">{template.description}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* File Information */}
                            {hasFile && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">Attached File</h3>
                                    <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <FileText className="h-8 w-8 text-green-600" />
                                                <div>
                                                    <p className="font-medium text-green-800 truncate max-w-[300px]" title={template.file_name}>
                                                        {template.file_name}
                                                    </p>
                                                    {template.file_type && (
                                                        <div className="text-sm text-green-600 truncate max-w-[300px]"
                                                            title={`${template.file_type} • ${formatFileSize(template.file_size)}`}>
                                                            {`${template.file_type} • ${formatFileSize(template.file_size)}`}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleViewFile}
                                                    disabled={isLoading}
                                                    className="text-green-700 border-green-300 hover:bg-green-100"
                                                >
                                                    {isLoading ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-1"></div>
                                                            Loading...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            {template.file_type?.toLowerCase().includes('pdf') ? 'Open PDF' : 'View'}
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleDownloadFile}
                                                    className="text-green-700 border-green-300 hover:bg-green-100"
                                                >
                                                    <Download className="h-4 w-4 mr-1" />
                                                    Download
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* No File Available */}
                            {!hasFile && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">File Status</h3>
                                    <div className="border border-gray-200 bg-gray-50 rounded-lg p-4 text-center">
                                        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-600">No file attached to this template</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Use the edit function to upload a file
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* File Viewer Dialog */}
            <Dialog open={showFileViewer} onOpenChange={setShowFileViewer}>
                <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
                    <DialogHeader>
                        <div className="flex items-center mt-4 justify-between">
                            <DialogTitle>{template.file_name}</DialogTitle>
                            <div className="flex items-center gap-2">
                                {fileUrl && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(fileUrl, '_blank')}
                                        className="text-xs"
                                    >
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        Open in New Tab
                                    </Button>
                                )}
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden">
                        {fileUrl && (
                            <div className="w-full h-[80vh] relative">
                                {/* Loading overlay */}
                                {isLoading && (
                                    <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                                        <div className="text-center space-y-4">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                            <p className="text-sm text-gray-600">Loading document...</p>
                                        </div>
                                    </div>
                                )}

                                <iframe
                                    src={fileUrl}
                                    className="w-full h-full border-0 rounded-md"
                                    title={template.file_name}
                                    allowFullScreen
                                    onError={() => {
                                        console.error('❌ [GOOGLE VIEWER] Error loading document in Google Docs Viewer');
                                        toast.error('Unable to display document. Try opening in a new tab.');
                                        setIsLoading(false);
                                    }}
                                    onLoad={() => {
                                        setIsLoading(false);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
