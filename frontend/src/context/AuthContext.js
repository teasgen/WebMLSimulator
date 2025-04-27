import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext({
  user: null,
  loginUser: () => {},
  logoutUser: () => {},
  registerUser: () => {},
  loading: false,
  error: null
});

export const AuthProvider = ({ children }) => {
  const [authTokens, setAuthTokens] = useState(() => 
    localStorage.getItem('authTokens') 
      ? JSON.parse(localStorage.getItem('authTokens')) 
      : null
  );
  const [user, setUser] = useState(() =>
    localStorage.getItem('user')
      ? JSON.parse(localStorage.getItem('user'))
      : null
  );

  const [loading, setLoading] = useState(true);

  axios.interceptors.request.use(
    config => {
      if (authTokens?.access) {
        config.headers.Authorization = `Bearer ${authTokens.access}`;
      }
      return config;
    },
    error => Promise.reject(error)
  );

  const fetchUserData = async (token = null) => {
    try {
      const currentToken = token || authTokens;
      console.log(currentToken)
      if (!currentToken || !currentToken.access) {
        console.error('No access token available');
        setUser(null);
        return;
      }

      console.log('Fetching user data with token');

      const response = await axios.get('http://localhost:8000/api/users/me/', {
        headers: {
          'Authorization': `Bearer ${currentToken.access}`
        }
      });
      
      console.log('User data received');
      if (!response.data.email_verified) {
        throw new Error('Email was not verified');
      }
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      return true;
    } catch (error) {
      console.error('Error fetching user data:', error);
      
      if (error.response && error.response.status === 401) {
        console.log('Token is invalid or expired, trying to refresh...');
        try {
          await refreshToken();
        } catch (refreshError) {
          console.error('Could not refresh token, logging out');
          logoutUser();
        }
      }
      return error.message;
    }
  };

  const loginUser = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:8000/api/token/', {
        "username": email,
        "email": email,
        "password": password,
      })
      
      const data = response.data;
      localStorage.setItem('authTokens', JSON.stringify(data));
      setAuthTokens(data);
      
      const result = await fetchUserData(data);
      if (result === true)
        return true;
      else {
        if (result === 'Email was not verified') {
          localStorage.removeItem('authTokens');
          
          return {
            error: 'email_unverified',
            message: 'Your email is not verified. Please check your inbox and verify your email.'
          };
        }

        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const registerUser = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:8000/api/users/register/', {
        email,
        password
      });
        
      const data = response.data;
      
      if (data.exists) {
        return { 
          success: true,
          exists: true,
          message: data.message
        };
      }
      
      return { 
        success: true,
        exists: false,
        message: data.message
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.response?.data || 'Registration failed' 
      };
    }
  };

  const logoutUser = () => {
    setAuthTokens(null);
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('authTokens');
  };

  useEffect(() => {
    if (authTokens) {
      fetchUserData();
    }
    setLoading(false);
  }, [authTokens]);

  const refreshToken = async () => {
    try {
      if (!authTokens?.refresh) {
        setLoading(false);
        return;
      }
      
      const response = await axios.post('http://localhost:8000/api/token/refresh/', {
        refresh: authTokens.refresh
      });
      
      const data = {
        ...authTokens,
        access: response.data.access
      };
      
      setAuthTokens(data);
      localStorage.setItem('authTokens', JSON.stringify(data));
      
      await fetchUserData();
    } catch (error) {
      console.error('Token refresh error:', error);
      logoutUser();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authTokens) return;
    const interval = setInterval(() => {
      refreshToken();
    }, 9 * 60 * 1000);

    return () => clearInterval(interval);
  }, [authTokens]);

  const resendVerificationEmail = async (email) => {
    try {
      const response = await axios.post('http://localhost:8000/api/users/resend-verification/', { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Resend verification error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to resend verification email' 
      };
    }
  };

  const requestPasswordReset = async (email) => {
    try {
      const response = await axios.post('http://localhost:8000/api/users/password-reset-request/', { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Password reset request error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to request password reset' 
      };
    }
  };
  
  const confirmPasswordReset = async (token, newPassword) => {
    try {
      const response = await axios.post('http://localhost:8000/api/users/password-reset-confirm/', {
        token,
        new_password: newPassword
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Password reset confirmation error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to reset password' 
      };
    }
  };
  

  return (
    <AuthContext.Provider value={{
      user,
      authTokens,
      loginUser,
      logoutUser,
      registerUser,
      resendVerificationEmail,
      requestPasswordReset, 
      confirmPasswordReset,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
