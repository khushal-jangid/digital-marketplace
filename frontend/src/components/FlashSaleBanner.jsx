import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Copy, Check, ArrowRight, X, Flame } from 'lucide-react';
import { request } from '../utils/api';

const FlashSaleBanner = () => {
  const [saleData, setSaleData] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00' });
  const [copied, setCopied] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // Fetch active flash sale configuration from server
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
  const title = saleData.title || `Get Flat ${discountPercent}% OFF on all Full-Stack & Developer Templates!`;

  const handleCopy = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
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
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.18) 0%, rgba(244, 63, 94, 0.15) 50%, rgba(245, 158, 11, 0.15) 100%)',
          border: '1px solid rgba(244, 63, 94, 0.35)',
          borderRadius: '16px',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          position: 'relative',
          boxShadow: '0 10px 25px -5px rgba(244, 63, 94, 0.12)',
        }}
      >
        {/* Left Side: Badge & Deal Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #f43f5e 0%, #ea580c 100%)',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.5px',
              boxShadow: '0 4px 12px rgba(244, 63, 94, 0.35)',
            }}
          >
            <Flame size={15} />
            <span>FLASH DEAL</span>
          </div>

          <div>
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
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              {saleData.subtitle || 'Use coupon code at checkout for instant discount across the entire catalog.'}
            </p>
          </div>
        </div>

        {/* Center: Live Ticking Countdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f43f5e', fontSize: '12px', fontWeight: 600, marginRight: '4px' }}>
            <Clock size={14} />
            <span>Ends In:</span>
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
            <span style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'monospace', color: '#f43f5e' }}>
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
              background: 'var(--bg-primary)',
              border: '1px dashed #f43f5e',
              color: 'var(--text-primary)',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              fontFamily: 'monospace',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
            title="Click to copy coupon code"
          >
            <span style={{ color: '#f43f5e' }}>{promoCode}</span>
            {copied ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} style={{ color: 'var(--text-muted)' }} />}
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
            <span>{saleData.targetProject && saleData.targetProject !== 'all' ? 'View Deal' : 'Shop Deals'}</span>
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
