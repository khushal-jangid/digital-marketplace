import React, { useState } from 'react';
import { request } from '../utils/api';
import { Sparkles, Send, CheckCircle2, DollarSign, Layers, Mail, Phone, FileText } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const RequestProject = () => {
  const { formatPrice } = useCurrency();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('fullstack');
  const [techStack, setTechStack] = useState('');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await request('/project-requests', 'POST', {
        title,
        category,
        techStack,
        budget: Number(budget) || 0,
        description,
        email,
        phone,
      });

      if (data.success) {
        setSubmitted(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit project request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="container animate-fade-in" style={{ padding: '60px 24px', maxWidth: '640px', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '48px 32px' }}>
          <CheckCircle2 size={54} style={{ color: '#10b981', margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: '24px', color: 'var(--text-primary)', marginBottom: '12px' }}>
            Project Request Received!
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
            Thank you for submitting your custom project request. Khushal Jangid has been notified on Telegram and will review your specifications and contact you via email/phone shortly!
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setTitle('');
              setDescription('');
              setTechStack('');
              setBudget('');
              setEmail('');
              setPhone('');
            }}
            className="btn btn-primary"
            style={{ padding: '10px 24px', fontSize: '13.5px' }}
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '48px 24px 80px 24px', maxWidth: '780px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(99, 102, 241, 0.15)',
            color: '#818cf8',
            padding: '5px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '12px',
            border: '1px solid rgba(99, 102, 241, 0.25)',
          }}
        >
          <Sparkles size={14} /> Custom Development & Templates
        </div>
        <h1 style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
          Request a Custom Project
        </h1>
        <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto' }}>
          Can't find the exact source code or template you need? Tell Khushal what you're looking to build and receive a custom estimate.
        </p>
      </div>

      <div className="glass-card" style={{ padding: '36px' }}>
        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#f87171',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
              Project / Template Title *
            </label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g., Gym Management MERN Stack App or AI SaaS Landing Page"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Category
              </label>
              <select
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="fullstack">Full-Stack Web App</option>
                <option value="frontend">Frontend / React / Next.js</option>
                <option value="backend">Backend REST API</option>
                <option value="landing-page">Landing Page / UI Kit</option>
                <option value="mobile">Mobile App / Flutter</option>
                <option value="other">Other Custom Build</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Target Tech Stack
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., React, Node.js, MongoDB"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
              Estimated Budget (INR) *
            </label>
            <input
              type="number"
              required
              min="0"
              className="form-input"
              placeholder="e.g., 2000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
              Detailed Description & Key Features *
            </label>
            <textarea
              required
              rows="4"
              className="form-input"
              placeholder="Describe the pages, authentication requirements, database models, or any specific integrations needed..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Your Email Address *
              </label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Phone / WhatsApp Number (Optional)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              padding: '14px',
              fontSize: '15px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '10px',
            }}
          >
            {loading ? 'Submitting Request...' : (
              <>
                <Send size={16} /> Submit Project Request
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
};

export default RequestProject;
