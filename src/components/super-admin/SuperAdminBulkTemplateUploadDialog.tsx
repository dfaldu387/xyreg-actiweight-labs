import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    TemplateUploadData,
    TemplateScope,
    TemplateCategory,
    TEMPLATE_CATEGORIES
} from '@/types/templateManagement';

interface BulkUploadFile {
    file: File;
    name: string;
    description: string;
    template_scope?: TemplateScope;
    document_type?: string;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
}

interface SuperAdminBulkTemplateUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onBulkUpload: (files: BulkUploadFile[]) => Promise<void>;
    isUploading?: boolean;
    uploadProgress?: number;
}

export function SuperAdminBulkTemplateUploadDialog({
    open,
    onOpenChange,
    onBulkUpload,
    isUploading = false,
    uploadProgress = 0
}: SuperAdminBulkTemplateUploadDialogProps) {
    const [files, setFiles] = useState<BulkUploadFile[]>([]);
    const [defaultScope, setDefaultScope] = useState<TemplateScope | undefined>(undefined);
    const [defaultDocumentType, setDefaultDocumentType] = useState<string>('');
    const [defaultDescription, setDefaultDescription] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [animatedProgress, setAnimatedProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);
        processFiles(selectedFiles);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const processFiles = (selectedFiles: File[]) => {
        const newFiles: BulkUploadFile[] = selectedFiles.map(file => ({
            file,
            name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for name
            description: defaultDescription || '',
            template_scope: defaultScope,
            document_type: defaultDocumentType,
            status: 'pending'
        }));

        setFiles(prev => {
            const updated = [...prev, ...newFiles];
            return updated;
        });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        processFiles(droppedFiles);
    };

    // When defaults change, apply to all files (bulk behavior)
    React.useEffect(() => {
        if (files.length === 0) return;
        setFiles(prev => prev.map(f => ({
            ...f,
            description: defaultDescription || '',
            template_scope: defaultScope,
            document_type: defaultDocumentType
        })));
    }, [defaultDescription, defaultScope, defaultDocumentType]);

    // Animate progress number smoothly
    useEffect(() => {
        if (!isUploading) {
            setAnimatedProgress(0);
            return;
        }

        const duration = 500; // Animation duration in ms
        const startProgress = animatedProgress;
        const targetProgress = uploadProgress;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentProgress = startProgress + (targetProgress - startProgress) * easeOutQuart;

            setAnimatedProgress(Math.round(currentProgress));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [uploadProgress, isUploading]);

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (files.length === 0) {
            return;
        }

        try {
            await onBulkUpload(files);
            handleClose();
        } catch (error) {
            console.error('Bulk upload failed:', error);
        }
    };

    const handleClose = () => {
        setFiles([]);
        setDefaultScope(undefined);
        setDefaultDocumentType('');
        setDefaultDescription('');
        setAnimatedProgress(0);
        onOpenChange(false);
    };

    const getStatusIcon = (status: BulkUploadFile['status']) => {
        switch (status) {
            case 'pending':
                return <FileText className="h-4 w-4 text-muted-foreground" />;
            case 'uploading':
                return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'error':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
        }
    };

    const getStatusBadge = (status: BulkUploadFile['status']) => {
        const variants = {
            pending: 'bg-gray-100 text-gray-700',
            uploading: 'bg-blue-100 text-blue-700',
            success: 'bg-green-100 text-green-700',
            error: 'bg-red-100 text-red-700'
        };

        return (
            <Badge variant="outline" className={cn("text-xs", variants[status])}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const validFiles = files.filter(f => f.name);
    const canUpload = validFiles.length > 0 && !isUploading;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Bulk Upload Templates
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className='max-h-[70vh] overflow-y-auto p-1 space-y-4'>
                        {/* Default Settings */}
                        <Card>
                            <CardContent className="!p-4">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium">Default Settings</h3>
                                    <p className="text-xs text-muted-foreground">
                                        These settings will be applied to all uploaded files.
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="default-scope">Template Scope</Label>
                                            <Select value={defaultScope} onValueChange={(value: TemplateScope) => setDefaultScope(value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select scope" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="company-wide">Company-wide</SelectItem>
                                                    <SelectItem value="product-specific">Product-specific</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="default-document-type">Document Type</Label>
                                            <Select value={defaultDocumentType} onValueChange={setDefaultDocumentType}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select document type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="SOP">SOP</SelectItem>
                                                    <SelectItem value="Form">Form</SelectItem>
                                                    <SelectItem value="List">List</SelectItem>
                                                    <SelectItem value="Certificate">Certificate</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="md:col-span-2">
                                            <Label htmlFor="default-description">Default Description</Label>
                                            <Textarea
                                                id="default-description"
                                                value={defaultDescription}
                                                onChange={(e) => setDefaultDescription(e.target.value)}
                                                placeholder="Optional description for all templates"
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* File Upload */}
                        <Card>
                            <CardContent className="!p-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium">Select Files</h3>
                                        <div className="text-xs text-muted-foreground">
                                            {files.length > 0 ? (
                                                <span className="text-blue-600 font-medium">
                                                    {files.length} file{files.length !== 1 ? 's' : ''} selected
                                                </span>
                                            ) : (
                                                'No files selected'
                                            )}
                                        </div>
                                    </div>

                                    <div
                                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragOver
                                            ? 'border-blue-400 bg-blue-50'
                                            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                                            }`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                        <Upload className={`h-8 w-8 mx-auto mb-2 ${isDragOver ? 'text-blue-500' : 'text-muted-foreground'}`} />
                                        <p className="text-sm text-muted-foreground mb-2">
                                            {isDragOver ? 'Drop files here' : 'Click to select multiple files or drag and drop'}
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            Choose Files
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* File List */}
                        <Card>
                            <CardContent className="!p-4">
                                <div className="space-y-4">
                                    {files.length > 0 ? (
                                        <div className="space-y-3 max-h-60 overflow-y-auto">
                                            {files.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-start gap-3 p-3 border rounded-lg"
                                                >
                                                    <div className="mt-1">
                                                        {getStatusIcon(file.status)}
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-sm">{file.file.name}</span>
                                                                {getStatusBadge(file.status)}
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeFile(index)}
                                                                disabled={isUploading}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>

                                                        {file.error && (
                                                            <p className="text-xs text-red-600 mt-2">{file.error}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p className="text-sm">No files selected</p>
                                            <p className="text-xs">Select files above to configure and upload</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isUploading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!canUpload}>
                            {isUploading ? (
                                <>
                                    {animatedProgress}% Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload {validFiles.length} Template{validFiles.length !== 1 ? 's' : ''}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
