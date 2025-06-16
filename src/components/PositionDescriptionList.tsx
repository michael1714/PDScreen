import React, { useEffect, useState, useMemo } from 'react';
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
    InputAdornment,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Chip,
    Stack,
    Grid,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import Slider from '@mui/material/Slider';
import CloseIcon from '@mui/icons-material/Close';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import DescriptionIcon from '@mui/icons-material/Description';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

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
    const [llmSwitchStates, setLlmSwitchStates] = useState<{ [id: number]: boolean }>({});
    const [llmMasterSwitch, setLlmMasterSwitch] = useState(false);
    const [llmLoading, setLlmLoading] = useState<{ [id: number]: boolean }>({});
    const [llmConfirmOpen, setLlmConfirmOpen] = useState<{ open: boolean, resp: any | null }>({ open: false, resp: null });
    const [editingDescId, setEditingDescId] = useState<number | null>(null);
    const [editingDescValue, setEditingDescValue] = useState<string>('');
    const [descSaving, setDescSaving] = useState<{ [id: number]: boolean }>({});
    const [editingDescType, setEditingDescType] = useState<'original' | 'llm'>('original');
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');

    const POLL_INTERVAL_MS = 1500;
    const POLL_TIMEOUT_MS = 30000;

    const fetchDescriptions = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/upload');
            if (!response.ok) {
                throw new Error('Failed to fetch position descriptions');
            }
            const data = await response.json();
            setDescriptions(data);
        } catch (err) {
            setError('Failed to load position descriptions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDescriptions();
    }, []);

    const handleDownload = async (id: number, fileName: string) => {
        try {
            const response = await fetch(`http://localhost:3000/api/upload/${id}/download`);
            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
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
            const response = await fetch(`http://localhost:3000/api/upload/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Delete failed');
            
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
        // Fetch file blob for preview
        try {
            const response = await fetch(`http://localhost:3000/api/upload/${description.id}/download`);
            if (!response.ok) throw new Error('Failed to fetch file');
            const blob = await response.blob();
            setFileUrl(window.URL.createObjectURL(blob));
        } catch (err) {
            setFileUrl(null);
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
            fetch(`http://localhost:3000/api/upload/${selectedDescription.id}/responsibilities`)
                .then(res => res.json())
                .then(data => {
                    setResponsibilities(data);
                    setOriginalResponsibilities(data.map((r: any) => ({ ...r })));
                })
                .catch(() => {
                    setResponsibilities([]);
                    setOriginalResponsibilities([]);
                })
                .finally(() => setRespLoading(false));
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
        return resps.map((resp: any, idx: number) => {
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
                fetch(`http://localhost:3000/api/upload/responsibility/${resp.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ responsibility_percentage: Math.round(resp.responsibility_percentage) })
                })
            )
        );
        setShowSavePrompt(false);
        setDialogOpen(false);
        setSelectedDescription(null);
        setFileUrl(null);
    };

    // Add new responsibility
    const handleAddNew = async () => {
        if (!selectedDescription || !newRespText.trim()) return;
        setAdding(true);
        await fetch(`http://localhost:3000/api/upload/${selectedDescription.id}/responsibilities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ responsibility_name: newRespText.trim() })
        });
        setAddDialogOpen(false);
        setNewRespText('');
        setAdding(false);
        // Refresh responsibilities
        setRespLoading(true);
        fetch(`http://localhost:3000/api/upload/${selectedDescription.id}/responsibilities`)
            .then(res => res.json())
            .then(data => {
                setResponsibilities(data);
                setOriginalResponsibilities(data.map((r: any) => ({ ...r })));
            })
            .catch(() => {
                setResponsibilities([]);
                setOriginalResponsibilities([]);
            })
            .finally(() => setRespLoading(false));
    };

    const handleRemoveClick = (id: number) => {
        setRemovingId(id);
        setRemoveDialogOpen(true);
    };

    const handleRemoveConfirm = async () => {
        if (removingId == null) return;
        // Remove from backend
        await fetch(`http://localhost:3000/api/upload/responsibility/${removingId}`, {
            method: 'DELETE',
        });
        // Remove from UI
        setResponsibilities(responsibilities.filter(r => r.id !== removingId));
        setOriginalResponsibilities(originalResponsibilities.filter(r => r.id !== removingId));
        setRemoveDialogOpen(false);
        setRemovingId(null);
    };

    const handleRemoveCancel = () => {
        setRemoveDialogOpen(false);
        setRemovingId(null);
    };

    const handleLlmSwitchChange = async (id: number) => {
        const resp = responsibilities.find(r => r.id === id);
        if (!resp) return;

        const newValue = !resp.is_llm_version;
        
        try {
            const response = await fetch(`http://localhost:3000/api/upload/responsibility/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    is_llm_version: newValue,
                    responsibility_percentage: resp.responsibility_percentage,
                    responsibility_name: resp.responsibility_name,
                    LLM_Desc: resp.LLM_Desc
                })
            });

            if (!response.ok) throw new Error('Failed to update responsibility');

            // Update local state
            setResponsibilities(responsibilities.map(r =>
                r.id === id ? { ...r, is_llm_version: newValue } : r
            ));
        } catch (error) {
            console.error('Error updating responsibility:', error);
            // Optionally show an error message to the user
        }
    };

    const handleLlmMasterSwitchChange = async () => {
        const newValue = !llmMasterSwitch;
        setLlmMasterSwitch(newValue);
        
        // Update all responsibilities in parallel
        await Promise.all(responsibilities.map(resp =>
            fetch(`http://localhost:3000/api/upload/responsibility/${resp.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    is_llm_version: newValue,
                    responsibility_percentage: resp.responsibility_percentage,
                    responsibility_name: resp.responsibility_name,
                    LLM_Desc: resp.LLM_Desc
                })
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
        setLlmLoading((prev) => ({ ...prev, [respId]: true }));
        setLlmConfirmOpen({ open: false, resp: null });
        try {
            await fetch('https://hook.eu2.make.com/wpuyuxytd4l1cjm0wq21gkso88mabx25', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: respId,
                    description: llmConfirmOpen.resp.responsibility_name,
                    llm_description: llmConfirmOpen.resp.LLM_Desc
                })
            });
            // Start polling for the updated LLM_Desc
            let elapsed = 0;
            const poll = async () => {
                if (!selectedDescription) return;
                const res = await fetch(`http://localhost:3000/api/upload/${selectedDescription.id}/responsibilities`);
                if (!res.ok) return;
                const data = await res.json();
                const updated = data.find((r: any) => r.id === respId);
                if (updated && updated.LLM_Desc && updated.LLM_Desc !== llmConfirmOpen.resp.LLM_Desc) {
                    setResponsibilities(data);
                    setOriginalResponsibilities(data.map((r: any) => ({ ...r })));
                    setLlmLoading((prev) => ({ ...prev, [respId]: false }));
                    setLlmSwitchStates((prev) => ({ ...prev, [respId]: true }));
                    return;
                }
                elapsed += POLL_INTERVAL_MS;
                if (elapsed < POLL_TIMEOUT_MS) {
                    setTimeout(poll, POLL_INTERVAL_MS);
                } else {
                    setLlmLoading((prev) => ({ ...prev, [respId]: false }));
                }
            };
            poll();
        } catch {
            setLlmLoading((prev) => ({ ...prev, [respId]: false }));
        }
    };

    const handleLlmCancel = () => {
        setLlmConfirmOpen({ open: false, resp: null });
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
            url = `http://localhost:3000/api/upload/responsibility/${id}`;
            body = { LLM_Desc: editingDescValue };
        } else {
            url = `http://localhost:3000/api/upload/responsibility/${id}`;
            body = { responsibility_name: editingDescValue };
        }
        await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        // Refresh responsibilities
        if (selectedDescription) {
            const res = await fetch(`http://localhost:3000/api/upload/${selectedDescription.id}/responsibilities`);
            if (res.ok) {
                const data = await res.json();
                setResponsibilities(data);
                setOriginalResponsibilities(data.map((r: any) => ({ ...r })));
            }
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

    // Add filter and sort logic
    const filteredAndSortedData = useMemo(() => {
        let filtered = [...descriptions];
        
        // Apply search
        if (searchQuery) {
            filtered = filtered.filter(item => 
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.department.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        // Apply department filter
        if (departmentFilter) {
            filtered = filtered.filter(item => item.department === departmentFilter);
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
            const order = sortOrder === 'asc' ? 1 : -1;
            switch (sortBy) {
                case 'title':
                    return order * a.title.localeCompare(b.title);
                case 'department':
                    return order * a.department.localeCompare(b.department);
                case 'date':
                default:
                    return order * (new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
            }
        });
        
        return filtered;
    }, [descriptions, searchQuery, departmentFilter, sortBy, sortOrder]);

    // Get unique departments for filter
    const departments = useMemo(() => 
        Array.from(new Set(descriptions.map(item => item.department))),
        [descriptions]
    );

    const toggleSortOrder = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1600, mx: 'auto', mt: 4, p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Position Descriptions
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Search and Filter Section */}
            <Box sx={{ mb: 4 }}>
                <Grid container spacing={2} alignItems="center" justifyContent="center">
                    <Grid item sx={{ flexGrow: 1, minWidth: 150 }}>
                        <FormControl fullWidth size="medium" sx={{ minWidth: 150 }}>
                            <InputLabel>Department</InputLabel>
                            <Select
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
                    </Grid>
                    <Grid item sx={{ flexGrow: 1, minWidth: 150 }}>
                        <FormControl fullWidth size="medium" sx={{ minWidth: 150 }}>
                            <InputLabel>Sort By</InputLabel>
                            <Select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                label="Sort By"
                            >
                                <MenuItem value="date">Date</MenuItem>
                                <MenuItem value="title">Title</MenuItem>
                                <MenuItem value="department">Department</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item sx={{ flexGrow: 0, minWidth: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Button
                            variant="outlined"
                            onClick={toggleSortOrder}
                            sx={{ minWidth: 60, height: 56, ml: 1 }}
                            aria-label={sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'}
                        >
                            {sortOrder === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                        </Button>
                    </Grid>
                </Grid>
            </Box>

            {/* Cards Grid */}
            <Grid container spacing={3}>
                {filteredAndSortedData.map((item) => {
                    let dateLabel = '—';
                    if (item.updated_at) {
                        const d = new Date(item.updated_at);
                        if (!isNaN(d.getTime())) {
                            dateLabel = d.toLocaleDateString();
                        }
                    }
                    return (
                        <Grid item xs={12} sm={6} md={4} key={item.id} component="div">
                            <Card 
                                sx={{ 
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 3
                                    }
                                }}
                            >
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6" component="h2" gutterBottom>
                                        {item.title}
                                    </Typography>
                                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={1} mb={1}>
                                        <Typography variant="body2" color="text.secondary">
                                            AI Score: {item.ai_automation_score_sum !== null && item.ai_automation_score_sum !== undefined ? Number(item.ai_automation_score_sum).toFixed(2) : 'N/A'}
                                        </Typography>
                                        {item.ai_automation_missing_count > 0 && (
                                            <Tooltip title="Not all responsibilities have been assessed for AI automation">
                                                <WarningAmberIcon color="warning" fontSize="small" />
                                            </Tooltip>
                                        )}
                                    </Box>
                                </CardContent>
                                <CardActions>
                                    <Button
                                        size="small"
                                        onClick={() => handleFileNameClick(item)}
                                        startIcon={<DescriptionIcon />}
                                    >
                                        View Details
                                    </Button>
                                    <IconButton
                                        onClick={() => handleDownload(item.id, item.file_name)}
                                        color="primary"
                                    >
                                        <DownloadIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => handleDelete(item.id)}
                                        color="error"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </CardActions>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Popup Dialog for file preview and responsibilities */}
            <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{selectedDescription?.title}</span>
                    <IconButton aria-label="close" onClick={handleCloseClick} sx={{ color: 'error.main' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 2 }}>
                        <Tab label="Preview" />
                        <Tab label="Responsibilities" />
                    </Tabs>
                    {tabIndex === 0 && (
                        <Box sx={{ minHeight: 400 }}>
                            {fileLoading ? (
                                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                                    <CircularProgress />
                                </Box>
                            ) : fileUrl ? (
                                selectedDescription?.file_name.toLowerCase().endsWith('.pdf') ? (
                                    <iframe
                                        src={fileUrl}
                                        title="PDF Preview"
                                        width="100%"
                                        height="500px"
                                        style={{ border: 'none' }}
                                    />
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        Preview not available for this file type.<br />
                                        <a href={fileUrl} target="_blank" rel="noopener noreferrer">Download file</a> to view.
                                    </Typography>
                                )
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No preview available.
                                </Typography>
                            )}
                        </Box>
                    )}
                    {tabIndex === 1 && (
                        <Box sx={{ minHeight: 400, p: 2 }}>
                            <Box mb={3} display="flex" justifyContent="flex-end">
                                <Typography
                                    variant="h5"
                                    sx={{
                                        color: totalPercentage > 100 ? 'error.main' : 'primary.main',
                                        fontWeight: 700,
                                        fontSize: '1.5rem',
                                        textAlign: 'right',
                                    }}
                                >
                                    Total: {Math.round(totalPercentage)}%
                                </Typography>
                            </Box>
                            {respLoading ? (
                                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                                    <CircularProgress />
                                </Box>
                            ) : responsibilities.length > 0 ? (
                                <TableContainer component={Paper}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell style={{ width: '5%' }} />
                                                <TableCell style={{ width: '10%' }} align="center">
                                                    LLM Response
                                                    <Switch
                                                        checked={llmMasterSwitch}
                                                        onChange={handleLlmMasterSwitchChange}
                                                        color="success"
                                                        size="small"
                                                        inputProps={{ 'aria-label': 'Toggle all LLM responses' }}
                                                    />
                                                </TableCell>
                                                <TableCell>Description</TableCell>
                                                <TableCell style={{ width: '20%' }}>Percentage</TableCell>
                                                <TableCell style={{ width: '10%' }} align="center">AI</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {responsibilities.map((resp) => (
                                                <TableRow key={resp.id}>
                                                    <TableCell>
                                                        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                                            <Tooltip title="Ask the LLM to rewrite this responsibility?">
                                                                <span>
                                                                    <IconButton
                                                                        onClick={e => { e.preventDefault(); handleLlmIconClick(resp); }}
                                                                        sx={{
                                                                            color: 'primary.main',
                                                                            '&:hover': {
                                                                                backgroundColor: 'primary.light',
                                                                                color: 'primary.contrastText'
                                                                            }
                                                                        }}
                                                                    >
                                                                        <AutoFixHighIcon />
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>
                                                            <Link href="#" color="inherit" onClick={e => { e.preventDefault(); handleRemoveClick(resp.id); }}>
                                                                <img src="/x-icon.png" alt="X" style={{ width: 32, height: 32 }} />
                                                            </Link>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Switch
                                                            checked={!!resp.is_llm_version}
                                                            onChange={async () => {
                                                                const newValue = !resp.is_llm_version;
                                                                // Update backend
                                                                await fetch(`http://localhost:3000/api/upload/responsibility/${resp.id}`, {
                                                                    method: 'PUT',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ is_llm_version: newValue })
                                                                });
                                                                // Update local state
                                                                setResponsibilities((prev) =>
                                                                    prev.map((r) =>
                                                                        r.id === resp.id ? { ...r, is_llm_version: newValue } : r
                                                                    )
                                                                );
                                                            }}
                                                            color="success"
                                                            inputProps={{ 'aria-label': 'LLM wording toggle' }}
                                                            sx={{ '& .MuiSwitch-thumb': { bgcolor: resp.is_llm_version ? 'success.main' : 'grey.300' } }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {editingDescId === resp.id ? (
                                                            <TextField
                                                                value={editingDescValue}
                                                                onChange={handleDescEditChange}
                                                                onBlur={() => handleDescEditSave(resp.id)}
                                                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleDescEditKeyDown(e, resp.id)}
                                                                size="small"
                                                                autoFocus
                                                                disabled={descSaving[resp.id]}
                                                                fullWidth
                                                            />
                                                        ) : (
                                                            <Box display="flex" alignItems="center">
                                                                <span>
                                                                    {resp.is_llm_version ? resp.LLM_Desc || <i style={{ color: '#aaa' }}>[No LLM description]</i> : resp.responsibility_name}
                                                                </span>
                                                                <IconButton
                                                                    onClick={() => handleDescEditStart(resp.id, resp.is_llm_version ? resp.LLM_Desc : resp.responsibility_name, resp.is_llm_version ? 'llm' : 'original')}
                                                                    sx={{
                                                                        color: 'primary.main',
                                                                        '&:hover': {
                                                                            backgroundColor: 'primary.light',
                                                                            color: 'primary.contrastText'
                                                                        }
                                                                    }}
                                                                >
                                                                    <EditIcon />
                                                                </IconButton>
                                                                {descSaving[resp.id] && <CircularProgress size={18} sx={{ ml: 1 }} />}
                                                            </Box>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box display="flex" alignItems="center" gap={2}>
                                                            <Slider
                                                                value={Math.round(resp.responsibility_percentage)}
                                                                onChange={(_, value) => handleSliderChange(resp.id, value as number)}
                                                                min={0}
                                                                max={100}
                                                                step={1}
                                                                marks
                                                                valueLabelDisplay="auto"
                                                                disabled={totalPercentage >= 100 && resp.responsibility_percentage === 0}
                                                                sx={{ flexGrow: 1 }}
                                                            />
                                                            <Typography variant="body2" sx={{ minWidth: 45, textAlign: 'right' }}>
                                                                {Math.round(resp.responsibility_percentage)}%
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell style={{ width: '10%' }} align="center">
                                                        <Tooltip 
                                                            title={resp.ai_automation_reason || "No explanation provided"} 
                                                            placement="top"
                                                            arrow
                                                        >
                                                            <span>
                                                                {resp.ai_automation_percentage != null && resp.ai_automation_percentage !== undefined
                                                                    ? `${Math.round(resp.ai_automation_percentage)}%`
                                                                    : "Not Yet Assessed"}
                                                            </span>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No responsibilities found.
                                </Typography>
                            )}
                            <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
                                <Button variant="outlined" color="primary" onClick={() => setAddDialogOpen(true)}>
                                    Add New
                                </Button>
                                <Button variant="outlined" color="secondary" onClick={() => setResponsibilities(originalResponsibilities.map(r => ({ ...r })))}>
                                    Reset
                                </Button>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            {/* Save changes prompt */}
            <Dialog open={showSavePrompt} onClose={handleSavePromptClose}>
                <DialogTitle>Unsaved Changes</DialogTitle>
                <DialogContent>
                    <Typography>You have unsaved changes. Do you want to save your changes?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleSavePromptYes} color="primary">Yes</Button>
                    <Button onClick={handleSavePromptClose} color="primary">No</Button>
                </DialogActions>
            </Dialog>

            {/* Add New Responsibility Dialog */}
            <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
                <DialogTitle>Add New Responsibility</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Responsibility Description"
                        type="text"
                        fullWidth
                        value={newRespText}
                        onChange={e => setNewRespText(e.target.value)}
                        disabled={adding}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddDialogOpen(false)} color="secondary" disabled={adding}>Cancel</Button>
                    <Button onClick={handleAddNew} color="primary" disabled={adding || !newRespText.trim()}>
                        {adding ? 'Adding...' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Remove Responsibility Dialog */}
            <Dialog open={removeDialogOpen} onClose={handleRemoveCancel}>
                <DialogTitle>Are you sure you want to remove this?</DialogTitle>
                <DialogActions>
                    <Button onClick={handleRemoveConfirm} color="error">Yes</Button>
                    <Button onClick={handleRemoveCancel} color="primary">No</Button>
                </DialogActions>
            </Dialog>

            {/* LLM Confirmation Dialog */}
            <Dialog open={llmConfirmOpen.open} onClose={handleLlmCancel}>
                <DialogTitle>Are you sure?</DialogTitle>
                <DialogContent>
                    <Typography>Do you want to ask the LLM to rewrite this responsibility?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleLlmConfirm} color="primary">Yes</Button>
                    <Button onClick={handleLlmCancel} color="secondary">No</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PositionDescriptionList; 