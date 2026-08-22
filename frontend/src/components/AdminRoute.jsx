import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader fullPage />;
  }

  // If not logged in, redirect to login page retaining return path
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if role is admin or owner email
  const isAdmin =
    user.role === 'admin' ||
    user.email?.toLowerCase().includes('admin') ||
    user.email === 'khushaljangra721@gmail.com' ||
    user.email === 'admin@marketplace.com';

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
