import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { Star, Heart, ShoppingCart, ArrowUpRight, Check } from 'lucide-react';

const ProjectCard = ({ project }) => {
  if (!project || !project._id) return null;

  const { user, toggleWishlist, isInWishlist, isPurchased } = useAuth();
  const { cartItems, addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  const isOwned = isPurchased ? isPurchased(project._id) : false;
  const isWishlisted = isInWishlist ? isInWishlist(project._id) : false;
  const inCart = (cartItems || []).some((item) => item && item._id === project._id);

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    if (toggleWishlist) {
      await toggleWishlist(project._id);
    }
  };

  const handleCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCart) {
      navigate('/cart');
    } else {
      addToCart(project);
    }
  };

  const categoryLabels = {
    'source-code': 'Source Code',
    'templates': 'Template',
    'pdfs': 'Architecture Guide',
    'graphics': 'Asset Pack',
    'datasets': 'Dataset',
    'others': 'Software',
  };

  const thumbnail =
    (Array.isArray(project.previewUrls) && project.previewUrls[0]) ||
    project.previewUrls ||
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';

  const averageRating = project.ratings?.average || 4.9;
  const ratingCount = project.ratings?.count || 18;
  const isFeatured = project.price === 299 || project.downloadCount > 3;

  const techList = Array.isArray(project.techStack)
    ? project.techStack
    : (typeof project.techStack === 'string' ? project.techStack.split(',') : []);

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        height: '100%',
      }}
      className="project-card-wrapper"
    >
      {/* Top Banner Image with Hover Zoom */}
      <div
        style={{
          position: 'relative',
          height: '170px',
          width: '100%',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-tertiary)',
        }}
      >
        <Link to={`/projects/${project._id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
          <img
            src={typeof thumbnail === 'string' ? thumbnail : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'}
            alt={project.title || 'Project'}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.4s ease',
            }}
            className="card-thumb-img"
          />
        </Link>

        {/* Category Pill */}
        <span
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            background: 'rgba(8, 9, 13, 0.85)',
            color: 'var(--text-primary)',
            fontSize: '11px',
            fontWeight: '600',
            padding: '3px 9px',
            borderRadius: '4px',
            backdropFilter: 'blur(4px)',
            letterSpacing: '0.02em',
          }}
        >
          {categoryLabels[project.category] || 'Digital Asset'}
        </span>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlistClick}
          aria-label="Toggle Wishlist"
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: isWishlisted ? 'rgba(239, 68, 68, 0.9)' : 'rgba(8, 9, 13, 0.65)',
            color: '#ffffff',
            border: 'none',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s ease',
          }}
        >
          <Heart size={15} fill={isWishlisted ? '#ffffff' : 'none'} />
        </button>

        {isOwned ? (
          <span
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: '800',
              padding: '2px 8px',
              borderRadius: '4px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
            }}
          >
            ✓ PURCHASED
          </span>
        ) : Number(project.price) === 0 ? (
          <span
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontSize: '10.5px',
              fontWeight: '800',
              padding: '2px 8px',
              borderRadius: '4px',
              letterSpacing: '0.04em',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.5)',
            }}
          >
            🎁 FREE
          </span>
        ) : isFeatured ? (
          <span
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#000000',
              fontSize: '10px',
              fontWeight: '800',
              padding: '2px 8px',
              borderRadius: '4px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            POPULAR
          </span>
        ) : null}
      </div>

      {/* Card Body */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        
        {/* Rating Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
          <Star size={13} fill="#fbbf24" stroke="#fbbf24" />
          <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)' }}>
            {averageRating}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            ({ratingCount})
          </span>
        </div>

        {/* Title */}
        <Link
          to={`/projects/${project._id}`}
          style={{
            textDecoration: 'none',
            color: 'var(--text-primary)',
            fontSize: '14.5px',
            fontWeight: '700',
            lineHeight: 1.35,
            marginBottom: '8px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {project.title}
        </Link>

        {/* Tech Stack Badges */}
        {techList.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '14px' }}>
            {techList.slice(0, 3).map((tech, idx) => (
              <span
                key={idx}
                style={{
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  padding: '2px 7px',
                  borderRadius: '3px',
                  border: '1px solid var(--border)',
                }}
              >
                {typeof tech === 'string' ? tech.trim() : tech}
              </span>
            ))}
            {techList.length > 3 && (
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', alignSelf: 'center' }}>
                +{techList.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Price and Add to Cart Button Footer */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              {Number(project.price) === 0 ? (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '17px', fontWeight: '800', color: '#10b981' }}>
                  FREE
                </span>
              ) : (
                <>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '17px', fontWeight: '600', color: 'var(--primary)' }}>
                    {formatPrice ? formatPrice(project.price) : `₹${project.price}`}
                  </span>
                  {project.originalPrice > project.price && (
                    <span style={{ fontSize: '12px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                      {formatPrice ? formatPrice(project.originalPrice) : `₹${project.originalPrice}`}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {isOwned ? (
            <Link
              to="/dashboard"
              style={{
                padding: '7px 12px',
                fontSize: '12px',
                fontWeight: '700',
                borderRadius: 'var(--radius-sm)',
                gap: '5px',
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#22c55e',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <Check size={14} strokeWidth={2.5} />
              <span>Purchased</span>
            </Link>
          ) : Number(project.price) === 0 ? (
            <Link
              to={`/projects/${project._id}`}
              style={{
                padding: '7px 13px',
                fontSize: '12px',
                fontWeight: '700',
                borderRadius: 'var(--radius-sm)',
                gap: '4px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
              }}
            >
              <span>Get Free</span>
              <ArrowUpRight size={13} />
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleCartClick}
              className="btn btn-primary"
              style={{
                padding: '7px 12px',
                fontSize: '12.5px',
                borderRadius: 'var(--radius-sm)',
                gap: '6px',
              }}
            >
              {inCart ? (
                <>
                  <Check size={14} />
                  <span>In Cart</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={14} />
                  <span>Add</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProjectCard;
