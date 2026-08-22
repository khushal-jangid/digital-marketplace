import React from 'react';
import { ExternalLink, Code2, ShieldCheck, Mail, Sparkles, Terminal, Award, ArrowRight, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutCreator = () => {
  return (
    <div className="container animate-fade-in" style={{ padding: '48px 24px 80px 24px', maxWidth: '1000px' }}>
      
      {/* Hero Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '40px 32px',
          marginBottom: '40px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: '650px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#818cf8',
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '16px',
              border: '1px solid rgba(99, 102, 241, 0.25)',
            }}
          >
            <UserCheck size={14} /> Meet the Creator & Developer
          </div>

          <h1
            style={{
              fontSize: '34px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              lineHeight: 1.2,
              marginBottom: '14px',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Khushal Jangid
          </h1>

          <p
            style={{
              fontSize: '16px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '24px',
            }}
          >
            Full-Stack Web Developer, UI/UX Designer & Creator of <strong>ApexMarket</strong>. Dedicated to building production-grade web applications, modern dashboard templates, and clean, reusable developer source codes.
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <a
              href="https://webkhushal-nu.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 22px',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Visit Official Portfolio <ExternalLink size={16} />
            </a>

            <Link
              to="/support?tab=email"
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              <Mail size={16} /> Send Direct Message
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Philosophy & Tech Stack */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        
        {/* Core Principles Card */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <ShieldCheck size={20} style={{ color: '#10b981' }} />
            Quality & Authenticity
          </h3>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px' }}>
            Every project and template on ApexMarket is handcrafted and tested. No broken boilerplate or unmaintainable code.
          </p>
          <ul style={{ paddingLeft: '18px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
            <li>Clean architecture & modular components</li>
            <li>Full responsive mobile-first UI</li>
            <li>Complete setup guides & documentation</li>
            <li>Direct post-purchase developer assistance</li>
          </ul>
        </div>

        {/* Tech Stack Card */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Code2 size={20} style={{ color: '#6366f1' }} />
            Core Technology Stack
          </h3>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px' }}>
            Built using modern, scalable web technologies trusted across industry standards:
          </p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {['React.js', 'Next.js', 'Node.js', 'Express.js', 'MongoDB', 'JavaScript (ES6+)', 'TailwindCSS', 'REST APIs', 'Vite', 'Git'].map((tech) => (
              <span
                key={tech}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 500,
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* Hire for Custom Work Banner */}
      <div
        className="glass-card"
        style={{
          padding: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%)',
        }}
      >
        <div style={{ maxWidth: '580px' }}>
          <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 700 }}>
            Need Custom Development or a Complete Website?
          </h3>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            I build custom full-stack web applications, landing pages, and business software tailored specifically to your requirements.
          </p>
        </div>

        <Link
          to="/request-project"
          className="btn btn-primary"
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Request Custom Project <ArrowRight size={16} />
        </Link>
      </div>

    </div>
  );
};

export default AboutCreator;
