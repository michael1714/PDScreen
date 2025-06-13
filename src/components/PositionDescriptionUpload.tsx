import React, { useState, useRef } from 'react';
import { Button, TextField, Box, Typography, Alert, CircularProgress, LinearProgress, Paper } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

interface PositionDescription {
    id: number;
    title: string;
    file_name: string;
    upload_date: string;
    status: string;
}

const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <PictureAsPdfIcon color="error" sx={{ mr: 1 }} />;
    if (ext === 'doc' || ext === 'docx') return <DescriptionIcon color="primary" sx={{ mr: 1 }} />;
    return <DescriptionIcon sx={{ mr: 1 }} />;
};

const PositionDescriptionUpload: React.FC = () => {
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setFile(event.target.files[0]);
            setError(null);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setDragActive(false);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setDragActive(false);
        if (event.dataTransfer.files && event.dataTransfer.files[0]) {
            setFile(event.dataTransfer.files[0]);
            setError(null);
        }
    };

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!file || !title) {
            setError('Please provide both a title and a file');
            return;
        }

        setLoading(true);
        setProgress(0);
        setError(null);
        setSuccess(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);

        try {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', 'http://localhost:3000/api/upload');

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    setProgress(Math.round((event.loaded / event.total) * 100));
                }
            };

            xhr.onload = () => {
                setLoading(false);
                if (xhr.status === 201) {
                    setSuccess('File uploaded successfully!');
                    setTitle('');
                    setFile(null);
                    setProgress(0);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                } else {
                    setError('Failed to upload file. Please try again.');
                }
            };

            xhr.onerror = () => {
                setLoading(false);
                setError('Failed to upload file. Please try again.');
            };

            xhr.send(formData);
        } catch (err) {
            setLoading(false);
            setError('Failed to upload file. Please try again.');
        }
    };

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Upload Position Description
            </Typography>

            <form onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    margin="normal"
                    required
                />

                <Paper
                    elevation={dragActive ? 8 : 2}
                    sx={{
                        mt: 2,
                        mb: 2,
                        p: 2,
                        border: dragActive ? '2px dashed #1976d2' : '2px dashed #ccc',
                        background: dragActive ? '#e3f2fd' : '#fafafa',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'border 0.2s, background 0.2s',
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleBrowseClick}
                >
                    <input
                        accept=".pdf,.doc,.docx"
                        style={{ display: 'none' }}
                        id="file-upload"
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />
                    <CloudUploadIcon sx={{ fontSize: 40, color: dragActive ? '#1976d2' : '#90caf9' }} />
                    <Typography variant="body1" sx={{ mt: 1 }}>
                        Drag & drop a file here, or click to browse
                    </Typography>
                    {file && (
                        <Box display="flex" alignItems="center" justifyContent="center" sx={{ mt: 2 }}>
                            {getFileIcon(file.name)}
                            <Typography variant="body2">{file.name}</Typography>
                        </Box>
                    )}
                </Paper>

                {loading && (
                    <Box sx={{ width: '100%', mb: 2 }}>
                        <LinearProgress variant="determinate" value={progress} />
                        <Typography variant="caption" display="block" align="center">{progress}%</Typography>
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        {success}
                    </Alert>
                )}

                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={loading}
                    sx={{ mt: 2 }}
                >
                    {loading ? <CircularProgress size={24} /> : 'Upload'}
                </Button>
            </form>
        </Box>
    );
};

export default PositionDescriptionUpload; 