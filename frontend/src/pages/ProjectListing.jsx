import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { request } from '../utils/api';
import ProjectCard from '../components/ProjectCard';
import Loader from '../components/Loader';
import FlashSaleBanner from '../components/FlashSaleBanner';
import { Search, SlidersHorizontal, ArrowUpDown, Filter, RotateCcw, X, Sparkles, ArrowRight } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const ProjectListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const initialSearch = searchParams.get('search') || '';
  const { formatPrice } = useCurrency();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Filter States
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [priceRange, setPriceRange] = useState('all');
  const [sort, setSort] = useState('new');

  const categories = [
    { value: 'all', label: 'All Catalog' },
    { value: 'source-code', label: 'Source Codes' },
    { value: 'templates', label: 'Templates' },
    { value: 'pdfs', label: 'PDF Guides' },
  ];

  const priceRanges = [
    { id: 'all', label: 'All Prices' },
    { id: 'under-250', label: 'Under ₹250', max: 250 },
    { id: '250-500', label: '₹250 - ₹500', min: 250, max: 500 },
    { id: '500-plus', label: '₹500+', min: 500 },
  ];

  const fetchProjects = async () => {
    setLoading(true);
    try {
      let queryStr = `?sort=${sort}`;
      if (search.trim()) {
        queryStr += `&search=${encodeURIComponent(search.trim())}`;
      }
      if (category && category !== 'all') {
        queryStr += `&category=${category}`;
      }

      const activeRange = priceRanges.find((r) => r.id === priceRange);
      if (activeRange) {
        if (activeRange.min) queryStr += `&minPrice=${activeRange.min}`;
        if (activeRange.max) queryStr += `&maxPrice=${activeRange.max}`;
      }

      const data = await request(`/projects${queryStr}`, 'GET');
      if (data && data.success && Array.isArray(data.projects)) {
        setProjects(data.projects);
        setLoadError('');
      } else {
        setProjects([]);
        setLoadError((data && data.message) || 'Could not load projects.');
      }
    } catch (error) {
      setProjects([]);
      setLoadError(error.message || 'Could not load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects();
    }, 150);
    return () => clearTimeout(timer);
  }, [search, category, priceRange, sort]);

  const handleResetFilters = () => {
    setSearch('');
    setCategory('all');
    setPriceRange('all');
    setSort('new');
  };

  const hasActiveFilters = search || category !== 'all' || priceRange !== 'all';
  const safeProjects = Array.isArray(projects) ? projects : [];

  return (
    <div className="container animate-fade-in" style={{ padding: '36px 24px 80px 24px' }}>
      
      {/* Header Title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '6px' }}>
          Explore Verified Projects & Templates
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px' }}>
          Browse production-grade source codes, cloud architectures, and developer starter kits curated by Khushal Jangid.
        </p>
      </div>

      {/* Flash Sale Deal of the Day Countdown Timer */}
      <FlashSaleBanner />

      {/* Control Filter Toolbar */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          marginBottom: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Search and Secondary Inputs */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', flexGrow: 1, minWidth: '220px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search by keywords, title, tech..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{
                paddingLeft: '36px',
                paddingRight: search ? '36px' : '12px',
                height: '40px',
                fontSize: '13.5px',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div style={{ minWidth: '160px' }}>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="form-input"
              style={{ height: '40px', fontSize: '13.5px', cursor: 'pointer' }}
            >
              <option value="new">Newest Additions</option>
              <option value="popular">Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-secondary"
              style={{ height: '40px', padding: '0 14px', fontSize: '13px', gap: '6px' }}
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Category Pills & Price Filter Ribbon */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            borderTop: '1px solid var(--border)',
            paddingTop: '16px',
          }}
        >
          {/* Category Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {categories.map((cat) => (
              <button
                type="button"
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: category === cat.value ? 'var(--primary)' : 'var(--border)',
                  background: category === cat.value ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                  color: category === cat.value ? '#818cf8' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Price Ranges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '2px' }}>
            {priceRanges.map((pr) => (
              <button
                type="button"
                key={pr.id}
                onClick={() => setPriceRange(pr.id)}
                style={{
                  fontSize: '11.5px',
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: priceRange === pr.id ? '#10b981' : 'var(--border)',
                  background: priceRange === pr.id ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  color: priceRange === pr.id ? '#10b981' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {pr.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Projects Results Counter */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          fontSize: '13px',
          color: 'var(--text-muted)',
        }}
      >
        <span>
          Showing <strong style={{ color: 'var(--text-primary)' }}>{safeProjects.length}</strong> projects
        </span>
      </div>

      {/* Projects Grid */}
      <div>
        {loading ? (
          <Loader />
        ) : safeProjects.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '70px 24px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '16px' }}>
              {loadError || 'No projects match your current search and filter selections.'}
            </p>
            {loadError ? (
              <button onClick={fetchProjects} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                Retry
              </button>
            ) : (
              <button
                onClick={handleResetFilters}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid-cols-4">
            {safeProjects.map((proj) => (
              <ProjectCard key={proj._id || Math.random()} project={proj} />
            ))}
          </div>
        )}
      </div>

      {/* Prominent Custom Project Callout Card */}
      <div
        className="custom-project-callout-card"
        style={{
          marginTop: '40px',
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(6, 182, 212, 0.12) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          borderRadius: '16px',
          padding: '28px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '18px',
        }}
      >
        <div style={{ maxWidth: '560px' }}>
          <span
            style={{
              background: 'rgba(79, 70, 229, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              color: '#818cf8',
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '8px',
            }}
          >
            <Sparkles size={12} style={{ color: '#fef08a' }} />
            <span>CUSTOM DEVELOPMENT</span>
          </span>
          <h3 style={{ fontSize: '19px', color: 'var(--text-primary)', fontWeight: 800, margin: '0 0 6px 0' }}>
            Need custom modifications or a new project?
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: 0, lineHeight: 1.5 }}>
            Submit your requirements, preferred tech stack, and budget with a ₹50 entry fee. Khushal will build it for you with milestone WhatsApp updates.
          </p>
        </div>

        <Link
          to="/custom-project"
          className="btn btn-primary"
          style={{
            padding: '11px 20px',
            fontSize: '13.5px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
            border: 'none',
            boxShadow: '0 4px 16px rgba(79, 70, 229, 0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            borderRadius: '8px',
          }}
        >
          <Sparkles size={15} style={{ color: '#fef08a' }} />
          <span>Request Custom Project (₹50)</span>
          <ArrowRight size={15} />
        </Link>
      </div>

    </div>
  );
};

export default ProjectListing;
