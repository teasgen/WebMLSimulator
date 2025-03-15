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
  const [user, setUser] = useState(null);
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

  const fetchUserData = async () => {
    try {
      if (!authTokens || !authTokens.access) {
        console.error('No access token available');
        setUser(null);
        return;
      }

      console.log('Fetching user data with token');
      
      const response = await axios.get('http://localhost:8000/api/users/me/', {
        headers: {
          'Authorization': `Bearer ${authTokens.access}`
        }
      });
      
      console.log('User data received');
      setUser(response.data);
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
    }
  };

  const loginUser = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:8000/api/token/', {
        "username": email,
        "email": email,
        "password": password,
      });
      
      const data = response.data;
      setAuthTokens(data);
      localStorage.setItem('authTokens', JSON.stringify(data));
      
      await fetchUserData();
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const registerUser = async (email, password) => {
    try {
      await axios.post('http://localhost:8000/api/users/register/', {
        email,
        password
      });
      return { success: true };
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
      
      // Получение данных пользователя с новым токеном
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

  return (
    <AuthContext.Provider value={{
      user,
      authTokens,
      loginUser,
      logoutUser,
      registerUser,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
