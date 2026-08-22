import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { request } from '../utils/api';
import { ShoppingCart, Trash2, Tag, Percent, ArrowRight, ShieldCheck, QrCode, Copy, Check } from 'lucide-react';

// Configure your personal UPI ID here
const MERCHANT_UPI_ID = '7303354598@omni';

const Cart = () => {
  const { user, loadProfile } = useAuth();
  const { formatPrice } = useCurrency();
  const {
    cartItems,
    removeFromCart,
    updateLicense,
    getItemEffectivePrice,
    clearCart,
    coupon,
    discount,
    subtotal,
    total,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const activeUpiId = MERCHANT_UPI_ID;

  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState('');
  const [couponError, setCouponError] = useState('');

  // QR Code direct payment states
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [qrSubmitLoading, setQrSubmitLoading] = useState(false);
  const [utrError, setUtrError] = useState('');

  const navigate = useNavigate();

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(activeUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Prefill email when user changes or modal opens
  useEffect(() => {
    if (user?.email) {
      setContactEmail(user.email);
    }
  }, [user, showQrModal]);

  const handleApplyCouponSubmit = async (e) => {
    e.preventDefault();
    setCouponMsg('');
    setCouponError('');
    if (!couponCode) return;

    try {
      const data = await applyCoupon(couponCode);
      if (data.success) {
        setCouponMsg(data.message);
        setCouponCode('');
      }
    } catch (err) {
      setCouponError(err.message || 'Invalid coupon code');
    }
  };

  const handleCheckout = () => {
    setShowQrModal(true);
  };

  const handleAbandonedLeadSave = async (emailVal, phoneVal) => {
    const emailToUse = emailVal !== undefined ? emailVal : contactEmail;
    const phoneToUse = phoneVal !== undefined ? phoneVal : contactPhone;

    if (!emailToUse || !emailToUse.includes('@') || !phoneToUse || phoneToUse.trim().length < 10) {
      return;
    }

    try {
      await request('/orders/abandoned-lead', 'POST', {
        email: emailToUse.trim(),
        phone: phoneToUse.trim(),
        items: cartItems,
        totalAmount: total,
      });
    } catch (err) {
      console.warn('Failed to save abandoned lead:', err.message);
    }
  };

  const handleQrSubmit = async (e) => {
    e.preventDefault();
    setUtrError('');

    if (!contactEmail || !contactEmail.includes('@')) {
      setUtrError('Please enter a valid email address.');
      return;
    }
    if (!contactPhone || contactPhone.trim().length < 10) {
      setUtrError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (!utrNumber || utrNumber.trim().length !== 12 || isNaN(utrNumber)) {
      setUtrError('Please enter a valid 12-digit numeric UTR/Reference Number.');
      return;
    }

    setQrSubmitLoading(true);
    try {
      const projectIds = cartItems.map((item) => item._id);
      const refCode = localStorage.getItem('apex_ref');
      const data = await request('/orders/qr-checkout', 'POST', {
        projectIds,
        couponCode: coupon?.code,
        transactionRef: utrNumber.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        referredByCode: refCode || null,
      });

      if (data.success) {
        if (data.token) {
          localStorage.setItem('token', data.token);
          if (loadProfile) {
            await loadProfile();
          }
        }
        clearCart();
        alert('UTR Submitted Successfully! Once verified by Admin, your download access will be unlocked.');
        setShowQrModal(false);
        navigate('/dashboard');
      }
    } catch (error) {
      setUtrError(error.message || 'Verification submission failed');
    } finally {
      setQrSubmitLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container animate-fade-in" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{
          background: 'var(--bg-tertiary)',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          marginBottom: '20px'
        }}>
          <ShoppingCart size={30} />
        </div>
        <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Your Cart is Empty</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Browse our projects directory to find code resources.</p>
        <Link to="/projects" className="btn btn-primary">Browse Marketplace</Link>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '40px 24px 80px 24px' }}>
      <h2 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '32px' }}>Shopping Cart</h2>

      <div className="responsive-two-col" style={{
        alignItems: 'flex-start'
      }}>
        
        {/* Left Side: Items list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {cartItems.map((item) => {
            const itemPrice = getItemEffectivePrice(item);
            return (
              <div key={item._id} className="glass-card cart-item-card" style={{
                display: 'flex',
                gap: '20px',
                alignItems: 'center',
                padding: '16px 20px',
                borderRadius: '12px'
              }}>
                <img
                  src={item.previewUrls?.[0] || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&q=80'}
                  alt={item.title}
                  style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)' }}
                />
                
                <div style={{ flexGrow: 1 }}>
                  <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '6px' }}>{item.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="badge badge-primary">{item.category}</span>
                    <select
                      value={item.licenseType || 'personal'}
                      onChange={(e) => updateLicense(item._id, e.target.value)}
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '4px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border)',
                        color: item.licenseType === 'commercial' ? '#10b981' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="personal">Personal License</option>
                      <option value="commercial">Commercial License (2.2x)</option>
                    </select>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: '16px', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                    {formatPrice(itemPrice)}
                  </strong>
                  <button
                    onClick={() => removeFromCart(item._id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--error)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px'
                    }}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Billing details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ borderRadius: '16px' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
              Order Summary
            </h3>

            {/* Price lines */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                  <span>Coupon Discount {coupon && `(${coupon.code})`}</span>
                  <span>- {formatPrice(discount)}</span>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <span>Total Amount</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {/* Promo coupon input */}
            <form onSubmit={handleApplyCouponSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Enter Promo Code..."
                className="form-input"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '13px' }}
              />
              <button type="submit" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                Apply
              </button>
            </form>

            {couponMsg && <div style={{ color: 'var(--success)', fontSize: '12px', marginBottom: '14px', fontWeight: 600 }}>{couponMsg}</div>}
            {couponError && <div style={{ color: 'var(--error)', fontSize: '12px', marginBottom: '14px', fontWeight: 600 }}>{couponError}</div>}
            
            {coupon && (
              <button
                onClick={removeCoupon}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginBottom: '20px'
                }}
              >
                Remove applied coupon
              </button>
            )}

            {/* Payment Method Info */}
            <div style={{
              borderTop: '1px solid var(--border)',
              paddingTop: '20px',
              marginBottom: '20px'
            }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Payment Method</span>
              <strong style={{ fontSize: '14px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <QrCode size={16} /> Direct UPI Scan (Manual Verification)
              </strong>
            </div>

            {/* Pay Button */}
            <button
              onClick={handleCheckout}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '15px' }}
            >
              Scan QR & Pay <QrCode size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)', justifyContent: 'center' }}>
            <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
            <span>Every order is checked by hand before your download unlocks.</span>
          </div>
        </div>

      </div>

      {/* Manual UPI QR Code Modal Overlay */}
      {showQrModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card receipt-edge animate-fade-in" style={{
            maxWidth: '430px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            borderRadius: '10px',
            padding: '24px',
            textAlign: 'center',
            border: '1px solid var(--border-hover)',
            background: 'var(--bg-secondary)',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative',
          }}>
            {/* Header with Close */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)', fontWeight: 600 }}>
                  Order Slip
                </span>
                <h3 style={{ fontSize: '19px', color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>
                  Scan &amp; Pay
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
              >
                ✕
              </button>
            </div>

            {/* QR Card Frame */}
            <div
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '20px 16px 16px 16px',
                marginBottom: '20px',
                position: 'relative',
              }}
            >
              {/* Top Badges inside card */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', padding: '0 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--success)', fontWeight: 600 }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }}></span>
                  <span>UPI</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', background: 'var(--primary-light)', color: 'var(--primary)', padding: '3px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, border: '1px solid var(--border)' }}>
                  INR {total}
                </div>
              </div>

              {/* QR Code Canvas Frame with Modern Corner Brackets */}
              <div
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  background: '#ffffff',
                  padding: '12px',
                  borderRadius: '16px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                }}
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    `upi://pay?pa=${activeUpiId}&am=${total}&cu=INR&tn=ApexMarket_Order`
                  )}&margin=6`}
                  alt="UPI Payment QR Code"
                  style={{
                    display: 'block',
                    width: '185px',
                    height: '185px',
                    borderRadius: '8px',
                  }}
                />
              </div>

              {/* UPI ID Copy Bar */}
              <div
                onClick={handleCopyUpi}
                style={{
                  marginTop: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s ease',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
                title="Click to copy UPI ID"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>UPI:</span>
                  <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 600, fontSize: '13px' }}>{activeUpiId}</code>
                </div>
                {copiedUpi ? (
                  <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11.5px', fontWeight: 600 }}>
                    <Check size={13} /> Copied!
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11.5px' }}>
                    <Copy size={13} /> Copy
                  </span>
                )}
              </div>

              {/* Supported Apps Badges */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-elevated)' }}>PhonePe</span>
                <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-elevated)' }}>Google Pay</span>
                <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-elevated)' }}>Paytm</span>
                <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-elevated)' }}>BHIM</span>
              </div>
            </div>

            {/* Mobile Direct Pay Button */}
            <div style={{ marginBottom: '20px' }}>
              <a
                href={`upi://pay?pa=${activeUpiId}&am=${total}&cu=INR&tn=ApexMarket_Order`}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  width: '100%',
                  justifyContent: 'center',
                }}
              >
                Pay directly in a UPI app
              </a>
            </div>

            {/* UTR Input Form */}
            <form onSubmit={handleQrSubmit}>
              <div style={{ textAlign: 'left', marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                  Verification Email Address
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter email for delivery (e.g. name@mail.com)"
                  value={contactEmail}
                  onChange={(e) => {
                    setContactEmail(e.target.value);
                    setUtrError('');
                  }}
                  onBlur={(e) => handleAbandonedLeadSave(e.target.value, undefined)}
                  required
                />
              </div>

              <div style={{ textAlign: 'left', marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="Enter 10-digit phone number..."
                  value={contactPhone}
                  onChange={(e) => {
                    setContactPhone(e.target.value);
                    setUtrError('');
                  }}
                  onBlur={(e) => handleAbandonedLeadSave(undefined, e.target.value)}
                  required
                />
              </div>

              <div style={{ textAlign: 'left', marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                  12-Digit UPI Ref No. / UTR Number
                </label>
                <input
                  type="text"
                  maxLength="12"
                  className="form-input"
                  placeholder="Enter 12-digit transaction UTR number..."
                  value={utrNumber}
                  onChange={(e) => {
                    setUtrNumber(e.target.value);
                    setUtrError('');
                  }}
                  required
                />
                {utrError && <span style={{ color: 'var(--error)', fontSize: '11px', marginTop: '4px', display: 'block', fontWeight: 600 }}>{utrError}</span>}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowQrModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={qrSubmitLoading}>
                  {qrSubmitLoading ? 'Submitting...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
