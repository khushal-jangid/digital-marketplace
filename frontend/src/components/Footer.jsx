import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, MessageSquare, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        padding: '36px 0 24px 0',
        marginTop: 'auto',
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-secondary)',
        fontSize: '13px',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
          marginBottom: '24px',
        }}
      >
        {/* Brand Column */}
        <div style={{ maxWidth: '340px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div
              style={{
                background: 'var(--primary)',
                width: '22px',
                height: '22px',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Terminal size={13} strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px' }}>
              ApexMarket
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.5', fontSize: '12.5px' }}>
            Built & curated by <strong>Khushal Jangid</strong>. A digital marketplace for web applications, templates, and developer source code.
          </p>
        </div>

        {/* Quick Links Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h5 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '13.5px', marginBottom: '2px' }}>
            Marketplace & Custom Work
          </h5>
          <Link
            to="/custom-project"
            style={{
              color: '#818cf8',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '13px',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#a5b4fc')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#818cf8')}
          >
            ✨ Request Custom Project (₹50)
          </Link>
          <Link
            to="/projects"
            style={{
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '13px',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Explore Projects
          </Link>
          <a
            href="https://webkhushal-nu.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '13px',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Official Portfolio ↗
          </a>
        </div>

        {/* Support Options Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h5 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '13.5px', marginBottom: '2px' }}>
            Support & Help
          </h5>
          <Link
            to="/support?tab=chat"
            style={{
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <MessageSquare size={14} style={{ color: '#818cf8' }} />
            <span>Live Support Chat</span>
          </Link>
          <Link
            to="/support?tab=email"
            style={{
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <Mail size={14} style={{ color: '#06b6d4' }} />
            <span>Email Support</span>
          </Link>
        </div>
      </div>

      <div
        className="container"
        style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12px',
          color: 'var(--text-muted)',
        }}
      >
        <p>© {new Date().getFullYear()} Khushal Jangid • ApexMarket. All rights reserved.</p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/projects" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Projects Catalog</Link>
          <Link to="/custom-project" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Custom Project (₹50)</Link>
          <Link to="/support" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Support Center</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
