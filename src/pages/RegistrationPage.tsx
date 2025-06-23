import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    CircularProgress,
    Alert,
    Paper,
    Stepper,
    Step,
    StepLabel,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    IconButton,
    InputAdornment,
    LinearProgress,
    InputLabel,
    Select,
    MenuItem,
    SelectChangeEvent,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const steps = ['Account Type', 'Company Information', 'Your Details'];

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

const RegistrationPage: React.FC = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeStep, setActiveStep] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

    const [formData, setFormData] = useState({
        accountType: 'personal',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        companyName: '',
        industry: '',
        companySize: '',
    });

    const passwordValidation = validatePassword(formData.password);
    const emailValidation = validateEmail(formData.email);

    const companySizeOptions = [
        '1–10 employees',
        '11–50 employees', 
        '51–200 employees',
        '201–500 employees',
        '501–5,000+ employees'
    ];

    const handleNext = () => {
        if (activeStep === 1 && formData.accountType === 'personal') {
            // Skip company details step for personal accounts
            handleSubmit();
        } else {
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear validation errors when user starts typing
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSelectChange = (event: SelectChangeEvent<string>) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear validation errors when user starts typing
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const errors: {[key: string]: string} = {};
        
        if (!formData.firstName.trim()) {
            errors.firstName = 'First name is required';
        }
        
        if (!formData.lastName.trim()) {
            errors.lastName = 'Last name is required';
        }
        
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!emailValidation) {
            errors.email = 'Please enter a valid email address';
        }
        
        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (!passwordValidation.isValid) {
            errors.password = 'Password does not meet requirements';
        }
        
        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        
        if (formData.accountType === 'company' && !formData.companyName.trim()) {
            errors.companyName = 'Company name is required';
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        setError(null);
        try {
            await register(formData);
            navigate('/welcome'); // Both account types go to welcome page
        } catch (err: any) {
            console.error("Registration failed:", err);
            let errorMessage = 'An unexpected error occurred. Please try again.';
            
            if (err.response) {
                if (err.response.status === 400) {
                    errorMessage = err.response.data?.error || 'Please check your input and try again.';
                } else if (err.response.status === 409) {
                    errorMessage = 'An account with this email already exists.';
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

    const getStepContent = (step: number) => {
        switch (step) {
            case 0:
                return (
                    <FormControl component="fieldset">
                        <FormLabel component="legend">What kind of account do you need?</FormLabel>
                        <RadioGroup row name="accountType" value={formData.accountType} onChange={handleChange}>
                            <FormControlLabel value="personal" control={<Radio />} label="Personal" />
                            <FormControlLabel value="company" control={<Radio />} label="Company" />
                        </RadioGroup>
                    </FormControl>
                );
            case 1:
                if (formData.accountType === 'personal') {
                    return (
                        <>
                            <TextField 
                                label="First Name" 
                                name="firstName" 
                                value={formData.firstName} 
                                onChange={handleChange} 
                                fullWidth 
                                margin="normal" 
                                required 
                                error={!!validationErrors.firstName}
                                helperText={validationErrors.firstName}
                                disabled={loading}
                            />
                            <TextField 
                                label="Last Name" 
                                name="lastName" 
                                value={formData.lastName} 
                                onChange={handleChange} 
                                fullWidth 
                                margin="normal" 
                                required 
                                error={!!validationErrors.lastName}
                                helperText={validationErrors.lastName}
                                disabled={loading}
                            />
                            <TextField 
                                label="Email" 
                                name="email" 
                                type="email" 
                                value={formData.email} 
                                onChange={handleChange} 
                                fullWidth 
                                margin="normal" 
                                required 
                                error={!!validationErrors.email}
                                helperText={validationErrors.email}
                                disabled={loading}
                            />
                            <TextField 
                                label="Password" 
                                name="password" 
                                type={showPassword ? 'text' : 'password'} 
                                value={formData.password} 
                                onChange={handleChange} 
                                fullWidth 
                                margin="normal" 
                                required 
                                error={!!validationErrors.password}
                                helperText={validationErrors.password}
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
                            {formData.password && (
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
                                label="Confirm Password" 
                                name="confirmPassword" 
                                type={showConfirmPassword ? 'text' : 'password'} 
                                value={formData.confirmPassword} 
                                onChange={handleChange} 
                                fullWidth 
                                margin="normal" 
                                required 
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
                        </>
                    );
                } else {
                    return (
                        <>
                            <Typography variant="h6" sx={{ mb: 2 }}>Tell us about your company</Typography>
                            <TextField 
                                label="Company Name" 
                                name="companyName" 
                                value={formData.companyName} 
                                onChange={handleChange} 
                                fullWidth 
                                margin="normal" 
                                required 
                                error={!!validationErrors.companyName}
                                helperText={validationErrors.companyName}
                                disabled={loading}
                            />
                            <TextField 
                                label="Industry" 
                                name="industry" 
                                value={formData.industry} 
                                onChange={handleChange} 
                                fullWidth 
                                margin="normal" 
                                disabled={loading}
                            />
                            <FormControl margin="normal" disabled={loading} sx={{ minWidth: 200 }}>
                                <InputLabel>Company Size</InputLabel>
                                <Select
                                    name="companySize"
                                    value={formData.companySize}
                                    onChange={handleSelectChange}
                                    label="Company Size"
                                >
                                    {companySizeOptions.map((option) => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </>
                    );
                }
            case 2:
                return (
                    <>
                        <Typography variant="h6" sx={{ mb: 2 }}>Your Details</Typography>
                        <TextField 
                            label="First Name" 
                            name="firstName" 
                            value={formData.firstName} 
                            onChange={handleChange} 
                            fullWidth 
                            margin="normal" 
                            required 
                            error={!!validationErrors.firstName}
                            helperText={validationErrors.firstName}
                            disabled={loading}
                        />
                        <TextField 
                            label="Last Name" 
                            name="lastName" 
                            value={formData.lastName} 
                            onChange={handleChange} 
                            fullWidth 
                            margin="normal" 
                            required 
                            error={!!validationErrors.lastName}
                            helperText={validationErrors.lastName}
                            disabled={loading}
                        />
                        <TextField 
                            label="Email" 
                            name="email" 
                            type="email" 
                            value={formData.email} 
                            onChange={handleChange} 
                            fullWidth 
                            margin="normal" 
                            required 
                            error={!!validationErrors.email}
                            helperText={validationErrors.email}
                            disabled={loading}
                        />
                        <TextField 
                            label="Password" 
                            name="password" 
                            type={showPassword ? 'text' : 'password'} 
                            value={formData.password} 
                            onChange={handleChange} 
                            fullWidth 
                            margin="normal" 
                            required 
                            error={!!validationErrors.password}
                            helperText={validationErrors.password}
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
                        {formData.password && (
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
                            label="Confirm Password" 
                            name="confirmPassword" 
                            type={showConfirmPassword ? 'text' : 'password'} 
                            value={formData.confirmPassword} 
                            onChange={handleChange} 
                            fullWidth 
                            margin="normal" 
                            required 
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
                    </>
                );
            default:
                return 'Unknown step';
        }
    };

    const isNextDisabled = () => {
        if (activeStep === 1) {
            if (formData.accountType === 'personal') {
                return !formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword || !passwordValidation.isValid || formData.password !== formData.confirmPassword;
            } else {
                return !formData.companyName;
            }
        }
        if (activeStep === 2) {
            return !formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword || !passwordValidation.isValid || formData.password !== formData.confirmPassword;
        }
        return false;
    };

    return (
        <Container component="main" maxWidth="md">
            <Paper elevation={6} sx={{ padding: 4, borderRadius: 2, position: 'relative' }}>
                <IconButton
                    aria-label="close"
                    onClick={() => navigate(-1)}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
                <Typography component="h1" variant="h4" align="center" gutterBottom>
                    Create Account
                </Typography>
                <Stepper activeStep={activeStep} sx={{ mt: 3, mb: 3, width: '100%' }}>
                    {steps.map((label, index) => {
                        const stepProps: { completed?: boolean } = {};
                        if (formData.accountType === 'personal' && index === 1) {
                            return null; // Don't show company step for personal
                        }
                        return (
                            <Step key={label} {...stepProps}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        );
                    })}
                </Stepper>

                <Box sx={{ width: '100%' }}>
                    {getStepContent(activeStep)}
                    {error && (
                        <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                            {error}
                        </Alert>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                        {activeStep !== 0 && (
                            <Button onClick={handleBack} sx={{ mr: 1 }} disabled={loading}>
                                Back
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            onClick={activeStep === (formData.accountType === 'company' ? steps.length - 1 : 1) ? handleSubmit : handleNext}
                            disabled={isNextDisabled() || loading}
                        >
                            {loading ? <CircularProgress size={24} /> : (activeStep === (formData.accountType === 'company' ? steps.length - 1 : 1) ? 'Finish' : 'Next')}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default RegistrationPage; 