import React from 'react';
import { Terminal, Sparkles } from 'lucide-react';

const Loader = ({ fullPage = false, message = 'Loading Marketplace Assets...' }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: fullPage ? '100vh' : '220px',
        width: '100%',
        flexDirection: 'column',
        gap: '20px',
        padding: '24px',
      }}
    >
      {/* Outer Glowing Orbital Ring */}
      <div
        style={{
          position: 'relative',
          width: '64px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Outer Rotating Gradient Ring */}
        <div
          className="loader-orbital-ring"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: '#4f46e5',
            borderRightColor: '#06b6d4',
            filter: 'drop-shadow(0 0 12px rgba(79, 70, 229, 0.5))',
          }}
        />

        {/* Counter-Rotating Inner Accent Ring */}
        <div
          className="loader-orbital-ring-reverse"
          style={{
            position: 'absolute',
            inset: '6px',
            borderRadius: '50%',
            border: '2px solid transparent',
            borderBottomColor: '#10b981',
            borderLeftColor: '#818cf8',
            opacity: 0.8,
          }}
        />

        {/* Center Glowing Developer Icon */}
        <div
          className="loader-center-pulse"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#818cf8',
            boxShadow: '0 0 16px rgba(79, 70, 229, 0.3)',
          }}
        >
          <Terminal size={17} strokeWidth={2.5} />
        </div>
      </div>

      {/* Shimmering Loading Text with Animated Dots */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13.5px',
          fontWeight: 600,
          color: 'var(--text-secondary, #94a3b8)',
          letterSpacing: '0.02em',
          fontFamily: 'var(--font-mono, monospace)',
        }}
      >
        <Sparkles size={14} style={{ color: '#06b6d4' }} className="loader-sparkle" />
        <span>{message}</span>
      </div>

      {/* Self-Contained Keyframe Animations */}
      <style>{`
        @keyframes loaderSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes loaderSpinReverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes loaderPulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.1); opacity: 1; filter: drop-shadow(0 0 8px rgba(79, 70, 229, 0.6)); }
        }
        @keyframes loaderSparkle {
          0%, 100% { opacity: 0.4; transform: rotate(0deg) scale(0.9); }
          50% { opacity: 1; transform: rotate(180deg) scale(1.15); }
        }

        .loader-orbital-ring {
          animation: loaderSpin 1s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite;
        }
        .loader-orbital-ring-reverse {
          animation: loaderSpinReverse 1.4s linear infinite;
        }
        .loader-center-pulse {
          animation: loaderPulse 1.8s ease-in-out infinite;
        }
        .loader-sparkle {
          animation: loaderSparkle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Loader;
