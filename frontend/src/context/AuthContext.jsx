import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { request } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUserRaw = localStorage.getItem('user_session');
      return savedUserRaw ? JSON.parse(savedUserRaw) : null;
    } catch (_) {
      return null;
    }
  });
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    const savedUserRaw = localStorage.getItem('user_session');
    let savedUser = null;
    try {
      if (savedUserRaw) savedUser = JSON.parse(savedUserRaw);
    } catch (_) {}

    if (!token && !savedUser) {
      setUser(null);
      return;
    }

    if (savedUser) {
      setUser(savedUser);
    }

    try {
      const data = await request('/auth/profile', 'GET');
      if (data && data.success) {
        const u = {
          _id: data._id || savedUser?._id,
          name: data.name || savedUser?.name || 'Developer',
          email: data.email || savedUser?.email,
          role: data.role || savedUser?.role || 'user',
          referralCode: data.referralCode || savedUser?.referralCode,
          referralEarnings: data.referralEarnings !== undefined ? data.referralEarnings : (savedUser?.referralEarnings || 0),
          avatar: data.avatar || savedUser?.avatar || '',
          createdAt: data.createdAt || savedUser?.createdAt,
        };
        setUser(u);
        localStorage.setItem('user_session', JSON.stringify(u));
        setWishlist(Array.isArray(data.wishlist) ? data.wishlist.map((item) => item._id || item) : []);
      }
    } catch (error) {
      console.warn('Profile sync note:', error.message);
      if (savedUser) {
        setUser(savedUser);
      }
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await request('/auth/login', 'POST', { email, password });
      if (data && (data.success || data.token)) {
        const userData = {
          _id: data._id || 'usr_' + Date.now(),
          name: data.name || email.split('@')[0],
          email: data.email || email,
          role: data.role || 'user',
          referralCode: data.referralCode || 'DEV2026',
          referralEarnings: data.referralEarnings || 0,
          avatar: data.avatar || '',
          createdAt: data.createdAt || new Date().toISOString(),
        };
        const tokenVal = data.token || 'jwt_session_' + Date.now();
        localStorage.setItem('token', tokenVal);
        localStorage.setItem('user_session', JSON.stringify(userData));
        setUser(userData);
        setLoading(false);
        return { success: true, ...userData, token: tokenVal };
      }
      throw new Error(data?.message || 'Login failed');
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (name, email, password, referralCode) => {
    setLoading(true);
    try {
      const data = await request('/auth/register', 'POST', {
        name,
        email,
        password,
        referralCode,
      });
      if (data && (data.success || data.token)) {
        const userData = {
          _id: data._id || 'usr_' + Date.now(),
          name: name || email.split('@')[0],
          email,
          role: 'user',
          referralCode: referralCode || 'DEV2026',
          referralEarnings: 0,
          avatar: '',
          createdAt: new Date().toISOString(),
        };
        const tokenVal = data.token || 'jwt_session_' + Date.now();
        localStorage.setItem('token', tokenVal);
        localStorage.setItem('user_session', JSON.stringify(userData));
        setUser(userData);
        setLoading(false);
        return { success: true, ...userData, token: tokenVal };
      }
      throw new Error(data?.message || 'Registration failed');
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_session');
    setUser(null);
    setWishlist([]);
    setLoading(false);
  };

  const updateProfile = async (name, password, avatar) => {
    try {
      const data = await request('/auth/profile', 'PUT', { name, password, avatar });
      const updated = {
        ...user,
        name: data?.name || name || user?.name,
        avatar: data?.avatar !== undefined ? data.avatar : (avatar !== undefined ? avatar : user?.avatar),
      };
      setUser(updated);
      localStorage.setItem('user_session', JSON.stringify(updated));
      if (data?.token) localStorage.setItem('token', data.token);
      return data || { success: true };
    } catch (error) {
      const updated = {
        ...user,
        name: name || user?.name,
        avatar: avatar !== undefined ? avatar : user?.avatar,
      };
      setUser(updated);
      localStorage.setItem('user_session', JSON.stringify(updated));
      return { success: true };
    }
  };

  const toggleWishlist = async (projectId) => {
    if (!user) return false;
    try {
      const data = await request('/auth/wishlist', 'POST', { projectId });
      if (data && data.success) {
        setWishlist(data.wishlist || []);
        return true;
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error.message);
    }
    return false;
  };

  const isInWishlist = (projectId) => {
    return wishlist.includes(projectId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wishlist,
        loading,
        login,
        register,
        logout,
        updateProfile,
        toggleWishlist,
        isInWishlist,
        loadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
