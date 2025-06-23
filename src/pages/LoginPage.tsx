import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    CircularProgress,
    Alert,
    Paper,
    Link,
    IconButton,
    InputAdornment,
    FormControlLabel,
    Checkbox,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [redirectMessage, setRedirectMessage] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

    useEffect(() => {
        if (location.state?.message) {
            setRedirectMessage(location.state.message);
            // Clear the state so the message doesn't reappear on refresh
            window.history.replaceState({}, document.title)
        }
    }, [location]);

    const validateForm = () => {
        const errors: {[key: string]: string} = {};
        
        if (!email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = 'Please enter a valid email address';
        }
        
        if (!password) {
            errors.password = 'Password is required';
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        setError(null);

        try {
            const response = await apiService.post('/auth/login', { email, password });
            if (response.data && response.data.accessToken) {
                login(response.data.accessToken);
                
                // Handle remember me functionality
                if (rememberMe) {
                    // Store remember me preference
                    localStorage.setItem('rememberMe', 'true');
                } else {
                    localStorage.removeItem('rememberMe');
                }
                
                navigate('/list'); // Redirect to the list page after login
            } else {
                setError('Login failed: No token received.');
            }
        } catch (err: any) {
            let errorMessage = 'An unexpected error occurred. Please try again.';
            
            if (err.response) {
                if (err.response.status === 401) {
                    errorMessage = 'Invalid email or password. Please try again.';
                } else if (err.response.status === 400) {
                    errorMessage = err.response.data?.error || 'Please check your input and try again.';
                } else if (err.response.status === 429) {
                    errorMessage = 'Too many login attempts. Please try again later.';
                } else {
                    errorMessage = err.response.data?.error || `Server error: ${err.response.status}`;
                }
            } else if (err.request) {
                errorMessage = 'Could not connect to the server. Please check your network connection.';
            } else {
                errorMessage = err.message || 'An unexpected error occurred.';
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        if (field === 'email') {
            setEmail(value);
        } else if (field === 'password') {
            setPassword(value);
        }
        
        // Clear validation errors when user starts typing
        if (validationErrors[field]) {
            setValidationErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={6} sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 2, position: 'relative' }}>
                <IconButton
                    aria-label="close"
                    onClick={() => navigate('/')}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
                <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
                    Sign In
                </Typography>
                {redirectMessage && (
                    <Alert severity="info" sx={{ mt: 2, width: '100%' }}>
                        {redirectMessage}
                    </Alert>
                )}
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={loading}
                        error={!!validationErrors.email}
                        helperText={validationErrors.email}
                        aria-describedby="email-error"
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        disabled={loading}
                        error={!!validationErrors.password}
                        helperText={validationErrors.password}
                        aria-describedby="password-error"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox 
                                value="remember" 
                                color="primary"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                disabled={loading}
                            />
                        }
                        label="Remember me"
                        sx={{ mt: 1 }}
                    />
                    {error && (
                        <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                            {error}
                        </Alert>
                    )}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading}
                        aria-describedby="login-error"
                    >
                        {loading ? <CircularProgress size={24} /> : 'Sign In'}
                    </Button>
                    <Box textAlign="center" sx={{ mt: 2 }}>
                        <Link component={RouterLink} to="/register" variant="body2" sx={{ display: 'block', mb: 1 }}>
                            {"Don't have an account? Sign Up"}
                        </Link>
                        <Link component={RouterLink} to="/reset" variant="body2">
                            {"Forgot your password?"}
                        </Link>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default LoginPage; 