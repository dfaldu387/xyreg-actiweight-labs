import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Box,
    Typography,
    Chip,
    ListItemText,
    Checkbox,
    OutlinedInput,
    SelectChangeEvent
} from '@mui/material';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { ReviewerGroup, ReviewerGroupService } from '@/services/reviewerGroupService';
import { useReviewerGroups } from '@/hooks/useReviewerGroups';

interface EditReviewGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGroupUpdate: (groupId: string, group: Partial<ReviewerGroup>) => void;
    group: ReviewerGroup | null;
    companyId: string;
}

export function EditReviewGroupDialog({
    open,
    onOpenChange,
    onGroupUpdate,
    group,
    companyId,
}: EditReviewGroupDialogProps) {
    const [groupName, setGroupName] = useState('');
    const [description, setDescription] = useState('');
    const [groupType, setGroupType] = useState<'internal' | 'external' | 'regulatory'>('external');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [color, setColor] = useState('#10b981');
    const [isDefault, setIsDefault] = useState(false);
    const [requireAllApprovals, setRequireAllApprovals] = useState(false);
    const [allowSelfAssignment, setAllowSelfAssignment] = useState(false);
    const [enableNotifications, setEnableNotifications] = useState(true);
    const [defaultDeadlineDays, setDefaultDeadlineDays] = useState(10);
    const [canDownload, setCanDownload] = useState(true);
    const [canComment, setCanComment] = useState(true);
    const [canUpload, setCanUpload] = useState(false);
    const [canApprove, setCanApprove] = useState(false);
    const [canViewInternal, setCanViewInternal] = useState(false);
    const { users, isLoading } = useCompanyUsers(companyId);
    const { updateGroup, refetch } = useReviewerGroups(companyId);

    // Populate form when group changes
    useEffect(() => {
        if (group) {
            setGroupName(group.name || '');
            setDescription(group.description || '');
            setGroupType(group.group_type || 'external');
            setColor(group.color || '#10b981');
            setIsDefault(group.is_default || false);
            setRequireAllApprovals(group.settings?.requireAllApprovals || false);
            setAllowSelfAssignment(group.settings?.allowSelfAssignment || false);
            setEnableNotifications(group.settings?.enableNotifications || true);
            setDefaultDeadlineDays(group.settings?.defaultDeadlineDays || 10);
            setCanDownload(group.permissions?.canDownload || true);
            setCanComment(group.permissions?.canComment || true);
            setCanUpload(group.permissions?.canUpload || false);
            setCanApprove(group.permissions?.canApprove || false);
            setCanViewInternal(group.permissions?.canViewInternal || false);
            setSelectedUsers(group.members?.map(member => member.user_id || member.id) || []);
        }
    }, [group]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!groupName.trim() || !group) {
            return;
        }

        // Create the updated group object
        const updatedGroup: Partial<ReviewerGroup> = {
            name: groupName.trim(),
            description: description.trim(),
            group_type: groupType,
            color,
            is_default: isDefault,
            permissions: {
                canDownload,
                canComment,
                canUpload,
                canApprove,
                canViewInternal,
            },
            settings: {
                requireAllApprovals,
                allowSelfAssignment,
                enableNotifications,
                defaultDeadlineDays,
            },
        };
        const reviewerGroupService = new ReviewerGroupService();
        const toAdd = selectedUsers.filter(id => !group.members?.some(member => member.user_id === id));
        const toRemove = group.members?.filter(member => !selectedUsers.includes(member.user_id)).map(member => member.user_id) || [];

        // Add new members
        for (const userId of toAdd) {
            await reviewerGroupService.addMemberToGroup(group.id, userId, companyId, {
                role: "reviewer",
                is_lead: false,
                can_approve: false,
                can_request_changes: true,
                can_reject: true,
                notification_preferences: { email: true, in_app: true }
            });
        }
        // Remove members
        for (const userId of toRemove) {
            await reviewerGroupService.removeMemberFromGroup(group.id, userId, companyId);
        }
        const success = await updateGroup(group.id, updatedGroup);
        if (success) {
            // Wait for refetch to complete before closing dialog
            await refetch();
            // Call the parent callback to update the UI
            onGroupUpdate(group.id, updatedGroup);
        }
        // Reset form
        setGroupName('');
        setDescription('');
        setGroupType('external');
        setSelectedUsers([]);
        setColor('#10b981');
        setIsDefault(false);
        setRequireAllApprovals(false);
        setAllowSelfAssignment(false);
        setEnableNotifications(true);
        setDefaultDeadlineDays(10);
        setCanDownload(true);
        setCanComment(true);
        setCanUpload(false);
        setCanApprove(false);
        setCanViewInternal(false);
        onOpenChange(false);
    };

    const handleCancel = () => {
        setGroupName('');
        setDescription('');
        setGroupType('external');
        setSelectedUsers([]);
        setColor('#10b981');
        setIsDefault(false);
        setRequireAllApprovals(false);
        setAllowSelfAssignment(false);
        setEnableNotifications(true);
        setDefaultDeadlineDays(10);
        setCanDownload(true);
        setCanComment(true);
        setCanUpload(false);
        setCanApprove(false);
        setCanViewInternal(false);
        onOpenChange(false);
    };

    const handleUserSelection = (event: SelectChangeEvent<string[]>) => {
        const value = event.target.value;
        setSelectedUsers(typeof value === 'string' ? value.split(',') : value);
    };

    const userOptions = users.map(user => ({
        label: `${user.name} (${user.email})`,
        value: user.id,
    }));

    if (!group) return null;

    return (
        <Dialog
            open={open}
            onClose={() => onOpenChange(false)}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>Edit Review Group</DialogTitle>

            <DialogContent>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            fullWidth
                            label="Group Name"
                            placeholder="Enter group name..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            required
                        />

                        <TextField
                            fullWidth
                            label="Description"
                            placeholder="Enter group description..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            multiline
                            rows={3}
                        />

                        <FormControl fullWidth>
                            <InputLabel>Group Type</InputLabel>
                            <Select
                                value={groupType}
                                label="Group Type"
                                onChange={(e) => setGroupType(e.target.value as 'internal' | 'external' | 'regulatory')}
                            >
                                <MenuItem value="internal">Internal</MenuItem>
                                <MenuItem value="external">External</MenuItem>
                                <MenuItem value="regulatory">Regulatory</MenuItem>
                            </Select>
                        </FormControl>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2">Group Color:</Typography>
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                style={{ width: '50px', height: '40px', border: 'none', borderRadius: '4px' }}
                            />
                        </Box>

                        <Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>Select Users</Typography>
                            {isLoading ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                    <Typography variant="body2" color="text.secondary">Loading users...</Typography>
                                </Box>
                            ) : (
                                <FormControl fullWidth>
                                    <InputLabel>Users</InputLabel>
                                    <Select<string[]>
                                        multiple
                                        value={selectedUsers}
                                        onChange={handleUserSelection}
                                        input={<OutlinedInput label="Users" />}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.length === 0 ? (
                                                    <Typography variant="body2" color="text.secondary">
                                                        No users selected
                                                    </Typography>
                                                ) : (
                                                    selected.map((value) => {
                                                        const user = users.find(u => u.id === value);
                                                        return (
                                                            <Chip
                                                                key={value}
                                                                label={user ? user.name : value}
                                                                size="small"
                                                                onDelete={() => {
                                                                    setSelectedUsers(prev =>
                                                                        prev.filter(id => id !== value)
                                                                    );
                                                                }}
                                                                deleteIcon={<Box component="span" sx={{ fontSize: '14px' }}>×</Box>}
                                                                sx={{
                                                                    backgroundColor: 'primary.main',
                                                                    color: 'white',
                                                                    '& .MuiChip-deleteIcon': {
                                                                        color: 'white',
                                                                        '&:hover': {
                                                                            color: 'rgba(255, 255, 255, 0.8)'
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                        );
                                                    })
                                                )}
                                            </Box>
                                        )}
                                        MenuProps={{
                                            PaperProps: {
                                                style: {
                                                    maxHeight: 200,
                                                    width: '100px',
                                                    minWidth: '30%'
                                                }
                                            }
                                        }}
                                    >
                                        {/* Selection Summary and Actions */}
                                        <Box sx={{
                                            p: 1.5,
                                            borderBottom: 1,
                                            borderColor: 'divider',
                                            backgroundColor: 'grey.50'
                                        }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {selectedUsers.length} of {users.length} users selected
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setSelectedUsers(users.map(u => u.id));
                                                        }}
                                                        sx={{
                                                            fontSize: '0.7rem',
                                                            py: 0.25,
                                                            px: 1,
                                                            minWidth: 'auto'
                                                        }}
                                                    >
                                                        Select All
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setSelectedUsers([]);
                                                        }}
                                                        sx={{
                                                            fontSize: '0.7rem',
                                                            py: 0.25,
                                                            px: 1,
                                                            minWidth: 'auto'
                                                        }}
                                                    >
                                                        Clear All
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </Box>

                                        {/* User Options */}
                                        {userOptions.map((option) => (
                                            <MenuItem
                                                key={option.value}
                                                value={option.value}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    py: 1,
                                                    px: 1.5,
                                                    borderBottom: 1,
                                                    borderColor: 'divider',
                                                    '&:last-child': {
                                                        borderBottom: 'none'
                                                    },
                                                    '&:hover': {
                                                        backgroundColor: 'action.hover'
                                                    },
                                                    '&.Mui-selected': {
                                                        backgroundColor: 'primary.50',
                                                        '&:hover': {
                                                            backgroundColor: 'primary.100'
                                                        }
                                                    }
                                                }}
                                            >
                                                <Checkbox
                                                    checked={selectedUsers.indexOf(option.value) > -1}
                                                    sx={{ mr: 1.5 }}
                                                    color="primary"
                                                    size="small"
                                                />
                                                <ListItemText
                                                    primary={option.label}
                                                    primaryTypographyProps={{
                                                        variant: 'body2',
                                                        sx: {
                                                            fontWeight: selectedUsers.includes(option.value) ? 600 : 400,
                                                            color: selectedUsers.includes(option.value) ? 'primary.main' : 'text.primary',
                                                            fontSize: '0.875rem'
                                                        }
                                                    }}
                                                />
                                            </MenuItem>
                                        ))}

                                        {userOptions.length === 0 && (
                                            <MenuItem disabled sx={{ py: 1.5, textAlign: 'center' }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                    No users available
                                                </Typography>
                                            </MenuItem>
                                        )}
                                    </Select>

                                    {/* Helper text */}
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                        Click to select multiple users. Use Select All/Clear All for bulk operations.
                                    </Typography>
                                </FormControl>
                            )}
                        </Box>

                        <Box>
                            <Typography variant="h6" sx={{ mb: 2 }}>Permissions</Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={canDownload}
                                            onChange={(e) => setCanDownload(e.target.checked)}
                                        />
                                    }
                                    label="Can Download"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={canComment}
                                            onChange={(e) => setCanComment(e.target.checked)}
                                        />
                                    }
                                    label="Can Comment"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={canUpload}
                                            onChange={(e) => setCanUpload(e.target.checked)}
                                        />
                                    }
                                    label="Can Upload"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={canApprove}
                                            onChange={(e) => setCanApprove(e.target.checked)}
                                        />
                                    }
                                    label="Can Approve"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={canViewInternal}
                                            onChange={(e) => setCanViewInternal(e.target.checked)}
                                        />
                                    }
                                    label="Can View Internal"
                                />
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="h6" sx={{ mb: 2 }}>Settings</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={isDefault}
                                            onChange={(e) => setIsDefault(e.target.checked)}
                                        />
                                    }
                                    label="Set as Default Group"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={requireAllApprovals}
                                            onChange={(e) => setRequireAllApprovals(e.target.checked)}
                                        />
                                    }
                                    label="Require All Approvals"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={allowSelfAssignment}
                                            onChange={(e) => setAllowSelfAssignment(e.target.checked)}
                                        />
                                    }
                                    label="Allow Self Assignment"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={enableNotifications}
                                            onChange={(e) => setEnableNotifications(e.target.checked)}
                                        />
                                    }
                                    label="Enable Notifications"
                                />
                                <TextField
                                    fullWidth
                                    label="Default Deadline (Days)"
                                    type="number"
                                    inputProps={{ min: 1, max: 365 }}
                                    value={defaultDeadlineDays}
                                    onChange={(e) => setDefaultDeadlineDays(parseInt(e.target.value) || 10)}
                                />
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleCancel} color="inherit">
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={!groupName.trim()}
                    variant="contained"
                    sx={{
                        backgroundColor: '#000',
                        color: '#fff',
                        '&:hover': {
                            backgroundColor: '#000',
                        }
                    }}
                >
                    Update Group
                </Button>
            </DialogActions>
        </Dialog>
    );
} 