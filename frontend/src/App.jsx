import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Providers Contexts
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { CurrencyProvider } from './context/CurrencyContext';

// Components & Guard Routes
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import ScrollToTop from './components/ScrollToTop';
import CouponBanner from './components/CouponBanner';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import Landing from './pages/Landing';

// Lazy load views for optimal performance
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ProjectListing = lazy(() => import('./pages/ProjectListing'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const SupportChat = lazy(() => import('./pages/SupportChat'));
const AboutCreator = lazy(() => import('./pages/AboutCreator'));
const RequestProject = lazy(() => import('./pages/RequestProject'));
const CustomProjectRequest = lazy(() => import('./pages/CustomProjectRequest'));

// Lightweight page loading indicator
const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
    flexDirection: 'column',
    gap: '1rem',
    color: 'var(--text-secondary)'
  }}>
    <div style={{
      width: '32px',
      height: '32px',
      border: '3px solid rgba(79, 70, 229, 0.15)',
      borderTop: '3px solid var(--primary, #4f46e5)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }}></div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Automatically capture and store ?ref=... parameter
const ReferralTracker = () => {
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('apex_ref', ref.trim().toUpperCase());
    }
  }, []);
  return null;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <Router>
              <ScrollToTop />
              <ReferralTracker />
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}>
                
                <CouponBanner />
                <Navbar />

                {/* Page Viewport */}
                <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/" element={<Landing />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/projects" element={<ProjectListing />} />
                      <Route path="/projects/:id" element={<ProjectDetail />} />
                      <Route path="/about-creator" element={<AboutCreator />} />
                      <Route path="/custom-project" element={<CustomProjectRequest />} />
                      <Route path="/request-project" element={<CustomProjectRequest />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/support" element={<SupportChat />} />
                      <Route path="/email-support" element={<SupportChat />} />
                      <Route path="/live-chat" element={<SupportChat />} />
                      <Route path="/contact" element={<SupportChat />} />

                    {/* Authenticated user routes */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <UserDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/wishlist"
                      element={
                        <ProtectedRoute>
                          <Wishlist />
                        </ProtectedRoute>
                      }
                    />

                    {/* Administrative routes */}
                    <Route
                      path="/admin"
                      element={
                        <AdminRoute>
                          <AdminDashboard />
                        </AdminRoute>
                      }
                    />

                    {/* Fallback Catch-All */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </main>

              <Footer />
              <MobileBottomNav />

            </div>
          </Router>
        </CartProvider>
      </CurrencyProvider>
    </AuthProvider>
  </ThemeProvider>
  );
}

export default App;
