import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import apiService from '../services/api';

interface User {
    userId: string;
    email: string;
    companyId: string;
    accountType: string;
    firstName?: string;
    lastName?: string;
    exp: number;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    login: (token: string) => void;
    logout: () => void;
    register: (userData: any) => Promise<any>;
    sessionTimeout: number | null;
    showSessionWarning: boolean;
    dismissSessionWarning: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session timeout warning threshold (5 minutes before expiry)
const SESSION_WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [sessionTimeout, setSessionTimeout] = useState<number | null>(null);
    const [showSessionWarning, setShowSessionWarning] = useState(false);

    useEffect(() => {
        const initializeAuth = () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const decoded = jwtDecode<User>(token);
                    const currentTime = Date.now();
                    const tokenExpiry = decoded.exp * 1000;
                    
                    if (tokenExpiry > currentTime) {
                        setUser(decoded);
                        
                        // Check if token is expiring soon
                        const timeUntilExpiry = tokenExpiry - currentTime;
                        if (timeUntilExpiry <= SESSION_WARNING_THRESHOLD) {
                            setSessionTimeout(tokenExpiry);
                            setShowSessionWarning(true);
                        }
                    } else {
                        // Token has expired
                        handleLogout();
                    }
                } catch (error) {
                    console.error("Invalid token:", error);
                    handleLogout();
                }
            }
            setLoading(false);
        };
        initializeAuth();
    }, []);

    // Session timeout monitoring
    useEffect(() => {
        if (!user) return;

        const checkSessionTimeout = () => {
            const token = localStorage.getItem('token');
            if (!token) {
                handleLogout();
                return;
            }

            try {
                const decoded = jwtDecode<User>(token);
                const currentTime = Date.now();
                const tokenExpiry = decoded.exp * 1000;
                
                if (tokenExpiry <= currentTime) {
                    // Token has expired
                    handleLogout();
                } else {
                    const timeUntilExpiry = tokenExpiry - currentTime;
                    
                    if (timeUntilExpiry <= SESSION_WARNING_THRESHOLD) {
                        setSessionTimeout(tokenExpiry);
                        setShowSessionWarning(true);
                    }
                }
            } catch (error) {
                console.error("Error checking session timeout:", error);
                handleLogout();
            }
        };

        // Check every minute
        const interval = setInterval(checkSessionTimeout, 60000);
        
        return () => clearInterval(interval);
    }, [user]);

    const login = (token: string) => {
        try {
            localStorage.setItem('token', token);
            const decoded = jwtDecode<User>(token);
            const currentTime = Date.now();
            const tokenExpiry = decoded.exp * 1000;
            
            if (tokenExpiry > currentTime) {
                setUser(decoded);
                setShowSessionWarning(false);
                setSessionTimeout(null);
                
                // Check if token is expiring soon
                const timeUntilExpiry = tokenExpiry - currentTime;
                if (timeUntilExpiry <= SESSION_WARNING_THRESHOLD) {
                    setSessionTimeout(tokenExpiry);
                    setShowSessionWarning(true);
                }
            } else {
                handleLogout();
            }
        } catch (error) {
            console.error("Failed to decode token on login:", error);
            handleLogout();
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('rememberMe');
        setUser(null);
        setShowSessionWarning(false);
        setSessionTimeout(null);
        
        // Clear any session-related timeouts
        if (typeof window !== 'undefined') {
            // Redirect to login page if not already there
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                window.location.href = '/login';
            }
        }
    };

    const logout = () => {
        handleLogout();
    };
    
    const register = async (userData: any) => {
        // The backend /register endpoint should return the user and a token
        const response = await apiService.post('/auth/register', userData);
        if (response.data && response.data.accessToken) {
            login(response.data.accessToken);
        }
        return response.data;
    };

    const dismissSessionWarning = () => {
        setShowSessionWarning(false);
    };

    return (
        <AuthContext.Provider value={{ 
            isAuthenticated: !loading && !!user, 
            user, 
            loading, 
            login, 
            logout, 
            register,
            sessionTimeout,
            showSessionWarning,
            dismissSessionWarning
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 