import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Clock,
    User,
    Globe,
    Monitor,
    FileText,
    Activity,
    Calendar,
    MapPin,
    Eye,
    Edit3,
    MessageSquare,
    Users,
    Download,
    RefreshCw,
    X,
    Shield,
    TrendingUp,
    Zap,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Search
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { AuditLogService } from "@/services/auditLogService";
import type { AuditLogEntry, AuditLogStats } from "@/types/auditLog";
import { toast } from "sonner";
import { Input } from "../ui/input";

interface DocumentAuditLogDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    documentId: string;
    documentName?: string;
}

export function DocumentAuditLogDialog({
    open,
    onOpenChange,
    documentId,
    documentName = "Document"
}: DocumentAuditLogDialogProps) {
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
    const [stats, setStats] = useState<AuditLogStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [pageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const loadAuditData = async (page: number = 1) => {
        try {
            setIsLoading(true);
            const offset = (page - 1) * pageSize;

            // Load audit logs and stats in parallel
            const [logs, statsData, totalCount] = await Promise.all([
                AuditLogService.getAuditLogs(documentId, pageSize, offset),
                AuditLogService.getAuditStats(documentId),
                AuditLogService.getAuditLogs(documentId, 1000, 0) // Get total count
            ]);

            setAuditLogs(logs);
            setStats(statsData);
            setTotalRecords(totalCount.length);
            setTotalPages(Math.ceil(totalCount.length / pageSize));
        } catch (error) {
            console.error('Error loading audit data:', error);
            toast.error('Failed to load audit data');
        } finally {
            setIsLoading(false);
        }
    };
    const filteredAuditLogs = Array.isArray(auditLogs) ? auditLogs.filter((logs) => (
        logs.user_profiles?.first_name?.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase()) ||
        logs.user_profiles?.last_name?.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase()) ||
        logs?.user_profiles?.email?.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase())
    )) : [];
    const handleRefresh = async () => {
        try {
            setIsRefreshing(true);
            await loadAuditData(currentPage);
            toast.success('Audit data refreshed');
        } catch (error) {
            toast.error('Failed to refresh audit data');
        } finally {
            setIsRefreshing(false);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadAuditData(page);
    };

    // Load data when dialog opens
    useEffect(() => {
        if (open && documentId) {
            setCurrentPage(1);
            loadAuditData(1);
        }
    }, [open, documentId]);

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionColor = (action: string) => {
        switch (action.toLowerCase()) {
            case 'view':
                return 'bg-slate-100 text-slate-700 border border-slate-200';
            case 'edit':
                return 'bg-gray-100 text-gray-700 border border-gray-200';
            case 'comment':
                return 'bg-zinc-100 text-zinc-700 border border-zinc-200';
            case 'review':
                return 'bg-stone-100 text-stone-700 border border-stone-200';
            case 'download':
                return 'bg-neutral-100 text-neutral-700 border border-neutral-200';
            case 'annotate':
                return 'bg-blue-100 text-blue-700 border border-blue-200';
            case 'status_change':
                return 'bg-purple-100 text-purple-700 border border-purple-200';
            default:
                return 'bg-gray-100 text-gray-600 border border-gray-200';
        }
    };

    const getActionIcon = (action: string) => {
        switch (action.toLowerCase()) {
            case 'view':
                return <Eye className="h-3.5 w-3.5" />;
            case 'edit':
                return <Edit3 className="h-3.5 w-3.5" />;
            case 'comment':
                return <MessageSquare className="h-3.5 w-3.5" />;
            case 'review':
                return <Users className="h-3.5 w-3.5" />;
            case 'download':
                return <Download className="h-3.5 w-3.5" />;
            case 'annotate':
                return <Edit3 className="h-3.5 w-3.5" />;
            case 'status_change':
                return <TrendingUp className="h-3.5 w-3.5" />;
            default:
                return <Activity className="h-3.5 w-3.5" />;
        }
    };

    const parseUserAgent = (userAgent: string) => {
        const browser = userAgent

        return { browser };
    };

    const getUserInitials = (firstName: string, lastName: string) => {
        return `${firstName?.charAt(0)}${lastName?.charAt(0)}`.toUpperCase();
    };

    const getUserColor = (userId: string) => {
        const colors = [
            'bg-slate-200 text-slate-700',
            'bg-gray-200 text-gray-700',
            'bg-zinc-200 text-zinc-700',
            'bg-stone-200 text-stone-700',
            'bg-neutral-200 text-neutral-700',
            'bg-slate-300 text-slate-800',
        ];
        const index = userId.charCodeAt(userId.length - 1) % colors.length;
        return colors[index];
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-6xl max-h-[95vh] p-0 flex flex-col bg-white border border-gray-200 shadow-2xl">
                {/* Clean White Header */}
                <DialogHeader className="px-8 py-6 bg-white border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                <Shield className="h-7 w-7 text-gray-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-bold text-gray-900 mb-1">
                                    Document Audit Log
                                </DialogTitle>
                                <p className="text-gray-500 text-sm font-medium">
                                    {documentName} • Activity Tracking & Access History
                                </p>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto bg-gray-50">
                    {/* Clean Stats Dashboard */}
                    <div className="px-8 py-6 bg-white border-b border-gray-100">
                        {isLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                {[...Array(2)].map((_, i) => (
                                    <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-pulse">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                                <div className="h-8 bg-gray-200 rounded"></div>
                                            </div>
                                            <div className="p-3 bg-gray-200 rounded-xl w-12 h-12"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-500 text-sm font-medium mb-1">Total Views</p>
                                            <p className="text-3xl font-bold text-gray-900">{stats?.total_views || 0}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <Eye className="h-6 w-6 text-gray-600" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-500 text-sm font-medium mb-1">Users</p>
                                            <p className="text-3xl font-bold text-gray-900">{stats?.unique_users || 0}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <Users className="h-6 w-6 text-gray-600" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Table Section */}
                    <div className="flex-1 px-8 py-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 font-medium">Loading audit logs...</p>
                                </div>
                            </div>
                        ) : auditLogs.length === 0 ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <div className="p-6 bg-gray-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                                        <Activity className="h-12 w-12 text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Activity Yet</h3>
                                    <p className="text-gray-600">This document hasn't been accessed yet.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg border border-gray-200">
                                <div className="flex mt-2 w-[200px] mr-2">
                                    <div className="relative flex-1 w-[200px]">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                        <Input
                                            placeholder="Search user activity..."
                                            className="pl-10"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto mt-4">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50">
                                                <TableHead className="font-semibold text-gray-700">User</TableHead>
                                                <TableHead className="font-semibold text-gray-700">Action</TableHead>
                                                <TableHead className="font-semibold text-gray-700">Date & Time</TableHead>
                                                <TableHead className="font-semibold text-gray-700">IP Address</TableHead>
                                                <TableHead className="font-semibold text-gray-700">Platform</TableHead>
                                                <TableHead className="font-semibold text-gray-700">Session Time</TableHead>
                                                <TableHead className="font-semibold text-gray-700">Activity</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredAuditLogs.map((log) => {
                                                const { browser } = parseUserAgent(log.user_agent || '');
                                                const userName = log.user_profiles
                                                    ? `${log.user_profiles.first_name} ${log.user_profiles.last_name}`
                                                    : 'Unknown User';
                                                const userInitials = log.user_profiles
                                                    ? getUserInitials(log.user_profiles.first_name, log.user_profiles.last_name)
                                                    : 'UN';

                                                return (
                                                    <TableRow key={log.id} className="hover:bg-gray-50">
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-full ${getUserColor(log.user_id)} flex items-center justify-center font-bold text-sm border border-gray-200`}>
                                                                    {userInitials}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-gray-900">{userName}</p>
                                                                    <p className="text-sm text-gray-500">{log.user_profiles?.email}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={`${getActionColor(log.action)} px-2 py-1 rounded-full font-medium text-xs`}>
                                                                {getActionIcon(log.action)}
                                                                <span className="ml-1 capitalize">{log.action.replace('_', ' ')}</span>
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">{formatDate(log.created_at)}</p>
                                                                <p className="text-xs text-gray-500">{formatTime(log.created_at)}</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <p className="text-sm font-mono text-gray-900">{log.ip_address || 'Unknown'}</p>
                                                        </TableCell>
                                                        <TableCell>
                                                            <p className="text-sm text-gray-900">{browser}</p>
                                                        </TableCell>
                                                        <TableCell>
                                                            {log.duration_seconds && log.duration_seconds > 0 ? (
                                                                <p className="text-sm text-gray-900">{formatDuration(log.duration_seconds)}</p>
                                                            ) : (
                                                                <p className="text-sm text-gray-500">-</p>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                {log.page_views && log.page_views > 0 && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {log.page_views} pages
                                                                    </Badge>
                                                                )}
                                                                {log.annotations_created && log.annotations_created > 0 && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {log.annotations_created} annotations
                                                                    </Badge>
                                                                )}
                                                                {log.comments_added && log.comments_added > 0 && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {log.comments_added} comments
                                                                    </Badge>
                                                                )}
                                                                {log.reviews_created && log.reviews_created > 0 && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {log.reviews_created} reviews
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {!isLoading && auditLogs.length > 0 && (
                        <div className="px-8 py-4 bg-white border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(1)}
                                        disabled={currentPage === 1}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                                            if (page > totalPages) return null;

                                            return (
                                                <Button
                                                    key={page}
                                                    variant={currentPage === page ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handlePageChange(page)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    {page}
                                                </Button>
                                            );
                                        })}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronsRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Clean White Footer */}
                <DialogFooter className="px-8 py-6 bg-white border-t border-gray-100">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Zap className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">
                                {totalRecords} activity records • {stats?.unique_users || 0} unique users
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="rounded-xl border-gray-200 hover:bg-gray-50 text-gray-700"
                            >
                                {isRefreshing ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                )}
                                Refresh
                            </Button>
                            <Button
                                onClick={() => onOpenChange(false)}
                                className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}