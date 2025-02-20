import axios from 'axios';
import { toast } from 'react-hot-toast';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Add a request interceptor
instance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: new Date().getTime()
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log('Request:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.data
      });
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
instance.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Response:', {
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    
    // Handle specific error cases
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.message || 'An error occurred';
      if (error.response.status !== 401) {
        toast.error(message);
      }
    } else if (error.request) {
      // Request was made but no response
      toast.error('No response from server. Please try again.');
    } else {
      // Something else went wrong
      toast.error('Failed to make request. Please try again.');
    }
    
    return Promise.reject(error);
  }
);

export default instance;
