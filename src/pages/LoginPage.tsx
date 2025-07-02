import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import {
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
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';

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
            const data = response.data as any;
            if (data && data.token) {
                login(data.token);
                
                // Handle remember me functionality
                if (rememberMe) {
                    // Store remember me preference
                    localStorage.setItem('rememberMe', 'true');
                } else {
                    localStorage.removeItem('rememberMe');
                }
                
                navigate('/dashboard'); // Redirect to the dashboard after login
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
        <Box sx={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper elevation={0} sx={{ display: 'flex', width: { xs: '100%', md: 900 }, minHeight: 500, borderRadius: 4, overflow: 'hidden', boxShadow: 3 }}>
                {/* Left branding/welcome */}
                <Box sx={{
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 350,
                    background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                    color: '#fff',
                    p: 4,
                }}>
                    <Box sx={{ mb: 3 }}>
                        <img src="/logo192.png" alt="Logo" style={{ width: 60, height: 60, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>Welcome Back!</Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9, mb: 2, textAlign: 'center' }}>
                        Sign in to your PDScreen account to continue managing your position descriptions.
                    </Typography>
                    <Box sx={{ mt: 2, fontSize: 12, opacity: 0.7 }}>© {new Date().getFullYear()} PDScreen</Box>
                </Box>
                {/* Right form card */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', p: { xs: 2, md: 6 }, background: '#fff', minWidth: 0 }}>
                    <IconButton
                        aria-label="close"
                        onClick={() => navigate('/')}
                        sx={{ position: 'absolute', right: 24, top: 24, color: 'grey.500', zIndex: 2 }}
                    >
                        <CloseIcon />
                    </IconButton>
                    <Typography component="h1" variant="h4" sx={{ fontWeight: 700, mb: 2, textAlign: 'left' }}>
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
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EmailIcon />
                                    </InputAdornment>
                                ),
                            }}
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
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon />
                                    </InputAdornment>
                                ),
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
                            size="large"
                            sx={{ mt: 3, mb: 2, fontWeight: 600, boxShadow: 1 }}
                            disabled={loading}
                            aria-describedby="login-error"
                        >
                            {loading ? <CircularProgress size={24} /> : 'Sign In'}
                        </Button>
                        <Box textAlign="center" sx={{ mt: 2 }}>
                            <Link component={RouterLink} to="/register" variant="body2" sx={{ display: 'block', mb: 1, fontWeight: 500 }}>
                                {"Don't have an account? Sign Up"}
                            </Link>
                            <Link component={RouterLink} to="/reset" variant="body2">
                                {"Forgot your password?"}
                            </Link>
                        </Box>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default LoginPage; 