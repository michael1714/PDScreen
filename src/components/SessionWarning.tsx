import React, { useState, useEffect } from 'react';
import {
    Alert,
    Button,
    Snackbar,
    Box,
    Typography,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const SessionWarning: React.FC = () => {
    const { showSessionWarning, sessionTimeout, dismissSessionWarning, logout } = useAuth();
    const [timeLeft, setTimeLeft] = useState<number>(0);

    useEffect(() => {
        if (!showSessionWarning || !sessionTimeout) return;

        const updateTimeLeft = () => {
            const now = Date.now();
            const remaining = Math.max(0, sessionTimeout - now);
            setTimeLeft(remaining);
        };

        updateTimeLeft();
        const interval = setInterval(updateTimeLeft, 1000);

        return () => clearInterval(interval);
    }, [showSessionWarning, sessionTimeout]);

    const formatTimeLeft = (ms: number): string => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleExtendSession = () => {
        // For now, just dismiss the warning
        // In a real implementation, you would call an API to refresh the token
        dismissSessionWarning();
    };

    const handleLogout = () => {
        logout();
    };

    if (!showSessionWarning) return null;

    return (
        <Snackbar
            open={showSessionWarning}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            sx={{ mt: 8 }}
        >
            <Alert
                severity="warning"
                action={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            color="inherit"
                            size="small"
                            onClick={handleExtendSession}
                            variant="outlined"
                        >
                            Stay Logged In
                        </Button>
                        <Button
                            color="inherit"
                            size="small"
                            onClick={handleLogout}
                            variant="outlined"
                        >
                            Logout
                        </Button>
                    </Box>
                }
                sx={{ width: '100%' }}
            >
                <Typography variant="body2">
                    Your session will expire in {formatTimeLeft(timeLeft)}. 
                    Please save your work and log in again if needed.
                </Typography>
            </Alert>
        </Snackbar>
    );
};

export default SessionWarning; 