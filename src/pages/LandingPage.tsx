import React, { useState, useEffect } from 'react';
import styles from './LandingPage.module.css';
import { Button, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
        <div className={styles.heroContentRow}>
          <div className={styles.heroTextContainer}>
            <div className={styles.heroLogo}>
              {/* Placeholder for logo */}
              <CloudUploadIcon style={{ fontSize: 48, color: '#fff' }} />
            </div>
            <div className={styles.heroLabel}>AI-POWERED PD MANAGEMENT</div>
            <div className={styles.heroHeadline}>
              AI Effortlessly Upload<br />
              & Manage <span className={styles.heroAccent}>Position Descriptions</span>
            </div>
            <div className={styles.heroSubheadline}>
              Streamline your HR workflow. Upload, organize, and analyze PDs with AI-driven insights—all in one place.
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  startIcon={<CloudUploadIcon />}
                  style={{ fontWeight: 700, fontSize: '1.15rem', padding: '0.85rem 2.2rem', borderRadius: 12, boxShadow: '0 2px 12px rgba(30,60,114,0.18)' }}
                  onClick={() => navigate('/register')}
                  aria-label="Upload your PDs"
                >
                  Get Started
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="large"
                   style={{ fontWeight: 700, fontSize: '1.15rem', padding: '0.85rem 2.2rem', borderRadius: 12, borderColor: 'white', color: 'white' }}
                  onClick={() => navigate('/login')}
                  aria-label="Login"
                >
                  Login
                </Button>
            </div>
          </div>
          <div className={styles.heroImageContainer}>
            <img
              src="https://lh3.googleusercontent.com/GMUMZMPg3Q90VoiPWv6QTAPhdCc8DcOPUVjp0SjPemKYj8s7jziYl4-z7wIwGSo0C7rJ-dTKLi3M20vuv6aJXta5ciC_-rhJxg=w888"
              alt="PD Screen App Screenshot"
              className={styles.heroImage}
              style={{ maxWidth: '500px', width: '100%', borderRadius: '18px', boxShadow: '0 6px 32px rgba(30,60,114,0.18)' }}
            />
          </div>
        </div>
      </div>

      {/* Down Arrow Scroll Indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-1.5rem', marginBottom: '1.5rem' }}>
        <svg aria-label="Scroll down" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'bounce 1.5s infinite' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* White Section with rounded corners */}
      <div className={styles.whiteSection}>
        {/* How it Works Section */}
        <div className={styles.headline} style={{ color: '#1e3c72', fontSize: '2.2rem', marginBottom: 0, fontWeight: 700, letterSpacing: 1 }}>
          How it Works
        </div>
        <div className={styles.howSteps}>
          <div className={styles.howStep}>
            <DescriptionIcon aria-label="Upload" style={{ fontSize: 44, color: '#1e3c72', marginBottom: 8 }} />
            <div style={{ fontWeight: 600, marginBottom: 4 }}>1. Upload</div>
            <div>Drag & drop or select your PD file to get started.</div>
          </div>
          <div className={styles.howStep}>
            <SearchIcon aria-label="Analyze" style={{ fontSize: 44, color: '#1e3c72', marginBottom: 8 }} />
            <div style={{ fontWeight: 600, marginBottom: 4 }}>2. Analyze</div>
            <div>Let our AI extract and summarize key responsibilities.</div>
          </div>
          <div className={styles.howStep}>
            <CheckCircleIcon aria-label="Organize" style={{ fontSize: 44, color: '#1e3c72', marginBottom: 8 }} />
            <div style={{ fontWeight: 600, marginBottom: 4 }}>3. Organize</div>
            <div>Review, edit, and manage all your PDs in one place.</div>
          </div>
        </div>

        {/* Review Section */}
        <div style={{ color: '#1e3c72', fontSize: '2rem', fontWeight: 700, margin: '3rem 0 1.5rem 0', letterSpacing: 1 }}>What Our Users Say</div>
        <div style={{ position: 'relative', width: '100%', maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={handleBack}
            sx={{ 
              color: '#1e3c72',
              position: 'absolute',
              left: -60,
              '&:hover': {
                backgroundColor: 'rgba(30,60,114,0.1)'
              }
            }}
          >
            <ArrowBackIosNewIcon />
          </IconButton>
          
          <div style={{ 
            background: 'rgba(30,60,114,0.1)', 
            borderRadius: 14, 
            boxShadow: '0 2px 12px rgba(30,60,114,0.10)', 
            padding: '2rem 1.5rem', 
            color: '#1e3c72', 
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
              color: '#1e3c72',
              position: 'absolute',
              right: -60,
              '&:hover': {
                backgroundColor: 'rgba(30,60,114,0.1)'
              }
            }}
          >
            <ArrowForwardIosIcon />
          </IconButton>
        </div>

        {/* Call to Action Section */}
        <div style={{ color: '#1e3c72', fontSize: '2.1rem', fontWeight: 800, margin: '3rem 0 1.2rem 0', letterSpacing: 1, textAlign: 'center', maxWidth: 700 }}>
          Ready to streamline your Position Descriptions?
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={() => navigate('/register')}
              sx={{ fontSize: '1.2rem', fontWeight: 700, px: 4, py: 1.5, borderRadius: 8, boxShadow: 3, background: '#1e3c72', color: '#fff', '&:hover': { background: '#2a5298', color: '#fff' } }}
              aria-label="Get Started"
            >
              Get Started
            </Button>
        </div>
      </div>

      {/* Footer Section */}
      <footer className={styles.footerSection}>
        <nav style={{ marginBottom: '1rem', display: 'flex', gap: '2.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '1.1rem' }}>Home</a>
          <a href="/upload" style={{ color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '1.1rem' }}>Upload</a>
          <a href="/list" style={{ color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '1.1rem' }}>List</a>
          <a href="mailto:support@pdscreen.com" style={{ color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '1.1rem' }}>Contact</a>
        </nav>
        <div style={{ opacity: 0.7, fontSize: '1rem', fontWeight: 400 }}>
          &copy; {new Date().getFullYear()} PD Screen. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

// Add bounce animation for arrow
const style = document.createElement('style');
style.innerHTML = `@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(10px); } }`;
document.head.appendChild(style);

export default LandingPage; 