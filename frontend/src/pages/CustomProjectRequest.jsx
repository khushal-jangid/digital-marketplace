import React, { useState, useEffect } from 'react';
import { request } from '../utils/api';
import {
  Code,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  QrCode,
  ArrowRight,
  Clock,
  DollarSign,
  Layers,
  MessageSquare,
  ShieldCheck,
  Loader2,
  Terminal,
} from 'lucide-react';

const CustomProjectRequest = () => {
  const [settings, setSettings] = useState({
    isEnabled: true,
    entryFee: 50,
    upiId: '7303354598@omni',
    upiName: 'Khushal Jangid',
    notice: '',
  });
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    category: 'Full-Stack Web App',
    techStack: '',
    targetBudget: '',
    payoutUpiId: '',
    referenceLinks: '',
    description: '',
    utrNumber: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Closed/Paused state - Request Early Access Form State
  const [accessEmail, setAccessEmail] = useState('');
  const [accessName, setAccessName] = useState('');
  const [accessPhone, setAccessPhone] = useState('');
  const [accessIdea, setAccessIdea] = useState('');
  const [accessSubmitting, setAccessSubmitting] = useState(false);
  const [accessSuccessMessage, setAccessSuccessMessage] = useState('');
  const [accessErrorMessage, setAccessErrorMessage] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await request('/custom-projects/settings', 'GET');
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Error loading custom project settings:', err.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleChange = (e) => {
    let val = e.target.value;
    if (e.target.name === 'utrNumber') {
      val = val.replace(/\D/g, '').slice(0, 12);
    }
    setFormData({ ...formData, [e.target.name]: val });
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(settings.upiId || '7303354598@omni');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleRequestAccessSubmit = async (e) => {
    e.preventDefault();
    setAccessErrorMessage('');
    setAccessSuccessMessage('');

    if (!accessEmail || !accessEmail.includes('@')) {
      setAccessErrorMessage('Please enter a valid email address.');
      return;
    }

    setAccessSubmitting(true);
    try {
      const data = await request('/custom-projects/request-access', 'POST', {
        email: accessEmail,
        name: accessName,
        phone: accessPhone,
        idea: accessIdea,
      });

      if (data.success) {
        setAccessSuccessMessage(data.message || 'Access request sent! Khushal Jangid has been notified.');
        setAccessEmail('');
        setAccessName('');
        setAccessPhone('');
        setAccessIdea('');
      }
    } catch (err) {
      setAccessErrorMessage(err.message || 'Failed to send access request. Please try again.');
    } finally {
      setAccessSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name || !formData.email || !formData.phone || !formData.title || !formData.description) {
      setErrorMessage('Please fill in all required fields (Name, Email, WhatsApp Phone, Project Title, and Scope Description).');
      return;
    }

    if (!formData.payoutUpiId || !formData.payoutUpiId.includes('@')) {
      setErrorMessage('Please provide your valid Payout UPI ID (in Section 2) so we can transfer money/payments into your account.');
      return;
    }

    const cleanUtr = (formData.utrNumber || '').trim();
    if (!cleanUtr || cleanUtr.length !== 12 || !/^\d{12}$/.test(cleanUtr)) {
      setErrorMessage('Please enter a valid numeric UPI UTR / Transaction reference number to proceed.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await request('/custom-projects/submit', 'POST', formData);
      if (data.success) {
        setSubmittedSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit custom project request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fee = settings.entryFee || 50;
  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    `upi://pay?pa=${settings.upiId || '7303354598@omni'}&pn=${encodeURIComponent(
      settings.upiName || 'Khushal Jangid'
    )}&am=${fee}&cu=INR&tn=Custom_Project_Entry_Fee`
  )}`;

  if (settingsLoading) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)', margin: '0 auto' }} />
        <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>Loading Custom Project Studio...</p>
      </div>
    );
  }

  if (!settings.isEnabled) {
    return (
      <div className="container animate-fade-in" style={{ padding: '60px 20px', maxWidth: '720px', margin: '0 auto' }}>
        <div className="glass-card" style={{ padding: '36px 28px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                width: '58px',
                height: '58px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <Clock size={30} />
            </div>
            <h2 style={{ fontSize: '24px', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Custom Project Submissions Temporarily Paused
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', lineHeight: 1.5, maxWidth: '580px', margin: '0 auto' }}>
              {settings.notice ||
                'We are currently at full capacity handling client deliverables. However, you can request priority access by providing your email below.'}
            </p>
          </div>

          {/* Interactive Request Access Box */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '12px',
              padding: '20px 18px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#818cf8', fontWeight: 700, fontSize: '14.5px' }}>
              <Send size={16} />
              <span>Request Priority Access</span>
            </div>

            {accessSuccessMessage ? (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#10b981',
                  padding: '16px',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  lineHeight: 1.5,
                  textAlign: 'center',
                }}
              >
                <CheckCircle2 size={22} style={{ margin: '0 auto 6px auto' }} />
                <strong>{accessSuccessMessage}</strong>
                <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Khushal will reach out to you on WhatsApp / Email to discuss opening your submission slot.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestAccessSubmit}>
                {accessErrorMessage && (
                  <div style={{ color: '#f43f5e', fontSize: '12.5px', marginBottom: '10px' }}>
                    {accessErrorMessage}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                      Your Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="you@domain.com"
                      value={accessEmail}
                      onChange={(e) => setAccessEmail(e.target.value)}
                      className="form-input"
                      style={{ padding: '8px 12px', fontSize: '13.5px' }}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                      Your Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul"
                      value={accessName}
                      onChange={(e) => setAccessName(e.target.value)}
                      className="form-input"
                      style={{ padding: '8px 12px', fontSize: '13.5px' }}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                      WhatsApp / Phone
                    </label>
                    <input
                      type="text"
                      placeholder="+91 9876543210"
                      value={accessPhone}
                      onChange={(e) => setAccessPhone(e.target.value)}
                      className="form-input"
                      style={{ padding: '8px 12px', fontSize: '13.5px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                    Brief Project Concept / Idea
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Need an AI SaaS built with Next.js & Stripe"
                    value={accessIdea}
                    onChange={(e) => setAccessIdea(e.target.value)}
                    className="form-input"
                    style={{ padding: '8px 12px', fontSize: '13.5px' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={accessSubmitting}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                >
                  {accessSubmitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Sending Request...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Request Priority Access</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div style={{ textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
            For direct developer inquiries, contact Khushal: <code style={{ color: 'var(--primary)' }}>7303354598@omni</code>
          </div>

        </div>
      </div>
    );
  }

  if (submittedSuccess) {
    return (
      <div className="container animate-fade-in" style={{ padding: '60px 20px', maxWidth: '680px', margin: '0 auto' }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
            }}
          >
            <CheckCircle2 size={36} />
          </div>
          <h2 style={{ fontSize: '26px', color: 'var(--text-primary)', marginBottom: '10px' }}>
            Custom Project Request Received!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15.5px', lineHeight: 1.6, marginBottom: '24px' }}>
            Your requirements and <strong>₹{fee} Entry Fee</strong> (UTR: <code>{formData.utrNumber}</code>) have been securely logged. Instant <strong>Telegram & Email alerts</strong> have been dispatched to Khushal Jangid.
          </p>

          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '20px',
              textAlign: 'left',
              marginBottom: '28px',
              fontSize: '13.5px',
            }}
          >
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '10px', fontSize: '14.5px' }}>
              ⚡ What happens next?
            </h4>
            <ul style={{ color: 'var(--text-secondary)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', margin: 0 }}>
              <li>Khushal will personally review your architecture scope, tech stack, and proposed budget.</li>
              <li>You will receive a WhatsApp message / Call at <strong>{formData.phone}</strong> within <strong>2 to 4 hours</strong>.</li>
              <li>A formal development milestone contract and delivery timeline will be finalized.</li>
            </ul>
          </div>

          <button
            onClick={() => {
              setSubmittedSuccess(false);
              setFormData({
                name: '',
                email: '',
                phone: '',
                title: '',
                category: 'Full-Stack Web App',
                techStack: '',
                targetBudget: '',
                deadline: '2 Weeks',
                referenceLinks: '',
                description: '',
                utrNumber: '',
              });
            }}
            className="btn btn-primary"
            style={{ padding: '12px 28px', fontSize: '14.5px' }}
          >
            Submit Another Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '40px 20px 80px 20px', maxWidth: '840px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(79, 70, 229, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#818cf8',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '12.5px',
            fontWeight: 700,
            marginBottom: '14px',
          }}
        >
          <Sparkles size={15} />
          <span>BESPOKE SOFTWARE DEVELOPMENT & ARCHITECTURE</span>
        </div>

        <h1 style={{ fontSize: 'clamp(26px, 4vw, 36px)', color: 'var(--text-primary)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>
          Commission a Custom Project
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '15.5px', lineHeight: 1.6, maxWidth: '640px', margin: '0 auto' }}>
          Have a unique idea, AI SaaS, Web App, or need custom modifications? Submit your specifications below to hire <strong>Khushal Jangid</strong> for end-to-end development.
        </p>
      </div>

      {/* Main Submission Form Card */}
      <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '32px' }}>
        
        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#f43f5e',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '13.5px',
            }}
          >
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Section 1: Client Contact Information */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: 'var(--primary)', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>1</span>
            <span>Your Contact Details</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Rahul Sharma"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="rahul@domain.com"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                WhatsApp / Phone Number *
              </label>
              <input
                type="text"
                name="phone"
                required
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Technical Project Specifications */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: 'var(--primary)', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>2</span>
            <span>Project Scope & Budget</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Project Title / Concept Name *
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. AI-Powered Medical Diagnosis SaaS"
                value={formData.title}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Category
              </label>
              <select name="category" value={formData.category} onChange={handleChange} className="form-input" style={{ cursor: 'pointer' }}>
                <option value="Full-Stack Web App">Full-Stack Web App (React / Next.js)</option>
                <option value="AI / LLM SaaS App">AI / LLM SaaS Solution</option>
                <option value="Mobile App">Mobile App (Flutter / React Native)</option>
                <option value="Backend API / Cloud Architecture">Backend API & Cloud Architecture</option>
                <option value="Chrome Extension / Automation Bot">Chrome Extension & Automation Bot</option>
                <option value="E-Commerce & Marketplace">Custom E-Commerce / Marketplace</option>
                <option value="Other">Other Custom Development</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Preferred Tech Stack
              </label>
              <input
                type="text"
                name="techStack"
                placeholder="e.g. Next.js, Node.js, Python, PostgreSQL"
                value={formData.techStack}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Target Project Budget (INR)
              </label>
              <input
                type="number"
                name="targetBudget"
                placeholder="e.g. 15000"
                value={formData.targetBudget}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          {/* Payout UPI ID Input in Section 2 */}
          <div style={{ marginBottom: '16px', background: 'rgba(79, 70, 229, 0.08)', border: '1px solid rgba(99, 102, 241, 0.35)', padding: '16px', borderRadius: '8px' }}>
            <label className="form-label" style={{ fontSize: '13.5px', fontWeight: 700, display: 'block', marginBottom: '6px', color: 'var(--text-primary)' }}>
              💰 Your Payout UPI ID (Paise Receive Karne Ke Liye) *
            </label>
            <input
              type="text"
              name="payoutUpiId"
              required
              placeholder="e.g. yourname@oksbi or 9876543210@paytm"
              value={formData.payoutUpiId}
              onChange={handleChange}
              className="form-input"
              style={{
                fontWeight: 700,
                borderColor: 'rgba(99, 102, 241, 0.6)',
                background: 'var(--bg-primary)',
              }}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '6px' }}>
              💡 Is UPI ID par aapke project earnings / milestone payouts ka paisa direct aapke bank account mein transfer kiya jayega.
            </span>
          </div>

          {/* Project Files, Google Drive ZIP, GitHub Link */}
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px', color: 'var(--text-primary)' }}>
              📁 Project Files & Links (Google Drive ZIP / GitHub / Figma / Live Demo)
            </label>
            <input
              type="text"
              name="referenceLinks"
              placeholder="e.g. Google Drive Link (ZIP File), GitHub Repo Link, Figma URL, or Live Demo"
              value={formData.referenceLinks}
              onChange={handleChange}
              className="form-input"
              style={{ borderColor: 'rgba(99, 102, 241, 0.4)' }}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
              💡 Yahan aap apni Project ZIP file ka Google Drive link, GitHub repository, ya Figma UI design link daal sakte hain.
            </span>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Detailed Requirements Description *
            </label>
            <textarea
              name="description"
              required
              rows={5}
              placeholder="Describe your user flow, required features, database entities, third-party APIs, and any specific goals..."
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Section 3: ₹50 Entry / Processing Fee Section */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: '#10b981', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>3</span>
            <span>Submission & Verification Entry Fee (₹{fee})</span>
          </h3>

          <div
            style={{
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* QR Code */}
              <div
                style={{
                  background: '#ffffff',
                  padding: '10px',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  textAlign: 'center',
                }}
              >
                <img
                  src={upiQrUrl}
                  alt="UPI QR Code for ₹50"
                  style={{ width: '140px', height: '140px', display: 'block', borderRadius: '6px' }}
                />
                <span style={{ fontSize: '11px', color: '#0f172a', fontWeight: 800, marginTop: '4px', display: 'block' }}>
                  Scan & Pay ₹{fee}
                </span>
              </div>

              {/* Payment Details */}
              <div style={{ flexGrow: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 800, fontSize: '14px', marginBottom: '4px' }}>
                  <ShieldCheck size={18} />
                  <span>Official Verified Developer UPI</span>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
                  Scan QR with <strong>Google Pay, PhonePe, Paytm, CRED or any UPI App</strong> to pay the nominal <strong>₹{fee} requirements processing fee</strong>.
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    maxWidth: '320px',
                    marginBottom: '14px',
                  }}
                >
                  <code style={{ fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: 700, flexGrow: 1 }}>
                    {settings.upiId || '7303354598@omni'}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: copiedUpi ? '#10b981' : 'var(--primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {copiedUpi ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* UTR Input Box */}
                <div>
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>
                    Enter UPI UTR / Transaction Reference Number *
                  </label>
                  <input
                    type="text"
                    name="utrNumber"
                    required
                    maxLength={12}
                    inputMode="numeric"
                    placeholder="Enter UTR / Ref No..."
                    value={formData.utrNumber}
                    onChange={handleChange}
                    className="form-input"
                    style={{
                      maxWidth: '320px',
                      letterSpacing: '1.5px',
                      fontWeight: 700,
                      borderColor: formData.utrNumber?.length === 12 ? '#10b981' : 'rgba(16, 185, 129, 0.5)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit CTA Button */}
        <button
          type="submit"
          disabled={submitting || !formData.utrNumber || formData.utrNumber.trim().length !== 12}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '15.5px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: (!formData.utrNumber || formData.utrNumber.trim().length !== 12) ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
            color: (!formData.utrNumber || formData.utrNumber.trim().length !== 12) ? 'var(--text-muted)' : '#ffffff',
            border: 'none',
            boxShadow: (!formData.utrNumber || formData.utrNumber.trim().length !== 12) ? 'none' : '0 4px 20px rgba(79, 70, 229, 0.4)',
            cursor: (!formData.utrNumber || formData.utrNumber.trim().length !== 12) ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Submitting & Notifying Khushal...</span>
            </>
          ) : (
            <>
              <Send size={18} />
              <span>Submit Custom Project Requirements (₹{fee})</span>
            </>
          )}
        </button>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', marginTop: '12px' }}>
          🔒 Your contact details and project IP are 100% confidential and protected by NDA.
        </p>
      </form>
    </div>
  );
};

export default CustomProjectRequest;
