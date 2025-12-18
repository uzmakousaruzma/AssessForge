import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const requestLoginOtp = async (email, password) => {
    return api.post('/auth/login/request-otp', { email, password });
  };

  const resendLoginOtp = async (email) => {
    return api.post('/auth/login/resend-otp', { email });
  };

  const loginWithOtp = async (email, otp) => {
    const response = await api.post('/auth/login', { email, otp });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    return user;
  };

  const login = loginWithOtp;

  const register = async (email, password, role, department) => {
    await api.post('/auth/register', { email, password, role, department });
  };

  const requestPasswordResetOtp = async (email) => {
    return api.post('/auth/forgot-password/request-otp', { email });
  };

  const resetPasswordWithOtp = async (email, otp, newPassword) => {
    return api.post('/auth/forgot-password/reset', { email, otp, newPassword });
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithOtp,
        requestLoginOtp,
        resendLoginOtp,
        register,
        requestPasswordResetOtp,
        resetPasswordWithOtp,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};














