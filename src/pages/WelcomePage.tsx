import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Button, Box } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const WelcomePage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Container component="main" maxWidth="sm">
            <Paper elevation={6} sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 2 }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                <Typography component="h1" variant="h4" align="center" gutterBottom>
                    Welcome!
                </Typography>
                <Typography variant="h6" align="center" color="text.secondary" paragraph>
                    Your account has been created successfully.
                </Typography>
                <Box sx={{ mt: 4 }}>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/list')}
                    >
                        Continue to Dashboard
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default WelcomePage; 