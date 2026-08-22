import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FolderOpen, Sparkles, ShoppingCart, User, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const MobileBottomNav = () => {
  const location = useLocation();
  const { cartItems } = useCart();
  const { user } = useAuth();

  const totalCartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const accountPath = user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login';
  const isAccountActive = user ? isActive('/dashboard') || isActive('/admin') : isActive('/login');

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label="Mobile Navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'var(--bg-secondary)',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.25)',
        paddingTop: '6px',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        display: 'none', // Shown via CSS media query @media (max-width: 768px)
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          maxWidth: '500px',
          margin: '0 auto',
          padding: '0 8px',
        }}
      >
        {/* Tab 1: Home */}
        <Link
          to="/"
          className="mobile-nav-tab"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            color: isActive('/') ? '#818cf8' : 'var(--text-muted)',
            fontSize: '10.5px',
            fontWeight: isActive('/') ? 700 : 500,
            gap: '3px',
            padding: '4px 8px',
            flex: 1,
            transition: 'all 0.15s ease',
          }}
        >
          <Home size={20} strokeWidth={isActive('/') ? 2.5 : 1.8} />
          <span>Home</span>
        </Link>

        {/* Tab 2: Projects Catalog */}
        <Link
          to="/projects"
          className="mobile-nav-tab"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            color: isActive('/projects') ? '#818cf8' : 'var(--text-muted)',
            fontSize: '10.5px',
            fontWeight: isActive('/projects') ? 700 : 500,
            gap: '3px',
            padding: '4px 8px',
            flex: 1,
            transition: 'all 0.15s ease',
          }}
        >
          <FolderOpen size={20} strokeWidth={isActive('/projects') ? 2.5 : 1.8} />
          <span>Projects</span>
        </Link>

        {/* Tab 3: Prominent Elevated Custom Project CTA (Center) */}
        <Link
          to="/custom-project"
          className="mobile-nav-tab"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            padding: '0 4px',
            marginTop: '-18px',
            flex: 1.2,
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.55)',
              border: '3px solid var(--bg-secondary)',
              transition: 'transform 0.15s ease',
            }}
          >
            <Sparkles size={22} style={{ color: '#fef08a' }} />
          </div>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              color: isActive('/custom-project') ? '#818cf8' : 'var(--text-primary)',
              marginTop: '2px',
              whiteSpace: 'nowrap',
            }}
          >
            Custom (₹50)
          </span>
        </Link>

        {/* Tab 4: Cart */}
        <Link
          to="/cart"
          className="mobile-nav-tab"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            color: isActive('/cart') ? '#818cf8' : 'var(--text-muted)',
            fontSize: '10.5px',
            fontWeight: isActive('/cart') ? 700 : 500,
            gap: '3px',
            padding: '4px 8px',
            flex: 1,
            position: 'relative',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ position: 'relative' }}>
            <ShoppingCart size={20} strokeWidth={isActive('/cart') ? 2.5 : 1.8} />
            {totalCartCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-8px',
                  background: '#f43f5e',
                  color: '#ffffff',
                  fontSize: '9.5px',
                  fontWeight: 800,
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 5px rgba(244, 63, 94, 0.5)',
                }}
              >
                {totalCartCount}
              </span>
            )}
          </div>
          <span>Cart</span>
        </Link>

        {/* Tab 5: User Account / Admin */}
        <Link
          to={accountPath}
          className="mobile-nav-tab"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            color: isAccountActive ? '#818cf8' : 'var(--text-muted)',
            fontSize: '10.5px',
            fontWeight: isAccountActive ? 700 : 500,
            gap: '3px',
            padding: '4px 8px',
            flex: 1,
            transition: 'all 0.15s ease',
          }}
        >
          {user && user.role === 'admin' ? (
            <ShieldCheck size={20} strokeWidth={isAccountActive ? 2.5 : 1.8} style={{ color: '#06b6d4' }} />
          ) : (
            <User size={20} strokeWidth={isAccountActive ? 2.5 : 1.8} />
          )}
          <span>{user ? (user.role === 'admin' ? 'Admin' : 'Profile') : 'Login'}</span>
        </Link>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
