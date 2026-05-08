import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../api/auth';
import { cartAPI } from '../api/cart';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Функция для получения session_key из куки
  const getSessionKeyFromCookie = () => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'sessionid') {
        return value;
      }
    }
    return null;
  };

  // Загрузка пользователя при монтировании
  useEffect(() => {
    const init = async () => {
      await checkAuth();
    };
    init();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.getProfile();
      setUser(response.data.user);
      
      // Проверяем, есть ли ожидающее объединение
      const pendingMergeKey = localStorage.getItem('pending_merge_session_key');
      if (pendingMergeKey) {
        console.log('🔀 Processing pending merge with key:', pendingMergeKey);
        try {
          await cartAPI.mergeCart(pendingMergeKey);
          localStorage.removeItem('pending_merge_session_key');
          window.dispatchEvent(new Event('cart-updated'));
        } catch (err) {
          console.error('Merge failed:', err);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      // Сохраняем session_key из куки ПЕРЕД входом
      const guestSessionKey = getSessionKeyFromCookie();
      
      // Сохраняем в localStorage для использования после редиректа
      if (guestSessionKey) {
        localStorage.setItem('pending_merge_session_key', guestSessionKey);
      }
      
      const response = await authAPI.login({ email: email, password: password });
      
      if (response.data.access) {
        localStorage.setItem('access_token', response.data.access);
      }
      if (response.data.refresh) {
        localStorage.setItem('refresh_token', response.data.refresh);
      }
      
      setUser(response.data.user);
      
      // Пытаемся объединить сразу (если сессия не изменилась)
      if (guestSessionKey) {
        try {
          await cartAPI.mergeCart(guestSessionKey);
          localStorage.removeItem('pending_merge_session_key');
          window.dispatchEvent(new Event('cart-updated'));
        } catch (mergeError) {
          console.error('Merge failed:', mergeError);
        }
      }
      
      window.location.href = '/';
      return { success: true, user: response.data.user };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.response?.data?.details || 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('pending_merge_session_key');
      setUser(null);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(prev => ({ ...prev, ...updatedUser }));
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};