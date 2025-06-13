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
    Alert
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
                            <TableCell>Title</TableCell>
                            <TableCell>File Name</TableCell>
                            <TableCell>Upload Date</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {descriptions.map((description) => (
                            <TableRow key={description.id}>
                                <TableCell>{description.title}</TableCell>
                                <TableCell>{description.file_name}</TableCell>
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
                                <TableCell colSpan={5} align="center">
                                    No position descriptions found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default PositionDescriptionList; 