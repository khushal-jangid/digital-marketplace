import React, { useState } from 'react';
import { ExternalLink, Bot, RefreshCw, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const AIAgent = () => {
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  const handleRefresh = () => {
    setLoading(true);
    setIframeKey(Date.now());
  };

  return (
    <div className="animate-fade-in" style={{ padding: '20px 16px 40px 16px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* Top Controls & Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '16px',
          padding: '14px 20px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 10px rgba(245, 158, 11, 0.3)',
              flexShrink: 0,
            }}
          >
            <Bot size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                IndianAgent
              </h1>
              <span
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                Multi-Tool AI Agent
              </span>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                Free • No Login Needed
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Web Research • Content Writing • Image Generation • PDF Export • Project Planning
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleRefresh}
            title="Reload Agent"
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            <RefreshCw size={14} />
            <span>Reload</span>
          </button>

          <a
            href="https://indianagent.lovable.app"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              color: '#ffffff',
            }}
          >
            <span>Open in Fullscreen</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Embedded Iframe Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 'calc(100vh - 190px)',
          minHeight: '680px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
        }}
      >
        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-secondary)',
              zIndex: 10,
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                border: '3px solid rgba(245, 158, 11, 0.2)',
                borderTop: '3px solid #f59e0b',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <span style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
              Connecting to IndianAgent AI...
            </span>
          </div>
        )}

        <iframe
          key={iframeKey}
          src="https://indianagent.lovable.app"
          title="IndianAgent — Multi-tool AI Agent"
          onLoad={() => setLoading(false)}
          allow="clipboard-write; camera; microphone"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
          }}
        />
      </div>
    </div>
  );
};

export default AIAgent;
