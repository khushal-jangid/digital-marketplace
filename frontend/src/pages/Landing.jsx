import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request } from '../utils/api';
import ProjectCard from '../components/ProjectCard';
import Loader from '../components/Loader';
import FlashSaleBanner from '../components/FlashSaleBanner';
import { Search, ArrowRight, Sparkles, Code, Send, Bot } from 'lucide-react';

const Landing = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await request('/projects?sort=popular');
        if (data && data.success && Array.isArray(data.projects)) {
          setProjects(data.projects);
          setLoadError('');
        } else {
          setLoadError((data && data.message) || 'Could not load projects.');
        }
      } catch (error) {
        setLoadError(error.message || 'Could not load projects.');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchText.trim()) {
      navigate(`/projects?search=${encodeURIComponent(searchText.trim())}`);
    } else {
      navigate('/projects');
    }
  };

  const getFilteredProjects = () => {
    const safeList = Array.isArray(projects) ? projects : [];
    if (activeTab === 'source-code') {
      return safeList.filter((p) => p && p.category === 'source-code');
    } else if (activeTab === 'templates') {
      return safeList.filter((p) => p && p.category === 'templates');
    } else if (activeTab === 'pdfs') {
      return safeList.filter((p) => p && p.category === 'pdfs');
    }
    return safeList;
  };

  const filteredProjects = getFilteredProjects();

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* Clean, Simple Hero Section */}
      <section
        style={{
          padding: '60px 0 40px 0',
          borderBottom: '1px solid var(--border)',
          textAlign: 'center',
        }}
      >
        <div className="container" style={{ maxWidth: '760px', margin: '0 auto' }}>
          
          {/* Telegram Channel Community Badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
            <a
              href="https://t.me/+Z8ED50UDiZI2YWQ1"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                borderRadius: '24px',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 2px 10px rgba(56, 189, 248, 0.15)',
                transition: 'all 0.2s ease',
              }}
            >
              <Send size={13} style={{ color: '#38bdf8' }} />
              <span>Join our Telegram for Free Source Codes & Deals</span>
              <ArrowRight size={13} />
            </a>
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px, 5vw, 42px)',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: '14px',
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
            }}
          >
            Digital Project Marketplace
          </h1>

          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '15.5px',
              lineHeight: 1.6,
              marginBottom: '28px',
            }}
          >
            Browse, purchase, and download developer source codes, web templates, and technical guides.
          </p>

          {/* Direct Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hero-search-form"
            style={{
              display: 'flex',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '6px',
              maxWidth: '540px',
              margin: '0 auto',
            }}
          >
            <div style={{ position: 'relative', flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              <Search size={17} style={{ color: 'var(--text-muted)', marginLeft: '12px', position: 'absolute' }} />
              <input
                type="text"
                placeholder="Search projects by title or technology..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  padding: '10px 10px 10px 38px',
                  outline: 'none',
                  fontSize: '14px',
                }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13.5px',
                fontWeight: 600,
              }}
            >
              Search
            </button>
          </form>

        </div>
      </section>

      {/* IndianAgent AI Showcase Section */}
      <section className="container" style={{ marginTop: '24px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.09) 0%, rgba(239, 68, 68, 0.08) 50%, rgba(139, 92, 246, 0.09) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.28)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                flexShrink: 0,
              }}
            >
              <Bot size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Need Project Planning, Viva Notes or Deep Research?
                </h4>
                <span style={{ fontSize: '11px', background: '#f59e0b', color: '#000000', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                  FREE AI AGENT
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Try <strong>IndianAgent</strong> — generate PDF notes, technical content, deep web research, and project architecture roadmaps.
              </p>
            </div>
          </div>

          <Link
            to="/ai-agent"
            className="btn btn-primary"
            style={{
              padding: '9px 18px',
              fontSize: '13.5px',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#000000',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              boxShadow: '0 2px 10px rgba(245, 158, 11, 0.3)',
            }}
          >
            <Bot size={15} />
            <span>Launch IndianAgent</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Flash Sale Countdown Banner */}
      <div className="container" style={{ marginTop: '24px' }}>
        <FlashSaleBanner />
      </div>

      {/* Catalog & Filter Navigation */}
      <section className="container" style={{ marginTop: '40px' }}>
        
        {/* Simple Tabs */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '16px',
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'all', label: 'All Projects' },
              { id: 'source-code', label: 'Source Codes' },
              { id: 'templates', label: 'Templates' },
              { id: 'pdfs', label: 'Guides & PDFs' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '7px 16px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: activeTab === tab.id ? 'var(--primary)' : 'var(--border)',
                  background: activeTab === tab.id ? 'var(--primary-light)' : 'var(--bg-secondary)',
                  color: activeTab === tab.id ? '#818cf8' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Link
            to="/projects"
            style={{
              textDecoration: 'none',
              color: 'var(--accent)',
              fontSize: '13.5px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>View Full Catalog</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <Loader />
        ) : filteredProjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <p>{loadError || 'No projects found in this category.'}</p>
          </div>
        ) : (
          <div className="grid-cols-4">
            {filteredProjects.slice(0, 8).map((project) => (
              <ProjectCard key={project._id || Math.random()} project={project} />
            ))}
          </div>
        )}
      </section>

      {/* Prominent Custom Project Service Callout */}
      <section className="container" style={{ marginTop: '60px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(6, 182, 212, 0.12) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: '16px',
            padding: '36px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px',
          }}
        >
          <div style={{ maxWidth: '600px' }}>
            <span
              style={{
                background: 'rgba(79, 70, 229, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#818cf8',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '11.5px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '10px',
              }}
            >
              <Sparkles size={13} style={{ color: '#fef08a' }} />
              <span>CUSTOM WORK BY KHUSHAL JANGID</span>
            </span>
            <h2 style={{ fontSize: '24px', color: 'var(--text-primary)', fontWeight: 800, margin: '0 0 8px 0' }}>
              Want a custom web application built or tailored?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', margin: 0, lineHeight: 1.6 }}>
              Submit your idea with your preferred tech stack and budget with a minimal ₹50 entry fee. Khushal will personally build your project and provide video progress demo updates.
            </p>
          </div>

          <Link
            to="/custom-project"
            className="btn btn-primary"
            style={{
              padding: '12px 24px',
              fontSize: '14.5px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              border: 'none',
              boxShadow: '0 4px 20px rgba(79, 70, 229, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '8px',
            }}
          >
            <Sparkles size={17} style={{ color: '#fef08a' }} />
            <span>Submit Custom Request (₹50)</span>
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

    </div>
  );
};

export default Landing;
