import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Copy, Check, ArrowRight, X, Sparkles, Tag } from 'lucide-react';
import { request } from '../utils/api';

const THEME_STYLES = {
  diwali: {
    containerBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(217, 119, 6, 0.18) 50%, rgba(220, 38, 38, 0.16) 100%)',
    borderColor: 'rgba(245, 158, 11, 0.45)',
    boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.25)',
    badgeBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    badgeIcon: '🪔',
    accentColor: '#f59e0b',
  },
  holi: {
    containerBg: 'linear-gradient(135deg, rgba(236, 72, 153, 0.22) 0%, rgba(139, 92, 246, 0.2) 50%, rgba(6, 182, 212, 0.18) 100%)',
    borderColor: 'rgba(236, 72, 153, 0.45)',
    boxShadow: '0 10px 25px -5px rgba(236, 72, 153, 0.25)',
    badgeBg: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%)',
    badgeIcon: '🎨',
    accentColor: '#ec4899',
  },
  republic_day: {
    containerBg: 'linear-gradient(135deg, rgba(249, 115, 22, 0.22) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(16, 185, 129, 0.2) 100%)',
    borderColor: 'rgba(249, 115, 22, 0.45)',
    boxShadow: '0 10px 25px -5px rgba(249, 115, 22, 0.2)',
    badgeBg: 'linear-gradient(135deg, #f97316 0%, #0284c7 50%, #10b981 100%)',
    badgeIcon: '🇮🇳',
    accentColor: '#f97316',
  },
  independence_day: {
    containerBg: 'linear-gradient(135deg, rgba(249, 115, 22, 0.22) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(16, 185, 129, 0.2) 100%)',
    borderColor: 'rgba(249, 115, 22, 0.45)',
    boxShadow: '0 10px 25px -5px rgba(249, 115, 22, 0.2)',
    badgeBg: 'linear-gradient(135deg, #f97316 0%, #0284c7 50%, #10b981 100%)',
    badgeIcon: '🇮🇳',
    accentColor: '#f97316',
  },
  new_year: {
    containerBg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.22) 0%, rgba(236, 72, 153, 0.18) 50%, rgba(234, 179, 8, 0.18) 100%)',
    borderColor: 'rgba(168, 85, 247, 0.45)',
    boxShadow: '0 10px 25px -5px rgba(168, 85, 247, 0.25)',
    badgeBg: 'linear-gradient(135deg, #a855f7 0%, #eab308 100%)',
    badgeIcon: '🎆',
    accentColor: '#a855f7',
  },
  flash: {
    containerBg: 'linear-gradient(135deg, rgba(79, 70, 229, 0.18) 0%, rgba(244, 63, 94, 0.15) 50%, rgba(245, 158, 11, 0.15) 100%)',
    borderColor: 'rgba(244, 63, 94, 0.35)',
    boxShadow: '0 10px 25px -5px rgba(244, 63, 94, 0.12)',
    badgeBg: 'linear-gradient(135deg, #f43f5e 0%, #ea580c 100%)',
    badgeIcon: '⚡',
    accentColor: '#f43f5e',
  },
};

const FlashSaleBanner = () => {
  const [saleData, setSaleData] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00' });
  const [copied, setCopied] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // Fetch active flash/festival sale configuration from server
  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        const data = await request('/flash-sale', 'GET');
        if (data.success && data.flashSale) {
          setSaleData(data.flashSale);
        }
      } catch (err) {
        console.warn('Failed to load flash sale config:', err.message);
      }
    };
    fetchFlashSale();
  }, []);

  // Dynamic ticking countdown timer against saleData.endTime
  useEffect(() => {
    if (!saleData || !saleData.endTime) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(saleData.endTime).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setIsExpired(true);
        return { hours: '00', minutes: '00', seconds: '00' };
      }

      setIsExpired(false);
      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return {
        hours: String(totalHours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0'),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [saleData]);

  if (isDismissed || !saleData || !saleData.isActive || isExpired) {
    return null;
  }

  const promoCode = saleData.promoCode || 'FLASH35';
  const discountPercent = saleData.discountPercentage || 35;
  const title = saleData.title || `Special Festival Offer: Flat ${discountPercent}% OFF!`;
  const themeKey = saleData.festivalTheme || 'flash';
  const theme = THEME_STYLES[themeKey] || THEME_STYLES.flash;
  const badgeLabel = saleData.badge || 'FESTIVAL SALE';
  const isStorewide = !saleData.targetProject || saleData.targetProject === 'all';

  const handleCopy = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(promoCode);
    try {
      localStorage.setItem('copied_promo', promoCode);
    } catch (_) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="flash-sale-container animate-fade-in"
      style={{
        margin: '20px auto 32px auto',
        maxWidth: '1200px',
        padding: '0 20px',
      }}
    >
      <div
        style={{
          background: theme.containerBg,
          border: `1px solid ${theme.borderColor}`,
          borderRadius: '16px',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          position: 'relative',
          boxShadow: theme.boxShadow,
        }}
      >
        {/* Left Side: Badge & Deal Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div
            style={{
              background: theme.badgeBg,
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.5px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            }}
          >
            <span>{theme.badgeIcon}</span>
            <span>{badgeLabel}</span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h4
                style={{
                  fontSize: '15.5px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{title}</span>
              </h4>

              {isStorewide ? (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Tag size={11} />
                  <span>Valid Storewide on ALL Projects!</span>
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#818cf8',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}
                >
                  🎯 For: {saleData.targetProjectTitle || 'Selected Project'}
                </span>
              )}
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              {saleData.subtitle || 'Copy code below and paste at checkout for instant discount!'}
            </p>
          </div>
        </div>

        {/* Center: Live Ticking Countdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: theme.accentColor, fontSize: '12px', fontWeight: 700, marginRight: '4px' }}>
            <Clock size={14} />
            <span>Offer Ends:</span>
          </div>

          {/* Hours */}
          <div
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '4px 8px',
              textAlign: 'center',
              minWidth: '36px',
            }}
          >
            <span style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
              {timeLeft.hours}
            </span>
            <span style={{ fontSize: '9px', display: 'block', color: 'var(--text-muted)', textTransform: 'uppercase', lineHeight: 1 }}>
              hrs
            </span>
          </div>

          <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>:</span>

          {/* Minutes */}
          <div
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '4px 8px',
              textAlign: 'center',
              minWidth: '36px',
            }}
          >
            <span style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
              {timeLeft.minutes}
            </span>
            <span style={{ fontSize: '9px', display: 'block', color: 'var(--text-muted)', textTransform: 'uppercase', lineHeight: 1 }}>
              min
            </span>
          </div>

          <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>:</span>

          {/* Seconds */}
          <div
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '4px 8px',
              textAlign: 'center',
              minWidth: '36px',
            }}
          >
            <span style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'monospace', color: theme.accentColor }}>
              {timeLeft.seconds}
            </span>
            <span style={{ fontSize: '9px', display: 'block', color: 'var(--text-muted)', textTransform: 'uppercase', lineHeight: 1 }}>
              sec
            </span>
          </div>
        </div>

        {/* Right Side: Copy Coupon Code + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-primary)',
              border: `1.5px dashed ${copied ? '#10b981' : theme.accentColor}`,
              color: copied ? '#10b981' : 'var(--text-primary)',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
            title="Click to copy promo code"
          >
            {copied ? (
              <>
                <Check size={14} style={{ color: '#10b981' }} />
                <span>✓ Copied: {promoCode}</span>
              </>
            ) : (
              <>
                <Copy size={14} style={{ color: theme.accentColor }} />
                <span>Promo: <strong style={{ color: theme.accentColor, fontFamily: 'monospace' }}>{promoCode}</strong> ({discountPercent}% OFF)</span>
              </>
            )}
          </button>

          <Link
            to={saleData.targetProject && saleData.targetProject !== 'all' ? `/projects/${saleData.targetProject}` : '/projects'}
            className="btn btn-primary"
            style={{
              padding: '7px 14px',
              fontSize: '12.5px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap',
            }}
          >
            <span>{saleData.targetProject && saleData.targetProject !== 'all' ? 'View Deal' : 'Shop Store'}</span>
            <ArrowRight size={13} />
          </Link>

          <button
            onClick={() => setIsDismissed(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
            }}
            title="Dismiss banner"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashSaleBanner;
