import React, { useState, useEffect } from 'react';
import { request } from '../utils/api';
import { Tag, Copy, Check, X } from 'lucide-react';

const CouponBanner = () => {
  const [activeCoupon, setActiveCoupon] = useState(null);
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchLatestCoupon = async () => {
      try {
        const data = await request('/coupons/latest-active', 'GET');
        if (data.success && data.coupon) {
          setActiveCoupon(data.coupon);
        }
      } catch (err) {
        // Silently ignore if no active coupon
      }
    };

    fetchLatestCoupon();
  }, []);

  const handleCopy = () => {
    if (!activeCoupon) return;
    navigator.clipboard.writeText(activeCoupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (dismissed || !activeCoupon || (activeCoupon.code && activeCoupon.code.toUpperCase().startsWith('FLASH'))) {
    return null;
  }

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, #4338ca 0%, #4f46e5 50%, #3730a3 100%)',
        color: '#ffffff',
        padding: '7px 16px',
        fontSize: '12.5px',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        position: 'relative',
        zIndex: 999,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
        <Tag size={14} style={{ color: '#a5b4fc', flexShrink: 0 }} />
        <span>
          Special Deal: Use promo code{' '}
          <strong
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '2px 7px',
              borderRadius: '4px',
              letterSpacing: '0.04em',
              fontFamily: 'monospace',
              fontSize: '13px',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            {activeCoupon.code}
          </strong>{' '}
          to get{' '}
          <strong style={{ color: '#fef08a' }}>
            {activeCoupon.discountValue}
            {activeCoupon.discountType === 'percentage' ? '%' : ' INR'} OFF
          </strong>{' '}
          at checkout!
        </span>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        style={{
          background: 'rgba(255, 255, 255, 0.18)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '5px',
          padding: '3px 10px',
          color: '#ffffff',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11.5px',
          fontWeight: 600,
          transition: 'background 0.2s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)')}
      >
        {copied ? (
          <>
            <Check size={12} style={{ color: '#86efac' }} /> Copied!
          </>
        ) : (
          <>
            <Copy size={12} /> Copy Code
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleDismiss}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.7)',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'absolute',
          right: '12px',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)')}
        title="Dismiss Notification"
        aria-label="Close Announcement"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default CouponBanner;
