import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../utils/axios';
import { toast } from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth status on mount and token change
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get('/api/auth/profile');
      if (response.data.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      if (error.response?.status === 401) {
        // Only remove token and log out on 401 (Unauthorized)
        logout();
        toast.error('Session expired. Please login again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (token, userData) => {
    try {
      localStorage.setItem('token', token);
      setUser(userData);
      setIsAuthenticated(true);
      
      // Verify token immediately after login
      const response = await axios.get('/api/auth/profile');
      if (!response.data.success) {
        throw new Error('Failed to verify token');
      }
    } catch (error) {
      console.error('Login verification failed:', error);
      logout();
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    // Clear any auth-related headers
    delete axios.defaults.headers.common['Authorization'];
  };

  // Set up axios interceptor for token handling
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      login, 
      logout,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
