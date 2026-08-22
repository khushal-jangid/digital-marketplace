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
  const [purchasedProjectIds, setPurchasedProjectIds] = useState(() => {
    try {
      const saved = localStorage.getItem('user_purchases');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  const loadPurchases = useCallback(async (userId, userEmail) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setPurchasedProjectIds([]);
      localStorage.removeItem('user_purchases');
      return;
    }
    try {
      // Fetch user's purchased projects
      const data = await request('/orders/my-purchases', 'GET');
      let ids = [];
      if (data && data.success && Array.isArray(data.purchases)) {
        ids = data.purchases.map((p) => (p.project?._id || p.project || p._id || '').toString()).filter(Boolean);
      }
      // Also check orders if purchases is empty
      if (ids.length === 0) {
        const ordersData = await request('/orders/my-orders', 'GET');
        if (ordersData && ordersData.success && Array.isArray(ordersData.orders)) {
          ordersData.orders.forEach((ord) => {
            const status = (ord.paymentStatus || '').toLowerCase();
            if (['paid', 'completed', 'fulfilled'].includes(status)) {
              if (Array.isArray(ord.projects)) {
                ord.projects.forEach((p) => {
                  const pid = (p._id || p.id || p).toString();
                  if (pid && !ids.includes(pid)) ids.push(pid);
                });
              }
              if (Array.isArray(ord.items)) {
                ord.items.forEach((item) => {
                  const pid = (item.project?._id || item.project || item._id || '').toString();
                  if (pid && !ids.includes(pid)) ids.push(pid);
                });
              }
            }
          });
        }
      }
      setPurchasedProjectIds(ids);
      localStorage.setItem('user_purchases', JSON.stringify(ids));
    } catch (_) {
      // Ignore background sync errors
    }
  }, []);

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    const savedUserRaw = localStorage.getItem('user_session');
    let savedUser = null;
    try {
      if (savedUserRaw) savedUser = JSON.parse(savedUserRaw);
    } catch (_) {}

    if (!token && !savedUser) {
      setUser(null);
      setPurchasedProjectIds([]);
      localStorage.removeItem('user_purchases');
      return;
    }

    if (savedUser) {
      setUser(savedUser);
    }

    loadPurchases(savedUser?._id, savedUser?.email);

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
        loadPurchases(u._id, u.email);
      }
    } catch (error) {
      console.warn('Profile sync note:', error.message);
      if (savedUser) {
        setUser(savedUser);
      }
    }
  }, [loadPurchases]);

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
    localStorage.removeItem('user_purchases');
    setUser(null);
    setWishlist([]);
    setPurchasedProjectIds([]);
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

  const isPurchased = (projectId) => {
    if (!projectId) return false;
    const pid = (projectId._id || projectId.id || projectId).toString();
    return purchasedProjectIds.includes(pid);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wishlist,
        purchasedProjectIds,
        isPurchased,
        loadPurchases,
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
