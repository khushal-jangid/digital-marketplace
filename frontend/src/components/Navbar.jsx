import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import {
  ShoppingCart,
  Heart,
  User,
  Sun,
  Moon,
  LogOut,
  LayoutDashboard,
  MessageSquare,
  Terminal,
  Menu,
  X,
  Compass,
  ArrowRight,
  Sparkles,
  UserCheck,
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const { isDarkMode, toggleTheme } = useTheme();
  const { currency, toggleCurrency } = useCurrency();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 0',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          onClick={closeMobileMenu}
          style={{
            textDecoration: 'none',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 10px rgba(79, 70, 229, 0.35)',
            }}
          >
            <Terminal size={18} strokeWidth={2.5} />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: '800',
              fontSize: '18px',
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
            }}
          >
            ApexMarket
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="navbar-links-desktop" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            to="/projects"
            style={{
              color: isActive('/projects') ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive('/projects') ? 'var(--bg-tertiary)' : 'transparent',
              textDecoration: 'none',
              fontSize: '13.5px',
              fontWeight: 500,
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: isActive('/projects') ? '1px solid var(--border)' : '1px solid transparent',
              transition: 'all 0.2s ease',
            }}
          >
            Explore Projects
          </Link>

          <Link
            to="/custom-project"
            style={{
              color: '#ffffff',
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 700,
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 2px 12px rgba(79, 70, 229, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <Sparkles size={14} style={{ color: '#fef08a' }} />
            <span>Custom Project (₹50)</span>
          </Link>

          <Link
            to="/support"
            style={{
              color: isActive('/support') ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive('/support') ? 'var(--bg-tertiary)' : 'transparent',
              textDecoration: 'none',
              fontSize: '13.5px',
              fontWeight: 500,
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: isActive('/support') ? '1px solid var(--border)' : '1px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <MessageSquare size={14} />
            <span>Live Support</span>
          </Link>

          <div style={{ height: '18px', width: '1px', background: 'var(--border)', margin: '0 4px' }} />

          {/* Multi-Currency Toggle Button */}
          <button
            type="button"
            onClick={toggleCurrency}
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              height: '34px',
              padding: '0 10px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 700,
              fontFamily: 'monospace',
              transition: 'all 0.2s ease',
            }}
            title="Switch Currency (INR / USD)"
          >
            <span style={{ color: currency === 'INR' ? '#818cf8' : '#10b981' }}>●</span>
            <span>{currency === 'INR' ? '₹ INR' : '$ USD'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Wishlist Link */}
          {user && (
            <Link
              to="/wishlist"
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                color: isActive('/wishlist') ? '#f43f5e' : 'var(--text-secondary)',
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
              title="Wishlist"
            >
              <Heart size={16} fill={isActive('/wishlist') ? '#f43f5e' : 'none'} />
            </Link>
          )}

          {/* Cart Icon */}
          <Link
            to="/cart"
            style={{
              background: cartItems.length > 0 ? 'var(--primary-light)' : 'transparent',
              border: '1px solid',
              borderColor: cartItems.length > 0 ? 'rgba(79, 70, 229, 0.3)' : 'var(--border)',
              color: cartItems.length > 0 ? '#818cf8' : 'var(--text-secondary)',
              height: '34px',
              padding: '0 10px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              fontSize: '13px',
              fontWeight: 600,
            }}
            title="Cart"
          >
            <ShoppingCart size={16} />
            <span>{cartItems.length}</span>
          </Link>

          <div style={{ height: '18px', width: '1px', background: 'var(--border)', margin: '0 4px' }} />

          {/* User Account Controls */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {user.role === 'admin' ? (
                <Link
                  to="/admin"
                  className="btn btn-secondary"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12.5px',
                    gap: '6px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <LayoutDashboard size={14} />
                  Admin
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="btn btn-secondary"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12.5px',
                    gap: '6px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <User size={14} />
                  Dashboard
                </Link>
              )}

              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                title="Logout"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link
                to="/login"
                style={{
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: '13.5px',
                  fontWeight: 500,
                  padding: '6px 12px',
                }}
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="btn btn-primary"
                style={{
                  padding: '6px 14px',
                  fontSize: '13px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Header Controls (Right side hamburger + cart) */}
        <div className="navbar-toggle-mobile" style={{ display: 'none', alignItems: 'center', gap: '10px' }}>
          <Link
            to="/cart"
            style={{
              background: cartItems.length > 0 ? 'var(--primary-light)' : 'transparent',
              border: '1px solid var(--border)',
              color: cartItems.length > 0 ? '#818cf8' : 'var(--text-primary)',
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              textDecoration: 'none',
            }}
          >
            <ShoppingCart size={18} />
            {cartItems.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--primary)',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {cartItems.length}
              </span>
            )}
          </Link>

          {/* Hamburger Trigger Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            style={{
              background: mobileMenuOpen ? 'var(--primary-light)' : 'var(--bg-tertiary)',
              border: '1px solid',
              borderColor: mobileMenuOpen ? 'var(--primary)' : 'var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: mobileMenuOpen ? '#818cf8' : 'var(--text-primary)',
              cursor: 'pointer',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'manipulation',
              userSelect: 'none',
            }}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* 📱 Full-Screen Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'var(--bg-primary)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '16px 20px calc(24px + env(safe-area-inset-bottom)) 20px',
          }}
          className="animate-fade-in"
        >
          {/* Top Bar inside Drawer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border)',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <Terminal size={16} strokeWidth={2.5} />
              </div>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--text-primary)', fontSize: '17px' }}>
                ApexMarket
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Theme toggle inside drawer top */}
              <button
                type="button"
                onClick={toggleTheme}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={closeMobileMenu}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Navigation Links Group */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            <Link
              to="/projects"
              onClick={closeMobileMenu}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: isActive('/projects') ? 'var(--primary-light)' : 'var(--bg-secondary)',
                border: '1px solid',
                borderColor: isActive('/projects') ? 'var(--primary)' : 'var(--border)',
                color: isActive('/projects') ? '#818cf8' : 'var(--text-primary)',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: 600,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Compass size={18} />
                <span>Explore Projects Catalog</span>
              </div>
              <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
            </Link>

            <Link
              to="/request-project"
              onClick={closeMobileMenu}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.5)',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: 700,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={18} style={{ color: '#fef08a' }} />
                <span>Request Custom Project (₹50)</span>
              </div>
              <ArrowRight size={16} style={{ color: '#818cf8' }} />
            </Link>

            <button
              type="button"
              onClick={toggleCurrency}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: 600,
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>💱 Currency Mode</span>
              </div>
              <span style={{ fontSize: '13px', color: currency === 'INR' ? '#818cf8' : '#10b981', fontWeight: 700 }}>
                {currency === 'INR' ? '₹ INR (Indian Rupee)' : '$ USD (US Dollar)'}
              </span>
            </button>

            <Link
              to="/cart"
              onClick={closeMobileMenu}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: isActive('/cart') ? 'var(--primary-light)' : 'var(--bg-secondary)',
                border: '1px solid',
                borderColor: isActive('/cart') ? 'var(--primary)' : 'var(--border)',
                color: isActive('/cart') ? '#818cf8' : 'var(--text-primary)',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: 600,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShoppingCart size={18} />
                <span>Shopping Cart ({cartItems.length})</span>
              </div>
              <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
            </Link>

            {user && (
              <Link
                to="/wishlist"
                onClick={closeMobileMenu}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive('/wishlist') ? 'var(--primary-light)' : 'var(--bg-secondary)',
                  border: '1px solid',
                  borderColor: isActive('/wishlist') ? 'var(--primary)' : 'var(--border)',
                  color: isActive('/wishlist') ? '#818cf8' : 'var(--text-primary)',
                  textDecoration: 'none',
                  fontSize: '15px',
                  fontWeight: 600,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Heart size={18} />
                  <span>My Wishlist</span>
                </div>
                <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
              </Link>
            )}

            {user && (
              <Link
                to="/support"
                onClick={closeMobileMenu}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive('/support') ? 'var(--primary-light)' : 'var(--bg-secondary)',
                  border: '1px solid',
                  borderColor: isActive('/support') ? 'var(--primary)' : 'var(--border)',
                  color: isActive('/support') ? '#818cf8' : 'var(--text-primary)',
                  textDecoration: 'none',
                  fontSize: '15px',
                  fontWeight: 600,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MessageSquare size={18} />
                  <span>Developer Support Chat</span>
                </div>
                <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
              </Link>
            )}

            {/* Theme & Currency Controls in Mobile Drawer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                justifyContent: 'space-between',
              }}
            >
              <button
                type="button"
                onClick={toggleTheme}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: isDarkMode ? 'var(--bg-tertiary)' : 'var(--primary-light)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  flex: 1,
                  justifyContent: 'center',
                }}
              >
                {isDarkMode ? <Sun size={15} style={{ color: '#f59e0b' }} /> : <Moon size={15} style={{ color: '#818cf8' }} />}
                <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              <button
                type="button"
                onClick={toggleCurrency}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                }}
              >
                <span style={{ color: currency === 'INR' ? '#818cf8' : '#10b981' }}>●</span>
                <span>{currency === 'INR' ? '₹ INR' : '$ USD'}</span>
              </button>
            </div>
          </div>

          {/* Account Actions Bottom Area */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {user ? (
              <>
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'var(--primary-light)',
                      color: '#818cf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '15px',
                    }}
                  >
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</span>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{user.email}</span>
                  </div>
                </div>

                <Link
                  to={user.role === 'admin' ? '/admin' : '/dashboard'}
                  onClick={closeMobileMenu}
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '14px', fontSize: '14px', gap: '8px' }}
                >
                  {user.role === 'admin' ? (
                    <>
                      <LayoutDashboard size={16} />
                      <span>Admin Control Panel</span>
                    </>
                  ) : (
                    <>
                      <User size={16} />
                      <span>My Purchased Files & Orders</span>
                    </>
                  )}
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-danger"
                  style={{ width: '100%', padding: '13px', fontSize: '14px', gap: '8px' }}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '14px', fontSize: '14px' }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={closeMobileMenu}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '14px' }}
                >
                  Create Free Account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
