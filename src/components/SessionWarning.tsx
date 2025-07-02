import React, { useState, useEffect } from 'react';
import {
    Alert,
    Button,
    Snackbar,
    Box,
    Typography,
    CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const SessionWarning: React.FC = () => {
    const { showSessionWarning, sessionTimeout, dismissSessionWarning, logout, refreshSession } = useAuth();
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

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

    const handleExtendSession = async () => {
        try {
            setIsRefreshing(true);
            await refreshSession();
            dismissSessionWarning();
        } catch (error) {
            console.error('Failed to extend session:', error);
            // If refresh fails, we should logout
            logout();
        } finally {
            setIsRefreshing(false);
        }
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
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Button
                            color="inherit"
                            size="small"
                            onClick={handleExtendSession}
                            variant="outlined"
                            disabled={isRefreshing}
                            startIcon={isRefreshing ? <CircularProgress size={16} /> : null}
                        >
                            {isRefreshing ? 'Refreshing...' : 'Stay Logged In'}
                        </Button>
                        <Button
                            color="inherit"
                            size="small"
                            onClick={handleLogout}
                            variant="outlined"
                            disabled={isRefreshing}
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