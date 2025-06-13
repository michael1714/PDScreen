import React, { useEffect, useState } from 'react';
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
    Switch
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import Slider from '@mui/material/Slider';
import CloseIcon from '@mui/icons-material/Close';
import TextField from '@mui/material/TextField';

interface PositionDescription {
    id: number;
    title: string;
    file_name: string;
    upload_date: string;
    status: string;
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
                    setOriginalResponsibilities(data);
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
        for (let i = 0; i < responsibilities.length; i++) {
            if (responsibilities[i].responsibility_percentage !== originalResponsibilities[i].responsibility_percentage) {
                return true;
            }
        }
        return false;
    };

    // Handle slider change (UI only)
    const handleSliderChange = (id: number, newValue: number) => {
        setResponsibilities((prev) =>
            prev.map((resp) =>
                resp.id === id ? { ...resp, responsibility_percentage: newValue } : resp
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
                setOriginalResponsibilities(data);
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

    const handleLlmSwitchChange = (id: number) => {
        setLlmSwitchStates((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Position Descriptions
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>File Name</TableCell>
                            <TableCell>Upload Date</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {descriptions.map((description) => (
                            <TableRow key={description.id}>
                                <TableCell>
                                    <a
                                        href="#"
                                        style={{ textDecoration: 'underline', color: '#1976d2', cursor: 'pointer' }}
                                        onClick={e => { e.preventDefault(); handleFileNameClick(description); }}
                                    >
                                        {description.title}
                                    </a>
                                </TableCell>
                                <TableCell>
                                    {new Date(description.upload_date).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{description.status}</TableCell>
                                <TableCell align="right">
                                    <IconButton
                                        onClick={() => handleDownload(description.id, description.file_name)}
                                        color="primary"
                                    >
                                        <DownloadIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => handleDelete(description.id)}
                                        color="error"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {descriptions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    No position descriptions found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Popup Dialog for file preview and responsibilities */}
            <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{selectedDescription?.title}</span>
                    <IconButton aria-label="close" onClick={() => handleDialogClose()} sx={{ color: 'error.main' }}>
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
                                                <TableCell>Description</TableCell>
                                                <TableCell style={{ width: '20%' }}>Percentage</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {responsibilities.map((resp) => (
                                                <TableRow key={resp.id}>
                                                    <TableCell>
                                                        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                                            <Switch
                                                                checked={!!llmSwitchStates[resp.id]}
                                                                onChange={() => handleLlmSwitchChange(resp.id)}
                                                                color="success"
                                                                inputProps={{ 'aria-label': 'LLM wording toggle' }}
                                                                sx={{ '& .MuiSwitch-thumb': { bgcolor: llmSwitchStates[resp.id] ? 'success.main' : 'grey.300' } }}
                                                            />
                                                            <Link href="#" color="inherit">
                                                                <img src="/llm-icon.png" alt="LLM" style={{ width: 32, height: 32 }} />
                                                            </Link>
                                                            <Link href="#" color="inherit" onClick={e => { e.preventDefault(); handleRemoveClick(resp.id); }}>
                                                                <img src="/x-icon.png" alt="X" style={{ width: 32, height: 32 }} />
                                                            </Link>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>{llmSwitchStates[resp.id] ? resp.LLM_Desc : resp.responsibility_name}</TableCell>
                                                    <TableCell>
                                                        <Slider
                                                            value={Math.round(resp.responsibility_percentage)}
                                                            onChange={(_, value) => handleSliderChange(resp.id, value as number)}
                                                            min={0}
                                                            max={100}
                                                            step={1}
                                                            marks
                                                            valueLabelDisplay="auto"
                                                        />
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
        </Box>
    );
};

export default PositionDescriptionList; 