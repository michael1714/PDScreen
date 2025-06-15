import React, { useState, useEffect } from 'react';
import styles from './LandingPage.module.css';
import { Button, Paper, MobileStepper, useTheme, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const reviews = [
  {
    text: "This app has transformed our HR workflow. Uploading and managing PDs is now a breeze!",
    author: "Alex, HR Manager"
  },
  {
    text: "The AI insights are spot on and save us hours of manual work every week.",
    author: "Priya, Talent Lead"
  },
  {
    text: "Beautiful, intuitive, and powerful. Highly recommended for any HR team.",
    author: "Sam, Operations Director"
  }
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    setActiveStep((prevStep) => (prevStep + 1) % reviews.length);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => (prevStep - 1 + reviews.length) % reviews.length);
  };

  // Auto-cycling effect
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.landingRoot}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.headline}>
          Effortlessly Upload & Manage Position Descriptions
        </div>
        <div className={styles.subheadline}>
          Streamline your HR workflow. Upload, analyze, and organize PDs with AI-powered insights and a beautiful, modern interface.
        </div>
        <Paper elevation={4} className={styles.uploadCard}>
          <CloudUploadIcon style={{ fontSize: 48, color: '#1e3c72', marginBottom: 12 }} />
          <div style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: 8 }}>Upload your first Position Description</div>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate('/upload')}
            startIcon={<CloudUploadIcon />}
            sx={{ mt: 1 }}
          >
            Upload Now
          </Button>
        </Paper>
      </div>

      {/* Down Arrow Scroll Indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-1.5rem', marginBottom: '1.5rem' }}>
        <svg aria-label="Scroll down" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'bounce 1.5s infinite' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* How it Works Section */}
      <div className={styles.headline} style={{ color: '#fff', fontSize: '2.2rem', marginBottom: 0, fontWeight: 700, letterSpacing: 1 }}>
        How it Works
      </div>
      <div className={styles.howSteps}>
        <div className={styles.howStep}>
          <DescriptionIcon aria-label="Upload" style={{ fontSize: 44, color: '#fff', marginBottom: 8 }} />
          <div style={{ fontWeight: 600, marginBottom: 4 }}>1. Upload</div>
          <div>Drag & drop or select your PD file to get started.</div>
        </div>
        <div className={styles.howStep}>
          <SearchIcon aria-label="Analyze" style={{ fontSize: 44, color: '#fff', marginBottom: 8 }} />
          <div style={{ fontWeight: 600, marginBottom: 4 }}>2. Analyze</div>
          <div>Let our AI extract and summarize key responsibilities.</div>
        </div>
        <div className={styles.howStep}>
          <CheckCircleIcon aria-label="Organize" style={{ fontSize: 44, color: '#fff', marginBottom: 8 }} />
          <div style={{ fontWeight: 600, marginBottom: 4 }}>3. Organize</div>
          <div>Review, edit, and manage all your PDs in one place.</div>
        </div>
      </div>

      {/* Review Section */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '3rem 0 2rem 0' }}>
        <div style={{ color: '#fff', fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem', letterSpacing: 1 }}>What Our Users Say</div>
        <div style={{ position: 'relative', width: '100%', maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={handleBack}
            sx={{ 
              color: '#fff',
              position: 'absolute',
              left: -60,
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            <ArrowBackIosNewIcon />
          </IconButton>
          
          <div style={{ 
            background: 'rgba(255,255,255,0.18)', 
            borderRadius: 14, 
            boxShadow: '0 2px 12px rgba(30,60,114,0.10)', 
            padding: '2rem 1.5rem', 
            color: '#fff', 
            fontWeight: 500, 
            textAlign: 'center',
            minHeight: 200,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            width: '100%',
            transition: 'opacity 0.3s ease-in-out'
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: 12 }}>&ldquo;{reviews[activeStep].text}&rdquo;</div>
            <div style={{ fontWeight: 700, marginTop: 8 }}>— {reviews[activeStep].author}</div>
          </div>

          <IconButton 
            onClick={handleNext}
            sx={{ 
              color: '#fff',
              position: 'absolute',
              right: -60,
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            <ArrowForwardIosIcon />
          </IconButton>
        </div>
      </div>

      {/* Call to Action Section */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2.5rem 0 3rem 0' }}>
        <div style={{ color: '#fff', fontSize: '2.1rem', fontWeight: 800, marginBottom: '1.2rem', letterSpacing: 1, textAlign: 'center', maxWidth: 700 }}>
          Ready to streamline your Position Descriptions?
        </div>
        <Button
          variant="contained"
          color="secondary"
          size="large"
          onClick={() => navigate('/upload')}
          sx={{ fontSize: '1.2rem', fontWeight: 700, px: 4, py: 1.5, borderRadius: 8, boxShadow: 3, background: '#fff', color: '#1e3c72', '&:hover': { background: '#e0e7ef', color: '#1e3c72' } }}
          aria-label="Get Started"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};

// Add bounce animation for arrow
const style = document.createElement('style');
style.innerHTML = `@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(10px); } }`;
document.head.appendChild(style);

export default LandingPage; 