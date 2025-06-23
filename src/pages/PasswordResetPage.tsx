import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    CircularProgress,
    Alert,
    Paper,
    IconButton,
    InputAdornment,
    LinearProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import apiService from '../services/api';

// Password strength validation
const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
        minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar,
        isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
    };
};

// Email validation
const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const PasswordResetPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

    const [formData, setFormData] = useState({
        email: '',
        newPassword: '',
        confirmPassword: '',
    });

    const passwordValidation = validatePassword(formData.newPassword);
    const emailValidation = validateEmail(formData.email);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear validation errors when user starts typing
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const errors: {[key: string]: string} = {};
        
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!emailValidation) {
            errors.email = 'Please enter a valid email address';
        }
        
        if (!formData.newPassword) {
            errors.newPassword = 'New password is required';
        } else if (!passwordValidation.isValid) {
            errors.newPassword = 'Password does not meet requirements';
        }
        
        if (formData.newPassword !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        try {
            await apiService.post('/auth/reset-password', {
                email: formData.email,
                newPassword: formData.newPassword
            });
            
            setSuccess('Password has been successfully reset! You can now login with your new password.');
            
            // Clear form
            setFormData({
                email: '',
                newPassword: '',
                confirmPassword: '',
            });
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
            
        } catch (err: any) {
            console.error("Password reset failed:", err);
            let errorMessage = 'An unexpected error occurred. Please try again.';
            
            if (err.response) {
                if (err.response.status === 404) {
                    errorMessage = 'No account found with this email address.';
                } else if (err.response.status === 400) {
                    errorMessage = err.response.data?.error || 'Please check your input and try again.';
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

    const getPasswordStrengthColor = () => {
        const validCount = Object.values(passwordValidation).filter(Boolean).length - 1; // -1 for isValid
        if (validCount <= 2) return 'error';
        if (validCount <= 3) return 'warning';
        return 'success';
    };

    const getPasswordStrengthText = () => {
        const validCount = Object.values(passwordValidation).filter(Boolean).length - 1;
        if (validCount <= 2) return 'Weak';
        if (validCount <= 3) return 'Fair';
        if (validCount <= 4) return 'Good';
        return 'Strong';
    };

    return (
        <Container component="main" maxWidth="sm">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                        <Typography component="h1" variant="h5">
                            Reset Password
                        </Typography>
                        <IconButton
                            onClick={() => navigate('/login')}
                            sx={{ color: 'grey.500' }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Enter your email address and a new password to reset your account password.
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {success}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={formData.email}
                            onChange={handleChange}
                            error={!!validationErrors.email}
                            helperText={validationErrors.email}
                            disabled={loading}
                        />

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="newPassword"
                            label="New Password"
                            type={showPassword ? 'text' : 'password'}
                            id="newPassword"
                            autoComplete="new-password"
                            value={formData.newPassword}
                            onChange={handleChange}
                            error={!!validationErrors.newPassword}
                            helperText={validationErrors.newPassword}
                            disabled={loading}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        {formData.newPassword && (
                            <Box sx={{ mt: 1, mb: 2 }}>
                                <Typography variant="body2" color="textSecondary">
                                    Password strength: {getPasswordStrengthText()}
                                </Typography>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={Object.values(passwordValidation).filter(Boolean).length * 20} 
                                    color={getPasswordStrengthColor() as any}
                                    sx={{ mt: 0.5 }}
                                />
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" display="block" color={passwordValidation.minLength ? 'success.main' : 'error.main'}>
                                        • At least 8 characters
                                    </Typography>
                                    <Typography variant="caption" display="block" color={passwordValidation.hasUpperCase ? 'success.main' : 'error.main'}>
                                        • At least one uppercase letter
                                    </Typography>
                                    <Typography variant="caption" display="block" color={passwordValidation.hasLowerCase ? 'success.main' : 'error.main'}>
                                        • At least one lowercase letter
                                    </Typography>
                                    <Typography variant="caption" display="block" color={passwordValidation.hasNumbers ? 'success.main' : 'error.main'}>
                                        • At least one number
                                    </Typography>
                                    <Typography variant="caption" display="block" color={passwordValidation.hasSpecialChar ? 'success.main' : 'error.main'}>
                                        • At least one special character
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="confirmPassword"
                            label="Confirm New Password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            autoComplete="new-password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            error={!!validationErrors.confirmPassword}
                            helperText={validationErrors.confirmPassword}
                            disabled={loading}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            edge="end"
                                        >
                                            {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Reset Password'}
                        </Button>

                        <Button
                            fullWidth
                            variant="text"
                            onClick={() => navigate('/login')}
                            startIcon={<ArrowBackIcon />}
                            disabled={loading}
                        >
                            Back to Login
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default PasswordResetPage; 