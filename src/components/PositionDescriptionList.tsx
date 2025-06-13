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
    Tab
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';

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

    const handleDialogClose = () => {
        setDialogOpen(false);
        setSelectedDescription(null);
        setFileUrl(null);
    };

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabIndex(newValue);
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
                <DialogTitle>
                    {selectedDescription?.title}
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
                            <Typography variant="body1" color="text.secondary">
                                Responsibilities content will go here.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default PositionDescriptionList; 