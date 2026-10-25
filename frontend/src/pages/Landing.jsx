import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request } from '../utils/api';
import ProjectCard from '../components/ProjectCard';
import Loader from '../components/Loader';
import FlashSaleBanner from '../components/FlashSaleBanner';
import {
  Search,
  ArrowRight,
  Sparkles,
  Send,
  Bot,
  Clock,
  Copy,
  Check,
} from 'lucide-react';

const Landing = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [copiedCode, setCopiedCode] = useState('');
  const navigate = useNavigate();

  // Diwali Countdown Timer (flipkart/amazon style)
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 14,
    minutes: 36,
    seconds: 48,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return { days: 2, hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const copyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2200);
  };

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
      
      {/* ========================================================
          GRAND FLIPKART & AMAZON STYLE BIG DIWALI FESTIVAL HERO
          ======================================================== */}
      <section
        style={{
          position: 'relative',
          padding: '48px 16px 56px 16px',
          background: 'radial-gradient(ellipse at 50% 15%, #5a0c1f 0%, #2b0b2e 45%, #0f0728 85%, #070214 100%)',
          borderBottom: '2px solid rgba(245, 158, 11, 0.45)',
          overflow: 'hidden',
          boxShadow: 'inset 0 -20px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Decorative Golden Toran / Marigold Garland across top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '24px',
            display: 'flex',
            justifyContent: 'space-around',
            opacity: 0.85,
            pointerEvents: 'none',
          }}
        >
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                animation: `diwali-sway 3s infinite ease-in-out ${i * 0.15}s`,
              }}
            >
              <div style={{ width: '2px', height: '10px', background: '#d97706' }} />
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: i % 2 === 0 ? '#f59e0b' : '#ef4444',
                  boxShadow: '0 0 6px rgba(245, 158, 11, 0.8)',
                }}
              />
            </div>
          ))}
        </div>

        <div className="container" style={{ maxWidth: '980px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          
          {/* Top Festive Badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 18px',
                borderRadius: '999px',
                background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.25) 0%, rgba(220, 38, 38, 0.25) 100%)',
                border: '1px solid rgba(251, 191, 36, 0.6)',
                color: '#fef08a',
                fontSize: '12.5px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                boxShadow: '0 0 16px rgba(245, 158, 11, 0.35)',
                textTransform: 'uppercase',
              }}
            >
              <Sparkles size={14} style={{ color: '#fbbf24' }} />
              <span>ðŸª” BIG DIWALI TECH FESTIVAL 2026 â€¢ DHAMAKA DEALS ðŸª”</span>
              <Sparkles size={14} style={{ color: '#fbbf24' }} />
            </div>
          </div>

          {/* Grand Festive Title */}
          <h1
            style={{
              fontSize: 'clamp(28px, 5.5vw, 48px)',
              fontWeight: 900,
              lineHeight: 1.15,
              marginBottom: '14px',
              background: 'linear-gradient(135deg, #ffffff 0%, #fde047 50%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
              textShadow: '0 2px 20px rgba(245, 158, 11, 0.3)',
            }}
          >
            Light Up Your Projects With Mega Festive Deals!
          </h1>

          <p
            style={{
              color: 'rgba(255, 255, 255, 0.88)',
              fontSize: 'clamp(14px, 2.5vw, 17px)',
              lineHeight: 1.6,
              maxWidth: '680px',
              margin: '0 auto 24px auto',
            }}
          >
            Auspicious Deepawali offers on <strong>16+ Verified Full-Stack Projects, SaaS Kits, & Source Codes</strong>. Instant Google Drive downloads, complete setup guides, and zero hassle!
          </p>

          {/* Flipkart / Amazon Style Live Countdown Clock */}
          <div
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '16px',
              background: 'rgba(15, 7, 40, 0.75)',
              border: '1px solid rgba(251, 191, 36, 0.5)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(245, 158, 11, 0.25)',
              marginBottom: '32px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fde047', fontSize: '12px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <Clock size={14} />
              <span>â° DIWALI DHAMAKA OFFERS END IN:</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { label: 'DAYS', val: timeLeft.days },
                { label: 'HOURS', val: timeLeft.hours },
                { label: 'MINS', val: timeLeft.minutes },
                { label: 'SECS', val: timeLeft.seconds },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: 'linear-gradient(180deg, #1f0b35 0%, #110522 100%)',
                    border: '1px solid rgba(251, 191, 36, 0.4)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    minWidth: '54px',
                  }}
                >
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#fef08a', fontFamily: 'monospace' }}>
                    {String(item.val).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.06em' }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 4 Amazon / Flipkart Style Festive Deal Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '14px',
              marginBottom: '32px',
              textAlign: 'left',
            }}
          >
            {/* Deal 1 */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(120, 2, 6, 0.65) 0%, rgba(20, 5, 40, 0.75) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                borderRadius: '12px',
                padding: '14px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>
                  FLAT 50% OFF
                </span>
                <span style={{ fontSize: '18px' }}>ðŸª”</span>
              </div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>
                Major Projects Code
              </div>
              <div style={{ color: '#fde047', fontSize: '11.5px', marginBottom: '8px' }}>
                Use coupon: <strong>DIWALI50</strong>
              </div>
              <button
                onClick={() => copyCoupon('DIWALI50')}
                type="button"
                style={{
                  width: '100%',
                  background: copiedCode === 'DIWALI50' ? '#10b981' : 'linear-gradient(90deg, #f59e0b, #d97706)',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: '11px',
                  border: 'none',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                {copiedCode === 'DIWALI50' ? <Check size={12} /> : <Copy size={12} />}
                {copiedCode === 'DIWALI50' ? 'Copied 50% Code!' : 'Copy DIWALI50'}
              </button>
            </div>

            {/* Deal 2 */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(6, 17, 97, 0.65) 0%, rgba(20, 5, 40, 0.75) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                borderRadius: '12px',
                padding: '14px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, background: '#38bdf8', color: '#000', padding: '2px 8px', borderRadius: '4px' }}>
                  STEAL DEAL
                </span>
                <span style={{ fontSize: '18px' }}>âš¡</span>
              </div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>
                Mini Projects & Utilities
              </div>
              <div style={{ color: '#38bdf8', fontSize: '11.5px', marginBottom: '8px' }}>
                Starting at only <strong>â‚¹99 - â‚¹199</strong>
              </div>
              <button
                onClick={() => navigate('/projects?category=templates')}
                type="button"
                style={{
                  width: '100%',
                  background: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  border: '1px solid #38bdf8',
                  fontWeight: 700,
                  fontSize: '11px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Explore â‚¹99 Deals â†’
              </button>
            </div>

            {/* Deal 3 */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(74, 4, 78, 0.65) 0%, rgba(20, 5, 40, 0.75) 100%)',
                border: '1px solid rgba(236, 72, 153, 0.45)',
                borderRadius: '12px',
                padding: '14px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, background: '#ec4899', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>
                  DHAMAKA BUNDLE
                </span>
                <span style={{ fontSize: '18px' }}>ðŸŽ</span>
              </div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>
                Buy 2 Get 1 FREE
              </div>
              <div style={{ color: '#f472b6', fontSize: '11.5px', marginBottom: '8px' }}>
                Automatic festive bundle offer
              </div>
              <button
                onClick={() => copyCoupon('DIWALIBUNDLE')}
                type="button"
                style={{
                  width: '100%',
                  background: copiedCode === 'DIWALIBUNDLE' ? '#10b981' : 'linear-gradient(90deg, #ec4899, #8b5cf6)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '11px',
                  border: 'none',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                {copiedCode === 'DIWALIBUNDLE' ? <Check size={12} /> : <Copy size={12} />}
                {copiedCode === 'DIWALIBUNDLE' ? 'Copied Bundle Code!' : 'Copy DIWALIBUNDLE'}
              </button>
            </div>

            {/* Deal 4 */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.65) 0%, rgba(20, 5, 40, 0.75) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.45)',
                borderRadius: '12px',
                padding: '14px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, background: '#10b981', color: '#000', padding: '2px 8px', borderRadius: '4px' }}>
                  FESTIVE CUSTOM
                </span>
                <span style={{ fontSize: '18px' }}>ðŸš€</span>
              </div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>
                Custom College Projects
              </div>
              <div style={{ color: '#6ee7b7', fontSize: '11.5px', marginBottom: '8px' }}>
                Tailored build with Viva prep
              </div>
              <button
                onClick={() => navigate('/custom-project')}
                type="button"
                style={{
                  width: '100%',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  border: '1px solid #10b981',
                  fontWeight: 700,
                  fontSize: '11px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Request Custom Work â†’
              </button>
            </div>
          </div>

          {/* Search Bar in Festive Card */}
          <form
            onSubmit={handleSearchSubmit}
            className="hero-search-form"
            style={{
              display: 'flex',
              background: 'rgba(15, 7, 40, 0.85)',
              border: '2px solid rgba(251, 191, 36, 0.5)',
              borderRadius: '999px',
              padding: '6px 8px',
              maxWidth: '580px',
              margin: '0 auto',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.25)',
            }}
          >
            <div style={{ position: 'relative', flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              <Search size={18} style={{ color: '#f59e0b', marginLeft: '14px', position: 'absolute' }} />
              <input
                type="text"
                placeholder="Search Diwali deals: MERN stack, Python AI, React SaaS..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  padding: '10px 10px 10px 42px',
                  outline: 'none',
                  fontSize: '14px',
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '10px 22px',
                borderRadius: '999px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(245, 158, 11, 0.4)',
              }}
            >
              Search Deals ðŸª”
            </button>
          </form>

        </div>
      </section>

      {/* IndianAgent AI Showcase Section */}
      <section className="container" style={{ marginTop: '24px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(239, 68, 68, 0.08) 50%, rgba(139, 92, 246, 0.1) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
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
                Try <strong>IndianAgent</strong> - generate PDF notes, technical content, deep web research, and project architecture roadmaps.
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
        
        {/* Simple Tabs with Festive Glow */}
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
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'ðŸª” All Diwali Deals' },
              { id: 'source-code', label: 'ðŸ’» Full Source Codes' },
              { id: 'templates', label: 'âš¡ Starter Templates' },
              { id: 'pdfs', label: 'ðŸ“„ Architecture & Viva Guides' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 18px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: activeTab === tab.id ? '#f59e0b' : 'var(--border)',
                  background: activeTab === tab.id ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(220, 38, 38, 0.15) 100%)' : 'var(--bg-secondary)',
                  color: activeTab === tab.id ? '#fbbf24' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTab === tab.id ? '0 0 10px rgba(245, 158, 11, 0.25)' : 'none',
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
              color: '#fbbf24',
              fontSize: '13.5px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>View Full Festive Catalog</span>
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
            {filteredProjects.slice(0, 12).map((project) => (
              <ProjectCard key={project._id || Math.random()} project={project} />
            ))}
          </div>
        )}
      </section>

      {/* Prominent Custom Project Service Callout */}
      <section className="container" style={{ marginTop: '60px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(220, 38, 38, 0.12) 50%, rgba(79, 70, 229, 0.12) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '16px',
            padding: '36px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px',
            boxShadow: '0 4px 20px rgba(245, 158, 11, 0.15)',
          }}
        >
          <div style={{ maxWidth: '600px' }}>
            <span
              style={{
                background: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.5)',
                color: '#fbbf24',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '11.5px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                display: 'inline-block',
                marginBottom: '12px',
              }}
            >
              ðŸª” Festive Custom Development Offer
            </span>
            <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '10px', color: 'var(--text-primary)' }}>
              Need a Custom Web, Mobile App or College Major Project?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', lineHeight: 1.6, margin: 0 }}>
              Get verified end-to-end fullstack development built to your requirements. Includes clean modular source code, installation walk-through, database schema, and complete documentation.
            </p>
          </div>
          <Link
            to="/custom-project"
            className="btn btn-primary"
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
              color: '#ffffff',
              border: 'none',
              boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>Commission Custom Project</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

    </div>
  );
};

export default Landing;

