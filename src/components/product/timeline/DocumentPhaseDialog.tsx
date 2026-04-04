import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    Button,
    Box,
    Typography,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Tabs,
    Tab,
    CircularProgress,
    Alert,
    IconButton,
    Tooltip,
    Avatar,
    Stack,
    Card,
    CardContent,
    LinearProgress,
    Badge,
    Fade,
    Slide,
    Grid
} from '@mui/material';
import {
    Description,
    CheckCircle,
    Pending,
    Close,
    FilterList,
    Download,
    Visibility,
    InsertDriveFile,
    Schedule,
    Person,
    CalendarToday,
    CloudDownload,
    Assessment,
    ErrorOutline,
    HourglassEmpty,
    FolderOpen,
    Assignment
} from '@mui/icons-material';
import { format } from 'date-fns';
import { GanttPhaseDocumentService, GanttPhaseDocument, PhaseDocumentSummary } from '@/services/ganttPhaseDocumentService';

interface DocumentPhaseDialogProps {
    open: boolean;
    onClose: () => void;
    documentName: string;
    phaseId: string;
    phaseName: string;
    companyId: string;
    productId?: string;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`document-tabpanel-${index}`}
            aria-labelledby={`document-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Fade in={value === index} timeout={300}>
                    <Box sx={{ p: 0 }}>{children}</Box>
                </Fade>
            )}
        </div>
    );
}

export function DocumentPhaseDialog({
    open,
    onClose,
    documentName,
    phaseId,
    phaseName,
    companyId,
    productId
}: DocumentPhaseDialogProps) {
    const [phaseSummary, setPhaseSummary] = useState<PhaseDocumentSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        if (open && phaseId) {
            fetchPhaseDocuments();
        }
    }, [open, phaseId, companyId, productId]);

    const fetchPhaseDocuments = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('Fetching phase documents for:', { phaseId, phaseName, companyId, productId });
            
            const summary = await GanttPhaseDocumentService.getPhaseDocumentSummary(
                phaseId, 
                companyId, 
                productId
            );
            
            setPhaseSummary(summary);
        } catch (err) {
            console.error('Error fetching phase documents:', err);
            setError('Failed to load phase documents');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'approved':
            case 'complete':
            case 'finished':
                return 'success';
            case 'pending':
            case 'under review':
            case 'in_review':
            case 'in progress':
                return 'warning';
            case 'draft':
            case 'not started':
            case 'not_required':
                return 'default';
            case 'overdue':
            case 'rejected':
                return 'error';
            default:
                return 'default';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'approved':
            case 'complete':
            case 'finished':
                return <CheckCircle color="success" />;
            case 'pending':
            case 'under review':
            case 'in_review':
            case 'in progress':
                return <HourglassEmpty color="warning" />;
            case 'overdue':
            case 'rejected':
                return <ErrorOutline color="error" />;
            default:
                return <Description />;
        }
    };

    const filteredDocuments = phaseSummary?.documents.filter(doc => {
        if (tabValue === 0) return true; // All documents
        if (tabValue === 1) {
            const status = doc.status?.toLowerCase();
            const isApproved = status === 'approved' ||
                status === 'completed' ||
                status === 'complete' ||
                status === 'finished';
            return !isApproved; // Show remaining documents (not approved)
        }
        return true;
    }) || [];

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    maxHeight: '90vh',
                    borderRadius: 3,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }
            }}
            TransitionComponent={Slide}
        >
            <DialogTitle sx={{
                m: 0,
                p: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '12px 12px 0 0'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" component="div" sx={{ fontWeight: 600, mb: 1 }}>
                            Phase Documents: {phaseName}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                            Documents assigned to this phase
                        </Typography>
                        {phaseSummary && (
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    {phaseSummary.totalDocuments} total documents
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Assessment sx={{ fontSize: 16 }} />
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        {phaseSummary.completedDocuments} completed • {phaseSummary.remainingDocuments} remaining
                                    </Typography>
                                </Box>
                            </Stack>
                        )}
                        {phaseSummary && phaseSummary.totalDocuments > 0 && (
                            <Box sx={{ mt: 2, maxWidth: 300 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={phaseSummary.completionRate}
                                    sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        '& .MuiLinearProgress-bar': {
                                            backgroundColor: 'rgba(255,255,255,0.9)',
                                            borderRadius: 4
                                        }
                                    }}
                                />
                            </Box>
                        )}
                    </Box>
                    <IconButton
                        aria-label="close"
                        onClick={onClose}
                        sx={{
                            color: 'rgba(255,255,255,0.8)',
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                color: 'white'
                            }
                        }}
                    >
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 0, backgroundColor: '#f8fafc' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 6 }}>
                        <CircularProgress size={60} thickness={4} />
                        <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
                            Loading phase documents...
                        </Typography>
                    </Box>
                ) : error ? (
                    <Alert
                        severity="error"
                        sx={{
                            m: 3,
                            borderRadius: 2,
                            '& .MuiAlert-icon': {
                                fontSize: 28
                            }
                        }}
                    >
                        <Typography variant="h6">Error Loading Documents</Typography>
                        {error}
                    </Alert>
                ) : !phaseSummary || phaseSummary.documents.length === 0 ? (
                    <Box sx={{ p: 6, textAlign: 'center' }}>
                        <Avatar sx={{
                            width: 80,
                            height: 80,
                            mx: 'auto',
                            mb: 3,
                            backgroundColor: 'primary.50',
                            color: 'primary.main'
                        }}>
                            <FolderOpen sx={{ fontSize: 40 }} />
                        </Avatar>
                        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                            No documents found
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                            No documents are currently assigned to the "{phaseName}" phase.
                            Documents will appear here once they are added to this phase.
                        </Typography>
                    </Box>
                ) : (
                    <Box>
                        <Box sx={{
                            borderBottom: 1,
                            borderColor: 'divider',
                            backgroundColor: 'white',
                            px: 3
                        }}>
                            <Tabs
                                value={tabValue}
                                onChange={handleTabChange}
                                aria-label="document tabs"
                                sx={{
                                    '& .MuiTab-root': {
                                        minHeight: 60,
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                        fontWeight: 500
                                    }
                                }}
                            >
                                <Tab
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                            <InsertDriveFile />
                                            All Documents
                                            <Badge badgeContent={phaseSummary.totalDocuments} color="primary" />
                                        </Box>
                                    }
                                />
                                <Tab
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                            <Pending />
                                            Remaining
                                            <Badge badgeContent={phaseSummary.remainingDocuments} color="warning" />
                                        </Box>
                                    }
                                />
                            </Tabs>
                        </Box>

                        <TabPanel value={tabValue} index={0}>
                            <DocumentList documents={filteredDocuments} />
                        </TabPanel>
                        <TabPanel value={tabValue} index={1}>
                            <DocumentList documents={filteredDocuments} />
                        </TabPanel>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{
                p: 3,
                backgroundColor: 'white',
                borderTop: 1,
                borderColor: 'divider'
            }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    size="large"
                    sx={{
                        minWidth: 120,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600
                    }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

interface DocumentListProps {
    documents: GanttPhaseDocument[];
}

function DocumentList({ documents }: DocumentListProps) {
    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'approved':
            case 'complete':
            case 'finished':
                return 'success';
            case 'pending':
            case 'under review':
            case 'in_review':
            case 'in progress':
                return 'warning';
            case 'draft':
            case 'not started':
            case 'not_required':
                return 'default';
            case 'overdue':
            case 'rejected':
                return 'error';
            default:
                return 'default';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'approved':
            case 'complete':
            case 'finished':
                return <CheckCircle color="success" />;
            case 'pending':
            case 'under review':
            case 'in_review':
            case 'in progress':
                return <HourglassEmpty color="warning" />;
            case 'overdue':
            case 'rejected':
                return <ErrorOutline color="error" />;
            default:
                return <Description />;
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (documents.length === 0) {
        return (
            <Box sx={{ p: 6, textAlign: 'center' }}>
                <Avatar sx={{
                    width: 60,
                    height: 60,
                    mx: 'auto',
                    mb: 2,
                    backgroundColor: 'grey.100',
                    color: 'grey.400'
                }}>
                    <FilterList sx={{ fontSize: 30 }} />
                </Avatar>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
                    No documents match this filter
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Try switching to a different tab to see more documents
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Stack spacing={2}>
                {documents.map((doc, index) => (
                    <Fade in={true} timeout={300 + index * 50} key={doc.id}>
                        <Card
                            elevation={0}
                            sx={{
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 3,
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                                    transform: 'translateY(-2px)'
                                }
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                    <Avatar sx={{
                                        backgroundColor: `${getStatusColor(doc.status)}.50`,
                                        color: `${getStatusColor(doc.status)}.main`,
                                        width: 48,
                                        height: 48
                                    }}>
                                        {getStatusIcon(doc.status)}
                                    </Avatar>

                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                                                {doc.name}
                                            </Typography>
                                            <Chip
                                                label={doc.status || 'Not Started'}
                                                color={getStatusColor(doc.status) as any}
                                                size="small"
                                                sx={{ fontWeight: 500 }}
                                            />
                                            {doc.document_type && (
                                                <Chip
                                                    label={doc.document_type}
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{ borderRadius: 2 }}
                                                />
                                            )}
                                        </Box>

                                        {doc.description && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                                                {doc.description}
                                            </Typography>
                                        )}

                                        <Stack direction="row" spacing={3} flexWrap="wrap">
                                            {doc.due_date && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="caption" color="text.secondary">
                                                        Due {format(new Date(doc.due_date), 'MMM dd, yyyy')}
                                                    </Typography>
                                                </Box>
                                            )}
                                            {doc.uploaded_at && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="caption" color="text.secondary">
                                                        Uploaded {format(new Date(doc.uploaded_at), 'MMM dd, yyyy')}
                                                    </Typography>
                                                </Box>
                                            )}
                                            {doc.file_size && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <CloudDownload sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {formatFileSize(doc.file_size)}
                                                    </Typography>
                                                </Box>
                                            )}
                                            {doc.uploaded_by && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="caption" color=" 'text.secondary'">
                                                        {doc.uploaded_by}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Stack>
                                    </Box>

                                    {(doc.file_name || doc.file_path) && (
                                        <Stack direction="row" spacing={1}>
                                            <Tooltip title="View document" arrow>
                                                <IconButton
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: 'primary.50',
                                                        color: 'primary.main',
                                                        '&:hover': {
                                                            backgroundColor: 'primary.100'
                                                        }
                                                    }}
                                                >
                                                    <Visibility />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Download" arrow>
                                                <IconButton
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: 'grey.50',
                                                        color: 'grey.600',
                                                        '&:hover': {
                                                            backgroundColor: 'grey.100'
                                                        }
                                                    }}
                                                >
                                                    <Download />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Fade>
                ))}
            </Stack>
        </Box>
    );
}
