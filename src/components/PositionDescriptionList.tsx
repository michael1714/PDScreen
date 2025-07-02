import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    Tabs,
    Tab,
    DialogActions,
    Button,
    Link,
    Switch,
    Tooltip,
    Card,
    CardContent,
    CardActions,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Grid,
    Chip,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import Slider from '@mui/material/Slider';
import CloseIcon from '@mui/icons-material/Close';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import EditIcon from '@mui/icons-material/Edit';
import DescriptionIcon from '@mui/icons-material/Description';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

interface PositionDescription {
    id: number;
    title: string;
    file_name: string;
    upload_date: string;
    status: string;
    department: string;
    updated_at: string;
    ai_automation_score_sum: number | null;
    ai_automation_missing_count: number;
}

const PositionDescriptionList: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [descriptions, setDescriptions] = useState<PositionDescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedDescription, setSelectedDescription] = useState<PositionDescription | null>(null);
    const [tabIndex, setTabIndex] = useState(0);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [fileLoading, setFileLoading] = useState(false);
    const [responsibilities, setResponsibilities] = useState<any[]>([]);
    const [respLoading, setRespLoading] = useState(false);
    const [originalResponsibilities, setOriginalResponsibilities] = useState<any[]>([]);
    const [showSavePrompt, setShowSavePrompt] = useState(false);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [newRespText, setNewRespText] = useState('');
    const [adding, setAdding] = useState(false);
    const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
    const [removingId, setRemovingId] = useState<number | null>(null);
    const [llmMasterSwitch, setLlmMasterSwitch] = useState(false);
    const [llmConfirmOpen, setLlmConfirmOpen] = useState<{ open: boolean, resp: any | null }>({ open: false, resp: null });
    const [editingDescId, setEditingDescId] = useState<number | null>(null);
    const [editingDescValue, setEditingDescValue] = useState<string>('');
    const [descSaving, setDescSaving] = useState<{ [id: number]: boolean }>({});
    const [editingDescType, setEditingDescType] = useState<'original' | 'llm'>('original');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [responsibilitiesCount, setResponsibilitiesCount] = useState(0);
    const departments = useMemo(() => Array.from(new Set(descriptions.map(item => item.department))), [descriptions]);
    const toggleSortOrder = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const POLL_INTERVAL_MS = 1500;
    const POLL_TIMEOUT_MS = 30000;

    const fetchDescriptions = async () => {
        if (!user) return; // Don't fetch if no user
        setLoading(true);
        try {
            const data = await apiService.get<PositionDescription[]>('/upload');
            setDescriptions(data.data); // Axios wraps response in a data object
        } catch (err) {
            setError('Failed to load position descriptions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDescriptions();
    }, [user]); // Re-run when user changes

    const handleDownload = async (id: number, fileName: string) => {
        try {
            const blob = await apiService.download(`/upload/${id}/download`);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError('Failed to download file');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this position description?')) {
            return;
        }

        try {
            await apiService.delete(`/upload/${id}`);
            setDescriptions(descriptions.filter(desc => desc.id !== id));
        } catch (err) {
            setError('Failed to delete position description');
        }
    };

    const handleFileNameClick = async (description: PositionDescription) => {
        setSelectedDescription(description);
        setDialogOpen(true);
        setTabIndex(0);
        setFileUrl(null);
        setFileLoading(true);
        
        // Fetch responsibilities count immediately for the tab title
        try {
            const respResponse = await apiService.get<any[]>(`/upload/${description.id}/responsibilities`);
            setResponsibilitiesCount(respResponse.data.length);
        } catch (err) {
            console.error("Failed to fetch responsibilities count:", err);
            setResponsibilitiesCount(0);
        }
        
        try {
            const blob = await apiService.download(`/upload/${description.id}/download`);
            setFileUrl(window.URL.createObjectURL(blob));
        } catch (err) {
            console.error("File preview error:", err);
            setFileUrl(null);
            setError('Failed to load file preview.');
        } finally {
            setFileLoading(false);
        }
    };

    const handleDialogClose = (_event?: object, reason?: string) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            return;
        }
        if (hasChanges()) {
            setShowSavePrompt(true);
            return;
        }
        setDialogOpen(false);
        setSelectedDescription(null);
        setFileUrl(null);
    };

    const handleSavePromptClose = () => {
        setShowSavePrompt(false);
        setDialogOpen(false);
        setSelectedDescription(null);
        setFileUrl(null);
    };

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabIndex(newValue);
    };

    useEffect(() => {
        if (dialogOpen && tabIndex === 1 && selectedDescription) {
            setRespLoading(true);
            apiService.get<any[]>(`/upload/${selectedDescription.id}/responsibilities`)
                .then((response: { data: any[] }) => {
                    const data = response.data; // Axios wraps response
                    setResponsibilities(data);
                    setOriginalResponsibilities(data.map((r: any) => ({ ...r })));
                    setResponsibilitiesCount(data.length); // Update count when full responsibilities are loaded
                })
                .catch(() => {
                    setResponsibilities([]);
                    setOriginalResponsibilities([]);
                    setResponsibilitiesCount(0); // Reset count on error
                })
                .then(() => setRespLoading(false));
        }
    }, [dialogOpen, tabIndex, selectedDescription]);

    // Compare responsibilities to see if any changes were made
    const hasChanges = () => {
        if (responsibilities.length !== originalResponsibilities.length) return true;
        const originalMap = new Map(originalResponsibilities.map((r: any) => [r.id, r]));
        for (const resp of responsibilities) {
            const orig = originalMap.get(resp.id);
            if (!orig) return true;
            if (resp.responsibility_percentage !== orig.responsibility_percentage) return true;
            // Add more field comparisons here if needed
        }
        return false;
    };

    // Helper to clamp all responsibilities so total never exceeds 100%
    const clampResponsibilities = (resps: any[]): any[] => {
        let total = 0;
        return resps.map((resp: any) => {
            const maxAllowed = Math.max(0, 100 - total);
            const clamped = Math.min(resp.responsibility_percentage, maxAllowed);
            total += clamped;
            return { ...resp, responsibility_percentage: clamped };
        });
    };

    // On initial load or reset, clamp all values if total > 100
    useEffect(() => {
        if (responsibilities.length > 0) {
            const total = responsibilities.reduce((sum, r) => sum + Number(r.responsibility_percentage), 0);
            if (total > 100) {
                setResponsibilities(clampResponsibilities(responsibilities));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dialogOpen, tabIndex]);

    // Calculate max value for a slider based on other responsibilities
    const calculateAllowedValue = (currentId: number, newValue: number) => {
        const otherTotal = responsibilities
            .filter(r => r.id !== currentId)
            .reduce((sum, r) => sum + Number(r.responsibility_percentage), 0);
        return Math.max(0, Math.min(newValue, 100 - otherTotal));
    };

    // Handle slider change (UI only)
    const handleSliderChange = (id: number, newValue: number) => {
        setResponsibilities((prev) =>
            prev.map((resp) =>
                resp.id === id
                    ? { ...resp, responsibility_percentage: calculateAllowedValue(id, newValue as number) }
                    : resp
            )
        );
    };

    // Calculate total percentage
    const totalPercentage = responsibilities.reduce((sum, r) => sum + Number(r.responsibility_percentage), 0);

    // Save changes to backend
    const handleSavePromptYes = async () => {
        // Find changed responsibilities
        const changed = responsibilities.filter((resp, i) =>
            resp.responsibility_percentage !== originalResponsibilities[i]?.responsibility_percentage
        );
        // Send updates to backend
        await Promise.all(
            changed.map((resp) =>
                apiService.put(`/upload/responsibility/${resp.id}`, { responsibility_percentage: Math.round(resp.responsibility_percentage) })
            )
        );
        setShowSavePrompt(false);
        setDialogOpen(false);
        setSelectedDescription(null);
        setFileUrl(null);
    };

    // Add new responsibility
    const handleAddNew = () => {
        navigate('/upload');
    };

    const handleAddNewResponsibility = async () => {
        if (!selectedDescription || !newRespText.trim()) return;
        setAdding(true);
        try {
            await apiService.post(`/upload/${selectedDescription.id}/responsibilities`, { responsibility_name: newRespText.trim(), responsibility_percentage: 5 });
        setAddDialogOpen(false);
        setNewRespText('');
        // Refresh responsibilities
        setRespLoading(true);
        apiService.get<any[]>(`/upload/${selectedDescription.id}/responsibilities`)
            .then((response: { data: any[] }) => {
                    const data = response.data;
                setResponsibilities(data);
                setOriginalResponsibilities(data.map((r: any) => ({ ...r })));
                setResponsibilitiesCount(data.length); // Update count after adding
            })
            .catch(() => {
                setResponsibilities([]);
                setOriginalResponsibilities([]);
                setResponsibilitiesCount(0); // Reset count on error
            })
                .then(() => setRespLoading(false));
        } catch (err: any) {
            let errorMessage = 'Failed to upload file, please try again.';
            if (err.response && err.response.data && err.response.data.error) {
                errorMessage = `Upload failed: ${err.response.data.error}`;
            } else if (err.message) {
                errorMessage = `Upload failed: ${err.message}`;
            }
            setError(errorMessage);
            console.error('File upload error:', err);
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveClick = (id: number) => {
        setRemovingId(id);
        setRemoveDialogOpen(true);
    };

    const handleRemoveConfirm = async () => {
        if (removingId == null) return;
        // Remove from backend
        await apiService.delete(`/upload/responsibility/${removingId}`);
        // Remove from UI
        const updatedResponsibilities = responsibilities.filter(r => r.id !== removingId);
        setResponsibilities(updatedResponsibilities);
        setOriginalResponsibilities(originalResponsibilities.filter(r => r.id !== removingId));
        setResponsibilitiesCount(updatedResponsibilities.length); // Update count after removal
        setRemoveDialogOpen(false);
        setRemovingId(null);
    };

    const handleRemoveCancel = () => {
        setRemoveDialogOpen(false);
        setRemovingId(null);
    };

    const handleLlmMasterSwitchChange = async () => {
        const newValue = !llmMasterSwitch;
        setLlmMasterSwitch(newValue);
        
        // Update all responsibilities in parallel
        await Promise.all(responsibilities.map(resp =>
            apiService.put(`/upload/responsibility/${resp.id}`, { 
                is_llm_version: newValue,
                responsibility_percentage: resp.responsibility_percentage,
                responsibility_name: resp.responsibility_name,
                LLM_Desc: resp.LLM_Desc
            })
        ));

        // Update local state
        setResponsibilities(responsibilities.map(r => ({ ...r, is_llm_version: newValue })));
    };

    // Update master switch state when individual toggles change
    useEffect(() => {
        if (responsibilities.length > 0) {
            const allLLM = responsibilities.every(r => r.is_llm_version);
            setLlmMasterSwitch(allLLM);
        }
    }, [responsibilities]);

    const handleLlmIconClick = (resp: any) => {
        setLlmConfirmOpen({ open: true, resp });
    };

    const handleLlmConfirm = async () => {
        if (!llmConfirmOpen.resp) return;
        const respId = llmConfirmOpen.resp.id;
        setLlmConfirmOpen({ open: false, resp: null });
        try {
            await apiService.post('/hook', {
                id: respId,
                description: llmConfirmOpen.resp.responsibility_name,
                llm_description: llmConfirmOpen.resp.LLM_Desc
            });
            // Start polling for the updated LLM_Desc
            let elapsed = 0;
            const poll = async () => {
                if (!selectedDescription) return;
                const res = await apiService.get<any[]>(`/upload/${selectedDescription.id}/responsibilities`);
                if (!res.data.length) return;
                const data = res.data;
                const updated = data.find((r: any) => r.id === respId);
                if (updated && updated.LLM_Desc && updated.LLM_Desc !== llmConfirmOpen.resp.LLM_Desc) {
                    // Found update, stop polling and update UI
                    setResponsibilities((prev) => prev.map((r) => (r.id === respId ? { ...r, LLM_Desc: updated.LLM_Desc } : r)));
                } else if (elapsed < POLL_TIMEOUT_MS) {
                    // Continue polling
                    elapsed += POLL_INTERVAL_MS;
                    setTimeout(poll, POLL_INTERVAL_MS);
                } else {
                    // Timeout
                    setError("Timed out waiting for AI description update.");
                }
            };
            poll();
        } catch (error) {
            setError('Failed to process with AI');
            setLlmConfirmOpen({ open: false, resp: null });
        }
    };

    const handleLlmCancel = () => {
        setLlmConfirmOpen({ open: false, resp: null });
        // Refresh responsibilities
        if (selectedDescription) {
            apiService.get<any[]>(`/upload/${selectedDescription.id}/responsibilities`)
                .then((response: { data: any[] }) => {
                    const data = response.data; // Axios wraps response
                    setResponsibilities(data);
                    setOriginalResponsibilities(data.map((r: any) => ({ ...r })));
                })
                .catch(() => {
                    setResponsibilities([]);
                    setOriginalResponsibilities([]);
                });
        }
    };

    const handleCloseClick = () => {
        if (hasChanges()) {
            setShowSavePrompt(true);
        } else {
            handleDialogClose();
        }
    };

    // Handler to start editing
    type DescType = 'original' | 'llm';
    const handleDescEditStart = (id: number, value: string, type: DescType) => {
        setEditingDescId(id);
        setEditingDescValue(value);
        setEditingDescType(type);
    };

    const handleDescEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditingDescValue(e.target.value);
    };

    const handleDescEditSave = async (id: number) => {
        setDescSaving((prev) => ({ ...prev, [id]: true }));
        let url = '';
        let body: any = {};
        if (editingDescType === 'llm') {
            url = `/upload/responsibility/${id}`;
            body = { LLM_Desc: editingDescValue };
        } else {
            url = `/upload/responsibility/${id}`;
            body = { responsibility_name: editingDescValue };
        }
        await apiService.put(url, body);
        // Refresh responsibilities
        if (selectedDescription) {
            apiService.get<any[]>(`/upload/${selectedDescription.id}/responsibilities`)
                .then((response: { data: any[] }) => {
                    const data = response.data; // Axios wraps response
                    setResponsibilities(data);
                    setOriginalResponsibilities(data.map((r: any) => ({ ...r })));
                })
                .catch(() => {
                    setResponsibilities([]);
                    setOriginalResponsibilities([]);
                });
        }
        setDescSaving((prev) => ({ ...prev, [id]: false }));
        setEditingDescId(null);
        setEditingDescValue('');
    };

    const handleDescEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: number) => {
        if (e.key === 'Enter') {
            handleDescEditSave(id);
        } else if (e.key === 'Escape') {
            setEditingDescId(null);
            setEditingDescValue('');
        }
    };

    const filteredAndSortedDescriptions = useMemo(() => {
        let sorted = [...descriptions];

        sorted.sort((a, b) => {
            let compareA: any;
            let compareB: any;

            switch (sortBy) {
                case 'title':
                    compareA = a.title;
                    compareB = b.title;
                    break;
                case 'status':
                    compareA = a.status;
                    compareB = b.status;
                    break;
                case 'ai_score':
                    // Handle null values - treat them as 0 for sorting purposes
                    compareA = a.ai_automation_score_sum !== null ? Number(a.ai_automation_score_sum) : 0;
                    compareB = b.ai_automation_score_sum !== null ? Number(b.ai_automation_score_sum) : 0;
                    break;
                case 'date':
                default:
                    compareA = new Date(a.upload_date);
                    compareB = new Date(b.upload_date);
                    break;
            }

            if (compareA < compareB) {
                return sortOrder === 'asc' ? -1 : 1;
            }
            if (compareA > compareB) {
                return sortOrder === 'asc' ? 1 : -1;
            }
            return 0;
        });

        if (departmentFilter) {
            return sorted.filter(desc => desc.department === departmentFilter);
        }

        return sorted;
    }, [descriptions, sortBy, sortOrder, departmentFilter]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
        <Box sx={{ maxWidth: 1600, mx: 'auto', mt: 4, pt: 3, px: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 4 }}>
                    <FormControl variant="outlined" sx={{ minWidth: 220 }}>
                        <InputLabel id="department-filter-label">Department</InputLabel>
                            <Select
                            labelId="department-filter-label"
                                value={departmentFilter}
                                onChange={(e) => setDepartmentFilter(e.target.value)}
                                label="Department"
                            >
                                <MenuItem value="">All Departments</MenuItem>
                                {departments.map(dept => (
                                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    <FormControl variant="outlined" sx={{ width: 220 }}>
                        <InputLabel id="sort-by-label">Sort By</InputLabel>
                            <Select
                            labelId="sort-by-label"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                label="Sort By"
                            sx={{ textAlign: 'left' }}
                        >
                            <MenuItem value="date" sx={{ justifyContent: 'flex-start' }}>Date</MenuItem>
                            <MenuItem value="title" sx={{ justifyContent: 'flex-start' }}>Title</MenuItem>
                            <MenuItem value="status" sx={{ justifyContent: 'flex-start' }}>Status</MenuItem>
                            <MenuItem value="ai_score" sx={{ justifyContent: 'flex-start' }}>AI Score</MenuItem>
                            </Select>
                        </FormControl>
                        <Button
                            variant="outlined"
                            onClick={toggleSortOrder}
                        sx={{ minWidth: 60, height: 56 }}
                            aria-label={sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'}
                        >
                            {sortOrder === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                        </Button>
            </Box>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
            <Grid container spacing={4} sx={{ padding: '32px' }} alignItems="stretch">
                    {filteredAndSortedDescriptions.map((item) => {
                        const statusColor =
                            item.status === 'Published' ? 'success' :
                            item.status === 'Draft' ? 'warning' :
                            item.status === 'In Review' ? 'info' : 'default';
                    return (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                            <Card 
                                    onClick={() => handleFileNameClick(item)}
                                sx={{
                                        height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        borderRadius: 3,
                                        boxShadow: 2,
                                        cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                        p: 1,
                                    '&:hover': {
                                            transform: 'translateY(-4px) scale(1.02)',
                                            boxShadow: 6,
                                            borderColor: 'primary.main',
                                        },
                                    }}
                                >
                                    <CardContent sx={{ pb: 1 }}>
                                        <Typography
                                            variant="h6"
                                            component="h2"
                                            sx={{ fontWeight: 700, fontSize: '1.15rem', flex: 1, pr: 1, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                            title={item.title}
                                        >
                                        {item.title}
                                    </Typography>
                                        <Chip label={item.status} color={statusColor} size="small" sx={{ fontWeight: 500, textTransform: 'capitalize', mt: 1, mb: 1 }} />
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                            {item.department} &bull; {new Date(item.upload_date).toLocaleDateString()}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            <br />
                                            <strong style={{ fontSize: '1.1rem' }}>
                                                AI Score: {item.ai_automation_score_sum !== null ? `${(Number(item.ai_automation_score_sum) * 100).toFixed(1)}%` : 'N/A'}
                                            </strong>
                                        {item.ai_automation_missing_count > 0 && (
                                            <Tooltip title="Not all responsibilities have been assessed for AI automation">
                                                    <WarningAmberIcon color="warning" fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                                            </Tooltip>
                                        )}
                                        </Typography>
                                </CardContent>
                                    <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }} onClick={e => e.stopPropagation()}>
                                        <IconButton size="small" onClick={() => handleFileNameClick(item)} color="primary">
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleDownload(item.id, item.file_name)} color="primary">
                                        <DownloadIcon />
                                    </IconButton>
                                        <IconButton size="small" onClick={() => handleDelete(item.id)} color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </CardActions>
                            </Card>
                        </Grid>
                    );
                })}
                <Grid item xs={12} sm={6} md={4} lg={3}>
                    <Card 
                        sx={{
                            height: '100%', // Use 100% to fill the stretched grid item
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center', // Center content horizontally
                            justifyContent: 'center', // Center content vertically
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            cursor: 'pointer',
                            border: '2px dashed #ccc',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 3,
                                border: '2px dashed #1976d2',
                                backgroundColor: '#f5f5f5'
                            }
                        }}
                        onClick={handleAddNew}
                    >
                        <CardContent sx={{ textAlign: 'center' }}>
                            <AddIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                            <Typography variant="h6" component="h2" gutterBottom color="primary">
                                Add New Position Description
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Upload a new position description file
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            </Box>
            
            {/* Position Description Detail Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={handleDialogClose}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        maxHeight: '90vh'
                    }
                }}
            >
                {selectedDescription && (
                    <>
                        <DialogTitle sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            borderBottom: '1px solid #e0e0e0',
                            pb: 1, pt: 1, minHeight: 0
                        }}>
                            <Box>
                                <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    {selectedDescription.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0, fontSize: 13 }}>
                                    {selectedDescription.department} • {new Date(selectedDescription.upload_date).toLocaleDateString()}
                                </Typography>
                            </Box>
                            <IconButton onClick={handleCloseClick} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                        
                        <DialogContent sx={{ p: 0 }}>
                            <Tabs 
                                value={tabIndex} 
                                onChange={handleTabChange}
                                sx={{ 
                                    borderBottom: 1, 
                                    borderColor: 'divider',
                                    px: 2,
                                    pt: 0,
                                    minHeight: 0
                                }}
                                TabIndicatorProps={{ sx: { height: 2 } }}
                            >
                                <Tab label="File Preview" sx={{ minHeight: 0, py: 1 }} />
                                <Tab label={`Responsibilities (${responsibilitiesCount})`} sx={{ minHeight: 0, py: 1 }} />
                                <Tab label="Edit" sx={{ minHeight: 0, py: 1 }} />
                    </Tabs>
                            
                            {/* File Preview Tab */}
                    {tabIndex === 0 && (
                                <Box sx={{ p: 2 }}>
                            {fileLoading ? (
                                        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                                    <CircularProgress />
                                </Box>
                            ) : fileUrl ? (
                                    <iframe
                                        src={fileUrl}
                                            style={{
                                                width: '100%',
                                                minHeight: 400,
                                                border: 'none',
                                                borderRadius: 8
                                            }}
                                            title="File Preview"
                                    />
                                ) : (
                                        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                                            <Typography color="text.secondary">
                                                Failed to load file preview
                                    </Typography>
                                        </Box>
                            )}
                        </Box>
                    )}
                            
                            {/* Responsibilities Tab */}
                    {tabIndex === 1 && (
                                <Box sx={{ p: 2 }}>
                            {respLoading ? (
                                        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                                    <CircularProgress />
                                </Box>
                                    ) : (
                                        <Box>
                                            {/* Master LLM Switch and Add Responsibility Button in one row */}
                                            <Box sx={{ mb: 1.5, p: 1.2, bgcolor: 'grey.50', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'space-between' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <AutoFixHighIcon color="primary" fontSize="small" />
                                                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: 15 }}>
                                                        Use AI-Generated Descriptions
                                                    </Typography>
                                                    <Switch
                                                        checked={llmMasterSwitch}
                                                        onChange={handleLlmMasterSwitchChange}
                                                        color="primary"
                                                        size="small"
                                                        sx={{ ml: 1 }}
                                                    />
                                                </Box>
                                                <Button
                                                    variant="contained"
                                                    startIcon={<AddIcon />}
                                                    onClick={() => setAddDialogOpen(true)}
                                                    sx={{ borderRadius: 2, py: 0.5, px: 2, fontSize: 14, minHeight: 0 }}
                                                >
                                                    Add Responsibility
                                                </Button>
                                            </Box>
                                            {/* Total Percentage Display */}
                                            <Box sx={{ mb: 1.5, p: 1.2, bgcolor: totalPercentage === 100 ? 'success.light' : 'error.light', borderRadius: 2 }}>
                                                <Typography 
                                                    variant="body2" 
                                                                        sx={{
                                                        fontWeight: 500, 
                                                        fontSize: 15, 
                                                        color: totalPercentage !== 100 ? 'white' : 'inherit' 
                                                    }}
                                                >
                                                    Total Responsibility Percentage: {totalPercentage.toFixed(1)}%
                                                    {totalPercentage !== 100 && (
                                                        <Typography component="span" sx={{ ml: 1, color: 'white', fontWeight: 600 }}>
                                                            (Must total 100%)
                                                        </Typography>
                                                    )}
                                                </Typography>
                                                        </Box>
                                            {/* Responsibilities List */}
                                            <Box>
                                                {responsibilities.map((resp, index) => (
                                                    <Paper key={resp.id} sx={{ p: 1.5, mb: 1, borderRadius: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Box sx={{ flex: 2, minWidth: 0 }}>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {resp.responsibility_name}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13, wordBreak: 'break-word', whiteSpace: 'normal' }}>
                                                                {resp.is_llm_version ? resp.LLM_Desc : resp.responsibility_name}
                                                            </Typography>
                                                        </Box>
                                                        <Switch
                                                            checked={!!resp.is_llm_version}
                                                            onChange={async (e) => {
                                                                await apiService.put(`/upload/responsibility/${resp.id}`, {
                                                                    is_llm_version: e.target.checked,
                                                                    responsibility_percentage: resp.responsibility_percentage
                                                                });
                                                                // Re-fetch responsibilities to update the description
                                                                if (selectedDescription) {
                                                                    const response = await apiService.get(`/upload/${selectedDescription.id}/responsibilities`);
                                                                    setResponsibilities(response.data as any[]);
                                                                }
                                                            }}
                                                            color="primary"
                                                                size="small"
                                                            inputProps={{ 'aria-label': 'Toggle AI description' }}
                                                            sx={{ mx: 1 }}
                                                        />
                                                        <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'right', fontSize: 13 }}>
                                                            {resp.responsibility_percentage}%
                                                        </Typography>
                                                            <Slider
                                                            value={resp.responsibility_percentage}
                                                                onChange={(_, value) => handleSliderChange(resp.id, value as number)}
                                                                min={0}
                                                                max={100}
                                                            step={5}
                                                            sx={{ flex: 1, mx: 1 }}
                                                            size="small"
                                                        />
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleLlmIconClick(resp)}
                                                            color="primary"
                                                            sx={{ mx: 0.5 }}
                                                        >
                                                            <AutoFixHighIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleRemoveClick(resp.id)}
                                                            color="error"
                                                            sx={{ mx: 0.5 }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Paper>
                                                ))}
                                            </Box>
                                            
                                            {responsibilities.length === 0 && (
                                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                                    <DescriptionIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                                        No Responsibilities Found
                                                    </Typography>
                                <Typography variant="body2" color="text.secondary">
                                                        Add responsibilities to get started
                                </Typography>
                                                </Box>
                                            )}
                            </Box>
                                    )}
                        </Box>
                    )}
                            
                            {/* Edit Tab */}
                            {tabIndex === 2 && selectedDescription && (
                                <Box sx={{ p: 3, maxWidth: 400 }}>
                                    <EditPDForm 
                                        pd={selectedDescription} 
                                        onSave={async (updated) => {
                                            await apiService.put(`/upload/${selectedDescription.id}`, updated);
                                            // Optionally refresh PD list or details here
                                            setSelectedDescription({ ...selectedDescription, ...updated });
                                        }}
                                    />
                                </Box>
                            )}
                </DialogContent>
                        
                        <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
                            <Button onClick={handleDialogClose} color="inherit">
                                Close
                            </Button>
                </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Add Responsibility Dialog */}
            <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add New Responsibility</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Responsibility Name"
                        fullWidth
                        variant="outlined"
                        value={newRespText}
                        onChange={(e) => setNewRespText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddNewResponsibility()}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddDialogOpen(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleAddNewResponsibility} 
                        variant="contained"
                        disabled={!newRespText.trim() || adding}
                    >
                        {adding ? <CircularProgress size={20} /> : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Remove Responsibility Dialog */}
            <Dialog open={removeDialogOpen} onClose={handleRemoveCancel}>
                <DialogTitle>Remove Responsibility</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to remove this responsibility? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleRemoveCancel} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={handleRemoveConfirm} color="error" variant="contained">
                        Remove
                    </Button>
                </DialogActions>
            </Dialog>

            {/* LLM Confirmation Dialog */}
            <Dialog open={llmConfirmOpen.open} onClose={handleLlmCancel}>
                <DialogTitle>Process with AI</DialogTitle>
                <DialogContent>
                    <Typography>
                        This will use AI to enhance the description for: "{llmConfirmOpen.resp?.responsibility_name}"
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleLlmCancel} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={handleLlmConfirm} variant="contained" color="primary">
                        Process
                    </Button>
                </DialogActions>
            </Dialog>
            
            {/* Save Changes Dialog */}
            <Dialog open={showSavePrompt} onClose={() => setShowSavePrompt(false)}>
                <DialogTitle>Save Changes</DialogTitle>
                <DialogContent>
                    <Typography>
                        You have unsaved changes. Do you want to save them before closing?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleSavePromptClose} color="inherit">
                        Don't Save
                    </Button>
                    <Button onClick={handleSavePromptYes} variant="contained" color="primary">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

interface EditPDFormProps {
    pd: { title: string; department: string };
    onSave: (updated: { title: string; department: string }) => Promise<void>;
}

const EditPDForm: React.FC<EditPDFormProps> = ({ pd, onSave }) => {
    const [title, setTitle] = React.useState<string>(pd.title);
    const [department, setDepartment] = React.useState<string>(pd.department);
    const [saving, setSaving] = React.useState<boolean>(false);
    const [departments, setDepartments] = React.useState<{ id: number; name: string }[]>([]);

    React.useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const data = await apiService.getDepartments();
                setDepartments(data.filter(d => d.is_active));
            } catch (err) {
                console.error('Failed to fetch departments:', err);
            }
        };
        fetchDepartments();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        await onSave({ title, department });
        setSaving(false);
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
                label="Position Description Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                fullWidth
                required
            />
            <TextField
                select
                label="Department"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                fullWidth
                required
            >
                {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.name}>{dept.name}</MenuItem>
                ))}
            </TextField>
            <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
            </Button>
        </Box>
    );
};

export default PositionDescriptionList; 